export class DisplayRenderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    
    // Set up proper pixel rendering
    this.ctx.imageSmoothingEnabled = false
    this.ctx.webkitImageSmoothingEnabled = false
    this.ctx.mozImageSmoothingEnabled = false
    this.ctx.msImageSmoothingEnabled = false
    
    // Create image data buffer for pixel-perfect rendering
    this.imageData = this.ctx.createImageData(256, 240)
    this.buffer = new Uint32Array(this.imageData.data.buffer)
    
    // Set canvas size
    this.canvas.width = 256
    this.canvas.height = 240
    
    // Apply CSS scaling for better visibility
    this.canvas.style.width = '512px'
    this.canvas.style.height = '480px'
    this.canvas.style.imageRendering = 'pixelated'
    this.canvas.style.imageRendering = 'crisp-edges'
    
    this.clear()
  }

  renderFrame(frameBuffer) {
    // Copy frame buffer to display buffer with proper endianness
    for (let i = 0; i < frameBuffer.length; i++) {
      const pixel = frameBuffer[i]
      
      // Extract RGBA components
      const r = pixel & 0xFF
      const g = (pixel >> 8) & 0xFF
      const b = (pixel >> 16) & 0xFF
      const a = (pixel >> 24) & 0xFF
      
      // Convert to little-endian ABGR format for ImageData
      this.buffer[i] = (a << 24) | (b << 16) | (g << 8) | r
    }
    
    // Render to canvas
    this.ctx.putImageData(this.imageData, 0, 0)
  }

  clear() {
    // Fill with black
    this.buffer.fill(0xFF000000)
    this.ctx.putImageData(this.imageData, 0, 0)
  }

  setPixel(x, y, color) {
    if (x >= 0 && x < 256 && y >= 0 && y < 240) {
      const index = y * 256 + x
      this.buffer[index] = color
    }
  }

  getPixel(x, y) {
    if (x >= 0 && x < 256 && y >= 0 && y < 240) {
      const index = y * 256 + x
      return this.buffer[index]
    }
    return 0
  }
}