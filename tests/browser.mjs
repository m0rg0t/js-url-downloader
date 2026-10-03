import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const source = await readFile(new URL('../url-download.js', import.meta.url), 'utf8');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
try {
  const page = await browser.newPage();
  await page.setContent('<main id="moved"></main>');
  const result = await page.evaluate(async code => {
    const { default: download } = await import(`data:text/javascript;base64,${btoa(code)}`);
    const clicks = [];
    document.addEventListener('click', event => {
      event.preventDefault();
      const anchor = event.target;
      clicks.push({ href: anchor.getAttribute('href'), filename: anchor.download });
      document.querySelector('#moved').append(anchor);
    });
    download('/file.pdf', 'report.pdf');
    download('/second.pdf');
    await new Promise(resolve => setTimeout(resolve, 250));
    return { clicks, remaining: document.querySelectorAll('a').length };
  }, source);
  assert.deepEqual(result, { clicks: [
    { href: '/file.pdf', filename: 'report.pdf' },
    { href: '/second.pdf', filename: '/second.pdf' },
  ], remaining: 0 });
  console.log('Chromium smoke passed: two reparented anchors cleaned up');
} finally {
  await browser.close();
}
