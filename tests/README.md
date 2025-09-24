# Tequity Demo Testing Suite

A comprehensive testing framework for the Tequity React application with automated browser testing, visual regression testing, and organized documentation.

## Quick Start

```bash
# 1. Ensure dev server is running
npm run dev

# 2. Run full application test
node tests/scripts/full-app-test.js

# 3. Run authentication-focused tests
node tests/scripts/auth-test.js

# 4. Generate baseline screenshots for visual testing
node tests/scripts/screenshot-baseline.js
```

## Directory Structure

```
tests/
├── README.md                 # This overview file
├── TESTING.md               # Comprehensive testing guide
├── e2e/                    # End-to-end test files (Playwright)
├── screenshots/            # Organized test screenshots
│   ├── baseline/          # Reference screenshots for visual regression
│   ├── 2025-09-24_*/     # Timestamped test results
│   └── ...
├── scripts/               # Reusable test automation scripts
│   ├── full-app-test.js   # Complete application testing
│   ├── auth-test.js       # Authentication flow testing
│   └── screenshot-baseline.js  # Visual regression baseline
└── results/               # Test reports and results
```

## Test Scripts Overview

### 1. Full Application Test (`full-app-test.js`)
- **Purpose**: Comprehensive testing of entire application
- **Coverage**: Authentication, main app features, responsive design
- **Output**: Timestamped screenshots + console report
- **Runtime**: ~30-60 seconds

### 2. Authentication Test (`auth-test.js`)
- **Purpose**: Deep testing of login/signup flows
- **Coverage**: Form validation, error states, user experience
- **Output**: Detailed auth screenshots + validation report
- **Runtime**: ~20-40 seconds

### 3. Screenshot Baseline (`screenshot-baseline.js`)
- **Purpose**: Generate reference screenshots for visual regression
- **Coverage**: All viewports, form states, error conditions
- **Output**: Baseline screenshots for comparison
- **Runtime**: ~60-90 seconds

## Key Features

✅ **Automated Browser Testing** - Playwright-powered testing across browsers
✅ **Visual Regression Testing** - Screenshot comparison and baseline management
✅ **Responsive Design Testing** - Multi-viewport testing (desktop/tablet/mobile)
✅ **Authentication Flow Testing** - Comprehensive auth testing
✅ **Organized Asset Management** - Timestamped screenshots and organized results
✅ **Comprehensive Documentation** - Step-by-step guides and troubleshooting

## Usage Examples

### Run Quick Test
```bash
# Test just the authentication flow
node tests/scripts/auth-test.js
```

### Full Regression Test
```bash
# Generate fresh baseline
node tests/scripts/screenshot-baseline.js

# Run full application test
node tests/scripts/full-app-test.js

# Compare results with baseline (manual process)
```

### Custom Test Data
Edit test scripts to use your own test data:
```javascript
const testData = {
  validUser: {
    email: 'your-test@email.com',
    password: 'YourTestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  }
};
```

## Integration with Development

### Pre-commit Testing
```bash
# Add to your pre-commit hook
npm run dev &
sleep 5
node tests/scripts/auth-test.js
kill %1
```

### CI/CD Integration
```yaml
- name: E2E Tests
  run: |
    npm run dev &
    npx wait-on http://localhost:5173
    node tests/scripts/full-app-test.js
    kill %1
```

## Screenshots Organization

Screenshots are automatically organized by date and test type:
- `tests/screenshots/baseline/` - Reference screenshots
- `tests/screenshots/2025-09-24_auth-test/` - Authentication tests
- `tests/screenshots/2025-09-24_full-test/` - Full application tests

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Connection refused" | Ensure `npm run dev` is running on port 5173 |
| "Browser not found" | Run `npx playwright install` |
| "Screenshots blurry" | Check viewport settings and display scaling |
| "Tests timing out" | Increase timeout in script configs |

## Best Practices

1. **Always start with clean browser state**
2. **Use consistent test data across runs**
3. **Update baselines after UI changes**
4. **Review screenshots for unexpected changes**
5. **Run tests in headless mode for CI/CD**

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Add appropriate error handling
3. Include screenshot capture for debugging
4. Update this documentation
5. Test across all supported viewports

---

**Last Updated**: September 24, 2025
**Maintainer**: Tequity Development Team
**Testing Framework**: Playwright + Custom Scripts