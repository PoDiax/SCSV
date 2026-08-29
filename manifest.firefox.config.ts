import packageJson from "./package.json" with { type: 'json' }

const { version, name, description } = packageJson

export default {
  manifest_version: 3,
  name: "__MSG_extensionName__",
  short_name: "SCSV",
  author: "PoDiax",
  description: "__MSG_extensionDescription__",
  default_locale: "en",
  version,
  icons: {
    16: "icon_16.png",
    48: "icon_48.png",
    128: "icon.png",
  },
  background: {
    scripts: ["src/background/background.ts"],
    type: "module",
  },
  permissions: ["storage", "alarms"],
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
    {
      js: ["src/content-script/WorkshopHighlighter.ts"],
      matches: [
        "https://steamcommunity.com/workshop/browse/*",
        "https://steamcommunity.com/workshop/browse*",
        "https://steamcommunity.com/app/*/workshop/*",
        "https://steamcommunity.com/app/*/workshop*",
        "https://steamcommunity.com/id/*/myworkshopfiles/*",
        "https://steamcommunity.com/id/*/myworkshopfiles*",
        "https://steamcommunity.com/profiles/*/myworkshopfiles/*",
        "https://steamcommunity.com/profiles/*/myworkshopfiles*"
      ],
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
      strict_min_version: "140.0",
      data_collection_permissions: {
        required: ["none"]
      }
    },
  },
}