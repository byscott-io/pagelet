# frozen_string_literal: true

module Pagelet
  module Tools
    class ListPages < Base
      tool "pagelet_list_pages", "List the site's pages: address, title, whether each is published, and a preview link."

      def call(_arguments)
        authorize!(:edit)
        { "pages" => context.pages.order(:path).map { |page| summary(page) } }
      end
    end
  end
end
