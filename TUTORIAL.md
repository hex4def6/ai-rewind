# AI Rewind - Interactive Tutorial

This tutorial walks you through using AI Rewind step-by-step with real examples.

## 📚 Lesson 1: Setup

### Step 1: Create Your Demo Project

First, create a fresh directory for practice:

```bash
mkdir demo-project
cd demo-project
```

### Step 2: Create Some Initial Files

Create a simple project to work with:

```bash
echo "# Demo Project" > README.md
echo "console.log('Hello World');" > app.js
```

You should now have:
- `README.md` - Project documentation
- `app.js` - A simple JavaScript file

---

## 📚 Lesson 2: Initialize AI Rewind

Initialize AI Rewind to start tracking AI-assisted changes:

```bash
node ~/ai-rewind/dist/cli.js init
```

**Expected output:**
```
Available commands:
  ai-rewind commit [message]  - Save current changes
  ai-rewind rollback [count]  - Revert last AI change(s)
  ai-rewind log [count]       - View change history
  ai-rewind status            - Check current status
✓ AI tracking repository initialized successfully!
```

**What was created:**
- `.git-ai-tracking/` - The shadow git repository
- `.gitignore` - Updated to ignore the tracking directory

---

## 📚 Lesson 3: Making Your First Checkpoint

Let's simulate an AI making changes to the code. Modify app.js:

```javascript
// Enhanced greeting application
function greet(name) {
  return `Hello, ${name}! Welcome to our app.`;
}

console.log(greet('World'));
console.log(greet('AI Assistant'));
```

Save this checkpoint with a descriptive message:

```bash
node ~/ai-rewind/dist/cli.js commit "FEATURE: Added greeting function with name parameter"
```

**Expected output:**
```
Latest commits:
b1bab5e - 2025-08-29 - FEATURE: Added greeting function with name parameter
df3f4e8 - 2025-08-29 - Initial state before AI changes
✓ Changes committed successfully!
```

📸 You've created your first checkpoint!

---

## 📚 Lesson 4: Checking Status

Check the current status of your tracking:

```bash
node ~/ai-rewind/dist/cli.js status
```

**Expected output:**
```
AI Rewind - Status
========================================

Current Working Directory:
/your/project/path/demo-project

Tracking Repository Status:
On branch master
nothing to commit, working tree clean

Recent Commits:
b1bab5e - 2025-08-29 - FEATURE: Added greeting function with name parameter
df3f4e8 - 2025-08-29 - Initial state before AI changes

Files Changed in Last Commit:
M	app.js
```

**What this shows:**
- ✅ Working directory is clean
- 📝 Recent commits
- 📁 Files changed (M = Modified)

---

## 📚 Lesson 5: Making a "Mistake" and Rolling Back

### Simulate a Bug

Let's make a "bad" change - introducing bugs:

```javascript
// Broken code - AI made an error!
function greet(name) {
  return Hello, ${name}!; // SYNTAX ERROR: Missing quotes
}

console.log(greet()); // ERROR: Missing parameter
console.lag(greet('World')); // TYPO: console.lag instead of console.log
```

Commit this bad change:

```bash
node ~/ai-rewind/dist/cli.js commit "FIX: Updated greeting function (contains bugs)"
```

### View History

```bash
node ~/ai-rewind/dist/cli.js log 5
```

**Expected output:**
```
Showing last 5 changes:

* 9f0e225 - 2025-08-29 22:56:29 -0700 - FIX: Updated greeting function (contains bugs)
* b1bab5e - 2025-08-29 22:55:20 -0700 - FEATURE: Added greeting function with name parameter
* df3f4e8 - 2025-08-29 22:54:48 -0700 - Initial state before AI changes
```

### Rollback the Mistake! 🔄

```bash
node ~/ai-rewind/dist/cli.js rollback --yes
```

**Expected output:**
```
Current history:
9f0e225 - 2025-08-29 - FIX: Updated greeting function (contains bugs)
b1bab5e - 2025-08-29 - FEATURE: Added greeting function with name parameter
df3f4e8 - 2025-08-29 - Initial state before AI changes

Backup created: backup-2025-08-30T05-56-45-638Z

Current state:
b1bab5e - 2025-08-29 - FEATURE: Added greeting function with name parameter
✓ Successfully rolled back 1 commit(s)!
```

🎉 **SUCCESS!** The buggy code is gone, and you're back to the working version!

---

## 📚 Lesson 6: Advanced Features

### Feature 1: View Available Backups

AI Rewind creates automatic backups before rollbacks:

```bash
node ~/ai-rewind/dist/cli.js backups
```

**Expected output:**
```
AI Rewind - Available Backups
========================================

Backup tags:
  backup-2025-08-30T05-56-45-638Z
    9f0e225 - 2025-08-29 - FIX: Updated greeting function (contains bugs)

To restore: ai-rewind forward <backup-tag>
```

### Feature 2: View Statistics

```bash
node ~/ai-rewind/dist/cli.js stats
```

**Expected output:**
```
📊 AI Rewind Statistics
========================================

Repository Info:
  Total Commits: 2
  Files Tracked: 3
  Repository Size: 1 KB

Timeline:
  First Commit: 2025-08-29 22:55:20 -0700
  Last Commit: 2025-08-29 22:55:20 -0700

Most Frequently Modified Files:
  app.js: 2 changes
  .gitignore: 1 changes
  README.md: 1 changes
```

### Feature 3: Selective File Rollback

Add another file:

```bash
echo "// Configuration file" > config.js
node ~/ai-rewind/dist/cli.js commit "Added config files"
```

Mess up just one file:

```bash
echo "// BAD CONFIG" > config.js
```

Rollback ONLY that file:

```bash
node ~/ai-rewind/dist/cli.js rollback-file config.js --commit HEAD
```

**Expected output:**
```
✓ Successfully restored config.js

Note: Changes are not committed yet.
To save: node ~/ai-rewind/dist/cli.js commit "Restored config.js"
```

The file is restored to its good state! 🎉

---

## 🎓 Tutorial Summary

### Commands Learned

**Basic Commands:**
- `init` - Set up AI tracking in a project
- `commit "message"` - Save a checkpoint
- `rollback` - Undo the last change
- `status` - Check current state
- `log` - View history with timestamps

**Advanced Commands:**
- `backups` - List available restore points
- `stats` - View repository statistics
- `rollback-file <file>` - Restore specific files
- `forward <tag>` - Restore from backup
- `diff` - Show uncommitted changes
- `config` - Manage configuration

### Key Concepts

1. **Shadow Repository** - Separate `.git-ai-tracking` that doesn't interfere with main git
2. **Automatic Backups** - Created before each rollback for safety
3. **Timestamped History** - Every commit shows when it was made
4. **Selective Rollback** - Can restore individual files, not just everything
5. **Conflict Detection** - Warns about uncommitted changes in main git

### Best Practices

1. **Use Descriptive Commit Messages:**
   - `FEATURE:` - New functionality
   - `FIX:` - Bug corrections
   - `SAFETY:` - Before risky operations
   - `CHECKPOINT:` - User-requested saves
   - `WIP:` - Work in progress

2. **Regular Checkpoints:**
   - Before major changes
   - After completing features
   - When switching tasks
   - Before experiments

3. **Safety Checks:**
   - Check `status` before major operations
   - View `log` to understand history
   - Use `--dry-run` to preview rollbacks
   - Keep backups of important states

### Common Workflows

#### Workflow 1: Safe AI Development
```bash
# Initialize once
node ~/ai-rewind/dist/cli.js init

# Before AI makes changes
node ~/ai-rewind/dist/cli.js commit "SAFETY: Before AI refactoring"

# After AI completes task
node ~/ai-rewind/dist/cli.js commit "FEATURE: AI implemented authentication"

# If something breaks
node ~/ai-rewind/dist/cli.js rollback
```

#### Workflow 2: Experimental Changes
```bash
# Save current state
node ~/ai-rewind/dist/cli.js commit "CHECKPOINT: Before experiment"

# Try something risky
# ... make experimental changes ...

# If it works
node ~/ai-rewind/dist/cli.js commit "FEATURE: Experiment successful"

# If it fails
node ~/ai-rewind/dist/cli.js rollback
```

#### Workflow 3: Partial Rollback
```bash
# Multiple files changed, but only one has issues
node ~/ai-rewind/dist/cli.js rollback-file problematic-file.js

# Or restore from specific commit
node ~/ai-rewind/dist/cli.js rollback-file file.js --commit abc123
```

### Troubleshooting

**Issue: "AI tracking repository not initialized"**
```bash
node ~/ai-rewind/dist/cli.js init
```

**Issue: "You have uncommitted changes"**
```bash
# Either commit them first
node ~/ai-rewind/dist/cli.js commit "Save current work"

# Or force rollback (loses changes)
node ~/ai-rewind/dist/cli.js rollback --force
```

**Issue: "No AI changes to roll back"**
- You're at the initial commit
- Check history: `node ~/ai-rewind/dist/cli.js log`

**Issue: Main git has conflicts**
```bash
# Commit or stash main git changes first
git stash
# Then rollback
node ~/ai-rewind/dist/cli.js rollback
# Restore main git changes
git stash pop
```

### Windows-Specific Notes

For Windows users, replace `~/ai-rewind` with the full path:
```bash
node C:\Users\YourName\ai-rewind\dist\cli.js init
node C:\Users\YourName\ai-rewind\dist\cli.js commit "message"
```

Or create an alias in PowerShell:
```powershell
function ai-rewind { node C:\Users\YourName\ai-rewind\dist\cli.js $args }
```

---

## 🚀 Next Steps

1. **Practice in a test project** before using on real code
2. **Set up aliases** for easier command access
3. **Configure exclusions** in `.ai-rewind.json`
4. **Integrate with your workflow** - make it a habit!

Remember: AI Rewind is your safety net. Use it liberally - it's better to have too many checkpoints than too few!

## Resources

- **Repository**: https://github.com/hex4def6/ai-rewind
- **Issues**: https://github.com/hex4def6/ai-rewind/issues
- **Configuration**: See `.ai-rewind.example.json` for all options

Happy coding with confidence! 🎉