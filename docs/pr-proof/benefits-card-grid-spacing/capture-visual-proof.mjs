import { chromium } from "playwright";
import react from "@vitejs/plugin-react";
import { createServer } from "vite";

const server = await createServer({
  root: process.cwd(),
  configFile: false,
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 0,
  },
});

await server.listen();

try {
  const baseUrl = server.resolvedUrls?.local[0];

  if (!baseUrl) {
    throw new Error("Vite did not expose a local proof server URL.");
  }

  const browser = await chromium.launch();
  const proofs = [
    {
      path: "docs/pr-proof/benefits-card-grid-spacing/benefits-card-grid-desktop.png",
      viewport: { width: 1280, height: 980 },
    },
    {
      path: "docs/pr-proof/benefits-card-grid-spacing/benefits-card-grid-mobile.png",
      viewport: { width: 390, height: 1200 },
    },
  ];

  for (const proof of proofs) {
    const page = await browser.newPage({
      viewport: proof.viewport,
      deviceScaleFactor: 1,
    });

    await page.goto(
      new URL(
        "docs/pr-proof/benefits-card-grid-spacing/benefits-card-grid-proof.html",
        baseUrl
      ).toString(),
      { waitUntil: "networkidle" }
    );

    await page.locator('[data-testid="benefits-card-grid-proof"]').screenshot({
      path: proof.path,
    });

    await page.close();
  }

  await browser.close();
} finally {
  await server.close();
}
