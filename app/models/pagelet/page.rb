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

    # What a visitor at this path sees, for rendering:
    #   Match = (document, page_path, rest)
    # An exact page wins. Otherwise the longest page marked matches_subpaths
    # whose path is a prefix of this one, with the remainder in rest: a page at
    # /messages serves /messages/43 with rest "43". nil when nothing published
    # matches.
    Match = Struct.new(:document, :page_path, :rest, keyword_init: true)

    def self.published_match(owner, path)
      path = normalize(path)
      pages = owned_by(owner).published.includes(:published_version)

      exact = pages.find_by(path: path)
      return match_for(exact, "") if exact

      prefix = longest_prefix(pages, path)
      prefix && match_for(prefix, path.delete_prefix(prefix.path == "/" ? "/" : "#{prefix.path}/"))
    end

    def self.longest_prefix(pages, path)
      candidates = pages.where(matches_subpaths: true).select { |page| subpath?(path, page.path) }
      candidates.max_by { |page| page.path.length }
    end

    def self.match_for(page, rest)
      Match.new(document: page.published_version.document, page_path: page.path, rest: rest)
    end

    def self.subpath?(path, base)
      base == "/" ? path != "/" : path.start_with?("#{base}/")
    end

    # The published document at this path (see published_match), or nil.
    def self.published_document(owner, path)
      published_match(owner, path)&.document
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
