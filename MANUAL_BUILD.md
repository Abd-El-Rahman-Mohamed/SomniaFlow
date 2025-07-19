# Manual APK Build Guide

If the automated build scripts don't work, follow these manual steps to create your Baby Monitor APK.

## 🔧 Prerequisites

1. **Install Node.js** (v14 or higher)
   ```bash
   # Check if installed
   node --version
   npm --version
   ```

2. **Install Cordova CLI**
   ```bash
   npm install -g cordova
   # Or with sudo if needed
   sudo npm install -g cordova
   ```

3. **Install Android SDK**
   - Download Android Studio from https://developer.android.com/studio
   - Install Android SDK through Android Studio
   - Set environment variables:
     ```bash
     export ANDROID_HOME=/path/to/android-sdk
     export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
     ```

4. **Install Java JDK** (version 8 or higher)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install openjdk-8-jdk
   
   # macOS
   brew install openjdk@8
   
   # Check installation
   java -version
   ```

## 🚀 Manual Build Steps

### Step 1: Create Cordova Project
```bash
# Create new Cordova project
cordova create BabyMonitorApp com.somniaflow.babymonitor "Baby Monitor"

# Enter project directory
cd BabyMonitorApp
```

### Step 2: Copy Web Files
```bash
# Copy your web files to the www directory
cp ../index.html www/
cp ../script.js www/
cp ../style.css www/
cp ../cordova-app.js www/
cp ../manifest.json www/

# Copy config.xml to project root
cp ../config.xml .
```

### Step 3: Add Android Platform
```bash
cordova platform add android
```

### Step 4: Install Essential Plugins
```bash
# Core plugins
cordova plugin add cordova-plugin-whitelist
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-statusbar
cordova plugin add cordova-plugin-splashscreen

# Camera and media plugins
cordova plugin add cordova-plugin-camera
cordova plugin add cordova-plugin-media-capture
cordova plugin add cordova-plugin-file

# Additional plugins
cordova plugin add cordova-plugin-network-information
cordova plugin add cordova-plugin-vibration
cordova plugin add cordova-plugin-screen-orientation
```

### Step 5: Check Requirements
```bash
cordova requirements android
```

This should show:
- ✅ Java JDK: installed
- ✅ Android SDK: installed
- ✅ Android target: installed
- ✅ Gradle: installed

### Step 6: Build APK
```bash
# Debug build (faster)
cordova build android

# Or release build (optimized)
cordova build android --release
```

### Step 7: Find Your APK
```bash
# APK will be located at:
# platforms/android/app/build/outputs/apk/debug/app-debug.apk
# or
# platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk

# Copy to easy location
cp platforms/android/app/build/outputs/apk/debug/app-debug.apk ../baby-monitor.apk
```

## 📱 Install on Android Device

### Method 1: Using ADB
```bash
# Enable USB debugging on your Android device
# Connect device to computer
adb install baby-monitor.apk
```

### Method 2: Manual Installation
1. Transfer `baby-monitor.apk` to your Android device
2. Enable "Unknown sources" in Settings > Security
3. Tap the APK file to install

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. "cordova: command not found"
```bash
npm install -g cordova
# Or with sudo
sudo npm install -g cordova
```

#### 2. "ANDROID_HOME not set"
```bash
# Find your Android SDK path (usually in Android Studio settings)
export ANDROID_HOME=/path/to/android-sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Add to ~/.bashrc or ~/.zshrc to make permanent
echo 'export ANDROID_HOME=/path/to/android-sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools' >> ~/.bashrc
```

#### 3. "Java not found"
```bash
# Install JDK
sudo apt-get install openjdk-8-jdk  # Ubuntu/Debian
brew install openjdk@8              # macOS

# Check installation
java -version
javac -version
```

#### 4. "Gradle build failed"
```bash
# Clean and rebuild
cordova clean android
cordova build android
```

#### 5. "SDK licenses not accepted"
```bash
# Accept all SDK licenses
$ANDROID_HOME/tools/bin/sdkmanager --licenses
```

#### 6. "Build tools not found"
```bash
# Install build tools through Android Studio or command line
$ANDROID_HOME/tools/bin/sdkmanager "build-tools;30.0.3"
```

## 🎯 Verification

After successful build, verify your APK:

```bash
# Check APK file exists and size
ls -lh baby-monitor.apk

# Install and test on device
adb install baby-monitor.apk

# Check app permissions
adb shell pm list permissions com.somniaflow.babymonitor
```

## 📋 Expected Features in APK

Your built APK should include:
- ✅ Camera access for live monitoring
- ✅ Photo capture functionality
- ✅ Video recording capability
- ✅ File storage access
- ✅ Network connectivity monitoring
- ✅ Device vibration support
- ✅ Portrait orientation lock
- ✅ Status bar customization
- ✅ Back button handling

## 🔄 Rebuilding

To rebuild after making changes:

```bash
# Copy updated files
cp ../index.html www/
cp ../script.js www/
cp ../style.css www/

# Rebuild
cordova build android
```

## 📞 Getting Help

If you encounter issues:

1. Check `cordova requirements android` output
2. Verify all environment variables are set
3. Ensure Android SDK and JDK are properly installed
4. Try building a simple "Hello World" Cordova app first
5. Check Cordova documentation: https://cordova.apache.org/docs/

---

**Note**: Building Android APKs requires proper Android development environment setup. The first build may take longer as dependencies are downloaded.