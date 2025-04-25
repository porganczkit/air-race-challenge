// Main application entry point for Air Race Challenge

// Use modules from step12
import * as THREE from 'three';
import GameEngine from './step12/core/engine.js';
import Aircraft from './step12/entities/aircraft.js';
import InputHandler from './step12/utils/input.js';

// FPS counter variables
let fps = 0;
let frameCount = 0;
let fpsInterval;
let lastTime = 0;
let then = performance.now();
let startTime = then;
let now, elapsed;

// Start the application when the window loads
window.onload = function() {
  // Initialize the game
  console.log('Initializing Air Race Challenge...');
  
  try {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.error('Canvas element not found!');
      showError('Could not initialize the game: Canvas element not found.');
      return;
    }
    
    // Create and start the game engine
    const engine = new GameEngine('gameCanvas');
    if (!engine) {
      console.error('Failed to create game engine!');
      showError('Could not initialize the game: Engine initialization failed.');
      return;
    }
    
    // Start the game loop
    engine.start();
    
    // Set up FPS counter
    setupFPSCounter();
    
    console.log('Game initialized successfully');
  } catch (error) {
    console.error('Error during initialization:', error);
    showError(`Could not initialize the game: ${error.message}`);
  }
};

function setupFPSCounter() {
  // Create FPS counter element
  const fpsDisplay = document.createElement('div');
  fpsDisplay.id = 'fpsCounter';
  fpsDisplay.style.position = 'fixed';
  fpsDisplay.style.bottom = '10px';
  fpsDisplay.style.left = '10px';
  fpsDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  fpsDisplay.style.color = 'white';
  fpsDisplay.style.padding = '5px 10px';
  fpsDisplay.style.borderRadius = '3px';
  fpsDisplay.style.fontFamily = 'monospace';
  fpsDisplay.style.fontSize = '12px';
  fpsDisplay.style.zIndex = '9999';
  document.body.appendChild(fpsDisplay);
  
  // Start FPS monitoring
  fpsInterval = setInterval(updateFPS, 1000);
  
  // Set up requestAnimationFrame callback
  requestAnimationFrame(countFrames);
}

function countFrames(timestamp) {
  // Request next frame first
  requestAnimationFrame(countFrames);
  
  // Calculate time elapsed since last frame
  now = timestamp;
  elapsed = now - then;
  
  // Count this frame
  frameCount++;
  
  // Only update on screen at the specified interval
  if (elapsed > 1000) {
    // Update the FPS count
    fps = Math.round((frameCount * 1000) / elapsed);
    
    // Reset time and frame count
    then = now;
    frameCount = 0;
  }
}

function updateFPS() {
  const fpsDisplay = document.getElementById('fpsCounter');
  if (fpsDisplay) {
    fpsDisplay.textContent = `FPS: ${fps}`;
  }
}

function showError(message) {
  const errorElement = document.createElement('div');
  errorElement.style.position = 'fixed';
  errorElement.style.top = '50%';
  errorElement.style.left = '50%';
  errorElement.style.transform = 'translate(-50%, -50%)';
  errorElement.style.backgroundColor = 'rgba(200, 0, 0, 0.8)';
  errorElement.style.color = 'white';
  errorElement.style.padding = '20px';
  errorElement.style.borderRadius = '5px';
  errorElement.style.textAlign = 'center';
  errorElement.style.maxWidth = '80%';
  errorElement.innerHTML = `<h3>Error</h3><p>${message}</p>`;
  document.body.appendChild(errorElement);
} 