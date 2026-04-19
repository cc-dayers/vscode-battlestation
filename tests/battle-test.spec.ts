import { test, expect, type Page } from "@playwright/test";

test.describe("Battle Test Panel", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto("http://localhost:3000/battle-test");
    await page.waitForSelector(".bt-shell");
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("renders provider name and command", async () => {
    await expect(page.locator(".bt-field__value").first()).toContainText("Bitbucket PRs");
    await expect(page.locator(".bt-field__value").nth(1)).toContainText("bb-cli battles list --json");
  });

  test("shows success status with parsed battle count", async () => {
    await expect(page.locator(".bt-status--success")).toContainText("2 battles");
  });

  test("shows duration in success status", async () => {
    await expect(page.locator(".bt-status--success")).toContainText("342ms");
  });

  test("shows stdout content", async () => {
    const stdout = page.locator(".bt-output").first();
    await expect(stdout).toContainText("Fix auth flow");
    await expect(stdout).toContainText("Update CI");
  });

  test("Run Again button dispatches rerun command", async () => {
    await page.locator(".bt-btn", { hasText: "Run Again" }).click();
    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd).toEqual(expect.objectContaining({ command: "rerun" }));
  });

  test("Copy Output button dispatches copyStdout command", async () => {
    await page.locator(".bt-btn", { hasText: "Copy Output" }).click();
    const cmd = await page.evaluate(() => (window as any).__lastCommand);
    expect(cmd).toEqual(expect.objectContaining({ command: "copyStdout" }));
  });

  test("shows exit code in meta", async () => {
    await expect(page.locator(".bt-meta")).toContainText("Exit code: 0");
  });

  test("shows output size in meta", async () => {
    await expect(page.locator(".bt-meta")).toContainText("KB");
  });

  test("shows refresh interval info", async () => {
    await expect(page.locator(".bt-field__value").nth(2)).toContainText("300s");
  });

  test("updates view when error result is received via postMessage", async () => {
    await page.evaluate(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            type: "update",
            data: {
              provider: {
                id: "broken",
                name: "Broken CLI",
                command: "fake-cli list",
                refreshInterval: 0,
              },
              stdout: "",
              stderr: "command not found: fake-cli",
              exitCode: 127,
              duration: 15,
              parsedCount: null,
              parseError: null,
            },
          },
        })
      );
    });

    await expect(page.locator(".bt-status--error")).toContainText("exit code 127");
    await expect(page.locator(".bt-output--stderr")).toContainText("command not found");
  });

  test("shows running state when running message received", async () => {
    // Reset to a good state first
    await page.goto("http://localhost:3000/battle-test");
    await page.waitForSelector(".bt-shell");

    await page.evaluate(() => {
      window.dispatchEvent(
        new MessageEvent("message", { data: { type: "running" } })
      );
    });

    await expect(page.locator(".bt-status--running")).toContainText("Running");
  });

  test("shows parse error state for invalid JSON", async () => {
    await page.goto("http://localhost:3000/battle-test");
    await page.waitForSelector(".bt-shell");

    await page.evaluate(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            type: "update",
            data: {
              provider: { id: "test", name: "Test", command: "echo hi" },
              stdout: "not json",
              stderr: "",
              exitCode: 0,
              duration: 50,
              parsedCount: null,
              parseError: "Unexpected token",
            },
          },
        })
      );
    });

    await expect(page.locator(".bt-status--parse-error")).toContainText("Unexpected token");
  });
});
