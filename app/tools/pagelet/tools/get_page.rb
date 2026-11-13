# frozen_string_literal: true

module Pagelet
  module Tools
    class GetPage < Base
      tool "pagelet_get_page",
           "Read one page: its draft (the blocks, in order, with their settings) and whether it is published. " \
           "Read a page before changing it, and change the draft you read.",
           properties: { page_id: { type: "integer", description: "From pagelet_list_pages" } }, required: ["page_id"]

      def call(arguments)
        page = page(arguments)
        authorize!(:edit, page)
        summary(page).merge("draft" => page.draft_document)
      end
    end
  end
end
