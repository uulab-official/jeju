#!/usr/bin/env ruby

require "minitest/autorun"

helper_path = [
  File.join(__dir__, "uulab-app-store-screenshots.rb"),
  File.expand_path("../fastlane/uulab_app_store_screenshots.rb", __dir__)
].find { |path| File.exist?(path) }
abort("App Store screenshot helper was not found") unless helper_path
require helper_path

class UulabAppStoreScreenshotsTest < Minitest::Test
  LOCAL = {
    ["ko", "APP_IPHONE_67"] => [
      { file_name: "01.png", checksum: "aaa" },
      { file_name: "02.png", checksum: "bbb" }
    ]
  }.freeze

  CLEAN_REMOTE = {
    ["ko", "APP_IPHONE_67"] => [
      { file_name: "01.png", checksum: "aaa" },
      { file_name: "02.png", checksum: "bbb" }
    ]
  }.freeze

  DUPLICATE_REMOTE = {
    ["ko", "APP_IPHONE_67"] => [
      { file_name: "01.png", checksum: "aaa" },
      { file_name: "02.png", checksum: "bbb" },
      { file_name: "02-copy.png", checksum: "bbb" }
    ]
  }.freeze

  def replace_module_method(name, implementation)
    singleton = UulabAppStoreScreenshots.singleton_class
    original = singleton.instance_method(name)
    singleton.define_method(name, implementation)
    yield
  ensure
    singleton.define_method(name, original)
  end

  def test_duplicate_remote_manifest_fails_count_and_uniqueness_check
    failures = UulabAppStoreScreenshots.problems(
      local_manifest: LOCAL,
      remote_manifest: DUPLICATE_REMOTE
    )

    assert_equal 1, failures.length
    assert_includes failures.first, "found 3 remote screenshot(s) with 2 unique checksum(s)"
  end

  def test_reconcile_requires_two_clean_reads_after_the_last_deletion
    delete_counts = [1, 0, 0]
    deduplicate_calls = 0

    replace_module_method(:local_manifest, ->(_path) { LOCAL }) do
      replace_module_method(:remote_manifest, ->(_version) { CLEAN_REMOTE }) do
        replace_module_method(:deduplicate!, lambda { |version:|
          deduplicate_calls += 1
          delete_counts.shift || 0
        }) do
          UulabAppStoreScreenshots.reconcile!(
            version: Object.new,
            screenshots_path: "/unused",
            attempts: 3,
            retry_delay: 0,
            required_clean_reads: 2
          )
        end
      end
    end

    assert_equal 3, deduplicate_calls
  end

  def test_verify_rejects_a_transient_clean_read_followed_by_a_duplicate
    manifests = [CLEAN_REMOTE, DUPLICATE_REMOTE]

    error = assert_raises(StandardError) do
      replace_module_method(:local_manifest, ->(_path) { LOCAL }) do
        replace_module_method(:remote_manifest, ->(_version) { manifests.shift }) do
          UulabAppStoreScreenshots.verify!(
            version: Object.new,
            screenshots_path: "/unused",
            attempts: 2,
            retry_delay: 0,
            required_clean_reads: 2
          )
        end
      end
    end

    assert_includes error.message, "integrity check failed"
  end
end
