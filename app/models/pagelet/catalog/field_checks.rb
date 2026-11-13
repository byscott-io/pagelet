# frozen_string_literal: true

module Pagelet
  class Catalog
    # One check per catalog field type. Each adds to @problems; a slot's check
    # returns its blocks filled in, which check_value hands back to keep.
    module FieldChecks
      CHECKS = {
        "text" => :check_text, "textarea" => :check_text, "number" => :check_number,
        "select" => :check_choice, "radio" => :check_choice, "array" => :check_array,
        "object" => :check_object, "slot" => :prepare_blocks
      }.freeze

      private

      # Returns the value to keep: a slot's blocks come back filled in.
      def check_value(value, field, where)
        check = CHECKS[field["type"]]
        return value unless check

        result = check == :prepare_blocks ? send(check, value, where) : send(check, value, field, where)
        check == :prepare_blocks ? result : value
      end

      def check_text(value, _field, where)
        @problems << "#{where} must be text" unless value.is_a?(String)
      end

      def check_number(value, field, where)
        return if value.nil? || value == ""
        return @problems << "#{where} must be a number" unless value.is_a?(Numeric)

        check_range(value, field, where)
      end

      def check_range(value, field, where)
        @problems << "#{where} must be at least #{field['min']}" if field["min"] && value < field["min"]
        @problems << "#{where} must be at most #{field['max']}" if field["max"] && value > field["max"]
      end

      def check_choice(value, field, where)
        allowed = field["options"].pluck("value")
        @problems << "#{where} must be one of #{allowed.map(&:inspect).join(', ')}" unless allowed.include?(value)
      end

      def check_array(value, field, where)
        return @problems << "#{where} must be a list" unless value.is_a?(Array)

        value.each_with_index do |entry, index|
          item = "#{where}, item #{index + 1}"
          next @problems << "#{item} must be an object" unless entry.is_a?(Hash)

          check_props(entry, field["itemFields"] || {}, item)
        end
      end

      def check_object(value, field, where)
        return check_props(value, field["objectFields"] || {}, where) if value.is_a?(Hash)

        @problems << "#{where} must be an object"
      end
    end
  end
end
