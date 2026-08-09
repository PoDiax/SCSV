import { crx } from "@crxjs/vite-plugin"
import { defineConfig, mergeConfig, UserConfig, PluginOption } from "vite"
import zipPack from "vite-plugin-zip-pack"
import manifest from "./manifest.chrome.config.ts"
import packageJson from "./package.json" with { type: 'json' }
import baseConfig from "./vite.config.ts"
import chalk from "chalk"

const IS_DEV = process.env.NODE_ENV === "development"
const browser = "chrome"
const outDir = "dist"
const browserOutDir = `${outDir}/${browser}`
const outFileName = `${browser}-${packageJson.version}.zip`

const printMessage = (isDev: boolean): void => {
  setTimeout(() => {
    console.info("\n")
    console.info(chalk.greenBright(`✅ Successfully built for ${browser}.`))
    if (isDev) {
      console.info(
        chalk.greenBright(
          `🚀 Load the extension via ${browser}://extensions/, enable "Developer mode", click "Load unpacked", and select the directory:`
        )
      )
      console.info(chalk.greenBright(`📂 ${browserOutDir}`))
    } else {
      console.info(
        chalk.greenBright(
          `📦 Zip File: ${outDir}/${outFileName} (Upload to the store)`
        )
      )
      console.info(chalk.greenBright(`🚀 Load manually from ${browserOutDir}`))
    }
    console.info("\n")
  }, 50)
}

const createBuildMessagePlugin = (isDev: boolean): PluginOption => ({
  name: "vite-plugin-build-message",
  enforce: "post" as const,
  ...(isDev
    ? {
        configureServer(server) {
          server.httpServer?.once("listening", () => printMessage(true))
        },
      }
    : {}),
  closeBundle: { sequential: true, handler: () => printMessage(isDev) },
})

export default defineConfig(() => {
  const browserPlugins: PluginOption[] = [
    crx({
      manifest,
      browser,
      contentScripts: { injectCss: true },
    }),
    createBuildMessagePlugin(IS_DEV),
  ]

  if (!IS_DEV) {
    browserPlugins.push(
      zipPack({
        inDir: browserOutDir,
        outDir,
        outFileName,
        filter: (_, filePath, isDirectory) =>
          !(isDirectory && filePath.includes(".vite")),
      }) as PluginOption
    )
  }

  const browserConfig: UserConfig = {
    build: {
      outDir: browserOutDir,
    },
    plugins: browserPlugins,
  }

  return mergeConfig(baseConfig, browserConfig)
})