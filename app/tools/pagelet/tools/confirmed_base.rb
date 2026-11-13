# frozen_string_literal: true

module Pagelet
  module Tools
    # A tool whose change goes live: runs Confirmation's two steps around #apply.
    class ConfirmedBase < Base
      CONFIRMATION_PROPERTY = {
        "confirmation" => {
          "type" => "string",
          "description" => "Leave out on the first call. That call changes nothing and returns a summary " \
                           "and a code; show the summary to the person, and only after they say yes, " \
                           "call again with the code."
        }
      }.freeze

      def self.tool(name, description, schema = {})
        schema = schema.deep_stringify_keys
        schema["properties"] = (schema["properties"] || {}).merge(CONFIRMATION_PROPERTY)
        super
      end

      private

      def confirmed(arguments, action:, subject:, content:, summary:)
        code = arguments["confirmation"]
        if code.blank?
          return { "needs_confirmation" => true, "summary" => summary,
                   "confirmation" => Confirmation.code_for(context, action, subject, content),
                   "instructions" => "Nothing has changed yet. Tell the person exactly this, ask if they want " \
                                     "to go ahead, and only if they say yes call this tool again with the " \
                                     "confirmation code." }
        end
        raise Refused, "That confirmation is for a different change or has expired; ask again." unless
          Confirmation.valid?(code, context, action, subject, content)

        yield
      end
    end
  end
end
