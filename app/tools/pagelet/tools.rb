# frozen_string_literal: true

module Pagelet
  # Page editing for AI assistants (docs/AI_TOOLS.md). Each tool is a plain
  # class an app wraps in its own AI library's tool type:
  #
  #   context = Pagelet::Tools::Context.new(owner: church, can: ->(action, page) { ... },
  #                                         preview_url: ->(page) { "https://.../preview/#{page.id}" })
  #   Pagelet::Tools.classes.each do |tool|
  #     tool.tool_name, tool.tool_description, tool.tool_schema   # what the model sees
  #     tool.new(context).run(arguments)                           # a Hash for the model
  #   end
  module Tools
    def self.classes
      [ListPages, GetPage, ListBlocks, CreatePage, UpdatePage, PublishPage, UnpublishPage, DeletePage, GetSite,
       UpdateSite]
    end
  end
end
