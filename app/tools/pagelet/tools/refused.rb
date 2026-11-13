# frozen_string_literal: true

module Pagelet
  module Tools
    # A tool call that was not allowed or not valid; Base#run turns it into an
    # error the model can explain.
    class Refused < StandardError; end
  end
end
