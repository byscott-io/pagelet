# frozen_string_literal: true

module Pagelet
  # Checks that a value is a page document this gem can store:
  #   { "pagelet" => 1, "data" => { "root" => {...}, "content" => [...] } }
  # Returns nil when it is fine, or a message saying what is wrong.
  module DocumentCheck
    module_function

    def problem(document)
      return "must be a page document object" unless document.is_a?(Hash)

      version_problem(document["pagelet"] || document[:pagelet]) ||
        data_problem(document["data"] || document[:data]) ||
        size_problem(document)
    end

    def version_problem(version)
      return "is missing its pagelet format version" unless version.is_a?(Integer) && version.positive?
      return if version <= Pagelet::DOCUMENT_VERSION

      "was saved by a newer pagelet (format #{version}); upgrade the pagelet gem"
    end

    def data_problem(data)
      "has no page data" unless data.is_a?(Hash)
    end

    def size_problem(document)
      limit = Pagelet.config.max_document_bytes
      size = document.to_json.bytesize
      "is too large (#{size} bytes; the limit is #{limit})" if size > limit
    end
  end
end
