#!/bin/bash

# Android Development Setup Script for Ubuntu/Debian
echo "🔧 Setting up Android development environment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    print_error "This script is designed for Linux systems"
    exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update

# Install Java JDK
print_status "Installing Java JDK 11..."
sudo apt install -y openjdk-11-jdk

# Verify Java installation
if java -version &> /dev/null; then
    print_success "Java JDK installed successfully"
    java -version
else
    print_error "Failed to install Java JDK"
    exit 1
fi

# Install required packages
print_status "Installing required packages..."
sudo apt install -y wget unzip curl

# Create Android directory
ANDROID_HOME="$HOME/Android/Sdk"
mkdir -p "$ANDROID_HOME"

# Download Android Command Line Tools
print_status "Downloading Android Command Line Tools..."
cd /tmp
wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O cmdline-tools.zip

if [ $? -eq 0 ]; then
    print_success "Android Command Line Tools downloaded"
else
    print_error "Failed to download Android Command Line Tools"
    exit 1
fi

# Extract command line tools
print_status "Extracting Android Command Line Tools..."
unzip -q cmdline-tools.zip
mkdir -p "$ANDROID_HOME/cmdline-tools"
mv cmdline-tools "$ANDROID_HOME/cmdline-tools/latest"

# Set environment variables
print_status "Setting up environment variables..."
BASHRC="$HOME/.bashrc"

# Remove existing Android environment variables
sed -i '/ANDROID_HOME/d' "$BASHRC"
sed -i '/JAVA_HOME/d' "$BASHRC"

# Add new environment variables
cat >> "$BASHRC" << EOF

# Android Development Environment
export ANDROID_HOME=\$HOME/Android/Sdk
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=\$PATH:\$ANDROID_HOME/platform-tools
export PATH=\$PATH:\$ANDROID_HOME/tools
export PATH=\$PATH:\$ANDROID_HOME/tools/bin
EOF

# Source the updated bashrc
source "$BASHRC"

# Export for current session
export ANDROID_HOME="$HOME/Android/Sdk"
export JAVA_HOME="/usr/lib/jvm/java-11-openjdk-amd64"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"
export PATH="$PATH:$ANDROID_HOME/platform-tools"

print_success "Environment variables set"

# Install Android SDK components
print_status "Installing Android SDK components..."

# Accept licenses first
yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses

# Install essential SDK components
"$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" \
    "platform-tools" \
    "platforms;android-33" \
    "build-tools;33.0.2" \
    "extras;android;m2repository" \
    "extras;google;m2repository"

if [ $? -eq 0 ]; then
    print_success "Android SDK components installed"
else
    print_warning "Some SDK components may have failed to install"
fi

# Install Gradle
print_status "Installing Gradle..."
sudo apt install -y gradle

# Verify installation
print_status "Verifying installation..."

echo ""
echo "🔍 Verification Results:"
echo "========================"

# Check Java
if java -version &> /dev/null; then
    print_success "Java: $(java -version 2>&1 | head -n 1)"
else
    print_error "Java: Not working"
fi

# Check Android SDK
if [ -d "$ANDROID_HOME" ]; then
    print_success "Android SDK: $ANDROID_HOME"
else
    print_error "Android SDK: Not found"
fi

# Check Gradle
if gradle -version &> /dev/null; then
    print_success "Gradle: $(gradle -version | grep Gradle | head -n 1)"
else
    print_error "Gradle: Not working"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Close and reopen your terminal (or run: source ~/.bashrc)"
echo "2. Run: cordova requirements android"
echo "3. If all requirements are met, run: ./build-simple.sh"
echo ""
echo "💡 If you need Android Studio GUI:"
echo "   Download from: https://developer.android.com/studio"
echo ""

# Clean up
rm -f /tmp/cmdline-tools.zip
rm -rf /tmp/cmdline-tools

print_success "Setup script completed successfully!"