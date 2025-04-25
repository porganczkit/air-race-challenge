// Core game engine
// This will handle the main game loop and Three.js setup 

import * as THREE from 'three';
import Aircraft from '../entities/aircraft.js';
import InputHandler from '../utils/input.js';

class GameEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.clock = new THREE.Clock();
    this.deltaTime = 0;
    this.elapsedTime = 0;
    this.isRunning = false;
    this.objects = [];
    this.clouds = [];

    // Initialize input handler
    this.inputHandler = new InputHandler();

    this.initThreeJs();
    this.setupEnvironment();
    this.setupAircraft();
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

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance

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
    this.directionalLight.shadow.camera.far = 100;
    this.directionalLight.shadow.camera.left = -50;
    this.directionalLight.shadow.camera.right = 50;
    this.directionalLight.shadow.camera.top = 50;
    this.directionalLight.shadow.camera.bottom = -50;
    
    this.scene.add(this.directionalLight);

    // Enable shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }
  
  setupSkyGradient() {
    // Create a sky gradient using a simpler approach
    const topColor = new THREE.Color(0x3284FF); // Bright blue at top
    const bottomColor = new THREE.Color(0xC4E0FF); // Light blue at horizon
    
    // Create a large dome for the sky
    const skyGeometry = new THREE.SphereGeometry(500, 32, 15, 0, Math.PI * 2, 0, Math.PI / 2);
    
    // Create a solid blue material instead of using shaders which might be causing issues
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x87CEEB, // Sky blue
      side: THREE.BackSide
    });
    
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(sky);
  }

  setupEnvironment() {
    // Create flat ground plane
    this.createGroundPlane();
    
    // Add clouds
    this.createClouds();
    
    // Add river instead of mountains
    this.createRiver();
  }
  
  createGroundPlane() {
    // Create a large flat ground plane
    const groundSize = 1000;
    
    // Create a gradient material for the ground from green to darker green
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x7CFC00, // Light green
      roughness: 0.8,
      metalness: 0.2
    });
    
    // Add a subtle checkerboard pattern
    const gridSize = 100;
    const gridResolution = 100;
    const gridGeometry = new THREE.PlaneGeometry(groundSize, groundSize, gridResolution, gridResolution);
    const ground = new THREE.Mesh(gridGeometry, groundMaterial);
    
    // Add some slight vertex displacement for a more natural look
    const vertices = gridGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      // Only adjust y (height) for subtle terrain variation
      // Don't modify the edges to keep a clean horizon
      const x = vertices[i];
      const z = vertices[i + 2];
      const distFromCenter = Math.sqrt(x * x + z * z);
      
      if (distFromCenter < groundSize * 0.4) {
        // Only modify interior vertices to keep a flat boundary
        vertices[i + 1] = (Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.5) - 0.5;
      }
    }
    
    // Need to update the geometry after modifying vertices
    gridGeometry.attributes.position.needsUpdate = true;
    gridGeometry.computeVertexNormals();
    
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
  }
  
  createRiver() {
    // Create a river flowing from south to north (along the z-axis)
    const riverWidth = 20;
    const riverLength = 800;
    
    // Create river geometry - slightly above ground to prevent z-fighting
    const riverGeometry = new THREE.PlaneGeometry(riverWidth, riverLength, 20, 20);
    
    // Create water material
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
    
    // Add river banks - slightly raised areas along the river
    this.createRiverBanks(river);
  }
  
  createRiverBanks(river) {
    // Create raised areas along the river banks
    const bankWidth = 5;
    const bankLength = 800;
    
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
    const cloudCount = 15;
    const cloudMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.9
    });
    
    for (let i = 0; i < cloudCount; i++) {
      const cloudGroup = new THREE.Group();
      
      // Create voxel-style cloud with multiple cubes
      const blockCount = 3 + Math.floor(Math.random() * 5);
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
      
      // Position cloud in scene
      cloudGroup.position.x = (Math.random() - 0.5) * 120;
      cloudGroup.position.y = 15 + Math.random() * 15; 
      cloudGroup.position.z = (Math.random() - 0.5) * 120;
      
      this.clouds.push({
        group: cloudGroup,
        speed: 0.05 + Math.random() * 0.05,
        bobSpeed: 0.2 + Math.random() * 0.3,
        bobHeight: 0.05 + Math.random() * 0.1,
        startY: cloudGroup.position.y
      });
      
      this.scene.add(cloudGroup);
    }
  }

  setupAircraft() {
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
      this.animate();
    }
  }

  stop() {
    if (this.isRunning) {
      this.clock.stop();
      this.isRunning = false;
    }
  }

  animate() {
    if (!this.isRunning) return;

    // Request next frame
    requestAnimationFrame(() => this.animate());

    // Calculate delta time and update elapsed time
    this.deltaTime = this.clock.getDelta();
    this.elapsedTime = this.clock.getElapsedTime();

    // Update game state
    this.update(this.deltaTime, this.elapsedTime);

    // Render the scene
    this.renderer.render(this.scene, this.activeCamera);
  }

  update(deltaTime, elapsedTime) {
    // Update all game objects
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
      if (cloud.group.position.x > 100) {
        cloud.group.position.x = -100;
      }
      
      // Bob clouds up and down
      cloud.group.position.y = cloud.startY + Math.sin(elapsedTime * cloud.bobSpeed) * cloud.bobHeight;
    }
    
    // Add water animation - subtle wave effect
    if (this.river) {
      // Animate river water
      this.river.material.offset.y = elapsedTime * 0.05;
    }
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