# frozen_string_literal: true

module Pagelet
  module Tools
    class UpdateSite < ConfirmedBase
      tool "pagelet_update_site",
           "Replace the site settings (menu and theme). They are live at once, on every page, so this needs " \
           "the person's confirmation (see confirmation). Read them with pagelet_get_site and send the whole " \
           "settings back with your change.",
           properties: { settings: { type: "object", description: "{ menu: {...}, theme: {...} }" } },
           required: ["settings"]

      def call(arguments)
        authorize!(:publish)
        site = Pagelet::Site.find_or_initialize_by(owner: context.owner)
        site.settings = arguments["settings"]
        raise Refused, "Those settings were not saved: #{site.errors.full_messages.to_sentence}" unless site.valid?

        confirmed(arguments, action: :site, subject: "site", content: site.settings,
                             summary: "Change the site's menu and theme as described; every page shows it at once.") do
          site.save!
          { "settings" => site.settings }
        end
      end
    end
  end
end
