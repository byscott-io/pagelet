# frozen_string_literal: true

module Pagelet
  # A published page's title and description, for search results and the
  # browser tab -- read from the page itself, so a page an admin adds or renames
  # needs no hand-kept list.
  #
  #   Pagelet::PageSeo.for(owner, "/mission")
  #   # => { "title" => "Mission", "description" => "Our mission at ..." }
  #
  # The title is the page's "Page title (browser tab)" setting. The description
  # is its "Description (search results)" setting, or, left blank, the start of
  # the first text on the page. nil when no page is published at exactly this
  # path: a sub-path a page answers for (a sermon under /messages) is a
  # different page to a search engine and must not borrow this one's title.
  module PageSeo
    DESCRIPTION_LENGTH = 160
    # Block props that hold a page's prose, in the order a reader meets them.
    TEXT_PROPS = %w[text subheading body answer].freeze
    # A heading names the page; it is not a description of it.
    NOT_PROSE = %w[Heading].freeze

    def self.for(owner, path)
      match = Page.published_match(owner, path)
      return nil unless match && match.rest.to_s.empty?

      seo = { "title" => setting(match.document, "title"),
              "description" => setting(match.document, "description") || excerpt(match.document) }
      seo.compact.presence
    end

    def self.setting(document, key)
      document.dig("data", "root", "props", key).to_s.strip.presence
    end

    def self.excerpt(document)
      text = first_text(document.dig("data", "content"))
      text && truncate(text.gsub(/\s+/, " ").strip)
    end

    # Depth first through blocks and their slots (Columns, Section), so the
    # first text is the first a reader sees.
    def self.first_text(items)
      Array(items).each do |item|
        found = own_text(item) || first_text(slots(item))
        return found if found
      end
      nil
    end

    def self.own_text(item)
      return nil if !item.is_a?(Hash) || NOT_PROSE.include?(item["type"])

      props = item["props"].is_a?(Hash) ? item["props"] : {}
      TEXT_PROPS.map { |key| props[key] }.find { |value| value.is_a?(String) && value.strip.present? }
    end

    # A block's slots hold its child blocks: every array of blocks in its props.
    def self.slots(item)
      props = item.is_a?(Hash) && item["props"].is_a?(Hash) ? item["props"] : {}
      props.values.grep(Array).flatten(1)
    end

    def self.truncate(text)
      return text if text.length <= DESCRIPTION_LENGTH

      cut = text[0, DESCRIPTION_LENGTH - 1]
      cut = cut[0, cut.rindex(" ")] if cut.include?(" ")
      "#{cut.rstrip}…"
    end
  end
end
