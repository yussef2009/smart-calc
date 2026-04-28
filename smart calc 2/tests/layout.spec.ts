import { test, expect } from '@playwright/test';

test.describe('SmartCalc Layout Tests', () => {
  
  async function bypassLogin(page) {
    await page.goto('http://localhost:5173');
    // Check if we are on the login page
    const demoButton = page.locator('button:has-text("Demo")');
    if (await demoButton.isVisible()) {
      await demoButton.click();
    }
    // Wait for the app to load
    await page.waitForSelector('#calculator-panel', { timeout: 15000 });
  }

  test('Desktop Layout (1280x720)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await bypassLogin(page);
    
    // Check Top Bar height (h-12 = 48px)
    const topBar = await page.locator('div.h-12.bg-\\[\\#1A2235\\]\\/90').first();
    const box = await topBar.boundingBox();
    expect(box?.height).toBe(48);

    // Check Calculator Panel Width (420px)
    const calcPanel = await page.locator('#calculator-panel');
    const calcBox = await calcPanel.boundingBox();
    expect(calcBox?.width).toBe(420);

    // Verify Main Area is filling height
    const mainArea = await page.locator('#main-area');
    const mainBox = await mainArea.boundingBox();
    // Height should be viewport - topbar = 720 - 48 = 672
    expect(mainBox?.height).toBe(672);
  });

  test('Mobile Layout (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await bypassLogin(page);

    // Check Calculator Panel is full width (375px)
    const calcPanel = await page.locator('#calculator-panel');
    const calcBox = await calcPanel.boundingBox();
    expect(calcBox?.width).toBe(375);

    // Open Sidebar (LOG button)
    await page.click('button:has-text("📜 LOG")');
    
    // Sidebar should be full screen overlay on mobile
    const sidebar = await page.locator('#sidebar-panel');
    await expect(sidebar).toBeVisible();
    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox?.width).toBe(375);
    expect(sidebarBox?.height).toBe(667);
  });

  test('Background Motion Rendering', async ({ page }) => {
    await bypassLogin(page);
    
    // Check if aurora bands exist in the rich background
    const aurora = page.locator('.aurora-band').first();
    await expect(aurora).toBeVisible();

    // Check if math symbols are rising
    const mathSym = page.locator('.math-symbol').first();
    await expect(mathSym).toBeVisible();
  });
});
