#!/usr/bin/env ruby

require "bundler/setup"
require "google/apis/androidpublisher_v3"
require "googleauth"
require "json"

project_root = File.expand_path("..", __dir__)
metadata_root = ENV["ANDROID_METADATA_ROOT"]
metadata_root = File.join(project_root, "fastlane", "metadata", "android") if metadata_root.to_s.empty?
json_key = ENV["SUPPLY_JSON_KEY"]
json_key = File.join(project_root, "credentials", "play-service-account.json") if json_key.to_s.empty?

config_path = ["app.base.json", "app.json"].map { |name| File.join(project_root, name) }.find { |path| File.exist?(path) }
abort("Expo app config not found under #{project_root}") unless config_path
app_config = JSON.parse(File.read(config_path))
package_name = ENV["ANDROID_PACKAGE_NAME"]
package_name = app_config.dig("expo", "android", "package") if package_name.to_s.empty?

abort("Android package name is missing") if package_name.to_s.empty?
abort("Google Play service account key not found: #{json_key}") unless File.exist?(json_key)

assets = {
  "icon" => "icon.png",
  "featureGraphic" => "featureGraphic.png"
}.freeze
locales = Dir.children(metadata_root).sort.select do |entry|
  File.directory?(File.join(metadata_root, entry, "images"))
end

service = Google::Apis::AndroidpublisherV3::AndroidPublisherService.new
service.authorization = Google::Auth::ServiceAccountCredentials.make_creds(
  json_key_io: File.open(json_key),
  scope: "https://www.googleapis.com/auth/androidpublisher"
)

edit = service.insert_edit(package_name)

begin
  locales.each do |locale|
    assets.each do |image_type, filename|
      local_path = File.join(metadata_root, locale, "images", filename)
      abort("Missing #{locale}/#{image_type}: #{local_path}") unless File.file?(local_path)

      service.deleteall_edit_image(package_name, edit.id, locale, image_type)
      service.upload_edit_image(
        package_name,
        edit.id,
        locale,
        image_type,
        upload_source: local_path,
        content_type: "image/png"
      )
      puts "Uploaded #{locale}/#{image_type}"
    end
  end

  # Rejected or draft apps can require store-listing changes to remain pending
  # until they are explicitly sent for review from Play Console.
  service.commit_edit(package_name, edit.id, changes_not_sent_for_review: true)
rescue StandardError => error
  warn error.body if error.respond_to?(:body) && !error.body.to_s.empty?
  service.delete_edit(package_name, edit.id) rescue nil
  raise
end

puts "Google Play static assets committed."
