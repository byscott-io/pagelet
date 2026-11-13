# frozen_string_literal: true

module Pagelet
  # Site-wide settings: the theme and the menu.
  #
  # Reading is public, because every page a visitor sees needs the menu and the
  # theme. Changing them needs :publish, not :edit: unlike a page draft, a
  # change here is live on the site at once.
  class SitesController < ApplicationController
    before_action -> { authorize_pagelet!(:publish) }, only: :update

    def show
      render json: { settings: Site.settings_for(pagelet_owner) }
    end

    def update
      site = Site.find_or_initialize_by(owner: pagelet_owner)
      site.settings = settings_param
      if site.save
        render json: { settings: site.settings }
      else
        render json: { errors: site.errors.to_hash(true) }, status: :unprocessable_content
      end
    end

    private

    # Free-form JSON by design; SiteCheck validates its shape and size.
    def settings_param
      value = params.require(:settings)
      value.respond_to?(:to_unsafe_h) ? value.to_unsafe_h : value
    end
  end
end
