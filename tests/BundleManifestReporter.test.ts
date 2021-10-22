import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import { MANIFEST_FILENAME, Manifest } from "../src/BundleManifestReporter"

jest.setTimeout(120000)

beforeAll(() => {
  execSync("npm run build")
})

test("parcel", async () => {
  process.chdir(path.join(__dirname, "./fixtures/parcel"))
  await buildAndAssertManifestFile()
})

test("js-import-css", async () => {
  process.chdir(path.join(__dirname, "./fixtures/js-import-css"))
  await buildAndAssertManifestFile()
})

async function buildAndAssertManifestFile() {
  execSync(
    "rm -rf package-lock.json .parcel-cache dist node_modules && npm install && npm run build"
  )
  const parcelManifest = JSON.parse(
    fs.readFileSync(`./dist/${MANIFEST_FILENAME}`).toString()
  )
  const filenames = fs.readdirSync("./dist")

  const expected: Manifest = {}
  for (const filename of filenames) {
    if (filename === MANIFEST_FILENAME || filename.includes(".map")) {
      continue
    }
    const splittedFileName = filename.split(".")
    if (splittedFileName.length > 2) {
      const sourceMap = JSON.parse(
        fs.readFileSync(`./dist/${filename}.map`).toString()
      ) as { sources: string[] }
      const splittedSourcePath = sourceMap.sources[0].split("/")
      const sourceName = splittedSourcePath[splittedSourcePath.length - 1]
      expected[sourceName] = "/" + filename
    } else {
      expected[filename] = "/" + filename
    }
  }

  expect(parcelManifest).toEqual(expected)
}
