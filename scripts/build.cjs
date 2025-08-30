#!/usr/bin/env node

/**
 * Cross-platform build script that works with npm, bun, or direct node
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function hasCommand(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function build() {
  const distDir = path.join(__dirname, '..', 'dist');
  
  // Create dist directory if it doesn't exist
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  console.log('Building AI Tracker...');

  try {
    if (hasCommand('bun')) {
      console.log('Using Bun to build...');
      execSync('bun build src/cli.ts --outdir dist --target node', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
    } else if (hasCommand('npx')) {
      console.log('Using TypeScript compiler to build...');
      execSync('npx tsc', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      
      // Make CLI executable
      const cliPath = path.join(distDir, 'cli.js');
      if (fs.existsSync(cliPath)) {
        const content = fs.readFileSync(cliPath, 'utf8');
        if (!content.startsWith('#!/usr/bin/env node')) {
          fs.writeFileSync(cliPath, '#!/usr/bin/env node\n' + content);
        }
        // Make executable on Unix-like systems
        if (process.platform !== 'win32') {
          fs.chmodSync(cliPath, '755');
        }
      }
    } else {
      console.error('Error: No build tool available. Please install Bun or TypeScript.');
      console.error('  npm install -g bun');
      console.error('  or');
      console.error('  npm install --save-dev typescript');
      process.exit(1);
    }
    
    console.log('✓ Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  build();
}

module.exports = { build };