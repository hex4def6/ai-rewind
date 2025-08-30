# AI Tracker

A shadow git repository system to track AI-made changes separately from your main project git, allowing safe rollback of AI changes without affecting your version control.

## Features

- 🔒 **Isolated Tracking** - Creates `.git-ai-tracking` directory separate from your main git
- ↩️ **Safe Rollback** - Instantly undo AI changes if something breaks
- 📊 **Statistics** - Track commits, files changed, and lines modified
- 🖥️ **Cross-Platform** - Works on Windows, macOS, and Linux
- 🚀 **Built with Bun** - Fast, modern JavaScript runtime

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/hex4def6/ai-tracker.git
cd ai-tracker
```

### 2. Install dependencies and build
```bash
bun install
bun run build
```

### 3. (Optional) Create a global alias
Add to your `~/.bashrc`, `~/.zshrc`, or shell profile:
```bash
alias ai-tracker="node $(pwd)/dist/cli.js"
```

## Usage

### Initialize tracking in your project
```bash
cd /path/to/your/project
node /path/to/ai-tracker/dist/cli.js init
```

### Basic Commands

```bash
# Save a checkpoint
node /path/to/ai-tracker/dist/cli.js commit "Added new feature"

# Rollback if something breaks
node /path/to/ai-tracker/dist/cli.js rollback

# Rollback multiple commits
node /path/to/ai-tracker/dist/cli.js rollback 3

# Check status
node /path/to/ai-tracker/dist/cli.js status

# View history
node /path/to/ai-tracker/dist/cli.js log

# View specific number of commits
node /path/to/ai-tracker/dist/cli.js log 5

# View changes
node /path/to/ai-tracker/dist/cli.js diff

# View statistics
node /path/to/ai-tracker/dist/cli.js stats

# Show configuration
node /path/to/ai-tracker/dist/cli.js config
```

## Example Workflow

```bash
# Clone and setup (once)
cd ~
git clone https://github.com/hex4def6/ai-tracker.git
cd ai-tracker
bun install
bun run build

# Use in your project
cd ~/my-project
node ~/ai-tracker/dist/cli.js init

# ... make changes with AI/Claude ...
node ~/ai-tracker/dist/cli.js commit "AI implemented authentication"

# ... if something breaks ...
node ~/ai-tracker/dist/cli.js rollback

# Check what changed
node ~/ai-tracker/dist/cli.js status
node ~/ai-tracker/dist/cli.js log
```

## For Claude Code Users

Add these instructions to your Claude Code settings or CLAUDE.md file:

```markdown
## AI Change Tracking
When working on code changes:
1. Initialize tracking: `node ~/ai-tracker/dist/cli.js init`
2. Commit after significant changes: `node ~/ai-tracker/dist/cli.js commit "Description"`
3. Rollback if errors occur: `node ~/ai-tracker/dist/cli.js rollback`

Auto-commit when:
- 5+ files changed
- 100+ lines modified
- Before risky operations
- After completing features
- After fixing bugs
```

### Automatic Commit Triggers
- **5+ files modified** → Commit with "WIP: Multiple files updated"
- **100+ lines changed** → Commit with "FEATURE: Significant changes"
- **30+ minutes elapsed** → Commit with "CHECKPOINT: Time-based save"
- **Before major refactoring** → Commit with "ROLLBACK_POINT: Before major changes"

### Commit Message Types
- `CHECKPOINT:` - Regular save point
- `FEATURE:` - New functionality added
- `FIX:` - Bug fix or error correction
- `SAFETY:` - Pre-risky operation backup
- `ROLLBACK_POINT:` - Before major changes
- `WIP:` - Work in progress

## Configuration

Create `.ai-tracker.json` in your project root to customize settings:

```json
{
  "excludePatterns": ["node_modules/**", "*.log", ".git/**"],
  "autoCommitThreshold": 5,
  "commitMessageFormat": "AI: {message}",
  "maxCommits": 100,
  "verboseOutput": true,
  "defaultBranch": "main"
}
```

## Windows Specific Commands

```bash
# If using Windows paths
cd C:\Users\YourName\projects\my-project
node C:\Users\YourName\ai-tracker\dist\cli.js init
node C:\Users\YourName\ai-tracker\dist\cli.js commit "Changes made"
node C:\Users\YourName\ai-tracker\dist\cli.js rollback
```

## Requirements

- [Bun](https://bun.sh) runtime (v1.0+)
- Git
- Node.js (v18+ for running the CLI)

## How It Works

1. **Initialization**: Creates a `.git-ai-tracking` directory in your project with a separate git repository
2. **Tracking**: All file changes are tracked in this shadow repository
3. **Commits**: Changes are committed to the shadow repo, not your main git
4. **Rollback**: Uses `git reset --hard` in the shadow repo to restore previous state
5. **Isolation**: The `.git-ai-tracking` directory is automatically added to `.gitignore`

## Project Structure

```
ai-tracker/
├── src/
│   ├── AITracker.ts      # Core tracking functionality
│   ├── Config.ts          # Configuration management
│   ├── cli.ts            # CLI entry point
│   └── index.ts          # Main export file
├── dist/                 # Compiled JavaScript
├── package.json
├── tsconfig.json
└── biome.json           # Biome linter configuration
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Run tests
bun test

# Lint
bun run lint

# Format
bun run format
```

## Testing

The project includes comprehensive tests for all functionality:

```bash
bun test
```

All 14 tests should pass, covering:
- Initialization
- Commits (with and without messages)
- Rollback operations
- Status reporting
- Change history
- Statistics tracking

## Notes

- The shadow repository is completely independent from your main git repository
- Line endings are handled automatically (CRLF on Windows, LF on Unix)
- All changes are tracked locally - nothing is pushed to remote repositories
- The `.git-ai-tracking` directory should not be committed to your main repository

## License

MIT

## Author

hex4def6

## Contributing

Contributions welcome! Please feel free to submit issues and pull requests.