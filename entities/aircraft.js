// Aircraft entity
// This will handle the player's aircraft model, physics, and controls 

import * as THREE from 'three';

class Aircraft {
  constructor(inputHandler) {
    // Create a group to hold all aircraft parts
    this.object = new THREE.Group();
    
    // Store reference to input handler
    this.inputHandler = inputHandler;
    
    // Create aircraft parts
    this.createAircraftMesh();
    
    // Set initial position
    this.object.position.set(0, 0, 0);
    
    // Physics properties
    this.velocity = new THREE.Vector3(0, 0, -5); // Constant forward velocity
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.rotationVelocity = new THREE.Vector3(0, 0, 0);
    
    // Control parameters
    this.maxPitchAngle = Math.PI / 4; // 45 degrees max pitch
    this.maxRollAngle = Math.PI / 6; // 30 degrees max roll
    this.turnRate = 1.0; // How fast the aircraft turns
    this.pitchRate = 1.2; // How fast the aircraft pitches
    this.bankIntoTurn = true; // Roll when turning
    
    // Movement smoothing
    this.smoothingFactor = 0.1; // Lower = more smoothing but slower response
    
    // Current state
    this.pitch = 0;
    this.roll = 0;
    this.yaw = 0;
    
    // Chase camera (will follow the aircraft)
    this.setupChaseCamera();
  }
  
  createAircraftMesh() {
    // Colors based on RAF Spitfire camouflage pattern
    const darkGreen = 0x4C5B31; // Dark green camouflage
    const lightGreen = 0x6B8E23; // Olive green camouflage
    const brownColor = 0x8B4513; // Brown camouflage
    const blueCircle = 0x1E3F66; // RAF roundel blue
    const redCenter = 0xB22222; // RAF roundel center
    const yellowRing = 0xFFA500; // Yellow ring around roundel
    const propellerColor = 0x303030; // Dark grey for propeller
    const cockpitColor = 0x87CEEB; // Light blue for cockpit glass
    
    // Create voxel-style fuselage (main body)
    const fuselageGeo = new THREE.BoxGeometry(3, 0.6, 0.8);
    const fuseMaterial = new THREE.MeshStandardMaterial({ color: lightGreen });
    const fuselage = new THREE.Mesh(fuselageGeo, fuseMaterial);
    fuselage.position.z = 0;
    this.object.add(fuselage);
    
    // Create camouflage pattern on top of fuselage
    const camoTopGeo = new THREE.BoxGeometry(3, 0.1, 0.8);
    const camoMaterial = new THREE.MeshStandardMaterial({ color: darkGreen });
    const camoTop = new THREE.Mesh(camoTopGeo, camoMaterial);
    camoTop.position.y = 0.35;
    this.object.add(camoTop);
    
    // Create brown stripe down the middle of fuselage
    const brownStripeGeo = new THREE.BoxGeometry(3, 0.1, 0.2);
    const brownMaterial = new THREE.MeshStandardMaterial({ color: brownColor });
    const brownStripe = new THREE.Mesh(brownStripeGeo, brownMaterial);
    brownStripe.position.y = 0.35;
    this.object.add(brownStripe);
    
    // Create nose section
    const noseGeo = new THREE.BoxGeometry(0.6, 0.6, 0.8);
    const noseMat = new THREE.MeshStandardMaterial({ color: brownColor });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.z = 0;
    nose.position.x = 1.7;
    this.object.add(nose);
    
    // Create cockpit
    const cockpitGeo = new THREE.BoxGeometry(0.8, 0.4, 0.6);
    const cockpitMat = new THREE.MeshStandardMaterial({ 
      color: cockpitColor,
      transparent: true,
      opacity: 0.7
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.y = 0.5;
    cockpit.position.x = 0.3;
    this.object.add(cockpit);
    
    // Create main wings
    const wingGeo = new THREE.BoxGeometry(1.6, 0.2, 4);
    const wingMat = new THREE.MeshStandardMaterial({ color: lightGreen });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.y = -0.1;
    this.object.add(wings);
    
    // Create wing camouflage pattern
    const wingCamoGeo = new THREE.BoxGeometry(1.6, 0.05, 4);
    const wingCamoMat = new THREE.MeshStandardMaterial({ color: darkGreen });
    const wingCamo = new THREE.Mesh(wingCamoGeo, wingCamoMat);
    wingCamo.position.y = 0.13;
    this.object.add(wingCamo);
    
    // Create wing brown patches
    const wingBrownGeo = new THREE.BoxGeometry(1.6, 0.05, 1.5);
    const wingBrownMat = new THREE.MeshStandardMaterial({ color: brownColor });
    const wingBrownLeft = new THREE.Mesh(wingBrownGeo, wingBrownMat);
    wingBrownLeft.position.y = 0.13;
    wingBrownLeft.position.z = 1;
    this.object.add(wingBrownLeft);
    
    const wingBrownRight = new THREE.Mesh(wingBrownGeo, wingBrownMat);
    wingBrownRight.position.y = 0.13;
    wingBrownRight.position.z = -1;
    this.object.add(wingBrownRight);
    
    // Create tail
    const tailGeo = new THREE.BoxGeometry(1.2, 0.2, 0.8);
    const tailMat = new THREE.MeshStandardMaterial({ color: lightGreen });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.x = -1.7;
    this.object.add(tail);
    
    // Create vertical stabilizer
    const vStabGeo = new THREE.BoxGeometry(0.8, 0.6, 0.2);
    const vStabMat = new THREE.MeshStandardMaterial({ color: lightGreen });
    const vStab = new THREE.Mesh(vStabGeo, vStabMat);
    vStab.position.x = -1.7;
    vStab.position.y = 0.4;
    this.object.add(vStab);
    
    // Create tail vertical camo
    const tailCamoGeo = new THREE.BoxGeometry(0.8, 0.6, 0.05);
    const tailCamoMat = new THREE.MeshStandardMaterial({ color: darkGreen });
    const tailCamo = new THREE.Mesh(tailCamoGeo, tailCamoMat);
    tailCamo.position.x = -1.7;
    tailCamo.position.y = 0.4;
    tailCamo.position.z = 0.13;
    this.object.add(tailCamo);
    
    // Create RAF roundels on wings (3 on each wing)
    this.createRoundel(0, 0, 1.5, 0.6); // Right wing
    this.createRoundel(0, 0, -1.5, 0.6); // Left wing
    this.createRoundel(-1.5, 0.35, 0, 0.4); // Fuselage top
    
    // Create propeller and spinner
    const spinnerGeo = new THREE.ConeGeometry(0.2, 0.4, 8);
    const spinnerMat = new THREE.MeshStandardMaterial({ color: 0xE25822 }); // Orange/red spinner
    const spinner = new THREE.Mesh(spinnerGeo, spinnerMat);
    spinner.position.x = 2;
    spinner.rotation.z = -Math.PI / 2;
    this.object.add(spinner);
    
    // Create propeller blades
    const propGeo = new THREE.BoxGeometry(0.1, 0.8, 0.05);
    const propMat = new THREE.MeshStandardMaterial({ color: propellerColor });
    this.propeller = new THREE.Group();
    
    const blade1 = new THREE.Mesh(propGeo, propMat);
    const blade2 = new THREE.Mesh(propGeo, propMat);
    
    this.propeller.add(blade1);
    this.propeller.add(blade2);
    blade2.rotation.z = Math.PI / 2;
    
    this.propeller.position.x = 2.2;
    this.object.add(this.propeller);
    
    // Point aircraft forward (along negative Z-axis)
    this.object.rotation.y = Math.PI;
    
    // Add landing gear
    const gearLegGeo = new THREE.BoxGeometry(0.1, 0.6, 0.1);
    const gearLegMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    const leftGear = new THREE.Mesh(gearLegGeo, gearLegMat);
    leftGear.position.y = -0.5;
    leftGear.position.z = 1;
    leftGear.position.x = 0.5;
    this.object.add(leftGear);
    
    const rightGear = new THREE.Mesh(gearLegGeo, gearLegMat);
    rightGear.position.y = -0.5;
    rightGear.position.z = -1;
    rightGear.position.x = 0.5;
    this.object.add(rightGear);
    
    const rearGear = new THREE.Mesh(gearLegGeo, gearLegMat);
    rearGear.position.y = -0.3;
    rearGear.position.x = -1.5;
    rearGear.scale.y = 0.5;
    this.object.add(rearGear);
  }
  
  createRoundel(x, y, z, size) {
    // Create RAF roundel (blue circle with red center and yellow ring)
    const blueCircleGeo = new THREE.BoxGeometry(size, 0.05, size);
    const blueCircleMat = new THREE.MeshStandardMaterial({ color: 0x1E3F66 });
    const blueCircle = new THREE.Mesh(blueCircleGeo, blueCircleMat);
    blueCircle.position.set(x, y + 0.13, z);
    this.object.add(blueCircle);
    
    // Yellow ring
    const yellowRingGeo = new THREE.BoxGeometry(size * 0.8, 0.06, size * 0.8);
    const yellowRingMat = new THREE.MeshStandardMaterial({ color: 0xFFA500 });
    const yellowRing = new THREE.Mesh(yellowRingGeo, yellowRingMat);
    yellowRing.position.set(x, y + 0.14, z);
    this.object.add(yellowRing);
    
    // Red center
    const redCenterGeo = new THREE.BoxGeometry(size * 0.4, 0.07, size * 0.4);
    const redCenterMat = new THREE.MeshStandardMaterial({ color: 0xB22222 });
    const redCenter = new THREE.Mesh(redCenterGeo, redCenterMat);
    redCenter.position.set(x, y + 0.15, z);
    this.object.add(redCenter);
  }
  
  setupChaseCamera() {
    // Create a chase camera
    this.camera = new THREE.PerspectiveCamera(
      65, // FOV - wider field of view
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    // Set camera position behind, above, and slightly to the side for a more dynamic view
    this.cameraOffset = new THREE.Vector3(2, 4, 12);
    this.updateCamera();
    
    // Add camera to the aircraft group so it moves with the aircraft
    this.object.add(this.camera);
  }
  
  updateCamera() {
    // Position camera relative to aircraft position
    this.camera.position.copy(this.object.position).add(this.cameraOffset);
    
    // Look at a point slightly ahead of the aircraft for better composition
    const lookTarget = this.object.position.clone();
    lookTarget.x += 2; // Look ahead of the aircraft
    this.camera.lookAt(lookTarget);
  }
  
  handleControls(deltaTime) {
    // Only process controls if we have an input handler
    if (!this.inputHandler) return;
    
    // Get current input state
    const input = this.inputHandler.getInputState();
    
    // Calculate target pitch, roll and yaw based on input
    let targetPitch = 0;
    let targetRoll = 0;
    let targetYaw = 0;
    
    // Process vertical movement (pitch)
    if (input.ArrowUp) {
      targetPitch = -this.pitchRate; // Negative pitch = nose up
    } else if (input.ArrowDown) {
      targetPitch = this.pitchRate; // Positive pitch = nose down
    }
    
    // Process horizontal movement (yaw + roll)
    if (input.ArrowLeft) {
      targetYaw = this.turnRate;
      if (this.bankIntoTurn) {
        targetRoll = -this.maxRollAngle; // Bank into the turn
      }
    } else if (input.ArrowRight) {
      targetYaw = -this.turnRate;
      if (this.bankIntoTurn) {
        targetRoll = this.maxRollAngle; // Bank into the turn
      }
    }
    
    // Apply smoothing to control inputs
    this.pitch += (targetPitch - this.pitch) * this.smoothingFactor * deltaTime * 60;
    this.roll += (targetRoll - this.roll) * this.smoothingFactor * deltaTime * 60;
    this.yaw += (targetYaw - this.yaw) * this.smoothingFactor * deltaTime * 60;
    
    // Clamp values to prevent extreme angles
    this.pitch = Math.max(-this.maxPitchAngle, Math.min(this.maxPitchAngle, this.pitch));
    this.roll = Math.max(-this.maxRollAngle, Math.min(this.maxRollAngle, this.roll));
    
    // Apply rotations to the aircraft
    this.object.rotation.z = this.roll; // Roll (around Z axis)
    this.object.rotation.x = this.pitch; // Pitch (around X axis)
    
    // Apply yaw rotation to velocity vector (turning)
    const yawMatrix = new THREE.Matrix4().makeRotationY(this.yaw * deltaTime);
    this.velocity.applyMatrix4(yawMatrix);
    
    // Keep constant speed
    this.velocity.normalize().multiplyScalar(5);
  }
  
  updatePhysics(deltaTime) {
    // Apply velocity to position
    const movement = this.velocity.clone().multiplyScalar(deltaTime);
    this.object.position.add(movement);
    
    // Align aircraft with velocity direction (look where we're going)
    if (this.velocity.length() > 0) {
      const lookDirection = this.velocity.clone().normalize();
      this.object.lookAt(this.object.position.clone().add(lookDirection));
      
      // Preserve manual pitch and roll on top of the look direction
      this.object.rotateZ(this.roll);
      this.object.rotateX(this.pitch);
    }
  }
  
  update(deltaTime) {
    // Rotate propeller for visual effect
    if (this.propeller) {
      this.propeller.rotation.x += deltaTime * 20;
    }
    
    // Handle keyboard input
    this.handleControls(deltaTime);
    
    // Update physics
    this.updatePhysics(deltaTime);
    
    // Update camera position to follow aircraft
    this.updateCamera();
  }
  
  // Gets the Three.js object for adding to the scene
  getObject() {
    return this.object;
  }
  
  // Gets the camera that follows the aircraft
  getCamera() {
    return this.camera;
  }
}

export default Aircraft; 