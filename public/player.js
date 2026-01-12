/**
 * FlexStream — Universal Video Player
 * Advanced video streaming with enhanced features and security
 * Built by Niranjannn
 */

class FlexStreamPlayer {
    constructor() {
        // State Management
        this.state = {
            isPlaying: false,
            isMuted: false,
            isFullscreen: false,
            isLooping: false,
            isFavorite: false,
            currentSpeed: 1.0,
            currentVolume: 1.0,
            lastVolume: 1.0,
            currentUrl: '',
            originalUrl: '',
            currentTime: 0,
            duration: 0,
            bufferedAhead: 0,
            networkSpeed: 0,
            videoFormat: 'unknown',
            videoSize: 0,
            qualityLevel: 'auto'
        };

        // DOM Elements - Organized by sections
        this.elements = {
            // Layout
            urlSection: document.getElementById('urlSection'),
            playerSection: document.getElementById('playerSection'),
            playerContainer: document.getElementById('playerContainer'),
            
            // Video
            video: document.getElementById('videoPlayer'),
            
            // Input Section
            urlInput: document.getElementById('videoUrl'),
            loadBtn: document.getElementById('loadBtn'),
            sampleVideoBtn: document.getElementById('sampleVideoBtn'),
            uploadBtn: document.getElementById('uploadBtn'),
            fileInput: document.getElementById('fileInput'),
            useProxyCheckbox: document.getElementById('useProxy'),
            autoPlayNextCheckbox: document.getElementById('autoPlayNext'),
            
            // Overlays
            loadingOverlay: document.getElementById('loadingOverlay'),
            loadingText: document.getElementById('loadingText'),
            loadingProgress: document.getElementById('loadingProgress'),
            playOverlay: document.getElementById('playOverlay'),
            errorOverlay: document.getElementById('errorOverlay'),
            errorText: document.getElementById('errorText'),
            bufferIndicator: document.getElementById('bufferIndicator'),
            
            // Controls
            controls: document.getElementById('controls'),
            playPauseBtn: document.getElementById('playPauseBtn'),
            bigPlayBtn: document.getElementById('bigPlayBtn'),
            skipBackBtn: document.getElementById('skipBackBtn'),
            skipForwardBtn: document.getElementById('skipForwardBtn'),
            muteBtn: document.getElementById('muteBtn'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeFill: document.getElementById('volumeFill'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            pipBtn: document.getElementById('pipBtn'),
            speedBtn: document.getElementById('speedBtn'),
            speedMenu: document.getElementById('speedMenu'),
            speedValue: document.getElementById('speedValue'),
            qualityBtn: document.getElementById('qualityBtn'),
            qualityValue: document.getElementById('qualityValue'),
            subtitleBtn: document.getElementById('subtitleBtn'),
            screenshotBtn: document.getElementById('screenshotBtn'),
            favoriteBtn: document.getElementById('favoriteBtn'),
            loopBtn: document.getElementById('loopBtn'),
            shareBtn: document.getElementById('shareBtn'),
            
            // Progress
            progressContainer: document.getElementById('progressContainer'),
            progressBuffer: document.getElementById('progressBuffer'),
            progressPlayed: document.getElementById('progressPlayed'),
            progressThumb: document.getElementById('progressThumb'),
            progressTooltip: document.getElementById('progressTooltip'),
            progressChapters: document.getElementById('progressChapters'),
            
            // Time
            currentTimeEl: document.getElementById('currentTime'),
            durationEl: document.getElementById('duration'),
            timeDisplay: document.getElementById('timeDisplay'),
            timeInputWrapper: document.getElementById('timeInputWrapper'),
            timeInput: document.getElementById('timeInput'),
            timeGoBtn: document.getElementById('timeGoBtn'),
            
            // Stats
            bufferPercent: document.getElementById('bufferPercent'),
            networkSpeedEl: document.getElementById('networkSpeed'),
            
            // Sidebar
            playerSidebar: document.getElementById('playerSidebar'),
            sidebarToggle: document.getElementById('sidebarToggle'),
            infoUrl: document.getElementById('infoUrl'),
            infoDuration: document.getElementById('infoDuration'),
            infoFormat: document.getElementById('infoFormat'),
            infoSize: document.getElementById('infoSize'),
            playlistItems: document.getElementById('playlistItems'),
            addToPlaylistBtn: document.getElementById('addToPlaylistBtn'),
            clearPlaylistBtn: document.getElementById('clearPlaylistBtn'),
            totalPlayTime: document.getElementById('totalPlayTime'),
            videosPlayed: document.getElementById('videosPlayed'),
            dataUsed: document.getElementById('dataUsed'),
            
            // History
            historyBtn: document.getElementById('historyBtn'),
            historyModal: document.getElementById('historyModal'),
            historyList: document.getElementById('historyList'),
            closeHistoryModal: document.getElementById('closeHistoryModal'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            
            // Screenshots
            screenshotModal: document.getElementById('screenshotModal'),
            screenshotGrid: document.getElementById('screenshotGrid'),
            closeScreenshotModal: document.getElementById('closeScreenshotModal'),
            
            // Theme
            themeToggle: document.getElementById('themeToggle'),
            
            // Shortcuts
            helpBtn: document.getElementById('helpBtn'),
            shortcutsModal: document.getElementById('shortcutsModal'),
            closeShortcuts: document.getElementById('closeShortcuts'),
            
            // Modals
            retryBtn: document.getElementById('retryBtn'),
            reportBtn: document.getElementById('reportBtn'),
            backBtn: document.getElementById('backBtn'),
            
            // Toast
            toastContainer: document.getElementById('toastContainer'),
            
            // Recent URLs
            recentList: document.getElementById('recentList')
        };

        // Data Management
        this.storage = {
            history: this.loadFromStorage('flexstream_history') || [],
            favorites: this.loadFromStorage('flexstream_favorites') || [],
            playlists: this.loadFromStorage('flexstream_playlists') || [],
            settings: this.loadFromStorage('flexstream_settings') || {
                theme: 'dark',
                volume: 1.0,
                speed: 1.0,
                autoplay: true,
                loop: false,
                proxyEnabled: false
            },
            statistics: this.loadFromStorage('flexstream_statistics') || {
                totalPlayTime: 0,
                videosPlayed: 0,
                dataUsed: 0,
                lastPlayed: null
            }
        };

        // Buffer Management
        this.bufferManager = {
            checkInterval: null,
            targetBufferAhead: 30, // seconds
            maxBufferAhead: 120, // seconds
            bufferRanges: [],
            maxWatchedPosition: 0,
            historyBufferRatio: 0.1,
            
            // Network monitoring
            networkSamples: [],
            maxSamples: 10,
            lastBufferTime: 0,
            lastBufferedAmount: 0,
            estimatedBitrate: 2000000, // 2 Mbps default
            bytesDownloaded: 0
        };

        // Security & Validation
        this.security = {
            allowedDomains: [], // Empty = allow all (configurable)
            blockedDomains: [], // Add domains to block
            maxUrlLength: 2048,
            maxFileSize: 1073741824, // 1GB
            rateLimiter: {
                requests: [],
                maxRequests: 10,
                timeWindow: 60000 // 1 minute
            }
        };

        // Timeouts
        this.timeouts = {
            controls: null,
            cursor: null,
            loading: null,
            toast: null
        };

        // HLS/DASH instances
        this.streaming = {
            hls: null,
            dash: null,
            supportsHLS: null,
            supportsDASH: null
        };

        // Initialize
        this.init();
    }

    /* ============================
       INITIALIZATION
    ============================ */

    init() {
        this.setupEventListeners();
        this.setupVideoEvents();
        this.applySettings();
        this.loadRecentUrls();
        this.updateStatistics();
        
        // Check URL parameters
        this.checkUrlParams();
        
        // Focus on URL input
        this.elements.urlInput.focus();
        
        // Show welcome message
        this.showToast('Welcome to FlexStream!', 'Paste any video URL to start streaming.', 'info');
        
        console.log('🚀 FlexStream Player initialized');
    }

    setupEventListeners() {
        // URL Input Events
        this.elements.loadBtn.addEventListener('click', () => this.loadVideo());
        this.elements.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadVideo();
        });
        
        // Quick Actions
        this.elements.sampleVideoBtn.addEventListener('click', () => this.loadSampleVideo());
        this.elements.uploadBtn.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Playback Controls
        this.elements.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.elements.bigPlayBtn.addEventListener('click', () => this.togglePlay());
        this.elements.skipBackBtn.addEventListener('click', () => this.skip(-10));
        this.elements.skipForwardBtn.addEventListener('click', () => this.skip(10));
        this.elements.muteBtn.addEventListener('click', () => this.toggleMute());
        this.elements.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.elements.pipBtn.addEventListener('click', () => this.togglePiP());
        this.elements.screenshotBtn.addEventListener('click', () => this.takeScreenshot());
        this.elements.favoriteBtn.addEventListener('click', () => this.toggleFavorite());
        this.elements.loopBtn.addEventListener('click', () => this.toggleLoop());
        this.elements.shareBtn.addEventListener('click', () => this.shareVideo());
        
        // Progress Bar
        this.elements.progressContainer.addEventListener('click', (e) => this.seek(e));
        this.elements.progressContainer.addEventListener('mousemove', (e) => this.updateTooltip(e));
        
        // Add drag support for progress bar
        let isDragging = false;
        this.elements.progressContainer.addEventListener('mousedown', (e) => {
            isDragging = true;
            this.seek(e);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) this.seek(e);
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Time Input
        this.elements.timeDisplay.addEventListener('click', () => this.showTimeInput());
        this.elements.timeGoBtn.addEventListener('click', () => this.jumpToInputTime());
        this.elements.timeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.jumpToInputTime();
        });
        this.elements.timeInput.addEventListener('blur', () => {
            setTimeout(() => this.hideTimeInput(), 200);
        });
        
        // Speed Menu
        this.elements.speedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.elements.speedMenu.classList.toggle('active');
        });
        
        document.querySelectorAll('.speed-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const speed = parseFloat(e.target.dataset.speed);
                this.setPlaybackSpeed(speed);
            });
        });
        
        // Custom speed input
        const customSpeedInput = document.getElementById('customSpeedInput');
        const customSpeedBtn = document.getElementById('customSpeedBtn');
        
        if (customSpeedBtn && customSpeedInput) {
            customSpeedBtn.addEventListener('click', () => {
                const speed = parseFloat(customSpeedInput.value);
                if (speed >= 0.1 && speed <= 16) {
                    this.setPlaybackSpeed(speed);
                    customSpeedInput.value = '';
                }
            });
            
            customSpeedInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const speed = parseFloat(customSpeedInput.value);
                    if (speed >= 0.1 && speed <= 16) {
                        this.setPlaybackSpeed(speed);
                        customSpeedInput.value = '';
                    }
                }
            });
        }
        
        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.speed-container')) {
                this.elements.speedMenu.classList.remove('active');
            }
        });
        
        // Sidebar
        this.elements.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        this.elements.addToPlaylistBtn.addEventListener('click', () => this.addToPlaylist());
        this.elements.clearPlaylistBtn.addEventListener('click', () => this.clearPlaylist());
        
        // History
        this.elements.historyBtn.addEventListener('click', () => this.showHistoryModal());
        this.elements.closeHistoryModal.addEventListener('click', () => this.hideHistoryModal());
        this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        // Theme Toggle
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Shortcuts Help
        this.elements.helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.elements.shortcutsModal.classList.toggle('active');
        });
        
        this.elements.closeShortcuts.addEventListener('click', () => {
            this.elements.shortcutsModal.classList.remove('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.shortcuts-help')) {
                this.elements.shortcutsModal.classList.remove('active');
            }
        });
        
        // Error Handling
        this.elements.retryBtn.addEventListener('click', () => this.loadVideo());
        this.elements.reportBtn.addEventListener('click', () => this.reportIssue());
        this.elements.backBtn.addEventListener('click', () => this.showUrlSection());
        
        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Controls Visibility
        this.elements.playerContainer.addEventListener('mousemove', () => this.showControls());
        this.elements.playerContainer.addEventListener('mouseleave', () => this.hideControls());
        
        // Click to play/pause
        this.elements.video.addEventListener('click', () => this.togglePlay());
        
        // Double-click to fullscreen
        this.elements.video.addEventListener('dblclick', () => this.toggleFullscreen());
        
        // Fullscreen change
        document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());
    }

    setupVideoEvents() {
        const video = this.elements.video;
        
        // Loading states
        video.addEventListener('loadstart', () => {
            this.bufferManager.lastBufferTime = Date.now();
            this.bufferManager.lastBufferedAmount = 0;
            this.bufferManager.bytesDownloaded = 0;
            this.bufferManager.maxWatchedPosition = 0;
            this.bufferManager.bufferRanges = [];
            
            this.showLoading('Loading video...');
            this.elements.loadingProgress.querySelector('.progress-bar').style.width = '0%';
        });
        
        video.addEventListener('loadedmetadata', () => {
            clearTimeout(this.timeouts.loading);
            
            this.state.duration = video.duration;
            this.elements.durationEl.textContent = this.formatTime(video.duration);
            
            this.detectVideoFormat();
            this.updateVideoInfo();
            this.hideLoading();
            
            this.startBufferManagement();
            this.updateStatistics();
            
            console.log(`📹 Video loaded: ${this.formatTime(video.duration)}`);
        });
        
        video.addEventListener('canplay', () => {
            this.hideLoading();
            this.elements.playOverlay.classList.remove('hidden');
        });
        
        video.addEventListener('canplaythrough', () => {
            this.hideLoading();
        });
        
        video.addEventListener('waiting', () => {
            this.showLoading('Buffering...');
        });
        
        video.addEventListener('playing', () => {
            this.hideLoading();
            this.state.isPlaying = true;
            this.elements.playerContainer.classList.add('playing');
            this.elements.playOverlay.classList.add('hidden');
            this.updatePlayButton();
        });
        
        video.addEventListener('pause', () => {
            this.state.isPlaying = false;
            this.elements.playerContainer.classList.remove('playing');
            this.updatePlayButton();
            this.updateBuffer();
        });
        
        video.addEventListener('ended', () => {
            this.state.isPlaying = false;
            this.elements.playerContainer.classList.remove('playing');
            this.elements.playOverlay.classList.remove('hidden');
            this.updatePlayButton();
            
            // Auto-play next if enabled
            if (this.elements.autoPlayNextCheckbox.checked) {
                this.playNextInPlaylist();
            }
        });
        
        // Time update
        video.addEventListener('timeupdate', () => {
            this.updateProgress();
            this.state.currentTime = video.currentTime;
            
            // Track max watched position
            if (video.currentTime > this.bufferManager.maxWatchedPosition) {
                this.bufferManager.maxWatchedPosition = video.currentTime;
            }
            
            // Update statistics
            this.storage.statistics.totalPlayTime += 0.25; // Rough estimate
            this.saveToStorage('flexstream_statistics', this.storage.statistics);
            this.updateStatistics();
        });
        
        // Buffer progress
        video.addEventListener('progress', () => this.updateBuffer());
        video.addEventListener('seeked', () => this.updateBuffer());
        
        // Error handling
        video.addEventListener('error', (e) => this.handleError(e));
        
        // Volume change
        video.addEventListener('volumechange', () => this.updateVolumeUI());
        
        // Resize
        video.addEventListener('resize', () => this.updateVideoInfo());
    }

    /* ============================
       VIDEO LOADING & STREAMING
    ============================ */

    async loadVideo() {
        let url = this.elements.urlInput.value.trim();
        
        if (!url) {
            this.showToast('Please enter a video URL', 'The URL field cannot be empty.', 'warning');
            this.elements.urlInput.focus();
            return;
        }
        
        // Validate URL
        if (!this.isValidUrl(url)) {
            this.showToast('Invalid URL', 'Please enter a valid video URL.', 'error');
            return;
        }
        
        // Check security restrictions
        if (!this.checkSecurity(url)) {
            this.showToast('URL blocked', 'This URL is not allowed due to security restrictions.', 'error');
            return;
        }
        
        // Check rate limiting
        if (!this.checkRateLimit()) {
            this.showToast('Rate limit exceeded', 'Please wait before loading another video.', 'warning');
            return;
        }
        
        // Store original URL
        this.state.originalUrl = url;
        
        // Check if proxy should be used
        const useProxy = this.elements.useProxyCheckbox && this.elements.useProxyCheckbox.checked;
        if (useProxy) {
            url = `http://localhost:4000/proxy?url=${encodeURIComponent(url)}`;
            console.log('🔄 Using proxy server');
        }
        
        this.state.currentUrl = url;
        
        // Hide any errors and show loading
        this.hideError();
        this.showPlayerSection();
        this.showLoading('Loading video...');
        
        // Reset tracking
        this.resetTracking();
        
        // Add to recent URLs
        this.addToRecentUrls(url);
        
        // Check streaming protocol
        if (url.includes('.m3u8')) {
            await this.loadHLS(url);
        } else if (url.includes('.mpd')) {
            await this.loadDASH(url);
        } else {
            await this.loadDirectVideo(url);
        }
        
        // Update URL params
        this.updateUrlParams(url);
        
        // Add to history
        this.addToHistory(url);
    }

    async loadDirectVideo(url) {
        const video = this.elements.video;
        
        // Reset video element
        video.pause();
        video.removeAttribute('src');
        video.load();
        
        // Configure for streaming
        video.preload = 'auto';
        video.crossOrigin = 'anonymous';
        
        // Check for special URLs
        const isGoogleUrl = url.includes('googleusercontent.com') || 
                           url.includes('googlevideo.com');
        
        if (isGoogleUrl) {
            console.log('🔗 Google video detected');
            video.removeAttribute('crossorigin');
        }
        
        // Check server capabilities
        await this.checkServerCapabilities(url);
        
        // Set source and load
        video.src = url;
        video.load();
        
        // Add loading timeout
        this.timeouts.loading = setTimeout(() => {
            if (video.readyState < 2) {
                console.warn('Video loading timeout');
                this.showLoading('Still loading...');
            }
        }, 15000);
    }

    async loadHLS(url) {
        const video = this.elements.video;
        
        // Check native HLS support
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            video.load();
            return;
        }
        
        // Use hls.js
        if (typeof Hls !== 'undefined') {
            if (this.streaming.hls) {
                this.streaming.hls.destroy();
            }
            
            this.streaming.hls = new Hls({
                maxBufferLength: 60,
                maxMaxBufferLength: 120,
                maxBufferSize: 60 * 1024 * 1024, // 60MB
                maxBufferHole: 0.5,
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 30
            });
            
            this.streaming.hls.loadSource(url);
            this.streaming.hls.attachMedia(video);
            
            this.streaming.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.hideLoading();
                console.log('✅ HLS manifest parsed');
            });
            
            this.streaming.hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS error:', data);
                if (data.fatal) {
                    this.showError(`HLS error: ${data.type}`);
                }
            });
        } else {
            this.showError('HLS playback requires hls.js library');
        }
    }

    async loadDASH(url) {
        if (typeof dashjs !== 'undefined') {
            if (this.streaming.dash) {
                this.streaming.dash.destroy();
            }
            
            this.streaming.dash = dashjs.MediaPlayer().create();
            this.streaming.dash.initialize(this.elements.video, url, false);
            
            this.streaming.dash.updateSettings({
                streaming: {
                    buffer: {
                        fastSwitchEnabled: true,
                        bufferTimeAtTopQuality: 30,
                        bufferTimeAtTopQualityLongForm: 60,
                    }
                }
            });
        } else {
            this.showError('DASH playback requires dash.js library');
        }
    }

    async checkServerCapabilities(url) {
        try {
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'cors',
                headers: {
                    'Range': 'bytes=0-1'
                }
            });
            
            const acceptRanges = response.headers.get('Accept-Ranges');
            const contentLength = response.headers.get('Content-Length');
            const contentType = response.headers.get('Content-Type');
            
            console.log('📡 Server capabilities:');
            console.log(`  • Range requests: ${acceptRanges === 'bytes' ? '✅' : '❌'}`);
            console.log(`  • Content-Type: ${contentType || 'unknown'}`);
            
            if (contentLength) {
                const sizeMB = (parseInt(contentLength) / (1024 * 1024)).toFixed(2);
                console.log(`  • File size: ${sizeMB} MB`);
                this.state.videoSize = parseInt(contentLength);
            }
            
            this.state.supportsRangeRequests = acceptRanges === 'bytes';
            
        } catch (error) {
            console.warn('Could not check server capabilities:', error.message);
        }
    }

    detectVideoFormat() {
        const video = this.elements.video;
        const url = this.state.currentUrl.toLowerCase();
        
        if (url.includes('.mp4')) {
            this.state.videoFormat = 'MP4';
        } else if (url.includes('.webm')) {
            this.state.videoFormat = 'WebM';
        } else if (url.includes('.mkv')) {
            this.state.videoFormat = 'MKV';
        } else if (url.includes('.m3u8')) {
            this.state.videoFormat = 'HLS';
        } else if (url.includes('.mpd')) {
            this.state.videoFormat = 'DASH';
        } else if (url.includes('.mp3') || url.includes('.ogg') || url.includes('.wav')) {
            this.state.videoFormat = 'Audio';
        } else {
            this.state.videoFormat = 'Unknown';
        }
        
        console.log(`🎬 Video format: ${this.state.videoFormat}`);
    }

    /* ============================
       PLAYBACK CONTROLS
    ============================ */

    togglePlay() {
        const video = this.elements.video;
        
        if (video.paused) {
            video.play().catch(error => {
                console.error('Play error:', error);
                this.showError('Could not play video: ' + error.message);
            });
        } else {
            video.pause();
        }
    }

    skip(seconds) {
        const video = this.elements.video;
        const newTime = video.currentTime + seconds;
        this.seekToTime(newTime);
        
        // Show seek indicator
        this.showSeekIndicator(seconds);
    }

    showSeekIndicator(seconds) {
        const direction = seconds < 0 ? 'left' : 'right';
        const indicator = document.createElement('div');
        
        indicator.className = `seek-indicator ${direction}`;
        indicator.textContent = `${seconds > 0 ? '+' : ''}${seconds}s`;
        indicator.style.cssText = `
            position: absolute;
            top: 50%;
            ${direction}: 20%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 1.25rem;
            font-weight: 600;
            z-index: 30;
            animation: fadeInOut 0.8s ease-out;
        `;
        
        this.elements.playerContainer.appendChild(indicator);
        
        setTimeout(() => {
            indicator.remove();
        }, 800);
    }

    seek(e) {
        const rect = this.elements.progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const clampedPos = Math.max(0, Math.min(1, pos));
        this.seekToTime(clampedPos * this.state.duration);
    }

    seekToTime(targetTime) {
        if (!this.state.duration) return;
        
        const video = this.elements.video;
        targetTime = Math.max(0, Math.min(targetTime, this.state.duration));
        
        // Check if buffered
        const isBuffered = this.isTimeBuffered(targetTime);
        
        if (!isBuffered && this.state.supportsRangeRequests === false) {
            this.showToast('Seeking not fully supported', 'Server may not support range requests.', 'warning');
        }
        
        // Show loading for unbuffered seeks
        if (!isBuffered) {
            this.showLoading('Seeking...');
        }
        
        video.currentTime = targetTime;
    }

    isTimeBuffered(time) {
        const video = this.elements.video;
        for (let i = 0; i < video.buffered.length; i++) {
            if (time >= video.buffered.start(i) && time <= video.buffered.end(i)) {
                return true;
            }
        }
        return false;
    }

    setPlaybackSpeed(speed) {
        try {
            this.elements.video.playbackRate = speed;
            this.state.currentSpeed = speed;
            this.elements.speedValue.textContent = `${speed}x`;
            
            // Update active button
            document.querySelectorAll('.speed-option').forEach(option => {
                option.classList.toggle('active', parseFloat(option.dataset.speed) === speed);
            });
            
            this.elements.speedMenu.classList.remove('active');
            
            this.showToast(`Playback speed: ${speed}x`, '', 'info');
            
        } catch (error) {
            console.warn(`Speed ${speed}x not supported:`, error);
            this.showToast(`Speed ${speed}x not supported`, 'Browser limit: 0.0625x - 16x', 'warning');
        }
    }

    toggleMute() {
        const video = this.elements.video;
        
        if (video.muted) {
            video.muted = false;
            video.volume = this.state.lastVolume;
        } else {
            this.state.lastVolume = video.volume;
            video.muted = true;
        }
        
        this.state.isMuted = video.muted;
        this.updateVolumeUI();
    }

    setVolume(value) {
        const volume = parseFloat(value);
        this.elements.video.volume = volume;
        this.elements.video.muted = volume === 0;
        this.state.currentVolume = volume;
        this.updateVolumeUI();
    }

    toggleFullscreen() {
        const container = this.elements.playerContainer;
        
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }

    async togglePiP() {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled) {
                await this.elements.video.requestPictureInPicture();
            }
        } catch (error) {
            console.error('PiP error:', error);
            this.showToast('Picture-in-Picture not available', 'Your browser may not support this feature.', 'warning');
        }
    }

    /* ============================
       BUFFER MANAGEMENT
    ============================ */

    startBufferManagement() {
        // Clear existing interval
        if (this.bufferManager.checkInterval) {
            clearInterval(this.bufferManager.checkInterval);
        }
        
        // Check buffer every 500ms
        this.bufferManager.checkInterval = setInterval(() => {
            this.manageBuffer();
        }, 500);
    }

    stopBufferManagement() {
        if (this.bufferManager.checkInterval) {
            clearInterval(this.bufferManager.checkInterval);
            this.bufferManager.checkInterval = null;
        }
    }

    manageBuffer() {
        const video = this.elements.video;
        if (!video.duration || !video.src) return;
        
        const currentTime = video.currentTime;
        const duration = video.duration;
        
        // Calculate buffer ranges
        let bufferAhead = 0;
        let bufferBehind = 0;
        let totalBuffered = 0;
        
        for (let i = 0; i < video.buffered.length; i++) {
            const start = video.buffered.start(i);
            const end = video.buffered.end(i);
            totalBuffered += end - start;
            
            if (currentTime >= start && currentTime <= end) {
                bufferAhead = end - currentTime;
                bufferBehind = currentTime - start;
            }
        }
        
        this.state.bufferedAhead = bufferAhead;
        
        // Update UI
        this.updateBufferUI(bufferAhead);
        
        // Show buffer indicator when paused and still loading
        if (video.paused && bufferAhead < this.bufferManager.targetBufferAhead && 
            totalBuffered < duration - 0.5) {
            this.elements.bufferIndicator.classList.add('active');
        } else {
            this.elements.bufferIndicator.classList.remove('active');
        }
        
        // Update network speed
        this.calculateNetworkSpeed(totalBuffered);
    }

    updateBuffer() {
        const video = this.elements.video;
        if (!video.duration || video.buffered.length === 0) return;
        
        const duration = video.duration;
        const currentTime = video.currentTime;
        
        // Find current buffer range
        let currentBufferEnd = currentTime;
        let currentBufferStart = currentTime;
        
        for (let i = 0; i < video.buffered.length; i++) {
            const start = video.buffered.start(i);
            const end = video.buffered.end(i);
            
            if (currentTime >= start && currentTime <= end) {
                currentBufferEnd = end;
                currentBufferStart = start;
                break;
            }
        }
        
        // Update visual buffer bar
        const bufferStartPercent = (currentBufferStart / duration) * 100;
        const bufferEndPercent = (currentBufferEnd / duration) * 100;
        
        this.elements.progressBuffer.style.left = `${bufferStartPercent}%`;
        this.elements.progressBuffer.style.width = `${bufferEndPercent - bufferStartPercent}%`;
        
        // Update buffer stat
        const aheadSeconds = Math.round(currentBufferEnd - currentTime);
        this.elements.bufferPercent.textContent = `${aheadSeconds}s`;
        
        // Update buffer health indicator
        const bufferStat = this.elements.bufferPercent.closest('.stat');
        bufferStat.classList.remove('healthy', 'warning', 'critical');
        
        if (aheadSeconds >= 30) {
            bufferStat.classList.add('healthy');
        } else if (aheadSeconds >= 10) {
            bufferStat.classList.add('warning');
        } else {
            bufferStat.classList.add('critical');
        }
    }

    calculateNetworkSpeed(totalBuffered) {
        const now = Date.now();
        
        // Initialize on first call
        if (this.bufferManager.lastBufferTime === 0) {
            this.bufferManager.lastBufferTime = now;
            this.bufferManager.lastBufferedAmount = totalBuffered;
            return;
        }
        
        const timeDelta = (now - this.bufferManager.lastBufferTime) / 1000; // seconds
        const bufferDelta = totalBuffered - this.bufferManager.lastBufferedAmount; // seconds
        
        if (timeDelta > 0.3 && bufferDelta > 0.1) {
            // Estimate bytes downloaded
            const bytesDownloaded = bufferDelta * (this.bufferManager.estimatedBitrate / 8);
            const speedBps = bytesDownloaded / timeDelta;
            
            // Add to rolling average
            this.bufferManager.networkSamples.push(speedBps);
            if (this.bufferManager.networkSamples.length > this.bufferManager.maxSamples) {
                this.bufferManager.networkSamples.shift();
            }
            
            // Calculate average
            const avgSpeed = this.bufferManager.networkSamples.reduce((a, b) => a + b, 0) / 
                           this.bufferManager.networkSamples.length;
            
            // Update display
            this.displayNetworkSpeed(avgSpeed);
            
            // Update total bytes downloaded
            this.bufferManager.bytesDownloaded += bytesDownloaded;
            this.updateDataUsage(bytesDownloaded);
        }
        
        // Update tracking
        this.bufferManager.lastBufferTime = now;
        this.bufferManager.lastBufferedAmount = totalBuffered;
    }

    displayNetworkSpeed(bytesPerSecond) {
        let displayText = '—';
        
        if (bytesPerSecond >= 1000000) {
            displayText = `${(bytesPerSecond / 1000000).toFixed(1)} MB/s`;
        } else if (bytesPerSecond >= 1000) {
            displayText = `${(bytesPerSecond / 1000).toFixed(0)} KB/s`;
        } else if (bytesPerSecond > 0) {
            displayText = `${Math.round(bytesPerSecond)} B/s`;
        }
        
        this.elements.networkSpeedEl.textContent = displayText;
        this.state.networkSpeed = bytesPerSecond;
    }

    /* ============================
       UI UPDATES
    ============================ */

    updateProgress() {
        if (!this.state.duration) return;
        
        const video = this.elements.video;
        const progress = (video.currentTime / this.state.duration) * 100;
        
        this.elements.progressPlayed.style.width = `${progress}%`;
        this.elements.progressThumb.style.left = `${progress}%`;
        this.elements.currentTimeEl.textContent = this.formatTime(video.currentTime);
    }

    updateTooltip(e) {
        const rect = this.elements.progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const clampedPos = Math.max(0, Math.min(1, pos));
        const time = clampedPos * this.state.duration;
        
        this.elements.progressTooltip.textContent = this.formatTime(time);
        this.elements.progressTooltip.style.left = `${clampedPos * 100}%`;
    }

    updateVolumeUI() {
        const video = this.elements.video;
        const volume = video.muted ? 0 : video.volume;
        const container = this.elements.muteBtn.closest('.volume-container');
        
        this.elements.volumeSlider.value = volume;
        this.elements.volumeFill.style.width = `${volume * 100}%`;
        
        container.classList.remove('low', 'muted');
        if (volume === 0 || video.muted) {
            container.classList.add('muted');
        } else if (volume < 0.5) {
            container.classList.add('low');
        }
    }

    updatePlayButton() {
        const video = this.elements.video;
        const playIcon = this.elements.playPauseBtn.querySelector('.icon-play');
        const pauseIcon = this.elements.playPauseBtn.querySelector('.icon-pause');
        
        if (video.paused) {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        } else {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        }
    }

    updateVideoInfo() {
        const video = this.elements.video;
        
        this.elements.infoUrl.textContent = this.truncateUrl(this.state.originalUrl, 40);
        this.elements.infoDuration.textContent = this.formatTime(video.duration || 0);
        this.elements.infoFormat.textContent = this.state.videoFormat;
        
        if (this.state.videoSize > 0) {
            const sizeMB = (this.state.videoSize / (1024 * 1024)).toFixed(2);
            this.elements.infoSize.textContent = `${sizeMB} MB`;
        } else {
            this.elements.infoSize.textContent = 'Unknown';
        }
    }

    updateStatistics() {
        const stats = this.storage.statistics;
        
        this.elements.totalPlayTime.textContent = this.formatTime(stats.totalPlayTime);
        this.elements.videosPlayed.textContent = stats.videosPlayed;
        
        if (stats.dataUsed > 0) {
            const dataMB = (stats.dataUsed / (1024 * 1024)).toFixed(2);
            this.elements.dataUsed.textContent = `${dataMB} MB`;
        } else {
            this.elements.dataUsed.textContent = '0 MB';
        }
    }

    updateDataUsage(bytes) {
        this.storage.statistics.dataUsed += bytes;
        this.saveToStorage('flexstream_statistics', this.storage.statistics);
        this.updateStatistics();
    }

    updateBufferUI(bufferAhead) {
        const aheadSeconds = Math.round(bufferAhead);
        this.elements.bufferPercent.textContent = `${aheadSeconds}s`;
        
        // Update buffer health
        const bufferStat = this.elements.bufferPercent.closest('.stat');
        bufferStat.classList.remove('healthy', 'warning', 'critical');
        
        if (bufferAhead >= 30) {
            bufferStat.classList.add('healthy');
        } else if (bufferAhead >= 10) {
            bufferStat.classList.add('warning');
        } else {
            bufferStat.classList.add('critical');
        }
    }

    /* ============================
       TIME INPUT & FORMATTING
    ============================ */

    showTimeInput() {
        this.elements.timeDisplay.style.display = 'none';
        this.elements.timeInputWrapper.classList.add('active');
        this.elements.timeInput.value = '';
        this.elements.timeInput.placeholder = this.formatTime(this.elements.video.currentTime);
        this.elements.timeInput.focus();
    }

    hideTimeInput() {
        this.elements.timeInputWrapper.classList.remove('active');
        this.elements.timeDisplay.style.display = '';
    }

    jumpToInputTime() {
        const input = this.elements.timeInput.value.trim();
        if (!input) {
            this.hideTimeInput();
            return;
        }
        
        const seconds = this.parseTimeInput(input);
        if (seconds !== null && seconds >= 0 && seconds <= this.state.duration) {
            this.seekToTime(seconds);
            this.hideTimeInput();
        } else {
            // Invalid input
            this.elements.timeInput.style.animation = 'shake 0.3s ease';
            setTimeout(() => {
                this.elements.timeInput.style.animation = '';
            }, 300);
            
            this.showToast('Invalid time format', 'Examples: 1:30, 1h30m, 90s', 'warning');
        }
    }

    parseTimeInput(input) {
        input = input.toLowerCase().trim();
        
        // Try HH:MM:SS or MM:SS format
        if (input.includes(':')) {
            const parts = input.split(':').map(p => parseInt(p) || 0);
            if (parts.length === 2) {
                // MM:SS
                return parts[0] * 60 + parts[1];
            } else if (parts.length === 3) {
                // HH:MM:SS
                return parts[0] * 3600 + parts[1] * 60 + parts[2];
            }
        }
        
        // Try human readable format
        let totalSeconds = 0;
        const hourMatch = input.match(/(\d+)\s*h/);
        const minMatch = input.match(/(\d+)\s*m/);
        const secMatch = input.match(/(\d+)\s*s/);
        
        if (hourMatch || minMatch || secMatch) {
            if (hourMatch) totalSeconds += parseInt(hourMatch[1]) * 3600;
            if (minMatch) totalSeconds += parseInt(minMatch[1]) * 60;
            if (secMatch) totalSeconds += parseInt(secMatch[1]);
            return totalSeconds;
        }
        
        // Try plain number (seconds)
        const num = parseInt(input);
        if (!isNaN(num)) {
            return num;
        }
        
        return null;
    }

    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    /* ============================
       FEATURES
    ============================ */

    takeScreenshot() {
        const video = this.elements.video;
        const canvas = document.createElement('canvas');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Create download link
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `flexstream-screenshot-${timestamp}.png`;
        
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // Add to screenshot gallery
        this.addScreenshotToGallery(canvas.toDataURL('image/png'), this.state.currentTime);
        
        this.showToast('Screenshot saved', `Saved as ${filename}`, 'success');
    }

    addScreenshotToGallery(dataUrl, timestamp) {
        // Load existing screenshots
        const screenshots = this.loadFromStorage('flexstream_screenshots') || [];
        
        // Add new screenshot
        screenshots.push({
            dataUrl: dataUrl,
            timestamp: timestamp,
            date: new Date().toISOString(),
            videoUrl: this.state.currentUrl
        });
        
        // Keep only last 50 screenshots
        if (screenshots.length > 50) {
            screenshots.shift();
        }
        
        // Save to storage
        this.saveToStorage('flexstream_screenshots', screenshots);
        
        // Update gallery UI
        this.updateScreenshotGallery();
    }

    updateScreenshotGallery() {
        const screenshots = this.loadFromStorage('flexstream_screenshots') || [];
        const grid = this.elements.screenshotGrid;
        
        grid.innerHTML = '';
        
        screenshots.forEach((screenshot, index) => {
            const item = document.createElement('div');
            item.className = 'screenshot-item';
            item.innerHTML = `
                <img src="${screenshot.dataUrl}" class="screenshot-img" alt="Screenshot">
                <div class="screenshot-time">${this.formatTime(screenshot.timestamp)}</div>
            `;
            
            item.addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = screenshot.dataUrl;
                link.download = `flexstream-screenshot-${index}.png`;
                link.click();
            });
            
            grid.appendChild(item);
        });
    }

    toggleFavorite() {
        this.state.isFavorite = !this.state.isFavorite;
        
        const favorites = this.storage.favorites;
        const currentVideo = {
            url: this.state.currentUrl,
            title: this.getVideoTitle(),
            duration: this.state.duration,
            added: new Date().toISOString()
        };
        
        if (this.state.isFavorite) {
            // Add to favorites
            favorites.push(currentVideo);
            this.elements.favoriteBtn.classList.add('active');
            this.elements.favoriteBtn.innerHTML = '<i class="fas fa-heart"></i><span>Favorited</span>';
            this.showToast('Added to favorites', '', 'success');
        } else {
            // Remove from favorites
            const index = favorites.findIndex(fav => fav.url === this.state.currentUrl);
            if (index > -1) {
                favorites.splice(index, 1);
            }
            this.elements.favoriteBtn.classList.remove('active');
            this.elements.favoriteBtn.innerHTML = '<i class="far fa-heart"></i><span>Favorite</span>';
            this.showToast('Removed from favorites', '', 'info');
        }
        
        this.saveToStorage('flexstream_favorites', favorites);
    }

    toggleLoop() {
        this.state.isLooping = !this.state.isLooping;
        this.elements.video.loop = this.state.isLooping;
        
        if (this.state.isLooping) {
            this.elements.loopBtn.classList.add('active');
            this.elements.loopBtn.innerHTML = '<i class="fas fa-redo"></i><span>Looping</span>';
            this.showToast('Loop enabled', 'Video will repeat', 'info');
        } else {
            this.elements.loopBtn.classList.remove('active');
            this.elements.loopBtn.innerHTML = '<i class="fas fa-redo"></i><span>Loop</span>';
            this.showToast('Loop disabled', '', 'info');
        }
    }

    shareVideo() {
        if (navigator.share) {
            navigator.share({
                title: 'FlexStream Video',
                text: 'Watch this video on FlexStream',
                url: window.location.href
            }).catch(error => {
                console.log('Share cancelled:', error);
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showToast('Link copied to clipboard', 'Share this link with others', 'success');
            }).catch(error => {
                console.error('Copy failed:', error);
                this.showToast('Could not copy link', 'Please copy the URL manually', 'error');
            });
        }
    }

    addToPlaylist() {
        const playlists = this.storage.playlists;
        const currentVideo = {
            url: this.state.currentUrl,
            title: this.getVideoTitle(),
            duration: this.state.duration,
            added: new Date().toISOString()
        };
        
        // Add to default playlist
        if (!playlists.default) {
            playlists.default = [];
        }
        
        playlists.default.push(currentVideo);
        this.saveToStorage('flexstream_playlists', playlists);
        
        // Update UI
        this.updatePlaylistUI();
        
        this.showToast('Added to playlist', '', 'success');
    }

    clearPlaylist() {
        if (confirm('Clear entire playlist?')) {
            this.storage.playlists = { default: [] };
            this.saveToStorage('flexstream_playlists', this.storage.playlists);
            this.updatePlaylistUI();
            this.showToast('Playlist cleared', '', 'info');
        }
    }

    updatePlaylistUI() {
        const playlist = this.storage.playlists.default || [];
        const container = this.elements.playlistItems;
        
        container.innerHTML = '';
        
        playlist.forEach((item, index) => {
            const element = document.createElement('div');
            element.className = 'playlist-item';
            if (item.url === this.state.currentUrl) {
                element.classList.add('active');
            }
            
            element.innerHTML = `
                <div class="playlist-thumb"></div>
                <div class="playlist-info">
                    <div class="playlist-title">${item.title}</div>
                    <div class="playlist-duration">${this.formatTime(item.duration)}</div>
                </div>
                <button class="playlist-remove" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            element.addEventListener('click', () => {
                this.elements.urlInput.value = item.url;
                this.loadVideo();
            });
            
            const removeBtn = element.querySelector('.playlist-remove');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFromPlaylist(index);
            });
            
            container.appendChild(element);
        });
    }

    removeFromPlaylist(index) {
        const playlists = this.storage.playlists;
        if (playlists.default && playlists.default[index]) {
            playlists.default.splice(index, 1);
            this.saveToStorage('flexstream_playlists', playlists);
            this.updatePlaylistUI();
            this.showToast('Removed from playlist', '', 'info');
        }
    }

    playNextInPlaylist() {
        const playlist = this.storage.playlists.default || [];
        if (playlist.length === 0) return;
        
        const currentIndex = playlist.findIndex(item => item.url === this.state.currentUrl);
        if (currentIndex === -1 || currentIndex >= playlist.length - 1) {
            return; // Not in playlist or last item
        }
        
        const nextVideo = playlist[currentIndex + 1];
        this.elements.urlInput.value = nextVideo.url;
        this.loadVideo();
    }

    /* ============================
       HISTORY & RECENT URLS
    ============================ */

    addToHistory(url) {
        const historyItem = {
            url: url,
            title: this.getVideoTitle(),
            duration: this.state.duration,
            timestamp: new Date().toISOString(),
            format: this.state.videoFormat,
            size: this.state.videoSize
        };
        
        // Add to beginning of history
        this.storage.history.unshift(historyItem);
        
        // Keep only last 100 items
        if (this.storage.history.length > 100) {
            this.storage.history.pop();
        }
        
        // Save to storage
        this.saveToStorage('flexstream_history', this.storage.history);
        
        // Update statistics
        this.storage.statistics.videosPlayed++;
        this.saveToStorage('flexstream_statistics', this.storage.statistics);
        
        // Update UI
        this.updateStatistics();
    }

    showHistoryModal() {
        this.updateHistoryUI();
        this.elements.historyModal.classList.add('active');
    }

    hideHistoryModal() {
        this.elements.historyModal.classList.remove('active');
    }

    updateHistoryUI() {
        const history = this.storage.history;
        const container = this.elements.historyList;
        
        container.innerHTML = '';
        
        if (history.length === 0) {
            container.innerHTML = '<div class="empty-history">No history yet</div>';
            return;
        }
        
        history.forEach((item, index) => {
            const element = document.createElement('div');
            element.className = 'history-item';
            
            element.innerHTML = `
                <div class="history-thumb"></div>
                <div class="history-info">
                    <div class="history-title">${item.title}</div>
                    <div class="history-url">${this.truncateUrl(item.url, 50)}</div>
                    <div class="history-meta">
                        <span class="history-date">${new Date(item.timestamp).toLocaleDateString()}</span>
                        <span class="history-duration">${this.formatTime(item.duration)}</span>
                        ${item.format ? `<span class="history-format">${item.format}</span>` : ''}
                    </div>
                </div>
            `;
            
            element.addEventListener('click', () => {
                this.elements.urlInput.value = item.url;
                this.loadVideo();
                this.hideHistoryModal();
            });
            
            container.appendChild(element);
        });
    }

    clearHistory() {
        if (confirm('Clear all watch history?')) {
            this.storage.history = [];
            this.saveToStorage('flexstream_history', this.storage.history);
            this.updateHistoryUI();
            this.showToast('History cleared', '', 'info');
        }
    }

    addToRecentUrls(url) {
        const recent = this.loadFromStorage('flexstream_recent') || [];
        
        // Remove if already exists
        const existingIndex = recent.findIndex(item => item.url === url);
        if (existingIndex > -1) {
            recent.splice(existingIndex, 1);
        }
        
        // Add to beginning
        recent.unshift({
            url: url,
            title: this.getVideoTitle(),
            added: new Date().toISOString()
        });
        
        // Keep only last 10
        if (recent.length > 10) {
            recent.pop();
        }
        
        this.saveToStorage('flexstream_recent', recent);
        this.loadRecentUrls();
    }

    loadRecentUrls() {
        const recent = this.loadFromStorage('flexstream_recent') || [];
        const container = this.elements.recentList;
        
        container.innerHTML = '';
        
        recent.forEach(item => {
            const element = document.createElement('div');
            element.className = 'recent-item';
            element.textContent = this.truncateUrl(item.url, 60);
            
            element.addEventListener('click', () => {
                this.elements.urlInput.value = item.url;
                this.loadVideo();
            });
            
            container.appendChild(element);
        });
    }

    /* ============================
       THEME MANAGEMENT
    ============================ */

    toggleTheme() {
        const isDark = document.body.classList.contains('theme-light');
        
        if (isDark) {
            // Switch to dark theme
            document.body.classList.remove('theme-light');
            this.storage.settings.theme = 'dark';
            this.showToast('Dark theme enabled', '', 'info');
        } else {
            // Switch to light theme
            document.body.classList.add('theme-light');
            this.storage.settings.theme = 'light';
            this.showToast('Light theme enabled', '', 'info');
        }
        
        this.saveToStorage('flexstream_settings', this.storage.settings);
    }

    applySettings() {
        const settings = this.storage.settings;
        
        // Apply theme
        if (settings.theme === 'light') {
            document.body.classList.add('theme-light');
        }
        
        // Apply volume
        if (settings.volume !== undefined) {
            this.setVolume(settings.volume);
        }
        
        // Apply speed
        if (settings.speed !== undefined) {
            this.setPlaybackSpeed(settings.speed);
        }
        
        // Apply proxy setting
        if (this.elements.useProxyCheckbox && settings.proxyEnabled !== undefined) {
            this.elements.useProxyCheckbox.checked = settings.proxyEnabled;
        }
    }

    /* ============================
       SAMPLE VIDEOS
    ============================ */

    loadSampleVideo() {
        const sampleVideos = [
            {
                name: 'Big Buck Bunny (MP4)',
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            },
            {
                name: 'Elephants Dream (WebM)',
                url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f9/Elephants_Dream_%28high_quality%29.webm/Elephants_Dream_%28high_quality%29.webm.480p.webm'
            },
            {
                name: 'Sintel Trailer (OGG)',
                url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/8/8a/Sintel_movie_4K.webm/Sintel_movie_4K.webm.720p.ogg'
            },
            {
                name: 'Tears of Steel (MP4)',
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
            }
        ];
        
        // Pick a random sample
        const randomIndex = Math.floor(Math.random() * sampleVideos.length);
        const sample = sampleVideos[randomIndex];
        
        this.elements.urlInput.value = sample.url;
        this.showToast(`Loading ${sample.name}`, 'Sample video provided for testing', 'info');
        this.loadVideo();
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check file size
        if (file.size > this.security.maxFileSize) {
            this.showToast('File too large', 'Maximum file size is 1GB', 'error');
            return;
        }
        
        // Check file type
        if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
            this.showToast('Invalid file type', 'Please select a video or audio file', 'error');
            return;
        }
        
        // Create object URL
        const objectUrl = URL.createObjectURL(file);
        
        // Update UI
        this.elements.urlInput.value = objectUrl;
        this.loadVideo();
        
        // Clean up file input
        event.target.value = '';
        
        this.showToast(`Loaded ${file.name}`, `Size: ${this.formatFileSize(file.size)}`, 'success');
    }

    /* ============================
       SECURITY & VALIDATION
    ============================ */

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (error) {
            // Also check for data URLs and blob URLs
            return url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('file://');
        }
    }

    checkSecurity(url) {
        // Check URL length
        if (url.length > this.security.maxUrlLength) {
            console.warn('URL too long:', url.length);
            return false;
        }
        
        // Check blocked domains
        const domain = this.extractDomain(url);
        if (this.security.blockedDomains.includes(domain)) {
            console.warn('Blocked domain:', domain);
            return false;
        }
        
        // Check allowed domains (if any are specified)
        if (this.security.allowedDomains.length > 0 && 
            !this.security.allowedDomains.includes(domain)) {
            console.warn('Domain not allowed:', domain);
            return false;
        }
        
        return true;
    }

    checkRateLimit() {
        const now = Date.now();
        const windowStart = now - this.security.rateLimiter.timeWindow;
        
        // Remove old requests
        this.security.rateLimiter.requests = this.security.rateLimiter.requests.filter(
            timestamp => timestamp > windowStart
        );
        
        // Check if limit exceeded
        if (this.security.rateLimiter.requests.length >= this.security.rateLimiter.maxRequests) {
            return false;
        }
        
        // Add current request
        this.security.rateLimiter.requests.push(now);
        return true;
    }

    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (error) {
            return 'unknown';
        }
    }

    /* ============================
       ERROR HANDLING
    ============================ */

    handleError(event) {
        const video = this.elements.video;
        const error = video.error;
        
        let message = 'Unable to load video';
        let details = '';
        
        if (error) {
            switch (error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                    message = 'Video playback aborted';
                    details = 'The user aborted the video playback.';
                    break;
                case MediaError.MEDIA_ERR_NETWORK:
                    message = 'Network error';
                    details = 'Check your internet connection or try again later.';
                    break;
                case MediaError.MEDIA_ERR_DECODE:
                    message = 'Video format not supported';
                    details = 'This video format is not supported by your browser.';
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    message = 'Video source not supported';
                    details = 'The video URL may be invalid, expired, or blocked by the server.';
                    
                    // Try alternative methods
                    this.tryAlternativeMethods();
                    return;
            }
        }
        
        this.showError(`${message}\n\n${details}`);
    }

    tryAlternativeMethods() {
        console.log('Trying alternative playback methods...');
        
        // Remove crossorigin attribute
        if (this.elements.video.hasAttribute('crossorigin')) {
            console.log('Trying without CORS...');
            this.elements.video.removeAttribute('crossorigin');
            this.elements.video.load();
            return;
        }
        
        // Try with crossorigin
        console.log('Trying with CORS...');
        this.elements.video.setAttribute('crossorigin', 'anonymous');
        this.elements.video.load();
    }

    reportIssue() {
        const report = {
            url: this.state.currentUrl,
            error: this.elements.errorText.textContent,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            videoInfo: {
                format: this.state.videoFormat,
                duration: this.state.duration,
                size: this.state.videoSize
            }
        };
        
        console.log('Issue report:', report);
        
        // In a real app, you would send this to a server
        // For now, just show a message
        this.showToast('Issue reported', 'Thank you for reporting this problem.', 'success');
        this.hideError();
    }

    /* ============================
       UI STATE MANAGEMENT
    ============================ */

    showPlayerSection() {
        this.elements.urlSection.classList.add('hidden');
        this.elements.playerSection.classList.add('active');
    }

    showUrlSection() {
        this.elements.urlSection.classList.remove('hidden');
        this.elements.playerSection.classList.remove('active');
        
        // Stop buffer management
        this.stopBufferManagement();
        
        // Reset video
        this.resetVideo();
        
        // Reset UI
        this.resetUI();
        
        // Clear URL params
        this.clearUrlParams();
        
        // Focus input
        this.elements.urlInput.focus();
    }

    showLoading(message = 'Loading...') {
        this.elements.loadingText.textContent = message;
        this.elements.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.elements.loadingOverlay.classList.remove('active');
        clearTimeout(this.timeouts.loading);
    }

    showError(message) {
        this.hideLoading();
        this.elements.errorText.textContent = message;
        this.elements.errorOverlay.classList.add('active');
    }

    hideError() {
        this.elements.errorOverlay.classList.remove('active');
    }

    showControls() {
        clearTimeout(this.timeouts.controls);
        clearTimeout(this.timeouts.cursor);
        
        this.elements.playerContainer.classList.add('show-controls');
        this.elements.playerContainer.classList.remove('hide-cursor');
        
        if (this.state.isPlaying) {
            this.timeouts.controls = setTimeout(() => {
                this.elements.playerContainer.classList.remove('show-controls');
            }, 3000);
            
            if (this.state.isFullscreen) {
                this.timeouts.cursor = setTimeout(() => {
                    this.elements.playerContainer.classList.add('hide-cursor');
                }, 3000);
            }
        }
    }

    hideControls() {
        if (this.state.isPlaying) {
            this.elements.playerContainer.classList.remove('show-controls');
        }
    }

    toggleSidebar() {
        this.elements.playerSidebar.classList.toggle('active');
    }

    onFullscreenChange() {
        this.state.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
        this.elements.playerContainer.classList.toggle('fullscreen', this.state.isFullscreen);
    }

    /* ============================
       KEYBOARD SHORTCUTS
    ============================ */

    handleKeyboard(event) {
        // Don't handle if typing in input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const key = event.key.toLowerCase();
        
        switch (key) {
            case ' ':
            case 'k':
                event.preventDefault();
                if (this.elements.playerSection.classList.contains('active')) {
                    this.togglePlay();
                }
                break;
                
            case 'f':
                event.preventDefault();
                this.toggleFullscreen();
                break;
                
            case 'm':
                event.preventDefault();
                this.toggleMute();
                break;
                
            case 's':
                event.preventDefault();
                this.takeScreenshot();
                break;
                
            case 'c':
                event.preventDefault();
                // Toggle subtitles
                this.showToast('Subtitles feature coming soon', '', 'info');
                break;
                
            case 'arrowleft':
            case 'j':
                event.preventDefault();
                this.skip(-10);
                break;
                
            case 'arrowright':
            case 'l':
                event.preventDefault();
                this.skip(10);
                break;
                
            case 'arrowup':
                event.preventDefault();
                this.setVolume(Math.min(1, this.elements.video.volume + 0.1));
                break;
                
            case 'arrowdown':
                event.preventDefault();
                this.setVolume(Math.max(0, this.elements.video.volume - 0.1));
                break;
                
            case '?':
                event.preventDefault();
                this.elements.shortcutsModal.classList.toggle('active');
                break;
                
            case 'escape':
                event.preventDefault();
                this.elements.shortcutsModal.classList.remove('active');
                if (this.elements.historyModal.classList.contains('active')) {
                    this.hideHistoryModal();
                }
                break;
                
            default:
                // Number keys for seeking (0-9 = 0%-90%)
                if (key >= '0' && key <= '9') {
                    event.preventDefault();
                    const percent = parseInt(key) * 10;
                    this.seekToTime((percent / 100) * this.state.duration);
                }
        }
    }

    /* ============================
       UTILITY FUNCTIONS
    ============================ */

    getVideoTitle() {
        try {
            const url = new URL(this.state.currentUrl);
            const pathname = url.pathname;
            const filename = pathname.split('/').pop();
            return filename || 'Untitled Video';
        } catch (error) {
            return 'Video';
        }
    }

    truncateUrl(url, maxLength) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength - 3) + '...';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showToast(title, message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        }[type];
        
        toast.innerHTML = `
            <i class="${icon} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        });
        
        this.elements.toastContainer.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    resetTracking() {
        this.bufferManager.lastBufferTime = 0;
        this.bufferManager.lastBufferedAmount = 0;
        this.bufferManager.networkSamples = [];
        this.bufferManager.bytesDownloaded = 0;
        this.bufferManager.maxWatchedPosition = 0;
        this.bufferManager.bufferRanges = [];
    }

    resetVideo() {
        const video = this.elements.video;
        
        video.pause();
        video.src = '';
        video.load();
        
        // Clean up HLS/DASH instances
        if (this.streaming.hls) {
            this.streaming.hls.destroy();
            this.streaming.hls = null;
        }
        
        if (this.streaming.dash) {
            this.streaming.dash.destroy();
            this.streaming.dash = null;
        }
    }

    resetUI() {
        this.hideLoading();
        this.hideError();
        
        // Reset progress bar
        this.elements.progressPlayed.style.width = '0%';
        this.elements.progressBuffer.style.width = '0%';
        this.elements.progressBuffer.style.left = '0%';
        this.elements.progressThumb.style.left = '0%';
        
        // Reset time display
        this.elements.currentTimeEl.textContent = '0:00';
        this.elements.durationEl.textContent = '0:00';
        
        // Reset stats
        this.elements.bufferPercent.textContent = '0s';
        this.elements.networkSpeedEl.textContent = '—';
        
        // Remove buffer health classes
        const bufferStat = this.elements.bufferPercent.closest('.stat');
        bufferStat.classList.remove('healthy', 'warning', 'critical');
        
        // Hide buffer indicator
        this.elements.bufferIndicator.classList.remove('active');
        
        // Reset favorite button
        this.state.isFavorite = false;
        this.elements.favoriteBtn.classList.remove('active');
        this.elements.favoriteBtn.innerHTML = '<i class="far fa-heart"></i><span>Favorite</span>';
        
        // Reset loop button
        this.state.isLooping = false;
        this.elements.loopBtn.classList.remove('active');
        this.elements.loopBtn.innerHTML = '<i class="fas fa-redo"></i><span>Loop</span>';
    }

    checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const videoUrl = params.get('url');
        
        if (videoUrl) {
            this.elements.urlInput.value = decodeURIComponent(videoUrl);
            this.loadVideo();
        }
    }

    updateUrlParams(url) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('url', encodeURIComponent(url));
        window.history.replaceState({}, '', newUrl);
    }

    clearUrlParams() {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('url');
        window.history.replaceState({}, '', newUrl);
    }

    /* ============================
       STORAGE MANAGEMENT
    ============================ */

    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            // localStorage might be full or disabled
            // In a real app, you might want to use IndexedDB as fallback
        }
    }

    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return null;
        }
    }

    clearStorage() {
        try {
            localStorage.clear();
            this.showToast('Storage cleared', 'All saved data has been removed', 'info');
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
        }
    }
}

// Initialize player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.flexStream = new FlexStreamPlayer();
        console.log('🎬 FlexStream Player ready!');
    } catch (error) {
        console.error('Failed to initialize FlexStream Player:', error);
        document.body.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: white; background: #1a1a2e;">
                <h1>FlexStream Error</h1>
                <p>Failed to initialize the video player.</p>
                <p><small>${error.message}</small></p>
                <button onclick="location.reload()" style="padding: 0.5rem 1rem; background: #6366f1; border: none; color: white; border-radius: 4px; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        `;
    }
});

// Service Worker for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlexStreamPlayer;
}