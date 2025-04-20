// @ts-check
import { chromium } from '@playwright/test';

/**
 * Simple script to test if the UI buttons are working in the game
 * This runs without the need for the test framework
 */
async function testMobileButtons() {
  console.log('Starting mobile UI button test...');
  
  // Launch the browser with mobile device emulation
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox'] 
  });
  
  // Create a new context with iPhone settings
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  
  // Create a new page
  const page = await context.newPage();
  
  try {
    // Navigate to the game, assuming it's running on port 5000
    console.log('Navigating to game...');
    await page.goto('http://localhost:5000/', { timeout: 30000 });
    
    // Wait for the game to load and UI to appear
    console.log('Waiting for game UI to load...');
    
    // Debug what elements are available
    await page.waitForLoadState('networkidle');
    const html = await page.content();
    console.log('Page loaded, checking for UI elements...');
    
    // Look for the settings button (should be at bottom left)
    const settingsButton = page.locator('button:has-text("Settings")');
    const isMuteButton = page.locator('button:has-text("Mute"), button:has-text("Unmute")');
    const logsButton = page.locator('button:has-text("Logs")');
    
    // Take a screenshot to see what's rendered
    await page.screenshot({ path: 'game-screenshot.png' });
    console.log('Took screenshot of initial game state');
    
    // Check if buttons are visible
    const settingsVisible = await settingsButton.isVisible();
    const muteVisible = await isMuteButton.isVisible();
    const logsVisible = await logsButton.isVisible();
    
    console.log(`Settings button visible: ${settingsVisible}`);
    console.log(`Mute button visible: ${muteVisible}`);
    console.log(`Logs button visible: ${logsVisible}`);
    
    // If the settings button is visible, try to click it
    if (settingsVisible) {
      console.log('Clicking settings button...');
      await settingsButton.click();
      
      // Wait for settings panel to appear
      console.log('Waiting for settings panel...');
      const settingsPanel = page.locator('text=Game Settings');
      
      // Take another screenshot
      await page.screenshot({ path: 'settings-clicked.png' });
      
      const settingsPanelVisible = await settingsPanel.isVisible();
      console.log(`Settings panel visible: ${settingsPanelVisible}`);
      
      // If settings panel appeared, try to close it
      if (settingsPanelVisible) {
        const closeButton = page.locator('button:has-text("Close")');
        if (await closeButton.isVisible()) {
          console.log('Clicking close button...');
          await closeButton.click();
          
          // Check if panel is closed
          const panelClosed = !(await settingsPanel.isVisible());
          console.log(`Settings panel closed: ${panelClosed}`);
        }
      }
    }
    
    // Try clicking the mute button if visible
    if (muteVisible) {
      console.log('Clicking mute button...');
      const initialText = await isMuteButton.textContent();
      await isMuteButton.click();
      
      // Wait a moment for state to change
      await page.waitForTimeout(500);
      
      // Check if button text changed
      const newText = await isMuteButton.textContent();
      console.log(`Mute button text changed from "${initialText}" to "${newText}"`);
      
      // Take another screenshot
      await page.screenshot({ path: 'mute-clicked.png' });
    }
    
    console.log('Mobile UI button test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'error-state.png' });
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
}

// Run the test
testMobileButtons().catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
});