/**
 * Mobile UI Test Module
 * This module adds a test function that directly manipulates the DOM
 * to test if our UI buttons are functioning correctly.
 */

// Function to test if UI buttons are working
export function testMobileUI() {
  console.log('=== MOBILE UI TEST START ===');
  
  // First, verify the buttons exist
  const buttonContainer = document.querySelector('.fixed.bottom-4.left-4');
  if (!buttonContainer) {
    console.error('ERROR: Button container not found!');
    return false;
  }
  console.log('✓ Button container found');
  
  // Find all buttons
  const buttons = buttonContainer.querySelectorAll('button');
  console.log(`Found ${buttons.length} buttons in container`);
  
  // Look for specific buttons
  const muteButton = Array.from(buttons).find(button => 
    button.textContent?.includes('Mute') || button.textContent?.includes('Unmute')
  );
  
  const settingsButton = Array.from(buttons).find(button => 
    button.textContent?.includes('Settings')
  );
  
  const logsButton = Array.from(buttons).find(button => 
    button.textContent?.includes('Logs')
  );
  
  // Log the results
  console.log(`Mute button found: ${!!muteButton}`);
  console.log(`Settings button found: ${!!settingsButton}`);
  console.log(`Logs button found: ${!!logsButton}`);
  
  // Test if buttons are clickable
  if (settingsButton) {
    console.log('Clicking Settings button...');
    settingsButton.click();
    
    // Check if settings panel appears
    setTimeout(() => {
      // Use a more reliable selector to find the settings panel
      const settingsPanel = document.querySelector('.bg-gray-900\\/90');
      const settingsHeading = settingsPanel?.querySelector('h2');
      const panelVisible = settingsHeading && settingsHeading.textContent?.includes('Game Settings');
      console.log(`Settings panel appeared: ${!!panelVisible}`);
      
      if (settingsPanel && panelVisible) {
        // Try to close the panel using a more robust selector
        const closeButton = settingsPanel.querySelector('button:last-child');
        if (closeButton) {
          console.log('Clicking Close button...');
          (closeButton as HTMLButtonElement).click();
          
          setTimeout(() => {
            // Check if panel is still visible
            const stillVisible = document.querySelector('.bg-gray-900\\/90 h2');
            console.log(`Settings panel closed: ${!stillVisible}`);
          }, 100);
        }
      }
    }, 100);
  }
  
  // Test mute button
  if (muteButton) {
    console.log('Clicking Mute/Unmute button...');
    const initialText = muteButton.textContent;
    muteButton.click();
    
    setTimeout(() => {
      const newText = muteButton.textContent;
      console.log(`Mute button changed from "${initialText}" to "${newText}"`);
    }, 100);
  }
  
  console.log('=== MOBILE UI TEST COMPLETE ===');
  return true;
}

// Function to add test button to the UI
export function addTestButton() {
  const button = document.createElement('button');
  button.textContent = 'Test Mobile UI';
  button.style.position = 'fixed';
  button.style.top = '70px';
  button.style.right = '10px';
  button.style.zIndex = '9999';
  button.style.background = '#ff5555';
  button.style.color = 'white';
  button.style.padding = '10px';
  button.style.borderRadius = '4px';
  button.style.border = 'none';
  button.style.fontWeight = 'bold';
  
  button.addEventListener('click', () => {
    testMobileUI();
  });
  
  document.body.appendChild(button);
  console.log('Mobile UI test button added to page');
}