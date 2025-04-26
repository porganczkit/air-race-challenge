import * as THREE from 'three';

class Tree {
  constructor(position) {
    this.position = position;
    this.object = new THREE.Group();
    this.object.position.copy(position);

    // Create the tree structure
    this.createTreeStructure();
    
    // Log successful creation for debugging
    console.log(`TREE DEBUG: Tree created at position: x=${position.x.toFixed(1)}, y=${position.y.toFixed(1)}, z=${position.z.toFixed(1)}`);
  }

  createTreeStructure() {
    // MASSIVELY OVERSIZED trees - impossible to miss
    const trunkHeight = 50; // Extremely tall trunk
    const trunkRadius = 5; // Very wide trunk
    const canopyHeight = 40; // Huge canopy
    const canopyRadius = 25; // Enormous canopy radius

    // Use super bright colors
    const trunkMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF0000, // Bright red trunk
    });

    const canopyMaterial = new THREE.MeshBasicMaterial({
      color: 0x00FF00, // Bright green canopy
    });

    // Simple trunk (cylinder)
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.5, trunkHeight, 8);
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2; // Base of trunk at y=0
    this.object.add(trunk);

    // Single massive canopy (cone)
    const canopyGeometry = new THREE.ConeGeometry(canopyRadius, canopyHeight, 8);
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.y = trunkHeight + canopyHeight / 2 - 5;
    this.object.add(canopy);
    
    // Add a massive marker sphere at the base
    const markerGeometry = new THREE.SphereGeometry(10, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x0000FF }); // Bright blue
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.y = -2;
    this.object.add(marker);
    
    console.log("TREE DEBUG: Tree meshes created with bright colors and massive size");
  }

  getObject() {
    return this.object;
  }
}

export default Tree; 