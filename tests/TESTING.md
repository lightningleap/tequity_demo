# Tequity Demo Testing Guide

## Overview
This guide provides comprehensive instructions for testing the Tequity React application. All testing assets are organized in the `tests/` directory structure.

## Directory Structure
```
tests/
├── TESTING.md              # This comprehensive testing guide
├── e2e/                    # End-to-end test files
├── screenshots/            # Test screenshots organized by date/feature
├── scripts/                # Reusable test scripts
└── results/               # Test results and reports
```

## Prerequisites
Before running tests, ensure:
1. ✅ Development server is running: `npm run dev`
2. ✅ Application accessible at `http://localhost:5173`
3. ✅ Playwright is installed: `npm install playwright @playwright/test`
4. ✅ Browsers installed: `npx playwright install`

## Quick Test Commands

### 1. Full Application Test Suite
```bash
# Run complete test suite
node tests/scripts/full-app-test.js

# Results will be saved to tests/screenshots/ with timestamp
```

### 2. Authentication-Only Tests
```bash
# Test signup and login functionality
node tests/scripts/auth-test.js
```

### 3. Visual Regression Testing
```bash
# Take fresh screenshots for comparison
node tests/scripts/screenshot-baseline.js
```

## Manual Testing Checklist

### 🔐 Authentication Flow Testing
- [ ] **Signin Page**
  - Navigate to `http://localhost:5173`
  - Verify TEQUITY branding loads
  - Check signin form elements:
    - Email input field
    - Password input field
    - "Sign In" button (pink)
    - "Sign up" link
    - "Start a 14 day free trial" link

- [ ] **Signup Flow**
  - Click "Sign up" link
  - Verify signup form loads with:
    - First Name field
    - Last Name field
    - Email field
    - Password field
    - Confirm Password field
    - Terms of Service checkbox
    - "Create Account" button (pink)
    - "Sign in" link for existing users

- [ ] **Form Validation**
  - Test empty form submission
  - Test invalid email formats
  - Test password mismatch
  - Verify error messages display

### 🏠 Main Application Testing
- [ ] **Post-Login Navigation**
  - Verify successful login redirects properly
  - Check main application dashboard loads
  - Test navigation menu functionality

- [ ] **Core Features**
  - [ ] Chat functionality
  - [ ] Data room access
  - [ ] File management
  - [ ] User profile/settings

### 📱 Responsive Design Testing
Test application on different screen sizes:
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## Automated Testing

### Running E2E Tests
```bash
# Run all end-to-end tests
npx playwright test tests/e2e/

# Run specific test file
npx playwright test tests/e2e/auth.spec.js

# Run tests with UI (headed mode)
npx playwright test --headed

# Generate test report
npx playwright show-report
```

### Test Scripts Usage

#### 1. Full Application Test
```bash
cd /path/to/tequity/demo
node tests/scripts/full-app-test.js
```
**What it does:**
- Takes homepage screenshot
- Tests signin form
- Tests signup flow
- Captures all form states
- Tests navigation between pages
- Saves timestamped screenshots

#### 2. Authentication Test
```bash
node tests/scripts/auth-test.js
```
**What it does:**
- Focuses specifically on auth flows
- Tests form validation
- Tests successful/failed login attempts
- Captures error states

#### 3. Visual Baseline
```bash
node tests/scripts/screenshot-baseline.js
```
**What it does:**
- Creates baseline screenshots for visual regression
- Captures all major UI states
- Organizes screenshots by feature/page

## Screenshot Organization

Screenshots are automatically organized with timestamps:
```
tests/screenshots/
├── 2025-09-24_authentication/
│   ├── signin-page.png
│   ├── signup-page.png
│   ├── signin-filled.png
│   └── signup-filled.png
├── 2025-09-24_main-app/
│   ├── dashboard.png
│   ├── chat-feature.png
│   └── data-room.png
└── baseline/
    └── [reference screenshots]
```

## Test Data

### Sample Test Accounts
```javascript
// Use these for consistent testing
const testUsers = {
  new: {
    email: 'test.user@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  },
  existing: {
    email: 'existing@example.com',
    password: 'ExistingPass123!'
  }
};
```

## Troubleshooting

### Common Issues
1. **Server not running**: Ensure `npm run dev` is running
2. **Playwright errors**: Run `npx playwright install` to update browsers
3. **Port conflicts**: Check if port 5173 is available
4. **Network timeouts**: Increase timeout in test scripts if needed

### Debug Mode
Run tests with debug output:
```bash
DEBUG=pw:api node tests/scripts/full-app-test.js
```

## Test Reports

After running tests, reports are available:
- **Screenshots**: `tests/screenshots/`
- **Console logs**: Captured in terminal output
- **Playwright reports**: `playwright-report/`

## Continuous Integration

For CI/CD integration, add to your pipeline:
```yaml
# Example GitHub Actions step
- name: Run E2E Tests
  run: |
    npm run dev &
    npx wait-on http://localhost:5173
    npx playwright test
    kill %1
```

## Best Practices

1. **Always start with clean state**: Clear browser data between test runs
2. **Use consistent test data**: Stick to predefined test users
3. **Document issues**: Screenshot and log any unexpected behavior
4. **Update baselines**: Refresh baseline screenshots after UI changes
5. **Test real workflows**: Don't just test individual components

## Maintenance

- **Weekly**: Update baseline screenshots after UI changes
- **Monthly**: Review and update test scripts
- **After major updates**: Run full regression testing

## Getting Help

For testing issues:
1. Check this documentation first
2. Review console logs and screenshots
3. Verify development server is running
4. Check Playwright installation

---

**Last Updated**: September 24, 2025
**Version**: 1.0
**Tested With**: React 19.1.0, Playwright 1.40+