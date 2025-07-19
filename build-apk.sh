#!/bin/bash

# Baby Monitor APK Build Script
echo "🍼 Building Baby Monitor APK..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Install Cordova globally if not already installed
if ! command -v cordova &> /dev/null; then
    print_status "Installing Cordova CLI globally..."
    npm install -g cordova
    if [ $? -ne 0 ]; then
        print_error "Failed to install Cordova CLI. You may need to run with sudo:"
        print_error "sudo npm install -g cordova"
        exit 1
    fi
    print_success "Cordova CLI installed successfully"
fi

# Create a temporary Cordova project if needed
if [ ! -d "platforms" ] && [ ! -d "plugins" ]; then
    print_status "Initializing Cordova project structure..."
    
    # Create a temporary directory for the Cordova project
    TEMP_DIR="temp_cordova_project"
    
    # Create new Cordova project in temp directory
    cordova create "$TEMP_DIR" com.somniaflow.babymonitor "Baby Monitor"
    
    if [ $? -eq 0 ]; then
        print_success "Cordova project created successfully"
        
        # Copy our web files to the Cordova project
        print_status "Copying web files to Cordova project..."
        cp index.html "$TEMP_DIR/www/"
        cp script.js "$TEMP_DIR/www/"
        cp style.css "$TEMP_DIR/www/"
        cp cordova-app.js "$TEMP_DIR/www/"
        cp manifest.json "$TEMP_DIR/www/"
        cp config.xml "$TEMP_DIR/"
        
        # Create resource directories
        mkdir -p "$TEMP_DIR/res/icon/android"
        mkdir -p "$TEMP_DIR/res/icon/ios"
        mkdir -p "$TEMP_DIR/res/screen/android"
        mkdir -p "$TEMP_DIR/res/screen/ios"
        
        # Move into the Cordova project directory
        cd "$TEMP_DIR"
        
        print_success "Web files copied successfully"
    else
        print_error "Failed to create Cordova project"
        exit 1
    fi
else
    print_status "Using existing Cordova project structure"
fi

# Add Android platform
print_status "Adding Android platform..."
cordova platform add android --save
if [ $? -ne 0 ]; then
    print_warning "Android platform might already be added"
fi

# Install plugins
print_status "Installing Cordova plugins..."
cordova plugin add cordova-plugin-whitelist --save
cordova plugin add cordova-plugin-statusbar --save
cordova plugin add cordova-plugin-splashscreen --save
cordova plugin add cordova-plugin-camera --save
cordova plugin add cordova-plugin-media-capture --save
cordova plugin add cordova-plugin-file --save
cordova plugin add cordova-plugin-device --save
cordova plugin add cordova-plugin-network-information --save
cordova plugin add cordova-plugin-vibration --save
cordova plugin add cordova-plugin-screen-orientation --save
cordova plugin add cordova-plugin-inappbrowser --save

# Check Android requirements
print_status "Checking Android build requirements..."
cordova requirements android

# Prepare the project
print_status "Preparing Cordova project..."
cordova prepare android

# Build the APK
print_status "Building Android APK..."
cordova build android --release

if [ $? -eq 0 ]; then
    print_success "APK built successfully!"
    
    # Find the APK file
    APK_PATH=$(find platforms/android -name "*.apk" -type f | head -1)
    if [ -n "$APK_PATH" ]; then
        print_success "APK location: $APK_PATH"
        
        # Copy APK to parent directory if we're in temp directory
        if [ -d "../$TEMP_DIR" ]; then
            cp "$APK_PATH" "../baby-monitor.apk"
            print_success "APK copied to: ../baby-monitor.apk"
            
            # Show APK info
            APK_SIZE=$(du -h "../baby-monitor.apk" | cut -f1)
            print_success "APK size: $APK_SIZE"
            
            # Move back to original directory
            cd ..
            
            # Clean up temp directory
            print_status "Cleaning up temporary files..."
            rm -rf "$TEMP_DIR"
        else
            # Copy APK to current directory
            cp "$APK_PATH" "./baby-monitor.apk"
            print_success "APK copied to: ./baby-monitor.apk"
            
            # Show APK info
            APK_SIZE=$(du -h "./baby-monitor.apk" | cut -f1)
            print_success "APK size: $APK_SIZE"
        fi
    else
        print_warning "APK file not found in expected location"
        # List all APK files for debugging
        print_status "Searching for APK files..."
        find . -name "*.apk" -type f
    fi
    
    echo ""
    echo "🎉 Build completed successfully!"
    echo "📱 You can now install the APK on your Android device"
    echo "📋 To install: adb install baby-monitor.apk"
    echo "   Or transfer the APK to your device and install manually"
    echo ""
    echo "📋 APK Features:"
    echo "   ✅ Camera access for live monitoring"
    echo "   ✅ Video recording and photo capture"
    echo "   ✅ File storage for media"
    echo "   ✅ Network connectivity monitoring"
    echo "   ✅ Device vibration support"
    echo "   ✅ Portrait orientation lock"
    
else
    print_error "Build failed. Please check the error messages above."
    echo ""
    echo "Common solutions:"
    echo "1. Make sure Android SDK is installed and configured"
    echo "2. Set ANDROID_HOME environment variable"
    echo "3. Install Java Development Kit (JDK 8 or higher)"
    echo "4. Run: cordova requirements android"
    echo "5. Install Android Studio and accept SDK licenses"
    exit 1
fi