// Input handler for keyboard controls
class InputHandler {
  constructor() {
    // Track key states
    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false
    };
    
    // Register event listeners
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    console.log('Input handler initialized');
  }
  
  handleKeyDown(event) {
    // Update key state if it's one we're tracking
    if (this.keys.hasOwnProperty(event.key)) {
      this.keys[event.key] = true;
      // Prevent default behavior for arrow keys (page scrolling)
      event.preventDefault();
    }
  }
  
  handleKeyUp(event) {
    // Update key state if it's one we're tracking
    if (this.keys.hasOwnProperty(event.key)) {
      this.keys[event.key] = false;
      // Prevent default behavior for arrow keys
      event.preventDefault();
    }
  }
  
  // Check if a specific key is pressed
  isPressed(key) {
    return this.keys[key] === true;
  }
  
  // Get the state of all tracked keys
  getInputState() {
    return {
      ...this.keys
    };
  }
}

export default InputHandler; 