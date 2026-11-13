# frozen_string_literal: true

module Pagelet
  module Tools
    # Changes that reach the live site at once (publish, unpublish, delete,
    # site settings) take two calls. The first changes nothing: it returns a
    # summary and a code. The model must show the summary to the person, and
    # only after they agree call again with the code.
    #
    # The code is bound to the owner, the action, the page and a digest of
    # exactly what would go live, and expires: so it cannot publish a different
    # draft than the one described, or be reused later. It cannot prove a
    # person agreed -- only a confirmation the person clicks can (#777).
    module Confirmation
      TTL = 10.minutes

      module_function

      def code_for(context, action, subject, content)
        verifier.generate(payload(context, action, subject, content), expires_in: TTL, purpose: :pagelet_confirmation)
      end

      def valid?(code, context, action, subject, content)
        return false if code.blank?

        verifier.verified(code, purpose: :pagelet_confirmation) == payload(context, action, subject, content)
      end

      def payload(context, action, subject, content)
        owner = context.owner
        [owner.class.name, owner.id, action.to_s, subject, Digest::SHA256.hexdigest(content.to_json)]
      end

      def verifier
        Rails.application.message_verifier("pagelet_tool_confirmation")
      end
    end
  end
end
