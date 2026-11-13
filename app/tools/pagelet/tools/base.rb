# frozen_string_literal: true

module Pagelet
  module Tools
    # A tool an AI can call: a name, a description for the model, a JSON
    # Schema for its arguments, and #call. Framework-agnostic on purpose (this
    # gem is public and has no AI dependency): an app wraps each one in its own
    # AI library's tool class. Pagelet::Tools.classes lists them.
    #
    # #run returns a Hash for the model, with "error" set when it was refused,
    # so a refusal is something the model can explain rather than an exception.
    class Base
      class << self
        attr_reader :tool_name, :tool_description, :tool_schema

        def tool(name, description, schema = {})
          @tool_name = name
          @tool_description = description
          @tool_schema = { "type" => "object", "properties" => {}, "required" => [] }.merge(schema.deep_stringify_keys)
        end
      end

      def initialize(context)
        @context = context
      end

      def run(arguments)
        call(arguments.to_h.deep_stringify_keys)
      rescue Refused, ActiveRecord::RecordNotFound => e
        { "error" => e.is_a?(ActiveRecord::RecordNotFound) ? "No such page." : e.message }
      end

      private

      attr_reader :context

      def page(arguments)
        context.pages.find(arguments.fetch("page_id"))
      end

      def authorize!(action, page = nil)
        return if context.can.call(action, page)

        raise Refused, action == :publish ? "Only someone who may publish can do that." : "You may not edit pages."
      end

      def summary(page)
        { "id" => page.id, "path" => page.path, "title" => page.title, "published" => page.published?,
          "unpublished_changes" => page.unpublished_changes?,
          "published_version" => page.published_version&.number, "answers_subpaths" => page.matches_subpaths,
          "preview_url" => context.preview_url.call(page) }.compact
      end

      # Fits the document to the catalog, or refuses with what is wrong.
      def prepared(document)
        unless document.is_a?(Hash) && document.key?("data")
          document = { "pagelet" => Pagelet::DOCUMENT_VERSION,
                       "data" => document }
        end
        document["pagelet"] ||= Pagelet::DOCUMENT_VERSION
        document, problems = context.catalog.prepare(document)
        problem = Pagelet::DocumentCheck.problem(document)
        problems << "the document #{problem}" if problem
        raise Refused, "The page was not saved: #{problems.join('; ')}" if problems.any?

        document
      end

      def record_errors(record)
        raise Refused, record.errors.full_messages.to_sentence
      end
    end
  end
end
