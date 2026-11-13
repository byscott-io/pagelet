# frozen_string_literal: true

module Pagelet
  module Tools
    class PublishPage < ConfirmedBase
      tool "pagelet_publish_page",
           "Put a page's current draft on the live site. Needs the person's confirmation (see confirmation).",
           properties: { page_id: { type: "integer" } }, required: ["page_id"]

      def call(arguments)
        page = page(arguments)
        authorize!(:publish, page)
        summary = "Publish \"#{page.title}\" (#{page.path}) as it looks in the preview" \
                  "#{', replacing what is live now' if page.published?}."
        confirmed(arguments, action: :publish, subject: page.id, content: page.draft_document, summary:) do
          version = page.publish!
          summary(page.reload).merge("published_version" => version.number)
        end
      end
    end
  end
end
