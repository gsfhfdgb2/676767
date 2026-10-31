/**
 * Procedural PBR Texture Generator for Subject 67 Facility
 * High-fidelity HTML5 Canvas textures with normal/roughness data
 */
import * as THREE from 'three';

export interface FacilityTextures {
  wall: THREE.CanvasTexture;
  wallRoughness: THREE.CanvasTexture;
  floor: THREE.CanvasTexture;
  floorRoughness: THREE.CanvasTexture;
  ceiling: THREE.CanvasTexture;
  metal: THREE.CanvasTexture;
  hazard: THREE.CanvasTexture;
  reactorScreen: THREE.CanvasTexture;
  containmentPod: THREE.CanvasTexture;
  bloodDecal: THREE.CanvasTexture;
}

export function createProceduralTextures(maxAnisotropy: number = 4): FacilityTextures {
  // 1. Concrete Corridor Wall Texture (512x512)
  const wallCanvas = document.createElement('canvas');
  wallCanvas.width = 512;
  wallCanvas.height = 512;
  const wCtx = wallCanvas.getContext('2d')!;

  // Base distressed concrete gray
  wCtx.fillStyle = '#22252a';
  wCtx.fillRect(0, 0, 512, 512);

  // Noise and concrete mottling
  for (let i = 0; i < 40000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = Math.floor(25 + Math.random() * 30);
    wCtx.fillStyle = `rgba(${shade}, ${shade + 3}, ${shade + 6}, 0.25)`;
    wCtx.fillRect(x, y, 2, 2);
  }

  // Water drips and grime streaks
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * 512;
    const grad = wCtx.createLinearGradient(x, 0, x, 512);
    grad.addColorStop(0, 'rgba(10, 12, 14, 0.6)');
    grad.addColorStop(0.4 + Math.random() * 0.5, 'rgba(25, 20, 15, 0.4)');
    grad.addColorStop(1, 'rgba(8, 8, 8, 0.7)');
    wCtx.fillStyle = grad;
    wCtx.fillRect(x, 0, 8 + Math.random() * 18, 512);
  }

  // Concrete panel seam lines
  wCtx.strokeStyle = 'rgba(10, 10, 12, 0.8)';
  wCtx.lineWidth = 4;
  wCtx.strokeRect(4, 4, 504, 504);
  wCtx.beginPath();
  wCtx.moveTo(0, 256);
  wCtx.lineTo(512, 256);
  wCtx.stroke();

  // Wall Roughness map
  const wallRoughCanvas = document.createElement('canvas');
  wallRoughCanvas.width = 512;
  wallRoughCanvas.height = 512;
  const wrCtx = wallRoughCanvas.getContext('2d')!;
  wrCtx.fillStyle = '#b0b0b0';
  wrCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 20000; i++) {
    const v = Math.floor(Math.random() * 80 + 160);
    wrCtx.fillStyle = `rgb(${v}, ${v}, ${v})`;
    wrCtx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
  }

  // 2. Damp Lab Floor Tiles (512x512)
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 512;
  floorCanvas.height = 512;
  const fCtx = floorCanvas.getContext('2d')!;
  fCtx.fillStyle = '#16181c';
  fCtx.fillRect(0, 0, 512, 512);

  // 4x4 Large industrial tiles
  const tileSize = 128;
  for (let y = 0; y < 512; y += tileSize) {
    for (let x = 0; x < 512; x += tileSize) {
      const tileShade = 22 + Math.floor(Math.random() * 12);
      fCtx.fillStyle = `rgb(${tileShade}, ${tileShade + 2}, ${tileShade + 5})`;
      fCtx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

      // Subtle scratches inside tile
      fCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      fCtx.beginPath();
      fCtx.moveTo(x + 10, y + 10 + Math.random() * 80);
      fCtx.lineTo(x + 100, y + 10 + Math.random() * 80);
      fCtx.stroke();
    }
  }

  // Dark grout lines
  fCtx.strokeStyle = '#08080a';
  fCtx.lineWidth = 4;
  for (let i = 0; i <= 512; i += tileSize) {
    fCtx.beginPath();
    fCtx.moveTo(0, i);
    fCtx.lineTo(512, i);
    fCtx.stroke();

    fCtx.beginPath();
    fCtx.moveTo(i, 0);
    fCtx.lineTo(i, 512);
    fCtx.stroke();
  }

  // Floor Roughness (reflective puddles where roughness is very low)
  const floorRoughCanvas = document.createElement('canvas');
  floorRoughCanvas.width = 512;
  floorRoughCanvas.height = 512;
  const frCtx = floorRoughCanvas.getContext('2d')!;
  frCtx.fillStyle = '#888888';
  frCtx.fillRect(0, 0, 512, 512);
  // Wet puddles (very dark = smooth glossy reflection)
  for (let i = 0; i < 6; i++) {
    const px = Math.random() * 400 + 50;
    const py = Math.random() * 400 + 50;
    const grad = frCtx.createRadialGradient(px, py, 10, px, py, 60 + Math.random() * 40);
    grad.addColorStop(0, '#101010');
    grad.addColorStop(1, '#888888');
    frCtx.fillStyle = grad;
    frCtx.beginPath();
    frCtx.ellipse(px, py, 70, 45, Math.random() * Math.PI, 0, Math.PI * 2);
    frCtx.fill();
  }

  // 3. Ceiling with light bays & ventilation grilles
  const ceilCanvas = document.createElement('canvas');
  ceilCanvas.width = 512;
  ceilCanvas.height = 512;
  const cCtx = ceilCanvas.getContext('2d')!;
  cCtx.fillStyle = '#1c1e22';
  cCtx.fillRect(0, 0, 512, 512);
  // Steel beams
  cCtx.fillStyle = '#101214';
  cCtx.fillRect(0, 60, 512, 40);
  cCtx.fillRect(0, 412, 512, 40);
  cCtx.fillStyle = '#0a0a0c';
  cCtx.fillRect(120, 140, 272, 232);
  // Vent slits
  cCtx.fillStyle = '#18191c';
  for (let i = 160; i < 350; i += 18) {
    cCtx.fillRect(140, i, 232, 8);
  }

  // 4. Industrial Steel Plate / Metal
  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = 256;
  metalCanvas.height = 256;
  const mCtx = metalCanvas.getContext('2d')!;
  mCtx.fillStyle = '#3a3e46';
  mCtx.fillRect(0, 0, 256, 256);
  // Brushed metal effect
  for (let i = 0; i < 256; i += 2) {
    const v = Math.random() * 40 - 20;
    mCtx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.08})`;
    mCtx.fillRect(0, i, 256, 1);
  }
  // Rivets on edges
  mCtx.fillStyle = '#1e2024';
  const rivetPoints = [16, 80, 144, 208, 240];
  rivetPoints.forEach((p) => {
    mCtx.beginPath();
    mCtx.arc(16, p, 5, 0, Math.PI * 2);
    mCtx.arc(240, p, 5, 0, Math.PI * 2);
    mCtx.fill();
  });

  // 5. Yellow & Black Hazard Stripes
  const hazardCanvas = document.createElement('canvas');
  hazardCanvas.width = 256;
  hazardCanvas.height = 64;
  const hCtx = hazardCanvas.getContext('2d')!;
  hCtx.fillStyle = '#e0aa00';
  hCtx.fillRect(0, 0, 256, 64);
  hCtx.fillStyle = '#141414';
  for (let x = -64; x < 320; x += 40) {
    hCtx.beginPath();
    hCtx.moveTo(x, 0);
    hCtx.lineTo(x + 20, 0);
    hCtx.lineTo(x - 10, 64);
    hCtx.lineTo(x - 30, 64);
    hCtx.closePath();
    hCtx.fill();
  }

  // 6. Terminal & Reactor Diagnostics Screen
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 512;
  screenCanvas.height = 512;
  const sCtx = screenCanvas.getContext('2d')!;
  sCtx.fillStyle = '#050c08';
  sCtx.fillRect(0, 0, 512, 512);
  sCtx.fillStyle = '#00ff66';
  sCtx.font = 'bold 24px monospace';
  sCtx.fillText('PROJECT: SUBJECT 67', 30, 50);
  sCtx.font = '16px monospace';
  sCtx.fillText('STATUS: CONTAINMENT BREACH', 30, 90);
  sCtx.fillStyle = '#ff3333';
  sCtx.fillText('BIO-THREAT LEVEL: OMEGA-CLASS', 30, 120);
  sCtx.fillStyle = '#00e1ff';
  sCtx.fillText('CORE ELEMENTS STATUS: DISPERSED', 30, 160);
  sCtx.fillText('- ELEMENT ALPHA: CRYO LAB', 30, 190);
  sCtx.fillText('- ELEMENT BETA: POWER SUBSTATION', 30, 220);
  sCtx.fillText('- ELEMENT GAMMA: INCUBATION CELL', 30, 250);
  sCtx.fillText('- ELEMENT DELTA: OBSERVATION DECK', 30, 280);
  sCtx.fillStyle = '#ffaa00';
  sCtx.fillText('INSERT ALL 4 TO ENGAGE OVERLOAD', 30, 330);
  sCtx.fillText('EMERGENCY FACILITY DETONATION READY', 30, 360);

  // Scanline effect
  sCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  for (let y = 0; y < 512; y += 4) {
    sCtx.fillRect(0, y, 512, 2);
  }

  // 7. Containment Pod Glass / Biological warning
  const podCanvas = document.createElement('canvas');
  podCanvas.width = 256;
  podCanvas.height = 512;
  const pCtx = podCanvas.getContext('2d')!;
  pCtx.fillStyle = '#0c1a1a';
  pCtx.fillRect(0, 0, 256, 512);
  pCtx.strokeStyle = '#00ffff';
  pCtx.lineWidth = 4;
  pCtx.strokeRect(8, 8, 240, 496);
  // Crack pattern where Subject 67 smashed through!
  pCtx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  pCtx.lineWidth = 3;
  pCtx.beginPath();
  pCtx.moveTo(128, 256);
  pCtx.lineTo(90, 200);
  pCtx.lineTo(40, 180);
  pCtx.moveTo(128, 256);
  pCtx.lineTo(180, 220);
  pCtx.lineTo(230, 210);
  pCtx.moveTo(128, 256);
  pCtx.lineTo(140, 330);
  pCtx.lineTo(80, 390);
  pCtx.stroke();

  // 8. Blood Decal / Markings
  const bloodCanvas = document.createElement('canvas');
  bloodCanvas.width = 256;
  bloodCanvas.height = 256;
  const bCtx = bloodCanvas.getContext('2d')!;
  bCtx.clearRect(0, 0, 256, 256);
  bCtx.fillStyle = '#5c0606';
  // Central splatter with organic drips
  bCtx.beginPath();
  bCtx.arc(128, 128, 45, 0, Math.PI * 2);
  bCtx.fill();
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 70;
    const r = 3 + Math.random() * 8;
    bCtx.beginPath();
    bCtx.arc(128 + Math.cos(angle) * dist, 128 + Math.sin(angle) * dist, r, 0, Math.PI * 2);
    bCtx.fill();
  }

  const setupTex = (canvas: HTMLCanvasElement, sRGB: boolean = true) => {
    const tex = new THREE.CanvasTexture(canvas);
    if (sRGB) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(maxAnisotropy, 8);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  };

  const wallTex = setupTex(wallCanvas);
  wallTex.repeat.set(2, 2);
  const wallRoughTex = setupTex(wallRoughCanvas, false);
  wallRoughTex.repeat.set(2, 2);

  const floorTex = setupTex(floorCanvas);
  floorTex.repeat.set(3, 3);
  const floorRoughTex = setupTex(floorRoughCanvas, false);
  floorRoughTex.repeat.set(3, 3);

  const ceilTex = setupTex(ceilCanvas);
  ceilTex.repeat.set(2, 2);

  return {
    wall: wallTex,
    wallRoughness: wallRoughTex,
    floor: floorTex,
    floorRoughness: floorRoughTex,
    ceiling: ceilTex,
    metal: setupTex(metalCanvas),
    hazard: setupTex(hazardCanvas),
    reactorScreen: setupTex(screenCanvas),
    containmentPod: setupTex(podCanvas),
    bloodDecal: setupTex(bloodCanvas),
  };
}
