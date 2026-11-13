# frozen_string_literal: true

module Pagelet
  # Checks the shape of site settings before they are stored:
  #   { "theme" => {...}, "menu" => { "style", "brand" => { "logo", "href", "label" },
  #     "items" => [{ "label", "href", "icon", "highlight", "group" }] } }
  # Returns nil when fine, or a message saying what is wrong.
  module SiteCheck
    MENU_STYLES = %w[bar centered].freeze
    GROUPS = %w[left right].freeze
    MAX_ITEMS = 50

    module_function

    def problem(settings)
      return "must be an object" unless settings.is_a?(Hash)
      return "theme must be an object" unless settings.fetch("theme", {}).is_a?(Hash)

      menu_problem(settings.fetch("menu", {})) || size_problem(settings)
    end

    def menu_problem(menu)
      return "menu must be an object" unless menu.is_a?(Hash)
      return "menu style must be one of #{MENU_STYLES.join(', ')}" unless MENU_STYLES.include?(menu.fetch("style",
                                                                                                          "bar"))
      return "menu brand must be an object" unless menu.fetch("brand", {}).is_a?(Hash)

      items_problem(menu.fetch("items", []))
    end

    def items_problem(items)
      return "menu items must be a list" unless items.is_a?(Array)
      return "menu has more than #{MAX_ITEMS} items" if items.size > MAX_ITEMS

      items.each_with_index.lazy.map { |item, index| item_problem(item, index + 1) }.find(&:itself)
    end

    def item_problem(item, number)
      return "menu item #{number} must be an object" unless item.is_a?(Hash)
      return "menu item #{number} needs a label" if item["label"].to_s.strip.empty?
      return "menu item #{number} needs a link" if item["href"].to_s.strip.empty?

      "menu item #{number} group must be left or right" unless GROUPS.include?(item.fetch("group", "left"))
    end

    def size_problem(settings)
      limit = Pagelet.config.max_document_bytes
      size = settings.to_json.bytesize
      "are too large (#{size} bytes; the limit is #{limit})" if size > limit
    end
  end
end
