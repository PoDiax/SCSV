import type { ManifestV3Export } from "@crxjs/vite-plugin"
import packageJson from "./package.json" with { type: 'json' }

const { version, name, description } = packageJson

export default {
  name: "Steam Collection Size Viewer",
  short_name: "SCSV",
  description,
  version,
  manifest_version: 3,
  author: { "email": "pd@pdx.ovh" },
  icons: {
    16: "icon_16.png",
    48: "icon_48.png",
    128: "icon.png",
  },
  action: {
    default_icon: "icon.png",
    default_popup: "src/ui/popup/index.html",
  },
  background: {
    service_worker: "src/background/background.ts",
    type: "module",
  },
  permissions: ["storage", "alarms"],
  host_permissions: [
    "https://steamcommunity.com/sharedfiles/filedetails/*",
    "https://steamcommunity.com/workshop/filedetails/*",
    "https://api.steampowered.com/*",
  ],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
  content_scripts: [
    {
      js: ["src/content-script/index.ts"],
      matches: [
        "https://steamcommunity.com/sharedfiles/filedetails/*",
        "https://steamcommunity.com/workshop/filedetails/*",
      ],
    },
    {
      js: ["src/content-script/WorkshopHighlighter.ts"],
      matches: [
        "https://steamcommunity.com/workshop/browse/*",
        "https://steamcommunity.com/app/*/workshop/*",
        "https://steamcommunity.com/id/*/myworkshopfiles/*",
        "https://steamcommunity.com/profiles/*/myworkshopfiles/*"
      ],
    }
  ],
} as ManifestV3Export