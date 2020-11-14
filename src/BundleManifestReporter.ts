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
        /**
         * Use main entry first as the key of the manifest, and fallback to the first asset of the bundle if main entry doesn't exist.
         * 
         * Some bundle doesn't have a main entry (`bundle.getMainEntry()`); e.g. CSS bundle that's the result of CSS files imported from JS.
         * 
         * The bundle could have multiple assets; e.g. multiple CSS files combined into one bundle,
         * so we only choose the first one to avoid multiple bundle in the manifest.
         * 
         * We cannot use the bundled file name without hash as a key because there' might be only hash; e.g. styles.css -> asdfjkl.css.
         */
        const asset = bundle.getMainEntry() ?? bundle.getEntryAssets()[0]
        if (asset) {
          const assetPath = asset.filePath
          const assetName = normalisePath(
            // Fallback to rootDir for the current beta version
            // https://github.com/parcel-bundler/parcel/pull/4896 change to entryRoot in the current nightly version
            path.relative(options.entryRoot ?? options.rootDir, assetPath)
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
