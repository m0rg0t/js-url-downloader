# Javascript URL Downloader

Trigger a browser download using a temporary anchor. This package exports an ES module for use with an ES-module-aware browser or bundler.

## Installation

    npm install js-url-downloader --save

## Usage

    import urlDownload from 'js-url-downloader';
    urlDownload('/files/report.pdf', 'report.pdf');

The filename is optional and defaults to the URL. The browser decides whether a URL can be downloaded, especially for cross-origin URLs. Browsers without support for the download attribute open a new tab instead.

Temporary anchors are removed after 200 ms even if a click handler moves/removes the anchor or throws. A click exception still propagates to the caller.

## Development

Use Node 22.13+ or Node 24 and npm. This contributor toolchain does not add a runtime dependency or change the browser API.

    npm ci
    npm test
    npx playwright install chromium
    npm run test:browser

The tests cover literal filenames, browser fallbacks, repeated calls, removal/reparenting and click exceptions. The browser smoke uses synthetic local markup and prevents navigation or downloads. TypeScript checks cover both supported call signatures.
