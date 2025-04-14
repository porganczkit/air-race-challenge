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
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(1, 1, 1);
    this.scene.add(this.directionalLight);

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  setupEnvironment() {
    // Add a simple grid for reference
    const gridHelper = new THREE.GridHelper(100, 100);
    this.scene.add(gridHelper);
    
    // Add a simple ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x7CFC00, // Lawn green
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2; // Rotate to be horizontal
    ground.position.y = -2; // Position below the aircraft
    this.scene.add(ground);
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
    this.aircraft.getObject().position.set(0, 0, -10);
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