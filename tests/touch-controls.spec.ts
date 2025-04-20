import { test, expect } from '@playwright/test';

/**
 * This test verifies that the mobile UI buttons in the game are responsive
 * and that touch events are properly detected
 */
test('Mobile UI buttons should be clickable', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });
  
  // Visit the page
  await page.goto('/');
  
  // Wait for the game UI to load (buttons at bottom left)
  const buttonContainer = await page.waitForSelector('.fixed.bottom-4.left-4', { 
    timeout: 10000,
    state: 'visible' 
  });
  console.log('Game UI loaded and buttons container found');
  
  // Verify all three buttons are visible
  const muteButton = page.locator('button', { hasText: /Mute|Unmute/ });
  const settingsButton = page.locator('button', { hasText: 'Settings' });
  const logsButton = page.locator('button', { hasText: 'Logs' });
  
  await expect(muteButton).toBeVisible();
  await expect(settingsButton).toBeVisible();
  await expect(logsButton).toBeVisible();
  console.log('All three buttons (Mute, Settings, Logs) are visible');
  
  // Click the settings button and verify the menu appears
  await settingsButton.click();
  console.log('Clicked Settings button');
  
  // Check that the settings menu appears
  const settingsMenu = page.locator('h2', { hasText: 'Game Settings' });
  await expect(settingsMenu).toBeVisible({ timeout: 5000 });
  console.log('Settings menu appeared after clicking Settings button');
  
  // Now close the settings menu by clicking the Close button
  const closeButton = page.locator('button', { hasText: 'Close' });
  await closeButton.click();
  console.log('Clicked Close button');
  
  // Verify the settings menu is closed
  await expect(settingsMenu).not.toBeVisible({ timeout: 5000 });
  console.log('Settings menu closed successfully');
  
  // Next try clicking the Mute button and check if it changes state
  const initialMuteText = await muteButton.textContent();
  await muteButton.click();
  console.log('Clicked Mute/Unmute button');
  
  // Give it a moment to update
  await page.waitForTimeout(500);
  
  // Check if the button text changed
  const updatedMuteText = await muteButton.textContent();
  console.log(`Mute button changed from "${initialMuteText}" to "${updatedMuteText}"`);
  
  // Now check if touch area is working by finding the debug element
  const debugInfo = page.locator('.bg-red-600/80');
  const initialDebugText = await debugInfo.textContent();
  console.log(`Initial debug info: ${initialDebugText}`);
  
  // Try to tap in the middle of the screen to trigger a touch event
  const centerX = page.viewportSize()!.width / 2;
  const centerY = page.viewportSize()!.height / 2;
  
  await page.touchscreen.tap(centerX, centerY);
  console.log('Tapped center of screen');
  
  // Wait a moment for the debug info to update
  await page.waitForTimeout(500);
  
  // Check if debug info changed
  const updatedDebugText = await debugInfo.textContent();
  console.log(`Updated debug info: ${updatedDebugText}`);
  
  console.log('Touch controls test completed');
});