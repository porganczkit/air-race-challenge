// Main entry point for Air Race Challenge
import GameEngine from '../core/engine.js';

// Create a status element to display game state
const statusElement = document.createElement('div');
statusElement.style.position = 'absolute';
statusElement.style.top = '20px';
statusElement.style.left = '20px';
statusElement.style.color = 'white';
statusElement.style.fontSize = '24px';
statusElement.style.fontFamily = 'Arial, sans-serif';
statusElement.textContent = 'Air Race Challenge - Game Loop Active';
document.body.appendChild(statusElement);

// Initialize game engine
const gameEngine = new GameEngine('game-canvas');
gameEngine.start();

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