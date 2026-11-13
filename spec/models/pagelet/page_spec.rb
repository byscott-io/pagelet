# frozen_string_literal: true

RSpec.describe Pagelet::Page do
  let(:site) { Site.create!(name: "First") }
  let(:other_site) { Site.create!(name: "Second") }

  def make(attrs = {})
    described_class.create!({ owner: site, path: "/about", title: "About" }.merge(attrs))
  end

  describe "paths" do
    it "normalizes case, a missing leading slash and a trailing slash" do
      expect(make(path: "About/Staff/").path).to eq("/about/staff")
    end

    it "keeps the home page as /" do
      expect(make(path: "/").path).to eq("/")
    end

    it "refuses paths a link could not reach cleanly" do
      %w[/about%20us /a_b /a//b /../etc].each do |path|
        expect(described_class.new(owner: site, path: path, title: "x")).not_to be_valid, path
      end
    end

    it "is unique within one owner but free across owners" do
      make
      expect { make }.to raise_error(ActiveRecord::RecordInvalid, /Path has already been taken/)
      expect(make(owner: other_site)).to be_persisted
    end
  end

  describe "the draft document" do
    it "starts as an empty page" do
      expect(make.draft_document).to eq(Pagelet.empty_document)
    end

    it "refuses a document from a newer pagelet" do
      page = described_class.new(owner: site, path: "/x", title: "x", draft_document: { "pagelet" => 2, "data" => {} })
      expect(page).not_to be_valid
      expect(page.errors[:draft_document].join).to include("newer pagelet")
    end

    it "refuses something that is not a page document" do
      page = described_class.new(owner: site, path: "/x", title: "x", draft_document: { "html" => "<p>hi</p>" })
      expect(page).not_to be_valid
    end

    it "refuses an oversized document" do
      Pagelet.config.max_document_bytes = 200
      page = described_class.new(owner: site, path: "/x", title: "x", draft_document: page_document("x" * 500))
      expect(page).not_to be_valid
      expect(page.errors[:draft_document].join).to include("too large")
    ensure
      Pagelet.config.max_document_bytes = 1_000_000
    end
  end

  describe "publishing" do
    it "numbers each publish and makes it the live version" do
      page = make(draft_document: page_document("One"))
      first = page.publish!
      page.update!(draft_document: page_document("Two"))
      second = page.publish!(published_by: "editor@example.com")

      expect([first.number, second.number]).to eq([1, 2])
      expect(page.reload.published_version).to eq(second)
      expect(second.published_by).to eq("editor@example.com")
    end

    it "serves only the published version, never the draft" do
      page = make(draft_document: page_document("Live"))
      page.publish!
      page.update!(draft_document: page_document("Unfinished draft"))

      document = described_class.published_document(site, "/about")
      expect(document.dig("data", "content", 0, "props", "text")).to eq("Live")
    end

    it "serves nothing for a page that was never published" do
      make
      expect(described_class.published_document(site, "/about")).to be_nil
    end

    it "serves nothing from another owner's pages" do
      make.publish!
      expect(described_class.published_document(other_site, "/about")).to be_nil
    end

    it "never lets a published version be edited" do
      version = make.publish!
      expect { version.update!(published_by: "someone else") }.to raise_error(ActiveRecord::ReadOnlyRecord)
    end
  end

  describe "rollback" do
    it "copies an old version into the draft without touching what is live" do
      page = make(draft_document: page_document("Version one"))
      one = page.publish!
      page.update!(draft_document: page_document("Version two"))
      two = page.publish!

      page.restore!(one)
      expect(page.reload.draft_document.dig("data", "content", 0, "props", "text")).to eq("Version one")
      expect(page.published_version).to eq(two)
    end

    it "refuses a version from a different page" do
      foreign = make(path: "/other").publish!
      expect { make.restore!(foreign) }.to raise_error(ArgumentError)
    end
  end

  it "lists published pages for a sitemap, in path order" do
    make(path: "/zeta").publish!
    make(path: "/alpha").publish!
    make(path: "/draft-only")
    expect(described_class.sitemap_entries(site).pluck(:path)).to eq(%w[/alpha /zeta])
  end
end
