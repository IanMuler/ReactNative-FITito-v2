const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configure path aliases for Metro
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  '@/components': path.resolve(__dirname, 'src/components'),
  '@/features': path.resolve(__dirname, 'src/features'),
  '@/hooks': path.resolve(__dirname, 'src/hooks'),
  '@/services': path.resolve(__dirname, 'src/services'),
  '@/store': path.resolve(__dirname, 'src/store'),
  '@/utils': path.resolve(__dirname, 'src/utils'),
  '@/types': path.resolve(__dirname, 'src/types'),
  '@/constants': path.resolve(__dirname, 'src/constants'),
};

module.exports = config;
