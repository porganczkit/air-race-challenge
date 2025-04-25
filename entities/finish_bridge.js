import * as THREE from 'three';

class FinishBridge {
  constructor(position) {
    this.position = position;
    this.object = new THREE.Group();
    this.object.position.copy(position);

    // Create the bridge structure
    this.createBridgeStructure();

    // Add collision detection elements if needed later
    // this.createCollisionBoxes(); 
  }

  createBridgeStructure() {
    const bridgeLength = 50;
    const bridgeWidth = 10;
    const pillarHeight = 15;
    const archHeight = 8;
    const roadThickness = 1;
    const pillarSize = 4;

    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0xAAAAAA, // Light gray stone
      roughness: 0.8,
      metalness: 0.1,
    });

    // Road surface
    const roadGeometry = new THREE.BoxGeometry(bridgeLength, roadThickness, bridgeWidth);
    const road = new THREE.Mesh(roadGeometry, stoneMaterial);
    road.position.y = pillarHeight - roadThickness / 2; // Road sits on top of pillars
    this.object.add(road);

    // Main Pillars (simplified as boxes)
    const pillarGeometry = new THREE.BoxGeometry(pillarSize, pillarHeight, pillarSize);

    const pillar1 = new THREE.Mesh(pillarGeometry, stoneMaterial);
    pillar1.position.set(-bridgeLength / 2 + pillarSize / 2, pillarHeight / 2, 0);
    this.object.add(pillar1);

    const pillar2 = new THREE.Mesh(pillarGeometry, stoneMaterial);
    pillar2.position.set(bridgeLength / 2 - pillarSize / 2, pillarHeight / 2, 0);
    this.object.add(pillar2);

    // Simplified Arch (under the road, between pillars)
    // A flat box representing the space to fly under
    const archSpaceGeometry = new THREE.BoxGeometry(
      bridgeLength - 2 * pillarSize, // Length between pillars
      archHeight, 
      bridgeWidth 
    );
    // This space is just for visual clearance reference, not added to the scene directly
    // But we position the road and pillars based on this needed clearance.
    // Ensure road.position.y - archHeight / 2 provides enough vertical clearance.
    // Current clearance: (pillarHeight - roadThickness / 2) - archHeight / 2 = 15 - 0.5 - 4 = 10.5 units

    // Add some decorative elements (optional, simplified)
    const railHeight = 1;
    const railGeometry = new THREE.BoxGeometry(bridgeLength, railHeight, 0.5);
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });

    const railLeft = new THREE.Mesh(railGeometry, railMaterial);
    railLeft.position.set(0, pillarHeight + railHeight / 2 - roadThickness / 2, bridgeWidth / 2 - 0.25);
    this.object.add(railLeft);

    const railRight = new THREE.Mesh(railGeometry, railMaterial);
    railRight.position.set(0, pillarHeight + railHeight / 2 - roadThickness / 2, -bridgeWidth / 2 + 0.25);
    this.object.add(railRight);
    
    // Enable shadows
    this.object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  // Placeholder for collision detection specific to the bridge
  // createCollisionBoxes() {
    // Example: Add a box for the ground collision under the arch
    // const underArchCollider = new THREE.BoxGeometry(...) 
    // ... add to scene or manage separately
  // }

  getObject() {
    return this.object;
  }
  
  // Add update method if bridge needs animation or dynamic behavior
  update(deltaTime) {
    // Bridge is static for now
  }
}

export default FinishBridge; 