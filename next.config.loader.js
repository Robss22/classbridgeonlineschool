/**
 * Next.js Configuration Loader
 * Automatically loads the appropriate configuration based on NODE_ENV
 */

const fs = require('fs');
const path = require('path');

// Get the environment
const env = process.env.NODE_ENV || 'development';

// Define configuration file paths
const configFiles = {
  development: 'next.config.development.js',
  production: 'next.config.production.js',
  default: 'next.config.js'
};

// Function to load configuration
function loadConfig() {
  const configFile = configFiles[env] || configFiles.default;
  const configPath = path.join(__dirname, configFile);
  
  // Check if the specific config file exists
  if (fs.existsSync(configPath)) {
    console.log(`📁 Loading Next.js configuration from: ${configFile}`);
    return require(configPath);
  }
  
  // Fallback to default config
  console.log(`📁 Loading default Next.js configuration (${configFile} not found)`);
  return require('./next.config.js');
}

// Export the loaded configuration
module.exports = loadConfig();
