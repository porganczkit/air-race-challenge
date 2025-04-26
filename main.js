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

// Global game engine reference
let gameEngine = null;

// Global key listeners for game control
window.addEventListener('keydown', function(event) {
  console.log(`MAIN KEY HANDLER: Key pressed: ${event.code}, key: ${event.key}`);
  
  // Handle space key for game start
  if (event.code === 'Space') {
    console.log('SPACE key detected in global handler');
    if (gameEngine) {
      console.log(`Game engine found, current state: ${gameEngine.gameState}`);
      if (gameEngine.gameState === 'ready') {
        console.log('Starting game from SPACE key press!');
        gameEngine.startGame();
      } else {
        console.log(`Game not started: game state is ${gameEngine.gameState}, not 'ready'`);
      }
    } else {
      console.log('Game engine not found, cannot start game');
    }
  }
  
  // Prevent default behavior for arrow keys and space to avoid page scrolling
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
});

// Start the application when the window loads
window.onload = function() {
  // Initialize the game
  console.log('Initializing Air Race Challenge...');
  
  // Add a visible status message during loading
  const loadingMsg = document.createElement('div');
  loadingMsg.textContent = 'Loading Air Race Game...';
  loadingMsg.style.position = 'fixed';
  loadingMsg.style.top = '50%';
  loadingMsg.style.left = '50%';
  loadingMsg.style.transform = 'translate(-50%, -50%)';
  loadingMsg.style.color = 'white';
  loadingMsg.style.fontSize = '24px';
  loadingMsg.style.fontFamily = 'Arial, sans-serif';
  loadingMsg.style.zIndex = '9999';
  document.body.appendChild(loadingMsg);
  
  try {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.error('Canvas element not found!');
      showError('Could not initialize the game: Canvas element not found.');
      return;
    }
    
    console.log('Canvas element found:', canvas);
    
    // Make sure canvas is full screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Add window resize handler
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
    
    // Create and start the game engine
    console.log('Creating game engine...');
    gameEngine = new GameEngine('gameCanvas');
    if (!gameEngine) {
      console.error('Failed to create game engine!');
      showError('Could not initialize the game: Engine initialization failed.');
      return;
    }
    
    // Start the game loop
    console.log('Starting game loop...');
    gameEngine.start();
    
    // Set up FPS counter
    setupFPSCounter();
    
    // Remove loading message
    document.body.removeChild(loadingMsg);
    
    // Add centered game title and instructions
    const gameTitle = document.createElement('div');
    gameTitle.innerHTML = `
      <h1 style="margin-bottom: 10px; font-size: 48px; color: white; text-shadow: 2px 2px 4px #000;">Air Race Challenge</h1>
      <p style="font-size: 24px; color: white; text-shadow: 1px 1px 2px #000;">Press SPACE to start the game</p>
      <p style="font-size: 18px; color: white; text-shadow: 1px 1px 2px #000; margin-top: 20px;">Use arrow keys to control the aircraft</p>
    `;
    gameTitle.style.position = 'fixed';
    gameTitle.style.top = '50%';
    gameTitle.style.left = '50%';
    gameTitle.style.transform = 'translate(-50%, -50%)';
    gameTitle.style.textAlign = 'center';
    gameTitle.style.zIndex = '9999';
    gameTitle.style.fontFamily = 'Arial, sans-serif';
    gameTitle.style.background = 'rgba(0, 0, 0, 0.5)';
    gameTitle.style.padding = '30px 50px';
    gameTitle.style.borderRadius = '15px';
    
    document.body.appendChild(gameTitle);
    
    // Hide the game title when the game starts
    const originalStartGame = gameEngine.startGame;
    gameEngine.startGame = function() {
      console.log('Custom startGame wrapper called');
      gameTitle.style.display = 'none';
      originalStartGame.call(gameEngine);
    };
    
    console.log('Game initialized successfully');

    // Direct tree creation as a last resort
    function addEmergencyTrees() {
      console.log('EMERGENCY: Creating trees directly from main.js');
      
      // Get the scene from the game engine
      const scene = gameEngine.scene;
      
      // Create simple trees
      const groundY = -5;
      
      // Create 50 scattered trees
      for (let i = 0; i < 50; i++) {
        // Random position within a larger area
        const x = Math.random() * 400 - 200; // -200 to 200
        const z = Math.random() * 400 - 200; // -200 to 200
        
        // Skip if too close to river (simple check, assuming river runs along z-axis)
        if (Math.abs(x) < 15) continue;
        
        // Create tree group
        const treeGroup = new THREE.Group();
        treeGroup.position.set(x, groundY, z);
        
        // Scale for 1/10th size
        const scale = 0.1;
        
        // Create trunk (brown cylinder) - 1/10th the size
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(3 * scale, 4 * scale, 30 * scale, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
          })
        );
        trunk.position.y = 15 * scale; // Half of trunk height
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);
        
        // Create foliage (green cone) - 1/10th the size
        const foliage = new THREE.Mesh(
          new THREE.ConeGeometry(12 * scale, 40 * scale, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0x228B22,
            roughness: 0.7,
            metalness: 0.0
          })
        );
        foliage.position.y = 40 * scale; // Position above trunk
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        treeGroup.add(foliage);
        
        // Add tree to scene
        scene.add(treeGroup);
      }
      
      console.log('EMERGENCY: 50 smaller trees scattered across terrain');
    }

    // Call the function after a short delay to ensure everything is loaded
    setTimeout(addEmergencyTrees, 1000);
    
    // Also ensure the space key is working correctly
    document.addEventListener('keydown', function(event) {
      if (event.code === 'Space') {
        console.log('SPACE key detected in document listener');
        if (gameEngine && gameEngine.gameState === 'ready') {
          console.log('Starting game from document SPACE key press!');
          gameEngine.startGame();
        }
      }
    });
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