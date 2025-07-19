// Cordova-specific functionality for Baby Monitor App
class CordovaApp {
    constructor() {
        this.isDeviceReady = false;
        this.deviceInfo = null;
        this.networkInfo = null;
        this.init();
    }

    init() {
        document.addEventListener('deviceready', () => {
            this.onDeviceReady();
        }, false);

        // Fallback for web browsers
        if (!window.cordova) {
            setTimeout(() => {
                this.onDeviceReady();
            }, 1000);
        }
    }

    onDeviceReady() {
        console.log('Cordova device ready');
        this.isDeviceReady = true;
        
        // Initialize device information
        this.initializeDevice();
        
        // Initialize network monitoring
        this.initializeNetwork();
        
        // Initialize camera permissions
        this.initializeCamera();
        
        // Initialize status bar
        this.initializeStatusBar();
        
        // Initialize screen orientation
        this.initializeOrientation();
        
        // Initialize back button handling
        this.initializeBackButton();
        
        // Notify main app that Cordova is ready
        if (window.babyMonitorApp) {
            window.babyMonitorApp.onCordovaReady();
        }
    }

    initializeDevice() {
        if (window.device) {
            this.deviceInfo = {
                platform: device.platform,
                version: device.version,
                uuid: device.uuid,
                model: device.model,
                manufacturer: device.manufacturer
            };
            console.log('Device info:', this.deviceInfo);
        }
    }

    initializeNetwork() {
        if (navigator.connection) {
            this.networkInfo = {
                type: navigator.connection.type,
                downlinkMax: navigator.connection.downlinkMax
            };
            
            // Listen for network changes
            document.addEventListener('online', () => {
                console.log('Network: Online');
                this.onNetworkChange(true);
            }, false);
            
            document.addEventListener('offline', () => {
                console.log('Network: Offline');
                this.onNetworkChange(false);
            }, false);
        }
    }

    onNetworkChange(isOnline) {
        if (window.babyMonitorApp) {
            window.babyMonitorApp.onNetworkChange(isOnline);
        }
    }

    initializeCamera() {
        // Request camera permissions on app start
        if (navigator.camera) {
            console.log('Camera plugin available');
        }
    }

    initializeStatusBar() {
        if (window.StatusBar) {
            StatusBar.styleDefault();
            StatusBar.backgroundColorByHexString('#1e3a5f');
            console.log('Status bar configured');
        }
    }

    initializeOrientation() {
        if (window.screen && window.screen.orientation) {
            // Lock to portrait mode
            screen.orientation.lock('portrait').catch(err => {
                console.warn('Could not lock orientation:', err);
            });
        }
    }

    initializeBackButton() {
        document.addEventListener('backbutton', (e) => {
            e.preventDefault();
            this.handleBackButton();
        }, false);
    }

    handleBackButton() {
        // Check if we're in fullscreen mode
        const cameraSection = document.querySelector('.camera-section');
        if (cameraSection && cameraSection.classList.contains('fullscreen')) {
            // Exit fullscreen
            if (window.babyMonitorApp) {
                window.babyMonitorApp.toggleFullscreen();
            }
            return;
        }

        // Check if we're not on dashboard
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav && activeNav.dataset.tab !== 'dashboard') {
            // Go back to dashboard
            const dashboardNav = document.querySelector('.nav-item[data-tab="dashboard"]');
            if (dashboardNav) {
                dashboardNav.click();
            }
            return;
        }

        // Show exit confirmation
        this.showExitConfirmation();
    }

    showExitConfirmation() {
        if (navigator.notification) {
            navigator.notification.confirm(
                'Are you sure you want to exit Baby Monitor?',
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        navigator.app.exitApp();
                    }
                },
                'Exit App',
                ['Yes', 'No']
            );
        } else {
            if (confirm('Are you sure you want to exit Baby Monitor?')) {
                if (navigator.app) {
                    navigator.app.exitApp();
                }
            }
        }
    }

    // Camera functionality
    async takePicture(options = {}) {
        return new Promise((resolve, reject) => {
            if (!navigator.camera) {
                reject(new Error('Camera not available'));
                return;
            }

            const defaultOptions = {
                quality: 75,
                destinationType: Camera.DestinationType.FILE_URI,
                sourceType: Camera.PictureSourceType.CAMERA,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 1920,
                targetHeight: 1080,
                mediaType: Camera.MediaType.PICTURE,
                allowEdit: false,
                correctOrientation: true,
                saveToPhotoAlbum: true
            };

            const cameraOptions = { ...defaultOptions, ...options };

            navigator.camera.getPicture(
                (imageUri) => {
                    console.log('Picture taken:', imageUri);
                    resolve(imageUri);
                },
                (error) => {
                    console.error('Camera error:', error);
                    reject(new Error('Camera error: ' + error));
                },
                cameraOptions
            );
        });
    }

    // Video capture functionality
    async captureVideo(options = {}) {
        return new Promise((resolve, reject) => {
            if (!navigator.device || !navigator.device.capture) {
                reject(new Error('Video capture not available'));
                return;
            }

            const defaultOptions = {
                limit: 1,
                duration: 30, // 30 seconds max
                quality: 1 // High quality
            };

            const captureOptions = { ...defaultOptions, ...options };

            navigator.device.capture.captureVideo(
                (mediaFiles) => {
                    console.log('Video captured:', mediaFiles);
                    resolve(mediaFiles[0]);
                },
                (error) => {
                    console.error('Video capture error:', error);
                    reject(new Error('Video capture error: ' + error.code));
                },
                captureOptions
            );
        });
    }

    // File operations
    async saveFile(data, filename) {
        return new Promise((resolve, reject) => {
            if (!window.requestFileSystem) {
                reject(new Error('File system not available'));
                return;
            }

            window.requestFileSystem(
                LocalFileSystem.PERSISTENT,
                0,
                (fs) => {
                    fs.root.getFile(
                        filename,
                        { create: true, exclusive: false },
                        (fileEntry) => {
                            fileEntry.createWriter(
                                (fileWriter) => {
                                    fileWriter.onwriteend = () => {
                                        console.log('File saved:', filename);
                                        resolve(fileEntry.toURL());
                                    };
                                    
                                    fileWriter.onerror = (e) => {
                                        console.error('File write error:', e);
                                        reject(new Error('File write error'));
                                    };
                                    
                                    fileWriter.write(data);
                                },
                                (error) => {
                                    console.error('File writer error:', error);
                                    reject(new Error('File writer error'));
                                }
                            );
                        },
                        (error) => {
                            console.error('File creation error:', error);
                            reject(new Error('File creation error'));
                        }
                    );
                },
                (error) => {
                    console.error('File system error:', error);
                    reject(new Error('File system error'));
                }
            );
        });
    }

    // Vibration
    vibrate(duration = 100) {
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    // Show native notification
    showNotification(message, title = 'Baby Monitor') {
        if (navigator.notification) {
            navigator.notification.alert(
                message,
                null,
                title,
                'OK'
            );
        } else {
            alert(title + ': ' + message);
        }
    }

    // Get device information
    getDeviceInfo() {
        return this.deviceInfo;
    }

    // Get network information
    getNetworkInfo() {
        return this.networkInfo;
    }

    // Check if running in Cordova
    isCordova() {
        return !!window.cordova;
    }

    // Check if device is ready
    isReady() {
        return this.isDeviceReady;
    }
}

// Initialize Cordova app
window.cordovaApp = new CordovaApp();