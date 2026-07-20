const releasesURL = 'https://github.com/lsongdev/miya-desktop/releases';
const releasesAPI = 'https://api.github.com/repos/lsongdev/miya-desktop/releases?per_page=5';

const formatSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const currentPlatform = () => {
  const value = `${navigator.userAgentData?.platform || ''} ${navigator.platform || ''} ${navigator.userAgent || ''}`.toLowerCase();
  if (value.includes('win')) return 'windows';
  if (value.includes('mac')) return 'mac';
  return '';
};

const enhanceDownloads = (release) => {
  const assets = Array.isArray(release.assets) ? release.assets : [];

  document.querySelectorAll('[data-asset-suffix]').forEach((link) => {
    const asset = assets.find((candidate) => candidate.name.endsWith(link.dataset.assetSuffix));
    if (!asset) return;
    link.href = asset.browser_download_url;
    link.setAttribute('download', asset.name);
    const size = link.querySelector('[data-asset-size]');
    if (size) size.textContent = formatSize(asset.size);
  });

  const platform = currentPlatform();
  const suffix = platform === 'windows' ? '-windows-amd64.zip' : platform === 'mac' ? '-darwin-universal.zip' : '';
  const preferredAsset = suffix ? assets.find((asset) => asset.name.endsWith(suffix)) : null;
  const primary = document.getElementById('primary-download');

  if (primary && preferredAsset) {
    primary.href = preferredAsset.browser_download_url;
    primary.setAttribute('download', preferredAsset.name);
    primary.textContent = platform === 'windows' ? 'Download for Windows' : 'Download for macOS';
  } else if (primary) {
    primary.href = release.html_url || releasesURL;
  }

  document.querySelectorAll(`[data-platform-card="${platform}"]`).forEach((card, index) => {
    if (index === 0 || platform === 'windows') card.classList.add('is-recommended');
  });

  const version = document.getElementById('release-version');
  if (version) version.textContent = release.tag_name;

  const published = release.published_at ? new Date(release.published_at) : null;
  const note = document.getElementById('release-note');
  if (note && published && !Number.isNaN(published.valueOf())) {
    const date = new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(published);
    note.textContent = `Current ${release.prerelease ? 'prerelease' : 'release'}: ${release.tag_name}, published ${date}.`;
  }

  const checksum = assets.find((asset) => asset.name === 'SHA256SUMS');
  const checksumLink = document.getElementById('checksum-link');
  if (checksum && checksumLink) checksumLink.href = checksum.browser_download_url;

  const allReleases = document.getElementById('all-releases-link');
  if (allReleases) allReleases.href = release.html_url || releasesURL;
};

try {
  const response = await fetch(releasesAPI, { headers: { Accept: 'application/vnd.github+json' } });
  if (!response.ok) throw new Error(`GitHub releases request failed: ${response.status}`);
  const releases = await response.json();
  const release = releases.find((candidate) => !candidate.draft);
  if (release) enhanceDownloads(release);
} catch (error) {
  console.info('Using static GitHub Releases links.', error);
}
