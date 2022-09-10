import { setFailed, getInput, addPath, info, debug } from '@actions/core'
import { find, downloadTool, extractTar, cacheFile } from '@actions/tool-cache'
import { HttpClient } from '@actions/http-client'
import { platform, arch } from 'os'
import { chmodSync } from 'fs'

const LATEST_RELEASE_URL = 'https://api.github.com/repos/cli/cli/releases/latest'

const determineArch = (): string => {
  switch (arch()) {
    case 'arm64':
      return 'arm64'
    case 'x64':
      return 'amd64'
    default:
      throw new Error(`Not supported arch '${arch()}'`)
  }
}

const buildDirName = (version: string): string => `gh_${version}_${platform()}_${determineArch()}`

const buildDownloadUrl = (version: string): string =>
  `https://github.com/cli/cli/releases/download/v${version}/${buildDirName(version)}.tar.gz`

const determineLatestVersion = async (): Promise<string> => {
  debug('Fetching latest release version...')
  const response = await new HttpClient('fetch-release').getJson(LATEST_RELEASE_URL)
  debug(`Got ${response}`)

  if (response.statusCode !== 200) {
    setFailed('Failed fetching latest release version')
  }
  const latestTag = (response.result as { tag_name: string }).tag_name
  debug(`Latest version is ${latestTag}`)

  return latestTag.replace('v', '')
}

const run = async (): Promise<void> => {
  const version = getInput('version') || (await determineLatestVersion())
  const currentArch = determineArch()
  const cached = find('gh-cli', version, currentArch)

  if (!cached) {
    info(`Did not find cached binaries. Downloading...`)
    const downloadUrl = buildDownloadUrl(version)
    const ghCliTar = await downloadTool(downloadUrl, 'gh-cli')
    debug(`Downloaded to ${ghCliTar}`)

    chmodSync(ghCliTar, '775')
    const extracted = await extractTar(ghCliTar)
    debug(`Extracted to ${extracted}`)

    const ghCliPath = await cacheFile(
      `${extracted}/${buildDirName(version)}/bin/gh`,
      'gh',
      'gh-cli',
      version,
      currentArch
    )

    addPath(ghCliPath)
  } else {
    info(`Found cached binaries for 'gh_${version}_${platform()}_${currentArch}'`)
    addPath(cached)
  }
  info('Github CLI was added to the PATH')
}

debug('Staring Action...')
run().catch((err) => setFailed(err.message))
debug('Done')
