export class AudioProcessor {
  constructor() {
    this.audioContext = null
    this.masterGain = null
    this.isEnabled = true
    
    this.initAudio()
  }

  async initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
      this.masterGain.gain.value = 0.3
      
      console.log('Audio initialized successfully')
    } catch (error) {
      console.warn('Audio initialization failed:', error)
      this.isEnabled = false
    }
  }

  playTone(frequency, duration = 0.1, volume = 0.1) {
    if (!this.isEnabled || !this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)
    
    oscillator.frequency.value = frequency
    oscillator.type = 'square'
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  setMasterVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  toggle() {
    this.isEnabled = !this.isEnabled
    if (this.masterGain) {
      this.masterGain.gain.value = this.isEnabled ? 0.3 : 0
    }
    return this.isEnabled
  }
}