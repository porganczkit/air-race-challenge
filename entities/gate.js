// Gate entity
// This will handle the gate obstacles and their collision detection 

import * as THREE from 'three';

class Gate {
  constructor(id, position, rotation = { x: 0, y: 0, z: 0 }) {
    this.id = id;
    this.position = position;
    this.rotation = rotation;
    this.isPassed = false;
    this.isMissed = false;
    this.isTarget = false;
    
    // Create a group to hold all gate parts
    this.object = new THREE.Group();
    
    // Set position and rotation
    this.object.position.set(position.x, position.y, position.z);
    this.object.rotation.set(rotation.x, rotation.y, rotation.z);
    
    // Create the gate mesh
    this.createGateMesh();
    
    // Create bounding box for collision detection
    this.createBoundingBox();
  }
  
  createGateMesh() {
    // Gate dimensions
    const gateRadius = 5; // Gate radius
    const gateThickness = 0.5; // Wall thickness
    const gateDepth = 2; // Depth/length of the gate
    
    // Create a tube/torus for the gate
    const orangeColor = 0xFF7F00; // Bright orange color
    const gateMaterial = new THREE.MeshStandardMaterial({ 
      color: orangeColor,
      roughness: 0.7,
      metalness: 0.3,
      emissive: 0xFF4500,
      emissiveIntensity: 0.3 // Slight glow
    });
    
    // Create outer ring
    const outerRingGeometry = new THREE.TorusGeometry(gateRadius, gateThickness, 16, 32);
    const outerRing = new THREE.Mesh(outerRingGeometry, gateMaterial);
    this.object.add(outerRing);
    
    // Add a second ring for depth
    const innerRingGeometry = new THREE.TorusGeometry(gateRadius, gateThickness, 16, 32);
    const innerRing = new THREE.Mesh(innerRingGeometry, gateMaterial);
    innerRing.position.z = gateDepth;
    this.object.add(innerRing);
    
    // Connect the rings with cylinders to form a tube
    const connectorCount = 8; // Number of connectors around the ring
    
    for (let i = 0; i < connectorCount; i++) {
      const angle = (i / connectorCount) * Math.PI * 2;
      const x = gateRadius * Math.cos(angle);
      const y = gateRadius * Math.sin(angle);
      
      const connectorGeometry = new THREE.CylinderGeometry(gateThickness, gateThickness, gateDepth, 8);
      const connector = new THREE.Mesh(connectorGeometry, gateMaterial);
      
      // Position and rotate the connector
      connector.position.set(x, y, gateDepth / 2);
      connector.rotation.x = Math.PI / 2;
      
      this.object.add(connector);
    }
    
    // Add a number label to identify the gate
    this.createGateNumber();
    
    // Enable shadows
    this.object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }
  
  createGateNumber() {
    // Create a platform for the number
    const platformGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.2);
    const platformMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    
    // Position the platform above the gate
    platform.position.y = 6;
    
    this.object.add(platform);
    
    // Create number texture
    const textureLoader = new THREE.TextureLoader();
    const gateNumber = this.id + 1; // Gate numbers start from 1
    
    // Use a basic texture with just a color for fallback
    const basicMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF7F00,
      side: THREE.DoubleSide
    });
    
    // Create number plane
    const numberGeometry = new THREE.PlaneGeometry(1.4, 1.4);
    const numberMesh = new THREE.Mesh(numberGeometry, basicMaterial);
    
    // Position number
    numberMesh.position.y = 6;
    numberMesh.position.z = 0.11;
    
    // Function to create a data URL for the number
    const createNumberTexture = (number, callback) => {
      // Create a canvas in memory
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      
      const context = canvas.getContext('2d');
      
      // Fill with black background
      context.fillStyle = '#000000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the number
      context.font = 'Bold 80px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = '#FF7F00'; // Orange color
      context.fillText(number, canvas.width / 2, canvas.height / 2);
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      callback(texture);
    };
    
    // Attempt to create the number texture
    try {
      createNumberTexture(gateNumber, (texture) => {
        numberMesh.material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide
        });
      });
    } catch (error) {
      console.warn('Failed to create gate number texture:', error);
      // Fallback to using the basic material
    }
    
    this.object.add(numberMesh);
    
    // Add a duplicate on the back side
    const backNumberMesh = numberMesh.clone();
    backNumberMesh.position.z = -0.11;
    backNumberMesh.rotation.y = Math.PI;
    this.object.add(backNumberMesh);
  }
  
  createBoundingBox() {
    // Create an invisible box for collision detection
    const gateRadius = 5;
    const gateDepth = 2;
    
    // Create a slightly larger box than the visible gate
    const boxGeometry = new THREE.BoxGeometry(gateRadius * 2, gateRadius * 2, gateDepth);
    const boxMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF0000,
      transparent: true,
      opacity: 0.0, // Invisible in game
      wireframe: false
    });
    
    this.collisionBox = new THREE.Mesh(boxGeometry, boxMaterial);
    this.object.add(this.collisionBox);
    
    // Create entry and exit detection planes
    const planeGeometry = new THREE.PlaneGeometry(gateRadius * 2, gateRadius * 2);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00FF00,
      transparent: true,
      opacity: 0.0, // Invisible in game
      side: THREE.DoubleSide
    });
    
    // Entry plane (front)
    this.entryPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.entryPlane.position.z = -0.5;
    this.object.add(this.entryPlane);
    
    // Exit plane (back)
    this.exitPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.exitPlane.position.z = gateDepth + 0.5;
    this.object.add(this.exitPlane);
  }
  
  setPassed() {
    // Change appearance when gate is passed
    this.isPassed = true;
    this.isTarget = false;
    
    // Change color to green
    this.object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material.color) {
        if (child.material.emissive) {
          child.material.emissive.set(0x00FF00); // Green glow
          child.material.emissiveIntensity = 0.5;
        }
        if (!child.material.map) { // Don't change texture-mapped materials
          child.material.color.set(0x00FF00); // Green
        }
      }
    });
    
    // Optionally add particle effect here
  }
  
  setMissed() {
    // Change appearance when gate is missed
    this.isMissed = true;
    this.isTarget = false;
    
    // Change color to red and then to gray
    this.object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material.color) {
        if (child.material.emissive) {
          child.material.emissive.set(0xFF0000); // Red glow
          child.material.emissiveIntensity = 0.8;
        }
        if (!child.material.map) { // Don't change texture-mapped materials
          child.material.color.set(0xFF0000); // Red
        }
      }
    });
    
    // After a short delay, fade to gray
    setTimeout(() => {
      this.object.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material.color) {
          if (child.material.emissive) {
            child.material.emissive.set(0x444444); // Gray glow
            child.material.emissiveIntensity = 0.2;
          }
          if (!child.material.map) { // Don't change texture-mapped materials
            child.material.color.set(0x888888); // Gray
          }
          if (child.material.transparent === false) {
            child.material.transparent = true;
          }
          child.material.opacity = 0.5; // Semi-transparent
        }
      });
    }, 1000);
  }
  
  setTarget() {
    // Highlight as the current target gate
    this.isTarget = true;
    
    // Change color to bright orange with glow
    this.object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material.color) {
        if (child.material.emissive) {
          child.material.emissive.set(0xFF8C00); // Orange glow
          child.material.emissiveIntensity = 0.6;
        }
        if (!child.material.map) { // Don't change texture-mapped materials
          child.material.color.set(0xFF8C00); // Bright orange
        }
      }
    });
    
    // Create pulsing effect
    this.startPulseEffect();
  }
  
  startPulseEffect() {
    // Store original scale
    this.originalScale = this.object.scale.clone();
    
    // Set pulsing flag
    this.isPulsing = true;
  }
  
  updatePulseEffect(time) {
    if (!this.isPulsing || !this.isTarget) return;
    
    // Subtle pulse effect for the target gate
    const pulseScale = 1 + Math.sin(time * 3) * 0.05;
    this.object.scale.set(
      this.originalScale.x * pulseScale,
      this.originalScale.y * pulseScale,
      this.originalScale.z
    );
  }
  
  stopPulseEffect() {
    this.isPulsing = false;
    if (this.originalScale) {
      this.object.scale.copy(this.originalScale);
    }
  }
  
  update(time) {
    if (this.isTarget) {
      this.updatePulseEffect(time);
    }
  }
  
  getObject() {
    return this.object;
  }
  
  getCollisionBox() {
    return this.collisionBox;
  }
  
  getEntryPlane() {
    return this.entryPlane;
  }
  
  getExitPlane() {
    return this.exitPlane;
  }
}

export default Gate; 
