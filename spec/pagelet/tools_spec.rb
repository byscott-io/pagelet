# frozen_string_literal: true

require "rails_helper"

RSpec.describe Pagelet::Tools do
  let(:site) { Site.create!(name: "Ours") }
  let(:catalog) { Pagelet::Catalog.new(JSON.parse(Rails.root.join("../fixtures/catalog.json").read)) }
  let(:role) { :publisher }
  let(:context) do
    Pagelet::Tools::Context.new(owner: site, catalog: catalog,
                                can: ->(action, _page) { role == :publisher || (role == :editor && action == :edit) },
                                preview_url: ->(page) { "https://example.org/preview/#{page.id}" })
  end

  def run(tool, arguments = {}) = tool.new(context).run(arguments)

  def heading(text) = { "type" => "Heading", "props" => { "text" => text } }

  def page_with(text, path: "/visit")
    data = { "root" => { "props" => {} }, "content" => [heading(text).deep_merge("props" => { "id" => "h" })] }
    Pagelet::Page.create!(owner: site, path: path, title: "Visit", draft_document: { "pagelet" => 1, "data" => data })
  end

  describe "the catalog" do
    it "fills in what the model may leave out: block ids and default settings, nested blocks too" do
      doc, problems = catalog.prepare("pagelet" => 1, "data" => { "content" => [
                                        { "type" => "Section", "props" => { "content" => [heading("Inside")] } }
                                      ] })
      section = doc.dig("data", "content", 0, "props")
      expect(problems).to be_empty
      expect(section["id"]).to start_with("Section-")
      expect(section["padding"]).to eq("medium")
      expect(section.dig("content", 0, "props")).to include("text" => "Inside", "level" => "h2", "align" => "left")
    end

    it "lists every problem: unknown blocks and fields, wrong choices and numbers, nested ones included" do
      _doc, problems = catalog.prepare("pagelet" => 1, "data" => { "content" => [
                                         { "type" => "Marquee", "props" => {} },
                                         { "type" => "Heading",
                                           "props" => { "text" => "x", "colour" => "red", "align" => "middle" } },
                                         { "type" => "Embed", "props" => { "height" => 50 } },
                                         { "type" => "Columns", "props" => { "first" => [{ "type" => "Nope" }] } }
                                       ] })
      expect(problems.join("\n")).to include('unknown block type "Marquee"', "unknown field(s) colour",
                                             "align must be one of", "height must be at least 200",
                                             'unknown block type "Nope"')
    end
  end

  describe "editing drafts" do
    it "creates a page as a draft, filled in, with a preview link" do
      result = run(Pagelet::Tools::CreatePage, path: "/visit", title: "Visit",
                                               document: { content: [heading("Welcome")] })
      page = Pagelet::Page.find(result["id"])
      expect(result).to include("published" => false, "preview_url" => "https://example.org/preview/#{page.id}")
      expect(page.draft_document.dig("data", "content", 0, "props")).to include("text" => "Welcome", "level" => "h2")
    end

    it "saves nothing when the document does not fit the catalog, and says why" do
      result = run(Pagelet::Tools::CreatePage, path: "/visit", title: "Visit",
                                               document: { content: [{ type: "Marquee" }] })
      expect(result["error"]).to include('unknown block type "Marquee"')
      expect(Pagelet::Page.count).to eq(0)
    end

    it "does not move a published page, which would change the live site unconfirmed" do
      page = page_with("Hi").tap(&:publish!)
      result = run(Pagelet::Tools::UpdatePage, page_id: page.id, path: "/elsewhere")
      expect(result["error"]).to include("unpublish it first")
      expect(page.reload.path).to eq("/visit")
    end

    it "refuses someone who may not edit" do
      context = Pagelet::Tools::Context.new(owner: site, catalog: catalog, can: ->(*) { false })
      expect(Pagelet::Tools::ListPages.new(context).run({})["error"]).to eq("You may not edit pages.")
    end

    it "treats another owner's page as not found" do
      theirs = Pagelet::Page.create!(owner: Site.create!(name: "Theirs"), path: "/x", title: "X",
                                     draft_document: Pagelet.empty_document)
      expect(run(Pagelet::Tools::GetPage, page_id: theirs.id)["error"]).to eq("No such page.")
    end
  end

  describe "changes that go live need a confirmation" do
    let(:page) { page_with("Hi") }

    it "changes nothing on the first call, and publishes with the code it returned" do
      first = run(Pagelet::Tools::PublishPage, page_id: page.id)
      expect(first).to include("needs_confirmation" => true)
      expect(page.reload).not_to be_published

      second = run(Pagelet::Tools::PublishPage, page_id: page.id, confirmation: first["confirmation"])
      expect(second).to include("published" => true, "published_version" => 1)
    end

    it "refuses a code for a different draft than the one described" do
      code = run(Pagelet::Tools::PublishPage, page_id: page.id)["confirmation"]
      page.update!(draft_document: page.draft_document.deep_merge("data" => { "content" => [] }))

      result = run(Pagelet::Tools::PublishPage, page_id: page.id, confirmation: code)
      expect(result["error"]).to include("different change")
      expect(page.reload).not_to be_published
    end

    it "refuses a code for another page or action, a made-up code, and an expired one" do
      other = page_with("Other", path: "/other")
      code = run(Pagelet::Tools::PublishPage, page_id: other.id)["confirmation"]
      expect(run(Pagelet::Tools::PublishPage, page_id: page.id, confirmation: code)).to have_key("error")
      expect(run(Pagelet::Tools::DeletePage, page_id: other.id, confirmation: code)).to have_key("error")
      expect(run(Pagelet::Tools::PublishPage, page_id: page.id, confirmation: "yes")).to have_key("error")

      code = run(Pagelet::Tools::PublishPage, page_id: page.id)["confirmation"]
      travel 11.minutes do
        expect(run(Pagelet::Tools::PublishPage, page_id: page.id, confirmation: code)).to have_key("error")
      end
      expect(page.reload).not_to be_published
    end

    it "needs publish permission, even with a code" do
      code = run(Pagelet::Tools::PublishPage, page_id: page.id)["confirmation"]
      editor = Pagelet::Tools::Context.new(owner: site, catalog: catalog, can: ->(action, _) { action == :edit })
      result = Pagelet::Tools::PublishPage.new(editor).run(page_id: page.id, confirmation: code)
      expect(result["error"]).to include("publish")
      expect(page.reload).not_to be_published
    end

    it "unpublishes and deletes only with confirmation" do
      page.publish!
      code = run(Pagelet::Tools::UnpublishPage, page_id: page.id)["confirmation"]
      expect(page.reload).to be_published
      expect(run(Pagelet::Tools::UnpublishPage, page_id: page.id, confirmation: code)["published"]).to be(false)

      code = run(Pagelet::Tools::DeletePage, page_id: page.id)["confirmation"]
      expect(Pagelet::Page.exists?(page.id)).to be(true)
      expect(run(Pagelet::Tools::DeletePage, page_id: page.id, confirmation: code)["deleted"]).to be(true)
      expect(Pagelet::Page.exists?(page.id)).to be(false)
    end

    it "changes the site settings only with confirmation, and never invalid ones" do
      settings = { "theme" => {},
                   "menu" => { "style" => "bar", "items" => [{ "label" => "Visit", "href" => "/visit" }] } }
      expect(run(Pagelet::Tools::UpdateSite,
                 settings: { "menu" => { "items" => "nope" } })["error"]).to include("menu items")

      code = run(Pagelet::Tools::UpdateSite, settings: settings)["confirmation"]
      expect(Pagelet::Site.exists?(owner: site)).to be(false)
      run(Pagelet::Tools::UpdateSite, settings: settings, confirmation: code)
      expect(Pagelet::Site.settings_for(site).dig("menu", "items", 0, "label")).to eq("Visit")
    end
  end

  it "describes every tool for the model: a name, a description and an object schema" do
    described_class.classes.each do |tool|
      expect(tool.tool_name).to start_with("pagelet_")
      expect(tool.tool_description).to be_present
      expect(tool.tool_schema).to include("type" => "object")
    end
    expect(Pagelet::Tools::PublishPage.tool_schema["properties"]).to have_key("confirmation")
  end
end
