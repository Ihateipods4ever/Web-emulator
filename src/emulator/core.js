export class EmulatorCore {
  constructor(display, input, audio) {
    this.display = display
    this.input = input
    this.audio = audio
    
    this.romData = null
    this.memory = new Uint8Array(0x10000) // 64KB memory
    this.registers = {
      pc: 0x8000, // Program counter
      sp: 0xFF,   // Stack pointer
      a: 0,       // Accumulator
      x: 0,       // X register
      y: 0,       // Y register
      status: 0   // Status flags
    }
    
    this.ppu = {
      vram: new Uint8Array(0x4000),
      oam: new Uint8Array(0x100),
      palette: new Uint8Array(0x20),
      scanline: 0,
      cycle: 0,
      frame: 0
    }
    
    this.isLoaded = false
    this.setupMemoryMap()
  }

  setupMemoryMap() {
    // Initialize memory with default values
    this.memory.fill(0)
    
    // Set up basic memory mapping
    // This is a simplified implementation
    for (let i = 0; i < this.memory.length; i++) {
      this.memory[i] = 0
    }
  }

  async loadROM(romData) {
    this.romData = new Uint8Array(romData)
    
    // Parse ROM header (simplified NES format)
    if (this.romData.length < 16) {
      throw new Error('Invalid ROM file: too small')
    }
    
    // Check for NES header signature
    const nesSignature = [0x4E, 0x45, 0x53, 0x1A] // "NES\x1A"
    const isNES = nesSignature.every((byte, index) => this.romData[index] === byte)
    
    if (isNES) {
      this.loadNESROM()
    } else {
      // Try to load as generic ROM
      this.loadGenericROM()
    }
    
    this.isLoaded = true
    this.reset()
  }

  loadNESROM() {
    // Parse NES ROM header
    const prgRomSize = this.romData[4] * 16384 // 16KB units
    const chrRomSize = this.romData[5] * 8192  // 8KB units
    
    // Load PRG ROM into memory
    const prgStart = 16 // Skip header
    for (let i = 0; i < prgRomSize && i < 0x8000; i++) {
      this.memory[0x8000 + i] = this.romData[prgStart + i]
    }
    
    // Mirror PRG ROM if necessary
    if (prgRomSize === 16384) {
      for (let i = 0; i < 16384; i++) {
        this.memory[0xC000 + i] = this.memory[0x8000 + i]
      }
    }
    
    // Load CHR ROM into PPU VRAM
    const chrStart = prgStart + prgRomSize
    for (let i = 0; i < chrRomSize && i < this.ppu.vram.length; i++) {
      this.ppu.vram[i] = this.romData[chrStart + i]
    }
    
    console.log(`Loaded NES ROM: PRG=${prgRomSize} bytes, CHR=${chrRomSize} bytes`)
  }

  loadGenericROM() {
    // Load ROM data starting at 0x8000
    const maxSize = Math.min(this.romData.length, 0x8000)
    for (let i = 0; i < maxSize; i++) {
      this.memory[0x8000 + i] = this.romData[i]
    }
    
    console.log(`Loaded generic ROM: ${maxSize} bytes`)
  }

  isROMLoaded() {
    return this.isLoaded
  }

  reset() {
    // Reset CPU registers
    this.registers.pc = this.readWord(0xFFFC) || 0x8000
    this.registers.sp = 0xFF
    this.registers.a = 0
    this.registers.x = 0
    this.registers.y = 0
    this.registers.status = 0x24
    
    // Reset PPU
    this.ppu.scanline = 0
    this.ppu.cycle = 0
    this.ppu.frame = 0
    
    console.log(`Reset - PC: 0x${this.registers.pc.toString(16)}`)
  }

  runFrame() {
    if (!this.isLoaded) return
    
    // Simulate one frame (approximately 29780 CPU cycles for NTSC)
    const cyclesPerFrame = 29780
    
    for (let i = 0; i < cyclesPerFrame; i++) {
      this.executeCPUCycle()
      this.executePPUCycle()
      
      // Handle input
      this.handleInput()
    }
    
    this.ppu.frame++
  }

  executeCPUCycle() {
    // Simplified CPU execution
    const opcode = this.memory[this.registers.pc]
    
    switch (opcode) {
      case 0xEA: // NOP
        this.registers.pc++
        break
      case 0x4C: // JMP absolute
        this.registers.pc = this.readWord(this.registers.pc + 1)
        break
      case 0xA9: // LDA immediate
        this.registers.a = this.memory[this.registers.pc + 1]
        this.registers.pc += 2
        break
      default:
        // Skip unknown opcodes
        this.registers.pc++
        break
    }
    
    // Wrap program counter
    if (this.registers.pc >= 0x10000) {
      this.registers.pc = 0x8000
    }
  }

  executePPUCycle() {
    // Simplified PPU rendering
    this.ppu.cycle++
    
    if (this.ppu.cycle >= 341) {
      this.ppu.cycle = 0
      this.ppu.scanline++
      
      if (this.ppu.scanline >= 262) {
        this.ppu.scanline = 0
        this.renderFrame()
      }
    }
  }

  renderFrame() {
    // Create a simple test pattern to verify display is working
    const frameBuffer = new Uint32Array(256 * 240)
    
    // Generate a test pattern based on ROM data and frame count
    for (let y = 0; y < 240; y++) {
      for (let x = 0; x < 256; x++) {
        const index = y * 256 + x
        
        // Create pattern based on memory content and position
        const memValue = this.memory[0x8000 + ((x + y * 256) % 0x8000)]
        const r = (memValue + this.ppu.frame) & 0xFF
        const g = (memValue * 2 + x) & 0xFF
        const b = (memValue * 3 + y) & 0xFF
        
        // Convert to RGBA
        frameBuffer[index] = (0xFF << 24) | (b << 16) | (g << 8) | r
      }
    }
    
    // Send frame to display
    this.display.renderFrame(frameBuffer)
  }

  handleInput() {
    const inputState = this.input.getState()
    
    // Map input to memory locations (simplified)
    this.memory[0x4016] = 0
    if (inputState.a) this.memory[0x4016] |= 0x01
    if (inputState.b) this.memory[0x4016] |= 0x02
    if (inputState.select) this.memory[0x4016] |= 0x04
    if (inputState.start) this.memory[0x4016] |= 0x08
    if (inputState.up) this.memory[0x4016] |= 0x10
    if (inputState.down) this.memory[0x4016] |= 0x20
    if (inputState.left) this.memory[0x4016] |= 0x40
    if (inputState.right) this.memory[0x4016] |= 0x80
  }

  readWord(address) {
    return this.memory[address] | (this.memory[address + 1] << 8)
  }
}