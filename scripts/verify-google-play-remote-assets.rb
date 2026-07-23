#!/usr/bin/env ruby

require "bundler/setup"
require "digest"
require "google/apis/androidpublisher_v3"
require "googleauth"
require "json"
require "open-uri"

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
abort("Google Play metadata directory not found: #{metadata_root}") unless File.directory?(metadata_root)

image_sources = {
  "icon" => "icon.png",
  "featureGraphic" => "featureGraphic.png",
  "phoneScreenshots" => "phoneScreenshots",
  "sevenInchScreenshots" => "sevenInchScreenshots",
  "tenInchScreenshots" => "tenInchScreenshots"
}.freeze

locales = Dir.children(metadata_root).sort.select do |entry|
  File.directory?(File.join(metadata_root, entry, "images"))
end
abort("No Google Play image locales found under #{metadata_root}") if locales.empty?

service = Google::Apis::AndroidpublisherV3::AndroidPublisherService.new
service.authorization = Google::Auth::ServiceAccountCredentials.make_creds(
  json_key_io: File.open(json_key),
  scope: "https://www.googleapis.com/auth/androidpublisher"
)

edit = service.insert_edit(package_name)
failures = []

begin
  locales.each do |locale|
    images_root = File.join(metadata_root, locale, "images")

    image_sources.each do |image_type, local_name|
      local_path = File.join(images_root, local_name)
      local_files = if File.directory?(local_path)
                      Dir.glob(File.join(local_path, "*.{png,jpg,jpeg}"), File::FNM_CASEFOLD).sort
                    elsif File.file?(local_path)
                      [local_path]
                    else
                      []
                    end

      local_hashes = local_files.map { |file| Digest::SHA256.file(file).hexdigest }
      remote_images = service.list_edit_images(package_name, edit.id, locale, image_type).images || []
      remote_hashes = remote_images.map do |image|
        api_hash = image.sha256.to_s.downcase
        next api_hash if api_hash.match?(/\A[0-9a-f]{64}\z/)

        URI.open(image.url, read_timeout: 30) { |io| Digest::SHA256.hexdigest(io.read) }
      end

      expected_count = local_hashes.length
      remote_count = remote_hashes.length
      unique_count = remote_hashes.uniq.length
      content_matches = local_hashes == remote_hashes
      puts "#{locale} | #{image_type} | expected=#{expected_count} | remote=#{remote_count} | unique=#{unique_count}"

      next if expected_count == remote_count && remote_count == unique_count && content_matches

      failures << "#{locale}/#{image_type}: expected #{expected_count}, remote #{remote_count}, unique #{unique_count}, content=#{content_matches ? "match" : "mismatch"}"
    end
  end
ensure
  service.delete_edit(package_name, edit.id) rescue nil
end

unless failures.empty?
  warn "Google Play remote asset verification failed:"
  failures.each { |failure| warn "- #{failure}" }
  exit 1
end

puts "Google Play remote asset verification passed."
