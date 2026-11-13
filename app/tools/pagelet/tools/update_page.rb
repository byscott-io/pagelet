# frozen_string_literal: true

module Pagelet
  module Tools
    class UpdatePage < Base
      tool "pagelet_update_page",
           "Change a page's draft, title or address. A new document replaces the whole draft, so send the " \
           "full page (read it with pagelet_get_page first). The live page does not change until it is " \
           "published.",
           properties: {
             page_id: { type: "integer" },
             title: { type: "string" },
             path: { type: "string", description: "Only for a page that is not published" },
             answers_subpaths: { type: "boolean" },
             document: { type: "object", description: "The whole new draft" }
           },
           required: ["page_id"]

      def call(arguments)
        page = page(arguments)
        authorize!(:edit, page)
        changes = changes_from(arguments)
        # Moving a live page changes the site at once, outside any confirmation.
        raise Refused, "A published page's address cannot change here; unpublish it first." if
          page.published? && changes.keys.intersect?(%w[path matches_subpaths])

        page.update(changes) || record_errors(page)
        summary(page)
      end

      private

      def changes_from(arguments)
        changes = arguments.slice("title", "path")
        changes["matches_subpaths"] = arguments["answers_subpaths"] if arguments.key?("answers_subpaths")
        changes["draft_document"] = prepared(arguments["document"]) if arguments.key?("document")
        changes
      end
    end
  end
end
