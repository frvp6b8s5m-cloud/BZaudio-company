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


test("signal generator starts and stops in the browser", async ({ page, browserName }) => {
  test.skip(browserName === "firefox", "Headless Firefox in CI does not complete AudioContext.resume without an audio output device; audio output is covered in Chromium and WebKit.");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#toolbox");

  const panel = page.getByRole("region", { name: "Signal generator" });
  await expect(panel).toBeVisible();
  await panel.getByRole("button", { name: "Start signal" }).click();
  await expect(panel.getByText("Playing")).toBeVisible();
  await panel.getByRole("button", { name: "Stop signal" }).click();
  await expect(panel.getByText("Stopped")).toBeVisible();
});


test("live analyzer starts and stops with a granted fake microphone", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "The fake microphone device is configured for Chromium.");
  await page.context().grantPermissions(["microphone"]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#toolbox");

  const panel = page.getByRole("region", { name: "Peak / RMS meter" });
  await expect(panel.getByRole("button", { name: "Start analysis" })).toBeEnabled();
  await panel.getByRole("button", { name: "Start analysis" }).click();
  await expect(panel.getByText("Analyzing")).toBeVisible({ timeout: 10_000 });
  await panel.getByRole("button", { name: "Stop analysis" }).click();
  await expect(panel.getByText("Stopped")).toBeVisible();
});


function createSilentWav(): Buffer {
  const sampleRate = 8_000;
  const sampleCount = sampleRate;
  const dataBytes = sampleCount * 2;
  const wav = Buffer.alloc(44 + dataBytes);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + dataBytes, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(dataBytes, 40);
  return wav;
}

test("loads a local WAV file into native browser playback controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#toolbox");
  await page.getByLabel("Choose audio file").setInputFiles({
    name: "reference.wav",
    mimeType: "audio/wav",
    buffer: createSilentWav(),
  });

  await expect(page.getByText("reference.wav")).toBeVisible();
  await expect(page.getByLabel("Audio playback")).toHaveAttribute("controls");
  await expect(page.getByText("DURATION 0:01")).toBeVisible({ timeout: 5_000 });
});


test("supports skip navigation and accessible control names", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#home$/);

  const audit = await page.evaluate(() => {
    const controls = Array.from(
      document.querySelectorAll<HTMLElement>("a, button, input, select, textarea, audio[controls]"),
    );
    const unnamed = controls
      .filter((element) => {
        const labelledBy = element.getAttribute("aria-labelledby");
        const labelledByText = labelledBy
          ? labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ").trim()
          : "";
        const labels = "labels" in element
          ? Array.from((element as HTMLInputElement).labels ?? []).map((label) => label.textContent ?? "").join(" ").trim()
          : "";
        return !(
          element.getAttribute("aria-label")?.trim() ||
          labelledByText ||
          labels ||
          element.getAttribute("title")?.trim() ||
          element.textContent?.trim()
        );
      })
      .map((element) => element.outerHTML.slice(0, 160));
    const ids = Array.from(document.querySelectorAll("[id]")).map((element) => element.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    return {
      unnamed,
      duplicateIds: [...new Set(duplicateIds)],
      h1Count: document.querySelectorAll("h1").length,
      hasMain: Boolean(document.querySelector("main")),
      hasNavigation: Boolean(document.querySelector('nav[aria-label="Main navigation"]')),
    };
  });

  expect(audit.unnamed).toEqual([]);
  expect(audit.duplicateIds).toEqual([]);
  expect(audit.h1Count).toBe(1);
  expect(audit.hasMain).toBe(true);
  expect(audit.hasNavigation).toBe(true);
});

test("loads application assets under the restrictive static content policy", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Tools built for the show/ })).toBeVisible();
  const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
  expect(policy).toContain("default-src 'self'");
  expect(policy).toContain("object-src 'none'");
  expect(policy).toContain("media-src 'self' blob:");
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(16, 19, 23)");
  expect(pageErrors).toEqual([]);
});
