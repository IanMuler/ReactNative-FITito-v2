# 📱 FITito APK Build Instructions

## 🚀 APK Generation Setup Complete!

All configuration files have been created and the project is ready to build APKs using EAS Build.

## 📋 Prerequisites

### 1. **Expo Account Setup**
Create a free Expo account at [expo.dev](https://expo.dev) if you don't have one.

⚠️ **Important**: If you see "eas: not found" error, the scripts use `npx eas` instead of `eas`.

### 2. **Verify App Assets**
Your app icons and splash screens are already configured:

```
mobile/assets/
├── icon.png              # 1024x1024, app icon
├── adaptive-icon.png     # 1024x1024, Android adaptive icon
├── splash.png            # Splash screen
└── splash-icon.png       # Splash screen icon
```

## 🛠️ Build Commands

### Quick APK Build (Recommended)
```bash
# Navigate to mobile directory
cd mobile

# Build Android APK for testing
npm run build:android:preview
```

### All Available Build Commands
```bash
# Configure EAS Build (run once)
npm run build:configure

# Android Builds
npm run build:android:development  # Development APK with dev client
npm run build:android:preview      # Preview APK for testing
npm run build:android:production   # Production AAB for Google Play

# iOS Builds (requires macOS and Apple Developer account)
npm run build:ios:development
npm run build:ios:preview
npm run build:ios:production

# Build for both platforms
npm run build:all:preview
npm run build:all:production
```

## 📱 Build Profiles

### **Preview Profile** (Recommended for APK)
- **Output**: APK file ready to install
- **API**: Production backend (https://fitito-backend-fx1851mc7-ianmulers-projects.vercel.app)
- **Distribution**: Internal testing
- **Use Case**: Share with testers, install directly

### **Development Profile**
- **Output**: Development APK with dev client
- **API**: Local backend (http://192.168.1.50:3000)
- **Features**: Hot reload, debugging tools
- **Use Case**: Active development

### **Production Profile**
- **Output**: AAB file for Google Play Store
- **API**: Production backend only
- **Optimization**: Fully optimized and signed
- **Use Case**: App store submission

## 🔧 Configuration Files

### ✅ `eas.json`
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "buildType": "apk"
    },
    "preview": {
      "buildType": "apk",
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://fitito-backend-fx1851mc7-ianmulers-projects.vercel.app/api/v1"
      }
    },
    "production": {
      "buildType": "app-bundle",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://fitito-backend-fx1851mc7-ianmulers-projects.vercel.app/api/v1"
      }
    }
  }
}
```

### ✅ `app.json`
- App icon configuration: `./assets/icon.png`
- Splash screen: `./assets/splash.png`
- Android package: `com.ianmuler.fitito`
- iOS bundle: Not configured yet (pending)
- EAS Project ID: `086f6083-03e0-408f-b119-f888fede4223`

### ✅ `package.json`
- All build scripts added
- expo-dev-client dependency installed

## 🚀 Step-by-Step APK Generation

### 1. **First Time Setup**
```bash
# Install Expo CLI globally (if not installed)
npm install -g @expo/cli

# Login to your Expo account
expo login
# or if that doesn't work:
npx expo login

# Navigate to mobile directory
cd mobile
```

### 2. **Configure EAS (First Time Only)**
```bash
# This step is only needed once
npm run build:configure
```

This will verify your EAS project configuration.

### 3. **Build APK**
```bash
# Build preview APK (most common)
npm run build:android:preview

# Or use EAS CLI directly
npx eas build --platform android --profile preview
```

### 4. **Download APK**
- Build will run on EAS servers (2-5 minutes)
- Download link will be provided in terminal
- APK also available in Expo dashboard

### 5. **Install APK**
- Transfer APK to Android device
- Enable "Install from unknown sources" in Android settings
- Install and test your app!

## 📊 Build Status & Monitoring

### EAS Dashboard
- View builds: [expo.dev/accounts/[username]/projects/fitito/builds](https://expo.dev)
- Download APKs, view logs, manage builds
- Monitor build progress in real-time

### Local Monitoring
```bash
# Check build status
npx eas build:list

# View specific build
npx eas build:view [build-id]
```

## 🎨 App Configuration

### App Identity
- **Name**: FITito
- **Package**: com.ianmuler.fitito
- **Version**: 1.0.0
- **Orientation**: Portrait only
- **New Architecture**: Enabled

### API Configuration
- **Development**: Local backend (http://192.168.1.50:3000/api/v1)
- **Preview/Production**: Vercel backend (https://fitito-backend-fx1851mc7-ianmulers-projects.vercel.app/api/v1)

### Theme
- **Splash Background**: #121623 (dark blue)
- **Adaptive Icon Background**: #ffffff (white)
- **UI Style**: Light mode

## ⚡ Pro Tips

### Fast Development Workflow
1. Use **preview builds** for testing
2. **Development builds** for active coding
3. **Production builds** only for store submission

### Debugging Build Issues
```bash
# Check build logs
npx eas build:view [build-id] --logs

# Validate configuration
npx expo doctor

# Check for common issues
npm run lint && npm run type-check
```

### Sharing APKs
- Use the download URL from EAS
- Upload to internal testing platforms
- QR codes available in Expo dashboard

## 🔥 Ready to Build!

Your FITito app is fully configured for APK generation. Simply run:

```bash
cd mobile
npm run build:android:preview
```

The APK will be ready in 2-5 minutes! 🎉

---

## 📚 Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [App Icon Guidelines](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
- [Expo Splash Screen](https://docs.expo.dev/versions/latest/sdk/splash-screen/)
- [APK vs AAB Guide](https://docs.expo.dev/build-reference/apk/)

## 🔄 Environment Variables

The app uses environment variables to switch between local and production backends:

- **EXPO_PUBLIC_API_URL**: API base URL
  - Development: `http://192.168.1.50:3000/api/v1` (local)
  - Production: `https://fitito-backend-fx1851mc7-ianmulers-projects.vercel.app/api/v1` (Vercel)

Variables are automatically set by EAS Build based on the profile (preview/production).

For local development, create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

---

**¡Tu app FITito lista para compilar! 🚀**
