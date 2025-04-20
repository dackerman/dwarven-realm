/*
 * Simple UI test script for the mobile interface
 * This is a browser-runnable script that verifies the UI buttons work
 */

// Function to test if UI elements are clickable and functional
function testMobileUI() {
  console.log('Starting UI test for mobile interface...');
  
  // Wait for UI to be fully loaded
  setTimeout(() => {
    try {
      // Step 1: Check if UI buttons exist and are visible
      const buttonContainer = document.querySelector('.fixed.bottom-4.left-4');
      if (!buttonContainer) {
        throw new Error('Button container not found');
      }
      console.log('✓ Button container found');
      
      // Find key UI buttons
      const buttons = buttonContainer.querySelectorAll('button');
      if (buttons.length < 3) {
        throw new Error(`Expected at least 3 buttons, found ${buttons.length}`);
      }
      console.log(`✓ Found ${buttons.length} buttons`);
      
      // Get the specific buttons by their text content
      let muteButton = null;
      let settingsButton = null;
      let logsButton = null;
      
      for (const button of buttons) {
        const text = button.textContent.trim();
        if (text.includes('Mute') || text.includes('Unmute')) {
          muteButton = button;
        } else if (text.includes('Settings')) {
          settingsButton = button;
        } else if (text.includes('Logs')) {
          logsButton = button;
        }
      }
      
      if (!muteButton) throw new Error('Mute button not found');
      if (!settingsButton) throw new Error('Settings button not found');
      if (!logsButton) throw new Error('Logs button not found');
      
      console.log('✓ All required buttons found');
      
      // Step 2: Test the settings button click
      console.log('Testing Settings button click...');
      const initialMuteText = muteButton.textContent.trim();
      
      // First try settings button
      settingsButton.click();
      console.log('  Settings button clicked');
      
      // Check if settings menu appears
      setTimeout(() => {
        const settingsMenu = document.querySelector('h2');
        if (!settingsMenu || !settingsMenu.textContent.includes('Game Settings')) {
          console.error('✗ Settings menu not found after click');
        } else {
          console.log('✓ Settings menu opened successfully');
          
          // Find and click close button
          const closeButton = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.textContent.includes('Close'));
          
          if (closeButton) {
            closeButton.click();
            console.log('  Close button clicked');
            
            // Check if menu is closed
            setTimeout(() => {
              const menuStillOpen = document.querySelector('h2')?.textContent.includes('Game Settings');
              if (menuStillOpen) {
                console.error('✗ Settings menu did not close');
              } else {
                console.log('✓ Settings menu closed successfully');
                
                // Now test the mute button
                console.log('Testing Mute button click...');
                muteButton = document.querySelector('button[style*="manipulation"]');
                
                if (muteButton) {
                  muteButton.click();
                  console.log('  Mute button clicked');
                  
                  setTimeout(() => {
                    const newMuteButton = document.querySelector('button[style*="manipulation"]');
                    const newText = newMuteButton?.textContent.trim();
                    
                    if (newText !== initialMuteText) {
                      console.log(`✓ Mute button text changed from "${initialMuteText}" to "${newText}"`);
                    } else {
                      console.error('✗ Mute button text did not change');
                    }
                    
                    console.log('UI test completed');
                  }, 500);
                } else {
                  console.error('✗ Mute button not found for second test');
                }
              }
            }, 500);
          } else {
            console.error('✗ Close button not found');
          }
        }
      }, 500);
    } catch (error) {
      console.error('Test failed:', error.message);
    }
  }, 2000); // Wait for UI to be fully loaded
}

// Function to check mobile touch controls
function testMobileTouchControls() {
  console.log('Starting test for mobile touch controls...');
  
  setTimeout(() => {
    try {
      // First check if we can find the touch area
      const touchArea = document.querySelector('.absolute.inset-0.touch-none');
      if (!touchArea) {
        throw new Error('Touch area not found');
      }
      console.log('✓ Touch area found');
      
      // Check if debug info element exists
      const debugInfo = document.querySelector('.bg-red-600\\/80');
      const initialDebugText = debugInfo?.textContent;
      console.log(`Initial debug info: ${initialDebugText}`);
      
      // Setup listener for camera control events
      let eventReceived = false;
      window.addEventListener('camera-control', (e) => {
        console.log('Camera control event received:', e.detail);
        eventReceived = true;
      });
      
      // Create and dispatch touch events
      console.log('Simulating touch event...');
      
      // Get the touch area dimensions
      const rect = touchArea.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Create touch start event
      const touchStartEvent = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [
          new Touch({
            identifier: 0,
            target: touchArea,
            clientX: centerX,
            clientY: centerY
          })
        ]
      });
      
      // Dispatch the touch start event
      touchArea.dispatchEvent(touchStartEvent);
      console.log('Dispatched touchstart event');
      
      // Create touch move event (move to right)
      setTimeout(() => {
        const touchMoveEvent = new TouchEvent('touchmove', {
          bubbles: true,
          cancelable: true,
          touches: [
            new Touch({
              identifier: 0,
              target: touchArea,
              clientX: centerX + 50,
              clientY: centerY
            })
          ]
        });
        
        // Dispatch the touch move event
        touchArea.dispatchEvent(touchMoveEvent);
        console.log('Dispatched touchmove event');
        
        // Create touch end event
        setTimeout(() => {
          const touchEndEvent = new TouchEvent('touchend', {
            bubbles: true,
            cancelable: true,
            touches: []
          });
          
          // Dispatch the touch end event
          touchArea.dispatchEvent(touchEndEvent);
          console.log('Dispatched touchend event');
          
          // Check if debug info changed
          setTimeout(() => {
            const updatedDebugInfo = document.querySelector('.bg-red-600\\/80');
            const updatedDebugText = updatedDebugInfo?.textContent;
            console.log(`Updated debug info: ${updatedDebugText}`);
            
            if (eventReceived) {
              console.log('✓ Camera control event was received');
            } else {
              console.error('✗ No camera control event was received');
            }
            
            console.log('Touch controls test completed');
          }, 500);
        }, 100);
      }, 100);
    } catch (error) {
      console.error('Touch test failed:', error.message);
    }
  }, 3000); // Wait a bit longer before testing touch
}

// Function to run all tests
function runAllTests() {
  console.log('----------------------------------------------');
  console.log('MOBILE UI AND TOUCH CONTROLS TEST');
  console.log('----------------------------------------------');
  
  testMobileUI();
  
  // Wait before running touch tests
  setTimeout(() => {
    testMobileTouchControls();
  }, 5000);
}

// Expose the test function globally
window.runMobileTests = runAllTests;