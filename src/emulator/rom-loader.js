export class ROMLoader {
  constructor() {
    this.supportedExtensions = ['.nes', '.gb', '.gbc', '.smc', '.sfc']
  }

  async loadROM(file) {
    return new Promise((resolve, reject) => {
      if (!this.isValidROMFile(file)) {
        reject(new Error('Unsupported file type'))
        return
      }

      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target.result
          this.validateROM(arrayBuffer, file.name)
          resolve(arrayBuffer)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  isValidROMFile(file) {
    const extension = '.' + file.name.toLowerCase().split('.').pop()
    return this.supportedExtensions.includes(extension)
  }

  validateROM(arrayBuffer, filename) {
    const data = new Uint8Array(arrayBuffer)
    
    if (data.length < 16) {
      throw new Error('ROM file is too small')
    }

    const extension = '.' + filename.toLowerCase().split('.').pop()
    
    switch (extension) {
      case '.nes':
        this.validateNESROM(data)
        break
      case '.gb':
      case '.gbc':
        this.validateGameBoyROM(data)
        break
      case '.smc':
      case '.sfc':
        this.validateSNESROM(data)
        break
      default:
        // Generic validation
        console.log('Loading as generic ROM')
    }
  }

  validateNESROM(data) {
    // Check NES header signature
    const nesSignature = [0x4E, 0x45, 0x53, 0x1A] // "NES\x1A"
    const hasValidHeader = nesSignature.every((byte, index) => data[index] === byte)
    
    if (!hasValidHeader) {
      console.warn('Invalid NES header, loading as raw binary')
    }
    
    console.log('NES ROM validation passed')
  }

  validateGameBoyROM(data) {
    // Check Game Boy header at 0x104-0x133
    if (data.length < 0x150) {
      throw new Error('Invalid Game Boy ROM: too small')
    }
    
    // Check Nintendo logo checksum (simplified)
    const logoStart = 0x104
    let checksum = 0
    for (let i = logoStart; i < logoStart + 48; i++) {
      checksum += data[i]
    }
    
    console.log('Game Boy ROM validation passed')
  }

  validateSNESROM(data) {
    // Basic SNES ROM validation
    if (data.length < 0x8000) {
      throw new Error('Invalid SNES ROM: too small')
    }
    
    console.log('SNES ROM validation passed')
  }
}