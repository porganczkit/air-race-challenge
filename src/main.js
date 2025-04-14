// Main entry point for Air Race Challenge
import * as THREE from 'three';

// Initialize the scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

// Create a camera
const camera = new THREE.PerspectiveCamera(
  75, // Field of view
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near clipping plane
  1000 // Far clipping plane
);
camera.position.z = 5;

// Create a renderer
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ 
  canvas, 
  antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Add directional light (like the sun)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Create a test cube
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Handle window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Rotate the cube
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  
  renderer.render(scene, camera);
}

// Start the animation loop
animate();

console.log('Air Race Challenge - Three.js Scene Initialized');

// Create a visible text element to confirm script is running
const statusElement = document.createElement('div');
statusElement.style.position = 'absolute';
statusElement.style.top = '20px';
statusElement.style.left = '20px';
statusElement.style.color = 'white';
statusElement.style.fontSize = '24px';
statusElement.style.fontFamily = 'Arial, sans-serif';
statusElement.textContent = 'Air Race Challenge - Three.js Scene Initialized';
document.body.appendChild(statusElement);

// This file will be expanded in future steps to initialize the game
// For now, we're just confirming the project setup works 