// Core game engine
// This will handle the main game loop and Three.js setup 

import * as THREE from 'three';
import Aircraft from '../entities/aircraft.js';
import Gate from '../entities/gate.js';
import InputHandler from '../utils/input.js';

class GameEngine {
  constructor(canvasId) {
    // Get the canvas element
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error('Canvas element not found:', canvasId);
      return;
    }
    
    // Initialize the clock for time tracking
    this.clock = new THREE.Clock();
    this.deltaTime = 0;
    this.elapsedTime = 0;
    this.isRunning = false;
    
    // Arrays to track objects
    this.objects = [];
    this.clouds = [];
    this.gates = [];
    this.currentGateIndex = 0;
    
    // Frame rate control
    this.lastFrameTime = 0;
    this.minFrameMs = 1000 / 60; // Cap at 60 FPS to prevent flashing

    // Initialize input handler
    this.inputHandler = new InputHandler();

    // Initialize components
    this.initThreeJs();
    this.setupEnvironment();
    this.setupAircraft();
    this.setupGates();
    
    console.log('Game engine initialized successfully');
  }

  initThreeJs() {
    // Create scene
    this.scene = new THREE.Scene();
    
    // Create simple sky background (fallback)
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Create sky gradient
    this.setupSkyGradient();

    // Create default camera (will be replaced by aircraft's chase camera)
    this.defaultCamera = new THREE.PerspectiveCamera(
      75, // Field of view
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    this.defaultCamera.position.z = 5;
    
    // Active camera will be set to the aircraft's camera later
    this.activeCamera = this.defaultCamera;

    // Create renderer with anti-aliasing and better precision
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      logarithmicDepthBuffer: true, // Better depth precision
      precision: 'highp',
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
    
    // Enable better depth accuracy
    this.renderer.setClearColor(0x87CEEB, 1);
    this.renderer.autoClear = true;

    // Add lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    // Main directional light (sun)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.directionalLight.position.set(100, 200, 50); // Position the sun for longer shadows
    this.directionalLight.castShadow = true;
    
    // Improve shadow quality and coverage
    this.directionalLight.shadow.mapSize.width = 4096; // Increased resolution
    this.directionalLight.shadow.mapSize.height = 4096; // Increased resolution
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 1000; // Increased far plane for shadows
    this.directionalLight.shadow.camera.left = -500;
    this.directionalLight.shadow.camera.right = 500;
    this.directionalLight.shadow.camera.top = 500;
    this.directionalLight.shadow.camera.bottom = -500;
    this.directionalLight.shadow.bias = -0.0005; // Reduces shadow acne
    this.directionalLight.shadow.normalBias = 0.05; // Improves shadow quality on thin objects
    
    this.scene.add(this.directionalLight);
    
    // Add a secondary directional light for softer shadows
    this.secondaryLight = new THREE.DirectionalLight(0xffffcc, 0.4);
    this.secondaryLight.position.set(-50, 100, -50); // Opposite side from main light
    this.scene.add(this.secondaryLight);

    // Enable shadows with high quality
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.physicallyCorrectLights = true;

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
    
    console.log('Three.js initialized with enhanced shadows');
  }
  
  setupSkyGradient() {
    // Create a simpler sky with just a solid color
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
  }

  setupEnvironment() {
    // Create voxel-style terrain
    this.createGroundPlane();
    
    // Add clouds
    this.createClouds();
    
    // Comment out missing mountains function
    // this.createMountains();

    // Add trees to the landscape
    this.createTrees();
    
    // Add birds flying in the sky
    this.createBirds();

    // Add river
    this.createRiver();
    
    // Add Chain Bridge (Lánchíd) as the ninth obstacle
    this.createChainBridge();
  }
  
  createGroundPlane() {
    // Create a large flat ground plane
    const groundSize = 2000; // Increased ground size
    
    // Create a simpler ground material
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x7CFC00, // Light green
      roughness: 0.8,
      metalness: 0.2
    });
    
    // Use a simpler ground geometry with fewer vertices
    const gridGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 50, 50);
    const ground = new THREE.Mesh(gridGeometry, groundMaterial);
    
    // Rotate to be horizontal and position below the aircraft
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -5;
    
    // Enable shadows
    ground.receiveShadow = true;
    
    this.scene.add(ground);
    this.ground = ground;
    
    // Add a second, darker ground plane extending to the horizon
    const farGroundGeometry = new THREE.PlaneGeometry(groundSize * 3, groundSize * 3);
    const farGroundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3A5F0B, // Darker green
      roughness: 0.9,
      metalness: 0.1
    });
    
    const farGround = new THREE.Mesh(farGroundGeometry, farGroundMaterial);
    farGround.rotation.x = -Math.PI / 2;
    farGround.position.y = -5.5; // Slightly below main ground
    farGround.receiveShadow = true;
    
    this.scene.add(farGround);
    
    console.log('Ground plane created');
  }
  
  createRiver() {
    try {
      // Create a river flowing from south to north (along the z-axis)
      const riverWidth = 20;
      const riverLength = 2000; // Much longer river to extend beyond obstacles
      
      // Create river geometry - slightly above ground to prevent z-fighting
      const riverGeometry = new THREE.PlaneGeometry(riverWidth, riverLength, 20, 20);
      
      // Create water material with flowing texture effect
      const riverMaterial = new THREE.MeshStandardMaterial({
        color: 0x4A87FF, // Blue color for water
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.8
      });
      
      // Create river mesh
      const river = new THREE.Mesh(riverGeometry, riverMaterial);
      
      // Position river horizontally and rotate to align south to north
      river.rotation.x = -Math.PI / 2;
      river.position.y = -4.8; // Slightly above ground
      river.position.z = 400; // Offset the river to extend much further ahead
      
      // Add some variation to the river path - gentle curves
      const vertices = riverGeometry.attributes.position.array;
      for (let i = 0; i < vertices.length; i += 3) {
        const z = vertices[i + 2]; // Z position along river length
        
        // Slightly undulate the x position to make the river meander
        vertices[i] += Math.sin(z * 0.01) * 10;
      }
      
      // Adding UV coordinates for flowing water animation
      const uvs = riverGeometry.attributes.uv.array;
      for (let i = 0; i < uvs.length; i += 2) {
        // Scale UVs to create repeating pattern for flow animation
        uvs[i + 1] *= 5;
      }
      
      riverGeometry.attributes.position.needsUpdate = true;
      riverGeometry.attributes.uv.needsUpdate = true;
      riverGeometry.computeVertexNormals();
      
      this.scene.add(river);
      this.river = river;
      
      // Add river banks - slightly raised areas along the river
      this.createRiverBanks(river);
      
      // Add flow animation properties
      this.riverFlowSpeed = 0.3;
      this.riverOffset = 0;
      
      console.log('River created');
    } catch (error) {
      console.error('Error creating river:', error);
    }
  }
  
  createRiverBanks(river) {
    // Create raised areas along the river banks
    const bankWidth = 5;
    const bankLength = 2000; // Match river length
    
    // East bank
    const eastBankGeometry = new THREE.PlaneGeometry(bankWidth, bankLength, 10, 40);
    const bankMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown color for river bank
      roughness: 0.9,
      metalness: 0.1
    });
    
    const eastBank = new THREE.Mesh(eastBankGeometry, bankMaterial);
    eastBank.rotation.x = -Math.PI / 2;
    eastBank.position.y = -4.7; // Slightly above river
    eastBank.position.x = 12.5; // Position along right side of river
    eastBank.position.z = 400; // Match river position
    
    // Add some height variation to the bank
    const eastVertices = eastBankGeometry.attributes.position.array;
    for (let i = 0; i < eastVertices.length; i += 3) {
      const z = eastVertices[i + 2]; // Z position along river length
      
      // Make the bank follow the river curve
      eastVertices[i] += Math.sin(z * 0.01) * 10;
      
      // Add some height variation
      eastVertices[i + 1] = Math.random() * 0.5;
    }
    
    eastBankGeometry.attributes.position.needsUpdate = true;
    eastBankGeometry.computeVertexNormals();
    
    this.scene.add(eastBank);
    
    // West bank
    const westBankGeometry = new THREE.PlaneGeometry(bankWidth, bankLength, 10, 40);
    const westBank = new THREE.Mesh(westBankGeometry, bankMaterial);
    westBank.rotation.x = -Math.PI / 2;
    westBank.position.y = -4.7; // Slightly above river
    westBank.position.x = -12.5; // Position along left side of river
    westBank.position.z = 400; // Match river position
    
    // Add some height variation to the bank
    const westVertices = westBankGeometry.attributes.position.array;
    for (let i = 0; i < westVertices.length; i += 3) {
      const z = westVertices[i + 2]; // Z position along river length
      
      // Make the bank follow the river curve
      westVertices[i] += Math.sin(z * 0.01) * 10;
      
      // Add some height variation
      westVertices[i + 1] = Math.random() * 0.5;
    }
    
    westBankGeometry.attributes.position.needsUpdate = true;
    westBankGeometry.computeVertexNormals();
    
    this.scene.add(westBank);
  }
  
  createClouds() {
    try {
      const cloudCount = 25; // More clouds for better visuals
      const cloudMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.9
      });
      
      for (let i = 0; i < cloudCount; i++) {
        const cloudGroup = new THREE.Group();
        
        // Create simpler clouds
        const blockCount = 2 + Math.floor(Math.random() * 3);
        const cloudSize = 1 + Math.random() * 2;
        
        // Create main cloud cube
        const mainCloudGeo = new THREE.BoxGeometry(cloudSize, cloudSize * 0.5, cloudSize);
        const mainCloud = new THREE.Mesh(mainCloudGeo, cloudMaterial);
        
        // Make clouds cast soft shadows
        mainCloud.castShadow = true;
        mainCloud.receiveShadow = false;
        
        cloudGroup.add(mainCloud);
        
        // Add additional cloud blocks
        for (let j = 0; j < blockCount; j++) {
          const blockSize = cloudSize * (0.5 + Math.random() * 0.5);
          const blockGeo = new THREE.BoxGeometry(blockSize, blockSize * 0.4, blockSize);
          const block = new THREE.Mesh(blockGeo, cloudMaterial);
          
          // Position blocks relative to main cloud
          block.position.x = (Math.random() - 0.5) * cloudSize;
          block.position.y = (Math.random() - 0.5) * 0.2 * cloudSize;
          block.position.z = (Math.random() - 0.5) * cloudSize;
          
          // Make cloud blocks cast soft shadows
          block.castShadow = true;
          block.receiveShadow = false;
          
          cloudGroup.add(block);
        }
        
        // Position cloud in scene - wider distribution including far ahead
        cloudGroup.position.x = (Math.random() - 0.5) * 300;
        cloudGroup.position.y = 15 + Math.random() * 20; 
        cloudGroup.position.z = (Math.random() - 0.5) * 600; // Spread clouds further along course
        
        this.clouds.push({
          group: cloudGroup,
          speed: 0.03 + Math.random() * 0.05, // Variable cloud movement
          bobSpeed: 0.1 + Math.random() * 0.1, // Slower bobbing
          bobHeight: 0.05 + Math.random() * 0.05,
          startY: cloudGroup.position.y
        });
        
        this.scene.add(cloudGroup);
      }
      
      console.log('Clouds created with shadows');
    } catch (error) {
      console.error('Error creating clouds:', error);
    }
  }

  setupAircraft() {
    try {
      // Remove test cube if it exists
      if (this.cube) {
        this.scene.remove(this.cube);
        const index = this.objects.indexOf(this.cube);
        if (index !== -1) {
          this.objects.splice(index, 1);
        }
      }
      
      // Create aircraft with input handler
      this.aircraft = new Aircraft(this.inputHandler);
      
      // Add aircraft to scene
      const aircraftObject = this.aircraft.getObject();
      this.scene.add(aircraftObject);
      this.objects.push(this.aircraft);
      
      // Setup aircraft shadows
      aircraftObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Use aircraft's camera as the active camera
      this.activeCamera = this.aircraft.getCamera();
      
      // Position aircraft at starting point
      aircraftObject.position.set(0, 10, -20); // Higher altitude to match the flat ground
      
      console.log('Aircraft setup complete');
    } catch (error) {
      console.error('Error setting up aircraft:', error);
    }
  }

  setupGates() {
    try {
      // Constants for gate arrangement
      const gateCount = 8;
      const minDistanceBetweenGates = 80; // Doubled from 40 to 80
      const minHeight = 8; // Minimum height for gates
      const maxHeight = 20; // Reduced maximum height
      const startZ = 100; // Doubled from 50 to 100
      const courseLength = 800; // Doubled from 400 to 800
      
      console.log('Setting up gates...');
      
      // Generate gates with semi-random placement and increasing difficulty
      for (let i = 0; i < gateCount; i++) {
        // Calculate progression factor (0 to 1) to increase difficulty
        const progressFactor = i / (gateCount - 1);
        
        // Determine z position (distance along the course)
        // First few gates are easier to find
        const zPosition = startZ + (courseLength * (progressFactor * 0.8 + 0.2));
        
        // Calculate position variation range based on progression
        const lateralRange = 30 + progressFactor * 30; // Reduced lateral range
        const heightVariation = progressFactor * (maxHeight - minHeight);
        
        // Generate multiple candidate positions for this gate
        const candidateCount = 10;
        let candidates = [];
        
        for (let j = 0; j < candidateCount; j++) {
          // Randomize position with constraints
          let x = (Math.random() * 2 - 1) * lateralRange;
          
          // Bias toward river for first few gates, then more variation
          if (i < 2) {
            // First gates stay closer to the river (starter area)
            x = (Math.random() * 2 - 1) * 15;
          }
          
          // Height increases with progression, with some randomness
          const baseHeight = minHeight + heightVariation;
          let y = baseHeight + (Math.random() * 4 - 2); // Reduced height variation
          
          // Ensure gate is not below ground
          y = Math.max(y, 6);
          
          // Create candidate position
          const position = { x, y, z: zPosition };
          
          // Check if this position is valid (not too close to other gates)
          let isValid = true;
          for (let k = 0; k < this.gates.length; k++) {
            const existingGate = this.gates[k];
            const existingPos = existingGate.position;
            const dist = Math.sqrt(
              Math.pow(position.x - existingPos.x, 2) + 
              Math.pow(position.y - existingPos.y, 2) + 
              Math.pow(position.z - existingPos.z, 2)
            );
            
            if (dist < minDistanceBetweenGates) {
              isValid = false;
              break;
            }
          }
          
          if (isValid) {
            candidates.push(position);
          }
        }
        
        // If no valid candidates, create a fallback position
        if (candidates.length === 0) {
          const fallbackX = (Math.random() * 2 - 1) * 20;
          const fallbackY = minHeight + 5;
          const fallbackZ = zPosition + (minDistanceBetweenGates * 0.5);
          candidates.push({ x: fallbackX, y: fallbackY, z: fallbackZ });
        }
        
        // Choose a random valid candidate position
        const chosenPosition = candidates[Math.floor(Math.random() * candidates.length)];
        
        // Determine gate rotation (looking at next gate or oriented for difficulty)
        let rotation = { x: 0, y: 0, z: 0 };
        
        // Create the gate
        const gate = new Gate(i, chosenPosition, rotation);
        this.gates.push(gate);
        this.scene.add(gate.getObject());
        this.objects.push(gate);
        
        // Ensure the gate casts shadows
        const gateObject = gate.getObject();
        gateObject.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        console.log(`Created gate ${i+1} at position`, chosenPosition);
      }
      
      // Set the first gate as the current target
      if (this.gates.length > 0) {
        this.gates[0].setTarget();
      }
      
      console.log(`Created ${this.gates.length} gates with shadows`);
    } catch (error) {
      console.error('Error setting up gates:', error);
    }
  }

  handleResize() {
    // Update camera aspect ratio and projection matrix
    this.activeCamera.aspect = window.innerWidth / window.innerHeight;
    this.activeCamera.updateProjectionMatrix();

    // Update renderer size
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Game loop methods
  start() {
    if (!this.isRunning) {
      this.clock.start();
      this.isRunning = true;
      this.lastFrameTime = 0;
      console.log('Game loop started');
      this.animate(0);
    }
  }

  stop() {
    if (this.isRunning) {
      this.clock.stop();
      this.isRunning = false;
      console.log('Game loop stopped');
    }
  }

  animate(currentTime) {
    if (!this.isRunning) return;

    // Frame rate limiting to prevent flashing
    const elapsed = currentTime - this.lastFrameTime;
    if (elapsed < this.minFrameMs) {
      // If frame is too fast, throttle it
      requestAnimationFrame((time) => this.animate(time));
      return;
    }
    
    // Update last frame time
    this.lastFrameTime = currentTime;

    // Request next frame first to ensure smoother animation
    requestAnimationFrame((time) => this.animate(time));

    try {
      // Calculate delta time and update elapsed time
      this.deltaTime = Math.min(this.clock.getDelta(), 0.1); // Cap deltaTime to prevent jumps
      this.elapsedTime = this.clock.getElapsedTime();

      // Update game state
      this.update(this.deltaTime, this.elapsedTime);

      // Render the scene
      this.renderer.render(this.scene, this.activeCamera);
    } catch (error) {
      console.error('Error in animation loop:', error);
    }
  }

  update(deltaTime, elapsedTime) {
    try {
      // Update all game objects
      for (const object of this.objects) {
        if (object.update) {
          object.update(deltaTime);
        }
      }
      
      // Animate the river flow (south to north)
      if (this.river) {
        // Update river flow offset
        this.riverOffset += deltaTime * this.riverFlowSpeed;
        
        // Apply river flow animation by shifting UVs
        const riverUVs = this.river.geometry.attributes.uv.array;
        for (let i = 0; i < riverUVs.length; i += 2) {
          // Original v coordinate (2nd component of uv pair)
          const originalV = riverUVs[i + 1] - this.riverOffset % 5;
          // Set new v coordinate with continuous flow effect
          riverUVs[i + 1] = originalV % 5;
        }
        this.river.geometry.attributes.uv.needsUpdate = true;
      }
      
      // Animate clouds (bobbing up and down)
      for (const cloud of this.clouds) {
        // Move clouds slowly sideways
        cloud.group.position.x += cloud.speed * deltaTime;
        
        // Reset cloud when it moves too far
        if (cloud.group.position.x > 200) {
          cloud.group.position.x = -200;
          // Randomize z position when cloud resets
          cloud.group.position.z = (Math.random() - 0.5) * 600;
          cloud.group.position.y = 15 + Math.random() * 20;
        }
        
        // Bob clouds up and down
        cloud.group.position.y = cloud.startY + Math.sin(elapsedTime * cloud.bobSpeed) * cloud.bobHeight;
      }
      
      // Animate trees swaying gently
      if (this.trees) {
        for (const tree of this.trees) {
          // Gentle tree swaying in the breeze
          tree.group.rotation.z = Math.sin(elapsedTime * tree.swaySpeed) * tree.swayAmount;
        }
      }
      
      // Animate birds flying
      if (this.birds) {
        for (const bird of this.birds) {
          // Flap wings
          if (bird.group.userData.wings) {
            bird.group.userData.wings.rotation.z = Math.sin(elapsedTime * bird.wingSpeed) * 0.3;
          }
          
          // Move birds based on flight style
          if (bird.flightStyle === 'circle') {
            // Circular flight pattern
            const angle = elapsedTime * 0.5 + bird.angleOffset;
            const newX = bird.circleCenter.x + Math.cos(angle) * bird.circleRadius;
            const newZ = bird.circleCenter.z + Math.sin(angle) * bird.circleRadius;
            bird.group.position.x = newX;
            bird.group.position.z = newZ;
            
            // Rotate bird to face direction of travel
            bird.group.rotation.y = angle + Math.PI / 2;
          } else {
            // Straight flight with occasional direction changes
            bird.group.translateZ(bird.speed * deltaTime);
            
            // If bird gets too far, reset its position
            if (Math.abs(bird.group.position.x) > 500 || 
                Math.abs(bird.group.position.z) > 1800) {
              bird.group.position.copy(bird.circleCenter);
              bird.group.rotation.y = Math.random() * Math.PI * 2;
            }
            
            // Occasionally change direction
            if (Math.random() < 0.01) {
              bird.group.rotation.y += (Math.random() - 0.5) * 0.5;
            }
          }
        }
      }
      
      // Check for gate collisions if aircraft exists
      if (this.aircraft && this.gates.length > 0) {
        this.checkGateCollisions();
      }
      
      // Check for bridge collision
      this.checkBridgeCollision();
      
    } catch (error) {
      console.error('Error in update loop:', error);
    }
  }
  
  checkGateCollisions() {
    if (this.currentGateIndex >= this.gates.length) return;
    
    const currentGate = this.gates[this.currentGateIndex];
    const aircraftObject = this.aircraft.getObject();
    
    // Get aircraft position
    const aircraftPosition = new THREE.Vector3();
    aircraftObject.getWorldPosition(aircraftPosition);
    
    // Get gate position
    const gatePosition = new THREE.Vector3();
    currentGate.getObject().getWorldPosition(gatePosition);
    
    // Calculate distance to gate
    const distance = aircraftPosition.distanceTo(gatePosition);
    
    // Check if aircraft is close enough to potentially pass through the gate
    // Updated detection distance to match 3x gate size
    if (distance < 45) { // 3x original distance (15 * 3 = 45)
      // Create a basic bounding box for the aircraft
      const aircraftBounds = new THREE.Box3().setFromObject(aircraftObject);
      
      // Get the gate's collision box
      const gateCollisionBox = currentGate.getCollisionBox();
      const gateBounds = new THREE.Box3().setFromObject(gateCollisionBox);
      
      // Check for intersection
      if (aircraftBounds.intersectsBox(gateBounds)) {
        // Aircraft is passing through the gate
        console.log(`Passing through gate ${this.currentGateIndex + 1}`);
        
        // Get the world positions of aircraft and gate
        const aircraftWorldPos = new THREE.Vector3();
        aircraftObject.getWorldPosition(aircraftWorldPos);
        
        const gateWorldPos = new THREE.Vector3();
        currentGate.getObject().getWorldPosition(gateWorldPos);
        
        // Simplified direction check - assume correct direction if aircraft's Z is less than gate's Z
        // This assumes the forward direction is increasing Z
        if (aircraftWorldPos.z < gateWorldPos.z) {
          this.gateCompleted(currentGate);
        }
      }
    }
  }
  
  gateCompleted(gate) {
    // Mark the gate as passed
    gate.setPassed();
    
    // Update the current gate index
    this.currentGateIndex++;
    
    // Set the next gate as target, if available
    if (this.currentGateIndex < this.gates.length) {
      this.gates[this.currentGateIndex].setTarget();
    }
    
    console.log(`Gate ${gate.id + 1} completed! Next gate: ${this.currentGateIndex + 1}`);
  }

  addObject(object) {
    this.objects.push(object);
    this.scene.add(object.getObject ? object.getObject() : object);
  }

  removeObject(object) {
    const index = this.objects.indexOf(object);
    if (index !== -1) {
      this.objects.splice(index, 1);
      this.scene.remove(object.getObject ? object.getObject() : object);
    }
  }

  createChainBridge() {
    try {
      console.log('Creating Chain Bridge (Lánchíd) as 9th obstacle...');
      
      // Use a fixed position at z=1100 as requested
      const bridgeZ = 1100;
      console.log(`Positioning bridge at fixed position Z=${bridgeZ}`);
      
      // Bridge dimensions based on the Széchenyi Chain Bridge in Budapest
      const bridgeWidth = 60;  // Spans across the river
      const bridgeLength = 25; // Width of the bridge
      const bridgeHeight = 30;
      
      // Materials based on the image
      const stoneMaterial = new THREE.MeshStandardMaterial({
        color: 0xDCDCDC, // Light stone/concrete color
        roughness: 0.9,
        metalness: 0.1
      });
      
      const chainMaterial = new THREE.MeshStandardMaterial({
        color: 0x336699, // Blue-green tint like in the image
        roughness: 0.6,
        metalness: 0.7
      });
      
      const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555, // Dark gray for road
        roughness: 0.8,
        metalness: 0.2
      });

      const towerTrimMaterial = new THREE.MeshStandardMaterial({
        color: 0xEEEEEE, // White stone trim
        roughness: 0.7,
        metalness: 0.3
      });
      
      // Create a container for all bridge components
      this.bridge = new THREE.Group();
      
      // Position the bridge directly across the path
      this.bridge.position.set(0, 0, bridgeZ);
      
      // Rotate the bridge a further 22.5 degrees to the right (now fully straight)
      this.bridge.rotation.y = 0; // 0 degrees (straight orientation)
      
      // Tower dimensions
      const pillarWidth = 10;
      const pillarDepth = 10;
      const pillarHeight = bridgeHeight;
      const pillarSpacing = 40; // Wider span to match the image
      
      // Create decorative arches for the towers - as seen in the image
      const createTower = (xPos) => {
        const tower = new THREE.Group();
        
        // Main tower base
        const towerBaseGeometry = new THREE.BoxGeometry(pillarWidth, pillarHeight * 0.3, pillarDepth);
        const towerBase = new THREE.Mesh(towerBaseGeometry, stoneMaterial);
        towerBase.position.set(xPos, pillarHeight * 0.15, -bridgeLength/2);
        tower.add(towerBase);
        
        // Tower columns (create 4 columns in a square)
        const columnWidth = 3;
        const columnDepth = 3;
        const columnHeight = pillarHeight * 0.5;
        const columnSpacing = 5;
        
        // Four decorative columns on each tower
        for (let col = 0; col < 2; col++) {
          for (let row = 0; row < 2; row++) {
            const columnX = xPos + (col === 0 ? -columnSpacing/2 : columnSpacing/2);
            const columnZ = -bridgeLength/2 + (row === 0 ? -columnSpacing/2 : columnSpacing/2);
            
            const columnGeometry = new THREE.BoxGeometry(columnWidth, columnHeight, columnDepth);
            const column = new THREE.Mesh(columnGeometry, stoneMaterial);
            column.position.set(columnX, pillarHeight * 0.3 + columnHeight/2, columnZ);
            tower.add(column);
          }
        }
        
        // Tower top - the arch structure
        const towerCapGeometry = new THREE.BoxGeometry(pillarWidth + 2, pillarHeight * 0.2, pillarDepth + 2);
        const towerCap = new THREE.Mesh(towerCapGeometry, stoneMaterial);
        towerCap.position.set(xPos, pillarHeight * 0.8, -bridgeLength/2);
        tower.add(towerCap);
        
        // Decorative tower top - squared shaped with trim
        const towerTopGeometry = new THREE.BoxGeometry(pillarWidth + 4, pillarHeight * 0.18, pillarDepth + 4);
        const towerTop = new THREE.Mesh(towerTopGeometry, towerTrimMaterial);
        towerTop.position.set(xPos, pillarHeight * 0.98, -bridgeLength/2);
        tower.add(towerTop);
        
        // Return the complete tower group
        return tower;
      };
      
      // Create the two towers on either side of the river
      const leftTower = createTower(-pillarSpacing/2);
      const rightTower = createTower(pillarSpacing/2);
      this.bridge.add(leftTower);
      this.bridge.add(rightTower);
      
      // Create roadway/deck - extended to connect the towers
      const roadwayGeometry = new THREE.BoxGeometry(pillarSpacing, 2, bridgeLength);
      const roadway = new THREE.Mesh(roadwayGeometry, roadMaterial);
      roadway.position.set(0, 10, 0);
      this.bridge.add(roadway);
      
      // Create suspension chains - more visible and pronounced like in the image
      const createChains = () => {
        // Main suspension cables (2 pairs, one on each side)
        const chainCount = 2;
        const chainSpacing = bridgeLength * 0.7;
        
        for (let side = 0; side < 2; side++) {
          const zPos = -bridgeLength/2 + side * chainSpacing;
          
          // Create two parallel chains on each side
          for (let chainPair = 0; chainPair < 2; chainPair++) {
            const chainOffset = chainPair === 0 ? -1 : 1;
            
            // Create chain segments
            const segmentCount = 16; // More segments for smoother curve
            const segmentLength = pillarSpacing / segmentCount;
            
            for (let j = 0; j < segmentCount; j++) {
              const xPos = -pillarSpacing/2 + j * segmentLength + segmentLength/2;
              
              // Chain height follows an elevated parabola to match the image
              const normalizedPos = (j / (segmentCount-1)) * 2 - 1; // -1 to 1
              const height = 25 - 15 * (1 - normalizedPos * normalizedPos); // Parabola
              
              // Create the chain segment
              const chainGeometry = new THREE.BoxGeometry(segmentLength * 0.85, 1.2, 1.2);
              const chainSegment = new THREE.Mesh(chainGeometry, chainMaterial);
              chainSegment.position.set(xPos, height, zPos + chainOffset);
              
              // Calculate rotation to follow the curve
              if (j > 0 && j < segmentCount - 1) {
                const prevNormPos = ((j-1) / (segmentCount-1)) * 2 - 1;
                const prevHeight = 25 - 15 * (1 - prevNormPos * prevNormPos);
                const nextNormPos = ((j+1) / (segmentCount-1)) * 2 - 1;
                const nextHeight = 25 - 15 * (1 - nextNormPos * nextNormPos);
                
                const angle = Math.atan2(nextHeight - prevHeight, segmentLength * 2);
                chainSegment.rotation.z = angle;
              }
              
              this.bridge.add(chainSegment);
            }
          }
        }
      };
      
      // Create vertical suspenders connecting chains to roadway
      const createSuspenders = () => {
        const suspenderCount = 14; // More suspenders like in the image
        const suspenderSpacing = pillarSpacing / suspenderCount;
        
        for (let i = 0; i < suspenderCount; i++) {
          const xPos = -pillarSpacing/2 + (i + 0.5) * suspenderSpacing;
          
          // Position follows same parabola as chains
          const normalizedPos = (i / (suspenderCount-1)) * 2 - 1; // -1 to 1 
          const topHeight = 25 - 15 * (1 - normalizedPos * normalizedPos);
          
          // Create suspenders on both sides of the bridge
          for (let side = 0; side < 2; side++) {
            const zPos = -bridgeLength/2 + side * bridgeLength * 0.7;
            const suspenderHeight = topHeight - 10;
            
            // Create main suspender
            const suspenderGeometry = new THREE.BoxGeometry(0.8, suspenderHeight, 0.8);
            const suspender = new THREE.Mesh(suspenderGeometry, chainMaterial);
            suspender.position.set(xPos, 10 + suspenderHeight/2, zPos);
            
            this.bridge.add(suspender);
            
            // Create cross-bracing between suspenders (horizontal elements)
            if (i < suspenderCount - 1) {
              const nextXPos = -pillarSpacing/2 + (i + 1.5) * suspenderSpacing;
              const bracingLength = suspenderSpacing;
              const bracingHeight = Math.min(topHeight - 10, 
                25 - 15 * (1 - Math.pow((i+1)/(suspenderCount-1) * 2 - 1, 2)) - 10);
              
              const bracingGeometry = new THREE.BoxGeometry(bracingLength, 0.5, 0.5);
              const bracing = new THREE.Mesh(bracingGeometry, chainMaterial);
              bracing.position.set((xPos + nextXPos) / 2, 10 + bracingHeight, zPos);
              
              this.bridge.add(bracing);
            }
          }
        }
      };
      
      // Create railings and additional details
      const createStructuralElements = () => {
        // Add decorative railings
        const railingHeight = 1.5;
        
        // Side railings along the edge
        const sideRailGeometry = new THREE.BoxGeometry(pillarSpacing, railingHeight, 1);
        
        // Front and back railings
        const frontRailing = new THREE.Mesh(sideRailGeometry, roadMaterial);
        frontRailing.position.set(0, 10 + railingHeight/2, -bridgeLength/2);
        this.bridge.add(frontRailing);
        
        const backRailing = new THREE.Mesh(sideRailGeometry, roadMaterial);
        backRailing.position.set(0, 10 + railingHeight/2, bridgeLength/2);
        this.bridge.add(backRailing);
        
        // Left and right railings along the sides
        const railingGeometry = new THREE.BoxGeometry(1, railingHeight, bridgeLength);
        
        const leftRailing = new THREE.Mesh(railingGeometry, roadMaterial);
        leftRailing.position.set(-pillarSpacing/2, 10 + railingHeight/2, 0);
        this.bridge.add(leftRailing);
        
        const rightRailing = new THREE.Mesh(railingGeometry, roadMaterial);
        rightRailing.position.set(pillarSpacing/2, 10 + railingHeight/2, 0);
        this.bridge.add(rightRailing);
        
        // Add decorative posts along the railings
        const postCount = 8;
        const postSpacing = bridgeLength / postCount;
        
        for (let i = 0; i <= postCount; i++) {
          const zPos = -bridgeLength/2 + i * postSpacing;
          
          // Create posts on both sides
          for (let side = 0; side < 2; side++) {
            const xPos = (side === 0 ? -1 : 1) * pillarSpacing/2;
            
            const postGeometry = new THREE.BoxGeometry(1.5, 3, 1.5);
            const post = new THREE.Mesh(postGeometry, stoneMaterial);
            post.position.set(xPos, 10 + 1.5, zPos);
            
            this.bridge.add(post);
          }
        }
      };
      
      // Build the bridge components
      createChains();
      createSuspenders();
      createStructuralElements();
      
      // Add the bridge to the scene
      this.scene.add(this.bridge);
      
      // Add bridge to objects list so it can be collision checked
      this.objects.push({
        getObject: () => this.bridge,
        getBoundingBox: () => {
          const bbox = new THREE.Box3().setFromObject(this.bridge);
          return bbox;
        }
      });
      
      console.log('Chain Bridge created successfully');
    } catch (error) {
      console.error('Error creating Chain Bridge:', error);
    }
  }

  checkBridgeCollision() {
    // Skip if no bridge or aircraft
    if (!this.bridge || !this.aircraft) return;
    
    // Get bounding boxes
    const aircraftBox = new THREE.Box3().setFromObject(this.aircraft.getObject());
    const bridgeBox = new THREE.Box3().setFromObject(this.bridge);
    
    // Check if bounding boxes intersect
    if (aircraftBox.intersectsBox(bridgeBox)) {
      console.log('Collision with bridge detected!');
      
      // Get more specific with which part of the bridge was hit
      const parts = ['roadway', 'pillars', 'chains'];
      let collisionPart = 'structure';
      
      // Check height to determine if aircraft went under the bridge (success)
      const aircraftY = this.aircraft.getObject().position.y;
      
      if (aircraftY < 10) {
        console.log('Aircraft successfully flew under the bridge!');
        // You could add a success indicator or score bonus here
      } else {
        // Show a visual effect for collision
        this.showCollisionEffect(this.aircraft.getObject().position);
        
        // Reset aircraft position (optional - uncomment if you want to enforce a penalty)
        /*
        if (this.currentGateIndex > 0) {
          const lastGatePos = this.gates[this.currentGateIndex - 1].position;
          this.aircraft.getObject().position.set(lastGatePos.x, lastGatePos.y, lastGatePos.z - 20);
        } else {
          this.aircraft.getObject().position.set(0, 10, 0);
        }
        */
      }
    }
  }
  
  showCollisionEffect(position) {
    // Create a simple flash effect at the collision point
    const flash = new THREE.PointLight(0xff0000, 5, 50);
    flash.position.copy(position);
    this.scene.add(flash);
    
    // Remove the flash after a short time
    setTimeout(() => {
      this.scene.remove(flash);
    }, 300);
  }

  createTrees() {
    try {
      console.log('Creating trees...');
      
      // Store trees for potential animation
      this.trees = [];
      
      // Create 100 trees scattered across the landscape
      const treeCount = 100;
      
      // Create materials for trees
      const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513, // Brown
        roughness: 0.9,
        metalness: 0.1
      });
      
      const foliageMaterial = new THREE.MeshStandardMaterial({
        color: 0x228B22, // Forest green
        roughness: 0.8,
        metalness: 0.1
      });
      
      // Create trees in various locations, avoiding the river area
      for (let i = 0; i < treeCount; i++) {
        // Create a tree group
        const treeGroup = new THREE.Group();
        
        // Vary tree size
        const treeScale = 0.5 + Math.random() * 1.5;
        
        // Create trunk (simple cube)
        const trunkGeometry = new THREE.BoxGeometry(1, 4, 1);
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 2;
        trunk.scale.set(treeScale, treeScale, treeScale);
        treeGroup.add(trunk);
        
        // Create foliage (layered cubes for voxel style)
        const createFoliage = () => {
          const foliageCount = 2 + Math.floor(Math.random() * 2);
          const foliageWidth = 3 + Math.random() * 2;
          
          for (let j = 0; j < foliageCount; j++) {
            const foliageGeometry = new THREE.BoxGeometry(
              foliageWidth - j * 0.5, 
              1.5, 
              foliageWidth - j * 0.5
            );
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.y = 4 + j * 1.2;
            foliage.scale.set(treeScale, treeScale, treeScale);
            treeGroup.add(foliage);
          }
        };
        
        createFoliage();
        
        // Position the tree randomly, avoiding the center path where the river is
        let x, z;
        do {
          x = (Math.random() * 2 - 1) * 400;
          z = (Math.random() * 1600) - 200;  // From -200 to 1400
        } while (Math.abs(x) < 30 && z > 300 && z < 500); // Avoid the river area
        
        treeGroup.position.set(x, -5, z);
        
        // Add slight random rotation for variety
        treeGroup.rotation.y = Math.random() * Math.PI * 2;
        
        // Make trees cast shadows
        treeGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        this.scene.add(treeGroup);
        this.trees.push({
          group: treeGroup,
          initialY: treeGroup.position.y,
          swaySpeed: 0.3 + Math.random() * 0.2,
          swayAmount: 0.01 + Math.random() * 0.01
        });
      }
      
      console.log(`Created ${treeCount} trees`);
    } catch (error) {
      console.error('Error creating trees:', error);
    }
  }
  
  createBirds() {
    try {
      console.log('Creating birds...');
      
      // Store birds for animation
      this.birds = [];
      
      // Create flocks of birds
      const birdCount = 30;
      
      // Bird material
      const birdMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333, // Dark gray
        roughness: 0.7,
        metalness: 0.2
      });
      
      for (let i = 0; i < birdCount; i++) {
        // Create a bird group
        const birdGroup = new THREE.Group();
        
        // Bird body - small box
        const bodyGeometry = new THREE.BoxGeometry(0.5, 0.5, 1);
        const body = new THREE.Mesh(bodyGeometry, birdMaterial);
        birdGroup.add(body);
        
        // Bird wings
        const wingGeometry = new THREE.BoxGeometry(2, 0.1, 0.8);
        const wings = new THREE.Mesh(wingGeometry, birdMaterial);
        wings.position.y = 0.2;
        birdGroup.add(wings);
        
        // Store wings reference for animation
        birdGroup.userData.wings = wings;
        
        // Position birds high in the sky in different areas
        const x = (Math.random() * 2 - 1) * 300;
        const y = 30 + Math.random() * 60;
        const z = (Math.random() * 1600) - 200;  // From -200 to 1400
        
        birdGroup.position.set(x, y, z);
        
        // Random rotation for flight direction
        birdGroup.rotation.y = Math.random() * Math.PI * 2;
        
        this.scene.add(birdGroup);
        
        // Add bird properties for animation
        this.birds.push({
          group: birdGroup,
          speed: 5 + Math.random() * 10,
          wingSpeed: 5 + Math.random() * 5,
          circleCenter: new THREE.Vector3(x, y, z),
          circleRadius: 20 + Math.random() * 40,
          angleOffset: Math.random() * Math.PI * 2,
          flightStyle: Math.random() > 0.7 ? 'circle' : 'straight'
        });
      }
      
      console.log(`Created ${birdCount} birds`);
    } catch (error) {
      console.error('Error creating birds:', error);
    }
  }
}

export default GameEngine; 