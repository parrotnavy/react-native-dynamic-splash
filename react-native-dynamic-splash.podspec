require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-dynamic-splash"
  s.version      = package["version"]
  s.summary      = package["description"] || "Dynamic splash screen for React Native"
  s.license      = package["license"] || "MIT"
  s.author       = package["author"] || {}
  s.homepage     = package["homepage"] || "https://github.com/your-org/react-native-dynamic-splash"
  s.platforms    = { :ios => "12.0" }
  s.source       = { :git => "https://github.com/your-org/react-native-dynamic-splash.git", :tag => s.version.to_s }
  s.source_files = "ios/**/*.{swift,m}"
  s.swift_version = "5.0"
  s.requires_arc = true
  s.dependency "React-Core"
end
