# 🛠️ EAS Project Setup for FITito

## ✅ Project Already Configured!

Good news! Your FITito project is already linked to EAS Build with the following configuration:

### Current EAS Configuration

**Project ID**: `086f6083-03e0-408f-b119-f888fede4223`
**Project Name**: fitito
**Package**: com.ianmuler.fitito

This means you can start building APKs immediately!

## 🚀 Quick Start

### If You Haven't Logged In Yet

```bash
# Navigate to mobile directory
cd mobile

# Login to your Expo account
expo login
# or
npx expo login
```

### Build Your First APK

```bash
# Build a preview APK for testing
npm run build:android:preview
```

That's it! EAS will handle everything else.

## 📋 What's Already Configured

### 1. **EAS Project**
- ✅ Project created in Expo dashboard
- ✅ Project ID added to `app.json`
- ✅ Build profiles configured in `eas.json`

### 2. **Build Profiles**
- ✅ **Development**: APK with dev client for debugging
- ✅ **Preview**: APK for testing with production backend
- ✅ **Production**: AAB for Google Play Store

### 3. **Environment Variables**
- ✅ `EXPO_PUBLIC_API_URL` configured for preview and production
- ✅ Points to Vercel backend: https://fitito-backend-fx1851mc7-ianmulers-projects.vercel.app

### 4. **Package Scripts**
- ✅ `npm run build:android:preview` - Build preview APK
- ✅ `npm run build:android:production` - Build production AAB
- ✅ `npm run build:android:development` - Build dev client APK
- ✅ All iOS and multi-platform scripts ready

## 🔄 If You Need to Reconfigure

### Option 1: Verify Existing Configuration

```bash
# Check your EAS configuration
npx eas build:configure
```

This will verify your existing setup and make any necessary updates.

### Option 2: Manual Verification

Check that your `app.json` contains:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "086f6083-03e0-408f-b119-f888fede4223"
      }
    }
  }
}
```

## 📱 Expected Workflow

1. **Login** (one time): `expo login`
2. **Build**: `npm run build:android:preview`
3. **Download**: Get APK link from terminal/dashboard
4. **Install**: Transfer to Android device and install
5. **Test**: Verify app works with production backend

## 🎯 Build Profiles Explained

### Development Profile
```bash
npm run build:android:development
```
- APK with Expo dev client
- Hot reload enabled
- Debugging tools available
- Connects to local backend (configurable)

### Preview Profile
```bash
npm run build:android:preview
```
- Standard APK
- Production backend
- Internal distribution
- Perfect for testing before store submission

### Production Profile
```bash
npm run build:android:production
```
- AAB (Android App Bundle) for Google Play
- Production backend
- Fully optimized
- Ready for store submission

## 🔍 Troubleshooting

### "Project not found" Error

If you see this error, reconfigure EAS:

```bash
npx eas build:configure
```

Answer **Y** when prompted to link to existing project.

### "Not logged in" Error

```bash
expo login
# or
npx expo login
```

### "Build failed" Error

Check build logs:

```bash
npx eas build:list
npx eas build:view [build-id] --logs
```

Common causes:
- Missing dependencies
- TypeScript errors
- Invalid configuration in app.json or eas.json

### Environment Variable Issues

Verify `.env.example` exists and contains:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000/api/v1
```

For local development, copy it:

```bash
cp .env.example .env
```

## 📊 Viewing Your Builds

### Expo Dashboard
Visit: [https://expo.dev](https://expo.dev)

Navigate to:
- Your Account → Projects → fitito → Builds

Here you can:
- View all builds
- Download APKs
- See build logs
- Monitor build status

### CLI Commands
```bash
# List all builds
npx eas build:list

# View specific build details
npx eas build:view [build-id]

# View build logs
npx eas build:view [build-id] --logs
```

## 🎨 Customizing Builds

### Update Backend URL

Edit `eas.json`:

```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-new-backend.com/api/v1"
      }
    }
  }
}
```

### Update App Version

Edit `app.json`:

```json
{
  "expo": {
    "version": "1.1.0"
  }
}
```

### Add Custom Environment Variables

Edit `eas.json`:

```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "...",
        "EXPO_PUBLIC_ANALYTICS_ID": "your-id-here",
        "EXPO_PUBLIC_FEATURE_FLAG": "true"
      }
    }
  }
}
```

Access in your app:

```typescript
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const analyticsId = process.env.EXPO_PUBLIC_ANALYTICS_ID;
```

## 🚀 Next Steps

Your FITito app is ready to build! Here's what you can do:

1. **Build a preview APK** to test on your device
2. **Share with testers** using the download URL
3. **Iterate and rebuild** as needed
4. **Build production AAB** when ready for Google Play

## 📚 Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Environment Variables in EAS](https://docs.expo.dev/build-reference/variables/)
- [Build Configuration Reference](https://docs.expo.dev/build/eas-json/)
- [Submitting to App Stores](https://docs.expo.dev/submit/introduction/)

---

**Your FITito EAS project is configured and ready! 🎉**

To start building:
```bash
cd mobile
npm run build:android:preview
```
