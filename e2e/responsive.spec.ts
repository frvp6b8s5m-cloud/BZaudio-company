import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
  { name: "minimum supported mobile", width: 320, height: 740 },
];

for (const viewport of viewports) {
  test(`keeps the main page usable at ${viewport.name} width`, async ({ page }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto("/");

    await expect(page).toHaveTitle("BZaudio — Live Sound Tools");
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Tools built for the show/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Toolbox", exact: true }),
    ).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));

    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
  });
}

test("primary navigation reaches the toolbox section", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("link", { name: "Toolbox", exact: true }).click();

  await expect(page).toHaveURL(/#toolbox$/);
  await expect(
    page.getByRole("heading", { name: /Everything starts with a better read/ }),
  ).toBeVisible();
});


test("calculator suite renders and updates a live speaker-delay result", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#toolbox");

  await expect(
    page.getByRole("heading", { name: "Engineering tools, ready to use." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Speaker delay" })).toBeVisible();

  const distance = page.getByRole("spinbutton", { name: "Distance (m)", exact: true });
  await distance.fill("20");
  await expect(page.getByText("58.24 ms")).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
});


test("signal generator starts and stops in the browser", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#toolbox");

  const panel = page.getByRole("region", { name: "Signal generator" });
  await expect(panel).toBeVisible();
  await panel.getByRole("button", { name: "Start signal" }).click();
  await expect(panel.getByText("Playing")).toBeVisible();
  await panel.getByRole("button", { name: "Stop signal" }).click();
  await expect(panel.getByText("Stopped")).toBeVisible();
});
