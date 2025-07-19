# Baby Monitor - Sleep Tracker APK

A comprehensive baby monitoring application with live video feed, sleep tracking, and environmental monitoring. This project converts a web-based baby monitor into a native Android APK using Apache Cordova.

## 🍼 Features

- **Live Video Feed**: Real-time baby monitoring with camera integration
- **Sleep Tracking**: Monitor sleep duration, wake-ups, and sleep patterns
- **Screenshot & Recording**: Capture photos and record videos of your baby
- **Environmental Monitoring**: Track heart rate, oxygen levels, air quality, and humidity
- **Fullscreen Mode**: Immersive viewing experience
- **Offline Support**: Works without internet connection for basic features
- **Native Mobile Experience**: Optimized for Android devices

## 📱 APK Conversion

This project uses Apache Cordova to convert the web application into a native Android APK with the following capabilities:

### Native Features
- Camera access for live monitoring
- File system access for saving photos/videos
- Device vibration for notifications
- Network status monitoring
- Screen orientation control
- Status bar customization
- Back button handling

### Permissions
- Camera access
- Microphone access
- File storage access
- Network access
- Wake lock (keep screen on)

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v14 or higher)
   ```bash
   # Check if installed
   node --version
   npm --version
   ```

2. **Android SDK** (for building APK)
   - Install Android Studio or Android SDK Command Line Tools
   - Set `ANDROID_HOME` environment variable
   - Add SDK tools to PATH

3. **Java Development Kit (JDK)**
   - JDK 8 or higher required

### Build APK

1. **Clone/Download the project**
   ```bash
   # If using git
   git clone <repository-url>
   cd baby-monitor-app
   ```

2. **Run the build script**
   ```bash
   # Make script executable
   chmod +x build-apk.sh
   
   # Run the build
   ./build-apk.sh
   ```

3. **Alternative manual build**
   ```bash
   # Install Cordova globally
   npm install -g cordova
   
   # Install dependencies
   npm install
   
   # Add Android platform
   cordova platform add android
   
   # Install plugins
   cordova plugin add cordova-plugin-whitelist
   cordova plugin add cordova-plugin-camera
   cordova plugin add cordova-plugin-media-capture
   cordova plugin add cordova-plugin-file
   cordova plugin add cordova-plugin-device
   # ... (see build-apk.sh for complete list)
   
   # Build APK
   cordova build android
   ```

## 📦 Installation

### On Android Device

1. **Enable Unknown Sources**
   - Go to Settings > Security
   - Enable "Unknown sources" or "Install unknown apps"

2. **Install APK**
   ```bash
   # Using ADB (if device connected to computer)
   adb install baby-monitor.apk
   
   # Or transfer APK to device and tap to install
   ```

3. **Grant Permissions**
   - Camera access
   - Microphone access
   - Storage access

## 🛠️ Development

### Project Structure
```
baby-monitor-app/
├── index.html          # Main HTML file
├── script.js           # Main JavaScript functionality
├── style.css           # Styling and responsive design
├── cordova-app.js      # Cordova-specific functionality
├── config.xml          # Cordova configuration
├── package.json        # Node.js dependencies
├── manifest.json       # PWA manifest
├── build-apk.sh        # Build script
├── res/                # App resources (icons, splash screens)
│   ├── icon/
│   │   ├── android/    # Android icons
│   │   └── ios/        # iOS icons
│   └── screen/
│       ├── android/    # Android splash screens
│       └── ios/        # iOS splash screens
└── platforms/          # Generated platform code (after build)
```

### Key Files

- **config.xml**: Cordova configuration with permissions, plugins, and platform settings
- **cordova-app.js**: Native device integration (camera, file system, notifications)
- **script.js**: Main app logic with Cordova integration
- **package.json**: Dependencies and build scripts

### Customization

1. **App Information**
   - Edit `config.xml` to change app name, description, version
   - Update `package.json` for npm package info

2. **Permissions**
   - Modify `config.xml` to add/remove Android permissions
   - Update iOS permissions in the same file

3. **Icons and Splash Screens**
   - Replace files in `res/icon/` and `res/screen/`
   - Update references in `config.xml`

4. **Firebase Configuration**
   - Update Firebase config in `index.html`
   - Modify API keys and project settings

## 🔧 Troubleshooting

### Common Build Issues

1. **Cordova not found**
   ```bash
   npm install -g cordova
   # Or with sudo if needed
   sudo npm install -g cordova
   ```

2. **Android SDK not found**
   ```bash
   # Set environment variables
   export ANDROID_HOME=/path/to/android-sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

3. **Java not found**
   ```bash
   # Install JDK
   sudo apt-get install openjdk-8-jdk  # Ubuntu/Debian
   brew install openjdk@8              # macOS
   ```

4. **Gradle build failed**
   ```bash
   # Clean and rebuild
   cordova clean android
   cordova build android
   ```

### Runtime Issues

1. **Camera not working**
   - Ensure camera permissions are granted
   - Check if device has camera hardware
   - Test on physical device (not emulator)

2. **Video recording fails**
   - Check storage permissions
   - Ensure sufficient storage space
   - Test with shorter recording duration

3. **Network features not working**
   - Check internet connectivity
   - Verify Firebase configuration
   - Test with mobile data and WiFi

## 📋 Requirements Check

Run this command to check if your system meets the requirements:

```bash
cordova requirements android
```

This will check for:
- Java JDK
- Android SDK
- Android target SDK
- Gradle

## 🔒 Security

- All network requests use HTTPS
- Camera access requires explicit user permission
- File access is sandboxed to app directory
- Firebase security rules should be configured properly

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on Android device
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review Cordova documentation
3. Check Android development requirements
4. Test on multiple devices

---

**Note**: This app is designed for educational and personal use. For commercial baby monitoring applications, ensure compliance with relevant safety standards and regulations.