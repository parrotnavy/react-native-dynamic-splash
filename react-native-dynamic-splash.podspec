require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-dynamic-splash"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.license      = package["license"]
  s.author       = package["author"]
  s.homepage     = package["homepage"]
  s.platforms    = { :ios => "12.0" }
  s.source       = { :git => "https://github.com/parrotnavy/react-native-dynamic-splash", :tag => s.version.to_s }
  s.source_files = "ios/**/*.{swift,m}"
  s.swift_version = "5.0"
  s.requires_arc = true
  s.dependency "React-Core"
end
