export class InputHandler {
  constructor() {
    this.keys = {}
    this.gamepadState = {
      up: false,
      down: false,
      left: false,
      right: false,
      a: false,
      b: false,
      select: false,
      start: false
    }
    
    this.keyMapping = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'KeyZ': 'a',
      'KeyX': 'b',
      'Space': 'select',
      'Enter': 'start'
    }
    
    this.setupEventListeners()
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      e.preventDefault()
      this.keys[e.code] = true
      this.updateGamepadState()
    })

    document.addEventListener('keyup', (e) => {
      e.preventDefault()
      this.keys[e.code] = false
      this.updateGamepadState()
    })

    // Prevent context menu on canvas
    document.getElementById('game-canvas').addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })
  }

  updateGamepadState() {
    for (const [keyCode, button] of Object.entries(this.keyMapping)) {
      this.gamepadState[button] = !!this.keys[keyCode]
    }
  }

  getState() {
    return { ...this.gamepadState }
  }

  isPressed(button) {
    return this.gamepadState[button]
  }
}