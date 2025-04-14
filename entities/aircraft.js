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
    this.forwardSpeed = 5; // Constant forward velocity
    this.velocity = new THREE.Vector3(0, 0, -this.forwardSpeed); // Forward is negative Z
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.rotationVelocity = new THREE.Vector3(0, 0, 0);
    
    // Control parameters
    this.maxPitchAngle = Math.PI / 6; // 30 degrees max pitch
    this.maxRollAngle = Math.PI / 6; // 30 degrees max roll
    this.turnRate = 1.0; // How fast the aircraft turns
    this.pitchRate = 0.8; // How fast the aircraft pitches
    this.verticalSpeed = 3.0; // Speed for ascending/descending
    this.bankIntoTurn = true; // Roll when turning
    
    // Movement smoothing
    this.smoothingFactor = 0.1; // Lower = more smoothing but slower response
    
    // Current state
    this.pitch = 0;
    this.roll = 0;
    this.yaw = 0;
    this.verticalVelocity = 0;
    
    // Create a separate camera that's not part of the aircraft group
    this.setupChaseCamera();
    
    // Rotate 180 degrees to make the propeller point in the correct direction
    this.object.rotateY(Math.PI); // 180 degrees around Y-axis
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
    
    // Create voxel-style fuselage (main body) - oriented along Z axis now
    const fuselageGeo = new THREE.BoxGeometry(0.7, 0.6, 3.5);
    const fuseMaterial = new THREE.MeshStandardMaterial({ color: lightGreen });
    const fuselage = new THREE.Mesh(fuselageGeo, fuseMaterial);
    fuselage.position.z = 0;
    this.object.add(fuselage);
    
    // Create camouflage pattern on top of fuselage
    const camoTopGeo = new THREE.BoxGeometry(0.7, 0.1, 3.5);
    const camoMaterial = new THREE.MeshStandardMaterial({ color: darkGreen });
    const camoTop = new THREE.Mesh(camoTopGeo, camoMaterial);
    camoTop.position.y = 0.35;
    this.object.add(camoTop);
    
    // Create cockpit - positioned toward front
    const cockpitGeo = new THREE.BoxGeometry(0.6, 0.5, 1.0);
    const cockpitMat = new THREE.MeshStandardMaterial({ 
      color: cockpitColor,
      transparent: true,
      opacity: 0.7
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.y = 0.45;
    cockpit.position.z = -0.5; // Toward front (negative Z)
    this.object.add(cockpit);
    
    // Create main wings - perpendicular to fuselage along X axis
    const wingGeo = new THREE.BoxGeometry(5.0, 0.1, 1.5);
    const wingMat = new THREE.MeshStandardMaterial({ color: lightGreen });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.y = 0.1;
    this.object.add(wings);
    
    // Create wing camouflage pattern
    const wingCamoGeo = new THREE.BoxGeometry(5.0, 0.05, 1.5);
    const wingCamoMat = new THREE.MeshStandardMaterial({ color: darkGreen });
    const wingCamo = new THREE.Mesh(wingCamoGeo, wingCamoMat);
    wingCamo.position.y = 0.13;
    this.object.add(wingCamo);
    
    // Create RAF roundels on wings
    this.createRoundel(1.8, 0.16, 0, 0.7); // Right wing
    this.createRoundel(-1.8, 0.16, 0, 0.7); // Left wing
    
    // Create tail - at back of fuselage (positive Z)
    const tailGeo = new THREE.BoxGeometry(0.7, 0.2, 1.2);
    const tailMat = new THREE.MeshStandardMaterial({ color: lightGreen });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.z = 1.5; // At the back (positive Z)
    this.object.add(tail);
    
    // Create tail wings
    const tailWingGeo = new THREE.BoxGeometry(1.5, 0.1, 0.8);
    const tailWingMat = new THREE.MeshStandardMaterial({ color: lightGreen });
    const tailWing = new THREE.Mesh(tailWingGeo, tailWingMat);
    tailWing.position.z = 1.5; // At the back
    tailWing.position.y = 0;
    this.object.add(tailWing);
    
    // Create vertical stabilizer - at the top back
    const vStabGeo = new THREE.BoxGeometry(0.1, 0.8, 0.8);
    const vStabMat = new THREE.MeshStandardMaterial({ color: lightGreen });
    const vStab = new THREE.Mesh(vStabGeo, vStabMat);
    vStab.position.z = 1.5; // At the back
    vStab.position.y = 0.5; // On top
    this.object.add(vStab);
    
    // Create tail vertical camo
    const tailCamoGeo = new THREE.BoxGeometry(0.05, 0.8, 0.8);
    const tailCamoMat = new THREE.MeshStandardMaterial({ color: darkGreen });
    const tailCamo = new THREE.Mesh(tailCamoGeo, tailCamoMat);
    tailCamo.position.z = 1.5; // At the back
    tailCamo.position.y = 0.5; // On top
    tailCamo.position.x = 0.03; // Slightly offset
    this.object.add(tailCamo);
    
    // Create propeller and spinner - at the front (negative Z)
    const spinnerGeo = new THREE.ConeGeometry(0.2, 0.4, 8);
    const spinnerMat = new THREE.MeshStandardMaterial({ color: 0x303030 });
    const spinner = new THREE.Mesh(spinnerGeo, spinnerMat);
    spinner.position.z = -1.8; // At the front (negative Z)
    spinner.rotation.x = -Math.PI / 2; // Point forward
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
    
    this.propeller.position.z = -2.0; // At the front (negative Z)
    this.object.add(this.propeller);
    
    // Add landing gear
    const gearLegGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
    const gearLegMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    const leftGear = new THREE.Mesh(gearLegGeo, gearLegMat);
    leftGear.position.y = -0.4;
    leftGear.position.x = 1.0;
    leftGear.position.z = -0.5;
    this.object.add(leftGear);
    
    const rightGear = new THREE.Mesh(gearLegGeo, gearLegMat);
    rightGear.position.y = -0.4;
    rightGear.position.x = -1.0;
    rightGear.position.z = -0.5;
    this.object.add(rightGear);
    
    const rearGear = new THREE.Mesh(gearLegGeo, gearLegMat);
    rearGear.position.y = -0.3;
    rearGear.position.z = 1.5;
    rearGear.scale.y = 0.5;
    this.object.add(rearGear);
  }
  
  createRoundel(x, y, z, size) {
    // Create RAF roundel (blue circle with red center and yellow ring)
    const blueCircleGeo = new THREE.BoxGeometry(size, 0.05, size);
    const blueCircleMat = new THREE.MeshStandardMaterial({ color: 0x1E3F66 });
    const blueCircle = new THREE.Mesh(blueCircleGeo, blueCircleMat);
    blueCircle.position.set(x, y, z);
    this.object.add(blueCircle);
    
    // Yellow ring
    const yellowRingGeo = new THREE.BoxGeometry(size * 0.8, 0.06, size * 0.8);
    const yellowRingMat = new THREE.MeshStandardMaterial({ color: 0xFFA500 });
    const yellowRing = new THREE.Mesh(yellowRingGeo, yellowRingMat);
    yellowRing.position.set(x, y + 0.01, z);
    this.object.add(yellowRing);
    
    // Red center
    const redCenterGeo = new THREE.BoxGeometry(size * 0.4, 0.07, size * 0.4);
    const redCenterMat = new THREE.MeshStandardMaterial({ color: 0xB22222 });
    const redCenter = new THREE.Mesh(redCenterGeo, redCenterMat);
    redCenter.position.set(x, y + 0.02, z);
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
    
    // Set fixed camera position behind and above aircraft
    this.cameraOffset = new THREE.Vector3(0, 3.5, 15); // Directly behind, more distance
    
    // Camera is NOT added to the aircraft group, so it can be positioned independently
  }
  
  updateCamera() {
    // Get the aircraft's current position and orientation
    const position = this.object.position.clone();
    const direction = this.velocity.clone().normalize();
    
    // Calculate camera position based on aircraft's position and direction
    // This positions the camera at a fixed distance behind the aircraft
    const cameraPosition = position.clone().sub(direction.multiplyScalar(this.cameraOffset.z));
    cameraPosition.y = position.y + this.cameraOffset.y; // Add height offset
    
    this.camera.position.copy(cameraPosition);
    
    // Look at the aircraft
    this.camera.lookAt(position);
  }
  
  handleControls(deltaTime) {
    // Only process controls if we have an input handler
    if (!this.inputHandler) return;
    
    // Get current input state
    const input = this.inputHandler.getInputState();
    
    // Calculate target pitch, roll, yaw and vertical velocity based on input
    let targetPitch = 0;
    let targetRoll = 0;
    let targetYaw = 0;
    let targetVerticalVelocity = 0;
    
    // Process vertical movement - UP arrow should ascend, DOWN arrow should descend
    if (input.ArrowUp) {
      targetPitch = -this.pitchRate * 0.5; // Visual nose up
      targetVerticalVelocity = this.verticalSpeed; // Move UP (positive Y)
    } else if (input.ArrowDown) {
      targetPitch = this.pitchRate * 0.5; // Visual nose down
      targetVerticalVelocity = -this.verticalSpeed; // Move DOWN (negative Y)
    }
    
    // Process horizontal movement - LEFT arrow should turn left, RIGHT arrow should turn right
    if (input.ArrowLeft) {
      targetYaw = -this.turnRate; // Turn LEFT (negative yaw)
      if (this.bankIntoTurn) {
        targetRoll = this.maxRollAngle; // Bank into left turn
      }
    } else if (input.ArrowRight) {
      targetYaw = this.turnRate; // Turn RIGHT (positive yaw)
      if (this.bankIntoTurn) {
        targetRoll = -this.maxRollAngle; // Bank into right turn
      }
    }
    
    // Apply smoothing to control inputs
    this.pitch += (targetPitch - this.pitch) * this.smoothingFactor * deltaTime * 60;
    this.roll += (targetRoll - this.roll) * this.smoothingFactor * deltaTime * 60;
    this.yaw += (targetYaw - this.yaw) * this.smoothingFactor * deltaTime * 60;
    this.verticalVelocity += (targetVerticalVelocity - this.verticalVelocity) * this.smoothingFactor * deltaTime * 60;
    
    // Clamp values to prevent extreme angles
    this.pitch = Math.max(-this.maxPitchAngle, Math.min(this.maxPitchAngle, this.pitch));
    this.roll = Math.max(-this.maxRollAngle, Math.min(this.maxRollAngle, this.roll));
  }
  
  updatePhysics(deltaTime) {
    // Create a rotation matrix for the yaw (turning)
    // IMPORTANT: Apply negative yaw to match the control directions
    const yawMatrix = new THREE.Matrix4().makeRotationY(-this.yaw * deltaTime);
    
    // Apply the yaw rotation to the velocity vector
    this.velocity.applyMatrix4(yawMatrix);
    
    // Normalize the velocity and scale it to maintain constant forward speed
    this.velocity.normalize().multiplyScalar(this.forwardSpeed);
    
    // Create a movement vector combining forward velocity and vertical movement
    const movement = this.velocity.clone().multiplyScalar(deltaTime);
    
    // Apply vertical velocity separately
    movement.y = this.verticalVelocity * deltaTime;
    
    // Apply the combined movement to the position
    this.object.position.add(movement);
    
    // Calculate the direction facing away from velocity (for correct orientation)
    const horizontalDirection = new THREE.Vector3(this.velocity.x, 0, this.velocity.z).normalize();
    
    // IMPORTANT: Keep direction inverted to maintain correct orientation with propeller facing forward
    horizontalDirection.multiplyScalar(-1);
    
    const lookAt = this.object.position.clone().add(horizontalDirection);
    
    // Maintain the current Y position when looking at the target
    lookAt.y = this.object.position.y;
    this.object.lookAt(lookAt);
    
    // Apply roll and pitch on top of the direction
    this.object.rotateX(this.pitch);
    this.object.rotateZ(this.roll);
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