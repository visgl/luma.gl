function normalizeTargetString(target) {
  return target?.trim().toLowerCase() || '';
}

function normalizeUrl(value) {
  return value?.trim() || '';
}

export function scorePageTargetCandidate(candidate, target) {
  const normalizedTarget = normalizeTargetString(target);
  if (!normalizedTarget) {
    return -1;
  }

  const url = normalizeUrl(candidate.url);
  const title = candidate.title?.toLowerCase() || '';
  const normalizedUrl = url.toLowerCase();

  if (normalizedUrl === normalizedTarget) {
    return 500;
  }

  if (normalizedUrl.endsWith(normalizedTarget)) {
    return 400;
  }

  if (normalizedUrl.includes(normalizedTarget)) {
    return 300;
  }

  if (title === normalizedTarget) {
    return 200;
  }

  if (title.includes(normalizedTarget)) {
    return 100;
  }

  return -1;
}

async function getPageTitle(page) {
  try {
    return await page.title();
  } catch {
    return '';
  }
}

export async function findTargetPage(browser, target) {
  const contexts = browser.contexts();
  const pages = contexts.flatMap(context => context.pages());

  if (!target) {
    return pages[0] || null;
  }

  const candidates = await Promise.all(
    pages.map(async page => ({
      page,
      title: await getPageTitle(page),
      url: page.url()
    }))
  );

  const bestCandidate = candidates
    .map(candidate => ({...candidate, score: scorePageTargetCandidate(candidate, target)}))
    .filter(candidate => candidate.score >= 0)
    .sort((left, right) => right.score - left.score)[0];

  return bestCandidate?.page || null;
}
