# frozen_string_literal: true

module Pagelet
  module Tools
    class DeletePage < ConfirmedBase
      tool "pagelet_delete_page",
           "Delete a page and all of its history, for good. Prefer pagelet_unpublish_page to take a page off " \
           "the site. Needs the person's confirmation (see confirmation).",
           properties: { page_id: { type: "integer" } }, required: ["page_id"]

      def call(arguments)
        page = page(arguments)
        authorize!(page.published? ? :publish : :edit, page)
        summary = "Delete \"#{page.title}\" (#{page.path}) and all of its versions. This cannot be undone" \
                  "#{', and it takes the page off the site' if page.published?}."
        confirmed(arguments, action: :delete, subject: page.id,
                             content: [page.draft_document, page.published_version_id], summary:) do
          page.destroy!
          { "deleted" => true, "path" => page.path }
        end
      end
    end
  end
end
