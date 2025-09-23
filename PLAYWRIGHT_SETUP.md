# Playwright MCP Server Setup for Tequity Demo

## Installation Commands

### 1. Install Playwright MCP Server
```bash
# Install the Playwright MCP server
claude mcp add playwright-server -- npx @mcp-servers/playwright

# Or if you prefer using a specific version
claude mcp add playwright-server -- npx @mcp-servers/playwright@latest
```

### 2. Alternative Installation with uvx (if available)
```bash
# Install with uvx if you have it installed
claude mcp add playwright-server -- uvx @mcp-servers/playwright
```

## Configuration

### MCP Server Configuration
The Playwright server will be configured automatically when you add it. You can verify the installation:

```bash
# List all MCP servers
claude mcp list

# Get details about the Playwright server
claude mcp get playwright-server
```

## Testing Capabilities

### Browser Testing Features
With Playwright MCP server, you can:

1. **Automated Browser Testing**
   - Launch browsers (Chrome, Firefox, Safari)
   - Navigate to pages and interact with elements
   - Take screenshots and record videos
   - Test responsive design

2. **End-to-End Testing**
   - Test complete user workflows
   - Validate authentication flows
   - Test data room functionality
   - Verify chat interactions

3. **Visual Testing**
   - Compare screenshots
   - Test UI components
   - Validate responsive layouts
   - Check accessibility

### Example Test Cases for Tequity Demo

#### Authentication Flow Testing
```javascript
// Test login workflow
1. Navigate to signin page
2. Fill in credentials
3. Verify redirect to dashboard
4. Check authentication state
```

#### Chat Functionality Testing
```javascript
// Test chat interface
1. Navigate to chat component
2. Send test message
3. Verify AI response
4. Test message formatting
```

#### Data Room Testing
```javascript
// Test file management
1. Navigate to data room
2. Test file categorization
3. Verify file viewing
4. Test responsive design
```

## Available Commands

### Browser Navigation
- Navigate to URLs
- Go back/forward
- Refresh pages
- Manage browser tabs

### Element Interaction
- Click elements
- Fill forms
- Select options
- Upload files
- Drag and drop

### Content Validation
- Take screenshots
- Get page content
- Verify text presence
- Check element visibility

### Accessibility Testing
- Check ARIA attributes
- Validate keyboard navigation
- Test screen reader compatibility

## Integration with Tequity Demo

### Test Scenarios
1. **User Authentication**
   - Sign up flow
   - Sign in flow
   - Protected route access
   - Logout functionality

2. **Chat Interface**
   - Message sending
   - AI response handling
   - UI responsiveness
   - Error states

3. **Data Room**
   - File categorization
   - File viewing
   - Navigation
   - Responsive design

4. **Cross-Browser Compatibility**
   - Chrome testing
   - Firefox testing
   - Safari testing (on macOS)
   - Mobile viewport testing

### Usage Examples

#### Basic Navigation Test
```javascript
// Navigate to the application
await page.goto('http://localhost:5173');

// Test responsive design
await page.setViewportSize({ width: 375, height: 667 }); // Mobile
await page.screenshot({ path: 'mobile-view.png' });
```

#### Authentication Test
```javascript
// Test sign in
await page.click('[data-testid="signin-button"]');
await page.fill('[name="email"]', 'test@example.com');
await page.fill('[name="password"]', 'password123');
await page.click('[type="submit"]');
await page.waitForURL('**/dashboard');
```

#### Chat Test
```javascript
// Test chat functionality
await page.fill('[data-testid="chat-input"]', 'Hello, how are you?');
await page.click('[data-testid="send-button"]');
await page.waitForSelector('[data-testid="ai-response"]');
```

## Best Practices

### Test Organization
- Create test files in `tests/` directory
- Group tests by feature (auth, chat, data-room)
- Use descriptive test names
- Include setup and teardown

### Data Management
- Use test data fixtures
- Clean up after tests
- Mock external APIs
- Use realistic test scenarios

### Performance
- Run tests in parallel when possible
- Use headless mode for CI/CD
- Optimize wait strategies
- Clean up browser resources

## Running Tests

### Development Testing
```bash
# Start your development server
npm run dev

# In another terminal, use Claude with Playwright MCP
claude
# Then use Playwright commands for testing
```

### CI/CD Integration
The Playwright MCP server can be integrated into your CI/CD pipeline for automated testing of the Tequity demo application.

## Troubleshooting

### Common Issues
1. **Browser Installation**: Ensure browsers are installed
2. **Port Conflicts**: Make sure dev server is running on expected port
3. **Element Selectors**: Use stable selectors for elements
4. **Timing Issues**: Use proper wait strategies

### Debug Mode
Enable debug mode for verbose output:
```bash
DEBUG=pw:api claude
```

This setup will enable comprehensive testing of your Tequity demo application using Claude Code with the Playwright MCP server.