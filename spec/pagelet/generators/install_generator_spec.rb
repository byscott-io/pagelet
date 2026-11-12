# frozen_string_literal: true

require "generators/pagelet/install/install_generator"
require "tmpdir"

RSpec.describe Pagelet::Generators::InstallGenerator do
  let(:root) { Dir.mktmpdir }

  before do
    FileUtils.mkdir_p(File.join(root, "config"))
    File.write(File.join(root, "config/routes.rb"), "Rails.application.routes.draw do\nend\n")
  end

  after { FileUtils.remove_entry(root) }

  def run_generator
    generator = described_class.new([], {}, destination_root: root)
    allow(generator).to receive(:rake) # copying migrations needs a booted host app
    allow(generator).to receive(:say)
    generator.invoke_all
    generator
  end

  it "writes an initializer that refuses to run until it is filled in" do
    run_generator
    initializer = File.read(File.join(root, "config/initializers/pagelet.rb"))
    expect(initializer).to include("config.owner", "config.authorize")
    # Unedited, nobody is authorized: the safe default.
    expect(initializer).to include("config.authorize = ->(_controller, _action, _page) { false }")
  end

  it "mounts the engine and copies the migrations" do
    generator = run_generator
    expect(File.read(File.join(root, "config/routes.rb"))).to include('mount Pagelet::Engine, at: "/pagelet"')
    expect(generator).to have_received(:rake).with("pagelet:install:migrations")
  end
end
