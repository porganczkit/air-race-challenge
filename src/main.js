// Main entry point for Air Race Challenge
console.log('Air Race Challenge - Project initialized');

// Create a visible text element to confirm script is running
const statusElement = document.createElement('div');
statusElement.style.position = 'absolute';
statusElement.style.top = '20px';
statusElement.style.left = '20px';
statusElement.style.color = 'white';
statusElement.style.fontSize = '24px';
statusElement.style.fontFamily = 'Arial, sans-serif';
statusElement.textContent = 'Air Race Challenge - Project initialized';
document.body.appendChild(statusElement);

// Import Three.js (this will be used in future steps)
// import * as THREE from 'three';

// This file will be expanded in future steps to initialize the game
// For now, we're just confirming the project setup works 