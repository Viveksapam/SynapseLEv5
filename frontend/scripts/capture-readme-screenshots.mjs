/**
 * Regenerates the screenshots embedded in the root README, from the live site.
 *
 *   node scripts/capture-readme-screenshots.mjs
 *
 * Writes docs/screenshots/{home,verisphere,ai-audit}.png. Run it after any UI
 * change that makes the README images stale.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = process.env.CAPTURE_BASE_URL || 'https://synapseislive.com';
const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/screenshots');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const save = async (name) => {
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  console.log('saved', `${name}.png`);
};

// Fixed sleeps produced blank screenshots when the feed was still fetching, so
// every capture waits on content that proves the page actually rendered.
const waitForVisible = async (selector, label) => {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 20000 });
  } catch {
    throw new Error(`${label}: "${selector}" never appeared, refusing to save a blank screenshot`);
  }
};

// Verisphere gates the feed behind a splash screen and prompts anonymous
// visitors to sign up; both need dismissing before the feed is visible.
const enterVerisphere = async () => {
  for (const label of ['Enter The Sphere', 'Maybe later']) {
    const button = page.getByText(label, { exact: false });
    if (await button.count()) {
      await button.first().click().catch(() => {});
      await page.waitForTimeout(label === 'Enter The Sphere' ? 2500 : 500);
    }
  }
};

try {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 20000 });
  await waitForVisible('h1', 'home page');
  await page.waitForTimeout(1200); // hero animation settles
  await save('home');

  await page.goto(`${BASE}/verisphere`, { waitUntil: 'networkidle', timeout: 20000 });
  await enterVerisphere();
  await waitForVisible('a[href*="/verisphere/post/"]', 'verisphere feed');
  await page.waitForTimeout(800); // let post images settle
  await save('verisphere');

  // Open the first post and expand its stored audit. Navigate by href instead of
  // clicking the card, since the sticky nav intercepts pointer events mid-scroll.
  const postHref = await page.locator('a[href*="/verisphere/post/"]').first().getAttribute('href');
  if (!postHref) throw new Error('no post links found in the feed');
  await page.goto(BASE + postHref, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);

  const analysisToggle = page.getByText('Post Analysis', { exact: false });
  if (!(await analysisToggle.count())) throw new Error(`no stored audit on ${postHref}`);
  await analysisToggle.first().click();
  await waitForVisible('text=Rubric Breakdown', 'audit panel');
  await page.waitForTimeout(500);

  // Capture the panel itself. A viewport shot wastes a third of the frame on the
  // empty sidebar and cuts the rubric off after two of five scores. The sticky
  // nav is hidden first, otherwise it paints over the panel header.
  const panel = page.locator('div[aria-expanded="true"]').filter({ hasText: 'Post Analysis' }).first();
  if (!(await panel.count())) throw new Error('audit panel did not expand');
  await page.addStyleTag({ content: '.v2-nav { display: none !important; }' });
  await page.waitForTimeout(300);
  await panel.screenshot({ path: path.join(outDir, 'ai-audit.png') });
  console.log('saved ai-audit.png');
} finally {
  await browser.close();
}
