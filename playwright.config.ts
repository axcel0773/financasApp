import { defineConfig } from '@playwright/test';

const tamanhos = [
  { name: 'mobile-360', viewport: { width: 360, height: 640 } },
  { name: 'mobile-390', viewport: { width: 390, height: 844 } },
  { name: 'tablet-768', viewport: { width: 768, height: 1024 } },
  { name: 'desktop-1280', viewport: { width: 1280, height: 800 } },
];
export default defineConfig({
  testDir: 'e2e',
  retries: 1,
  use: { baseURL: 'http://localhost:3000' },
  projects: tamanhos.map((t) => ({ name: t.name, use: { viewport: t.viewport } })),
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000/login',
    reuseExistingServer: true,
  },
});
