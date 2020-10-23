import { Reporter } from "@parcel/plugin"
import path from "path"

const normalisePath = (p: string) => {
  return p.replace(/[\\/]+/g, "/")
}

export default new Reporter({
  // TODO: Add type definition for Reporter
  async report({ event, options }: any) {
    if (event.type !== "buildSuccess") {
      return
    }

    let bundlesByTarget = new Map()

    for (let bundle of event.bundleGraph.getBundles()) {
      if (!bundle.isInline) {
        let bundles = bundlesByTarget.get(bundle.target.distDir)

        if (!bundles) {
          bundles = []
          bundlesByTarget.set(bundle.target.distDir, bundles)
        }

        bundles.push(bundle)
      }
    }

    for (let [targetDir, bundles] of bundlesByTarget) {
      let manifest: Manifest = {}

      for (let bundle of bundles) {
        const mainEntry = bundle.getMainEntry()
        if (mainEntry) {
          const assetPath = mainEntry.filePath
          const assetName = normalisePath(
            // Fallback to rootDir for the current beta version
            // https://github.com/parcel-bundler/parcel/pull/4896 change to entryRoot in the current nightly version
            path.relative(options.entryRoot || options.rootDir, assetPath)
          )
          const bundleUrl = normalisePath(
            `${bundle.target.publicUrl}/${bundle.name}`
          )

          manifest[assetName] = bundleUrl
        }
      }

      const targetPath = `${targetDir}/${MANIFEST_FILENAME}`
      await options.outputFS.writeFile(targetPath, JSON.stringify(manifest))
      console.log(`📄 Wrote bundle manifest to: ${targetPath}`)
    }
  },
})

export type Manifest = { [assetName: string]: string }
export const MANIFEST_FILENAME = "parcel-manifest.json"
