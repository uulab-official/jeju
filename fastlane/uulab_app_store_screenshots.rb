require "digest/md5"
require "digest/sha2"
require "deliver/app_screenshot"
require "spaceship"

module UulabAppStoreScreenshots
  module_function

  def version(app_identifier:, apple_id:, team_id:, expected_version:, editable_only: true)
    Spaceship::ConnectAPI.login(
      apple_id,
      nil,
      use_portal: false,
      use_tunes: true,
      tunes_team_id: team_id
    )

    app = Spaceship::ConnectAPI::App.find(app_identifier)
    FastlaneCore::UI.user_error!("App Store Connect app not found: #{app_identifier}") unless app

    editable = app.get_edit_app_store_version(platform: Spaceship::ConnectAPI::Platform::IOS)
    candidates = if editable_only
                   [editable]
                 else
                   [
                     editable,
                     app.get_in_review_app_store_version(platform: Spaceship::ConnectAPI::Platform::IOS),
                     app.get_pending_release_app_store_version(platform: Spaceship::ConnectAPI::Platform::IOS),
                     app.get_live_app_store_version(platform: Spaceship::ConnectAPI::Platform::IOS)
                   ]
                 end

    matched = candidates.compact.find { |candidate| candidate.version_string == expected_version }
    state_label = editable_only ? "editable" : "editable, in-review, pending-release, or live"
    unless matched
      FastlaneCore::UI.user_error!("No #{state_label} App Store version #{expected_version} is available for screenshot verification")
    end

    matched
  end

  def local_manifest(screenshots_path)
    files = Dir.glob(File.join(screenshots_path, "*", "*.{png,jpg,jpeg}"), File::FNM_CASEFOLD).sort
    FastlaneCore::UI.user_error!("No local App Store screenshots found: #{screenshots_path}") if files.empty?

    files.each_with_object(Hash.new { |hash, key| hash[key] = [] }) do |file, manifest|
      relative_path = file.delete_prefix("#{screenshots_path}/")
      locale = relative_path.split("/").first
      screenshot = Deliver::AppScreenshot.new(file, locale)
      FastlaneCore::UI.user_error!("Unsupported App Store screenshot dimensions: #{relative_path}") if screenshot.display_type.nil?

      manifest[[locale, screenshot.display_type]] << {
        file_name: File.basename(file),
        checksum: Digest::MD5.file(file).hexdigest
      }
    end
  end

  def remote_manifest(version)
    version.get_app_store_version_localizations.each_with_object(Hash.new { |hash, key| hash[key] = [] }) do |localization, manifest|
      localization.get_app_screenshot_sets(includes: "appScreenshots").each do |screenshot_set|
        key = [localization.locale, screenshot_set.screenshot_display_type]
        manifest[key].concat((screenshot_set.app_screenshots || []).map do |screenshot|
          {
            file_name: screenshot.file_name,
            checksum: screenshot.source_file_checksum,
            screenshot: screenshot
          }
        end)
      end
    end
  end

  def problems(local_manifest:, remote_manifest:)
    (local_manifest.keys | remote_manifest.keys).sort.flat_map do |locale, display_type|
      local_entries = local_manifest.fetch([locale, display_type], [])
      remote_entries = remote_manifest.fetch([locale, display_type], [])
      local_checksums = local_entries.map { |entry| entry[:checksum] }
      remote_checksums = remote_entries.map { |entry| entry[:checksum].to_s }
      slot_problems = []

      if local_checksums.uniq.length != local_checksums.length
        slot_problems << "#{locale}/#{display_type}: local screenshot contents are not unique"
      end

      missing_checksums = remote_checksums.count(&:empty?)
      if missing_checksums.positive?
        slot_problems << "#{locale}/#{display_type}: #{missing_checksums} remote screenshot checksum(s) missing"
      end

      if local_checksums != remote_checksums
        unique_remote = remote_checksums.reject(&:empty?).uniq.length
        slot_problems << "#{locale}/#{display_type}: expected #{local_checksums.length} ordered local screenshot(s), found #{remote_checksums.length} remote screenshot(s) with #{unique_remote} unique checksum(s)"
      end

      slot_problems
    end
  end

  def manifest_fingerprint(manifest)
    serialized = manifest.keys.sort.map do |locale, display_type|
      entries = manifest.fetch([locale, display_type], [])
      [locale, display_type, entries.map { |entry| entry[:checksum].to_s }]
    end
    Digest::SHA256.hexdigest(Marshal.dump(serialized))
  end

  def verify!(version:, screenshots_path:, attempts: 1, retry_delay: 10, required_clean_reads: 1)
    FastlaneCore::UI.user_error!("required_clean_reads must be at least 1") if required_clean_reads < 1
    FastlaneCore::UI.user_error!("attempts must cover required_clean_reads") if attempts < required_clean_reads

    local = local_manifest(screenshots_path)
    failures = []
    clean_reads = 0
    previous_fingerprint = nil

    attempts.times do |attempt|
      remote = remote_manifest(version)
      failures = problems(local_manifest: local, remote_manifest: remote)

      if failures.empty?
        fingerprint = manifest_fingerprint(remote)
        clean_reads = fingerprint == previous_fingerprint ? clean_reads + 1 : 1
        previous_fingerprint = fingerprint
        break if clean_reads >= required_clean_reads
      else
        clean_reads = 0
        previous_fingerprint = nil
      end

      break if attempt == attempts - 1

      FastlaneCore::UI.message("App Store screenshots are still processing; retrying integrity check (#{attempt + 2}/#{attempts})")
      sleep(retry_delay)
    end

    if failures.empty? && clean_reads < required_clean_reads
      failures = ["remote screenshot inventory did not remain stable for #{required_clean_reads} consecutive reads"]
    end

    unless failures.empty?
      FastlaneCore::UI.user_error!(["App Store screenshot integrity check failed:", *failures.map { |failure| "- #{failure}" }].join("\n"))
    end

    FastlaneCore::UI.success("Verified App Store screenshots: #{local.values.sum(&:length)} local and remote screenshot(s) match exactly across #{clean_reads} stable read(s)")
  end

  def reconcile!(version:, screenshots_path:, attempts: 8, retry_delay: 10, required_clean_reads: 2)
    FastlaneCore::UI.user_error!("required_clean_reads must be at least 2 for reconciliation") if required_clean_reads < 2
    FastlaneCore::UI.user_error!("attempts must cover required_clean_reads") if attempts < required_clean_reads

    local = local_manifest(screenshots_path)
    failures = []
    clean_reads = 0
    previous_fingerprint = nil

    attempts.times do |attempt|
      deleted_count = deduplicate!(version: version)
      remote = remote_manifest(version)
      failures = problems(local_manifest: local, remote_manifest: remote)

      if failures.empty? && deleted_count.zero?
        fingerprint = manifest_fingerprint(remote)
        clean_reads = fingerprint == previous_fingerprint ? clean_reads + 1 : 1
        previous_fingerprint = fingerprint
        break if clean_reads >= required_clean_reads
      else
        clean_reads = 0
        previous_fingerprint = nil
      end

      break if attempt == attempts - 1

      FastlaneCore::UI.message("App Store screenshots are still processing; reconciling again (#{attempt + 2}/#{attempts})")
      sleep(retry_delay)
    end

    if failures.empty? && clean_reads < required_clean_reads
      failures = ["remote screenshot inventory did not remain stable for #{required_clean_reads} consecutive clean reads"]
    end

    unless failures.empty?
      FastlaneCore::UI.user_error!(["App Store screenshot reconciliation failed:", *failures.map { |failure| "- #{failure}" }].join("\n"))
    end

    FastlaneCore::UI.success("Reconciled App Store screenshots: #{local.values.sum(&:length)} unique local and remote screenshot(s) match exactly across #{clean_reads} stable read(s)")
  end

  def deduplicate!(version:)
    deleted_count = 0

    remote_manifest(version).each do |(locale, display_type), screenshots|
      groups = screenshots
               .reject { |screenshot| screenshot[:checksum].to_s.empty? }
               .group_by { |screenshot| screenshot[:checksum] }

      groups.each_value do |matches|
        next if matches.length < 2

        matches.drop(1).each do |duplicate|
          duplicate[:screenshot].delete!
          deleted_count += 1
          FastlaneCore::UI.message("Removed duplicate App Store screenshot: #{locale}/#{display_type}/#{duplicate[:file_name]}")
        end
      end
    end

    if deleted_count.zero?
      FastlaneCore::UI.message("No duplicate App Store screenshots found")
    else
      FastlaneCore::UI.success("Removed #{deleted_count} duplicate App Store screenshot(s)")
    end

    deleted_count
  end
end
