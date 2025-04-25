import * as THREE from 'three';

class Tree {
  constructor(position) {
    this.position = position;
    this.object = new THREE.Group();
    this.object.position.copy(position);

    // Create the tree structure
    this.createTreeStructure();
  }

  createTreeStructure() {
    const trunkHeight = 3;
    const trunkRadius = 0.3;
    const canopyHeight = 4;
    const canopyRadius = 1.5;

    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown
      roughness: 0.9,
      metalness: 0.1,
    });

    const canopyMaterial = new THREE.MeshStandardMaterial({
      color: 0x228B22, // Forest Green
      roughness: 0.8,
      metalness: 0.1,
    });

    // Trunk (Cylinder)
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 8);
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2; // Base of trunk at y=0
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    this.object.add(trunk);

    // Canopy (Cone or Sphere - using Cone for simplicity)
    const canopyGeometry = new THREE.ConeGeometry(canopyRadius, canopyHeight, 8);
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.y = trunkHeight + canopyHeight / 2 - 0.5; // Position canopy on top of trunk
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    this.object.add(canopy);
    
     // Enable shadows for the group if needed later
    // this.object.traverse((child) => {
    //   if (child instanceof THREE.Mesh) {
    //     child.castShadow = true;
    //     child.receiveShadow = true;
    //   }
    // });
  }

  getObject() {
    return this.object;
  }
}

export default Tree; 