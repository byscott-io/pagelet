# frozen_string_literal: true

module Pagelet
  # Inherits from the host's chosen controller (config.parent_controller), so
  # the host's sign-in, CSRF protection and error handling cover pagelet's API.
  class ApplicationController < Pagelet.config.parent_controller.constantize
    rescue_from ActiveRecord::RecordNotFound, with: -> { render json: { error: "not found" }, status: :not_found }

    private

    # Whose pages this request may see. Resolved on every request, never cached
    # across them.
    def pagelet_owner
      @pagelet_owner ||= instance_exec(self, &Pagelet.config.owner) ||
                         raise(ActiveRecord::RecordNotFound, "no page owner for this request")
    end

    def pages
      Page.owned_by(pagelet_owner)
    end

    # Halts with 403 unless the host's authorize hook allows this action.
    def authorize_pagelet!(action, page = nil)
      return if instance_exec(self, action, page, &Pagelet.config.authorize)

      render json: { error: "forbidden" }, status: :forbidden
    end
  end
end
