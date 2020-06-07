import { exec as execBeforePromisify } from 'child_process'
import util from 'util'
import fs from 'fs'
import path from 'path'

const exec = util.promisify(execBeforePromisify)

jest.setTimeout(120000)

beforeAll(() => {
  return exec('npm run build')
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
  const { stderr } = await exec('rm -rf .parcel-cache dist node_modules && npm install && npm run build')
  if (stderr) {
    throw new Error(stderr)
  }
  const parcelManifest = JSON.parse(fs.readFileSync('./dist/parcel-manifest.json').toString())
  expect(parcelManifest).toMatchSnapshot()
}
