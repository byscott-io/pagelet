# frozen_string_literal: true

module Pagelet
  module Tools
    class CreatePage < Base
      tool "pagelet_create_page",
           "Create a new page as a draft (visitors do not see it until it is published). Block ids and " \
           "settings you leave out are filled in.",
           properties: {
             path: { type: "string", description: "The address, like /visit or /about/staff" },
             title: { type: "string", description: "The page's name in the page list" },
             answers_subpaths: { type: "boolean", description: "Also answer for addresses below it" },
             document: { type: "object", description: "The draft: { root: { props }, content: [blocks] }" }
           },
           required: %w[path title]

      def call(arguments)
        authorize!(:edit)
        document = arguments["document"] ? prepared(arguments["document"]) : Pagelet.empty_document
        page = context.pages.new(path: arguments["path"], title: arguments["title"],
                                 matches_subpaths: arguments["answers_subpaths"] || false, draft_document: document)
        page.save || record_errors(page)
        summary(page)
      end
    end
  end
end
