# frozen_string_literal: true

Pagelet.configure do |config|
  config.parent_controller = "ApplicationController"
  config.owner = ->(controller) { controller.current_site }
  config.authorize = lambda do |controller, action, _page|
    case controller.current_role
    when "publisher" then true
    when "editor" then action == :edit
    else false
    end
  end
end
