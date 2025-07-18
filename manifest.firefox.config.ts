import packageJson from "./package.json"

const { version, name, description } = packageJson

export default {
  manifest_version: 3,
  name: "Steam Collection Size Viewer",
  short_name: "SCSV",
  author: "PoDiax",
  description,
  version,
  icons: {
    16: "icon_16.png",
    48: "icon_48.png",
    128: "icon.png",
  },
  permissions: ["activeTab", "storage"],
  host_permissions: [
    "https://steamcommunity.com/sharedfiles/filedetails/*",
    "https://steamcommunity.com/workshop/filedetails/*",
    "https://api.steampowered.com/*",
  ],
  content_scripts: [
    {
      matches: [
        "https://steamcommunity.com/sharedfiles/filedetails/*",
        "https://steamcommunity.com/workshop/filedetails/*",
      ],
      js: ["src/content-script/index.ts"],
    },
  ],
  action: {
    default_popup: "src/ui/popup/index.html",
    default_icon: {
      16: "icon_16.png",
      48: "icon_48.png",
      128: "icon.png",
    },
    default_title: "Steam Collection Size Viewer",
  },
  browser_specific_settings: {
    gecko: {
      id: "podiax@pdx.ovh",
      strict_min_version: "109.0",
    },
  },
}