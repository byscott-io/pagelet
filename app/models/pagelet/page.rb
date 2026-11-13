# frozen_string_literal: true

module Pagelet
  # One page of a site. The draft is what the editor works on; visitors only
  # ever see the published version. Every publish is kept as a numbered
  # version, so a page can always be rolled back.
  class Page < ApplicationRecord
    PATH_FORMAT = %r{\A/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9]+(?:-[a-z0-9]+)*)*)?\z}

    belongs_to :owner, polymorphic: true
    belongs_to :published_version, class_name: "Pagelet::PageVersion", optional: true
    has_many :versions, -> { order(:number) }, class_name: "Pagelet::PageVersion",
                                               inverse_of: :page, dependent: :delete_all

    validates :title, presence: true
    validates :path, presence: true, uniqueness: { scope: %i[owner_type owner_id] },
                     format: { with: PATH_FORMAT, message: "must look like / or /about or /about/staff" }
    validate :draft_is_a_page_document

    attribute :draft_document, :json, default: -> { Pagelet.empty_document }

    before_validation :normalize_path

    scope :owned_by, ->(owner) { where(owner: owner) }
    scope :published, -> { where.not(published_version_id: nil) }

    # The published document at this path, for rendering. nil when there is no
    # such page or it has never been published.
    def self.published_document(owner, path)
      owned_by(owner).published.includes(:published_version)
                     .find_by(path: normalize(path))&.published_version&.document
    end

    # Published pages for a sitemap: [{ path:, updated_at: }].
    def self.sitemap_entries(owner)
      owned_by(owner).published.includes(:published_version).order(:path).map do |page|
        { path: page.path, updated_at: page.published_version.published_at }
      end
    end

    def self.normalize(path)
      value = path.to_s.strip.downcase
      value = "/#{value}" unless value.start_with?("/")
      value.length > 1 ? value.chomp("/") : value
    end

    # Publish the current draft as the next numbered version.
    def publish!(published_by: nil)
      transaction do
        lock!
        version = versions.create!(
          number: (versions.maximum(:number) || 0) + 1,
          document: draft_document,
          published_at: Time.current,
          published_by: published_by
        )
        update!(published_version: version)
        version
      end
    end

    # Put an earlier version's content back into the draft. Publishing it is a
    # separate step, so a rollback is reviewed like any other change and
    # history is only ever added to.
    def restore!(version)
      raise ArgumentError, "version belongs to another page" unless version.page_id == id

      update!(draft_document: version.document)
    end

    def published?
      published_version_id.present?
    end

    private

    def normalize_path
      self.path = self.class.normalize(path) if path.present?
    end

    def draft_is_a_page_document
      error = DocumentCheck.problem(draft_document)
      errors.add(:draft_document, error) if error
    end
  end
end
