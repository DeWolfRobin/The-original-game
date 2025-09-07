'use strict';
// Game data
const MODIFIERS = [
    {
        name: "Speed Demon",
        description: "50% faster movement speed",
        effect: {speed: 1.5}
    },
    {
        name: "Giant Mode", 
        description: "2x larger but 2x points",
        effect: {size: 2, pointMultiplier: 2}
    },
    {
        name: "Tiny Mode",
        description: "0.5x size, 25% faster",
        effect: {size: 0.5, speed: 1.25}
    },
    {
        name: "Shield Bearer",
        description: "Start with 1 extra life",
        effect: {extraLives: 1}
    },
    {
        name: "Point Multiplier",
        description: "All points worth 2x",
        effect: {pointMultiplier: 2}
    },
    {
        name: "Magnet",
        description: "Attract power-ups from further away",
        effect: {magnetRange: 2}
    },
    {
        name: "Phase Walker",
        description: "Pass through 1 obstacle per run",
        effect: {phaseCharges: 1}
    },
    {
        name: "Time Dilator",
        description: "Slow time when near obstacles",
        effect: {timeDilation: true}
    }
];

const POWER_UP_TYPES = [
    {
        name: "score",
        color: "#FFD700",
        points: 100,
        description: "Score boost",
    },
    {
        name: "speed",
        color: "#00FF00",
        duration: 3000,
        description: "Speed boost",
    },
    {
        name: "shield",
        color: "#00FFFF",
        duration: 5000,
        description: "Temporary invincibility",
    },
    {
        name: "magnet",
        color: "#FF69B4",
        duration: 4000,
        description: "Attract power-ups",
    },
    {
        name: "extraLife",
        color: "#FFA500",
        description: "Gain an extra life",
    },
    {
        name: "slow",
        color: "#8A2BE2",
        duration: 4000,
        description: "Slow down obstacles",
    },
    {
        name: "nuke",
        color: "#FF4500",
        description: "Destroy all obstacles",
    }
];

// Audio System
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGainNode = null;
        this.musicGainNode = null;
        this.sfxGainNode = null;
        this.enabled = localStorage.getItem('audioEnabled') !== 'false';
        this.initialized = false;
        
        // Music system
        this.currentTheme = null;
        this.musicNodes = [];
        this.tempo = 120;
        this.currentTime = 0;
        
        // Sound effect cache
        this.sfxCache = new Map();
        
        this.initializeAudio();
    }
    
    async initializeAudio() {
        if (!this.enabled) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes
            this.masterGainNode = this.audioContext.createGain();
            this.musicGainNode = this.audioContext.createGain();
            this.sfxGainNode = this.audioContext.createGain();
            
            // Connect gain nodes
            this.musicGainNode.connect(this.masterGainNode);
            this.sfxGainNode.connect(this.masterGainNode);
            this.masterGainNode.connect(this.audioContext.destination);
            
            // Set volumes
            this.masterGainNode.gain.value = 0.3;
            this.musicGainNode.gain.value = 0.4;
            this.sfxGainNode.gain.value = 0.6;
            
            this.initialized = true;
            
            // Start with ambient theme
            this.playTheme('ambient');
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            this.enabled = false;
        }
    }
    
    async resumeAudio() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    playTheme(themeName) {
        if (!this.initialized || !this.enabled) return;
        
        this.stopMusic();
        this.currentTheme = themeName;
        
        switch (themeName) {
            case 'ambient':
                this.playAmbientTheme();
                break;
            case 'game':
                this.playGameTheme();
                break;
            case 'gameOver':
                this.playGameOverTheme();
                break;
        }
    }
    
    playAmbientTheme() {
        // Calm ambient pad sounds
        const frequencies = [130.81, 164.81, 196.00]; // C3, E3, G3
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = freq;
            
            filterNode.type = 'lowpass';
            filterNode.frequency.value = 800;
            filterNode.Q.value = 1;
            
            gainNode.gain.value = 0;
            gainNode.gain.setTargetAtTime(0.1, this.audioContext.currentTime, 2);
            
            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.musicGainNode);
            
            oscillator.start();
            this.musicNodes.push(oscillator);
        });
    }
    
    playGameTheme() {
        // Energetic synth melody with bass line
        this.playBassLine();
        this.playMelody();
        this.playArpeggio();
    }
    
    playBassLine() {
        const bassFreqs = [65.41, 87.31, 98.00, 73.42]; // C2, F2, G2, D2
        let noteIndex = 0;
        
        const playBassNote = () => {
            if (!this.enabled || this.currentTheme !== 'game') return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();
            
            oscillator.type = 'square';
            oscillator.frequency.value = bassFreqs[noteIndex % bassFreqs.length];
            
            filterNode.type = 'lowpass';
            filterNode.frequency.value = 200;
            
            gainNode.gain.value = 0.15;
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
            
            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.musicGainNode);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.8);
            
            noteIndex++;
            setTimeout(playBassNote, 500);
        };
        
        playBassNote();
    }
    
    playMelody() {
        const melodyFreqs = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C4 to C5
        let noteIndex = 0;
        
        const playMelodyNote = () => {
            if (!this.enabled || this.currentTheme !== 'game') return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();
            
            oscillator.type = 'triangle';
            oscillator.frequency.value = melodyFreqs[noteIndex % melodyFreqs.length];
            
            filterNode.type = 'highpass';
            filterNode.frequency.value = 100;
            
            gainNode.gain.value = 0.08;
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
            
            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.musicGainNode);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
            
            noteIndex++;
            setTimeout(playMelodyNote, 250);
        };
        
        setTimeout(playMelodyNote, 250);
    }
    
    playArpeggio() {
        const chordFreqs = [130.81, 164.81, 196.00, 246.94]; // Cm chord
        let noteIndex = 0;
        
        const playArpeggioNote = () => {
            if (!this.enabled || this.currentTheme !== 'game') return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = chordFreqs[noteIndex % chordFreqs.length];
            
            gainNode.gain.value = 0.05;
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.musicGainNode);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
            
            noteIndex++;
            setTimeout(playArpeggioNote, 125);
        };
        
        setTimeout(playArpeggioNote, 500);
    }
    
    playGameOverTheme() {
        // Darker, slower variation
        const frequencies = [98.00, 110.00, 123.47]; // G2, A2, B2
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.value = freq;
            
            filterNode.type = 'lowpass';
            filterNode.frequency.value = 400;
            filterNode.Q.value = 2;
            
            gainNode.gain.value = 0;
            gainNode.gain.setTargetAtTime(0.12, this.audioContext.currentTime, 1);
            gainNode.gain.setTargetAtTime(0, this.audioContext.currentTime + 4, 2);
            
            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.musicGainNode);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 6);
            this.musicNodes.push(oscillator);
        });
    }
    
    stopMusic() {
        this.musicNodes.forEach(node => {
            try {
                node.stop();
            } catch (e) {}
        });
        this.musicNodes = [];
    }
    
    playSFX(type) {
        if (!this.initialized || !this.enabled) return;
        
        switch (type) {
            case 'powerup':
                this.playChime();
                break;
            case 'obstacle':
                this.playHarshNoise();
                break;
            case 'select':
                this.playConfirmationBeep();
                break;
            case 'start':
                this.playStartChord();
                break;
        }
    }
    
    playChime() {
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.value = freq;
                
                gainNode.gain.value = 0.2;
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.sfxGainNode);
                
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.3);
            }, index * 50);
        });
    }
    
    playHarshNoise() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.value = 80;
        oscillator.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.value = 0.3;
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGainNode);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    playConfirmationBeep() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.value = 440;
        
        gainNode.gain.value = 0.15;
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGainNode);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    playStartChord() {
        const frequencies = [261.63, 329.63, 392.00]; // C4, E4, G4
        
        frequencies.forEach(freq => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'triangle';
            oscillator.frequency.value = freq;
            
            gainNode.gain.value = 0.1;
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.8);
        });
    }
    
    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('audioEnabled', this.enabled.toString());
        
        if (!this.enabled) {
            this.stopMusic();
        } else if (!this.initialized) {
            this.initializeAudio();
        }
        
        return this.enabled;
    }
}

// Touch Input Manager
class TouchInputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.isActive = false;
        this.touchStart = { x: 0, y: 0 };
        this.touchCurrent = { x: 0, y: 0 };
        this.virtualJoystickActive = false;
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickRadius = 50;
        
        this.setupTouchEvents();
    }
    
    setupTouchEvents() {
        // Prevent default touch behaviors
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Virtual joystick events
        const joystick = document.getElementById('virtualJoystick');
        if (joystick) {
            joystick.addEventListener('touchstart', this.handleJoystickStart.bind(this), { passive: false });
            joystick.addEventListener('touchmove', this.handleJoystickMove.bind(this), { passive: false });
            joystick.addEventListener('touchend', this.handleJoystickEnd.bind(this), { passive: false });
        }
    }
    
    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        
        this.isActive = true;
        this.touchStart.x = touch.clientX - rect.left;
        this.touchStart.y = touch.clientY - rect.top;
        this.touchCurrent.x = this.touchStart.x;
        this.touchCurrent.y = this.touchStart.y;
    }
    
    handleTouchMove(event) {
        event.preventDefault();
        if (!this.isActive) return;
        
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        
        this.touchCurrent.x = touch.clientX - rect.left;
        this.touchCurrent.y = touch.clientY - rect.top;
    }
    
    handleTouchEnd(event) {
        event.preventDefault();
        this.isActive = false;
    }
    
    handleJoystickStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const joystick = document.getElementById('virtualJoystick');
        const rect = joystick.getBoundingClientRect();
        
        this.virtualJoystickActive = true;
        this.joystickCenter.x = rect.left + rect.width / 2;
        this.joystickCenter.y = rect.top + rect.height / 2;
    }
    
    handleJoystickMove(event) {
        event.preventDefault();
        if (!this.virtualJoystickActive) return;
        
        const touch = event.touches[0];
        const dx = touch.clientX - this.joystickCenter.x;
        const dy = touch.clientY - this.joystickCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const maxDistance = this.joystickRadius;
        const clampedDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(dy, dx);
        
        const clampedX = Math.cos(angle) * clampedDistance;
        const clampedY = Math.sin(angle) * clampedDistance;
        
        const inner = document.getElementById('joystickInner');
        inner.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
        
        // Store normalized joystick values
        this.joystickInput = {
            x: clampedX / maxDistance,
            y: clampedY / maxDistance
        };
    }
    
    handleJoystickEnd(event) {
        event.preventDefault();
        this.virtualJoystickActive = false;
        this.joystickInput = { x: 0, y: 0 };
        
        const inner = document.getElementById('joystickInner');
        inner.style.transform = 'translate(0px, 0px)';
    }
    
    getDragVector() {
        if (!this.isActive) return { x: 0, y: 0 };
        
        const dx = this.touchCurrent.x - this.touchStart.x;
        const dy = this.touchCurrent.y - this.touchStart.y;
        
        // Normalize and apply sensitivity
        const sensitivity = 0.2;
        return {
            x: dx * sensitivity,
            y: dy * sensitivity
        };
    }
    
    getJoystickInput() {
        return this.joystickInput || { x: 0, y: 0 };
    }
}

// Game engine
class TheOriginalGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Initialize audio system
        this.audioSystem = new AudioSystem();
        
        // Initialize touch input
        this.touchInput = new TouchInputManager(this.canvas);
        
        // Game state
        this.gameState = 'start';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('theOriginalGameHighScore')) || 0;
        this.lives = 1;
        this.gameSpeed = 2;
        this.currentSpeed = this.gameSpeed;
        this.timeScale = 1;
        this.slowTime = 0;
        
        // Mobile settings
        this.useVirtualJoystick = false;
        this.performanceLevel = this.detectPerformanceLevel();
        
        // Modifier system
        this.currentModifiers = [];
        this.selectedModifier = null;
        this.activeModifier = null;
        
        // Game objects
        this.player = null;
        this.obstacles = [];
        this.powerUps = [];
        this.particles = [];
        
        // Input
        this.keys = {};
        this.setupInput();
        
        // Screens
        this.setupScreens();
        
        // Game loop
        this.lastTime = 0;
        this.frameCount = 0;
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
        
        this.updateHighScoreDisplay();
        this.updateAudioToggle();
    }
    
    detectPerformanceLevel() {
        // Simple performance detection based on screen size and hardware
        const pixelRatio = window.devicePixelRatio || 1;
        const screenSize = window.innerWidth * window.innerHeight;
        
        if (screenSize < 500000 || pixelRatio < 1.5) {
            return 'low';
        } else if (screenSize < 2000000) {
            return 'medium';
        }
        return 'high';
    }
    
    setupCanvas() {
        const updateCanvasSize = () => {
            const pixelRatio = window.devicePixelRatio || 1;
            this.canvas.width = window.innerWidth * pixelRatio;
            this.canvas.height = window.innerHeight * pixelRatio;
            this.canvas.style.width = window.innerWidth + 'px';
            this.canvas.style.height = window.innerHeight + 'px';
            this.ctx.scale(pixelRatio, pixelRatio);
        };
        
        updateCanvasSize();
        
        window.addEventListener('resize', () => {
            updateCanvasSize();
        });
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(updateCanvasSize, 100);
        });
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleSpacePress();
            }
            
            if (this.gameState === 'modifiers') {
                if (e.code === 'Digit1') this.selectModifier(0);
                if (e.code === 'Digit2') this.selectModifier(1);
                if (e.code === 'Digit3') this.selectModifier(2);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    setupScreens() {
        // Audio toggle with proper event handling
        const audioToggle = document.getElementById('audioToggle');
        const handleAudioToggle = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.audioSystem.resumeAudio();
            this.toggleAudio();
        };
        audioToggle.addEventListener('pointerup', handleAudioToggle);
        
        // Control toggle with better feedback
        const controlToggle = document.getElementById('controlToggle');
        const handleControlToggle = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleControls();
        };
        controlToggle.addEventListener('pointerup', handleControlToggle);
        
        // Main buttons with proper touch handling
        const startBtn = document.getElementById('startBtn');
        const handleStart = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.audioSystem.resumeAudio();
            this.startGame();
        };
        startBtn.addEventListener('pointerup', handleStart);
        
        const restartBtn = document.getElementById('restartBtn');
        const handleRestart = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.restartGame();
        };
        restartBtn.addEventListener('pointerup', handleRestart);
        
        // Modifier card clicks with better touch feedback
        document.querySelectorAll('.modifier-card').forEach((card, index) => {
            const handleSelect = (e) => {
                e.preventDefault();
                e.stopPropagation();
                card.classList.add('touch-feedback');
                setTimeout(() => card.classList.remove('touch-feedback'), 300);
                this.selectModifier(index);
            };
            
            card.addEventListener('pointerup', handleSelect);
        });
    }
    
    toggleAudio() {
        const enabled = this.audioSystem.toggle();
        this.updateAudioToggle();
        
        if (enabled && this.gameState === 'start') {
            this.audioSystem.playTheme('ambient');
        }
    }
    
    updateAudioToggle() {
        const button = document.getElementById('audioToggle');
        const icon = button.querySelector('.audio-icon');
        
        if (this.audioSystem.enabled) {
            button.classList.remove('muted');
            icon.textContent = '🔊';
        } else {
            button.classList.add('muted');
            icon.textContent = '🔇';
        }
    }
    
    toggleControls() {
        this.useVirtualJoystick = !this.useVirtualJoystick;
        const joystick = document.getElementById('virtualJoystick');
        const controlToggle = document.getElementById('controlToggle');
        
        if (this.useVirtualJoystick) {
            joystick.classList.remove('hidden');
            controlToggle.style.background = 'rgba(0, 255, 255, 0.3)';
            controlToggle.style.borderColor = '#00FFFF';
            controlToggle.style.color = '#00FFFF';
        } else {
            joystick.classList.add('hidden');
            controlToggle.style.background = 'rgba(0, 191, 255, 0.2)';
            controlToggle.style.borderColor = '#00BFFF';
            controlToggle.style.color = '#00BFFF';
        }
        
        // Visual feedback
        controlToggle.classList.add('touch-feedback');
        setTimeout(() => controlToggle.classList.remove('touch-feedback'), 300);
    }
    
    handleSpacePress() {
        if (this.gameState === 'start') {
            this.startGame();
        } else if (this.gameState === 'gameOver') {
            this.restartGame();
        }
    }
    
    async startGame() {
        await this.audioSystem.resumeAudio();
        this.gameState = 'modifiers';
        this.showScreen('modifierScreen');
        this.generateModifierOptions();
        this.audioSystem.playSFX('select');
    }
    
    generateModifierOptions() {
        const shuffled = [...MODIFIERS].sort(() => Math.random() - 0.5);
        this.currentModifiers = shuffled.slice(0, 3);
        
        this.currentModifiers.forEach((modifier, index) => {
            document.getElementById(`mod${index}Name`).textContent = modifier.name;
            document.getElementById(`mod${index}Desc`).textContent = modifier.description;
        });
    }
    
    selectModifier(index) {
        // Fix modifier selection by properly copying the selected modifier
        this.selectedModifier = JSON.parse(JSON.stringify(this.currentModifiers[index]));
        this.audioSystem.playSFX('select');
        setTimeout(() => {
            this.initializeGame();
        }, 200);
    }
    
    initializeGame() {
        this.gameState = 'playing';
        this.showScreen('gameScreen');
        this.audioSystem.playTheme('game');
        this.audioSystem.playSFX('start');
        
        // Reset game state
        this.score = 0;
        this.lives = 1;
        this.gameSpeed = 2;
        this.timeScale = 1;
        this.obstacles = [];
        this.powerUps = [];
        this.particles = [];
        
        // Apply modifier - create a deep copy to avoid reference issues
        this.activeModifier = JSON.parse(JSON.stringify(this.selectedModifier));
        this.applyModifier();
        
        // Create player
        this.player = new Player(100, window.innerHeight / 2, this.activeModifier);
        
        this.updateUI();
    }
    
    applyModifier() {
        if (this.activeModifier.effect.extraLives) {
            this.lives += this.activeModifier.effect.extraLives;
        }
        
        document.getElementById('activeModifier').textContent = this.activeModifier.name;
    }
    
    restartGame() {
        this.gameState = 'start';
        this.showScreen('startScreen');
        this.audioSystem.playTheme('ambient');
        this.updateHighScoreDisplay();
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    updateHighScoreDisplay() {
        document.getElementById('highScoreValue').textContent = this.highScore;
    }
    
    updateUI() {
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('livesCount').textContent = this.lives;
    }
    
    gameLoop(currentTime) {
        const deltaTime = Math.min(currentTime - this.lastTime, 32); // Cap at ~30fps
        this.lastTime = currentTime;
        this.frameCount++;
        
        if (this.gameState === 'playing') {
            this.update(deltaTime);
            this.render();
        }
        
        requestAnimationFrame(this.gameLoop);
    }
    
    update(deltaTime) {
        const scaledDelta = deltaTime * this.timeScale;

        if (this.slowTime > 0) {
            this.slowTime = Math.max(0, this.slowTime - scaledDelta);
        }

        const speedFactor = this.slowTime > 0 ? 0.5 : 1;
        this.currentSpeed = this.gameSpeed * speedFactor;

        // Update player
        this.player.update(scaledDelta, this.keys, this.canvas, this.touchInput, this.useVirtualJoystick);

        // Time dilation
        if (this.activeModifier.effect.timeDilation) {
            this.updateTimeDilation();
        }

        // Spawn obstacles - reduced rate on lower performance
        const obstacleRate = this.performanceLevel === 'low' ? 0.015 : 0.02;
        if (Math.random() < obstacleRate * (scaledDelta / 16)) {
            this.spawnObstacle();
        }

        // Spawn power-ups
        if (Math.random() < 0.005 * (scaledDelta / 16)) {
            this.spawnPowerUp();
        }

        // Update game objects
        this.updateGameObjects(scaledDelta, this.currentSpeed);

        // Particle limit for performance
        const maxParticles = this.performanceLevel === 'low' ? 50 : 200;
        if (this.particles.length > maxParticles) {
            this.particles = this.particles.slice(-maxParticles);
        }

        // Player trail particles - reduced on low performance
        if (Math.random() < (this.performanceLevel === 'low' ? 0.1 : 0.3)) {
            this.addParticle(this.player.x - this.player.size/2, this.player.y, '#00BFFF', 500);
        }

        // Collision detection
        this.checkCollisions();

        // Increase difficulty
        this.gameSpeed += 0.0005 * scaledDelta;

        // Update score
        this.score += Math.floor(0.1 * scaledDelta * (this.activeModifier.effect.pointMultiplier || 1));
        this.updateUI();
    }
    
    updateGameObjects(scaledDelta, speed) {
        // Update obstacles
        this.obstacles.forEach(obstacle => obstacle.update(scaledDelta, speed));
        this.obstacles = this.obstacles.filter(obstacle => obstacle.x > -100);

        // Update power-ups
        this.powerUps.forEach(powerUp => {
            powerUp.update(scaledDelta, speed);

            // Magnet effect
            if (this.player.hasMagnet || this.activeModifier.effect.magnetRange) {
                const dx = this.player.x - powerUp.x;
                const dy = this.player.y - powerUp.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const magnetRange = (this.activeModifier.effect.magnetRange || 1) * 150;

                if (distance < magnetRange) {
                    powerUp.x += (dx / distance) * 2;
                    powerUp.y += (dy / distance) * 2;
                }
            }
        });
        this.powerUps = this.powerUps.filter(powerUp => powerUp.x > -100);

        // Update particles
        this.particles.forEach(particle => particle.update(scaledDelta));
        this.particles = this.particles.filter(particle => particle.life > 0);
    }
    
    updateTimeDilation() {
        let nearObstacle = false;
        const dilationDistance = 150;
        
        this.obstacles.forEach(obstacle => {
            const dx = this.player.x - obstacle.x;
            const dy = this.player.y - obstacle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < dilationDistance) {
                nearObstacle = true;
            }
        });
        
        this.timeScale = nearObstacle ? 0.3 : 1.0;
    }
    
    spawnObstacle() {
        const size = 30 + Math.random() * 40;
        const y = Math.random() * (window.innerHeight - size);
        this.obstacles.push(new Obstacle(window.innerWidth, y, size));
    }
    
    spawnPowerUp() {
        const type = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
        const y = Math.random() * (window.innerHeight - 40);
        this.powerUps.push(new PowerUp(window.innerWidth, y, type));
    }
    
    checkCollisions() {
        // Obstacle collisions
        this.obstacles.forEach((obstacle, index) => {
            if (this.player.collidesWith(obstacle)) {
                if (this.player.hasShield) {
                    this.obstacles.splice(index, 1);
                    this.addExplosion(obstacle.x, obstacle.y, '#00FFFF');
                } else if (this.activeModifier.effect.phaseCharges > 0) {
                    this.activeModifier.effect.phaseCharges--;
                    this.obstacles.splice(index, 1);
                    this.addExplosion(obstacle.x, obstacle.y, '#FFD700');
                } else {
                    this.lives--;
                    this.obstacles.splice(index, 1);
                    this.addExplosion(obstacle.x, obstacle.y, '#FF4500');
                    this.audioSystem.playSFX('obstacle');
                    
                    if (this.lives <= 0) {
                        this.gameOver();
                    }
                }
            }
        });
        
        // Power-up collisions
        this.powerUps.forEach((powerUp, index) => {
            if (this.player.collidesWith(powerUp)) {
                this.collectPowerUp(powerUp);
                this.powerUps.splice(index, 1);
                this.addExplosion(powerUp.x, powerUp.y, powerUp.color);
                this.audioSystem.playSFX('powerup');
            }
        });
    }
    
    collectPowerUp(powerUp) {
        const multiplier = this.activeModifier.effect.pointMultiplier || 1;
        
        switch (powerUp.type.name) {
            case 'score':
                this.score += powerUp.type.points * multiplier;
                break;
            case 'speed':
                this.player.activateSpeedBoost(powerUp.type.duration);
                break;
            case 'shield':
                this.player.activateShield(powerUp.type.duration);
                break;
            case 'magnet':
                this.player.activateMagnet(powerUp.type.duration);
                break;
            case 'extraLife':
                this.lives++;
                break;
            case 'slow':
                this.slowTime = powerUp.type.duration;
                break;
            case 'nuke':
                this.obstacles.forEach(ob => this.addExplosion(ob.x, ob.y, '#FF4500'));
                this.obstacles = [];
                break;
        }
    }
    
    addParticle(x, y, color, life) {
        this.particles.push(new Particle(x, y, color, life));
    }
    
    addExplosion(x, y, color) {
        const particleCount = this.performanceLevel === 'low' ? 5 : 10;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(x, y, color, 1000, true));
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.audioSystem.playTheme('gameOver');
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('theOriginalGameHighScore', this.highScore.toString());
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('bestScore').textContent = this.highScore;
        document.getElementById('usedModifier').textContent = this.activeModifier.name;
        
        this.showScreen('gameOverScreen');
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        
        // Background effect
        this.renderBackground();
        
        // Game objects
        this.player.render(this.ctx);
        this.obstacles.forEach(obstacle => obstacle.render(this.ctx));
        this.powerUps.forEach(powerUp => powerUp.render(this.ctx));
        this.particles.forEach(particle => particle.render(this.ctx));
    }
    
    renderBackground() {
        if (this.performanceLevel === 'low') return;
        
        this.ctx.strokeStyle = 'rgba(0, 191, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        const offset = (Date.now() * this.currentSpeed * 0.05) % gridSize;
        
        for (let x = -offset; x < window.innerWidth + gridSize; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, window.innerHeight);
            this.ctx.stroke();
        }
    }
}

// Player class with mobile controls
class Player {
    constructor(x, y, modifier) {
        this.x = x;
        this.y = y;
        this.size = 20 * (modifier.effect.size || 1);
        this.speed = 5 * (modifier.effect.speed || 1);
        this.color = '#00BFFF';
        
        this.hasShield = false;
        this.hasMagnet = false;
        this.hasSpeedBoost = false;
        this.shieldTime = 0;
        this.magnetTime = 0;
        this.speedTime = 0;
    }
    
    update(deltaTime, keys, canvas, touchInput, useVirtualJoystick) {
        let dx = 0, dy = 0;
        
        // Keyboard input
        if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
        
        // Touch input
        if (useVirtualJoystick) {
            const joystickInput = touchInput.getJoystickInput();
            dx += joystickInput.x;
            dy += joystickInput.y;
        } else {
            const dragVector = touchInput.getDragVector();
            dx += dragVector.x * 0.1;
            dy += dragVector.y * 0.1;
        }
        
        // Normalize diagonal movement
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        if (magnitude > 1) {
            dx /= magnitude;
            dy /= magnitude;
        }
        
        const moveSpeed = this.hasSpeedBoost ? this.speed * 1.5 : this.speed;
        this.x += dx * moveSpeed * (deltaTime / 16);
        this.y += dy * moveSpeed * (deltaTime / 16);
        
        // Boundary checking
        this.x = Math.max(this.size, Math.min(window.innerWidth - this.size, this.x));
        this.y = Math.max(this.size, Math.min(window.innerHeight - this.size, this.y));
        
        // Update power-up timers
        this.shieldTime = Math.max(0, this.shieldTime - deltaTime);
        this.magnetTime = Math.max(0, this.magnetTime - deltaTime);
        this.speedTime = Math.max(0, this.speedTime - deltaTime);
        
        this.hasShield = this.shieldTime > 0;
        this.hasMagnet = this.magnetTime > 0;
        this.hasSpeedBoost = this.speedTime > 0;
    }
    
    render(ctx) {
        ctx.save();
        
        // Shield effect
        if (this.hasShield) {
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 10, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 20;
        }
        
        // Magnet effect
        if (this.hasMagnet) {
            ctx.strokeStyle = '#FF69B4';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Player body
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    collidesWith(obj) {
        const dx = this.x - obj.x;
        const dy = this.y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.size + obj.size) / 2;
    }
    
    activateShield(duration) {
        this.shieldTime = duration;
    }
    
    activateMagnet(duration) {
        this.magnetTime = duration;
    }
    
    activateSpeedBoost(duration) {
        this.speedTime = duration;
    }
}

// Obstacle class
class Obstacle {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = '#FF4500';
        this.rotation = 0;
    }
    
    update(deltaTime, speed) {
        this.x -= speed * (deltaTime / 16);
        this.rotation += 0.02 * deltaTime;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.moveTo(0, -this.size/2);
        ctx.lineTo(this.size/2, 0);
        ctx.lineTo(0, this.size/2);
        ctx.lineTo(-this.size/2, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

// PowerUp class
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.size = 15;
        this.type = type;
        this.color = type.color;
        this.pulse = 0;
    }
    
    update(deltaTime, speed) {
        this.x -= speed * (deltaTime / 16);
        this.pulse += 0.005 * deltaTime;
    }
    
    render(ctx) {
        ctx.save();
        
        const pulseFactor = 1 + Math.sin(this.pulse) * 0.2;
        const size = this.size * pulseFactor;
        
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Particle class
class Particle {
    constructor(x, y, color, life, explosion = false) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.maxLife = life;
        this.life = life;
        
        if (explosion) {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4;
        } else {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
        }
        
        this.size = Math.random() * 3 + 1;
    }
    
    update(deltaTime) {
        this.x += this.vx * (deltaTime / 16);
        this.y += this.vy * (deltaTime / 16);
        this.life -= deltaTime;
        
        this.vx *= 0.99;
        this.vy *= 0.99;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new TheOriginalGame();
});
