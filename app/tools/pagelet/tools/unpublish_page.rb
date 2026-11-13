# frozen_string_literal: true

module Pagelet
  module Tools
    class UnpublishPage < ConfirmedBase
      tool "pagelet_unpublish_page",
           "Take a page off the live site. Its draft and history are kept, so it can be published again. " \
           "Needs the person's confirmation (see confirmation).",
           properties: { page_id: { type: "integer" } }, required: ["page_id"]

      def call(arguments)
        page = page(arguments)
        authorize!(:publish, page)
        raise Refused, "That page is not published." unless page.published?

        summary = "Take \"#{page.title}\" (#{page.path}) off the site. Its draft and history are kept."
        confirmed(arguments, action: :unpublish, subject: page.id, content: page.published_version_id, summary:) do
          page.unpublish!
          summary(page.reload)
        end
      end
    end
  end
end
