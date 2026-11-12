# frozen_string_literal: true

module Pagelet
  class ApplicationRecord < ActiveRecord::Base
    self.abstract_class = true
  end
end
