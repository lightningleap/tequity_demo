import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const BASELINE_DIR = 'tests/screenshots/baseline';

const screenshotConfig = {
  fullPage: true,
  animations: 'disabled'
};

const viewports = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
};

async function createBaselineDir() {
  await fs.mkdir(BASELINE_DIR, { recursive: true });
  return BASELINE_DIR;
}

async function takeBaselineScreenshot(page, filename, description, viewport = 'desktop') {
  const fullPath = path.join(BASELINE_DIR, `${viewport}-${filename}`);
  await page.screenshot({ ...screenshotConfig, path: fullPath });
  console.log(`📸 ${description} (${viewport}) → ${fullPath}`);
}

async function captureAuthPages(page, viewport) {
  console.log(`\n📱 Capturing authentication pages for ${viewport}...`);

  try {
    // Homepage/Signin page
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await takeBaselineScreenshot(page, '01-signin-page.png', 'Signin page', viewport);

    // Signup page
    const signupLink = page.locator('text=Sign up').first();
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await page.waitForLoadState('networkidle');
      await takeBaselineScreenshot(page, '02-signup-page.png', 'Signup page', viewport);
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to capture auth pages for ${viewport}:`, error.message);
    return false;
  }
}

async function captureFormStates(page, viewport) {
  console.log(`\n📝 Capturing form states for ${viewport}...`);

  try {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Empty form state
    await takeBaselineScreenshot(page, '03-form-empty.png', 'Empty form state', viewport);

    // Filled form state
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await takeBaselineScreenshot(page, '04-form-filled.png', 'Filled form state', viewport);
    }

    // Focus states
    await emailInput.focus();
    await takeBaselineScreenshot(page, '05-form-focus-email.png', 'Email field focused', viewport);

    await passwordInput.focus();
    await takeBaselineScreenshot(page, '06-form-focus-password.png', 'Password field focused', viewport);

    return true;
  } catch (error) {
    console.error(`❌ Failed to capture form states for ${viewport}:`, error.message);
    return false;
  }
}

async function captureErrorStates(page, viewport) {
  console.log(`\n⚠️  Capturing error states for ${viewport}...`);

  try {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Invalid email format
    const emailInput = page.locator('input[type="email"]').first();
    const submitBtn = page.locator('button:has-text("Sign In"), input[type="submit"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid-email');
      await submitBtn.click();
      await page.waitForTimeout(1000);
      await takeBaselineScreenshot(page, '07-error-invalid-email.png', 'Invalid email error', viewport);
    }

    // Empty form submission
    await page.reload();
    await page.waitForLoadState('networkidle');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
      await takeBaselineScreenshot(page, '08-error-empty-form.png', 'Empty form error', viewport);
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to capture error states for ${viewport}:`, error.message);
    return false;
  }
}

async function captureInteractiveElements(page, viewport) {
  console.log(`\n🎯 Capturing interactive elements for ${viewport}...`);

  try {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Button hover states
    const signInBtn = page.locator('button:has-text("Sign In")').first();
    if (await signInBtn.isVisible()) {
      await signInBtn.hover();
      await takeBaselineScreenshot(page, '09-button-hover.png', 'Sign In button hover', viewport);
    }

    // Link hover states
    const signupLink = page.locator('text=Sign up').first();
    if (await signupLink.isVisible()) {
      await signupLink.hover();
      await takeBaselineScreenshot(page, '10-link-hover.png', 'Signup link hover', viewport);
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to capture interactive elements for ${viewport}:`, error.message);
    return false;
  }
}

async function generateBaseline() {
  console.log('🚀 Generating Visual Regression Baseline Screenshots...');
  console.log(`📍 Testing URL: ${BASE_URL}`);

  const baselineDir = await createBaselineDir();
  console.log(`📁 Baseline directory: ${baselineDir}`);

  const browser = await chromium.launch({ headless: true });

  const results = {
    desktop: { auth: false, forms: false, errors: false, interactive: false },
    tablet: { auth: false, forms: false, errors: false, interactive: false },
    mobile: { auth: false, forms: false, errors: false, interactive: false },
    startTime: new Date(),
    endTime: null
  };

  try {
    // Test each viewport
    for (const [viewportName, dimensions] of Object.entries(viewports)) {
      console.log(`\n📐 Processing ${viewportName} viewport (${dimensions.width}x${dimensions.height})`);

      const context = await browser.newContext({ viewport: dimensions });
      const page = await context.newPage();
      page.setDefaultTimeout(30000);

      // Disable animations for consistent screenshots
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `
      });

      // Capture different page states
      results[viewportName].auth = await captureAuthPages(page, viewportName);
      results[viewportName].forms = await captureFormStates(page, viewportName);
      results[viewportName].errors = await captureErrorStates(page, viewportName);
      results[viewportName].interactive = await captureInteractiveElements(page, viewportName);

      await context.close();
    }

    results.endTime = new Date();

    // Generate report
    console.log('\n📊 Baseline Generation Results:');
    console.log('===============================');

    for (const [viewport, result] of Object.entries(results)) {
      if (viewport === 'startTime' || viewport === 'endTime') continue;

      console.log(`\n📱 ${viewport.toUpperCase()}:`);
      console.log(`   🔐 Auth Pages: ${result.auth ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`   📝 Form States: ${result.forms ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`   ⚠️  Error States: ${result.errors ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`   🎯 Interactive: ${result.interactive ? '✅ SUCCESS' : '❌ FAILED'}`);
    }

    console.log(`\n⏱️  Total Duration: ${Math.round((results.endTime - results.startTime) / 1000)}s`);
    console.log(`📁 Baseline Screenshots: ${baselineDir}`);

    // Count total screenshots
    const files = await fs.readdir(baselineDir);
    console.log(`📸 Total Screenshots Generated: ${files.length}`);

    const overallSuccess = Object.values(results)
      .filter(r => typeof r === 'object' && r.auth !== undefined)
      .every(r => r.auth && r.forms && r.errors && r.interactive);

    console.log(`\n🎯 Overall Status: ${overallSuccess ? '✅ SUCCESS' : '⚠️  ISSUES DETECTED'}`);

    // Usage instructions
    console.log('\n💡 Next Steps:');
    console.log('   1. Review generated baseline screenshots');
    console.log('   2. Use these as reference for visual regression testing');
    console.log('   3. Update baselines after UI changes');
    console.log('   4. Compare future screenshots against these baselines');

  } catch (error) {
    console.error('❌ Baseline generation failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the baseline generation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateBaseline();
}

export { generateBaseline };