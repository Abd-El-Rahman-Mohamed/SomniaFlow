#!/bin/bash

# Simple Baby Monitor APK Build Script
echo "🍼 Simple Baby Monitor APK Build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Install Cordova if not present
if ! command -v cordova &> /dev/null; then
    print_status "Installing Cordova CLI..."
    npm install -g cordova
    if [ $? -ne 0 ]; then
        print_error "Failed to install Cordova. Try: sudo npm install -g cordova"
        exit 1
    fi
fi

# Create fresh Cordova project
PROJECT_NAME="BabyMonitorApp"
print_status "Creating fresh Cordova project: $PROJECT_NAME"

# Remove existing project if it exists
if [ -d "$PROJECT_NAME" ]; then
    rm -rf "$PROJECT_NAME"
fi

# Create new Cordova project
cordova create "$PROJECT_NAME" com.somniaflow.babymonitor "Baby Monitor"

if [ $? -ne 0 ]; then
    print_error "Failed to create Cordova project"
    exit 1
fi

print_success "Cordova project created"

# Copy our files to the project
print_status "Copying web files..."
cp index.html "$PROJECT_NAME/www/"
cp script.js "$PROJECT_NAME/www/"
cp style.css "$PROJECT_NAME/www/"
cp cordova-app.js "$PROJECT_NAME/www/"
cp manifest.json "$PROJECT_NAME/www/"
cp config.xml "$PROJECT_NAME/"

# Create basic icons (simple colored squares as placeholders)
print_status "Creating basic app icons..."
mkdir -p "$PROJECT_NAME/res/icon/android"

# Create simple SVG icon and convert to different sizes
cat > "$PROJECT_NAME/res/icon/icon.svg" << 'EOF'
<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#2c5282"/>
  <circle cx="96" cy="96" r="60" fill="#4FC3F7"/>
  <text x="96" y="110" text-anchor="middle" fill="white" font-size="24" font-family="Arial">👶</text>
</svg>
EOF

# Enter project directory
cd "$PROJECT_NAME"

# Add Android platform
print_status "Adding Android platform..."
cordova platform add android

# Add essential plugins
print_status "Adding plugins..."
cordova plugin add cordova-plugin-whitelist
cordova plugin add cordova-plugin-camera
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-statusbar
cordova plugin add cordova-plugin-splashscreen

# Check requirements
print_status "Checking Android requirements..."
cordova requirements android

# Build the APK
print_status "Building APK..."
cordova build android

if [ $? -eq 0 ]; then
    print_success "Build completed!"
    
    # Find and copy APK
    APK_PATH=$(find platforms/android -name "*.apk" -type f | head -1)
    if [ -n "$APK_PATH" ]; then
        cp "$APK_PATH" "../baby-monitor.apk"
        print_success "APK saved as: baby-monitor.apk"
        
        # Show file size
        cd ..
        APK_SIZE=$(du -h "baby-monitor.apk" | cut -f1)
        print_success "APK size: $APK_SIZE"
        
        echo ""
        echo "🎉 SUCCESS! Your Baby Monitor APK is ready!"
        echo "📱 Install with: adb install baby-monitor.apk"
        echo "📁 Or transfer baby-monitor.apk to your Android device"
        
    else
        print_error "APK file not found"
        find platforms/android -name "*.apk" -type f
    fi
else
    print_error "Build failed. Check the error messages above."
    echo ""
    echo "💡 Common fixes:"
    echo "1. Install Android Studio"
    echo "2. Set ANDROID_HOME environment variable"
    echo "3. Install JDK 8 or higher"
    echo "4. Accept Android SDK licenses"
fi