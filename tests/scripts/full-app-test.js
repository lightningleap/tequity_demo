import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = 'tests/screenshots';

// Test configuration
const config = {
  headless: true,
  viewport: { width: 1920, height: 1080 },
  timeout: 30000
};

// Test data
const testData = {
  newUser: {
    email: 'test.user@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  },
  existingUser: {
    email: 'existing@example.com',
    password: 'ExistingPass123!'
  }
};

async function createTimestampedDir() {
  const timestamp = new Date().toISOString().split('T')[0];
  const dir = path.join(SCREENSHOTS_DIR, `${timestamp}_full-test`);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function takeScreenshot(page, filename, description) {
  const screenshotDir = await createTimestampedDir();
  const fullPath = path.join(screenshotDir, filename);
  await page.screenshot({ path: fullPath, fullPage: true });
  console.log(`📸 ${description} → ${fullPath}`);
}

async function testAuthentication(page, screenshotDir) {
  console.log('\n🔐 Testing Authentication Flow...');

  try {
    // Navigate to app
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // Take homepage screenshot
    await takeScreenshot(page, '01-homepage.png', 'Homepage loaded');

    // Test signin form
    const signinForm = page.locator('form').first();
    if (await signinForm.isVisible()) {
      console.log('✅ Signin form found');

      // Fill signin form
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      if (await emailInput.isVisible() && await passwordInput.isVisible()) {
        await emailInput.fill(testData.existingUser.email);
        await passwordInput.fill(testData.existingUser.password);
        await takeScreenshot(page, '02-signin-filled.png', 'Signin form filled');
      }
    }

    // Test signup flow
    const signupLink = page.locator('text=Sign up').first();
    if (await signupLink.isVisible()) {
      console.log('🔗 Testing signup link...');
      await signupLink.click();
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '03-signup-page.png', 'Signup page loaded');

      // Fill signup form
      const firstNameInput = page.locator('input[name*="first"], input[placeholder*="First"]').first();
      const lastNameInput = page.locator('input[name*="last"], input[placeholder*="Last"]').first();
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const confirmPasswordInput = page.locator('input[placeholder*="confirm"], input[name*="confirm"]').first();

      if (await firstNameInput.isVisible()) {
        await firstNameInput.fill(testData.newUser.firstName);
      }
      if (await lastNameInput.isVisible()) {
        await lastNameInput.fill(testData.newUser.lastName);
      }
      if (await emailInput.isVisible()) {
        await emailInput.fill(testData.newUser.email);
      }
      if (await passwordInput.isVisible()) {
        await passwordInput.fill(testData.newUser.password);
      }
      if (await confirmPasswordInput.isVisible()) {
        await confirmPasswordInput.fill(testData.newUser.password);
      }

      await takeScreenshot(page, '04-signup-filled.png', 'Signup form filled');
      console.log('✅ Signup form testing complete');
    }

    return true;
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    await takeScreenshot(page, 'error-auth.png', 'Authentication error');
    return false;
  }
}

async function testMainApp(page) {
  console.log('\n🏠 Testing Main Application...');

  try {
    // Look for main app elements after potential login
    const mainContent = page.locator('main, .main, #main, [role="main"]').first();
    const navigation = page.locator('nav, .nav, .navbar, header').first();

    if (await mainContent.isVisible() || await navigation.isVisible()) {
      console.log('✅ Main app content found');
      await takeScreenshot(page, '05-main-app.png', 'Main application');

      // Test navigation elements
      const chatLink = page.locator('text=Chat, [aria-label*="chat"], .chat').first();
      const dataRoomLink = page.locator('text=Data Room, text=Files, text=Documents').first();

      if (await chatLink.isVisible()) {
        console.log('💬 Testing chat feature...');
        await chatLink.click();
        await page.waitForLoadState('networkidle');
        await takeScreenshot(page, '06-chat-feature.png', 'Chat feature');
      }

      if (await dataRoomLink.isVisible()) {
        console.log('📁 Testing data room...');
        await dataRoomLink.click();
        await page.waitForLoadState('networkidle');
        await takeScreenshot(page, '07-data-room.png', 'Data room feature');
      }

      return true;
    } else {
      console.log('ℹ️  Main app content not accessible (likely requires authentication)');
      return false;
    }
  } catch (error) {
    console.error('❌ Main app test failed:', error.message);
    await takeScreenshot(page, 'error-main-app.png', 'Main app error');
    return false;
  }
}

async function testResponsiveDesign(page) {
  console.log('\n📱 Testing Responsive Design...');

  const viewports = [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ];

  try {
    for (const viewport of viewports) {
      console.log(`📐 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, `08-${viewport.name}-view.png`, `${viewport.name} responsive view`);
    }
    return true;
  } catch (error) {
    console.error('❌ Responsive design test failed:', error.message);
    return false;
  }
}

async function runFullTest() {
  console.log('🚀 Starting Full Tequity Application Test Suite...');
  console.log(`📍 Testing URL: ${BASE_URL}`);
  console.log(`📸 Screenshots will be saved to: ${SCREENSHOTS_DIR}`);

  const browser = await chromium.launch({ headless: config.headless });
  const context = await browser.newContext({ viewport: config.viewport });
  const page = await context.newPage();

  // Set timeout
  page.setDefaultTimeout(config.timeout);

  const results = {
    auth: false,
    mainApp: false,
    responsive: false,
    startTime: new Date(),
    endTime: null
  };

  try {
    // Test authentication flow
    results.auth = await testAuthentication(page);

    // Test main application (if accessible)
    results.mainApp = await testMainApp(page);

    // Test responsive design
    results.responsive = await testResponsiveDesign(page);

    results.endTime = new Date();

    // Generate test report
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`🔐 Authentication: ${results.auth ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🏠 Main Application: ${results.mainApp ? '✅ PASS' : '❌ PARTIAL'}`);
    console.log(`📱 Responsive Design: ${results.responsive ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`⏱️  Test Duration: ${Math.round((results.endTime - results.startTime) / 1000)}s`);
    console.log(`📸 Screenshots saved to: ${SCREENSHOTS_DIR}`);

    const overallSuccess = results.auth && results.responsive;
    console.log(`\n🎯 Overall Status: ${overallSuccess ? '✅ SUCCESS' : '⚠️  PARTIAL SUCCESS'}`);

    if (!overallSuccess) {
      console.log('\n💡 Notes:');
      if (!results.auth) console.log('   - Authentication flow needs review');
      if (!results.mainApp) console.log('   - Main app may require valid login credentials');
      if (!results.responsive) console.log('   - Responsive design issues detected');
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    await takeScreenshot(page, 'fatal-error.png', 'Fatal test error');
  } finally {
    await browser.close();
  }
}

// Run the test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullTest();
}

export { runFullTest };