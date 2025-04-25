import * as THREE from 'three';

class Person {
  constructor(position) {
    this.position = position;
    this.object = new THREE.Group();
    this.object.position.copy(position);

    // Create the person model
    this.createPersonModel();
  }

  createPersonModel() {
    const headSize = 0.5;
    const bodyHeight = 0.8;
    const bodyWidth = 0.6;
    const legHeight = 0.7;
    const legWidth = 0.25;

    // Simple materials with random-ish colors
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5), // Skin tones
      roughness: 0.8 
    }); 
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(Math.random(), Math.random(), Math.random()), // Random shirt color
      roughness: 0.8 
    }); 
    const legMaterial = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(Math.random() * 0.3, Math.random() * 0.3, Math.random() * 0.3 + 0.4), // Darker pants color
      roughness: 0.8 
    });

    // Legs
    const legGeometry = new THREE.BoxGeometry(legWidth, legHeight, legWidth);
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-bodyWidth / 4, legHeight / 2, 0);
    this.object.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(bodyWidth / 4, legHeight / 2, 0);
    this.object.add(rightLeg);

    // Body
    const bodyGeometry = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyWidth * 0.6);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = legHeight + bodyHeight / 2;
    this.object.add(body);

    // Head
    const headGeometry = new THREE.BoxGeometry(headSize, headSize, headSize);
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = legHeight + bodyHeight + headSize / 2;
    this.object.add(head);

    // Enable shadows
    this.object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  getObject() {
    return this.object;
  }
}

export default Person; 