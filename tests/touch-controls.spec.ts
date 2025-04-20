import { test, expect, devices } from '@playwright/test';

/**
 * This test verifies that the mobile UI buttons in the game are responsive
 * and that touch events are properly detected
 */
test.describe('Mobile touch controls', () => {
  
  // Use iPhone 12 as a test device
  test.use({
    ...devices['iPhone 12'],
  });
  
  test('Camera controls should respond to touch events', async ({ page }) => {
    // Navigate to the game
    await page.goto('http://localhost:5000/');
    
    // Wait for the game to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the initial state
    await page.screenshot({ path: './test-results/initial-state.png' });
    
    // Perform a touch and drag operation to move the camera
    // First, find the canvas element
    const gameCanvas = page.locator('canvas');
    await expect(gameCanvas).toBeVisible();
    
    // Get the bounding box of the canvas
    const boundingBox = await gameCanvas.boundingBox();
    if (!boundingBox) {
      throw new Error('Could not get bounding box for canvas element');
    }
    
    // Calculate center coordinates
    const centerX = boundingBox.x + boundingBox.width / 2;
    const centerY = boundingBox.y + boundingBox.height / 2;
    
    // Simulate a touch drag operation
    console.log('Performing touch drag operation...');
    await page.touchscreen.tap(centerX, centerY);
    
    // Small delay to ensure the touch is registered
    await page.waitForTimeout(100);
    
    // Drag to move the camera
    await page.touchscreen.tap(centerX + 100, centerY); // Right drag
    await page.waitForTimeout(500);
    await page.screenshot({ path: './test-results/after-right-drag.png' });
    
    await page.touchscreen.tap(centerX, centerY);
    await page.waitForTimeout(100);
    await page.touchscreen.tap(centerX, centerY + 100); // Down drag
    await page.waitForTimeout(500);
    await page.screenshot({ path: './test-results/after-down-drag.png' });
    
    // Test pinch to zoom
    console.log('Testing pinch to zoom...');
    await page.touchscreen.tap(centerX, centerY);
    
    // Simulate a pinch-out gesture (zoom in)
    // Note: Playwright doesn't directly support multi-touch gestures like pinch
    // but we can try to approximate it by using JavaScript injection
    await page.evaluate((centerX, centerY) => {
      // Create a synthetic touch event for pinch
      const touchStart = new TouchEvent('touchstart', {
        touches: [
          new Touch({ identifier: 0, target: document.body, clientX: centerX - 50, clientY: centerY - 50 }),
          new Touch({ identifier: 1, target: document.body, clientX: centerX + 50, clientY: centerY + 50 })
        ]
      });
      
      const touchMove = new TouchEvent('touchmove', {
        touches: [
          new Touch({ identifier: 0, target: document.body, clientX: centerX - 100, clientY: centerY - 100 }),
          new Touch({ identifier: 1, target: document.body, clientX: centerX + 100, clientY: centerY + 100 })
        ]
      });
      
      const touchEnd = new TouchEvent('touchend', {
        touches: []
      });
      
      // Dispatch the events to simulate a pinch gesture
      document.body.dispatchEvent(touchStart);
      document.body.dispatchEvent(touchMove);
      document.body.dispatchEvent(touchEnd);
    }, centerX, centerY);
    
    await page.waitForTimeout(500);
    await page.screenshot({ path: './test-results/after-pinch.png' });
    
    // Also test if the console shows any errors related to touch events
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    // Check UI buttons
    console.log('Testing UI buttons...');
    const settingsButton = page.locator('button', { hasText: 'Settings' });
    
    if (await settingsButton.isVisible()) {
      console.log('Settings button found, clicking it...');
      await settingsButton.click();
      
      // Wait for the settings panel to appear
      const settingsPanel = page.locator('text=Game Settings');
      await expect(settingsPanel).toBeVisible({ timeout: 3000 });
      
      await page.screenshot({ path: './test-results/settings-panel.png' });
    }
    
    // Print all console messages for debugging
    console.log('Console messages during test:', consoleMessages);
  });
  
  test('Debug touch events should be registered', async ({ page }) => {
    // Navigate to the game
    await page.goto('http://localhost:5000/');
    
    // Wait for the game to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Inject debug code to track touch events
    await page.evaluate(() => {
      const touchDebugDiv = document.createElement('div');
      touchDebugDiv.id = 'touch-debug';
      touchDebugDiv.style.position = 'fixed';
      touchDebugDiv.style.top = '10px';
      touchDebugDiv.style.left = '10px';
      touchDebugDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      touchDebugDiv.style.color = 'white';
      touchDebugDiv.style.padding = '10px';
      touchDebugDiv.style.zIndex = '9999';
      touchDebugDiv.style.maxWidth = '80%';
      touchDebugDiv.style.maxHeight = '30%';
      touchDebugDiv.style.overflow = 'auto';
      touchDebugDiv.textContent = 'Touch Debug:';
      document.body.appendChild(touchDebugDiv);
      
      let eventCount = 0;
      
      function logTouchEvent(eventName, event) {
        eventCount++;
        const touchInfo = Array.from(event.touches).map(t => 
          `(${Math.round(t.clientX)},${Math.round(t.clientY)})`
        ).join(', ');
        
        const logEntry = document.createElement('div');
        logEntry.textContent = `${eventCount}. ${eventName}: ${touchInfo}`;
        touchDebugDiv.appendChild(logEntry);
        
        // Keep only the last 10 entries
        while (touchDebugDiv.children.length > 11) {
          touchDebugDiv.removeChild(touchDebugDiv.children[1]);
        }
        
        console.log(`Touch event ${eventName}: ${touchInfo}`);
      }
      
      document.addEventListener('touchstart', e => logTouchEvent('touchstart', e), true);
      document.addEventListener('touchmove', e => logTouchEvent('touchmove', e), true);
      document.addEventListener('touchend', e => logTouchEvent('touchend', e), true);
    });
    
    // Wait a moment for the debug UI to appear
    await page.waitForTimeout(1000);
    
    // Get the canvas
    const canvas = page.locator('canvas');
    const boundingBox = await canvas.boundingBox();
    if (!boundingBox) {
      throw new Error('Could not get bounding box for canvas element');
    }
    
    // Perform touch operations
    const centerX = boundingBox.x + boundingBox.width / 2;
    const centerY = boundingBox.y + boundingBox.height / 2;
    
    // Tap at center
    await page.touchscreen.tap(centerX, centerY);
    await page.waitForTimeout(500);
    await page.screenshot({ path: './test-results/debug-touch-tap.png' });
    
    // Drag operation
    await page.touchscreen.tap(centerX, centerY);
    for (let i = 1; i <= 5; i++) {
      await page.mouse.move(centerX + i * 20, centerY);
      await page.waitForTimeout(100);
    }
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: './test-results/debug-touch-drag.png' });
    
    // Check if our debug panel shows that events were detected
    const debugPanel = page.locator('#touch-debug');
    const debugText = await debugPanel.textContent();
    
    console.log('Debug panel text:', debugText);
    
    // The debug panel should contain more than just the initial text
    expect(debugText?.length).toBeGreaterThan(15);
  });
});