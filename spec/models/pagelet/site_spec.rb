# frozen_string_literal: true

RSpec.describe Pagelet::Site do
  let(:site_owner) { Site.create!(name: "Ours") }

  # Class-level as well, because the table of refusals below is built when the
  # file loads, outside any example.
  def self.menu(items, style: "bar")
    { "theme" => {}, "menu" => { "style" => style, "brand" => {}, "items" => items } }
  end

  def menu(...) = self.class.menu(...)

  it "gives defaults to an owner that never saved settings" do
    expect(described_class.settings_for(site_owner)).to eq(described_class.default_settings)
  end

  it "stores a theme and a menu" do
    settings = menu([{ "label" => "Mission", "href" => "/mission", "group" => "left" },
                     { "label" => "Join us!", "href" => "https://maps.example.com", "icon" => "location",
                       "highlight" => true, "group" => "right" }])
    described_class.create!(owner: site_owner, settings: settings)
    expect(described_class.settings_for(site_owner).dig("menu", "items", 1, "label")).to eq("Join us!")
  end

  it "keeps one settings record per owner" do
    described_class.create!(owner: site_owner)
    expect { described_class.create!(owner: site_owner) }.to raise_error(ActiveRecord::RecordInvalid)
  end

  {
    "an unknown menu style" => [menu([], style: "zigzag"), /style must be one of/],
    "an item without a label" => [menu([{ "label" => "", "href" => "/x" }]), /item 1 needs a label/],
    "an item without a link" => [menu([{ "label" => "X" }]), /item 1 needs a link/],
    "an item in an unknown group" => [menu([{ "label" => "X", "href" => "/x", "group" => "middle" }]), /left or right/],
    "a menu that is not an object" => [{ "menu" => [] }, /menu must be an object/],
    "too many items" => [menu(Array.new(51) { { "label" => "X", "href" => "/x" } }), /more than 50/]
  }.each do |description, (settings, message)|
    it "refuses #{description}" do
      record = described_class.new(owner: site_owner, settings: settings)
      expect(record).not_to be_valid
      expect(record.errors[:settings].join).to match(message)
    end
  end
end
