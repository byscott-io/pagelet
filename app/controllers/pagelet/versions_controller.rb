# frozen_string_literal: true

module Pagelet
  # A page's published history, and restoring an old version into the draft.
  class VersionsController < ApplicationController
    before_action -> { @page = pages.find(params[:page_id]) }
    before_action -> { authorize_pagelet!(:edit, @page) }

    def index
      render json: {
        versions: @page.versions.map do |version|
          { number: version.number, published_at: version.published_at, published_by: version.published_by,
            live: version.id == @page.published_version_id }
        end
      }
    end

    def restore
      version = @page.versions.find_by!(number: params[:number])
      @page.restore!(version)
      render json: { page: { id: @page.id, path: @page.path, title: @page.title,
                             draft_document: @page.draft_document } }
    end
  end
end
