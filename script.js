// Baby Monitor App JavaScript
class BabyMonitorApp {
    constructor() {
        this.isLive = true;
        this.isRecording = false;
        this.currentTime = new Date();
        this.sleepStartTime = new Date(this.currentTime.getTime() - (4 * 60 + 40) * 60 * 1000);
        this.wakeUps = 2;
        this.movement = 31;
        this.temperature = 22;
        this.humidity = 40;
        this.airQuality = 'Good';
        this.videoUrl = null;
        this.videoElement = null;
        this.firestoreUnsubscribe = null;
        
        // Recording functionality
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.recordingStartTime = null;
        this.recordingTimer = null;
        
        this.init();
    }

    init() {
        this.updateTime();
        this.setupEventListeners();
        this.startLiveUpdates();
        this.initializeAnimations();
        this.initializeVideoFeed();
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: false 
        });
        
        const timeElement = document.querySelector('.status-time');
        if (timeElement) {
            timeElement.textContent = timeString;
        }
    }

    setupEventListeners() {
        // Camera control buttons
        const controlButtons = document.querySelectorAll('.control-btn');
        controlButtons.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCameraControl(index, btn);
            });
        });

        // Navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach((item) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(item);
            });
        });

        // Live badge is now static (no click functionality)

        // Touch gestures
        this.setupTouchGestures();

        // Keyboard navigation
        this.setupKeyboardNavigation();
    }

    handleCameraControl(index, button) {
        const actions = ['photo', 'record', 'fullscreen'];
        const action = actions[index];
        
        // Add visual feedback
        button.style.transform = 'scale(0.9)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
        
        switch(action) {
            case 'photo':
                this.takePhoto();
                break;
            case 'record':
                this.toggleRecording(button);
                break;
            case 'fullscreen':
                this.toggleFullscreen();
                break;
        }
    }

    toggleAudio() {
        console.log('Audio toggled');
        this.showNotification('Audio ' + (Math.random() > 0.5 ? 'enabled' : 'muted'));
    }

    async takePhoto() {
        console.log('Taking photo...');
        
        try {
            let imageData = null;
            const videoElement = document.getElementById('babyVideo');
            
            // Method 1: Capture from video element if available
            if (videoElement && videoElement.style.display === 'block' && !videoElement.paused) {
                console.log('Capturing screenshot from video element');
                imageData = await this.captureVideoFrame(videoElement);
            }
            
            // Method 2: Capture camera section using html2canvas (fallback)
            if (!imageData) {
                console.log('Capturing screenshot from camera section');
                imageData = await this.captureCameraSection();
            }
            
            // Method 3: Use screen capture API (final fallback)
            if (!imageData) {
                console.log('Using screen capture for screenshot');
                imageData = await this.captureScreenshot();
            }
            
            if (imageData) {
                // Save the screenshot
                this.saveScreenshot(imageData);
                this.flashEffect();
                this.showNotification('Screenshot saved successfully');
                
                // Log analytics
                if (window.firebaseAnalytics && window.firebaseLogEvent) {
                    try {
                        window.firebaseLogEvent(window.firebaseAnalytics, 'screenshot_taken', {
                            timestamp: new Date().toISOString(),
                            method: imageData.method || 'unknown'
                        });
                    } catch (error) {
                        console.warn('Failed to log screenshot analytics:', error);
                    }
                }
                
                console.log('Screenshot taken successfully');
            } else {
                throw new Error('Failed to capture screenshot');
            }
            
        } catch (error) {
            console.error('Error taking screenshot:', error);
            this.showNotification('Screenshot failed: ' + error.message);
        }
    }

    async captureVideoFrame(videoElement) {
        try {
            // Create canvas to capture video frame
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas dimensions to match video
            canvas.width = videoElement.videoWidth || videoElement.clientWidth;
            canvas.height = videoElement.videoHeight || videoElement.clientHeight;
            
            // Draw current video frame to canvas
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            
            // Convert to blob
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve({
                            blob: blob,
                            method: 'video_frame',
                            width: canvas.width,
                            height: canvas.height
                        });
                    } else {
                        resolve(null);
                    }
                }, 'image/png', 1.0);
            });
            
        } catch (error) {
            console.error('Error capturing video frame:', error);
            return null;
        }
    }

    async captureCameraSection() {
        try {
            // Check if html2canvas is available (would need to be loaded)
            if (typeof html2canvas !== 'undefined') {
                const cameraSection = document.querySelector('.camera-section');
                const canvas = await html2canvas(cameraSection, {
                    backgroundColor: null,
                    scale: 2, // Higher quality
                    logging: false
                });
                
                return new Promise((resolve) => {
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve({
                                blob: blob,
                                method: 'html2canvas',
                                width: canvas.width,
                                height: canvas.height
                            });
                        } else {
                            resolve(null);
                        }
                    }, 'image/png', 1.0);
                });
            }
            
            // Fallback: Manual canvas capture of visible elements
            return await this.manualCanvasCapture();
            
        } catch (error) {
            console.error('Error capturing camera section:', error);
            return null;
        }
    }

    async manualCanvasCapture() {
        try {
            const cameraFeed = document.querySelector('.camera-feed');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size
            const rect = cameraFeed.getBoundingClientRect();
            canvas.width = rect.width * 2; // Higher resolution
            canvas.height = rect.height * 2;
            
            // Scale context for higher resolution
            ctx.scale(2, 2);
            
            // Fill background
            ctx.fillStyle = '#1e3a5f';
            ctx.fillRect(0, 0, rect.width, rect.height);
            
            // Try to capture video element if visible
            const videoElement = document.getElementById('babyVideo');
            if (videoElement && videoElement.style.display === 'block') {
                ctx.drawImage(videoElement, 0, 0, rect.width, rect.height);
            } else {
                // Draw fallback content
                ctx.fillStyle = '#ffffff';
                ctx.font = '16px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Baby Monitor Screenshot', rect.width / 2, rect.height / 2);
                ctx.fillText(new Date().toLocaleString(), rect.width / 2, rect.height / 2 + 30);
            }
            
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve({
                            blob: blob,
                            method: 'manual_canvas',
                            width: canvas.width,
                            height: canvas.height
                        });
                    } else {
                        resolve(null);
                    }
                }, 'image/png', 1.0);
            });
            
        } catch (error) {
            console.error('Error with manual canvas capture:', error);
            return null;
        }
    }

    async captureScreenshot() {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                // Request screen capture
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        mediaSource: 'screen',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                });
                
                // Create video element to capture frame
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                
                return new Promise((resolve) => {
                    video.addEventListener('loadedmetadata', () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        
                        ctx.drawImage(video, 0, 0);
                        
                        // Stop stream
                        stream.getTracks().forEach(track => track.stop());
                        
                        canvas.toBlob((blob) => {
                            if (blob) {
                                resolve({
                                    blob: blob,
                                    method: 'screen_capture',
                                    width: canvas.width,
                                    height: canvas.height
                                });
                            } else {
                                resolve(null);
                            }
                        }, 'image/png', 1.0);
                    });
                });
                
            } else {
                throw new Error('Screen capture not supported');
            }
            
        } catch (error) {
            console.error('Error with screen capture:', error);
            return null;
        }
    }

    saveScreenshot(imageData) {
        try {
            // Create download link
            const url = URL.createObjectURL(imageData.blob);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `baby-monitor-screenshot-${timestamp}.png`;
            
            // Auto-download the screenshot
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            console.log(`Screenshot saved: ${filename} (${imageData.width}x${imageData.height}, ${Math.round(imageData.blob.size / 1024)}KB)`);
            
        } catch (error) {
            console.error('Error saving screenshot:', error);
            throw error;
        }
    }

    async toggleRecording(button) {
        if (!this.isRecording) {
            // Start recording
            try {
                await this.startRecording(button);
            } catch (error) {
                console.error('Failed to start recording:', error);
                this.showNotification('Recording failed: ' + error.message);
            }
        } else {
            // Stop recording
            this.stopRecording(button);
        }
    }

    async startRecording(button) {
        console.log('Starting recording...');
        
        // Reset recorded chunks
        this.recordedChunks = [];
        
        try {
            let stream = null;
            
            // Try to record the video element directly if it's playing
            const videoElement = document.getElementById('babyVideo');
            if (videoElement && videoElement.style.display === 'block' && !videoElement.paused) {
                // Capture video element stream
                if (videoElement.captureStream) {
                    stream = videoElement.captureStream();
                    console.log('Recording video element stream');
                } else if (videoElement.mozCaptureStream) {
                    stream = videoElement.mozCaptureStream();
                    console.log('Recording video element stream (Firefox)');
                }
            }
            
            // Fallback to screen capture of camera section
            if (!stream) {
                const cameraSection = document.querySelector('.camera-section');
                if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                    // Use screen capture API
                    stream = await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            mediaSource: 'screen',
                            width: { ideal: 1920 },
                            height: { ideal: 1080 }
                        },
                        audio: false
                    });
                    console.log('Recording screen capture');
                } else {
                    throw new Error('Screen recording not supported');
                }
            }
            
            // Create MediaRecorder
            const options = {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 2500000 // 2.5 Mbps
            };
            
            // Fallback mime types if vp9 not supported
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm;codecs=vp8';
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options.mimeType = 'video/webm';
                    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                        options.mimeType = 'video/mp4';
                    }
                }
            }
            
            this.mediaRecorder = new MediaRecorder(stream, options);
            
            // Set up event listeners
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                    console.log('Recording chunk received:', event.data.size, 'bytes');
                }
            };
            
            this.mediaRecorder.onstop = () => {
                console.log('Recording stopped, processing...');
                this.processRecording();
                
                // Stop all tracks to release resources
                stream.getTracks().forEach(track => track.stop());
            };
            
            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                this.showNotification('Recording error: ' + event.error.message);
                this.resetRecordingState(button);
            };
            
            // Start recording
            this.mediaRecorder.start(1000); // Collect data every second
            this.isRecording = true;
            this.recordingStartTime = new Date();
            
            // Update UI
            button.style.background = 'rgba(239, 68, 68, 0.3)';
            button.style.color = '#ef4444';
            button.style.animation = 'pulse 1s infinite';
            
            // Start recording timer
            this.startRecordingTimer();
            
            this.showNotification('Recording started');
            console.log('Recording started successfully');
            
            // Log analytics
            if (window.firebaseAnalytics && window.firebaseLogEvent) {
                try {
                    window.firebaseLogEvent(window.firebaseAnalytics, 'recording_started', {
                        timestamp: new Date().toISOString(),
                        mime_type: options.mimeType
                    });
                } catch (error) {
                    console.warn('Failed to log recording analytics:', error);
                }
            }
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.resetRecordingState(button);
            throw error;
        }
    }

    stopRecording(button) {
        console.log('Stopping recording...');
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        this.isRecording = false;
        this.resetRecordingState(button);
        this.stopRecordingTimer();
        
        this.showNotification('Recording stopped');
        console.log('Recording stopped');
    }

    resetRecordingState(button) {
        // Reset button appearance
        button.style.background = 'rgba(255, 255, 255, 0.2)';
        button.style.color = 'rgba(255, 255, 255, 0.8)';
        button.style.animation = '';
        
        this.isRecording = false;
    }

    startRecordingTimer() {
        // Update recording duration every second
        this.recordingTimer = setInterval(() => {
            if (this.recordingStartTime) {
                const duration = Math.floor((new Date() - this.recordingStartTime) / 1000);
                const minutes = Math.floor(duration / 60);
                const seconds = duration % 60;
                const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                // You could display this timer somewhere in the UI
                console.log('Recording duration:', timeString);
            }
        }, 1000);
    }

    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    processRecording() {
        if (this.recordedChunks.length === 0) {
            console.warn('No recorded data available');
            this.showNotification('No recording data available');
            return;
        }
        
        console.log('Processing recording with', this.recordedChunks.length, 'chunks');
        
        // Create blob from recorded chunks
        const blob = new Blob(this.recordedChunks, {
            type: this.mediaRecorder.mimeType || 'video/webm'
        });
        
        console.log('Recording blob created:', blob.size, 'bytes');
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `baby-monitor-recording-${timestamp}.webm`;
        
        // Auto-download the recording
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        // Calculate recording duration
        const duration = this.recordingStartTime ? 
            Math.floor((new Date() - this.recordingStartTime) / 1000) : 0;
        
        this.showNotification(`Recording saved: ${filename} (${duration}s)`);
        
        // Log analytics
        if (window.firebaseAnalytics && window.firebaseLogEvent) {
            try {
                window.firebaseLogEvent(window.firebaseAnalytics, 'recording_completed', {
                    duration_seconds: duration,
                    file_size_bytes: blob.size,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.warn('Failed to log recording completion analytics:', error);
            }
        }
        
        // Reset
        this.recordedChunks = [];
        this.recordingStartTime = null;
        
        console.log('Recording processed and saved successfully');
    }

    toggleFullscreen() {
        const cameraSection = document.querySelector('.camera-section');
        const isFullscreen = cameraSection.classList.contains('fullscreen');
        
        if (!isFullscreen) {
            // Always use custom fullscreen for better control
            this.fallbackFullscreen(cameraSection);
        } else {
            // Exit custom fullscreen
            cameraSection.classList.remove('fullscreen');
            document.body.style.overflow = '';
            this.showNotification('Exited fullscreen');
            console.log('Exited fullscreen mode');
        }
    }
    
    fallbackFullscreen(cameraSection) {
        console.log('Using fallback fullscreen');
        const videoElement = document.getElementById('babyVideo');
        const loadingEl = document.getElementById('videoLoading');
        const fallbackEl = document.getElementById('fallbackCrib');
        const errorEl = document.getElementById('videoError');
        
        // Use custom CSS fullscreen
        cameraSection.classList.add('fullscreen');
        
        // Determine what content to show in fullscreen
        let hasVisibleContent = false;
        
        // Check if video is available and visible
        if (videoElement && videoElement.style.display === 'block') {
            console.log('Showing video in custom fullscreen');
            hasVisibleContent = true;
            
            // Try to play video if it's paused
            if (videoElement.paused) {
                videoElement.play().catch(e => {
                    console.warn('Could not autoplay video in fullscreen:', e);
                });
            }
        }
        // Check other states
        else if (loadingEl && loadingEl.style.display === 'flex') {
            console.log('Showing loading state in fullscreen');
            hasVisibleContent = true;
        }
        else if (fallbackEl && fallbackEl.style.display === 'block') {
            console.log('Showing fallback content in fullscreen');
            hasVisibleContent = true;
        }
        else if (errorEl && errorEl.style.display === 'flex') {
            console.log('Showing error state in fullscreen');
            hasVisibleContent = true;
        }
        
        // If no content is visible, show fallback
        if (!hasVisibleContent) {
            console.log('No visible content found, showing fallback in fullscreen');
            this.showVideoState('fallback');
        }
        
        // Hide other UI elements that might interfere
        document.body.style.overflow = 'hidden';
        
        this.showNotification('Fullscreen mode');
        console.log('Entered custom fullscreen mode');
    }

    handleNavigation(clickedItem) {
        // Remove active class from all nav items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        
        // Add active class to clicked item
        clickedItem.classList.add('active');
        
        const tab = clickedItem.dataset.tab;
        console.log(`Navigated to ${tab}`);
        this.showNotification(`Switched to ${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    }

    toggleLive() {
        this.isLive = !this.isLive;
        const liveBadge = document.querySelector('.live-badge');
        const liveDot = document.querySelector('.live-dot');
        
        if (liveBadge && liveDot) {
            if (this.isLive) {
                liveBadge.innerHTML = '<span class="live-dot"></span>LIVE';
                liveBadge.style.background = 'rgba(76, 175, 80, 0.9)';
            } else {
                liveBadge.innerHTML = '<span class="live-dot"></span>OFFLINE';
                liveBadge.style.background = 'rgba(239, 68, 68, 0.9)';
            }
        }
        
        this.showNotification(this.isLive ? 'Camera is live' : 'Camera offline');
    }

    startLiveUpdates() {
        // Update time every minute
        setInterval(() => {
            this.updateTime();
        }, 60000);

        // Simulate movement changes every 5 seconds
        setInterval(() => {
            this.updateMovement();
        }, 5000);

        // Simulate environmental changes every 30 seconds
        setInterval(() => {
            this.updateEnvironment();
        }, 30000);

        // Update sleep duration every minute
        setInterval(() => {
            this.updateSleepDuration();
        }, 60000);
    }

    updateMovement() {
        // Simulate realistic movement variations (20-50 mpm)
        const variation = (Math.random() - 0.5) * 6; // -3 to +3
        this.movement = Math.max(20, Math.min(50, this.movement + variation));
        
        const movementValue = document.querySelector('.movement-value');
        if (movementValue) {
            movementValue.textContent = `${Math.round(this.movement)} mpm`;
        }
    }

    updateEnvironment() {
        // Simulate temperature variations (18-26°C)
        const tempVariation = (Math.random() - 0.5) * 2; // -1 to +1
        this.temperature = Math.max(18, Math.min(26, this.temperature + tempVariation));
        
        const tempValue = document.querySelector('.temp-value');
        if (tempValue) {
            tempValue.textContent = `${Math.round(this.temperature)}°C`;
        }

        // Simulate humidity variations (30-70%)
        const humidityVariation = (Math.random() - 0.5) * 10; // -5 to +5
        this.humidity = Math.max(30, Math.min(70, this.humidity + humidityVariation));
        
        const humidityElement = document.querySelector('.env-metrics .env-metric:last-child .env-value');
        if (humidityElement) {
            humidityElement.textContent = Math.round(this.humidity);
        }

        // Occasionally change air quality
        if (Math.random() < 0.1) { // 10% chance
            const qualities = ['Good', 'Fair', 'Poor'];
            this.airQuality = qualities[Math.floor(Math.random() * qualities.length)];
            
            const airQualityElement = document.querySelector('.env-metrics .env-metric:first-child .env-value');
            if (airQualityElement) {
                airQualityElement.textContent = this.airQuality;
            }
        }
    }

    updateSleepDuration() {
        const now = new Date();
        const diffMs = now - this.sleepStartTime;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        const durationElement = document.querySelector('.sleep-stats .stat-item:first-child .stat-value');
        if (durationElement) {
            durationElement.textContent = `${hours}h ${minutes}m`;
        }
    }

    initializeAnimations() {
        // Initialize heartbeat animation
        this.animateHeartbeat();
        
        // Initialize live dot pulse
        this.animateLiveDot();
    }

    animateHeartbeat() {
        const heartbeatLine = document.querySelector('.heartbeat-line');
        if (heartbeatLine) {
            // The animation is handled by CSS, but we can add dynamic behavior here
            setInterval(() => {
                // Vary the animation speed based on movement
                const speed = Math.max(2, 4 - (this.movement / 25));
                heartbeatLine.style.animationDuration = `${speed}s`;
            }, 5000);
        }
    }

    animateLiveDot() {
        const liveDot = document.querySelector('.live-dot');
        if (liveDot && this.isLive) {
            // CSS handles the animation, but we can control it based on live status
            setInterval(() => {
                if (!this.isLive) {
                    liveDot.style.animation = 'none';
                } else {
                    liveDot.style.animation = 'pulse 2s infinite';
                }
            }, 1000);
        }
    }

    flashEffect() {
        const cameraFeed = document.querySelector('.camera-feed');
        if (cameraFeed) {
            cameraFeed.style.background = 'rgba(255, 255, 255, 0.8)';
            cameraFeed.style.transition = 'background 0.1s ease';
            
            setTimeout(() => {
                cameraFeed.style.background = '';
                setTimeout(() => {
                    cameraFeed.style.transition = '';
                }, 300);
            }, 150);
        }
    }

    showNotification(message) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());

        // Create new notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '24px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '1000',
            animation: 'slideDown 0.3s ease',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        });

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    setupTouchGestures() {
        let touchStartY = 0;
        let touchEndY = 0;
        let touchStartX = 0;
        let touchEndX = 0;

        const phoneFrame = document.querySelector('.phone-frame');
        
        phoneFrame.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        phoneFrame.addEventListener('touchend', (e) => {
            touchEndY = e.changedTouches[0].screenY;
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });

        const handleSwipe = () => {
            const swipeThreshold = 50;
            const verticalDiff = touchStartY - touchEndY;
            const horizontalDiff = touchStartX - touchEndX;
            
            if (Math.abs(verticalDiff) > Math.abs(horizontalDiff)) {
                // Vertical swipe
                if (Math.abs(verticalDiff) > swipeThreshold) {
                    if (verticalDiff > 0) {
                        // Swipe up - refresh data
                        this.refreshData();
                    } else {
                        // Swipe down - show more options
                        this.showNotification('Pull to refresh');
                    }
                }
            } else {
                // Horizontal swipe
                if (Math.abs(horizontalDiff) > swipeThreshold) {
                    if (horizontalDiff > 0) {
                        // Swipe left - next tab
                        this.switchTab('next');
                    } else {
                        // Swipe right - previous tab
                        this.switchTab('prev');
                    }
                }
            }
        };

        this.handleSwipe = handleSwipe;
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.switchTab('prev');
                    break;
                case 'ArrowRight':
                    this.switchTab('next');
                    break;
                case ' ':
                case 'Enter':
                    if (e.target.classList.contains('control-btn')) {
                        e.target.click();
                    }
                    break;
                case 'Escape':
                    const fullscreenElement = document.querySelector('.camera-section.fullscreen');
                    if (fullscreenElement) {
                        this.toggleFullscreen();
                    }
                    break;
            }
        });
    }

    switchTab(direction) {
        const navItems = Array.from(document.querySelectorAll('.nav-item'));
        const activeIndex = navItems.findIndex(item => item.classList.contains('active'));
        
        let newIndex;
        if (direction === 'next') {
            newIndex = (activeIndex + 1) % navItems.length;
        } else {
            newIndex = (activeIndex - 1 + navItems.length) % navItems.length;
        }
        
        this.handleNavigation(navItems[newIndex]);
    }

    refreshData() {
        this.showNotification('Refreshing data...');
        
        // Simulate data refresh
        setTimeout(() => {
            this.updateMovement();
            this.updateEnvironment();
            this.showNotification('Data refreshed');
        }, 1000);
    }

    // Firebase Firestore Video Feed Methods
    initializeVideoFeed() {
        this.videoElement = document.getElementById('babyVideo');
        
        // Wait for Firebase to be available
        if (window.firebaseDb) {
            this.loadVideoFeed();
        } else {
            // Retry after a short delay if Firebase isn't ready
            setTimeout(() => {
                this.initializeVideoFeed();
            }, 1000);
        }
    }

    async loadVideoFeed() {
        try {
            this.showVideoState('loading');
            console.log('Loading video feed from Firestore...');

            // Get reference to the Firestore document
            const docRef = window.firestoreDoc(window.firebaseDb, 'app-data', 'HtWNpeUV3eKivGBEZpLi');
            
            // Set up real-time listener for video URL changes
            this.firestoreUnsubscribe = window.firestoreOnSnapshot(docRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    const videoUrl = data['video-url'];
                    
                    if (videoUrl && videoUrl !== this.videoUrl) {
                        console.log('Video URL found:', videoUrl);
                        this.videoUrl = videoUrl;
                        this.setupVideo(videoUrl);
                    } else if (!videoUrl) {
                        console.warn('No video-url field found in document');
                        this.showVideoState('fallback');
                    }
                } else {
                    console.warn('Document does not exist');
                    this.showVideoState('error');
                }
            }, (error) => {
                console.error('Error listening to document:', error);
                this.showVideoState('error');
            });

        } catch (error) {
            console.error('Error loading video feed:', error);
            this.showVideoState('error');
        }
    }

    setupVideo(videoUrl) {
        if (!this.videoElement) {
            console.error('Video element not found');
            this.showVideoState('error');
            return;
        }

        // Validate video URL
        if (!videoUrl || typeof videoUrl !== 'string') {
            console.error('Invalid video URL:', videoUrl);
            this.showVideoState('error');
            return;
        }

        // Clean up previous video
        this.videoElement.pause();
        this.videoElement.removeAttribute('src');
        this.videoElement.load();

        console.log('Setting up video with URL:', videoUrl);

        // Set up video event listeners
        this.videoElement.addEventListener('loadstart', () => {
            console.log('Video loading started');
            this.showVideoState('loading');
        });

        this.videoElement.addEventListener('canplay', () => {
            console.log('Video can start playing');
            this.showVideoState('video');
            
            // Log analytics event
            if (window.firebaseAnalytics && window.firebaseLogEvent) {
                try {
                    window.firebaseLogEvent(window.firebaseAnalytics, 'video_feed_loaded', {
                        video_url: videoUrl,
                        timestamp: new Date().toISOString()
                    });
                    console.log('Analytics event logged: video_feed_loaded');
                } catch (error) {
                    console.warn('Failed to log analytics event:', error);
                }
            }
        });

        this.videoElement.addEventListener('error', (e) => {
            console.error('Video error:', e);
            
            // Get detailed error information
            const video = e.target;
            let errorMessage = 'Video feed unavailable';
            let errorCode = 'UNKNOWN';
            
            if (video.error) {
                switch (video.error.code) {
                    case video.error.MEDIA_ERR_ABORTED:
                        errorMessage = 'Video loading aborted';
                        errorCode = 'ABORTED';
                        break;
                    case video.error.MEDIA_ERR_NETWORK:
                        errorMessage = 'Network error loading video';
                        errorCode = 'NETWORK';
                        break;
                    case video.error.MEDIA_ERR_DECODE:
                        errorMessage = 'Video format not supported';
                        errorCode = 'DECODE';
                        break;
                    case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorMessage = 'Video source not supported';
                        errorCode = 'SRC_NOT_SUPPORTED';
                        break;
                    default:
                        errorMessage = 'Unknown video error';
                        errorCode = 'UNKNOWN';
                }
                console.error(`Video Error Details: ${errorCode} - ${errorMessage}`);
                console.error('Video error object:', video.error);
            }
            
            // Log analytics event for error tracking
            if (window.firebaseAnalytics && window.firebaseLogEvent) {
                try {
                    window.firebaseLogEvent(window.firebaseAnalytics, 'video_error', {
                        error_code: errorCode,
                        error_message: errorMessage,
                        video_url: this.videoUrl || 'unknown',
                        timestamp: new Date().toISOString()
                    });
                } catch (analyticsError) {
                    console.warn('Failed to log video error analytics:', analyticsError);
                }
            }
            
            this.showVideoState('fallback');
            this.showNotification(errorMessage + ', showing placeholder');
        });

        this.videoElement.addEventListener('loadeddata', () => {
            console.log('Video data loaded');
        });

        // Add additional video event listeners for debugging
        this.videoElement.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded');
        });

        this.videoElement.addEventListener('progress', () => {
            console.log('Video loading progress');
        });

        this.videoElement.addEventListener('stalled', () => {
            console.warn('Video loading stalled');
        });

        this.videoElement.addEventListener('suspend', () => {
            console.warn('Video loading suspended');
        });

        this.videoElement.addEventListener('waiting', () => {
            console.log('Video waiting for data');
        });

        // Set video attributes for better compatibility
        this.videoElement.setAttribute('crossorigin', 'anonymous');
        this.videoElement.setAttribute('preload', 'metadata');
        
        // Set video source and load
        this.videoElement.src = videoUrl;
        this.videoElement.load();

        // Set a timeout to fallback if video doesn't load within 10 seconds
        setTimeout(() => {
            if (this.videoElement.readyState === 0) {
                console.warn('Video failed to load within timeout, showing fallback');
                this.showVideoState('fallback');
                this.showNotification('Video loading timeout, showing placeholder');
            }
        }, 10000);
    }

    showVideoState(state) {
        const loadingEl = document.getElementById('videoLoading');
        const videoEl = document.getElementById('babyVideo');
        const fallbackEl = document.getElementById('fallbackCrib');
        const errorEl = document.getElementById('videoError');

        // Hide all states first
        [loadingEl, videoEl, fallbackEl, errorEl].forEach(el => {
            if (el) el.style.display = 'none';
        });

        // Show the appropriate state
        switch (state) {
            case 'loading':
                if (loadingEl) loadingEl.style.display = 'flex';
                break;
            case 'video':
                if (videoEl) videoEl.style.display = 'block';
                break;
            case 'fallback':
                if (fallbackEl) fallbackEl.style.display = 'block';
                break;
            case 'error':
                if (errorEl) errorEl.style.display = 'flex';
                break;
        }
    }

    // Method to manually retry video loading
    retryVideoLoad() {
        console.log('Retrying video load...');
        this.loadVideoFeed();
    }

    // Cleanup method
    cleanup() {
        if (this.firestoreUnsubscribe) {
            this.firestoreUnsubscribe();
            this.firestoreUnsubscribe = null;
        }
        
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.src = '';
        }
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { 
            transform: translateX(-50%) translateY(-100%); 
            opacity: 0; 
        }
        to { 
            transform: translateX(-50%) translateY(0); 
            opacity: 1; 
        }
    }
    
    @keyframes slideUp {
        from { 
            transform: translateX(-50%) translateY(0); 
            opacity: 1; 
        }
        to { 
            transform: translateX(-50%) translateY(-100%); 
            opacity: 0; 
        }
    }
    
    .camera-section.fullscreen {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 1000 !important;
        margin: 0 !important;
        border-radius: 0 !important;
        background: black !important;
    }
    
    .camera-section.fullscreen .camera-feed {
        height: 100vh !important;
        width: 100vw !important;
    }
    
    .camera-section.fullscreen .baby-video {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        object-fit: contain !important;
        object-position: center !important;
        background: black !important;
        z-index: 1 !important;
        max-width: none !important;
        max-height: none !important;
    }
    
    .camera-section.fullscreen .baby-crib {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background-size: contain !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
    }
    
    .camera-section.fullscreen .video-loading,
    .camera-section.fullscreen .video-error {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }
    
    .camera-section.fullscreen .camera-controls {
        position: absolute !important;
        bottom: 20px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        background: rgba(0, 0, 0, 0.5) !important;
        border-radius: 25px !important;
        padding: 10px 20px !important;
    }
    
    .camera-section.fullscreen .live-badge {
        top: 20px !important;
        left: 20px !important;
        z-index: 1001 !important;
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.babyMonitorApp = new BabyMonitorApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('App went to background');
    } else {
        console.log('App came to foreground');
        // Refresh data when app becomes visible again
        if (window.babyMonitorApp) {
            window.babyMonitorApp.refreshData();
        }
    }
});

// Export for global access
window.BabyMonitorApp = BabyMonitorApp;