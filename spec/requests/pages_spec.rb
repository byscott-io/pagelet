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
end
