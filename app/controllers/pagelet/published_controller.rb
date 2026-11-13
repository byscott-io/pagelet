# frozen_string_literal: true

module Pagelet
  # The one public endpoint: the published document at a path, for apps that
  # render pages in the browser. Drafts are never served here. Apps rendering on
  # the server call Pagelet::Page.published_document directly instead.
  class PublishedController < ApplicationController
    def show
      match = Page.published_match(pagelet_owner, params[:path].presence || "/")
      return render(json: { error: "not found" }, status: :not_found) unless match

      render json: { document: match.document, page_path: match.page_path, rest: match.rest }
    end
  end
end
