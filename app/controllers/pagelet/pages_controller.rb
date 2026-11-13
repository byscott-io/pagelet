# frozen_string_literal: true

module Pagelet
  # The editor's API. Every action is scoped to the request's owner, so another
  # owner's page answers 404, the same as one that does not exist.
  class PagesController < ApplicationController
    before_action :find_page, except: %i[index create]
    before_action -> { authorize_pagelet!(:edit, @page) }, except: %i[publish destroy]
    before_action -> { authorize_pagelet!(:publish, @page) }, only: :publish
    # Deleting a live page takes it off the site, as publishing changes it, so
    # it needs publish permission. A never-published draft needs only :edit.
    before_action -> { authorize_pagelet!(@page.published? ? :publish : :edit, @page) }, only: :destroy

    def index
      render json: { pages: pages.order(:path).map { |page| summary(page) } }
    end

    def show
      render json: { page: detail(@page) }
    end

    def create
      page = pages.new(page_params)
      if page.save
        render json: { page: detail(page) }, status: :created
      else
        render json: { errors: page.errors.to_hash(true) }, status: :unprocessable_content
      end
    end

    def update
      if @page.update(page_params)
        render json: { page: detail(@page) }
      else
        render json: { errors: @page.errors.to_hash(true) }, status: :unprocessable_content
      end
    end

    def destroy
      @page.destroy!
      head :no_content
    end

    def publish
      version = @page.publish!(published_by: params[:published_by].presence)
      render json: { page: detail(@page.reload), version: version_json(version) }
    end

    private

    def find_page
      @page = pages.find(params[:id])
    end

    def page_params
      permitted = params.require(:page).permit(:path, :title, :matches_subpaths)
      permitted[:draft_document] = draft_document_param if params[:page].key?(:draft_document)
      permitted
    end

    # The document is free-form JSON by design, so it cannot go through
    # permit(); DocumentCheck validates its shape and size instead.
    def draft_document_param
      value = params[:page][:draft_document]
      value.respond_to?(:to_unsafe_h) ? value.to_unsafe_h : value
    end

    def summary(page)
      { id: page.id, path: page.path, title: page.title, matches_subpaths: page.matches_subpaths,
        published: page.published?,
        published_version: page.published_version&.number, updated_at: page.updated_at }
    end

    def detail(page)
      summary(page).merge(draft_document: page.draft_document)
    end

    def version_json(version)
      { number: version.number, published_at: version.published_at, published_by: version.published_by }
    end
  end
end
