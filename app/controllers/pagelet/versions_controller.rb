# frozen_string_literal: true

module Pagelet
  # A page's published history, and restoring an old version into the draft.
  class VersionsController < ApplicationController
    before_action -> { @page = pages.find(params[:page_id]) }
    before_action -> { authorize_pagelet!(:edit, @page) }

    def index
      render json: { versions: @page.versions.map { |version| version_json(version) } }
    end

    # One version's content, to preview or compare it.
    def show
      version = @page.versions.find_by!(number: params[:number])
      render json: { version: version_json(version).merge(document: version.document) }
    end

    def restore
      version = @page.versions.find_by!(number: params[:number])
      @page.restore!(version)
      render json: { page: { id: @page.id, path: @page.path, title: @page.title,
                             draft_document: @page.draft_document } }
    end

    private

    def version_json(version)
      { number: version.number, published_at: version.published_at, published_by: version.published_by,
        live: version.id == @page.published_version_id }
    end
  end
end
