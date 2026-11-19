// Maintainer tests. Run: npm install && npm test
// BASE_URL runs the suite against a published copy instead of the local server.
const { defineConfig } = require('@playwright/test');

const local = 'http://127.0.0.1:4381';

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 30000,
  fullyParallel: true,
  workers: 3, // more parallel Chrome starts made context creation hang on this machine
  reporter: [['list']],
  use: {
    channel: 'chrome',
    baseURL: process.env.BASE_URL || local,
  },
  webServer: process.env.BASE_URL ? undefined : {
    command: 'python3 -m http.server 4381 --bind 127.0.0.1',
    url: local + '/index.html',
    reuseExistingServer: true,
    stderr: 'ignore', // python http.server logs every request on stderr
  },
});
