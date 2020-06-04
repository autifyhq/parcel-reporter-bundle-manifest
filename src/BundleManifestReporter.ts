import { Reporter } from '@parcel/plugin'
import path from 'path'

export default new Reporter({
  async report({ event, options }: any) { // TODO: Add type definition for Reporter
    if (event.type !== 'buildSuccess') {
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
      let manifest: { [assetName: string]: string } = {}

      for (let bundle of bundles) {
        const assetPath = bundle.getMainEntry().filePath
        const assetName = path.basename(assetPath)
        manifest[assetName] = bundle.name
      }

      await options.outputFS.writeFile(`${targetDir}/parcel-manifest.json`, JSON.stringify(manifest))
    }
  }
})
