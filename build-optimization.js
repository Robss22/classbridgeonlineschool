#!/usr/bin/env node

/**
 * Build Optimization Script for ClassBridge Online School
 * This script automates various optimization tasks for production builds
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting build optimization...\n');

// Configuration
const config = {
  buildDir: '.next',
  publicDir: 'public',
  optimizedDir: 'public/optimized',
  maxImageSize: 500 * 1024, // 500KB
  compressionLevel: 9,
};

// Utility functions
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
  };
  console.log(`${colors[type]}${message}\x1b[0m`);
}

function executeCommand(command, description) {
  try {
    log(`📋 ${description}...`, 'info');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'success');
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'error');
    return false;
  }
  return true;
}

// Optimization tasks
async function runOptimizations() {
  const tasks = [
    {
      name: 'Clean previous builds',
      command: 'npm run clean',
      description: 'Cleaning previous build artifacts'
    },
    {
      name: 'Install dependencies',
      command: 'npm install',
      description: 'Installing/updating dependencies'
    },
    {
      name: 'Type checking',
      command: 'npm run type-check',
      description: 'Running TypeScript type checking'
    },
    {
      name: 'Linting',
      command: 'npm run lint',
      description: 'Running ESLint checks'
    },
    {
      name: 'Security audit',
      command: 'npm run security:audit',
      description: 'Running security audit'
    },
    {
      name: 'Production build',
      command: 'npm run build:production',
      description: 'Building for production'
    },
    {
      name: 'Bundle analysis',
      command: 'npm run analyze',
      description: 'Analyzing bundle size'
    }
  ];

  for (const task of tasks) {
    const success = executeCommand(task.command, task.description);
    if (!success) {
      log(`❌ Build optimization failed at: ${task.name}`, 'error');
      process.exit(1);
    }
  }
}

// Performance monitoring
function generatePerformanceReport() {
  log('📊 Generating performance report...', 'info');
  
  const report = {
    timestamp: new Date().toISOString(),
    buildSize: getBuildSize(),
    bundleAnalysis: analyzeBundle(),
    recommendations: generateRecommendations()
  };

  fs.writeFileSync(
    'performance-report.json',
    JSON.stringify(report, null, 2)
  );

  log('✅ Performance report generated: performance-report.json', 'success');
}

function getBuildSize() {
  try {
    const buildPath = path.join(process.cwd(), config.buildDir);
    const stats = fs.statSync(buildPath);
    return {
      size: stats.size,
      sizeInMB: (stats.size / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    return { size: 0, sizeInMB: '0', error: error.message };
  }
}

function analyzeBundle() {
  try {
    const chunksPath = path.join(process.cwd(), config.buildDir, 'static/chunks');
    const chunks = fs.readdirSync(chunksPath);
    
    return chunks.map(chunk => {
      const chunkPath = path.join(chunksPath, chunk);
      const stats = fs.statSync(chunkPath);
      return {
        name: chunk,
        size: stats.size,
        sizeInKB: (stats.size / 1024).toFixed(2)
      };
    });
  } catch (error) {
    return { error: error.message };
  }
}

function generateRecommendations() {
  return [
    'Enable gzip compression on your server',
    'Use CDN for static assets',
    'Implement lazy loading for components',
    'Optimize images using WebP format',
    'Consider using React.memo for expensive components',
    'Implement service worker for caching',
    'Use dynamic imports for code splitting'
  ];
}

// Main execution
async function main() {
  try {
    await runOptimizations();
    generatePerformanceReport();
    
    log('\n🎉 Build optimization completed successfully!', 'success');
    log('📈 Your application is now optimized for production', 'success');
    log('📋 Check performance-report.json for detailed analysis', 'info');
    
  } catch (error) {
    log(`❌ Build optimization failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runOptimizations, generatePerformanceReport };
