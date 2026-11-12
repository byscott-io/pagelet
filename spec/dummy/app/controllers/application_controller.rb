# frozen_string_literal: true

# Stands in for a host app's sign-in. Specs say which site the request is for
# and what the user may do through headers, so they can exercise pagelet's
# owner scoping and permission hooks directly.
class ApplicationController < ActionController::Base
  def current_site
    Site.find_by(id: request.headers["X-Site-Id"])
  end

  def current_role
    request.headers["X-Role"]
  end
end
