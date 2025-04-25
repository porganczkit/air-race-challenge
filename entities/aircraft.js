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
    this.maxPitchAngle = Math.PI / 4; // 45 degrees max pitch (increased from 30)
    this.maxRollAngle = Math.PI / 6; // 30 degrees max roll
    this.turnRate = 2.0; // Increased turn rate for more responsive turning
    this.pitchRate = 0.8; // How fast the aircraft pitches
    this.verticalSpeed = 3.0; // Speed for ascending/descending
    this.bankIntoTurn = true; // Roll when turning
    
    // Physics parameters
    this.mass = 1.0; // Aircraft mass for inertia calculations
    this.drag = 0.2; // Air resistance
    this.inertia = 0.8; // How much momentum the aircraft maintains
    
    // Movement smoothing
    this.smoothingFactor = 0.1; // Lower = more smoothing but slower response
    
    // Current state
    this.pitch = 0;
    this.roll = 0;
    this.yaw = 0;
    this.verticalVelocity = 0;
    this.angularMomentum = new THREE.Vector3(0, 0, 0); // Stores rotational momentum
    
    // Create a separate camera that's not part of the aircraft group
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
    
    // Create voxel-style fuselage (main body) - oriented along Z axis
    // IMPORTANT: Fuselage is built with propeller at front (negative Z)
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
    this.createRoundel(-1.8, 0.16, 0, 0.7); // Left wing
    this.createRoundel(1.8, 0.16, 0, 0.7); // Right wing
    
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
    spinner.rotation.x = -Math.PI / 2; // Point forward along negative Z
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
    leftGear.position.x = -1.0;
    leftGear.position.z = -0.5;
    this.object.add(leftGear);
    
    const rightGear = new THREE.Mesh(gearLegGeo, gearLegMat);
    rightGear.position.y = -0.4;
    rightGear.position.x = 1.0;
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
      targetPitch = -this.pitchRate * 0.5; // Visual nose up (negative pitch tilts nose up)
      targetVerticalVelocity = this.verticalSpeed; // Move UP (positive Y)
    } else if (input.ArrowDown) {
      targetPitch = this.pitchRate * 0.5; // Visual nose down (positive pitch tilts nose down)
      targetVerticalVelocity = -this.verticalSpeed; // Move DOWN (negative Y)
    }
    
    // Process horizontal movement - LEFT arrow should turn left, RIGHT arrow should turn right
    if (input.ArrowLeft) {
      targetYaw = -this.turnRate * 2; // Turn LEFT (negative yaw)
      if (this.bankIntoTurn) {
        targetRoll = this.maxRollAngle; // Bank into left turn
      }
    } else if (input.ArrowRight) {
      targetYaw = this.turnRate * 2; // Turn RIGHT (positive yaw)
      if (this.bankIntoTurn) {
        targetRoll = -this.maxRollAngle; // Bank into right turn
      }
    }
    
    // Apply more direct control for immediate response
    this.yaw += targetYaw * deltaTime * 0.5; // Direct control component
    
    // Apply inertia to controls - aircraft responds more realistically
    // First calculate force based on input and aircraft mass
    const pitchForce = targetPitch / this.mass;
    const rollForce = targetRoll / this.mass;
    const yawForce = targetYaw / (this.mass * 0.5); // Reduced mass effect for more responsive turning
    
    // Update angular momentum based on forces and delta time
    this.angularMomentum.x += pitchForce * deltaTime;
    this.angularMomentum.z += rollForce * deltaTime;
    this.angularMomentum.y += yawForce * deltaTime;
    
    // Apply drag to angular momentum (air resistance)
    this.angularMomentum.x *= (1 - this.drag * deltaTime);
    this.angularMomentum.z *= (1 - this.drag * deltaTime);
    this.angularMomentum.y *= (1 - this.drag * deltaTime);
    
    // Update actual pitch, roll, yaw based on angular momentum
    this.pitch = this.angularMomentum.x;
    this.roll = this.angularMomentum.z;
    this.yaw += this.angularMomentum.y * deltaTime;
    
    // Apply smoothing to vertical velocity
    const verticalForce = (targetVerticalVelocity - this.verticalVelocity);
    this.verticalVelocity += verticalForce * this.smoothingFactor * deltaTime * 10;
    
    // Apply drag to vertical velocity
    if (Math.abs(this.verticalVelocity) > 0.01) {
      this.verticalVelocity *= (1 - this.drag * deltaTime);
    } else {
      this.verticalVelocity = 0; // Stop completely when very small
    }
    
    // Clamp values to prevent extreme angles
    this.pitch = Math.max(-this.maxPitchAngle, Math.min(this.maxPitchAngle, this.pitch));
    this.roll = Math.max(-this.maxRollAngle, Math.min(this.maxRollAngle, this.roll));
    
    // Limit extreme maneuvers - reduce control effectiveness at high speeds or during extreme angles
    // This prevents unrealistic flight patterns
    const extremeManeuverFactor = Math.min(
      1.0,
      1.0 - (Math.abs(this.pitch) / this.maxPitchAngle) * 0.3 - 
            (Math.abs(this.roll) / this.maxRollAngle) * 0.3
    );
    
    // Apply the limit factor to controls
    this.yaw *= extremeManeuverFactor;
  }
  
  updatePhysics(deltaTime) {
    // Create a rotation matrix for the yaw (turning)
    const yawMatrix = new THREE.Matrix4().makeRotationY(-this.yaw * deltaTime); // Inverted to match control directions
    
    // Apply the yaw rotation to the velocity vector
    this.velocity.applyMatrix4(yawMatrix);
    
    // Apply drag to forward speed (slight air resistance)
    this.forwardSpeed *= (1 - this.drag * 0.1 * deltaTime);
    
    // Ensure minimum forward speed is maintained (aircraft cannot stop mid-air)
    this.forwardSpeed = Math.max(4.0, this.forwardSpeed);
    
    // Normalize the velocity and scale it to current forward speed
    this.velocity.normalize().multiplyScalar(this.forwardSpeed);
    
    // Create a movement vector combining forward velocity and vertical movement
    const movement = this.velocity.clone().multiplyScalar(deltaTime);
    
    // Apply vertical velocity separately
    movement.y = this.verticalVelocity * deltaTime;
    
    // Apply the combined movement to the position
    this.object.position.add(movement);
    
    // Reset object rotation to identity before applying new rotations
    // This prevents cumulative rotation issues
    this.object.rotation.set(0, 0, 0);
    
    // Get the direction of travel
    const direction = this.velocity.clone().normalize();
    
    // Align the aircraft to face the direction of travel
    // By default, the aircraft is built facing the negative Z axis
    // We want the aircraft to face the velocity direction
    const quaternion = new THREE.Quaternion();
    
    // Compute rotation to align negative Z (aircraft front) with velocity
    const negativeZAxis = new THREE.Vector3(0, 0, -1);
    quaternion.setFromUnitVectors(negativeZAxis, direction);
    
    // Apply the rotation to the aircraft
    this.object.setRotationFromQuaternion(quaternion);
    
    // Apply pitch as a rotation around the local X axis
    this.object.rotateX(-this.pitch); // Invert pitch to fix direction (negative pitch for nose up)
    
    // Apply roll as a rotation around the local Z axis
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