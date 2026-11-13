# frozen_string_literal: true

module Pagelet
  # The blocks an app offers, as written by the npm package's paletteCatalog()
  # at build time. The server cannot read the JavaScript palette, so this is how
  # it knows which blocks and fields exist: the AI tools show it to the model and
  # check every page the model writes against it.
  #
  #   Pagelet.config.catalog_path = Rails.root.join("app/assets/builds/pagelet-catalog.json")
  class Catalog
    include FieldChecks

    VERSION = 1

    def self.load(path)
      raise ConfigurationError, "Pagelet.config.catalog_path is not set" if path.blank?

      new(JSON.parse(File.read(path)))
    rescue Errno::ENOENT
      raise ConfigurationError, "no pagelet catalog at #{path}; build it with paletteCatalog() (docs/AI_TOOLS.md)"
    end

    attr_reader :data

    def initialize(data)
      unless data["catalog"] == VERSION
        raise ConfigurationError,
              "unsupported catalog format #{data['catalog'].inspect}"
      end

      @data = data
    end

    def blocks = data.fetch("blocks")
    def page_fields = data.dig("page", "fields") || {}

    # The document with what the model may leave out filled in: a block's id,
    # and the defaults for props it did not set. Returns [document, problems];
    # problems is empty when the document fits the catalog.
    def prepare(document)
      @problems = []
      doc = document.deep_dup
      data = doc["data"] ||= {}
      check_props(root_props(data), page_fields, "page settings")
      @problems << "zones are not supported; put blocks in slot fields" if data["zones"].present?
      data["content"] = prepare_blocks(data["content"], "page")
      [doc, @problems]
    end

    private

    def root_props(data)
      data["root"] = { "props" => {} } unless data["root"].is_a?(Hash)
      data["root"]["props"] ||= {}
    end

    def prepare_blocks(items, where)
      unless items.is_a?(Array)
        @problems << "#{where} must be a list of blocks"
        return []
      end

      items.each_with_index.map { |item, index| prepare_block(item, "#{where}, block #{index + 1}") }
    end

    def prepare_block(item, where)
      spec = block_spec(item, where)
      return item unless spec

      props = with_defaults(spec, item)
      check_props(props, spec["fields"] || {}, "#{where} (#{item['type']})")
      item.merge("props" => props)
    end

    def with_defaults(spec, item)
      props = (spec["defaultProps"] || {}).deep_dup.merge(item["props"].is_a?(Hash) ? item["props"] : {})
      props["id"] = "#{item['type']}-#{SecureRandom.hex(4)}" if props["id"].blank?
      props
    end

    def block_spec(item, where)
      return blocks[item["type"]] || unknown_block(item, where) if item.is_a?(Hash)

      @problems << "#{where} must be an object with type and props"
      nil
    end

    def unknown_block(item, where)
      @problems << "#{where}: unknown block type #{item['type'].inspect}"
      nil
    end

    def check_props(props, fields, where)
      unknown = props.keys - fields.keys - ["id"]
      @problems << "#{where}: unknown field(s) #{unknown.join(', ')}" if unknown.any?
      fields.each do |name, field|
        props[name] = check_value(props[name], field, "#{where}, #{name}") if props.key?(name)
      end
    end
  end
end
