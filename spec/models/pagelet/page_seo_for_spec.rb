# frozen_string_literal: true

RSpec.describe Pagelet::PageSeo, ".for" do
  let(:site) { Site.create!(name: "Ours") }

  def publish(path, root: {}, content: [], subpaths: false)
    document = { "pagelet" => 1, "data" => { "root" => { "props" => root }, "content" => content } }
    Pagelet::Page.create!(owner: site, path: path, title: path, matches_subpaths: subpaths,
                          draft_document: document).tap(&:publish!)
  end

  def block(type, props) = { "type" => type, "props" => { "id" => "#{type}-1" }.merge(props) }

  it "takes the title and description from the page's own settings" do
    publish("/mission", root: { "title" => "Mission", "description" => "Why we are here." },
                        content: [block("Text", "text" => "Body text")])

    expect(described_class.for(site, "/mission")).to eq("title" => "Mission", "description" => "Why we are here.")
  end

  it "uses the start of the first prose when the description is blank, skipping headings" do
    publish("/about", root: { "title" => "About", "description" => "  " },
                      content: [block("Heading", "text" => "About us"),
                                block("Text", "text" => "We meet\n  on Sundays.")])

    expect(described_class.for(site, "/about")["description"]).to eq("We meet on Sundays.")
  end

  it "finds text inside a layout block's slot" do
    publish("/contact", root: { "title" => "Contact" },
                        content: [block("Columns", "first" => [block("Text", "text" => "Call us any day.")])])

    expect(described_class.for(site, "/contact")["description"]).to eq("Call us any day.")
  end

  it "trims a long excerpt at a word, under the limit" do
    publish("/long", content: [block("Text", "text" => ("word " * 100))])
    description = described_class.for(site, "/long")["description"]

    expect(description.length).to be <= described_class::DESCRIPTION_LENGTH
    expect(description).to end_with("word…")
  end

  it "says nothing for a sub-path, which is another page to a search engine" do
    publish("/messages", root: { "title" => "Messages" }, subpaths: true)

    expect(described_class.for(site, "/messages")).to eq("title" => "Messages")
    expect(described_class.for(site, "/messages/43")).to be_nil
  end

  it "says nothing where nothing is published, and for a page with neither" do
    Pagelet::Page.create!(owner: site, path: "/draft", title: "Draft", draft_document: page_document)
    publish("/empty")

    expect(described_class.for(site, "/draft")).to be_nil
    expect(described_class.for(site, "/empty")).to be_nil
  end
end
