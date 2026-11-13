# frozen_string_literal: true

Pagelet.configure do |config|
  # Required. Whose pages this request may see; every query is scoped to it.
  # Return any Active Record model: a site, an account, an organization.
  # Runs in the controller, so request helpers are available.
  config.owner = ->(_controller) { raise "Set Pagelet.config.owner in #{__FILE__}" }

  # Required. May this request take this action? action is :edit (list,
  # create, change, see drafts, delete a never-published page) or :publish
  # (publish, delete a live page). page is nil when listing or creating.
  config.authorize = ->(_controller, _action, _page) { false }

  # The engine's controllers inherit from this, so your sign-in and CSRF
  # protection apply to the editor's API.
  config.parent_controller = "ApplicationController"

  # Largest page document accepted, in bytes.
  # config.max_document_bytes = 1_000_000
end
