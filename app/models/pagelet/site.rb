# frozen_string_literal: true

module Pagelet
  # One owner's site-wide settings: the theme (colors, fonts, the background
  # photo and its overlay) and the menu. Changes are live at once, which is why
  # the API asks for publish permission to change them.
  class Site < ApplicationRecord
    belongs_to :owner, polymorphic: true

    attribute :settings, :json, default: -> { Pagelet::Site.default_settings }

    validates :owner_id, uniqueness: { scope: :owner_type }
    validate :settings_shape

    def self.default_settings
      { "theme" => {}, "menu" => { "style" => "bar", "brand" => {}, "items" => [] } }
    end

    # The owner's settings, or the defaults when it has never saved any.
    def self.settings_for(owner)
      find_by(owner: owner)&.settings || default_settings
    end

    private

    def settings_shape
      problem = SiteCheck.problem(settings)
      errors.add(:settings, problem) if problem
    end
  end
end
