# frozen_string_literal: true

module Pagelet
  module Tools
    # What a tool call runs as, supplied by the app's adapter (an MCP tool, a
    # chat tool) for each call:
    #
    #   owner:       whose pages, as Pagelet.config.owner would return
    #   can:         ->(action, page) { true/false }, action :edit or :publish,
    #                the same question Pagelet.config.authorize answers
    #   preview_url: ->(page) { "https://..." } where a person can see the draft
    #   catalog:     a Pagelet::Catalog (default: Pagelet.config.catalog_path)
    Context = Data.define(:owner, :can, :preview_url, :catalog) do
      def initialize(owner:, can:, preview_url: ->(_page) {}, catalog: nil)
        super(owner:, can:, preview_url:, catalog: catalog || Pagelet::Catalog.load(Pagelet.config.catalog_path))
      end

      def pages = Pagelet::Page.where(owner: owner)
    end
  end
end
