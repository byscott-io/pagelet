# frozen_string_literal: true

RSpec.describe "Pagelet API" do
  let(:site) { Site.create!(name: "Ours") }
  let(:other_site) { Site.create!(name: "Theirs") }

  def as(role, owner = site)
    { "X-Site-Id" => owner.id.to_s, "X-Role" => role, "CONTENT_TYPE" => "application/json" }
  end

  def json
    response.parsed_body
  end

  def create_page(owner = site, path: "/about", document: page_document)
    Pagelet::Page.create!(owner: owner, path: path, title: "About", draft_document: document)
  end

  describe "permissions" do
    it "refuses a visitor who may not edit" do
      get "/pagelet/pages", headers: as("visitor")
      expect(response).to have_http_status(:forbidden)
    end

    it "lets an editor edit but not publish" do
      page = create_page
      patch "/pagelet/pages/#{page.id}", params: { page: { title: "New" } }.to_json, headers: as("editor")
      expect(response).to have_http_status(:ok)

      post "/pagelet/pages/#{page.id}/publish", headers: as("editor")
      expect(response).to have_http_status(:forbidden)
      expect(page.reload).not_to be_published
    end

    it "answers 404 when the request has no owner at all" do
      get "/pagelet/pages", headers: { "X-Role" => "publisher" }
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "owner isolation" do
    it "never lists another owner's pages" do
      create_page(other_site, path: "/theirs")
      create_page(site, path: "/ours")
      get "/pagelet/pages", headers: as("publisher")
      expect(json["pages"].pluck("path")).to eq(["/ours"])
    end

    it "treats another owner's page as not found, for reading, changing, publishing and deleting" do
      theirs = create_page(other_site)
      requests = [
        -> { get "/pagelet/pages/#{theirs.id}", headers: as("publisher") },
        lambda {
          patch "/pagelet/pages/#{theirs.id}", params: { page: { title: "Hijacked" } }.to_json, headers: as("publisher")
        },
        -> { post "/pagelet/pages/#{theirs.id}/publish", headers: as("publisher") },
        -> { delete "/pagelet/pages/#{theirs.id}", headers: as("publisher") }
      ]
      requests.each do |request|
        request.call
        expect(response).to have_http_status(:not_found)
      end
      expect(theirs.reload).to have_attributes(title: "About", published_version_id: nil)
    end
  end

  describe "editing" do
    it "creates a page with an empty draft" do
      post "/pagelet/pages", params: { page: { path: "/visit", title: "Plan a visit" } }.to_json, headers: as("editor")
      expect(response).to have_http_status(:created)
      expect(json.dig("page", "draft_document")).to eq(Pagelet.empty_document)
      expect(Pagelet::Page.last.owner).to eq(site)
    end

    it "saves the draft document the editor sends" do
      page = create_page
      patch "/pagelet/pages/#{page.id}", params: { page: { draft_document: page_document("Edited") } }.to_json,
                                         headers: as("editor")
      expect(page.reload.draft_document.dig("data", "content", 0, "props", "text")).to eq("Edited")
    end

    it "reports validation problems as 422 with messages" do
      page = create_page
      patch "/pagelet/pages/#{page.id}", params: { page: { draft_document: { "pagelet" => 9, "data" => {} } } }.to_json,
                                         headers: as("editor")
      expect(response).to have_http_status(:unprocessable_content)
      expect(json.dig("errors", "draft_document").join).to include("newer pagelet")
    end

    it "ignores attempts to move a page to another owner" do
      page = create_page
      patch "/pagelet/pages/#{page.id}", params: { page: { owner_id: other_site.id, title: "Still ours" } }.to_json,
                                         headers: as("editor")
      expect(page.reload).to have_attributes(owner: site, title: "Still ours")
    end
  end

  describe "unpublishing" do
    let(:live_page) { create_page.tap(&:publish!) }

    it "needs publish permission" do
      post "/pagelet/pages/#{live_page.id}/unpublish", headers: as("editor")
      expect(response).to have_http_status(:forbidden)
      expect(live_page.reload).to be_published
    end

    it "takes the page off the site" do
      post "/pagelet/pages/#{live_page.id}/unpublish", headers: as("publisher")
      expect(response.parsed_body.dig("page", "published")).to be(false)
      expect(Pagelet::Page.published_document(site, live_page.path)).to be_nil
    end

    it "keeps the draft and the versions, so publishing again brings it back" do
      draft = live_page.draft_document
      post "/pagelet/pages/#{live_page.id}/unpublish", headers: as("publisher")
      expect(live_page.reload).to have_attributes(draft_document: draft, published_version_id: nil)
      expect(live_page.versions.count).to eq(1)

      live_page.publish!
      expect(Pagelet::Page.published_document(site, live_page.path)).to be_present
    end

    it "treats another owner's page as not found" do
      theirs = create_page(other_site)
      theirs.publish!
      post "/pagelet/pages/#{theirs.id}/unpublish", headers: as("publisher")
      expect(response).to have_http_status(:not_found)
      expect(theirs.reload).to be_published
    end
  end

  describe "deleting" do
    it "lets an editor delete a draft that was never published" do
      page = create_page
      delete "/pagelet/pages/#{page.id}", headers: as("editor")
      expect(response).to have_http_status(:no_content)
      expect(Pagelet::Page.exists?(page.id)).to be(false)
    end

    it "needs publish permission to delete a live page" do
      page = create_page
      page.publish!
      delete "/pagelet/pages/#{page.id}", headers: as("editor")
      expect(response).to have_http_status(:forbidden)
      expect(Pagelet::Page.exists?(page.id)).to be(true)

      delete "/pagelet/pages/#{page.id}", headers: as("publisher")
      expect(response).to have_http_status(:no_content)
      expect(Pagelet::PageVersion.where(page_id: page.id)).to be_empty
    end
  end

  describe "publishing, history and rollback" do
    it "publishes, lists versions and restores an old one into the draft" do
      page = create_page(document: page_document("First"))
      post "/pagelet/pages/#{page.id}/publish", params: { published_by: "pat" }.to_json, headers: as("publisher")
      expect(json.dig("version", "number")).to eq(1)

      page.update!(draft_document: page_document("Second"))
      post "/pagelet/pages/#{page.id}/publish", headers: as("publisher")

      get "/pagelet/pages/#{page.id}/versions", headers: as("editor")
      expect(json["versions"].map { |v| [v["number"], v["live"]] }).to eq([[1, false], [2, true]])

      post "/pagelet/pages/#{page.id}/versions/1/restore", headers: as("editor")
      expect(response).to have_http_status(:ok)
      expect(page.reload.draft_document.dig("data", "content", 0, "props", "text")).to eq("First")
    end
  end

  describe "the public endpoint" do
    it "serves the published page to anyone, without the draft" do
      page = create_page(document: page_document("Live text"))
      page.publish!
      page.update!(draft_document: page_document("Secret draft"))

      get "/pagelet/published", params: { path: "/about" }, headers: { "X-Site-Id" => site.id.to_s }
      expect(response).to have_http_status(:ok)
      expect(response.body).to include("Live text")
      expect(response.body).not_to include("Secret draft")
    end

    it "answers 404 for unpublished pages and for other owners' pages" do
      create_page
      get "/pagelet/published", params: { path: "/about" }, headers: { "X-Site-Id" => site.id.to_s }
      expect(response).to have_http_status(:not_found)

      create_page(other_site, path: "/theirs").publish!
      get "/pagelet/published", params: { path: "/theirs" }, headers: { "X-Site-Id" => site.id.to_s }
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "site settings" do
    let(:settings) do
      { "theme" => { "colorAccent" => "#123456" },
        "menu" => { "style" => "bar", "brand" => {}, "items" => [{ "label" => "Mission", "href" => "/mission" }] } }
    end

    it "lets anyone read the settings, since every page needs them" do
      Pagelet::Site.create!(owner: site, settings: settings)
      get "/pagelet/site", headers: { "X-Site-Id" => site.id.to_s }
      expect(response).to have_http_status(:ok)
      expect(json.dig("settings", "menu", "items", 0, "label")).to eq("Mission")
    end

    it "needs publish permission to change them, because changes are live at once" do
      patch "/pagelet/site", params: { settings: settings }.to_json, headers: as("editor")
      expect(response).to have_http_status(:forbidden)

      patch "/pagelet/site", params: { settings: settings }.to_json, headers: as("publisher")
      expect(response).to have_http_status(:ok)
      expect(Pagelet::Site.settings_for(site).dig("theme", "colorAccent")).to eq("#123456")
    end

    it "keeps each owner's settings apart" do
      patch "/pagelet/site", params: { settings: settings }.to_json, headers: as("publisher", other_site)
      expect(Pagelet::Site.settings_for(site)).to eq(Pagelet::Site.default_settings)
    end

    it "reports a bad menu as 422 with the reason" do
      bad = settings.deep_merge("menu" => { "items" => [{ "label" => "", "href" => "/x" }] })
      patch "/pagelet/site", params: { settings: bad }.to_json, headers: as("publisher")
      expect(response).to have_http_status(:unprocessable_content)
      expect(json.dig("errors", "settings").join).to include("needs a label")
    end
  end

  describe "pages that answer for sub-paths" do
    it "serves /messages/43 from a /messages page that opted in, with the remainder" do
      post "/pagelet/pages", params: { page: { path: "/messages", title: "Messages", matches_subpaths: true } }.to_json,
                             headers: as("editor")
      page = Pagelet::Page.find(json.dig("page", "id"))
      expect(page.matches_subpaths).to be(true)
      page.publish!

      get "/pagelet/published", params: { path: "/messages/43" }, headers: { "X-Site-Id" => site.id.to_s }
      expect(response).to have_http_status(:ok)
      expect(json).to include("page_path" => "/messages", "rest" => "43")
    end
  end
end
