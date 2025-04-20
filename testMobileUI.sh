#!/bin/bash

# This script runs the mobile UI test with Playwright

# First install Playwright browsers
npx playwright install --with-deps chromium

# Then run the simple touch test
npx playwright test tests/touch-controls.spec.ts

echo "Test completed. Check the results above."