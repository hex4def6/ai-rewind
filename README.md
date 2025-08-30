# AI Rewind

AI change tracking and rollback system using shadow git repository. Safely undo AI-made changes without affecting your main project's version control.

## Features

- 🔒 **Isolated Tracking** - Creates `.git-ai-tracking` directory separate from your main git
- ↩️ **Safe Rollback** - Instantly undo AI changes if something breaks
- 📊 **Statistics** - Track commits, files changed, and lines modified
- 🖥️ **Cross-Platform** - Works on Windows, macOS, and Linux
- 🚀 **Built with Bun** - Fast, modern JavaScript runtime
- 🔄 **Time Travel** - Rewind your code to any previous state

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/hex4def6/ai-rewind.git
cd ai-rewind
```

### 2. Install dependencies and build
```bash
bun install
bun run build
```

### 3. (Optional) Create a global alias
Add to your `~/.bashrc`, `~/.zshrc`, or shell profile:
```bash
alias ai-rewind="node $(pwd)/dist/cli.js"
```

## Usage

### Initialize tracking in your project
```bash
cd /path/to/your/project
node /path/to/ai-rewind/dist/cli.js init
```

### Basic Commands

```bash
# Save a checkpoint
node /path/to/ai-rewind/dist/cli.js commit "Added new feature"

# Rollback if something breaks
node /path/to/ai-rewind/dist/cli.js rollback

# Rollback multiple commits
node /path/to/ai-rewind/dist/cli.js rollback 3

# Check status
node /path/to/ai-rewind/dist/cli.js status

# View history
node /path/to/ai-rewind/dist/cli.js log

# View specific number of commits
node /path/to/ai-rewind/dist/cli.js log 5

# View changes
node /path/to/ai-rewind/dist/cli.js diff

# View statistics
node /path/to/ai-rewind/dist/cli.js stats

# Show configuration
node /path/to/ai-rewind/dist/cli.js config
```

## Example Workflow

```bash
# Clone and setup (once)
cd ~
git clone https://github.com/hex4def6/ai-rewind.git
cd ai-rewind
bun install
bun run build

# Use in your project
cd ~/my-project
node ~/ai-rewind/dist/cli.js init

# ... make changes with AI/Claude ...
node ~/ai-rewind/dist/cli.js commit "AI implemented authentication"

# ... if something breaks ...
node ~/ai-rewind/dist/cli.js rollback

# Check what changed
node ~/ai-rewind/dist/cli.js status
node ~/ai-rewind/dist/cli.js log
```

## For Claude Code Users

Add these instructions to your Claude Code settings or CLAUDE.md file:

```markdown
## AI Rewind Integration

When working on projects with AI Rewind available (look for `ai-rewind` directory), use these commands:

### Quick Commands
# Check if rewind is available
test -d ~/ai-rewind && echo "AI Rewind available"

# Initialize if needed (once per project)
node ~/ai-rewind/dist/cli.js init

# Create checkpoints
node ~/ai-rewind/dist/cli.js commit "[TYPE]: Description"

### Automatic Commit Triggers
- **5+ files modified** → Commit with "WIP: Multiple files updated"
- **100+ lines changed** → Commit with "FEATURE: Significant changes"
- **Risky operation** → Commit with "SAFETY: Before [operation]"
- **User says "checkpoint"** → Commit with "CHECKPOINT: User-requested"
- **Todo completed** → Commit with "FEATURE: [todo description]"

### When to Rollback
- User says "undo that" or "rewind"
- Tests fail after changes
- Build breaks
- Accidental deletion
```

## Advanced Usage

### Rollback with Preview
```bash
# See what would be rolled back without making changes
node ~/ai-rewind/dist/cli.js rollback 3 --dry-run

# Force rollback even with uncommitted changes
node ~/ai-rewind/dist/cli.js rollback --force

# Skip confirmation prompt
node ~/ai-rewind/dist/cli.js rollback --yes
```

### Backup and Restore
```bash
# List available backups
node ~/ai-rewind/dist/cli.js backups

# Restore from a backup tag
node ~/ai-rewind/dist/cli.js forward backup-2024-01-15T10-30-00
```

### Configuration

Create a `.ai-rewind.json` file in your project root:

```json
{
  "excludePatterns": [
    "node_modules/**",
    ".git/**",
    "**/*.log",
    "**/dist/**",
    "**/build/**"
  ],
  "autoCommitThreshold": 5,
  "commitMessageFormat": "AI change at {timestamp}",
  "maxCommits": 100,
  "verboseOutput": false
}
```

Or use the config command:
```bash
# Create default config file
node ~/ai-rewind/dist/cli.js config --create

# Show current config
node ~/ai-rewind/dist/cli.js config
```

## Development

```bash
# Run tests
bun test

# Watch mode
bun run dev

# Lint code
bun run lint

# Format code
bun run format
```

## Requirements

- Git (must be installed and available in PATH)
- Node.js 16+ or Bun 1.0+
- Works on Windows, macOS, and Linux

## How It Works

AI Rewind creates a shadow Git repository (`.git-ai-tracking`) in your project directory that tracks all changes independently from your main Git repository. This allows you to:

1. **Track AI changes separately** - Your main git history stays clean
2. **Rollback safely** - Undo AI changes without affecting your commits
3. **Time travel** - Jump to any previous state of your code
4. **No conflicts** - Works alongside your existing git workflow

## Safety Features

- **Automatic backups** before rollback operations
- **Dry-run mode** to preview changes
- **Confirmation prompts** for destructive operations
- **Force flags** for advanced users
- **Excludes sensitive files** automatically (.env, secrets, etc.)

## License

MIT - See [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, questions, or suggestions, please open an issue on [GitHub](https://github.com/hex4def6/ai-rewind/issues).