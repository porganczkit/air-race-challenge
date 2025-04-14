// Core game engine
// This will handle the main game loop and Three.js setup 

import * as THREE from 'three';

class GameEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.clock = new THREE.Clock();
    this.deltaTime = 0;
    this.elapsedTime = 0;
    this.isRunning = false;
    this.objects = [];

    this.initThreeJs();
    this.setupTestObject();
  }

  initThreeJs() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, // Field of view
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    this.camera.position.z = 5;

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

  setupTestObject() {
    // Create a test cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);
    this.objects.push(this.cube);
  }

  handleResize() {
    // Update camera aspect ratio and projection matrix
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

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

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  update(deltaTime, elapsedTime) {
    // Update all game objects
    this.objects.forEach(object => {
      // For now, just rotate the cube
      if (object === this.cube) {
        object.rotation.x += deltaTime * 0.5;
        object.rotation.y += deltaTime * 0.7;
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