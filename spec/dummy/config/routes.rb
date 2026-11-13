# frozen_string_literal: true

Rails.application.routes.draw do
  mount Pagelet::Engine, at: "/pagelet"

  # For the end-to-end run: hands a script the session cookie and CSRF token a
  # browser would get from the layout's csrf_meta_tags.
  get "csrf", to: "csrf#show"
end
