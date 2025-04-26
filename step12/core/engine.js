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
    
    // Initialize game state
    this.gameState = 'initializing'; // Start with initializing state
    console.log('Game state initialized to:', this.gameState);
    this.score = 0;
    this.timeBonus = 0;
    this.gatesPassed = 0;
    this.totalGates = 0;
    this.timePenalties = 0;
    
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
    this.setupHUD(); // Setup HUD and game controls
    
    // Set game state to ready after initialization
    this.gameState = 'ready';
    console.log('Game engine initialized successfully, ready for player input. Game state:', this.gameState);
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
      
      // Rotate the bridge 90 degrees counter-clockwise around the Y axis
      this.bridge.rotation.y = -Math.PI / 2;
      
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
      console.log('Starting aircraft setup...');
      
      // Remove test cube if it exists
      if (this.cube) {
        this.scene.remove(this.cube);
        const index = this.objects.indexOf(this.cube);
        if (index !== -1) {
          this.objects.splice(index, 1);
        }
      }
      
      // Create aircraft with input handler
      console.log('Creating aircraft with input handler:', this.inputHandler);
      this.aircraft = new Aircraft(this.inputHandler);
      
      if (!this.aircraft) {
        console.error('Failed to create aircraft instance!');
        throw new Error('Aircraft creation failed');
      }
      
      // Check if aircraft object was created properly
      const aircraftObject = this.aircraft.getObject();
      if (!aircraftObject) {
        console.error('Aircraft object is null or undefined!');
        throw new Error('Aircraft object not created properly');
      }
      
      console.log('Aircraft object created successfully:', aircraftObject);
      
      // Add aircraft to scene
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
      if (!this.activeCamera) {
        console.error('Aircraft camera is null or undefined!');
        throw new Error('Aircraft camera not created properly');
      }
      
      // Position aircraft at starting point
      aircraftObject.position.set(0, 10, -20); // Higher altitude to match the flat ground
      
      console.log('Aircraft setup complete');
      
      // Add a debug object to confirm rendering is working
      const debugSphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      debugSphere.position.set(0, 10, -15); // Position slightly in front of aircraft
      this.scene.add(debugSphere);
      
    } catch (error) {
      console.error('Error setting up aircraft:', error);
      // Create a visible error message on screen
      const errorMsg = document.createElement('div');
      errorMsg.style.position = 'absolute';
      errorMsg.style.top = '100px';
      errorMsg.style.left = '50%';
      errorMsg.style.transform = 'translateX(-50%)';
      errorMsg.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
      errorMsg.style.color = 'white';
      errorMsg.style.padding = '10px';
      errorMsg.style.borderRadius = '5px';
      errorMsg.style.zIndex = '1000';
      errorMsg.textContent = `Aircraft setup error: ${error.message}`;
      document.body.appendChild(errorMsg);
    }
  }

  setupGates() {
    try {
      // Clear any existing gates first
      for (let i = 0; i < this.gates.length; i++) {
        const gate = this.gates[i];
        if (gate.getObject) {
          this.scene.remove(gate.getObject());
        }
      }
      this.gates = [];
      
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
            // Since bridge is rotated 90 degrees, we need to adjust the alignment
            // Now the bridge extends along the X-axis instead of Z-axis
            x = 0; // Center gate with the front of the rotated bridge
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
      
      // Initialize gate counters
      this.currentGateIndex = 0;
      this.gatesPassed = 0;
      this.totalGates = this.gates.length;
      
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

      // Animate explosion effects
      if (this.effects) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
          const effect = this.effects[i];
          
          if (effect.type === 'explosion') {
            const timeSinceStart = this.elapsedTime - effect.startTime;
            
            // Update each particle in the explosion
            effect.group.children.forEach(particle => {
              // Move particle outward
              particle.position.add(
                particle.userData.direction.clone().multiplyScalar(
                  particle.userData.speed * this.deltaTime
                )
              );
              
              // Rotate particle
              particle.rotation.x += particle.userData.rotationSpeed;
              particle.rotation.y += particle.userData.rotationSpeed;
              
              // Fade out particle
              const lifePercent = timeSinceStart / effect.duration;
              particle.material.opacity = Math.max(0, 0.8 * (1 - lifePercent));
              
              // Scale down particle at the end
              if (lifePercent > 0.7) {
                const scaleDown = 1 - ((lifePercent - 0.7) / 0.3);
                particle.scale.set(scaleDown, scaleDown, scaleDown);
              }
            });
            
            // Remove explosion when done
            if (timeSinceStart >= effect.duration) {
              this.scene.remove(effect.group);
              this.effects.splice(i, 1);
            }
          }
        }
      }

      // Render the scene
      this.renderer.render(this.scene, this.activeCamera);
    } catch (error) {
      console.error('Error in animation loop:', error);
    }
  }

  update(deltaTime, elapsedTime) {
    // Only update when game is active
    if (this.gameState !== 'playing') return;
    
    // Update river flow animation
    if (this.river && this.riverFlowSpeed) {
      this.riverOffset += deltaTime * this.riverFlowSpeed;
      if (this.river.material.map) {
        this.river.material.map.offset.set(0, this.riverOffset);
      }
    }
    
    // Update clouds - simple animation
    for (let i = 0; i < this.clouds.length; i++) {
      const cloud = this.clouds[i];
      cloud.group.position.x += cloud.speed * deltaTime;
      
      // Add slight vertical bobbing effect
      cloud.group.position.y = cloud.startY + Math.sin(elapsedTime * cloud.bobSpeed) * cloud.bobHeight;
      
      // Wrap clouds around when they move too far
      if (cloud.group.position.x > 300) {
        cloud.group.position.x = -300;
      }
    }
    
    // Update player's aircraft
    if (this.aircraft) {
      this.aircraft.update(deltaTime);
    }
    
    // Pulse gates for visual effect
    if (this.gates) {
      for (const gate of this.gates) {
        gate.update(deltaTime, elapsedTime);
      }
    }
    
    // Check for collisions with gates
    this.checkGateCollisions();
    
    // Check for collision with ground
    this.checkGroundCollision();
    
    // Check for collisions with the bridge
    this.checkBridgeCollision();
    
    // Update HUD information
    this.updateHUD();
  }
  
  // Check if the aircraft has hit the ground
  checkGroundCollision() {
    if (!this.aircraft || this.gameState !== 'playing') return;
    
    const aircraftObject = this.aircraft.getObject();
    const aircraftPosition = new THREE.Vector3();
    aircraftObject.getWorldPosition(aircraftPosition);
    
    // Use the actual ground level from createGroundPlane
    const groundLevel = -5; // Ground plane is at y=-5
    
    // Log aircraft position for debugging
    console.log(`[DEBUG] Aircraft Y Position: ${aircraftPosition.y.toFixed(2)}, Ground Level: ${groundLevel}`);
    
    // Check if aircraft is at or below ground level
    if (aircraftPosition.y <= groundLevel) {
      console.log('Aircraft crashed into the ground!');
      this.finishGame('crashed', 'You crashed into the ground!');
      
      // Show collision effect
      this.showCollisionEffect(aircraftPosition);
    }
  }
  
  checkBridgeCollision() {
    // Only check for collisions if the game is playing and both aircraft and bridge exist
    if (this.gameState !== 'playing' || !this.aircraft || !this.bridge) return;
    
    const aircraftObject = this.aircraft.getObject();
    const aircraftPosition = aircraftObject.position.clone();
    const bridgePosition = this.bridge.position.clone();
    
    // Simple collision detection based on distance
    const distanceToCenter = aircraftPosition.distanceTo(bridgePosition);
    const collisionThreshold = 40; // Adjust based on bridge size
    
    if (distanceToCenter < collisionThreshold) {
      // More precise check - does aircraft pass through the road?
      const aircraftY = aircraftPosition.y;
      const bridgeY = bridgePosition.y;
      
      // Bridge height from ground + road thickness
      const roadwayY = bridgeY + 12;
      
      // Check if aircraft is under the bridge (Y position)
      if (aircraftY > bridgeY && aircraftY < roadwayY) {
        // Since the bridge is rotated 90° left (counter-clockwise), 
        // we need to check if the aircraft passed through the side of the bridge
        // For a 90° rotation, the bridge length is now along the X axis instead of Z axis
        
        // Calculate aircraft position relative to bridge center
        const relativeX = Math.abs(aircraftPosition.x - bridgePosition.x);
        
        // Bridge dimensions (after rotation)
        const bridgeWidth = 30; // This is now along the Z axis
        const bridgeLength = 80; // This is now along the X axis
        
        // Check if aircraft is within the bridge boundaries
        if (relativeX < bridgeLength/2 && 
            Math.abs(aircraftPosition.z - bridgePosition.z) < bridgeWidth/2) {
          // Successful navigation under bridge
          console.log('Successfully navigated under bridge!');
          
          // Add points for successful bridge navigation
          if (!this.bridgeCleared) {
            this.bridgeCleared = true;
            this.score += 250;
            this.showPointsEarned(bridgePosition, 250);
          }
        }
      } else if (aircraftY <= bridgeY + 30) {
        // Collision with bridge!
        console.log('Collision with bridge!');
        this.showCollisionEffect(aircraftPosition);
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
      
      // Check for collision with gate structure (poles)
      // Get the gate's poles collision boxes
      const gatePolesCollision = currentGate.getPolesCollisionBoxes();
      if (gatePolesCollision && gatePolesCollision.length > 0) {
        for (const poleBox of gatePolesCollision) {
          const poleBounds = new THREE.Box3().setFromObject(poleBox);
          
          // Check for collision with pole
          if (aircraftBounds.intersectsBox(poleBounds)) {
            console.log(`Crashed into gate ${this.currentGateIndex + 1} pole!`);
            this.finishGame('crashed', 'You crashed into a gate!');
            
            // Show collision effect at aircraft position
            this.showCollisionEffect(aircraftPosition);
            return; // Exit after crash
          }
        }
      }
    } else if (aircraftPosition.z > gatePosition.z + 20) {
      // Aircraft has passed the gate's Z position by a margin without going through it
      // This means the gate was missed - trigger the missed gate penalty
      console.log(`Missed gate ${this.currentGateIndex + 1}`);
      this.gateMissed(currentGate);
    }
  }
  
  gateCompleted(gate) {
    // Award points for passing through the gate
    const basePoints = 100;
    const timeBonus = Math.max(0, 50 - Math.floor(this.elapsedTime - this.gameStartTime));
    const gatePoints = basePoints + timeBonus;
    
    // Increment the completed gates counter
    this.gatesPassed++;
    
    // Show points earned
    this.showPointsEarned(gate.position, gatePoints);
    
    // Mark gate as completed - only change the gate's appearance
    gate.setCompleted();
    
    // Add points to score
    this.score += gatePoints;
    
    // Advance to next gate if there is one
    this.currentGateIndex++;
    if (this.currentGateIndex < this.gates.length) {
      this.gates[this.currentGateIndex].setTarget();
    } else {
      // All gates completed, but don't finish the game - just show a success message
      this.showCourseCompleteNotification();
      
      // Add bonus points for completing the course
      const courseCompletionBonus = 500;
      this.score += courseCompletionBonus;
      this.showPointsEarned(gate.position, courseCompletionBonus);
    }
    
    console.log(`Gate ${this.currentGateIndex} completed (${this.gatesPassed}/${this.totalGates}), earned ${gatePoints} points`);
  }
  
  gateMissed(gate) {
    // Apply penalty for missing a gate (Step 12)
    const timePenalty = 10; // 10 seconds penalty
    
    // Mark gate as missed
    gate.setMissed();
    
    // Show penalty notification
    this.showPenaltyNotification(gate.position);
    
    // Advance to next gate if there is one
    this.currentGateIndex++;
    if (this.currentGateIndex < this.gates.length) {
      this.gates[this.currentGateIndex].setTarget();
    } else {
      // All gates processed, finish the race!
      this.finishGame();
    }
    
    // Store the penalty to be applied to final time
    if (!this.timePenalties) this.timePenalties = 0;
    this.timePenalties += timePenalty;
    
    console.log(`Gate ${this.currentGateIndex} missed (${this.gatesPassed}/${this.totalGates}), applied ${timePenalty}s penalty. Total penalties: ${this.timePenalties}s`);
  }
  
  showPointsEarned(position, points) {
    // Create a floating points indicator
    const pointsElement = document.createElement('div');
    pointsElement.textContent = `+${points}`;
    pointsElement.style.position = 'absolute';
    pointsElement.style.color = 'gold';
    pointsElement.style.fontSize = '24px';
    pointsElement.style.fontWeight = 'bold';
    pointsElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)';
    pointsElement.style.zIndex = '1000';
    pointsElement.style.opacity = '1';
    pointsElement.style.transition = 'top 1s ease-out, opacity 1s ease-out';
    document.body.appendChild(pointsElement);
    
    // Convert 3D position to screen position
    const screenPosition = this.getScreenPosition(position);
    pointsElement.style.left = `${screenPosition.x}px`;
    pointsElement.style.top = `${screenPosition.y}px`;
    
    // Animate the points floating up and fading out
    setTimeout(() => {
      pointsElement.style.top = `${screenPosition.y - 100}px`;
      pointsElement.style.opacity = '0';
    }, 10);
    
    // Remove element after animation
    setTimeout(() => {
      if (pointsElement.parentNode) {
        pointsElement.parentNode.removeChild(pointsElement);
      }
    }, 1000);
  }
  
  getScreenPosition(position) {
    // Convert 3D position to screen coordinates
    const vector = new THREE.Vector3(position.x, position.y, position.z);
    vector.project(this.activeCamera);
    
    return {
      x: (vector.x * 0.5 + 0.5) * window.innerWidth,
      y: (-(vector.y * 0.5) + 0.5) * window.innerHeight
    };
  }

  setupHUD() {
    // Create HUD elements
    this.hudElements = {};
    
    // Create HUD container
    const hudContainer = document.createElement('div');
    hudContainer.id = 'hud-container';
    hudContainer.style.position = 'absolute';
    hudContainer.style.top = '0';
    hudContainer.style.left = '0';
    hudContainer.style.width = '100%';
    hudContainer.style.pointerEvents = 'none';
    hudContainer.style.zIndex = '100';
    hudContainer.style.fontFamily = 'Arial, sans-serif';
    hudContainer.style.fontSize = '16px';
    document.body.appendChild(hudContainer);
    
    // Score display
    const scoreElement = document.createElement('div');
    scoreElement.id = 'score-display';
    scoreElement.style.position = 'absolute';
    scoreElement.style.top = '20px';
    scoreElement.style.left = '20px';
    scoreElement.style.color = 'white';
    scoreElement.style.fontSize = '24px';
    scoreElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    scoreElement.textContent = 'Score: 0';
    hudContainer.appendChild(scoreElement);
    this.hudElements.score = scoreElement;
    
    // Timer display
    const timerElement = document.createElement('div');
    timerElement.id = 'timer-display';
    timerElement.style.position = 'absolute';
    timerElement.style.top = '20px';
    timerElement.style.right = '20px';
    timerElement.style.color = 'white';
    timerElement.style.fontSize = '24px';
    timerElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    timerElement.textContent = 'Time: 0.0s';
    hudContainer.appendChild(timerElement);
    this.hudElements.timer = timerElement;
    
    // Gate counter
    const gateElement = document.createElement('div');
    gateElement.id = 'gate-counter';
    gateElement.style.position = 'absolute';
    gateElement.style.top = '60px';
    gateElement.style.left = '20px';
    gateElement.style.color = 'white';
    gateElement.style.fontSize = '20px';
    gateElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    gateElement.textContent = 'Gates: 0/0';
    hudContainer.appendChild(gateElement);
    this.hudElements.gates = gateElement;
    
    // Speed indicator
    const speedElement = document.createElement('div');
    speedElement.id = 'speed-indicator';
    speedElement.style.position = 'absolute';
    speedElement.style.bottom = '20px';
    speedElement.style.right = '20px';
    speedElement.style.color = 'white';
    speedElement.style.fontSize = '20px';
    speedElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    speedElement.textContent = 'Speed: 0 km/h';
    hudContainer.appendChild(speedElement);
    this.hudElements.speed = speedElement;
    
    // Game state message (start, finish, etc.)
    const messageElement = document.createElement('div');
    messageElement.id = 'game-message';
    messageElement.style.position = 'absolute';
    messageElement.style.top = '50%';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translate(-50%, -50%)';
    messageElement.style.color = 'white';
    messageElement.style.fontSize = '36px';
    messageElement.style.textAlign = 'center';
    messageElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    messageElement.style.display = 'none'; // Hide by default, we're using the custom message in main.js
    messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    messageElement.style.padding = '20px';
    messageElement.style.borderRadius = '10px';
    messageElement.innerHTML = ''; // Empty as we're using our own message
    hudContainer.appendChild(messageElement);
    this.hudElements.message = messageElement;
    
    // Create result screen (hidden initially)
    const resultElement = document.createElement('div');
    resultElement.id = 'result-screen';
    resultElement.style.position = 'absolute';
    resultElement.style.top = '50%';
    resultElement.style.left = '50%';
    resultElement.style.transform = 'translate(-50%, -50%)';
    resultElement.style.color = 'white';
    resultElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    resultElement.style.padding = '20px';
    resultElement.style.borderRadius = '10px';
    resultElement.style.fontSize = '24px';
    resultElement.style.textAlign = 'center';
    resultElement.style.display = 'none';
    resultElement.innerHTML = `
      <h2>Course Complete!</h2>
      <p>Your Time: <span id="result-time">0.0s</span></p>
      <p>Gates Passed: <span id="result-gates">0/0</span></p>
      <p>Final Score: <span id="result-score">0</span></p>
      <p>Best Time: <span id="result-best-time">None</span></p>
      <p style="margin-top: 20px; font-size: 28px; color: #4CAF50;">Press SPACE to restart</p>
    `;
    hudContainer.appendChild(resultElement);
    this.hudElements.result = resultElement;
    
    // Setup space key to handle both starting and restarting the game
    document.addEventListener('keydown', (event) => {
      console.log(`Key pressed: ${event.code}, Current game state: ${this.gameState}`);
      if (event.code === 'Space') {
        if (this.gameState === 'ready') {
          console.log('Space key detected, starting game!');
          this.startGame();
        } else if (this.gameState === 'completed' || this.gameState === 'crashed' || this.gameState === 'playing') {
          console.log('Space key pressed - restarting game');
          this.restartGame();
        }
      }
    });
    
    // Add a start button as a fallback
    const startButton = document.createElement('button');
    startButton.textContent = 'Start Game';
    startButton.style.position = 'absolute';
    startButton.style.bottom = '20px';
    startButton.style.left = '50%';
    startButton.style.transform = 'translateX(-50%)';
    startButton.style.padding = '10px 20px';
    startButton.style.fontSize = '18px';
    startButton.style.backgroundColor = '#4CAF50';
    startButton.style.border = 'none';
    startButton.style.borderRadius = '5px';
    startButton.style.color = 'white';
    startButton.style.cursor = 'pointer';
    startButton.style.zIndex = '1000';
    startButton.style.pointerEvents = 'auto';
    
    startButton.addEventListener('click', () => {
      if (this.gameState === 'ready') {
        console.log('Start button clicked, starting game!');
        this.startGame();
      }
    });
    
    hudContainer.appendChild(startButton);
    this.hudElements.startButton = startButton;
    
    console.log('HUD setup complete');
  }
  
  updateHUD() {
    // Only update if we have HUD elements
    if (!this.hudElements) return;
    
    // Update score
    this.hudElements.score.textContent = `Score: ${this.score}`;
    
    // Update time if game is running
    if (this.gameState === 'playing') {
      const currentTime = this.clock.getElapsedTime() - this.gameStartTime;
      this.hudElements.timer.textContent = `Time: ${currentTime.toFixed(1)}s`;
    }
    
    // Update gate counter - display completed/total gates
    this.hudElements.gates.textContent = `Gates: ${this.gatesPassed}/${this.totalGates}`;
    
    // Update speed if aircraft exists
    if (this.aircraft) {
      const speed = Math.round(this.aircraft.forwardSpeed * 3.6); // Convert to km/h
      this.hudElements.speed.textContent = `Speed: ${speed} km/h`;
    }
  }
  
  startGame() {
    console.log('startGame method called, current state:', this.gameState);
    
    // Only start the game if it's in the 'ready' state
    if (this.gameState !== 'ready') {
      console.log('Cannot start game: game state is not ready. Current state:', this.gameState);
      return;
    }
    
    // Reset game variables
    this.score = 0;
    this.gatesPassed = 0;
    this.currentGateIndex = 0;
    this.timePenalties = 0;
    this.gameStartTime = this.clock.getElapsedTime();
    
    // Reset gates
    if (this.gates && this.gates.length > 0) {
      console.log(`Resetting ${this.gates.length} gates`);
      for (const gate of this.gates) {
        gate.reset();
      }
      
      // Set first gate as target
      this.gates[0].setTarget();
      this.totalGates = this.gates.length;
    } else {
      console.warn('No gates found to reset');
    }
    
    // Hide the welcome message
    if (this.hudElements && this.hudElements.message) {
      this.hudElements.message.style.display = 'none';
    }
    
    // Hide any other HUD elements that should be hidden
    if (this.hudElements && this.hudElements.startButton) {
      this.hudElements.startButton.style.display = 'none';
    }
    
    // Change game state to playing
    this.gameState = 'playing';
    
    console.log(`Game started! State changed to: ${this.gameState}`);
    console.log(`Game has ${this.totalGates} gates, starting from gate index ${this.currentGateIndex}`);
  }
  
  finishGame(endCondition = 'completed', reason = '') {
    // Only finish if the game is currently playing
    if (this.gameState !== 'playing') return;
    
    console.log(`Game finishing with condition: ${endCondition}, reason: ${reason}`);
    
    // Calculate final time
    const endTime = this.clock.getElapsedTime();
    const totalTime = endTime - this.gameStartTime + this.timePenalties;
    const formattedTime = totalTime.toFixed(1);
    
    // Update game state
    this.gameState = endCondition; // Set to 'completed' or 'crashed'
    
    // Check if this is a new best time
    let bestTime = localStorage.getItem('bestTime');
    let newBest = false;
    
    if (!bestTime || parseFloat(totalTime) < parseFloat(bestTime)) {
      localStorage.setItem('bestTime', totalTime);
      bestTime = totalTime;
      newBest = true;
    }
    
    // Show result screen
    this.hudElements.result.style.display = 'block';
    
    // Update result information
    document.getElementById('result-time').textContent = `${formattedTime}s`;
    document.getElementById('result-gates').textContent = `${this.gatesPassed}/${this.totalGates}`;
    document.getElementById('result-score').textContent = this.score;
    document.getElementById('result-best-time').textContent = `${parseFloat(bestTime).toFixed(1)}s${newBest ? ' (New Best!)' : ''}`;
    
    // Show custom message based on end condition
    const resultTitle = document.querySelector('#result-screen h2');
    if (resultTitle) {
      if (endCondition === 'completed') {
        resultTitle.textContent = 'Course Complete!';
        resultTitle.style.color = '#4CAF50'; // Green for success
      } else if (endCondition === 'crashed') {
        resultTitle.textContent = 'Aircraft Crashed!';
        resultTitle.style.color = '#f44336'; // Red for crash
        
        // Add crash reason if provided
        if (reason) {
          const reasonElement = document.createElement('p');
          reasonElement.textContent = reason;
          reasonElement.style.color = '#f44336';
          reasonElement.style.fontSize = '18px';
          reasonElement.style.marginTop = '5px';
          resultTitle.parentNode.insertBefore(reasonElement, resultTitle.nextSibling);
        }
      }
    }
    
    console.log(`Game ended. Final time: ${formattedTime}s, Score: ${this.score}, Gates: ${this.gatesPassed}/${this.totalGates}`);
  }
  
  restartGame() {
    // Hide result screen
    if (this.hudElements.result) {
      this.hudElements.result.style.display = 'none';
    }
    
    // Show start message
    if (this.hudElements.message) {
      this.hudElements.message.style.display = 'block';
    }
    
    // Reset aircraft position
    if (this.aircraft) {
      const aircraftObject = this.aircraft.getObject();
      aircraftObject.position.set(0, 10, -20);
      aircraftObject.rotation.set(0, 0, 0);
    }
    
    // Set game state to ready
    this.gameState = 'ready';
    
    console.log('Game reset and ready to start again');
  }

  showPenaltyNotification(position) {
    // Create a penalty notification element
    const penaltyElement = document.createElement('div');
    penaltyElement.textContent = "✖ MISSED GATE – Time Penalty +10s";
    penaltyElement.style.position = 'absolute';
    penaltyElement.style.top = '25%';
    penaltyElement.style.left = '50%';
    penaltyElement.style.transform = 'translate(-50%, -50%)';
    penaltyElement.style.color = 'red';
    penaltyElement.style.fontSize = '24px';
    penaltyElement.style.fontWeight = 'bold';
    penaltyElement.style.textAlign = 'center';
    penaltyElement.style.background = 'rgba(0, 0, 0, 0.5)';
    penaltyElement.style.padding = '10px 20px';
    penaltyElement.style.borderRadius = '5px';
    penaltyElement.style.zIndex = '1000';
    penaltyElement.style.opacity = '0';
    penaltyElement.style.transition = 'opacity 0.3s ease-in, opacity 0.5s ease-out 2s';
    document.body.appendChild(penaltyElement);
    
    // Play an alert sound using Web Audio API instead of an MP3 file
    try {
      // Create a short beep sound using the Web Audio API
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'square'; // Type of waveform
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A high pitched sound
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime); // Setting volume
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      // Start sound and stop after 300ms
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play alert sound:', error);
    }
    
    // Show the notification with a fade-in effect
    setTimeout(() => {
      penaltyElement.style.opacity = '1';
    }, 10);
    
    // Remove the notification after 3 seconds
    setTimeout(() => {
      if (penaltyElement.parentNode) {
        penaltyElement.style.opacity = '0';
        setTimeout(() => {
          if (penaltyElement.parentNode) {
            penaltyElement.parentNode.removeChild(penaltyElement);
          }
        }, 500); // Remove after fade-out completes
      }
    }, 2500);
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

  showCollisionEffect(position) {
    // Create explosion at collision point
    const explosionGroup = new THREE.Group();
    explosionGroup.position.copy(position);
    
    // Create multiple particle bursts for the explosion
    const particleCount = 20;
    const particleSize = 1.5;
    const particleSpeed = 10;
    
    for (let i = 0; i < particleCount; i++) {
      // Random direction for each particle
      const direction = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();
      
      // Create particle
      const particleGeometry = new THREE.BoxGeometry(particleSize, particleSize, particleSize);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF5500, // Orange-red color
        transparent: true,
        opacity: 0.8
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      explosionGroup.add(particle);
      
      // Store particle data for animation
      particle.userData = {
        direction: direction,
        speed: particleSpeed * (0.5 + Math.random() * 0.5),
        rotationSpeed: Math.random() * 0.2,
        startTime: this.elapsedTime
      };
    }
    
    this.scene.add(explosionGroup);
    
    // Add to a list of effects to be animated
    if (!this.effects) this.effects = [];
    this.effects.push({
      type: 'explosion',
      group: explosionGroup,
      startTime: this.elapsedTime,
      duration: 2.0
    });
    
    // Apply damage to the aircraft
    this.handleCollisionDamage();
  }
  
  handleCollisionDamage() {
    // Handle player damage - in this implementation we'll just lose some points
    const penaltyPoints = 100;
    this.score = Math.max(0, this.score - penaltyPoints);
    
    // Show penalty
    if (this.hudElements && this.hudElements.score) {
      const penaltyElement = document.createElement('div');
      penaltyElement.textContent = `-${penaltyPoints}`;
      penaltyElement.style.position = 'absolute';
      penaltyElement.style.top = '100px';
      penaltyElement.style.left = '20px';
      penaltyElement.style.color = 'red';
      penaltyElement.style.fontSize = '24px';
      penaltyElement.style.fontWeight = 'bold';
      penaltyElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)';
      penaltyElement.style.zIndex = '1000';
      penaltyElement.style.opacity = '1';
      penaltyElement.style.transition = 'top 1s ease-out, opacity 1s ease-out';
      document.body.appendChild(penaltyElement);
      
      // Animate penalty indicator
      setTimeout(() => {
        penaltyElement.style.top = '50px';
        penaltyElement.style.opacity = '0';
      }, 10);
      
      // Remove element after animation
      setTimeout(() => {
        if (penaltyElement.parentNode) {
          penaltyElement.parentNode.removeChild(penaltyElement);
        }
      }, 1000);
    }
  }

  showCourseCompleteNotification() {
    // Create a course complete notification element
    const courseCompleteElement = document.createElement('div');
    
    // Calculate final time 
    const completionTime = this.clock.getElapsedTime() - this.gameStartTime;
    const formattedTime = completionTime.toFixed(1);
    
    // Create HTML content with completion information
    courseCompleteElement.innerHTML = `
      <h2 style="color: #4CAF50; margin-bottom: 10px;">Course Complete!</h2>
      <p>All gates cleared in ${formattedTime}s</p>
      <p style="color: gold;">+500 Bonus Points</p>
      <p style="margin-top: 15px; font-size: 18px;">Continue exploring or fly under the bridge!</p>
      <p style="margin-top: 10px; font-size: 16px;">Press SPACE anytime to restart</p>
    `;
    
    courseCompleteElement.style.position = 'absolute';
    courseCompleteElement.style.top = '50%';
    courseCompleteElement.style.left = '50%';
    courseCompleteElement.style.transform = 'translate(-50%, -50%)';
    courseCompleteElement.style.color = 'white';
    courseCompleteElement.style.fontSize = '24px';
    courseCompleteElement.style.textAlign = 'center';
    courseCompleteElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    courseCompleteElement.style.background = 'rgba(0, 0, 0, 0.7)';
    courseCompleteElement.style.padding = '20px 30px';
    courseCompleteElement.style.borderRadius = '10px';
    courseCompleteElement.style.zIndex = '1000';
    courseCompleteElement.style.opacity = '0';
    courseCompleteElement.style.transition = 'opacity 0.4s ease-in, opacity 0.4s ease-out 3s';
    document.body.appendChild(courseCompleteElement);
    
    // Store best time if this is faster
    let bestTime = localStorage.getItem('bestTime');
    if (!bestTime || completionTime < parseFloat(bestTime)) {
      localStorage.setItem('bestTime', completionTime);
      
      // Add "New Best Time!" text if this is a new record
      const newBestElement = document.createElement('p');
      newBestElement.textContent = '🏆 New Best Time! 🏆';
      newBestElement.style.color = 'gold';
      newBestElement.style.fontSize = '22px';
      newBestElement.style.fontWeight = 'bold';
      newBestElement.style.marginTop = '10px';
      courseCompleteElement.appendChild(newBestElement);
    }
    
    // Show the notification with a fade-in effect
    setTimeout(() => {
      courseCompleteElement.style.opacity = '1';
    }, 10);
    
    // Remove the notification after 5 seconds
    setTimeout(() => {
      if (courseCompleteElement.parentNode) {
        courseCompleteElement.style.opacity = '0';
        setTimeout(() => {
          if (courseCompleteElement.parentNode) {
            courseCompleteElement.parentNode.removeChild(courseCompleteElement);
          }
        }, 500); // Remove after fade-out completes
      }
    }, 5000);
  }
}

export default GameEngine; 