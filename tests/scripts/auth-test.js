import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = 'tests/screenshots';

const testData = {
  validUser: {
    email: 'test@example.com',
    password: 'ValidPassword123!',
    firstName: 'Test',
    lastName: 'User'
  },
  invalidUser: {
    email: 'invalid@email',
    password: '123',
    firstName: '',
    lastName: ''
  }
};

async function createAuthTestDir() {
  const timestamp = new Date().toISOString().split('T')[0];
  const dir = path.join(SCREENSHOTS_DIR, `${timestamp}_auth-test`);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function takeScreenshot(page, filename, description, dir) {
  const fullPath = path.join(dir, filename);
  await page.screenshot({ path: fullPath, fullPage: true });
  console.log(`📸 ${description} → ${fullPath}`);
}

async function testSigninFlow(page, screenshotDir) {
  console.log('\n🔑 Testing Signin Flow...');

  try {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, '01-signin-initial.png', 'Initial signin page', screenshotDir);

    // Test empty form submission
    const signInBtn = page.locator('button:has-text("Sign In"), input[type="submit"][value*="Sign"]').first();
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '02-signin-empty-validation.png', 'Empty form validation', screenshotDir);
    }

    // Test invalid email format
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill(testData.invalidUser.email);
      await passwordInput.fill(testData.validUser.password);
      await takeScreenshot(page, '03-signin-invalid-email.png', 'Invalid email format', screenshotDir);

      if (await signInBtn.isVisible()) {
        await signInBtn.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '04-signin-invalid-email-validation.png', 'Invalid email validation', screenshotDir);
      }
    }

    // Test valid credentials
    await emailInput.clear();
    await passwordInput.clear();
    await emailInput.fill(testData.validUser.email);
    await passwordInput.fill(testData.validUser.password);
    await takeScreenshot(page, '05-signin-valid-filled.png', 'Valid credentials filled', screenshotDir);

    console.log('✅ Signin flow tests completed');
    return true;
  } catch (error) {
    console.error('❌ Signin test failed:', error.message);
    await takeScreenshot(page, 'error-signin.png', 'Signin error', screenshotDir);
    return false;
  }
}

async function testSignupFlow(page, screenshotDir) {
  console.log('\n📝 Testing Signup Flow...');

  try {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Navigate to signup
    const signupLink = page.locator('text=Sign up, a[href*="signup"], a[href*="register"]').first();
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '06-signup-initial.png', 'Initial signup page', screenshotDir);

      // Test empty form submission
      const createBtn = page.locator('button:has-text("Create Account"), button:has-text("Sign Up"), input[type="submit"]').first();
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '07-signup-empty-validation.png', 'Empty signup validation', screenshotDir);
      }

      // Test invalid data
      const firstNameInput = page.locator('input[name*="first"], input[placeholder*="First"]').first();
      const lastNameInput = page.locator('input[name*="last"], input[placeholder*="Last"]').first();
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const confirmPasswordInput = page.locator('input[placeholder*="confirm"], input[name*="confirm"]').first();

      // Fill with invalid data
      if (await emailInput.isVisible()) {
        await emailInput.fill(testData.invalidUser.email);
        await passwordInput.fill(testData.invalidUser.password);
        if (await confirmPasswordInput.isVisible()) {
          await confirmPasswordInput.fill('different-password');
        }
        await takeScreenshot(page, '08-signup-invalid-data.png', 'Invalid signup data', screenshotDir);

        if (await createBtn.isVisible()) {
          await createBtn.click();
          await page.waitForTimeout(1000);
          await takeScreenshot(page, '09-signup-invalid-validation.png', 'Invalid data validation', screenshotDir);
        }
      }

      // Test valid data
      if (await firstNameInput.isVisible()) await firstNameInput.fill(testData.validUser.firstName);
      if (await lastNameInput.isVisible()) await lastNameInput.fill(testData.validUser.lastName);
      if (await emailInput.isVisible()) {
        await emailInput.clear();
        await emailInput.fill(testData.validUser.email);
      }
      if (await passwordInput.isVisible()) {
        await passwordInput.clear();
        await passwordInput.fill(testData.validUser.password);
      }
      if (await confirmPasswordInput.isVisible()) {
        await confirmPasswordInput.clear();
        await confirmPasswordInput.fill(testData.validUser.password);
      }

      // Check terms of service checkbox if present
      const tosCheckbox = page.locator('input[type="checkbox"]').first();
      if (await tosCheckbox.isVisible()) {
        await tosCheckbox.check();
      }

      await takeScreenshot(page, '10-signup-valid-filled.png', 'Valid signup data filled', screenshotDir);

      console.log('✅ Signup flow tests completed');
      return true;
    } else {
      console.log('⚠️  Signup link not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Signup test failed:', error.message);
    await takeScreenshot(page, 'error-signup.png', 'Signup error', screenshotDir);
    return false;
  }
}

async function testFormValidation(page, screenshotDir) {
  console.log('\n🔍 Testing Form Validation...');

  try {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Test HTML5 validation
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      // Test invalid email formats
      const invalidEmails = ['invalid', 'test@', '@domain.com', 'test..test@domain.com'];

      for (const email of invalidEmails) {
        await emailInput.fill(email);
        await emailInput.blur(); // Trigger validation
        await page.waitForTimeout(500);

        const validationMessage = await emailInput.evaluate(el => el.validationMessage);
        if (validationMessage) {
          console.log(`🔍 Email validation for "${email}": ${validationMessage}`);
          await takeScreenshot(page, `11-validation-${email.replace(/[^a-zA-Z0-9]/g, '-')}.png`, `Email validation: ${email}`, screenshotDir);
        }
      }
    }

    // Test password requirements if any visual indicators exist
    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      const weakPasswords = ['123', 'password', 'abc'];

      for (const pwd of weakPasswords) {
        await passwordInput.fill(pwd);
        await passwordInput.blur();
        await page.waitForTimeout(500);

        // Check for any password strength indicators
        const strengthIndicator = page.locator('.password-strength, .strength-meter, .password-info').first();
        if (await strengthIndicator.isVisible()) {
          await takeScreenshot(page, `12-password-strength-${pwd}.png`, `Password strength: ${pwd}`, screenshotDir);
        }
      }
    }

    console.log('✅ Form validation tests completed');
    return true;
  } catch (error) {
    console.error('❌ Form validation test failed:', error.message);
    return false;
  }
}

async function runAuthTest() {
  console.log('🚀 Starting Authentication Test Suite...');
  console.log(`📍 Testing URL: ${BASE_URL}`);

  const screenshotDir = await createAuthTestDir();
  console.log(`📸 Screenshots will be saved to: ${screenshotDir}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  page.setDefaultTimeout(30000);

  const results = {
    signin: false,
    signup: false,
    validation: false,
    startTime: new Date(),
    endTime: null
  };

  try {
    // Test signin flow
    results.signin = await testSigninFlow(page, screenshotDir);

    // Test signup flow
    results.signup = await testSignupFlow(page, screenshotDir);

    // Test form validation
    results.validation = await testFormValidation(page, screenshotDir);

    results.endTime = new Date();

    // Generate test report
    console.log('\n📊 Authentication Test Results:');
    console.log('================================');
    console.log(`🔑 Signin Flow: ${results.signin ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📝 Signup Flow: ${results.signup ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔍 Form Validation: ${results.validation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`⏱️  Test Duration: ${Math.round((results.endTime - results.startTime) / 1000)}s`);
    console.log(`📸 Screenshots: ${screenshotDir}`);

    const overallSuccess = results.signin && results.signup && results.validation;
    console.log(`\n🎯 Overall Status: ${overallSuccess ? '✅ SUCCESS' : '⚠️  ISSUES DETECTED'}`);

    if (!overallSuccess) {
      console.log('\n💡 Recommendations:');
      if (!results.signin) console.log('   - Review signin form functionality and validation');
      if (!results.signup) console.log('   - Check signup form accessibility and validation');
      if (!results.validation) console.log('   - Implement proper form validation feedback');
    }

  } catch (error) {
    console.error('❌ Authentication test suite failed:', error.message);
    await takeScreenshot(page, 'fatal-auth-error.png', 'Fatal authentication error', screenshotDir);
  } finally {
    await browser.close();
  }
}

// Run the test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAuthTest();
}

export { runAuthTest };