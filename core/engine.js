// Core game engine
// This will handle the main game loop and Three.js setup 

import * as THREE from 'three';
import Aircraft from '../entities/aircraft.js';
import Gate from '../entities/gate.js';
import InputHandler from '../utils/input.js';
import FinishBridge from '../entities/finish_bridge.js';
import Tree from '../entities/tree.js';
import Person from '../entities/person.js';

// Penalty constants
const MISSED_GATE_PENALTY = 10; // seconds

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

    // Game State & Timing
    this.gameState = 'ready'; // 'ready', 'playing', 'finished'
    this.gameStartTime = 0;
    this.finalTime = 0;
    this.penaltyTime = 0; // Total accumulated penalty time

    // Initialize components
    this.initThreeJs();
    this.setupEnvironment();
    
    // Create a row of trees directly in the constructor (no Tree class dependency)
    try {
      console.log("Creating row of trees directly in constructor");
      
      // Row of trees in front of player
      const groundY = -5; // Ground level
      for (let x = -40; x <= 40; x += 20) {
        const z = 30; // Fixed distance in front
        
        // Create tree group
        const treeGroup = new THREE.Group();
        treeGroup.position.set(x, groundY, z);
        
        // Trunk (cylinder)
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(2, 3, 20, 8),
          new THREE.MeshBasicMaterial({ color: 0x8B4513 }) // Brown
        );
        trunk.position.y = 10; // Position trunk
        treeGroup.add(trunk);
        
        // Foliage (cone)
        const foliage = new THREE.Mesh(
          new THREE.ConeGeometry(10, 30, 8),
          new THREE.MeshBasicMaterial({ color: 0x00FF00 }) // Green
        );
        foliage.position.y = 30; // Position foliage on top of trunk
        treeGroup.add(foliage);
        
        // Add to scene
        this.scene.add(treeGroup);
        
        console.log(`Row tree created at position (${x}, ${groundY}, ${z})`);
      }
      
      console.log("Row of trees created successfully");
    } catch (error) {
      console.error("Error creating row of trees:", error);
    }
    
    // Regular component setup
    this.setupAircraft();
    this.setupGates();
    this.setupFinishBridge();
    this.setupTargetArrow(); // Call setup for the arrow
    this.setupHUD(); // Call setup for the HUD
    
    console.log('Game engine initialized successfully');
  }

  initThreeJs() {
    console.log("Starting initThreeJs with tree creation");
    
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

    // ABSOLUTE DIRECT APPROACH: Create trees as simple primitives right here
    try {
      console.log("Creating simple trees directly in initThreeJs");
      
      // Create 10 very simple trees
      for (let i = 0; i < 10; i++) {
        // Calculate tree position in a circle
        const angle = (i / 10) * Math.PI * 2;
        const radius = 50;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = -5; // Ground level
        
        // Create a simplest possible cone + cylinder tree
        const treeGroup = new THREE.Group();
        treeGroup.position.set(x, y, z);
        
        // Simple trunk (brown cylinder)
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(2, 3, 20, 8),
          new THREE.MeshBasicMaterial({ color: 0x8B4513 })
        );
        trunk.position.y = 10; // Half of trunk height
        treeGroup.add(trunk);
        
        // Simple foliage (green cone)
        const foliage = new THREE.Mesh(
          new THREE.ConeGeometry(10, 30, 8),
          new THREE.MeshBasicMaterial({ color: 0x00FF00 })
        );
        foliage.position.y = 30; // Trunk height + half of cone height
        treeGroup.add(foliage);
        
        // Add the tree to the scene
        this.scene.add(treeGroup);
        
        console.log(`Simple tree ${i+1} created at position (${x}, ${y}, ${z})`);
      }
      
      // ADD THREE MASSIVE UNMISSABLE TREES
      console.log("Creating 3 MASSIVE trees");
      
      // Positions for massive trees
      const massiveTreePositions = [
        { x: 0, y: -5, z: 30 },    // Directly in front
        { x: -30, y: -5, z: 0 },   // Left side
        { x: 30, y: -5, z: 0 }     // Right side
      ];
      
      massiveTreePositions.forEach((pos, index) => {
        // Create MASSIVE tree
        const massiveTree = new THREE.Group();
        massiveTree.position.set(pos.x, pos.y, pos.z);
        
        // MASSIVE trunk
        const massiveTrunk = new THREE.Mesh(
          new THREE.CylinderGeometry(5, 7, 50, 8),
          new THREE.MeshBasicMaterial({ color: 0xFF0000 }) // RED for visibility
        );
        massiveTrunk.position.y = 25; // Half height
        massiveTree.add(massiveTrunk);
        
        // MASSIVE foliage
        const massiveFoliage = new THREE.Mesh(
          new THREE.SphereGeometry(20, 8, 8), // Use sphere instead of cone
          new THREE.MeshBasicMaterial({ color: 0x00FF00 }) // Bright green
        );
        massiveFoliage.position.y = 60; // Above trunk
        massiveTree.add(massiveFoliage);
        
        // Add to scene
        this.scene.add(massiveTree);
        
        console.log(`MASSIVE tree ${index+1} created at (${pos.x}, ${pos.y}, ${pos.z})`);
      });
      
      console.log("Direct tree creation completed");
    } catch (error) {
      console.error("ERROR in direct tree creation:", error);
    }

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
    
    console.log('Three.js initialized with trees');
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
      
      // Example: Ensure gates are reset visually at start
      this.gates.forEach(gate => gate.reset ? gate.reset() : null);
      
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
    console.log('SETUP TREES: Starting setup with simplified extreme debug approach');
    
    // Create just a few trees in specific positions
    const treePositions = [
      { name: "Front Tree", x: 0, z: 30 },
      { name: "Left Tree", x: -20, z: 20 },
      { name: "Right Tree", x: 20, z: 20 },
      { name: "Far Tree", x: 0, z: 50 }
    ];
    
    const groundY = -5; // Ground level
    
    // Add each tree individually
    treePositions.forEach((pos, index) => {
      try {
        console.log(`SETUP TREES: Creating ${pos.name} at (${pos.x}, ${groundY}, ${pos.z})`);
        const tree = new Tree(new THREE.Vector3(pos.x, groundY, pos.z));
        this.scene.add(tree.getObject());
        console.log(`SETUP TREES: Successfully added ${pos.name}`);
      } catch (error) {
        console.error(`SETUP TREES: Failed to create ${pos.name}:`, error);
      }
    });
    
    // Create a grid of trees around the origin
    console.log("SETUP TREES: Creating grid pattern trees");
    const gridSize = 2; // 2x2 grid 
    const spacing = 40; // 40 units between trees
    
    for (let x = -gridSize; x <= gridSize; x++) {
      for (let z = -gridSize; z <= gridSize; z++) {
        // Skip the origin (0,0) where the aircraft starts
        if (x === 0 && z === 0) continue;
        
        const xPos = x * spacing;
        const zPos = z * spacing;
        
        try {
          console.log(`SETUP TREES: Creating grid tree at (${xPos}, ${groundY}, ${zPos})`);
          const tree = new Tree(new THREE.Vector3(xPos, groundY, zPos));
          this.scene.add(tree.getObject());
        } catch (error) {
          console.error(`SETUP TREES: Failed to create grid tree at (${xPos}, ${groundY}, ${zPos}):`, error);
        }
      }
    }
    
    console.log('SETUP TREES: Tree setup completed');
  }

  // Method to setup people
  setupPeople() {
    const personCount = 50;
    const groundY = -5; // From createGroundPlane
    const placementRadius = 400; // Place people closer than trees
    const exclusionRadius = 40; // Keep clear area around center
    
    // River properties - based on createRiver method
    const riverWidth = 20; 
    const bankWidth = 5; // Extra buffer zone
    const totalRiverWidth = riverWidth + (bankWidth * 2); // Total area to avoid
    
    // Bridge properties - based on setupFinishBridge method
    const bridgeZPosition = 500; // Bridge Z position
    const bridgeX = 0; // Bridge is centered at X=0
    const bridgeWidth = 50; // Bridge width (along X-axis)
    const bridgeLength = 50; // Bridge length (along Z-axis)
    const bridgeBufferRadius = 20; // Buffer around bridge (smaller than for trees)

    console.log('Placing people, avoiding river and bridge...');
    
    for (let i = 0; i < personCount; i++) {
      let x, z;
      let isValidPosition = false;
      let attemptCount = 0;
      const maxAttempts = 100; // Prevent infinite loops
      
      while (!isValidPosition && attemptCount < maxAttempts) {
        attemptCount++;
        
        // Generate random position
        x = (Math.random() * 2 - 1) * placementRadius;
        z = (Math.random() * 2 - 1) * placementRadius;
        
        // 1. Check if outside central exclusion zone
        if (Math.sqrt(x*x + z*z) <= exclusionRadius) {
          continue; // Skip this position
        }
        
        // 2. Check if in river - account for meandering path
        const riverCenterX = Math.sin(z * 0.01) * 10; // Meandering formula from createRiver
        const distanceFromRiver = Math.abs(x - riverCenterX);
        if (distanceFromRiver <= totalRiverWidth / 2) {
          continue; // Skip - too close to river
        }
        
        // 3. Check if too close to bridge
        const distanceToBridge = Math.sqrt(
          Math.pow(x - bridgeX, 2) + 
          Math.pow(z - bridgeZPosition, 2)
        );
        if (distanceToBridge <= Math.max(bridgeWidth, bridgeLength) / 2 + bridgeBufferRadius) {
          continue; // Skip - too close to bridge
        }
        
        // All checks passed
        isValidPosition = true;
      }

      if (!isValidPosition) {
        console.log(`Couldn't find valid position for person ${i+1} after ${maxAttempts} attempts`);
        continue; // Skip this person
      }

      // Create person at valid position
      const person = new Person(new THREE.Vector3(x, groundY, z));
      this.scene.add(person.getObject());
    }
    
    console.log(`Added ${personCount} people, avoiding river and bridge.`);
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
    if (this.isRunning) return;
    console.log('Starting game engine loop...');
    this.isRunning = true;
    this.clock.start(); // Ensure clock is running
    this.lastFrameTime = performance.now(); // Initialize frame limiter time
    requestAnimationFrame((time) => this.animate(time)); 
    // NOTE: Actual game start logic (timer, state) is now in startGame()
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
      // Update physics objects (only when playing)
      if (this.aircraft && this.gameState === 'playing') {
        this.aircraft.update(deltaTime, this.inputHandler.getInputState(), elapsedTime);
      }
      
      // Always ensure the active camera is the aircraft's camera if the aircraft exists
      if (this.aircraft) {
           this.activeCamera = this.aircraft.getCamera(); 
      }

      // Update other dynamic objects (e.g., clouds, effects)
      this.clouds.forEach(cloud => {
        // Example: Gentle bobbing - Use defined cloud properties
        cloud.group.position.y = cloud.startY + Math.sin(elapsedTime * cloud.bobSpeed) * cloud.bobHeight;
      });

      // Update target arrow
      this.updateTargetArrow();

      // Check game logic (collisions, gates) only when playing
      if (this.gameState === 'playing') {
        this.checkGateCollisions();
        // Add other checks for end conditions
        this.checkGroundCollision();
        this.checkBridgeCollision();
        this.checkBridgeCompletion();
      }

      // Update HUD (call placeholder)
      this.updateHUD(); 

    } catch (error) {
      console.error('Error in update loop:', error);
      this.stop(); // Stop the loop on critical error
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
    if (gate.isPassed || gate.isMissed || this.gameState !== 'playing') return; // Only score if playing

    gate.setPassed(); // Use setPassed instead of setCompleted if that exists
    gate.stopPulseEffect();
    console.log(`Gate ${gate.id + 1} passed.`);

    // Award points (implement later if needed)
    // this.score += 100; 
    // this.showPointsEarned(gate.getObject().position, 100);

    // Advance to the next gate
    this.currentGateIndex++;
    
    if (this.currentGateIndex < this.gates.length) {
      const nextGate = this.gates[this.currentGateIndex];
      nextGate.setTarget();
      nextGate.startPulseEffect();
      console.log(`Next gate: ${this.currentGateIndex + 1}`);
    } else {
      console.log('All gates completed! Continue flying to the bridge to finish the race.');
      
      // Don't finish the game yet - just hide the target arrow
      // Let the player continue to the bridge where the end conditions will be triggered
      if (this.targetArrow) {
        this.targetArrow.visible = false;
      }
      
      // Optional: Show a message guiding the player to the bridge
      const message = "All gates cleared! Now fly through the bridge to finish the race.";
      this.showGuidanceNotification(message); // Use a different notification style for guidance
    }
  }

  // Add method to handle missed gates
  gateMissed(gate) {
    if (gate.isPassed || gate.isMissed || this.gameState !== 'playing') return; // Don't mark again, only penalize if playing

    gate.setMissed();
    gate.stopPulseEffect();
    console.log(`Gate ${gate.id + 1} missed.`);

    // Apply penalty (Step 12)
    this.applyTimePenalty(MISSED_GATE_PENALTY, gate.getObject().position);

    // Advance to the next gate anyway
    this.currentGateIndex++;
    
    // Set the next gate as target
    if (this.currentGateIndex < this.gates.length) {
      const nextGate = this.gates[this.currentGateIndex];
      nextGate.setTarget();
      nextGate.startPulseEffect();
      console.log(`Next gate (after miss): ${this.currentGateIndex + 1}`);
    } else {
      console.log('Last gate missed. Continue flying to the bridge to finish the race.');
      
      // Don't finish the game yet - just hide the target arrow
      // Let the player continue to the bridge where the end conditions will be triggered
      if (this.targetArrow) {
        this.targetArrow.visible = false;
      }
      
      // Optional: Show a message guiding the player to the bridge
      const message = "All gates cleared! Now fly through the bridge to finish the race.";
      this.showGuidanceNotification(message); // Use a different notification style for guidance
    }
  }

  applyTimePenalty(seconds, position = null) {
    if (this.gameState !== 'playing') return;

    this.penaltyTime += seconds;
    console.log(`Applied penalty: +${seconds}s. Total penalty: ${this.penaltyTime}s`);
    
    // Show notification on screen
    const message = `✖ MISSED GATE – Penalty +${seconds}s`;
    this.showPenaltyNotification(message, position);

    // Optional: Add sound effect here later
    // this.audioManager.playSound('penalty'); 
  }

  showPenaltyNotification(message, position = null) {
    // Create a notification element
    const notificationElement = document.createElement('div');
    notificationElement.textContent = message;
    notificationElement.style.position = 'absolute';
    notificationElement.style.color = 'red';
    notificationElement.style.fontSize = '24px';
    notificationElement.style.fontWeight = 'bold';
    notificationElement.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.7)';
    notificationElement.style.zIndex = '1010'; // Above other HUD elements
    notificationElement.style.opacity = '0'; // Start faded out
    notificationElement.style.transition = 'opacity 0.3s ease-in-out, top 2.5s ease-out';
    notificationElement.style.textAlign = 'center';
    notificationElement.style.width = '100%'; // Center horizontally
    notificationElement.style.pointerEvents = 'none'; // Don't block clicks

    document.body.appendChild(notificationElement);

    // Position calculation (Placeholder: top-center for now)
    // TODO: Improve positioning based on 3D `position` if provided
    notificationElement.style.left = '0'; 
    notificationElement.style.top = '15%'; // Position below potential top HUD

    // Fade in, hold, fade out
    setTimeout(() => {
      notificationElement.style.opacity = '1'; // Fade in
    }, 10); // Small delay to allow transition

    setTimeout(() => {
      notificationElement.style.opacity = '0'; // Start fade out
      // Optional: Move up slightly during fade out
      // notificationElement.style.top = '10%'; 
    }, 2500); // Hold for 2.5 seconds before fading out

    // Remove element after animation
    setTimeout(() => {
      if (notificationElement.parentNode) {
        notificationElement.parentNode.removeChild(notificationElement);
      }
    }, 3000); // Remove after 3 seconds (0.3s fade in + 2.5s hold + 0.2s buffer/fadeout)
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

  // --- Game State Methods (To be implemented/refined) ---

  setupHUD() {
    // Remove existing HUD if any (e.g., during restart)
    const existingHUD = document.getElementById('hud-container');
    if (existingHUD) {
      existingHUD.remove();
    }

    // Create HUD container
    this.hudContainer = document.createElement('div');
    this.hudContainer.id = 'hud-container';
    this.hudContainer.style.position = 'absolute';
    this.hudContainer.style.top = '0';
    this.hudContainer.style.left = '0';
    this.hudContainer.style.width = '100%';
    this.hudContainer.style.height = '100%'; // Cover whole screen for centering
    this.hudContainer.style.pointerEvents = 'none'; // Allow clicks through
    this.hudContainer.style.zIndex = '1000';
    this.hudContainer.style.fontFamily = 'Arial, sans-serif';
    this.hudContainer.style.color = 'white';
    this.hudContainer.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';
    document.body.appendChild(this.hudContainer);

    this.hudElements = {};

    // Timer display (top-right)
    const timerElement = document.createElement('div');
    timerElement.id = 'timer-display';
    timerElement.style.position = 'absolute';
    timerElement.style.top = '20px';
    timerElement.style.right = '20px';
    timerElement.style.fontSize = '24px';
    timerElement.textContent = 'Time: 0.0s';
    this.hudContainer.appendChild(timerElement);
    this.hudElements.timer = timerElement;

    // Penalty display (below timer? or maybe integrated)
    // Let's add it below the timer for now.
    const penaltyElement = document.createElement('div');
    penaltyElement.id = 'penalty-display';
    penaltyElement.style.position = 'absolute';
    penaltyElement.style.top = '50px'; // Below timer
    penaltyElement.style.right = '20px';
    penaltyElement.style.fontSize = '18px';
    penaltyElement.style.color = '#ffdddd'; // Light red
    penaltyElement.textContent = 'Penalty: 0s';
    this.hudContainer.appendChild(penaltyElement);
    this.hudElements.penalty = penaltyElement;

    // Gate counter (top-left)
    const gateElement = document.createElement('div');
    gateElement.id = 'gate-counter';
    gateElement.style.position = 'absolute';
    gateElement.style.top = '20px';
    gateElement.style.left = '20px';
    gateElement.style.fontSize = '20px';
    gateElement.textContent = 'Gates: 0/0';
    this.hudContainer.appendChild(gateElement);
    this.hudElements.gates = gateElement;

    // Game state message (center)
    const messageElement = document.createElement('div');
    messageElement.id = 'game-message';
    messageElement.style.position = 'absolute';
    messageElement.style.top = '40%';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translate(-50%, -50%)';
    messageElement.style.fontSize = '36px';
    messageElement.style.textAlign = 'center';
    messageElement.style.display = 'block'; // Show initially
    messageElement.innerHTML = 'Air Race Challenge<br><span style="font-size: 20px">Press SPACE to Start</span>';
    this.hudContainer.appendChild(messageElement);
    this.hudElements.message = messageElement;

    // Result screen (center, hidden initially)
    const resultElement = document.createElement('div');
    resultElement.id = 'result-screen';
    resultElement.style.position = 'absolute';
    resultElement.style.top = '50%';
    resultElement.style.left = '50%';
    resultElement.style.transform = 'translate(-50%, -50%)';
    resultElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    resultElement.style.padding = '30px';
    resultElement.style.borderRadius = '10px';
    resultElement.style.fontSize = '20px';
    resultElement.style.textAlign = 'center';
    resultElement.style.display = 'none'; // Hidden initially
    resultElement.style.pointerEvents = 'auto'; // Allow clicks on button
    resultElement.innerHTML = `
      <h2 id="result-title">FINISH!</h2>
      <p id="result-reason" style="font-size: 18px; margin-bottom: 20px; display: none;"></p>
      <p>Time: <span id="result-time">0.0s</span></p>
      <p>Penalty: <span id="result-penalty">0s</span></p>
      <p style="font-weight: bold;">Final Time: <span id="result-final-time">0.0s</span></p>
      <p>Gates: <span id="result-gates">0/0</span></p>
      <button id="restart-button" style="padding: 10px 20px; margin-top: 20px; font-size: 18px; cursor: pointer;">Restart Race</button>
    `;
    this.hudContainer.appendChild(resultElement);
    this.hudElements.result = resultElement;

    // Give the DOM time to update, then add the event listener
    setTimeout(() => {
      const restartButton = document.getElementById('restart-button');
    if (restartButton) {
        console.log("Adding click handler to restart button");
        restartButton.addEventListener('click', () => {
          console.log("Restart button clicked!");
            this.restartGame();
        });
        
        // Make button visually interactive to show it's clickable
        restartButton.style.cursor = 'pointer';
        restartButton.style.transition = 'background-color 0.3s';
        restartButton.addEventListener('mouseover', () => {
          restartButton.style.backgroundColor = '#4CAF50';
        });
        restartButton.addEventListener('mouseout', () => {
          restartButton.style.backgroundColor = '';
        });
    } else {
        console.error('Restart button not found in DOM after adding result screen');
    }
    }, 100);
    
    // Setup space key listener for starting game
    // Use a flag to prevent multiple listeners if setupHUD is called again
    if (!this.spaceKeyListenerAdded) {
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && this.gameState === 'ready') {
                this.startGame();
            }
        });
        this.spaceKeyListenerAdded = true; // Mark listener as added
    }

    console.log('HUD setup complete');
  }

  updateHUD() {
    if (!this.hudElements) return; // Check if HUD is initialized

    const gatesTotal = this.gates.length;
    const gatesPassed = this.currentGateIndex; // Approximation, could be refined

    // Update Gate Counter
    this.hudElements.gates.textContent = `Gates: ${gatesPassed}/${gatesTotal}`;

    // Update Timer and Penalty only if playing
    if (this.gameState === 'playing') {
      const currentTime = this.clock.getElapsedTime() - this.gameStartTime;
      this.hudElements.timer.textContent = `Time: ${currentTime.toFixed(1)}s`;
      this.hudElements.penalty.textContent = `Penalty: ${this.penaltyTime}s`;
      this.hudElements.penalty.style.display = this.penaltyTime > 0 ? 'block' : 'none'; // Show only if penalty > 0
    }

    // Show/Hide elements based on gameState
    if (this.gameState === 'ready') {
        this.hudElements.message.style.display = 'block';
        this.hudElements.result.style.display = 'none';
        // Reset timer/penalty display for ready state
        this.hudElements.timer.textContent = 'Time: 0.0s';
        this.hudElements.penalty.textContent = 'Penalty: 0s';
        this.hudElements.penalty.style.display = 'none'; 
    } else if (this.gameState === 'playing') {
        this.hudElements.message.style.display = 'none';
        this.hudElements.result.style.display = 'none';
    } else if (this.gameState === 'finished') {
        this.hudElements.message.style.display = 'none';
        this.hudElements.result.style.display = 'block';
        // Update result screen content (ensure this is done once in finishGame)
    }
  }

  startGame() {
    if (this.gameState !== 'ready') return;
    console.log("Starting game...");
    this.gameState = 'playing';
    this.penaltyTime = 0;
    this.currentGateIndex = 0;
    this.finalTime = 0;
    
    // Reset aircraft to starting position/state
    if (this.aircraft) {
        this.aircraft.reset();
    }
    
    // Reset gate states
    this.gates.forEach(gate => gate.reset ? gate.reset() : console.warn('Gate reset method missing')); 
    
    // Set first gate target
    if (this.gates.length > 0) {
        this.gates[0].setTarget();
        this.gates[0].startPulseEffect();
    }
    
    this.gameStartTime = this.clock.getElapsedTime();
    
    // Update HUD for playing state
    if (this.hudElements) {
      this.hudElements.message.style.display = 'none';
      this.hudElements.result.style.display = 'none';
      this.hudElements.penalty.style.display = 'none'; // Hide penalty initially
    }
    
    // Ensure aircraft controls are active
    // Assuming InputHandler is managed correctly elsewhere

    console.log("Game started at time:", this.gameStartTime);
  }

  finishGame(endCondition = 'completed', reason = '') {
    if (this.gameState !== 'playing') return;
    console.log(`Finishing game... Condition: ${endCondition}, Reason: ${reason}`);
    this.gameState = 'finished';
    this.finalTime = this.clock.getElapsedTime() - this.gameStartTime;
    const finalAdjustedTime = this.finalTime + this.penaltyTime;

    console.log(`Raw Time: ${this.finalTime.toFixed(2)}s`);
    console.log(`Penalty: ${this.penaltyTime}s`);
    console.log(`Final Adjusted Time: ${finalAdjustedTime.toFixed(2)}s`);

    // Update and display results in HUD
    if (this.hudElements && this.hudElements.result) {
        // Set result title based on end condition
        let resultTitle = document.getElementById('result-title');
        if (resultTitle) {
            if (endCondition === 'crashed') {
                resultTitle.textContent = 'CRASHED!';
                resultTitle.style.color = 'red';
            } else {
                resultTitle.textContent = 'FINISH!';
                resultTitle.style.color = 'green';
            }
        }
        
        // Set reason text if provided
        let resultReason = document.getElementById('result-reason');
        if (resultReason && reason) {
            resultReason.textContent = reason;
            resultReason.style.display = 'block';
        } else if (resultReason) {
            resultReason.style.display = 'none';
        }
        
        document.getElementById('result-time').textContent = `${this.finalTime.toFixed(1)}s`;
        document.getElementById('result-penalty').textContent = `${this.penaltyTime}s`;
        document.getElementById('result-final-time').textContent = `${finalAdjustedTime.toFixed(1)}s`;
        document.getElementById('result-gates').textContent = `${this.currentGateIndex}/${this.gates.length}`; // Use current index for passed gates
        this.hudElements.result.style.display = 'block';
    }

    // Display a message about the end condition
    this.showEndConditionMessage(endCondition, reason);

    // Optional: Stop aircraft controls - should be implemented in future
    // this.inputHandler.disable(); 
  }

  // Show message about end condition
  showEndConditionMessage(endCondition, reason) {
    let message = '';
    
    if (endCondition === 'crashed') {
      message = `CRASHED: ${reason}`;
    } else {
      message = `FINISH: ${reason}`;
    }
    
    const notificationElement = document.createElement('div');
    notificationElement.textContent = message;
    notificationElement.style.position = 'absolute';
    notificationElement.style.top = '30%';
    notificationElement.style.left = '50%';
    notificationElement.style.transform = 'translate(-50%, -50%)';
    notificationElement.style.color = endCondition === 'crashed' ? 'red' : 'green';
    notificationElement.style.fontSize = '36px';
    notificationElement.style.fontWeight = 'bold';
    notificationElement.style.textAlign = 'center';
    notificationElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    notificationElement.style.zIndex = '1000';
    notificationElement.style.fontFamily = 'Arial, sans-serif';
    notificationElement.style.padding = '20px';
    notificationElement.style.borderRadius = '10px';
    notificationElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    
    document.body.appendChild(notificationElement);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notificationElement)) {
        document.body.removeChild(notificationElement);
      }
    }, 5000);
  }

  restartGame() {
    console.log("Restarting game...");
    
    // Reset game state variables
    this.penaltyTime = 0;
    this.currentGateIndex = 0;
    this.gameStartTime = 0;
    this.finalTime = 0;
    
    // Reset aircraft position/state
    if (this.aircraft) {
      this.aircraft.reset(); // Assuming aircraft has a reset method
      this.activeCamera = this.aircraft.getCamera(); // Re-assign camera after reset
    }
    
    // Reset gate states
    this.gates.forEach(gate => gate.reset ? gate.reset() : console.warn('Gate reset method missing')); 
    
    // Set the first gate as target again
    if (this.gates.length > 0) {
      this.gates[0].setTarget();
      this.gates[0].startPulseEffect();
    }
    
    // Make the target arrow visible again
    if (this.targetArrow) {
      this.targetArrow.visible = true;
    }
    
    // Set game state to ready
    this.gameState = 'ready';

    // Update HUD for ready state
    if (this.hudElements) {
      this.hudElements.result.style.display = 'none';
      this.hudElements.message.innerHTML = 'Air Race Challenge<br><span style="font-size: 20px">Press SPACE to Start</span>';
      this.hudElements.message.style.display = 'block';
      this.hudElements.timer.textContent = 'Time: 0.0s';
      this.hudElements.penalty.textContent = 'Penalty: 0s';
      this.hudElements.penalty.style.display = 'none';
      this.hudElements.gates.textContent = `Gates: 0/${this.gates.length}`;
    }

    console.log("Game ready to restart. Press SPACE to begin.");
  }

  // Method to check if the aircraft has touched the ground (end condition 1)
  checkGroundCollision() {
    if (!this.aircraft || this.gameState !== 'playing') return;
    
    const aircraftObject = this.aircraft.getObject();
    const aircraftPosition = new THREE.Vector3();
    aircraftObject.getWorldPosition(aircraftPosition);
    
    // Use the actual ground level from createGroundPlane
    const groundLevel = -5; // Correct ground level
    
    // Log aircraft position always to see what's happening
    console.log(`[DEBUG] Aircraft Y Position: ${aircraftPosition.y.toFixed(2)}, Ground Level: ${groundLevel}`);
    
    // Check if aircraft is at or below ground level threshold
    if (aircraftPosition.y <= groundLevel) {
      console.log('End condition: Aircraft crashed into the ground!');
      this.finishGame('crashed', 'Crash! Your aircraft hit the ground');
    }
  }
  
  // Method to check if the aircraft has crashed into the bridge (end condition 2)
  checkBridgeCollision() {
    if (!this.aircraft || !this.finishBridge || this.gameState !== 'playing') return;
    
    const aircraftObject = this.aircraft.getObject();
    const bridgeObject = this.finishBridge.getObject();
    
    // Get positions for debugging
    const aircraftPosition = new THREE.Vector3();
    aircraftObject.getWorldPosition(aircraftPosition);
    
    const bridgePosition = new THREE.Vector3();
    bridgeObject.getWorldPosition(bridgePosition);
    
    // Debug: Log positions when aircraft is near the bridge
    const distanceToBridge = aircraftPosition.distanceTo(bridgePosition);
    if (distanceToBridge < 100) {
      console.log(`[DEBUG] Bridge check - Distance: ${distanceToBridge.toFixed(2)}, Aircraft Z: ${aircraftPosition.z.toFixed(2)}, Bridge Z: ${bridgePosition.z.toFixed(2)}`);
    }
    
    // Create bounding boxes for collision detection
    const aircraftBounds = new THREE.Box3().setFromObject(aircraftObject);
    const bridgeBounds = new THREE.Box3().setFromObject(bridgeObject);
    
    // Check if the aircraft's bounding box intersects with the bridge's bounding box
    if (aircraftBounds.intersectsBox(bridgeBounds)) {
      console.log('End condition: Aircraft crashed into bridge');
      this.finishGame('crashed', 'Bridge collision');
    }
  }
  
  // Method to check if the aircraft has completed the course by flying under, next to, or above the bridge
  checkBridgeCompletion() {
    if (!this.aircraft || !this.finishBridge || this.gameState !== 'playing') return;
    
    const aircraftObject = this.aircraft.getObject();
    const aircraftPosition = new THREE.Vector3();
    aircraftObject.getWorldPosition(aircraftPosition);
    
    const bridgeObject = this.finishBridge.getObject();
    const bridgePosition = new THREE.Vector3();
    bridgeObject.getWorldPosition(bridgePosition);
    
    // Enhanced completion thresholds
    const bridgeZThreshold = bridgePosition.z + 20; // Aircraft must pass 20 units beyond bridge Z position
    const distanceThreshold = 40; // Must be within 40 units on X axis to count as "through"
    
    // Debug: Log when the aircraft is past or approaching the bridge
    if (aircraftPosition.z > bridgePosition.z - 50 && aircraftPosition.z < bridgePosition.z + 50) {
      console.log(`[DEBUG] Bridge completion check - Aircraft Z: ${aircraftPosition.z.toFixed(2)}, Bridge Z: ${bridgePosition.z.toFixed(2)}, Aircraft Y: ${aircraftPosition.y.toFixed(2)}`);
    }
    
    // Check if aircraft has passed the bridge's Z position
    if (aircraftPosition.z > bridgeZThreshold) {
      // Aircraft is past the bridge's Z position
      console.log(`[DEBUG] Aircraft passed bridge threshold! Lateral distance: ${Math.abs(aircraftPosition.x - bridgePosition.x).toFixed(2)}`);
      
      // Calculate the lateral (X-axis) distance from bridge center
      const lateralDistance = Math.abs(aircraftPosition.x - bridgePosition.x);
      
      // Improved bridge height detection based on actual bridge model
      const bridgeTopY = bridgePosition.y + 12; // Bridge top at ~12 units above base
      const bridgeBottomY = bridgePosition.y + 4; // Clear area starts ~4 units above base
      
      if (lateralDistance <= distanceThreshold) {
        // Aircraft is in line with the bridge
        if (aircraftPosition.y < bridgeBottomY) {
          // Flew under the bridge
          console.log('End condition: Aircraft flew under the bridge');
          this.finishGame('completed', 'Flew under bridge');
        } else if (aircraftPosition.y > bridgeTopY) {
          // Flew over the bridge
          console.log('End condition: Aircraft flew over the bridge');
          this.finishGame('completed', 'Flew over bridge');
        } else {
          // Flew through the bridge arch
          console.log('End condition: Aircraft flew through the bridge arch');
          this.finishGame('completed', 'Flew through bridge arch');
        }
      } else {
        // Flew past but not through the bridge (went around it)
        console.log('End condition: Aircraft flew around the bridge');
        this.finishGame('completed', 'Flew around bridge');
      }
    }
  }

  // Add a new method for showing guidance/instruction notifications with different styling
  showGuidanceNotification(message) {
    // Create a notification element
    const notificationElement = document.createElement('div');
    notificationElement.textContent = message;
    notificationElement.style.position = 'absolute';
    notificationElement.style.color = '#00BFFF'; // Light blue color
    notificationElement.style.fontSize = '24px';
    notificationElement.style.fontWeight = 'bold';
    notificationElement.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.7)';
    notificationElement.style.zIndex = '1010'; // Above other HUD elements
    notificationElement.style.opacity = '0'; // Start faded out
    notificationElement.style.transition = 'opacity 0.3s ease-in-out, top 2.5s ease-out';
    notificationElement.style.textAlign = 'center';
    notificationElement.style.width = '100%'; // Center horizontally
    notificationElement.style.pointerEvents = 'none'; // Don't block clicks

    document.body.appendChild(notificationElement);

    // Position calculation 
    notificationElement.style.left = '0'; 
    notificationElement.style.top = '30%'; // Position in middle of screen for better visibility

    // Fade in, hold, fade out
    setTimeout(() => {
      notificationElement.style.opacity = '1'; // Fade in
    }, 10); // Small delay to allow transition

    setTimeout(() => {
      notificationElement.style.opacity = '0'; // Start fade out
    }, 5000); // Hold for 5 seconds before fading out (longer than penalty notification)

    // Remove element after animation
    setTimeout(() => {
      if (notificationElement.parentNode) {
        notificationElement.parentNode.removeChild(notificationElement);
      }
    }, 5500); // Remove after 5.5 seconds
  }

  // EMERGENCY DIRECT TREES - Bypass the Tree class entirely
  createDirectTrees() {
    console.log('Creating 50 direct trees with THREE.js primitives...');
    
    // Ground level
    const groundY = -5;
    
    // Create trees at specific locations
    const fixedPositions = [
      { x: 0, z: 30 },
      { x: -20, z: 20 },
      { x: 20, z: 20 },
      { x: 0, z: 50 },
      { x: 50, z: 50 },
      { x: -50, z: 50 },
      { x: 50, z: -50 },
      { x: -50, z: -50 },
      { x: 100, z: 0 },
      { x: -100, z: 0 }
    ];
    
    // Create fixed-position trees
    for (const pos of fixedPositions) {
      this.createSingleTree(pos.x, groundY, pos.z);
      console.log(`Fixed tree created at (${pos.x}, ${groundY}, ${pos.z})`);
    }
    
    // Create additional random trees
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() * 400) - 200;
      const z = (Math.random() * 400) - 200;
      
      // Skip positions near the river (assuming river is roughly at x=0)
      if (Math.abs(x) < 15) continue;
      
      this.createSingleTree(x, groundY, z);
    }
    
    console.log('50 direct trees created with THREE.js primitives');
  }
  
  // Helper method to create a single tree
  createSingleTree(x, y, z) {
    // Create a tree trunk (cylinder)
    const trunkHeight = 30;
    const trunkGeometry = new THREE.CylinderGeometry(2, 3, trunkHeight, 8);
    const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0xA52A2A }); // Brown
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    
    // Position the trunk with base at ground level
    trunk.position.set(x, y + (trunkHeight / 2), z);
    this.scene.add(trunk);
    
    // Create a tree canopy (cone)
    const canopyHeight = 40;
    const canopyGeometry = new THREE.ConeGeometry(10, canopyHeight, 8);
    const canopyMaterial = new THREE.MeshBasicMaterial({ color: 0x00FF00 }); // Bright green
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    
    // Position the canopy on top of the trunk
    canopy.position.set(x, y + trunkHeight + (canopyHeight / 2) - 5, z);
    this.scene.add(canopy);
    
    // Create a marker sphere at the base
    const markerGeometry = new THREE.SphereGeometry(5, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x0000FF }); // Blue
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    // Position the marker at the base of the tree
    marker.position.set(x, y, z);
    this.scene.add(marker);
  }
}

export default GameEngine; 