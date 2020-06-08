import { exec } from 'child_process'
import util from 'util'
import fs from 'fs'
import path from 'path'
import { MANIFEST_FILENAME, Manifest } from '../src/BundleManifestReporter'

const promisifiedExec = util.promisify(exec)

jest.setTimeout(120000)

beforeAll(() => {
  return promisifiedExec('npm run build')
})

test('parcel-alpha', async () => {
  process.chdir(path.join(__dirname, './fixtures/parcel-alpha'))
  await buildAndAssertManifestFile()
})

test('parcel-nightly', async () => {
  process.chdir(path.join(__dirname, './fixtures/parcel-nightly'))
  await buildAndAssertManifestFile()
})

async function buildAndAssertManifestFile() {
  await promisifiedExec('rm -rf .parcel-cache dist node_modules && npm install && npm run build')
  const parcelManifest = JSON.parse(fs.readFileSync(`./dist/${MANIFEST_FILENAME}`).toString())
  const filenames = fs.readdirSync('./dist')

  const expected: Manifest = {}
  for (let filename of filenames) {
    if (filename === MANIFEST_FILENAME || filename.includes('.map')) {
      continue
    }
    const splittedFileName = filename.split('.')
    if (splittedFileName.length > 2) {
      const filenameWithoutHash = splittedFileName.filter((_, index) => index !== splittedFileName.length - 2).join('.')
      expected[filenameWithoutHash] = '/' + filename
    } else {
      expected[filename] = '/' + filename
    }
  }

  expect(parcelManifest).toEqual(expected)
}
