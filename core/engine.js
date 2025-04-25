// Core game engine
// This will handle the main game loop and Three.js setup 

import * as THREE from 'three';
import Aircraft from '../entities/aircraft.js';
import Gate from '../entities/gate.js';
import InputHandler from '../utils/input.js';
import FinishBridge from '../entities/finish_bridge.js';
import Tree from '../entities/tree.js';
import Person from '../entities/person.js';

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
    this.finishBridge = null;
    this.targetArrow = null; // Add property for the arrow
    
    // Frame rate control
    this.lastFrameTime = 0;
    this.minFrameMs = 1000 / 60; // Cap at 60 FPS to prevent flashing

    // Initialize input handler
    this.inputHandler = new InputHandler();

    // Initialize components
    this.initThreeJs();
    this.setupEnvironment();
    this.setupTrees();
    this.setupPeople();
    this.setupAircraft();
    this.setupGates();
    this.setupFinishBridge();
    this.setupTargetArrow(); // Call setup for the arrow
    
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

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(1, 3, 2);
    this.directionalLight.castShadow = true;
    
    // Improve shadow quality
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 500; // Increased far plane for shadows
    this.directionalLight.shadow.camera.left = -100;
    this.directionalLight.shadow.camera.right = 100;
    this.directionalLight.shadow.camera.top = 100;
    this.directionalLight.shadow.camera.bottom = -100;
    
    this.scene.add(this.directionalLight);

    // Enable shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
    
    console.log('Three.js initialized');
  }
  
  setupSkyGradient() {
    // Create a simpler sky with just a solid color
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
  }

  setupEnvironment() {
    // Create voxel-style terrain
    this.createGroundPlane();
    
    // Add river (assuming it exists)
    if (this.createRiver) this.createRiver();
    
    // Add clouds
    this.createClouds();
    
    console.log('Ground plane created');
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
    
    // console.log('Ground plane created'); // Already logged in setupEnvironment
  }
  
  createRiver() {
    try {
      // Create a river flowing from south to north (along the z-axis)
      const riverWidth = 20;
      const riverLength = 1000; // Longer river
      
      // Create river geometry - slightly above ground to prevent z-fighting
      const riverGeometry = new THREE.PlaneGeometry(riverWidth, riverLength, 20, 20);
      
      // Create water material with a simpler approach
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
      
      // Add some variation to the river path - gentle curves
      const vertices = riverGeometry.attributes.position.array;
      for (let i = 0; i < vertices.length; i += 3) {
        const z = vertices[i + 2]; // Z position along river length
        
        // Slightly undulate the x position to make the river meander
        vertices[i] += Math.sin(z * 0.01) * 10;
      }
      
      riverGeometry.attributes.position.needsUpdate = true;
      riverGeometry.computeVertexNormals();
      
      this.scene.add(river);
      this.river = river;
      
      // Add river banks - slightly raised areas along the river
      this.createRiverBanks(river);
      
      console.log('River created');
    } catch (error) {
      console.error('Error creating river:', error);
    }
  }
  
  createRiverBanks(river) {
    // Create raised areas along the river banks
    const bankWidth = 5;
    const bankLength = 1000; // Match river length
    
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
    // Create voxel-style clouds
    const cloudCount = 20; // Fewer clouds
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.5,
      metalness: 0.2
    });
    
    for (let i = 0; i < cloudCount; i++) {
      // Create a cloud group
      const cloudGroup = new THREE.Group();
      
      // Randomize cloud position
      const x = (Math.random() * 2 - 1) * 100;
      const y = 30 + Math.random() * 20;
      const z = (Math.random() * 2 - 1) * 100;
      
      cloudGroup.position.set(x, y, z);
      
      // Add cloud sections - fewer blocks per cloud
      const blockCount = 3 + Math.floor(Math.random() * 3);
      
      for (let j = 0; j < blockCount; j++) {
        const blockSize = 3 + Math.random() * 4;
        const blockGeometry = new THREE.BoxGeometry(blockSize, 2 + Math.random() * 2, blockSize);
        const block = new THREE.Mesh(blockGeometry, cloudMaterial);
        
        // Position blocks relative to cloud center
        const blockX = (Math.random() * 2 - 1) * 4;
        const blockY = (Math.random() * 2 - 1) * 1;
        const blockZ = (Math.random() * 2 - 1) * 4;
        
        block.position.set(blockX, blockY, blockZ);
        cloudGroup.add(block);
      }
      
      // Add cloud movement properties
      const cloud = {
        group: cloudGroup,
        speed: 0.5 + Math.random(),
        bobSpeed: 0.5 + Math.random() * 0.5,
        bobHeight: 0.1 + Math.random() * 0.3,
        startY: cloudGroup.position.y
      };
      
      this.clouds.push(cloud);
      this.scene.add(cloudGroup);
    }
    
    console.log('Clouds created');
  }
  
  setupAircraft() {
    try {
      // Create the aircraft
      this.aircraft = new Aircraft(this.inputHandler);
      
      // Add aircraft to the scene
      this.scene.add(this.aircraft.getObject());
      
      // Add to objects array for updates
      this.objects.push(this.aircraft);
      
      // Use aircraft's camera as active camera
      this.activeCamera = this.aircraft.getCamera();
      // Ensure the camera is added to the main scene, not the aircraft group (REVERTED)
      // this.scene.add(this.activeCamera); 
      
      console.log('Aircraft setup complete');
    } catch (error) {
      console.error('Error setting up aircraft:', error);
    }
  }
  
  setupGates() {
    try {
      // Constants for gate arrangement
      const gateCount = 8;
      const minDistanceBetweenGates = 40; // Increased minimum distance
      const minHeight = 8; // Minimum height for gates
      const maxHeight = 20; // Reduced maximum height
      const startZ = 50; // Starting distance from aircraft
      const courseLength = 400; // Length of the course
      
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
        
        console.log(`Created gate ${i+1} at position`, chosenPosition);
      }
      
      // Set the first gate as the current target
      if (this.gates.length > 0) {
        this.gates[0].setTarget();
        this.gates[0].startPulseEffect(); // Start pulsing
      }
      
      console.log(`Created ${this.gates.length} gates`);
    } catch (error) {
      console.error('Error setting up gates:', error);
    }
  }

  setupFinishBridge() {
    try {
      // Position the bridge after the last gate
      // Estimate position based on course length and gate setup
      const bridgeZPosition = 500; // Place bridge further down the Z axis
      const bridgeYPosition = -4; // Align roughly with ground level
      const bridgePosition = new THREE.Vector3(0, bridgeYPosition, bridgeZPosition);

      this.finishBridge = new FinishBridge(bridgePosition);
      this.scene.add(this.finishBridge.getObject());
      this.objects.push(this.finishBridge); // Add bridge to updatable objects

      console.log('Finish bridge created at position', bridgePosition);
    } catch (error) {
      console.error('Error setting up finish bridge:', error);
    }
  }

  // Add method to setup the target arrow
  setupTargetArrow() {
    const arrowDir = new THREE.Vector3(0, 0, 1); // Initial direction (forward)
    const arrowOrigin = new THREE.Vector3(0, 0, 0); // Initial origin (will be updated)
    const arrowLength = 5; // Initial/minimum length
    const arrowColor = 0xFFFF00; // Yellow color
    
    this.targetArrow = new THREE.ArrowHelper(arrowDir, arrowOrigin, arrowLength, arrowColor, 1.5, 1); // Head length, head width
    this.targetArrow.visible = false; // Initially hidden
    this.scene.add(this.targetArrow);
    console.log('Target arrow helper created.');
  }
  
  // Method to setup trees
  setupTrees() {
    const treeCount = 50;
    const groundY = -5; // From createGroundPlane
    const placementRadius = 500; // Spread trees within this radius
    const exclusionRadius = 50; // Keep clear area around center (0,0)

    for (let i = 0; i < treeCount; i++) {
      let x, z;
      let isValidPosition = false;
      while (!isValidPosition) {
        x = (Math.random() * 2 - 1) * placementRadius;
        z = (Math.random() * 2 - 1) * placementRadius;
        // Check if outside exclusion zone
        if (Math.sqrt(x*x + z*z) > exclusionRadius) {
            // Basic check to avoid placing directly in river (adjust if river path is complex)
            if (Math.abs(x) > 15) { // Assuming river is roughly centered around x=0 with width 20
                 isValidPosition = true;
            }
        }
      }

      // Y position needs to account for the base of the tree model
      const tree = new Tree(new THREE.Vector3(x, groundY, z)); 
      this.scene.add(tree.getObject());
      // Add to objects if tree needs updates, otherwise just add to scene
      // this.objects.push(tree); 
    }
    console.log(`Added ${treeCount} trees.`);
  }

  // Method to setup people
  setupPeople() {
    const personCount = 50;
    const groundY = -5; // From createGroundPlane
    const placementRadius = 400; // Place people closer than trees
    const exclusionRadius = 40; // Keep clear area around center

    for (let i = 0; i < personCount; i++) {
       let x, z;
       let isValidPosition = false;
        while (!isValidPosition) {
            x = (Math.random() * 2 - 1) * placementRadius;
            z = (Math.random() * 2 - 1) * placementRadius;
             // Check if outside exclusion zone
            if (Math.sqrt(x*x + z*z) > exclusionRadius) {
                // Basic check to avoid placing directly in river
                 if (Math.abs(x) > 15) { 
                    isValidPosition = true;
                 }
            }
        }

      // Y position needs to account for the base of the person model (bottom of feet)
      const person = new Person(new THREE.Vector3(x, groundY, z));
      this.scene.add(person.getObject());
      // Add to objects if person needs updates
      // this.objects.push(person);
    }
    console.log(`Added ${personCount} people.`);
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
      // Update all game objects (including aircraft)
      for (const object of this.objects) {
        if (object.update) {
          object.update(deltaTime);
        }
      }
      
      // Animate clouds (bobbing up and down)
      for (const cloud of this.clouds) {
        // Move clouds slowly sideways
        cloud.group.position.x += cloud.speed * deltaTime;
        
        // Reset cloud when it moves too far
        if (cloud.group.position.x > 150) {
          cloud.group.position.x = -150;
        }
        
        // Bob clouds up and down
        cloud.group.position.y = cloud.startY + Math.sin(elapsedTime * cloud.bobSpeed) * cloud.bobHeight;
      }
      
      // Check for gate collisions if aircraft exists and gates remain
      if (this.aircraft && this.gates.length > 0 && this.currentGateIndex < this.gates.length) {
        this.checkGateCollisions();
      }
      
      // Update target arrow position and direction
      this.updateTargetArrow();

    } catch (error) {
      console.error('Error in update loop:', error);
    }
  }
  
  checkGateCollisions() {
    if (this.currentGateIndex >= this.gates.length) return; // No more gates to check
    
    const currentGate = this.gates[this.currentGateIndex];
    const aircraftObject = this.aircraft.getObject();
    
    // Get world positions
    const aircraftPosition = new THREE.Vector3();
    aircraftObject.getWorldPosition(aircraftPosition);
    const gatePosition = new THREE.Vector3();
    currentGate.getObject().getWorldPosition(gatePosition);

    // Define a threshold distance *past* the gate to consider it missed
    const missedThreshold = 20; // If aircraft is 20 units beyond the gate's Z
    const checkRadius = 30; // Only check collision/miss within this radius

    // Calculate distance
    const distance = aircraftPosition.distanceTo(gatePosition);

    // Check only if aircraft is reasonably close or has potentially passed
    if (distance < checkRadius || aircraftPosition.z > gatePosition.z) {
        
      // Check for PASS: Intersection with gate bounding box
      const aircraftBounds = new THREE.Box3().setFromObject(aircraftObject);
      const gateCollisionBox = currentGate.getCollisionBox(); // Assuming this is the trigger area
      const gateBounds = new THREE.Box3().setFromObject(gateCollisionBox);
      
      if (aircraftBounds.intersectsBox(gateBounds)) {
        // Check direction (ensure aircraft Z is *approaching* or *at* gate Z, not already far past)
        // A simple check: aircraft Z should be less than or slightly past gate Z 
        // Adjust tolerance as needed
        const passTolerance = 5; 
        if (aircraftPosition.z < gatePosition.z + passTolerance) {
            console.log(`Passing through gate ${this.currentGateIndex + 1}`);
            this.gateCompleted(currentGate);
            return; // Gate passed, no need to check for miss
        } else {
            // Intersecting but already too far past? Treat as miss or ignore?
            // For now, ignore this edge case, assuming normal pass check is sufficient.
        }
      } 
      
      // Check for MISS: Aircraft has passed the gate's Z position without intersecting
      if (aircraftPosition.z > gatePosition.z + missedThreshold) {
          console.log(`Missed gate ${this.currentGateIndex + 1}`);
          this.gateMissed(currentGate);
          // No return here, let the loop continue checking next frame if needed
      }
    }
  }
  
  gateCompleted(gate) {
    // Mark the gate as passed
    gate.setPassed(); 
    gate.stopPulseEffect(); // Stop pulsing effect
    
    console.log(`Gate ${gate.id + 1} completed!`);
    
    // Update the current gate index
    this.currentGateIndex++;
    
    // Set the next gate as target, if available
    if (this.currentGateIndex < this.gates.length) {
      const nextGate = this.gates[this.currentGateIndex];
      nextGate.setTarget();
      nextGate.startPulseEffect(); // Start pulsing for the next gate
      console.log(`Next gate: ${this.currentGateIndex + 1}`);
    } else {
      console.log('All gates completed!');
      // Potentially trigger finish sequence here
    }
    
    // Add brief particle effect (placeholder)
    // this.showGatePassedParticles(gate.position);
  }

  // Add method to handle missed gates
  gateMissed(gate) {
    if (gate.isPassed || gate.isMissed) return; // Don't mark again

    gate.setMissed();
    gate.stopPulseEffect();
    console.log(`Gate ${gate.id + 1} missed.`);

    // Apply penalty (Step 12 - implement later)
    // this.applyTimePenalty();

    // Advance to the next gate anyway
    this.currentGateIndex++;
    
    // Set the next gate as target
    if (this.currentGateIndex < this.gates.length) {
      const nextGate = this.gates[this.currentGateIndex];
      nextGate.setTarget();
      nextGate.startPulseEffect();
      console.log(`Next gate (after miss): ${this.currentGateIndex + 1}`);
    } else {
        console.log('Last gate missed, course finished.');
         // Potentially trigger finish sequence here
    }
  }

  // Placeholder for particle effects
  // showGatePassedParticles(position) { ... }

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

  // Add method to update the target arrow
  updateTargetArrow() {
    if (!this.targetArrow || !this.aircraft) return;

    // Check if there is a next gate and the aircraft exists
    if (this.currentGateIndex < this.gates.length && this.aircraft) {
      const targetGate = this.gates[this.currentGateIndex];
      const aircraftObject = this.aircraft.getObject();

      // Get world positions
      const aircraftPosition = new THREE.Vector3();
      aircraftObject.getWorldPosition(aircraftPosition);
      
      // Use the gate's main object position as the target
      const gatePosition = new THREE.Vector3();
      targetGate.getObject().getWorldPosition(gatePosition);

      // Calculate direction from aircraft to gate
      const direction = new THREE.Vector3().subVectors(gatePosition, aircraftPosition).normalize();

      // Position the arrow slightly above the aircraft's center
      // We use the aircraft's world matrix to position relative to the aircraft
      const arrowOffset = new THREE.Vector3(0, 2, 0); // Offset: 2 units directly above aircraft center
      const arrowPosition = aircraftPosition.clone().add(arrowOffset); // Start arrow above aircraft
            
      this.targetArrow.position.copy(arrowPosition);
      this.targetArrow.setDirection(direction);
      
      // Adjust arrow length based on distance (optional, for visual cue)
      const distanceToGate = aircraftPosition.distanceTo(gatePosition);
      // Make arrow longer when far, shorter when near, within limits
      const arrowLength = Math.min(Math.max(distanceToGate * 0.1, 4), 15); 
      // Adjust head size proportionally to length
      this.targetArrow.setLength(arrowLength, arrowLength * 0.2, arrowLength * 0.15); 

      this.targetArrow.visible = true;
    } else {
      // Hide arrow if all gates are passed or aircraft doesn't exist
      this.targetArrow.visible = false;
    }
  }
}

export default GameEngine; 