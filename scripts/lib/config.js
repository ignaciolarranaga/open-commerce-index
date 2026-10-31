import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function readJson(relativeOrAbsolute) {
  const file = path.isAbsolute(relativeOrAbsolute) ? relativeOrAbsolute : path.join(ROOT, relativeOrAbsolute);
  return JSON.parse(readFileSync(file, 'utf8'));
}

/**
 * Project configuration plus derived URLs. OCI_BASE_URL overrides the public base URL,
 * which is useful when serving a local build for testing.
 */
export function loadConfig() {
  const config = readJson('project.config.json');
  const pagesBase = config.custom_domain
    ? `https://${config.custom_domain}/`
    : `https://${config.owner}.github.io/${config.repository}/`;
  const baseUrl = ensureSlash(process.env.OCI_BASE_URL || pagesBase);
  const basePath = ensureSlash(new URL(baseUrl).pathname);
  const repoUrl = `https://github.com/${config.owner}/${config.repository}`;
  const pluginRepoUrl = `https://github.com/${config.owner}/${config.plugin_repository}`;
  return {
    ...config,
    baseUrl,
    basePath,
    repoUrl,
    pluginRepoUrl,
    pluginRepoSlug: `${config.owner}/${config.plugin_repository}`,
    issueUrl: (template) => `${repoUrl}/issues/new?template=${template}`,
    discussionsUrl: `${repoUrl}/discussions`,
    releasesUrl: `${repoUrl}/releases`,
    pluginReleasesUrl: `${pluginRepoUrl}/releases`,
  };
}

function ensureSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}
