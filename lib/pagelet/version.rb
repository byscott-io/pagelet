# frozen_string_literal: true

module Pagelet
  # One version for the gem and the npm package, read from VERSION so the two
  # can never drift apart.
  VERSION = File.read(File.expand_path("../../VERSION", __dir__)).strip
end
