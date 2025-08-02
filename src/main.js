import './style.css'
import { EmulatorCore } from './emulator/core.js'
import { DisplayRenderer } from './emulator/display.js'
import { InputHandler } from './emulator/input.js'
import { AudioProcessor } from './emulator/audio.js'
import { ROMLoader } from './emulator/rom-loader.js'

class RetroArcadeEmulator {
  constructor() {
    this.core = null
    this.display = null
    this.input = null
    this.audio = null
    this.romLoader = null
    this.isRunning = false
    this.animationId = null
    
    this.init()
  }

  init() {
    this.createUI()
    this.setupComponents()
    this.bindEvents()
  }

  createUI() {
    document.querySelector('#app').innerHTML = `
      <div class="emulator-container">
        <header class="emulator-header">
          <h1>🕹️ RetroArcade Emulator</h1>
          <div class="controls">
            <input type="file" id="rom-input" accept=".nes,.gb,.gbc,.smc,.sfc" style="display: none;">
            <button id="load-rom" class="btn btn-primary">Load ROM</button>
            <button id="play-pause" class="btn btn-secondary" disabled>Play</button>
            <button id="reset" class="btn btn-secondary" disabled>Reset</button>
            <button id="fullscreen" class="btn btn-secondary">Fullscreen</button>
          </div>
        </header>
        
        <main class="emulator-main">
          <div class="display-container">
            <canvas id="game-canvas" width="256" height="240"></canvas>
            <div class="display-overlay" id="display-overlay">
              <div class="loading-message">
                <h2>Welcome to RetroArcade</h2>
                <p>Load a ROM file to start playing</p>
                <div class="supported-formats">
                  <span>Supported: NES, Game Boy, SNES</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="info-panel">
            <div class="rom-info">
              <h3>ROM Information</h3>
              <div id="rom-details">No ROM loaded</div>
            </div>
            
            <div class="controls-info">
              <h3>Controls</h3>
              <div class="control-mapping">
                <div class="control-row">
                  <span class="key">Arrow Keys</span>
                  <span class="action">D-Pad</span>
                </div>
                <div class="control-row">
                  <span class="key">Z</span>
                  <span class="action">A Button</span>
                </div>
                <div class="control-row">
                  <span class="key">X</span>
                  <span class="action">B Button</span>
                </div>
                <div class="control-row">
                  <span class="key">Enter</span>
                  <span class="action">Start</span>
                </div>
                <div class="control-row">
                  <span class="key">Space</span>
                  <span class="action">Select</span>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <div class="status-bar">
          <span id="fps-counter">FPS: 0</span>
          <span id="status-text">Ready</span>
          <span id="audio-status">🔊 Audio: On</span>
        </div>
      </div>
    `
  }

  setupComponents() {
    const canvas = document.getElementById('game-canvas')
    
    // Initialize display with proper pixel format handling
    this.display = new DisplayRenderer(canvas)
    
    // Initialize input handler
    this.input = new InputHandler()
    
    // Initialize audio processor
    this.audio = new AudioProcessor()
    
    // Initialize ROM loader
    this.romLoader = new ROMLoader()
    
    // Initialize emulator core
    this.core = new EmulatorCore(this.display, this.input, this.audio)
  }

  bindEvents() {
    const loadRomBtn = document.getElementById('load-rom')
    const romInput = document.getElementById('rom-input')
    const playPauseBtn = document.getElementById('play-pause')
    const resetBtn = document.getElementById('reset')
    const fullscreenBtn = document.getElementById('fullscreen')

    loadRomBtn.addEventListener('click', () => romInput.click())
    romInput.addEventListener('change', (e) => this.handleROMLoad(e))
    playPauseBtn.addEventListener('click', () => this.togglePlayPause())
    resetBtn.addEventListener('click', () => this.reset())
    fullscreenBtn.addEventListener('click', () => this.toggleFullscreen())
  }

  async handleROMLoad(event) {
    const file = event.target.files[0]
    if (!file) return

    try {
      document.getElementById('status-text').textContent = 'Loading ROM...'
      
      const romData = await this.romLoader.loadROM(file)
      await this.core.loadROM(romData)
      
      this.updateROMInfo(file.name, romData)
      this.hideOverlay()
      this.enableControls()
      
      document.getElementById('status-text').textContent = 'ROM loaded successfully'
    } catch (error) {
      console.error('Failed to load ROM:', error)
      document.getElementById('status-text').textContent = 'Failed to load ROM'
      alert('Failed to load ROM: ' + error.message)
    }
  }

  updateROMInfo(filename, romData) {
    const romDetails = document.getElementById('rom-details')
    romDetails.innerHTML = `
      <div class="rom-detail"><strong>File:</strong> ${filename}</div>
      <div class="rom-detail"><strong>Size:</strong> ${(romData.byteLength / 1024).toFixed(1)} KB</div>
      <div class="rom-detail"><strong>Type:</strong> ${this.detectROMType(filename)}</div>
      <div class="rom-detail"><strong>Status:</strong> Ready to play</div>
    `
  }

  detectROMType(filename) {
    const ext = filename.toLowerCase().split('.').pop()
    const types = {
      'nes': 'Nintendo Entertainment System',
      'gb': 'Game Boy',
      'gbc': 'Game Boy Color',
      'smc': 'Super Nintendo',
      'sfc': 'Super Famicom'
    }
    return types[ext] || 'Unknown'
  }

  hideOverlay() {
    document.getElementById('display-overlay').style.display = 'none'
  }

  enableControls() {
    document.getElementById('play-pause').disabled = false
    document.getElementById('reset').disabled = false
  }

  togglePlayPause() {
    if (this.isRunning) {
      this.pause()
    } else {
      this.play()
    }
  }

  play() {
    if (!this.core.isROMLoaded()) return
    
    this.isRunning = true
    document.getElementById('play-pause').textContent = 'Pause'
    document.getElementById('status-text').textContent = 'Running'
    
    this.gameLoop()
  }

  pause() {
    this.isRunning = false
    document.getElementById('play-pause').textContent = 'Play'
    document.getElementById('status-text').textContent = 'Paused'
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }

  reset() {
    this.pause()
    this.core.reset()
    this.display.clear()
    document.getElementById('status-text').textContent = 'Reset'
  }

  gameLoop() {
    if (!this.isRunning) return

    // Run emulation frame
    this.core.runFrame()
    
    // Update FPS counter
    this.updateFPS()
    
    // Schedule next frame
    this.animationId = requestAnimationFrame(() => this.gameLoop())
  }

  updateFPS() {
    // Simple FPS counter implementation
    if (!this.lastTime) this.lastTime = performance.now()
    if (!this.frameCount) this.frameCount = 0
    
    this.frameCount++
    const currentTime = performance.now()
    
    if (currentTime - this.lastTime >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime))
      document.getElementById('fps-counter').textContent = `FPS: ${fps}`
      this.frameCount = 0
      this.lastTime = currentTime
    }
  }

  toggleFullscreen() {
    const canvas = document.getElementById('game-canvas')
    
    if (!document.fullscreenElement) {
      canvas.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }
}

// Initialize the emulator when the page loads
new RetroArcadeEmulator()