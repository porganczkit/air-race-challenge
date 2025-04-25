// Test file to verify versions
console.log('Step 9 Testing');

// Import the aircraft to check its properties
import Aircraft from './entities/aircraft.js';

// Create a mock input handler
const mockInput = {
  getInputState: () => ({
    up: false,
    down: false,
    left: false,
    right: false,
    space: false
  })
};

// Create an aircraft instance
const aircraft = new Aircraft(mockInput);

// Log key properties to verify
console.log('Aircraft properties:');
console.log('- forwardSpeed:', aircraft.forwardSpeed);
console.log('- turnRate:', aircraft.turnRate);
console.log('- bankingTurnEffect:', aircraft.bankingTurnEffect);
console.log('- cameraDistance:', aircraft.cameraDistance);
console.log('- cameraHeight:', aircraft.cameraHeight);

// Test that the camera is updating correctly
aircraft.object.position.set(0, 10, 0);
aircraft.updateCamera();
console.log('Camera position after update:', 
  aircraft.camera.position.x,
  aircraft.camera.position.y, 
  aircraft.camera.position.z
); 