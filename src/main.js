// Main entry point for Air Race Challenge
import GameEngine from '../core/engine.js';

console.log('Starting Air Race Challenge initialization...');

try {
  // Create a status element to display game state
  const statusElement = document.createElement('div');
  statusElement.style.position = 'absolute';
  statusElement.style.top = '20px';
  statusElement.style.left = '20px';
  statusElement.style.color = 'white';
  statusElement.style.fontSize = '24px';
  statusElement.style.fontFamily = 'Arial, sans-serif';
  statusElement.textContent = 'Air Race Challenge - Initializing...';
  document.body.appendChild(statusElement);

  console.log('DOM elements created');

  try {
    // Initialize game engine
    console.log('Creating GameEngine instance...');
    const gameEngine = new GameEngine('game-canvas');
    console.log('Starting GameEngine...');
    gameEngine.start();
    statusElement.textContent = 'Air Race Challenge - Game Loop Active';
    console.log('GameEngine started successfully');
  } catch (gameError) {
    console.error('Error initializing game engine:', gameError);
    statusElement.textContent = 'Error: ' + gameError.message;
    statusElement.style.color = 'red';
    throw gameError;
  }

  // Add FPS counter (for development)
  const fpsElement = document.createElement('div');
  fpsElement.style.position = 'absolute';
  fpsElement.style.top = '60px';
  fpsElement.style.left = '20px';
  fpsElement.style.color = 'white';
  fpsElement.style.fontSize = '16px';
  fpsElement.style.fontFamily = 'Arial, sans-serif';
  document.body.appendChild(fpsElement);

  // Update FPS counter
  let frameCount = 0;
  let lastTime = performance.now();

  function updateFPS() {
    const currentTime = performance.now();
    frameCount++;

    // Update every second
    if (currentTime - lastTime >= 1000) {
      const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
      fpsElement.textContent = `FPS: ${fps}`;
      frameCount = 0;
      lastTime = currentTime;
    }

    requestAnimationFrame(updateFPS);
  }

  updateFPS();

  console.log('Air Race Challenge - Game Engine Initialized');
} catch (error) {
  console.error('Fatal error during initialization:', error);
  
  // Display error on screen
  const errorElement = document.createElement('div');
  errorElement.style.position = 'absolute';
  errorElement.style.top = '50%';
  errorElement.style.left = '50%';
  errorElement.style.transform = 'translate(-50%, -50%)';
  errorElement.style.color = 'red';
  errorElement.style.fontSize = '24px';
  errorElement.style.fontFamily = 'Arial, sans-serif';
  errorElement.style.textAlign = 'center';
  errorElement.innerHTML = `<h2>Error Initializing Game</h2>
                           <p>${error.message}</p>
                           <p>See console for details</p>`;
  document.body.appendChild(errorElement);
} 
