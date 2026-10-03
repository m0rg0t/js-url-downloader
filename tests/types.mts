import urlDownload from '../';
urlDownload('https://example.invalid/file');
urlDownload('https://example.invalid/file', 'report.pdf');
// @ts-expect-error URL is required
urlDownload();
// @ts-expect-error Filename is a string
urlDownload('/file', 42);
