declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '~/package.json' {
  interface PackageJson {
    name: string
    version: string
    description: string
  }
  const packageJson: PackageJson
  export = packageJson
}