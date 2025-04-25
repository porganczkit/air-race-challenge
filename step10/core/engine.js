// Core game engine
// This will handle the main game loop and Three.js setup 

import * as THREE from 'three';
import Aircraft from '../entities/aircraft.js';
import Gate from '../entities/gate.js';
import InputHandler from './input.js';

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
    this.createBridge(); // New for step 10: create the Chain Bridge
    
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
    
    // Add river
    this.createRiver();
  }
  
  // Bridge specific method for Step 10
  createBridge() {
    try {
      console.log('Creating Chain Bridge (Lánchíd)...');
      
      // Set the bridge dimensions
      const bridgeWidth = 30;
      const bridgeLength = 80;
      const bridgeHeight = 25;
      const bridgePosition = { x: 0, y: 5, z: 950 }; // Position at end of course
      
      // Create bridge materials
      const bridgeMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080, // Gray color for main structure
        roughness: 0.7,
        metalness: 0.5
      });
      
      const stoneMaterial = new THREE.MeshStandardMaterial({
        color: 0xA0A0A0, // Lighter gray for stone elements
        roughness: 0.9,
        metalness: 0.1
      });
      
      const chainMaterial = new THREE.MeshStandardMaterial({
        color: 0x505050, // Dark gray for chains
        roughness: 0.5,
        metalness: 0.8
      });
      
      // Create a container for all bridge components
      this.bridge = new THREE.Group();
      this.bridge.position.set(bridgePosition.x, bridgePosition.y, bridgePosition.z);
      
      // Create bridge roadway
      const roadwayGeometry = new THREE.BoxGeometry(bridgeWidth, 1.5, bridgeLength);
      const roadway = new THREE.Mesh(roadwayGeometry, bridgeMaterial);
      roadway.position.y = 0;
      roadway.castShadow = true;
      roadway.receiveShadow = true;
      this.bridge.add(roadway);
      
      // Create stone pillars (towers)
      const pillarWidth = 8;
      const pillarHeight = bridgeHeight;
      const pillarDepth = 8;
      const pillarSpacing = bridgeLength / 3;
      
      // Function to create a pillar
      const createPillar = (posX, posZ) => {
        const pillarGroup = new THREE.Group();
        
        // Main pillar body
        const pillarGeometry = new THREE.BoxGeometry(pillarWidth, pillarHeight, pillarDepth);
        const pillar = new THREE.Mesh(pillarGeometry, stoneMaterial);
        pillar.position.set(posX, pillarHeight / 2, posZ);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        pillarGroup.add(pillar);
        
        // Pillar ornamental top
        const topWidth = pillarWidth * 1.2;
        const topHeight = 4;
        const topGeometry = new THREE.BoxGeometry(topWidth, topHeight, pillarDepth * 1.2);
        const top = new THREE.Mesh(topGeometry, stoneMaterial);
        top.position.set(posX, pillarHeight + topHeight / 2, posZ);
        top.castShadow = true;
        top.receiveShadow = true;
        pillarGroup.add(top);
        
        return pillarGroup;
      };
      
      // Create four pillars
      const pillar1 = createPillar(-bridgeWidth/2 - pillarWidth/2, -pillarSpacing);
      const pillar2 = createPillar(bridgeWidth/2 + pillarWidth/2, -pillarSpacing);
      const pillar3 = createPillar(-bridgeWidth/2 - pillarWidth/2, pillarSpacing);
      const pillar4 = createPillar(bridgeWidth/2 + pillarWidth/2, pillarSpacing);
      
      this.bridge.add(pillar1);
      this.bridge.add(pillar2);
      this.bridge.add(pillar3);
      this.bridge.add(pillar4);
      
      // Create suspension chains
      const createChains = () => {
        const chainGroup = new THREE.Group();
        
        // Main suspension chains
        for (let i = 0; i < 2; i++) {
          const xPos = (i === 0) ? -bridgeWidth/2 - 2 : bridgeWidth/2 + 2;
          
          // Chain curve (catenary curve)
          const chainPoints = [];
          const segments = 20;
          for (let j = 0; j <= segments; j++) {
            const t = j / segments;
            const x = xPos;
            const z = -bridgeLength/2 + bridgeLength * t;
            // Catenary curve y = a * cosh(x/a), approximated here
            const y = pillarHeight - 8 * Math.cosh((t - 0.5) * 4) + 8;
            chainPoints.push(new THREE.Vector3(x, y, z));
          }
          
          const chainCurve = new THREE.CatmullRomCurve3(chainPoints);
          const chainGeometry = new THREE.TubeGeometry(chainCurve, 20, 0.5, 8, false);
          const chain = new THREE.Mesh(chainGeometry, chainMaterial);
          chain.castShadow = true;
          chainGroup.add(chain);
          
          // Create a parallel chain
          const chainPoints2 = chainPoints.map(p => new THREE.Vector3(p.x + (i === 0 ? 1 : -1), p.y, p.z));
          const chainCurve2 = new THREE.CatmullRomCurve3(chainPoints2);
          const chainGeometry2 = new THREE.TubeGeometry(chainCurve2, 20, 0.5, 8, false);
          const chain2 = new THREE.Mesh(chainGeometry2, chainMaterial);
          chain2.castShadow = true;
          chainGroup.add(chain2);
        }
        
        return chainGroup;
      };
      
      // Add chains
      const chains = createChains();
      this.bridge.add(chains);
      
      // Create vertical suspenders
      const createSuspenders = () => {
        const suspenderGroup = new THREE.Group();
        
        // Number of suspenders on each side
        const suspenderCount = 15;
        
        // Create vertical cables on both sides
        for (let i = 0; i < 2; i++) {
          const xPos = (i === 0) ? -bridgeWidth/2 - 2 : bridgeWidth/2 + 2;
          
          for (let j = 1; j < suspenderCount; j++) {
            // Skip suspenders directly at pillar positions
            if (j === Math.floor(suspenderCount/3) || j === Math.floor(2*suspenderCount/3)) {
              continue;
            }
            
            const zPos = -bridgeLength/2 + (bridgeLength * j) / suspenderCount;
            const t = j / suspenderCount;
            // Calculate height using same catenary formula
            const yTop = pillarHeight - 8 * Math.cosh((t - 0.5) * 4) + 8;
            
            // Vertical suspender
            const suspenderGeometry = new THREE.CylinderGeometry(0.2, 0.2, yTop, 6);
            const suspender = new THREE.Mesh(suspenderGeometry, chainMaterial);
            suspender.position.set(xPos, yTop/2, zPos);
            suspender.castShadow = true;
            suspenderGroup.add(suspender);
            
            // Add parallel suspender
            const suspender2 = suspender.clone();
            suspender2.position.set(xPos + (i === 0 ? 1 : -1), yTop/2, zPos);
            suspenderGroup.add(suspender2);
          }
        }
        
        return suspenderGroup;
      };
      
      // Add suspenders
      const suspenders = createSuspenders();
      this.bridge.add(suspenders);
      
      // Create some cross-bracing between the towers
      const createCrossBracing = () => {
        const bracingGroup = new THREE.Group();
        
        // Cross braces on towers
        for (let i = 0; i < 2; i++) {
          const zPos = (i === 0) ? -pillarSpacing : pillarSpacing;
          
          // Diagonal braces
          const braceGeometry = new THREE.BoxGeometry(bridgeWidth + pillarWidth*2, 1, 1);
          const brace1 = new THREE.Mesh(braceGeometry, bridgeMaterial);
          brace1.position.set(0, pillarHeight * 0.75, zPos);
          brace1.castShadow = true;
          bracingGroup.add(brace1);
          
          const brace2 = new THREE.Mesh(braceGeometry, bridgeMaterial);
          brace2.position.set(0, pillarHeight * 0.5, zPos);
          brace2.castShadow = true;
          bracingGroup.add(brace2);
          
          const brace3 = new THREE.Mesh(braceGeometry, bridgeMaterial);
          brace3.position.set(0, pillarHeight * 0.25, zPos);
          brace3.castShadow = true;
          bracingGroup.add(brace3);
        }
        
        return bracingGroup;
      };
      
      // Add cross-bracing
      const bracing = createCrossBracing();
      this.bridge.add(bracing);
      
      // Add some railings along the bridge
      const createRailings = () => {
        const railingGroup = new THREE.Group();
        
        for (let i = 0; i < 2; i++) {
          const xPos = (i === 0) ? -bridgeWidth/2 + 1 : bridgeWidth/2 - 1;
          
          // Railing
          const railingGeometry = new THREE.BoxGeometry(0.5, 1.5, bridgeLength);
          const railing = new THREE.Mesh(railingGeometry, bridgeMaterial);
          railing.position.set(xPos, 2.25, 0);
          railing.castShadow = true;
          railingGroup.add(railing);
          
          // Posts
          const postCount = 20;
          for (let j = 0; j <= postCount; j++) {
            const zPos = -bridgeLength/2 + (bridgeLength * j) / postCount;
            
            const postGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
            const post = new THREE.Mesh(postGeometry, bridgeMaterial);
            post.position.set(xPos, 1.75, zPos);
            post.castShadow = true;
            railingGroup.add(post);
          }
        }
        
        return railingGroup;
      };
      
      // Add railings
      const railings = createRailings();
      this.bridge.add(railings);
      
      // Add the bridge to the scene
      this.scene.add(this.bridge);
      
      // Create collision box for bridge
      this.bridgeCollisionBox = new THREE.Box3().setFromObject(this.bridge);
      
      console.log('Chain Bridge created successfully');
    } catch (error) {
      console.error('Error creating bridge:', error);
    }
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
        cloudGroup.position.z = (Math.random() - 0.5) * 900; // Spread clouds further beyond bridge
        
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
      
      // Ensure the last gate is positioned before the bridge
      const bridgePosition = 950;
      const finalGatePosition = bridgePosition - 100; // Position last gate 100 units before bridge
      
      // Generate gates with semi-random placement and increasing difficulty
      for (let i = 0; i < gateCount; i++) {
        // Calculate progression factor (0 to 1) to increase difficulty
        const progressFactor = i / (gateCount - 1);
        
        // Determine z position (distance along the course)
        // First few gates are easier to find, last gate is fixed before bridge
        let zPosition;
        if (i === gateCount - 1) {
          // Last gate is positioned before the bridge
          zPosition = finalGatePosition;
        } else {
          // Distribute other gates along the course
          const availableCourseLength = finalGatePosition - startZ;
          zPosition = startZ + (availableCourseLength * (progressFactor * 0.95));
        }
        
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
          
          // Last gate should be aligned with the bridge
          if (i === gateCount - 1) {
            x = 0; // Center gate with bridge
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
          const fallbackX = (i === gateCount - 1) ? 0 : (Math.random() * 2 - 1) * 20;
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
          cloud.group.position.z = (Math.random() - 0.5) * 900; // Include bridge area
          cloud.group.position.y = 15 + Math.random() * 20;
        }
        
        // Bob clouds up and down
        cloud.group.position.y = cloud.startY + Math.sin(elapsedTime * cloud.bobSpeed) * cloud.bobHeight;
      }
      
      // Check for gate collisions if aircraft exists
      if (this.aircraft && this.gates.length > 0) {
        this.checkGateCollisions();
      }
      
      // Check for bridge collision
      if (this.aircraft && this.bridge) {
        this.checkBridgeCollision();
      }
    } catch (error) {
      console.error('Error in update loop:', error);
    }
  }
  
  checkBridgeCollision() {
    // Get aircraft position
    const aircraftObject = this.aircraft.getObject();
    const aircraftPosition = new THREE.Vector3();
    aircraftObject.getWorldPosition(aircraftPosition);
    
    // Create a bounding box for the aircraft
    const aircraftBounds = new THREE.Box3().setFromObject(aircraftObject);
    
    // Check if aircraft is near the bridge
    const bridgePosition = this.bridge.position;
    const distance = aircraftPosition.distanceTo(bridgePosition);
    
    if (distance < 150) { // Only check collisions when near the bridge
      // Update bridge collision box
      this.bridgeCollisionBox = new THREE.Box3().setFromObject(this.bridge);
      
      // Check for intersection with bridge
      if (aircraftBounds.intersectsBox(this.bridgeCollisionBox)) {
        console.log('Aircraft collided with bridge!');
        // Handle collision - could end the game or add penalty
      }
      
      // Check if aircraft has flown under the bridge
      // We'll check if the aircraft has passed through a plane positioned at the bridge's z-position
      if (aircraftPosition.z > bridgePosition.z && 
          aircraftPosition.y < bridgePosition.y + 5 && // Aircraft is below bridge deck height
          Math.abs(aircraftPosition.x - bridgePosition.x) < 15) { // Aircraft is within bridge width
        
        console.log('Aircraft successfully flew under the bridge!');
        // Handle successful bridge pass - could mark course completion
      }
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
}

export default GameEngine; 