# Claude Code Setup Guide for Tequity Demo

## Prerequisites Verification

Before starting, ensure you have:
- ✅ Node.js installed (check with `node --version`)
- ✅ npm or yarn package manager
- ✅ Git installed and configured
- ✅ GitHub CLI (optional, for GitHub integration)

## 1. Install Claude Code

### macOS Installation
```bash
npm install -g @anthropic-ai/claude-code
```

### Verify Installation
```bash
claude --version
```

## 2. Initial Setup

### Navigate to Project Directory
```bash
cd /Users/ajitgadkari/Documents/Free/tequity/tequity_demo
```

### Initialize Claude Code
```bash
claude
```

### Set Up Permissions (First Time)
When Claude asks for permissions, use the `/permissions` command:
```
/permissions
```

Add these permissions:
- ✅ Edit (for file edits)
- ✅ Read (for reading files)
- ✅ Write (for creating files)
- ✅ Bash(npm:*) (for npm commands)
- ✅ Bash(git:*) (for git operations)

## 3. Install MCP Servers

### Install Serena MCP Server (Advanced Coding)
```bash
# First install uvx if not available
pip install uvx

# Install Serena
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)
```

### Install Playwright MCP Server (Testing)
```bash
claude mcp add playwright-server -- npx @mcp-servers/playwright
```

### Verify MCP Servers
```bash
claude mcp list
```

## 4. GitHub CLI Setup (Optional)

### Install GitHub CLI
```bash
# macOS with Homebrew
brew install gh

# Or download from https://github.com/cli/cli#installation
```

### Authenticate
```bash
gh auth login
```

## 5. Test Your Setup

### Basic Test
1. Start Claude Code:
   ```bash
   claude
   ```

2. Test the primer command:
   ```
   /primer
   ```

3. Test component analysis:
   ```
   /analyze-component src/App.jsx
   ```

### Development Workflow Test
1. Start your development server:
   ```bash
   npm run dev
   ```

2. In another terminal, start Claude:
   ```bash
   claude
   ```

3. Test Playwright integration (if installed):
   ```
   Navigate to http://localhost:5173 and take a screenshot
   ```

## 6. Available Commands

### Built-in Commands
- `/init` - Initialize CLAUDE.md
- `/permissions` - Manage permissions
- `/clear` - Clear context
- `/agents` - Manage subagents
- `/help` - Get help

### Custom Commands (Project-Specific)
- `/primer` - Analyze the Tequity codebase
- `/analyze-component <path>` - Analyze a React component
- `/test-feature <path>` - Create tests for a feature
- `/add-ui-component <name>` - Add new UI component
- `/generate-prp <initial-file>` - Generate PRP from requirements
- `/execute-prp <prp-name>` - Execute a PRP implementation

## 7. PRP Workflow

### Create Requirements
1. Create an `INITIAL.md` file with your requirements
2. Use `/generate-prp INITIAL.md` to create a comprehensive PRP
3. Review and refine the generated PRP
4. Use `/execute-prp <prp-name>` to implement

### Example Workflow
```bash
# 1. Generate PRP
/generate-prp requirements/new-feature.md

# 2. Execute PRP
/execute-prp new-feature.md
```

## 8. Subagents Usage

Your project has three specialized subagents:
- **react-specialist**: For React component optimization
- **redux-specialist**: For state management best practices
- **testing-specialist**: For comprehensive test creation

They activate automatically based on your requests, or you can invoke them directly:
```
/agents
```

## 9. Troubleshooting

### Common Issues

#### Permission Denied
```bash
# Make sure hooks are executable
chmod +x .claude/hooks/*.sh
```

#### MCP Server Issues
```bash
# Reinstall MCP servers
claude mcp remove serena
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)
```

#### Missing Dependencies
```bash
# Install project dependencies
npm install
```

### Debug Mode
Enable debug logging:
```bash
DEBUG=claude:* claude
```

## 10. Best Practices

### File Organization
- Keep PRPs in the `PRPs/` directory
- Use descriptive names for custom commands
- Organize subagents by specialization

### Development Workflow
1. Use `/primer` when starting work on the project
2. Create PRPs for complex features
3. Let subagents handle specialized tasks
4. Use hooks for automation
5. Test with Playwright MCP server

### Security
- Never allow destructive bash commands
- Use specific command patterns in permissions
- Keep sensitive data out of CLAUDE.md
- Use local settings for personal configurations

## Next Steps

1. **Explore the codebase**: Run `/primer` to get familiar
2. **Try implementing a feature**: Use the PRP workflow
3. **Test the application**: Use Playwright MCP for testing
4. **Customize further**: Add your own commands and agents

Your Tequity demo project is now fully configured for Claude Code! 🚀