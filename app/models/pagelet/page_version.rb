# frozen_string_literal: true

module Pagelet
  # A published snapshot of a page. Never edited after it is written.
  class PageVersion < ApplicationRecord
    belongs_to :page, class_name: "Pagelet::Page", inverse_of: :versions

    validates :number, presence: true, uniqueness: { scope: :page_id }
    validates :published_at, presence: true

    before_update { raise ActiveRecord::ReadOnlyRecord, "published versions are never edited" }
  end
end
