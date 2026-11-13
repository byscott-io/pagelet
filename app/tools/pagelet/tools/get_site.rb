# frozen_string_literal: true

module Pagelet
  module Tools
    class GetSite < Base
      tool "pagelet_get_site",
           "Read the site settings: the menu (brand, and items with label, href, icon, highlight, group " \
           "left/right) and the theme (colors, fonts, text size, background photo and overlay)."

      def call(_arguments)
        authorize!(:edit)
        { "settings" => Pagelet::Site.settings_for(context.owner) }
      end
    end
  end
end
