/**
 * Procedural 3D Models for Subject 67 Horror Experience
 * Strict adherence to 3-12 part composite assemblies, PBR contrast, and bottom-center grounding.
 */
import * as THREE from 'three';
import { FacilityTextures } from './textures';

export interface CreatureParts {
  group: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  jaw: THREE.Mesh;
  eyeLight: THREE.PointLight;
  eyesMesh: THREE.Mesh;
  tendrils: THREE.Group;
}

export function createSubject67Model(): CreatureParts {
  const root = new THREE.Group();
  root.name = 'Subject67';

  // Materials with physical contrast
  // Leathery deformed carapace
  const fleshMat = new THREE.MeshStandardMaterial({
    color: 0x161214,
    roughness: 0.82,
    metalness: 0.15,
  });

  // Wet organic exposed bone/spine
  const boneMat = new THREE.MeshStandardMaterial({
    color: 0x6e625a,
    roughness: 0.35,
    metalness: 0.1,
  });

  // Razor chitin claws/scythes
  const clawMat = new THREE.MeshStandardMaterial({
    color: 0x0a090b,
    roughness: 0.25,
    metalness: 0.85,
  });

  // Glowing sinister sensory slits
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xff1100,
    emissive: 0xff1100,
    emissiveIntensity: 3.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  // 1. Torso Assembly (Primary Silhouette: hunched, elongated ribcage & spine)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 1.4, 0);

  // Upper ribcage
  const chestGeo = new THREE.CylinderGeometry(0.35, 0.22, 0.75, 7);
  chestGeo.scale(1.2, 1.0, 0.8);
  const chest = new THREE.Mesh(chestGeo, fleshMat);
  chest.castShadow = true;
  chest.rotation.x = 0.3; // hunched forward
  torsoGroup.add(chest);

  // Abdomen lower core
  const pelvisGeo = new THREE.DodecahedronGeometry(0.28);
  const pelvis = new THREE.Mesh(pelvisGeo, fleshMat);
  pelvis.position.set(0, -0.4, -0.1);
  pelvis.castShadow = true;
  torsoGroup.add(pelvis);

  // Jagged protruding spine along the back (Secondary Silhouette)
  const spineGroup = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const spikeGeo = new THREE.ConeGeometry(0.06, 0.25, 4);
    const spike = new THREE.Mesh(spikeGeo, boneMat);
    spike.position.set(0, 0.3 - i * 0.14, -0.28 - Math.sin(i * 0.5) * 0.08);
    spike.rotation.x = -1.2 + i * 0.1;
    spike.castShadow = true;
    spineGroup.add(spike);
  }
  torsoGroup.add(spineGroup);

  // Writhing back tendrils / tentacles
  const tendrilGroup = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const tGeo = new THREE.CylinderGeometry(0.02, 0.04, 0.6, 5);
    const tendril = new THREE.Mesh(tGeo, fleshMat);
    const side = i % 2 === 0 ? 1 : -1;
    tendril.position.set(side * 0.18, 0.15 + (i > 1 ? 0.2 : 0), -0.22);
    tendril.rotation.set(0.6, side * 0.4, side * 0.5);
    tendrilGroup.add(tendril);
  }
  torsoGroup.add(tendrilGroup);

  // 2. Head Assembly (Accent Detail & Terror Focus)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.45, 0.22);

  // Elongated demonic skull
  const skullGeo = new THREE.ConeGeometry(0.22, 0.55, 6);
  skullGeo.rotateX(-Math.PI * 0.5);
  skullGeo.scale(0.8, 0.7, 1.2);
  const skull = new THREE.Mesh(skullGeo, fleshMat);
  skull.castShadow = true;
  headGroup.add(skull);

  // Unhinged Lower Jaw with sharp needle teeth
  const jawGeo = new THREE.BoxGeometry(0.18, 0.08, 0.35);
  const jaw = new THREE.Mesh(jawGeo, boneMat);
  jaw.position.set(0, -0.15, 0.1);
  jaw.rotation.x = 0.25;
  jaw.castShadow = true;
  headGroup.add(jaw);

  // Bioluminescent red eye slits (4 slit eyes)
  const eyeGeo = new THREE.BoxGeometry(0.04, 0.03, 0.06);
  const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
  eyeMesh.position.set(0.09, 0.04, 0.18);
  const eyeMesh2 = eyeMesh.clone();
  eyeMesh2.position.x = -0.09;
  const eyeMesh3 = eyeMesh.clone();
  eyeMesh3.position.set(0.06, 0.1, 0.12);
  const eyeMesh4 = eyeMesh.clone();
  eyeMesh4.position.set(-0.06, 0.1, 0.12);

  const eyesGroup = new THREE.Group();
  eyesGroup.add(eyeMesh, eyeMesh2, eyeMesh3, eyeMesh4);
  headGroup.add(eyesGroup);

  // Sinister localized red glow emanating from face
  const eyeLight = new THREE.PointLight(0xff1100, 2.2, 5);
  eyeLight.position.set(0, 0.05, 0.3);
  headGroup.add(eyeLight);

  torsoGroup.add(headGroup);

  // 3. Elongated Arm Assemblies (Secondary + Accent silhouette: Razor Scythes)
  const createArm = (isLeft: boolean) => {
    const armRoot = new THREE.Group();
    const sign = isLeft ? -1 : 1;
    armRoot.position.set(sign * 0.38, 0.28, 0.05);

    // Shoulder & Upper Arm
    const upperGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.65, 6);
    upperGeo.translate(0, -0.3, 0);
    const upperArm = new THREE.Mesh(upperGeo, fleshMat);
    upperArm.castShadow = true;
    upperArm.rotation.z = sign * -0.2;
    armRoot.add(upperArm);

    // Forearm & Elbow
    const forearmRoot = new THREE.Group();
    forearmRoot.position.set(0, -0.6, 0);

    const foreGeo = new THREE.CylinderGeometry(0.06, 0.045, 0.7, 6);
    foreGeo.translate(0, -0.32, 0);
    const foreArm = new THREE.Mesh(foreGeo, fleshMat);
    foreArm.castShadow = true;
    forearmRoot.add(foreArm);

    // Bone Scythe Claw / Appendage (Large lethal curved blade)
    const bladeGeo = new THREE.ConeGeometry(0.06, 0.6, 5);
    bladeGeo.translate(0, -0.3, 0);
    bladeGeo.scale(0.3, 1.0, 1.4);
    bladeGeo.rotateX(0.4);
    const claw = new THREE.Mesh(bladeGeo, clawMat);
    claw.position.set(0, -0.68, 0.08);
    claw.castShadow = true;
    forearmRoot.add(claw);

    // Secondary sub-claws
    for (let c = 0; c < 3; c++) {
      const subClawGeo = new THREE.ConeGeometry(0.025, 0.28, 4);
      subClawGeo.translate(0, -0.14, 0);
      const subClaw = new THREE.Mesh(subClawGeo, clawMat);
      subClaw.position.set((c - 1) * 0.04, -0.65, -0.04);
      subClaw.rotation.x = -0.3;
      forearmRoot.add(subClaw);
    }

    armRoot.add(forearmRoot);
    return { armRoot, forearmRoot };
  };

  const leftArmData = createArm(true);
  const rightArmData = createArm(false);
  torsoGroup.add(leftArmData.armRoot);
  torsoGroup.add(rightArmData.armRoot);

  // 4. Reverse-Jointed Digitigrade Leg Assemblies
  const createLeg = (isLeft: boolean) => {
    const legRoot = new THREE.Group();
    const sign = isLeft ? -1 : 1;
    legRoot.position.set(sign * 0.2, -0.35, -0.05);

    // Thigh
    const thighGeo = new THREE.CylinderGeometry(0.09, 0.065, 0.65, 6);
    thighGeo.translate(0, -0.3, 0);
    const thigh = new THREE.Mesh(thighGeo, fleshMat);
    thigh.castShadow = true;
    thigh.rotation.x = 0.4;
    legRoot.add(thigh);

    // Shin (backward slant)
    const shinRoot = new THREE.Group();
    shinRoot.position.set(0, -0.55, 0.2);
    const shinGeo = new THREE.CylinderGeometry(0.06, 0.045, 0.75, 6);
    shinGeo.translate(0, -0.35, 0);
    const shin = new THREE.Mesh(shinGeo, fleshMat);
    shin.castShadow = true;
    shin.rotation.x = -0.8;
    shinRoot.add(shin);

    // Talon Foot
    const footGeo = new THREE.BoxGeometry(0.12, 0.06, 0.35);
    const foot = new THREE.Mesh(footGeo, clawMat);
    foot.position.set(0, -0.7, -0.12);
    foot.castShadow = true;
    shinRoot.add(foot);

    legRoot.add(shinRoot);
    return legRoot;
  };

  const leftLeg = createLeg(true);
  const rightLeg = createLeg(false);
  torsoGroup.add(leftLeg);
  torsoGroup.add(rightLeg);

  root.add(torsoGroup);

  return {
    group: root,
    torso: torsoGroup,
    head: headGroup,
    leftArm: leftArmData.armRoot,
    rightArm: rightArmData.armRoot,
    leftForearm: leftArmData.forearmRoot,
    rightForearm: rightArmData.forearmRoot,
    leftLeg,
    rightLeg,
    jaw,
    eyeLight,
    eyesMesh: eyeMesh,
    tendrils: tendrilGroup,
  };
}

export interface ElementModel {
  group: THREE.Group;
  coreMesh: THREE.Mesh;
  light: THREE.PointLight;
  typeId: number; // 0: Alpha, 1: Beta, 2: Gamma, 3: Delta
}

export function createReactorElement(typeId: number): ElementModel {
  const group = new THREE.Group();
  group.name = `Element_${typeId}`;

  const colors = [
    { main: 0x00e5ff, name: 'Alpha (Cryo-Coolant)' },
    { main: 0xffaa00, name: 'Beta (Quantum Cell)' },
    { main: 0x10ff40, name: 'Gamma (Bio-Catalyst)' },
    { main: 0xd900ff, name: 'Delta (Overload Key)' },
  ];
  const { main } = colors[typeId];

  // Core housing base (metal heavy socket)
  const baseGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.14, 8);
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x24272c,
    metalness: 0.85,
    roughness: 0.25,
  });
  const base = new THREE.Mesh(baseGeo, metalMat);
  base.position.y = 0.07;
  base.castShadow = true;
  group.add(base);

  // Top cap
  const topCap = new THREE.Mesh(baseGeo, metalMat);
  topCap.position.y = 0.65;
  topCap.scale.set(0.85, 0.7, 0.85);
  topCap.castShadow = true;
  group.add(topCap);

  // Outer protective transparent glass cylinder
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.9,
    ior: 1.5,
  });
  const glassGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 16);
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.y = 0.36;
  group.add(glass);

  // Inner floating radiant core
  const coreGeo = new THREE.OctahedronGeometry(0.1, 0);
  const coreMat = new THREE.MeshStandardMaterial({
    color: main,
    emissive: main,
    emissiveIntensity: 3.0,
    roughness: 0.1,
    metalness: 0.2,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.position.y = 0.36;
  group.add(coreMesh);

  // Orbital floating rings
  const ringGeo = new THREE.TorusGeometry(0.12, 0.015, 6, 16);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x666666,
    metalness: 0.9,
    roughness: 0.2,
  });
  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.position.y = 0.36;
  ring1.rotation.x = Math.PI * 0.25;
  group.add(ring1);

  // Point light for glowing aura
  const light = new THREE.PointLight(main, 1.8, 4.5);
  light.position.y = 0.36;
  group.add(light);

  return { group, coreMesh, light, typeId };
}

/**
 * Reactor Core Center with 4 Element Sockets & Detonation Switch
 */
export function createReactorCoreModel(textures: FacilityTextures): {
  group: THREE.Group;
  screenMesh: THREE.Mesh;
  corePlasma: THREE.Mesh;
  detonateButton: THREE.Mesh;
  socketSlots: THREE.Mesh[];
  coreLight: THREE.PointLight;
} {
  const group = new THREE.Group();
  group.name = 'ReactorCore';

  // Base platform
  const baseGeo = new THREE.CylinderGeometry(2.4, 2.7, 0.6, 16);
  const baseMat = new THREE.MeshStandardMaterial({
    map: textures.floor,
    roughnessMap: textures.floorRoughness,
    roughness: 0.5,
    metalness: 0.4,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.3;
  base.receiveShadow = true;
  group.add(base);

  // Central Chamber Column
  const colGeo = new THREE.CylinderGeometry(1.2, 1.2, 3.2, 16);
  const colMat = new THREE.MeshStandardMaterial({
    map: textures.metal,
    roughness: 0.4,
    metalness: 0.8,
  });
  const column = new THREE.Mesh(colGeo, colMat);
  column.position.y = 2.2;
  column.castShadow = true;
  group.add(column);

  // Glowing Plasma Chamber Window
  const plasmaGeo = new THREE.SphereGeometry(0.65, 16, 16);
  const plasmaMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00aacc,
    emissiveIntensity: 2.5,
    roughness: 0.2,
  });
  const corePlasma = new THREE.Mesh(plasmaGeo, plasmaMat);
  corePlasma.position.set(0, 2.2, 0);
  group.add(corePlasma);

  const coreLight = new THREE.PointLight(0x00e5ff, 3.0, 10);
  coreLight.position.set(0, 2.2, 0);
  group.add(coreLight);

  // Diagnostics Screen facing the console
  const scrGeo = new THREE.PlaneGeometry(1.4, 0.9);
  const scrMat = new THREE.MeshBasicMaterial({
    map: textures.reactorScreen,
  });
  const screenMesh = new THREE.Mesh(scrGeo, scrMat);
  screenMesh.position.set(0, 2.3, 1.22);
  group.add(screenMesh);

  // Control Console Table
  const tableGeo = new THREE.BoxGeometry(1.6, 0.9, 0.7);
  const tableMat = new THREE.MeshStandardMaterial({
    map: textures.metal,
    roughness: 0.35,
    metalness: 0.7,
  });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.set(0, 0.8, 1.8);
  table.castShadow = true;
  group.add(table);

  // 4 Socket Slots on table
  const socketSlots: THREE.Mesh[] = [];
  const slotGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
  const slotMatInactive = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
    metalness: 0.2,
  });

  [-0.45, -0.15, 0.15, 0.45].forEach((x, i) => {
    const slot = new THREE.Mesh(slotGeo, slotMatInactive.clone());
    slot.position.set(x, 1.28, 1.8);
    slot.name = `ReactorSlot_${i}`;
    group.add(slot);
    socketSlots.push(slot);
  });

  // Emergency Self-Destruct Lever / Button
  const btnBaseGeo = new THREE.BoxGeometry(0.3, 0.1, 0.25);
  const btnBaseMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
  const btnBase = new THREE.Mesh(btnBaseGeo, btnBaseMat);
  btnBase.position.set(0, 1.29, 1.6);
  group.add(btnBase);

  const btnGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.07, 12);
  const btnMat = new THREE.MeshStandardMaterial({
    color: 0xbb0000,
    emissive: 0x550000,
    roughness: 0.2,
  });
  const detonateButton = new THREE.Mesh(btnGeo, btnMat);
  detonateButton.position.set(0, 1.34, 1.6);
  detonateButton.name = 'DetonateButton';
  group.add(detonateButton);

  return {
    group,
    screenMesh,
    corePlasma,
    detonateButton,
    socketSlots,
    coreLight,
  };
}

/**
 * Broken Containment Cell where Subject 67 escaped
 */
export function createBrokenContainmentCell(textures: FacilityTextures): THREE.Group {
  const group = new THREE.Group();

  const frameGeo = new THREE.CylinderGeometry(1.1, 1.1, 3.4, 12, 1, true);
  const frameMat = new THREE.MeshStandardMaterial({
    map: textures.containmentPod,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
    roughness: 0.3,
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.y = 1.7;
  group.add(frame);

  // Upper and lower steel rings
  const ringGeo = new THREE.TorusGeometry(1.1, 0.1, 8, 16);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
  const bottomRing = new THREE.Mesh(ringGeo, ringMat);
  bottomRing.rotation.x = Math.PI * 0.5;
  bottomRing.position.y = 0.05;
  group.add(bottomRing);

  const topRing = bottomRing.clone();
  topRing.position.y = 3.35;
  group.add(topRing);

  // Dripping blood splatter decal on ground
  const bloodDecalGeo = new THREE.PlaneGeometry(1.8, 1.8);
  const bloodMat = new THREE.MeshBasicMaterial({
    map: textures.bloodDecal,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const bloodMesh = new THREE.Mesh(bloodDecalGeo, bloodMat);
  bloodMesh.rotation.x = -Math.PI * 0.5;
  bloodMesh.position.set(0.4, 0.02, 0.8);
  bloodMesh.material.polygonOffset = true;
  bloodMesh.material.polygonOffsetFactor = -1;
  group.add(bloodMesh);

  return group;
}

/**
 * Server Rack with blinking LED rows
 */
export function createServerRack(textures: FacilityTextures): THREE.Group {
  const group = new THREE.Group();

  const rackGeo = new THREE.BoxGeometry(0.9, 2.4, 0.8);
  const rackMat = new THREE.MeshStandardMaterial({
    map: textures.metal,
    roughness: 0.4,
    metalness: 0.7,
  });
  const rack = new THREE.Mesh(rackGeo, rackMat);
  rack.position.y = 1.2;
  rack.castShadow = true;
  group.add(rack);

  // Blinking green/amber server LEDs
  for (let r = 0; r < 5; r++) {
    const ledGeo = new THREE.BoxGeometry(0.7, 0.04, 0.02);
    const ledMat = new THREE.MeshBasicMaterial({
      color: r % 2 === 0 ? 0x00ff44 : 0xffaa00,
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 0.5 + r * 0.35, 0.41);
    group.add(led);
  }

  return group;
}

/**
 * First-person held Flashlight Model
 */
export function createHeldFlashlight(): THREE.Group {
  const group = new THREE.Group();

  const handleGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.22, 10);
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x181a1e,
    roughness: 0.6,
    metalness: 0.4,
  });
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.rotation.x = Math.PI * 0.5;
  group.add(handle);

  const headGeo = new THREE.CylinderGeometry(0.045, 0.03, 0.08, 12);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x2e3238,
    roughness: 0.3,
    metalness: 0.8,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.rotation.x = Math.PI * 0.5;
  head.position.z = -0.13;
  group.add(head);

  // Lens
  const lensGeo = new THREE.CircleGeometry(0.042, 12);
  const lensMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lens = new THREE.Mesh(lensGeo, lensMat);
  lens.position.z = -0.171;
  lens.rotation.y = Math.PI;
  group.add(lens);

  return group;
}
