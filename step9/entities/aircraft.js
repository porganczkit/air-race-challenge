// Aircraft entity
// This will handle the player's aircraft model, physics, and controls 

import * as THREE from 'three';

class Aircraft {
  constructor(inputHandler) {
    // Movement properties
    this.maxSpeed = 50; // Changed from 52.5 to 50 as requested
    this.forwardSpeed = 30; // Changed from 35 to 30 as requested
    this.acceleration = 15; // Acceleration rate
    this.turnRate = 1.5; // Adjusted turn rate as requested
    this.pitchRate = 1.0; // Rate of pitch change
    this.rollRate = 2.0; // Rate of roll change
    this.strafeSpeed = 15; // New: Speed for lateral movement
    this.verticalSpeed = 15; // New: Speed for vertical movement
    this.maxRollAngle = Math.PI / 2.5; // Increased bank angle (about 72 degrees)
    this.maxPitchAngle = Math.PI / 4; // Maximum pitch angle (45 degrees)
    this.drag = 0.3; // Air resistance
    this.inertiaFactor = 0.85; // Amount of inertia (higher = more gradual control)
    this.bankingTurnEffect = 0.8; // Increased from 0.5 for more pronounced turning when banking
    
    // Physics state
    this.velocity = new THREE.Vector3(0, 0, 1); // Initial velocity
    this.angularVelocity = new THREE.Vector3(0, 0, 0); // Rotation momentum
    this.position = new THREE.Vector3(0, 10, 0);
    
    // Current orientation values
    this.pitch = 0;
    this.yaw = 0;
    this.roll = 0;
    
    // Target orientation values (where controls are pushing towards)
    this.targetPitch = 0;
    this.targetYaw = 0;
    this.targetRoll = 0;
    
    // Direction controls
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    
    // Camera properties
    this.cameraDistance = 15; // Distance behind aircraft
    this.cameraHeight = 5;   // Height above aircraft
    
    // Input handler reference
    this.inputHandler = inputHandler;
    
    // Create the aircraft
    this.createAircraft();
  }
  
  createAircraft() {
    // Create a group for the aircraft
    this.object = new THREE.Group();
    
    // Use a consistent material
    const mainMaterial = new THREE.MeshStandardMaterial({
      color: 0x303030, // Dark gray base color
      roughness: 0.7, 
      metalness: 0.3
    });
    
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x505050, // Slightly lighter gray for wings
      roughness: 0.6,
      metalness: 0.4
    });
    
    const propMaterial = new THREE.MeshStandardMaterial({
      color: 0x202020, // Darker for propeller
      roughness: 0.5,
      metalness: 0.6
    });
    
    const detailMaterial = new THREE.MeshStandardMaterial({
      color: 0xB0B0B0, // Light gray for details
      roughness: 0.5, 
      metalness: 0.7
    });
    
    const canopyMaterial = new THREE.MeshStandardMaterial({
      color: 0x5B9BD5, // Blue canopy
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.7
    });
    
    // Create voxel-style fuselage (main body)
    const fuselageGeometry = new THREE.BoxGeometry(1, 1, 6);
    const fuselage = new THREE.Mesh(fuselageGeometry, mainMaterial);
    this.object.add(fuselage);
    
    // Create wings
    const wingGeometry = new THREE.BoxGeometry(10, 0.2, 2);
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.set(0, 0, 0);
    this.object.add(wings);
    
    // Create tail
    const tailFinGeometry = new THREE.BoxGeometry(0.2, 1.5, 1);
    const tailFin = new THREE.Mesh(tailFinGeometry, wingMaterial);
    tailFin.position.set(0, 0.5, -3);
    this.object.add(tailFin);
    
    // Create horizontal stabilizers
    const stabilizerGeometry = new THREE.BoxGeometry(4, 0.2, 1);
    const stabilizer = new THREE.Mesh(stabilizerGeometry, wingMaterial);
    stabilizer.position.set(0, 0, -3);
    this.object.add(stabilizer);
    
    // Create propeller
    const propellerGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.2);
    this.propeller = new THREE.Mesh(propellerGeometry, propMaterial);
    this.propeller.position.set(0, 0, 3);
    this.object.add(this.propeller);
    
    // Create canopy (cockpit)
    const canopyGeometry = new THREE.BoxGeometry(0.8, 0.6, 1.2);
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.set(0, 0.5, 1);
    this.object.add(canopy);
    
    // Create engine
    const engineGeometry = new THREE.BoxGeometry(1.1, 1.1, 1.5);
    const engine = new THREE.Mesh(engineGeometry, detailMaterial);
    engine.position.set(0, 0, 2.5);
    this.object.add(engine);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, // Field of view
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    
    // Make the aircraft cast shadows
    this.object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }
  
  update(deltaTime) {
    // Handle user input
    this.handleControls(deltaTime);
    
    // Apply physics
    this.updatePhysics(deltaTime);
    
    // Update visual elements
    this.updateVisuals(deltaTime);
    
    // Update camera
    this.updateCamera();
  }
  
  handleControls(deltaTime) {
    // Only process controls if we have an input handler
    if (!this.inputHandler) return;
    
    // Reset target values
    this.targetPitch = 0;
    this.targetYaw = 0;
    this.targetRoll = 0;
    
    // Get current input state
    const input = this.inputHandler.getInputState();
    
    // Process keyboard input for rotation using arrow keys only
    if (input.up) {
      this.targetPitch = -this.pitchRate; // Negative pitch tilts nose up in Three.js
    } else if (input.down) {
      this.targetPitch = this.pitchRate; // Positive pitch tilts nose down in Three.js
    }
    
    if (input.left) {
      this.targetYaw = -this.turnRate; // Turn LEFT (negative yaw)
      this.targetRoll = -this.maxRollAngle; // Bank left
    } else if (input.right) {
      this.targetYaw = this.turnRate; // Turn RIGHT (positive yaw)
      this.targetRoll = this.maxRollAngle; // Bank right
    } else {
      // Return to level flight when not turning
      this.targetRoll = 0;
    }
    
    // Apply inertia to controls - gradual movement toward target values
    this.pitch += (this.targetPitch - this.pitch) * this.inertiaFactor * deltaTime;
    this.yaw += (this.targetYaw - this.yaw) * this.inertiaFactor * deltaTime;
    this.roll += (this.targetRoll - this.roll) * this.inertiaFactor * deltaTime * 1.5; // Faster roll response
    
    // Add some drag to slow rotation when not actively controlling
    if (Math.abs(this.targetPitch) < 0.01) this.pitch *= (1 - this.drag * deltaTime);
    if (Math.abs(this.targetYaw) < 0.01) this.yaw *= (1 - this.drag * deltaTime);
    if (Math.abs(this.targetRoll) < 0.01) this.roll *= (1 - this.drag * deltaTime);
    
    // Clamp values to prevent extreme angles
    this.pitch = Math.max(-this.maxPitchAngle, Math.min(this.maxPitchAngle, this.pitch));
    this.roll = Math.max(-this.maxRollAngle, Math.min(this.maxRollAngle, this.roll));
    
    // Limit extreme maneuvers - reduce control effectiveness at high speeds or during extreme angles
    const extremeManeuverFactor = Math.min(
      1.0,
      1.0 - (Math.abs(this.pitch) / this.maxPitchAngle) * 0.3 - 
            (Math.abs(this.roll) / this.maxRollAngle) * 0.3
    );
    
    // Apply the limit factor to controls
    this.yaw *= extremeManeuverFactor;
  }
  
  updatePhysics(deltaTime) {
    // Apply aircraft rotation based on current pitch, roll, yaw values
    this.object.rotation.x = this.pitch;
    this.object.rotation.z = this.roll;
    this.object.rotation.y += this.yaw * deltaTime; // Apply yaw to rotate aircraft left/right
    
    // Calculate forward vector based on aircraft's current orientation
    const forwardVector = new THREE.Vector3(0, 0, 1).applyQuaternion(this.object.quaternion);
    
    // Update velocity to match aircraft's forward direction at constant speed
    this.velocity.copy(forwardVector).normalize().multiplyScalar(this.forwardSpeed);
    
    // Apply velocity to position
    const movement = this.velocity.clone().multiplyScalar(deltaTime);
    this.object.position.add(movement);
    
    // Apply banking-induced turning effect
    // When aircraft banks, it naturally turns in that direction
    if (Math.abs(this.roll) > 0.05) {
      const turnEffect = -this.roll * this.bankingTurnEffect * deltaTime;
      this.object.rotateY(turnEffect);
    }
    
    // Hard limit on how low the aircraft can go (prevent going underground)
    if (this.object.position.y < 2) {
      this.object.position.y = 2;
    }
  }
  
  updateVisuals(deltaTime) {
    // Rotate propeller based on forward speed
    if (this.propeller) {
      this.propeller.rotation.z += deltaTime * 15 * (this.forwardSpeed / 10);
    }
  }
  
  updateCamera() {
    // Get the aircraft's forward and up directions
    const forwardVector = new THREE.Vector3(0, 0, 1).applyQuaternion(this.object.quaternion);
    const upVector = new THREE.Vector3(0, 1, 0).applyQuaternion(this.object.quaternion);
    
    // Calculate camera position behind the aircraft
    const cameraPosition = this.object.position.clone();
    cameraPosition.sub(forwardVector.clone().multiplyScalar(this.cameraDistance)); // Move behind
    cameraPosition.add(upVector.clone().multiplyScalar(this.cameraHeight));        // Move up
    
    // Set camera position
    this.camera.position.copy(cameraPosition);
    
    // Look at a point ahead of the aircraft (not directly at it, but forward)
    const lookPosition = this.object.position.clone().add(
      forwardVector.clone().multiplyScalar(30)  // Look 30 units ahead
    );
    
    // Make camera always look forward
    this.camera.lookAt(lookPosition);
    
    // Update aspect ratio in case of window resize
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
  
  getObject() {
    return this.object;
  }
  
  getCamera() {
    return this.camera;
  }
}

export default Aircraft; 