// Input Handler - Manages keyboard and mouse inputs
class InputHandler {
  constructor() {
    // Input state object
    this.inputState = {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false,
      shift: false,
      keys: {} // For other key states
    };
    
    // Timing for double-tap detection
    this.lastKeyTimes = {};
    this.doubleTapThreshold = 300; // ms
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Mouse events for camera control
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Touch events for mobile
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // Prevent context menu on right-click
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }
  
  handleKeyDown(event) {
    // Store the state of this key
    this.inputState.keys[event.code] = true;
    
    // Handle arrow keys for flying controls
    switch (event.code) {
      case 'ArrowUp':
        this.inputState.up = true;
        break;
      case 'ArrowDown':
        this.inputState.down = true;
        break;
      case 'ArrowLeft':
        this.inputState.left = true;
        break;
      case 'ArrowRight':
        this.inputState.right = true;
        break;
      case 'Space':
        this.inputState.space = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.inputState.shift = true;
        break;
    }
    
    // Check for double-tap (useful for special maneuvers)
    const now = Date.now();
    if (this.lastKeyTimes[event.code]) {
      const timeDiff = now - this.lastKeyTimes[event.code];
      if (timeDiff < this.doubleTapThreshold) {
        // Double tap detected
        this.handleDoubleTap(event.code);
      }
    }
    this.lastKeyTimes[event.code] = now;
    
    // Prevent default action for game controls to avoid scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  }
  
  handleKeyUp(event) {
    // Update key state
    this.inputState.keys[event.code] = false;
    
    // Handle arrow keys for flying controls
    switch (event.code) {
      case 'ArrowUp':
        this.inputState.up = false;
        break;
      case 'ArrowDown':
        this.inputState.down = false;
        break;
      case 'ArrowLeft':
        this.inputState.left = false;
        break;
      case 'ArrowRight':
        this.inputState.right = false;
        break;
      case 'Space':
        this.inputState.space = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.inputState.shift = false;
        break;
    }
  }
  
  handleDoubleTap(keyCode) {
    // Could trigger special aircraft maneuvers
    // For example, double-tap up for loop, double-tap space for barrel roll
    console.log(`Double-tap detected: ${keyCode}`);
    
    // Custom events could be triggered here
    const event = new CustomEvent('doubletap', { detail: { key: keyCode } });
    document.dispatchEvent(event);
  }
  
  handleMouseMove(event) {
    this.inputState.mouseX = event.clientX;
    this.inputState.mouseY = event.clientY;
    
    // Calculate normalized coordinates (-1 to 1)
    this.inputState.normalizedMouseX = (event.clientX / window.innerWidth) * 2 - 1;
    this.inputState.normalizedMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  
  handleMouseDown(event) {
    this.inputState.mouseDown = true;
    this.inputState.mouseButton = event.button;
  }
  
  handleMouseUp(event) {
    this.inputState.mouseDown = false;
  }
  
  handleTouchStart(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.inputState.touchX = touch.clientX;
      this.inputState.touchY = touch.clientY;
      this.inputState.touching = true;
      
      // Handle touch zones for mobile controls
      this.handleTouchZones(touch.clientX, touch.clientY);
    }
    
    // Prevent default to avoid scrolling
    event.preventDefault();
  }
  
  handleTouchMove(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.inputState.touchX = touch.clientX;
      this.inputState.touchY = touch.clientY;
      
      // Update touch zones
      this.handleTouchZones(touch.clientX, touch.clientY);
    }
    
    // Prevent default to avoid scrolling
    event.preventDefault();
  }
  
  handleTouchEnd(event) {
    this.inputState.touching = false;
    
    // Reset touch-based controls
    this.inputState.up = false;
    this.inputState.down = false;
    this.inputState.left = false;
    this.inputState.right = false;
    
    // Prevent default
    event.preventDefault();
  }
  
  handleTouchZones(x, y) {
    // Simple touch zones for mobile controls
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Left side: directional controls
    if (x < width / 2) {
      const centerX = width / 4;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 4;
      
      // Calculate distance from center of virtual joystick
      const dx = x - centerX;
      const dy = y - centerY;
      
      // Reset directional inputs
      this.inputState.up = false;
      this.inputState.down = false;
      this.inputState.left = false;
      this.inputState.right = false;
      
      // Check if within joystick area
      if (dx * dx + dy * dy < radius * radius) {
        // Determine direction based on angle
        const angle = Math.atan2(dy, dx);
        
        // Right sector
        if (angle > -Math.PI/4 && angle < Math.PI/4) {
          this.inputState.right = true;
        }
        // Down sector
        else if (angle >= Math.PI/4 && angle < 3*Math.PI/4) {
          this.inputState.down = true;
        }
        // Left sector
        else if ((angle >= 3*Math.PI/4) || (angle < -3*Math.PI/4)) {
          this.inputState.left = true;
        }
        // Up sector
        else if (angle >= -3*Math.PI/4 && angle < -Math.PI/4) {
          this.inputState.up = true;
        }
      }
    }
    // Right side: action buttons
    else {
      // Bottom right quadrant for space/boost
      if (y > height / 2) {
        this.inputState.space = true;
      } else {
        this.inputState.space = false;
      }
    }
  }
  
  getInputState() {
    return this.inputState;
  }
}

export default InputHandler; 