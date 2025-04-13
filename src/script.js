import * as THREE from "three";
import GUI from "lil-gui";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
/**
 * Debug
 */
const gui = new GUI();

const parameters = {
  materialColor: "red",
};

gui.addColor(parameters, "materialColor").onChange(() => {
  material.color.set(parameters.materialColor);
  particlesMaterial.color.set(parameters.materialColor);
});

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Test cube
 */
//texture
const textureLoader = new THREE.TextureLoader();
const gradientTexture = textureLoader.load("textures/gradients/3.jpg");
/*
 By default, instead of picking the nearest pixel on the texture, 
 WebGL will try to interpolate the pixels. That's usually a good idea for the look of our experiences, but in this case, it creates a gradient instead of a toon effect.
 */
const objectsDistance = 3;
const material = new THREE.MeshToonMaterial({
  color: parameters.materialColor,
  gradientMap: gradientTexture,
});
gradientTexture.magFilter = THREE.NearestFilter; //the closest pixel is used without interpolating it with neighbor pixels:
const mesh1 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 16, 60), material);
const mesh2 = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 32), material);
const mesh3 = new THREE.Mesh(new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16), material);
mesh1.position.y = -objectsDistance * 0;
mesh2.position.y = -objectsDistance * 1;
mesh3.position.y = -objectsDistance * 2;
mesh1.position.x = 2;
mesh2.position.x = -2;
mesh3.position.x = 2;
scene.add(mesh1, mesh2, mesh3);
const sectionMeshes = [mesh1, mesh2, mesh3];
/**
 * Particles
 */
// Geometry
const particlesCount = 200;
const positions = new Float32Array(particlesCount * 3);
for (let i = 0; i < particlesCount; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 1] = objectsDistance * 0.5 - Math.random() * objectsDistance * sectionMeshes.length;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}
const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
// Material
const particlesMaterial = new THREE.PointsMaterial({
  color: parameters.materialColor,
  sizeAttenuation: true,
  size: 0.03,
});
// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);
/**
 * Lights
 */

const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
directionalLight.position.set(1, 1, 0);
scene.add(directionalLight);
/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Group
const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 6;
cameraGroup.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
/**
 * Scroll
 */
let scrollY = window.scrollY;
let currentSection = 0;

window.addEventListener("scroll", () => {
  scrollY = window.scrollY;
  const newSection = Math.round(scrollY / sizes.height); // i get 1 2 3 on each section
  if (newSection != currentSection) {
    currentSection = newSection;
    console.log("changed", currentSection);

    gsap.to(sectionMeshes[currentSection].rotation, {
      duration: 1.5,
      ease: "power2.inOut",
      x: "+=6",
      y: "+=3",
      z: "+=1.5",
    });
  }
});
/**
 * Cursor
 */
const cursor = {};
cursor.x = 0;
cursor.y = 0;
window.addEventListener("mousemove", (event) => {
  cursor.x = event.clientX / sizes.width;
  cursor.y = event.clientY / sizes.height;
  //normalize the value (from 0 to 1) by dividing them by the size of the viewport:
  console.log(cursor);
});
/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0
const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime
  previousTime = elapsedTime
  // Animate camera
  /*
  Each section has exactly the same size as the viewport. 
  This means that when we scroll the distance of one viewport height, the camera should reach the next object.
  */
  camera.position.y = (-scrollY / sizes.height) * objectsDistance;
  const parallaxX = cursor.x;
  const parallaxY = -cursor.y;

  //First, we need to change the = to += because we are adding to the actual position:
  //Then, we need to calculate the distance from the actual position to the destination:
  //Finally, we only want a 10th of that distance:
  //the distance of the cursor - the position of the camera
  const damping = 0.1;
  // In animation loop
  gsap.set(cameraGroup.position, {
    x: "+=" + (parallaxX - cameraGroup.position.x) * damping,
    y: "+=" + (parallaxY - cameraGroup.position.y) * damping,
    overwrite: true,
  });

  //   cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * damping;
  //   cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * damping;
  for (const mesh of sectionMeshes) {
    mesh.rotation.x += deltaTime * 0.1;
    mesh.rotation.y += deltaTime * 0.12;
  }
  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
