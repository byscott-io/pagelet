# frozen_string_literal: true

module Pagelet
  module Tools
    class ListBlocks < Base
      tool "pagelet_list_blocks",
           "The blocks a page can be built from, with each field's type and allowed values, and the page " \
           "settings. A page is { root: { props: page settings }, content: [ { type, props } ] }; slot " \
           "fields hold blocks in the same form. Use only these blocks and fields."

      def call(_arguments)
        authorize!(:edit)
        catalog = context.catalog.data
        { "blocks" => catalog["blocks"], "page_settings" => catalog.dig("page", "fields"),
          "categories" => catalog["categories"] }
      end
    end
  end
end
