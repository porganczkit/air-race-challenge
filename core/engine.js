// Core game engine
// This will handle the main game loop and Three.js setup 

import * as THREE from 'three';
import Aircraft from '../entities/aircraft.js';

class GameEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.clock = new THREE.Clock();
    this.deltaTime = 0;
    this.elapsedTime = 0;
    this.isRunning = false;
    this.objects = [];
    this.clouds = [];

    this.initThreeJs();
    this.setupEnvironment();
    this.setupAircraft();
  }

  initThreeJs() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background

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
    this.scene.add(this.directionalLight);

    // Enable shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  setupEnvironment() {
    // Create voxel-style terrain
    this.createVoxelTerrain();
    
    // Add clouds
    this.createClouds();
    
    // Add distant mountains
    this.createMountains();
  }
  
  createVoxelTerrain() {
    // Create ground plane with voxel-style terrain
    const terrainSize = 100;
    const terrainResolution = 50;
    const terrainHeightMap = [];
    
    // Generate random height map
    for (let i = 0; i < terrainResolution; i++) {
      terrainHeightMap[i] = [];
      for (let j = 0; j < terrainResolution; j++) {
        // Generate smoother terrain using Perlin-like approach
        const distance = Math.sqrt(Math.pow(i - terrainResolution/2, 2) + Math.pow(j - terrainResolution/2, 2));
        const baseHeight = Math.sin(i * 0.1) * Math.cos(j * 0.1) * 2;
        const randomFactor = Math.random() * 0.5;
        terrainHeightMap[i][j] = baseHeight + randomFactor;
      }
    }
    
    // Create terrain group
    this.terrain = new THREE.Group();
    
    // Create terrain with voxel cubes based on height map
    const cubeSize = terrainSize / terrainResolution;
    const groundMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x8B4513 }), // Brown
      new THREE.MeshStandardMaterial({ color: 0x7CFC00 }), // Green
      new THREE.MeshStandardMaterial({ color: 0x556B2F })  // Dark green
    ];
    
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    
    for (let i = 0; i < terrainResolution; i++) {
      for (let j = 0; j < terrainResolution; j++) {
        const height = terrainHeightMap[i][j];
        const cubeCount = Math.max(1, Math.floor(height + 3));
        
        for (let k = 0; k < cubeCount; k++) {
          // Choose material based on height (grass on top, dirt below)
          let materialIndex;
          if (k === cubeCount - 1) {
            materialIndex = 1; // Top layer is green
          } else if (k === cubeCount - 2) {
            materialIndex = 2; // Second layer is dark green
          } else {
            materialIndex = 0; // Lower layers are brown
          }
          
          const cube = new THREE.Mesh(cubeGeometry, groundMaterials[materialIndex]);
          cube.position.x = (i - terrainResolution/2) * cubeSize;
          cube.position.y = (k - 5) * cubeSize; // Offset to position terrain below aircraft
          cube.position.z = (j - terrainResolution/2) * cubeSize;
          
          // Only add cubes that will be visible
          if (i % 2 === 0 && j % 2 === 0) {
            this.terrain.add(cube);
          }
        }
      }
    }
    
    this.scene.add(this.terrain);
  }
  
  createClouds() {
    const cloudCount = 10;
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
        
        cloudGroup.add(block);
      }
      
      // Position cloud in scene
      cloudGroup.position.x = (Math.random() - 0.5) * 80;
      cloudGroup.position.y = 15 + Math.random() * 10; 
      cloudGroup.position.z = (Math.random() - 0.5) * 80;
      
      this.clouds.push(cloudGroup);
      this.scene.add(cloudGroup);
    }
  }
  
  createMountains() {
    // Create distant mountains
    const mountainCount = 5;
    const mountainMaterial = new THREE.MeshStandardMaterial({ color: 0x556B2F });
    
    for (let i = 0; i < mountainCount; i++) {
      const mountainHeight = 10 + Math.random() * 15;
      const mountainWidth = 10 + Math.random() * 20;
      
      // Create mountain using a cone
      const mountainGeo = new THREE.ConeGeometry(mountainWidth, mountainHeight, 4);
      const mountain = new THREE.Mesh(mountainGeo, mountainMaterial);
      
      // Position mountain at the edge of the scene
      const angle = (i / mountainCount) * Math.PI * 2;
      const distance = 40 + Math.random() * 10;
      mountain.position.x = Math.cos(angle) * distance;
      mountain.position.y = -5 + mountainHeight * 0.5;
      mountain.position.z = Math.sin(angle) * distance;
      
      // Random rotation
      mountain.rotation.y = Math.random() * Math.PI;
      
      this.scene.add(mountain);
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
    
    // Create aircraft
    this.aircraft = new Aircraft();
    
    // Add aircraft to scene
    this.scene.add(this.aircraft.getObject());
    this.objects.push(this.aircraft);
    
    // Use aircraft's camera as the active camera
    this.activeCamera = this.aircraft.getCamera();
    
    // Position aircraft at starting point
    this.aircraft.getObject().position.set(0, 10, -20); // Higher altitude to match image
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
      console.log('Game loop started');
    }
  }

  stop() {
    this.isRunning = false;
    this.clock.stop();
    console.log('Game loop stopped');
  }

  animate() {
    if (!this.isRunning) return;

    // Request next frame
    requestAnimationFrame(() => this.animate());

    // Calculate time delta
    this.deltaTime = this.clock.getDelta();
    this.elapsedTime = this.clock.getElapsedTime();

    // Update game objects
    this.update(this.deltaTime, this.elapsedTime);

    // Render the scene with the active camera
    this.renderer.render(this.scene, this.activeCamera);
  }

  update(deltaTime, elapsedTime) {
    // Update all game objects
    this.objects.forEach(object => {
      if (typeof object.update === 'function') {
        object.update(deltaTime, elapsedTime);
      }
    });
    
    // Gently bob the clouds
    this.clouds.forEach((cloud, index) => {
      cloud.position.y += Math.sin(elapsedTime * 0.5 + index) * 0.01;
    });
  }

  // Method to add objects to the scene and update list
  addObject(object) {
    this.scene.add(object);
    this.objects.push(object);
  }

  // Method to remove objects from the scene and update list
  removeObject(object) {
    this.scene.remove(object);
    const index = this.objects.indexOf(object);
    if (index !== -1) {
      this.objects.splice(index, 1);
    }
  }
}

export default GameEngine; 