// Aircraft entity
// This will handle the player's aircraft model, physics, and controls 

import * as THREE from 'three';

class Aircraft {
  constructor() {
    // Create a group to hold all aircraft parts
    this.object = new THREE.Group();
    
    // Create aircraft parts
    this.createAircraftMesh();
    
    // Set initial position
    this.object.position.set(0, 0, 0);
    
    // Physics properties (will be used in later steps)
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.rotationVelocity = new THREE.Vector3(0, 0, 0);
    
    // Chase camera (will follow the aircraft)
    this.setupChaseCamera();
  }
  
  createAircraftMesh() {
    // Colors
    const fuselageColor = 0x5D8AA8; // RAF Blue
    const wingColor = 0x5D8AA8;
    const propellerColor = 0x303030;
    
    // Create fuselage (main body)
    const fuselageGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
    const fuseMaterial = new THREE.MeshStandardMaterial({ color: fuselageColor });
    const fuselage = new THREE.Mesh(fuselageGeometry, fuseMaterial);
    fuselage.rotation.z = Math.PI / 2; // Rotate to point forward
    this.object.add(fuselage);
    
    // Create cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.2, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x222222,
      transparent: true,
      opacity: 0.7
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.y = 0.1;
    cockpit.rotation.x = Math.PI;
    this.object.add(cockpit);
    
    // Create wings
    const wingGeometry = new THREE.BoxGeometry(1.2, 0.05, 0.3);
    const wingMaterial = new THREE.MeshStandardMaterial({ color: wingColor });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    this.object.add(wings);
    
    // Create tail
    const tailGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.2);
    const tailMaterial = new THREE.MeshStandardMaterial({ color: wingColor });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.x = -0.6;
    this.object.add(tail);
    
    // Create vertical stabilizer
    const stabilizerGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.05);
    const stabilizerMaterial = new THREE.MeshStandardMaterial({ color: wingColor });
    const stabilizer = new THREE.Mesh(stabilizerGeometry, stabilizerMaterial);
    stabilizer.position.x = -0.6;
    stabilizer.position.y = 0.1;
    this.object.add(stabilizer);
    
    // Create propeller
    const propellerGeometry = new THREE.BoxGeometry(0.05, 0.5, 0.05);
    const propellerMaterial = new THREE.MeshStandardMaterial({ color: propellerColor });
    this.propeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
    this.propeller.position.x = 0.8;
    this.object.add(this.propeller);
    
    // Point aircraft forward (along negative Z-axis)
    this.object.rotation.y = Math.PI;
  }
  
  setupChaseCamera() {
    // Create a chase camera
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    // Set initial camera position behind and above aircraft
    this.cameraOffset = new THREE.Vector3(0, 3, 10);
    this.updateCamera();
    
    // Add camera to the aircraft group so it moves with the aircraft
    // (We'll detach it later, this is just for structure)
    this.object.add(this.camera);
  }
  
  updateCamera() {
    // Position camera relative to aircraft position
    this.camera.position.copy(this.object.position).add(this.cameraOffset);
    
    // Look at the aircraft
    this.camera.lookAt(this.object.position);
  }
  
  update(deltaTime) {
    // Rotate propeller for visual effect
    if (this.propeller) {
      this.propeller.rotation.x += deltaTime * 10;
    }
    
    // In future steps, we'll implement physics and controls here
    
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