# frozen_string_literal: true

module PageletSpecHelpers
  def page_document(text = "Hello")
    { "pagelet" => 1,
      "data" => { "root" => { "props" => {} },
                  "content" => [{ "type" => "Heading", "props" => { "id" => "h", "text" => text } }] } }
  end
end

RSpec.configure { |config| config.include PageletSpecHelpers }
