# frozen_string_literal: true

class CsrfController < ApplicationController
  def show
    render json: { token: form_authenticity_token }
  end
end
