import { test, expect } from '@playwright/test';

test.describe('Mobile UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to a mobile size
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12 dimensions
    
    // Navigate to the game
    await page.goto('/');
    
    // Wait for the game to load
    await page.waitForSelector('.fixed.bottom-4.left-4', { timeout: 10000 });
    console.log('Game UI loaded successfully');
  });

  test('should show the settings menu when clicking the settings button', async ({ page }) => {
    // Get the settings button from the bottom-left controls
    const settingsButton = page.locator('button:has-text("Settings")');
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'before-settings.png' });
    
    // Verify the button is visible
    await expect(settingsButton).toBeVisible();
    console.log('Settings button is visible');
    
    // Click the settings button
    await settingsButton.click();
    
    // Wait for settings panel to appear
    const settingsPanel = page.locator('text=Game Settings');
    await expect(settingsPanel).toBeVisible({ timeout: 5000 });
    
    // Take screenshot after clicking
    await page.screenshot({ path: 'after-settings.png' });
    
    console.log('Settings panel appeared successfully');
  });

  test('should toggle mute when clicking the mute button', async ({ page }) => {
    // Get the mute button
    const muteButton = page.locator('button:has-text("Mute"), button:has-text("Unmute")');
    
    // Verify the button is visible
    await expect(muteButton).toBeVisible();
    console.log('Mute/Unmute button is visible');
    
    // Get initial button text
    const initialText = await muteButton.textContent();
    console.log(`Initial button state: ${initialText}`);
    
    // Click the mute button
    await muteButton.click();
    
    // Wait a moment for the state to change
    await page.waitForTimeout(500);
    
    // Get the new button text
    const newText = await muteButton.textContent();
    console.log(`New button state: ${newText}`);
    
    // Verify the button text has changed
    expect(initialText).not.toEqual(newText);
    console.log('Mute button toggled successfully');
  });

  test('should open logs when clicking the logs button', async ({ page }) => {
    // Get the logs button
    const logsButton = page.locator('button:has-text("Logs")');
    
    // Verify the button is visible
    await expect(logsButton).toBeVisible();
    console.log('Logs button is visible');
    
    // Click the logs button
    await logsButton.click();
    
    // Wait for logs panel to appear
    const logsPanel = page.locator('text="Game Logs"');
    await expect(logsPanel).toBeVisible({ timeout: 5000 });
    
    console.log('Logs panel appeared successfully');
  });

  test('should simulate touch events for camera controls', async ({ page }) => {
    // Create a function to log touch events
    await page.evaluate(() => {
      window.addEventListener('camera-control', (e: any) => {
        console.log('Camera control event received:', e.detail);
      });
    });
    
    // Get the touch area (the entire 3D scene)
    const touchArea = page.locator('.absolute.inset-0.touch-none');
    await expect(touchArea).toBeVisible();
    
    // Get the center position of the scene
    const bounds = await touchArea.boundingBox();
    if (!bounds) {
      throw new Error('Could not get bounds of touch area');
    }
    
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    
    // Simulate a pan gesture (one finger drag)
    // Touch down at center
    await page.touchscreen.tap(centerX, centerY);
    
    // Move 50px to the right
    await page.mouse.move(centerX + 50, centerY);
    
    // Take screenshot after touch events
    await page.screenshot({ path: 'after-touch.png' });
    
    console.log('Touch events simulated successfully');
    
    // Check for debug info about touch event
    const debugInfo = page.locator('.bg-red-600/80');
    const debugText = await debugInfo.textContent();
    console.log(`Debug info: ${debugText}`);
  });
});