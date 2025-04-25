// Input handler
// This will handle keyboard input for controls

class InputHandler {
  constructor() {
    // Input state
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false
    };
    
    // Listen for key events
    this.setupKeyboardEvents();
  }
  
  setupKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
      this.handleKeyDown(event);
    });
    
    document.addEventListener('keyup', (event) => {
      this.handleKeyUp(event);
    });
    
    // Prevent default behavior for arrow keys to avoid page scrolling
    document.addEventListener('keydown', (event) => {
      // Prevent default for arrow keys
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || 
          event.key === 'ArrowLeft' || event.key === 'ArrowRight' || 
          event.key === ' ') {
        event.preventDefault();
      }
    });
  }
  
  handleKeyDown(event) {
    // Update key state based on the pressed key
    switch (event.key) {
      case 'ArrowUp':
        this.keys.up = true;
        break;
      case 'ArrowDown':
        this.keys.down = true;
        break;
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case ' ': // Space bar
        this.keys.space = true;
        break;
    }
  }
  
  handleKeyUp(event) {
    // Update key state based on the released key
    switch (event.key) {
      case 'ArrowUp':
        this.keys.up = false;
        break;
      case 'ArrowDown':
        this.keys.down = false;
        break;
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case ' ': // Space bar
        this.keys.space = false;
        break;
    }
  }
  
  getInputState() {
    // Return a copy of the current input state
    return { ...this.keys };
  }
}

export default InputHandler; 