# frozen_string_literal: true

Pagelet::Engine.routes.draw do
  get "published", to: "published#show"

  resources :pages, only: %i[index show create update destroy] do
    post :publish, on: :member
    resources :versions, only: :index do
      post ":number/restore", action: :restore, on: :collection, as: :restore, constraints: { number: /\d+/ }
    end
  end
end
