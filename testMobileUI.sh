#!/bin/bash

# Create a temporary test file
cat > /tmp/test-mobile-ui.ts << 'EOL'
import { test, expect, devices } from '@playwright/test';

// Test if the mobile UI buttons are working
test('mobile UI buttons should be clickable', async ({ page }) => {
  // Set up mobile emulation
  test.use({
    ...devices['iPhone 12'],
  });
  
  console.log('Navigating to the game...');
  await page.goto('http://localhost:5000');
  
  // Wait for the game to load
  console.log('Waiting for game to load...');
  await page.waitForLoadState('networkidle');
  
  console.log('Taking initial screenshot...');
  await page.screenshot({ path: './mobile-initial.png' });
  
  // Look for the settings button
  console.log('Looking for Settings button...');
  const settingsButton = page.locator('button', { hasText: 'Settings' });
  
  if (await settingsButton.isVisible()) {
    console.log('Settings button found, clicking it...');
    await settingsButton.click();
    
    // Take a screenshot after clicking
    await page.screenshot({ path: './settings-clicked.png' });
    
    // Check if settings panel appears
    const settingsPanel = page.locator('text=Game Settings');
    await expect(settingsPanel).toBeVisible({ timeout: 3000 });
    
    console.log('Settings panel is visible! Test successful!');
  } else {
    console.log('Settings button not found or not visible.');
    // Take a screenshot to see what's on screen
    await page.screenshot({ path: './no-buttons-found.png' });
  }
});
EOL

# Run the test
echo "Running Playwright test..."
npx playwright test /tmp/test-mobile-ui.ts --headed