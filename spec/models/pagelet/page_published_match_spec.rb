# frozen_string_literal: true

RSpec.describe Pagelet::Page, ".published_match" do
  let(:site) { Site.create!(name: "Ours") }

  def published(path, text, subpaths: false)
    Pagelet::Page.create!(owner: site, path: path, title: text, matches_subpaths: subpaths,
                          draft_document: page_document(text)).tap(&:publish!)
  end

  def text_at(path)
    match = described_class.published_match(site, path)
    match && [match.document.dig("data", "content", 0, "props", "text"), match.page_path, match.rest]
  end

  it "serves a path below a page that matches sub-paths, with the remainder" do
    published("/messages", "Archive", subpaths: true)
    expect(text_at("/messages/43")).to eq(["Archive", "/messages", "43"])
    expect(text_at("/messages/2026/easter")).to eq(["Archive", "/messages", "2026/easter"])
  end

  it "does not serve sub-paths of a page that did not opt in" do
    published("/mission", "Mission")
    expect(text_at("/mission/extra")).to be_nil
  end

  it "prefers an exact page, then the longest matching prefix" do
    published("/messages", "Archive", subpaths: true)
    published("/messages/special", "Special page")
    published("/messages/series", "Series index", subpaths: true)
    expect(text_at("/messages/special")).to eq(["Special page", "/messages/special", ""])
    expect(text_at("/messages/series/advent")).to eq(["Series index", "/messages/series", "advent"])
    expect(text_at("/messages/99")).to eq(["Archive", "/messages", "99"])
  end

  it "does not treat a shared name as a prefix" do
    published("/messages", "Archive", subpaths: true)
    expect(text_at("/messages-old")).to be_nil
  end

  it "ignores unpublished pages and other owners' pages" do
    described_class.create!(owner: site, path: "/drafty", title: "Draft", matches_subpaths: true,
                            draft_document: page_document("x"))
    other = Site.create!(name: "Theirs")
    described_class.create!(owner: other, path: "/theirs", title: "T", matches_subpaths: true,
                            draft_document: page_document("theirs")).publish!
    expect(text_at("/drafty/1")).to be_nil
    expect(text_at("/theirs/1")).to be_nil
  end
end
