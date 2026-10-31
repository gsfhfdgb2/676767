/**
 * Sector 67 Facility Map, Collision Grid, Lighting & Props
 */
import * as THREE from 'three';
import { FacilityTextures } from './textures';
import {
  createReactorElement,
  createReactorCoreModel,
  createBrokenContainmentCell,
  createServerRack,
  ElementModel,
} from './models';

export interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface InteractiveDoor {
  group: THREE.Group;
  doorMesh: THREE.Mesh;
  isOpen: boolean;
  isLocked: boolean;
  collider: BoxCollider;
  position: THREE.Vector3;
  openAmount: number; // 0 (closed) to 1 (open)
  targetOpen: number;
  axis: 'x' | 'z';
}

export interface LoreNote {
  id: string;
  title: string;
  text: string;
  position: THREE.Vector3;
}

export interface FacilityData {
  sceneGroup: THREE.Group;
  colliders: BoxCollider[];
  elements: ElementModel[];
  doors: InteractiveDoor[];
  loreNotes: LoreNote[];
  reactor: ReturnType<typeof createReactorCoreModel>;
  elevatorPos: THREE.Vector3;
  lights: {
    flickerLights: THREE.PointLight[];
    emergencyBeacons: THREE.PointLight[];
  };
}

export function buildFacility(textures: FacilityTextures): FacilityData {
  const facilityGroup = new THREE.Group();
  facilityGroup.name = 'FacilityRoot';

  const colliders: BoxCollider[] = [];
  const doors: InteractiveDoor[] = [];
  const flickerLights: THREE.PointLight[] = [];
  const emergencyBeacons: THREE.PointLight[] = [];

  // Helper to add a solid wall and its collider
  const wallMat = new THREE.MeshStandardMaterial({
    map: textures.wall,
    roughnessMap: textures.wallRoughness,
    roughness: 0.8,
    metalness: 0.2,
  });

  const addWall = (x: number, z: number, width: number, depth: number, height: number = 4) => {
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, wallMat);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    facilityGroup.add(mesh);

    // Expand bounding box slightly for comfortable player radius
    const hw = width / 2;
    const hd = depth / 2;
    colliders.push({
      minX: x - hw - 0.35,
      maxX: x + hw + 0.35,
      minZ: z - hd - 0.35,
      maxZ: z + hd + 0.35,
    });
  };

  // Floor and Ceiling
  const floorGeo = new THREE.PlaneGeometry(80, 80);
  const floorMat = new THREE.MeshStandardMaterial({
    map: textures.floor,
    roughnessMap: textures.floorRoughness,
    roughness: 0.6,
    metalness: 0.3,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI * 0.5;
  floor.receiveShadow = true;
  facilityGroup.add(floor);

  const ceilMat = new THREE.MeshStandardMaterial({
    map: textures.ceiling,
    roughness: 0.7,
    metalness: 0.2,
  });
  const ceiling = new THREE.Mesh(floorGeo, ceilMat);
  ceiling.rotation.x = Math.PI * 0.5;
  ceiling.position.y = 4.0;
  facilityGroup.add(ceiling);

  // Facility Boundary Walls
  addWall(0, -40, 80, 1.5);
  addWall(0, 40, 80, 1.5);
  addWall(-40, 0, 1.5, 80);
  addWall(40, 0, 1.5, 80);

  // 1. Central Reactor Core Chamber (16x16 at 0, 0)
  // Walls with 4 archway openings to N, S, E, W
  addWall(-5, -8, 6, 1);
  addWall(5, -8, 6, 1);
  addWall(-5, 8, 6, 1);
  addWall(5, 8, 6, 1);

  addWall(-8, -5, 1, 6);
  addWall(-8, 5, 1, 6);
  addWall(8, -5, 1, 6);
  addWall(8, 5, 1, 6);

  // Central Reactor Model
  const reactor = createReactorCoreModel(textures);
  reactor.group.position.set(0, 0, 0);
  facilityGroup.add(reactor.group);
  colliders.push({
    minX: -1.6,
    maxX: 1.6,
    minZ: -1.6,
    maxZ: 2.2,
  });

  // 2. North Wing: Deep Cryo Storage (x: -12 to 12, z: -20 to -36)
  // Corridors connecting 0, -8 to 0, -20
  addWall(-3, -14, 1, 12);
  addWall(3, -14, 1, 12);

  // Cryo Lab Chamber walls
  addWall(-8, -20, 10, 1);
  addWall(8, -20, 10, 1);
  addWall(-14, -28, 1, 16);
  addWall(14, -28, 1, 16);
  addWall(0, -36, 28, 1);

  // 3. East Wing: High-Voltage Power Substation (x: 20 to 36, z: -10 to 10)
  // Corridors connecting 8, 0 to 20, 0
  addWall(14, -3, 12, 1);
  addWall(14, 3, 12, 1);

  // Substation Room walls
  addWall(20, -7, 1, 8);
  addWall(20, 7, 1, 8);
  addWall(36, 0, 1, 20);
  addWall(28, -10, 16, 1);
  addWall(28, 10, 16, 1);

  // 4. South Wing: Incubation Chamber & Containment Pods (x: -12 to 12, z: 20 to 36)
  // Corridors connecting 0, 8 to 0, 20
  addWall(-3, 14, 1, 12);
  addWall(3, 14, 1, 12);

  // Incubation Room walls
  addWall(-8, 20, 10, 1);
  addWall(8, 20, 10, 1);
  addWall(-14, 28, 1, 16);
  addWall(14, 28, 1, 16);
  addWall(0, 36, 28, 1);

  // 5. West Wing: Observation Bunker & Science Lab (x: -36 to -20, z: -10 to 10)
  // Corridors connecting -8, 0 to -20, 0
  addWall(-14, -3, 12, 1);
  addWall(-14, 3, 12, 1);

  // Observation Room walls
  addWall(-20, -7, 1, 8);
  addWall(-20, 7, 1, 8);
  addWall(-36, 0, 1, 20);
  addWall(-28, -10, 16, 1);
  addWall(-28, 10, 16, 1);

  // Side hiding alcoves & loops for stealth gameplay!
  // Loop between North and West
  addWall(-14, -14, 1, 10);
  addWall(-22, -14, 1, 10);
  // Loop between North and East
  addWall(14, -14, 1, 10);
  addWall(22, -14, 1, 10);

  // Broken Pod in South Wing (Incubation cell where Subject 67 escaped)
  const brokenCell = createBrokenContainmentCell(textures);
  brokenCell.position.set(0, 0, 28);
  facilityGroup.add(brokenCell);

  // Server Racks in Cryo and Substation
  const rack1 = createServerRack(textures);
  rack1.position.set(-8, 0, -28);
  facilityGroup.add(rack1);
  colliders.push({ minX: -8.8, maxX: -7.2, minZ: -28.8, maxZ: -27.2 });

  const rack2 = createServerRack(textures);
  rack2.position.set(8, 0, -28);
  facilityGroup.add(rack2);
  colliders.push({ minX: 7.2, maxX: 8.8, minZ: -28.8, maxZ: -27.2 });

  const rack3 = createServerRack(textures);
  rack3.position.set(28, 0, -6);
  facilityGroup.add(rack3);

  // Blast Doors (Can be opened / closed to evade Subject 67)
  const createDoor = (x: number, z: number, axis: 'x' | 'z'): InteractiveDoor => {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(x, 0, z);

    // Frame
    const frameMat = new THREE.MeshStandardMaterial({
      map: textures.hazard,
      metalness: 0.8,
      roughness: 0.3,
    });
    const frameGeo = axis === 'z' ? new THREE.BoxGeometry(0.4, 3.6, 3.2) : new THREE.BoxGeometry(3.2, 3.6, 0.4);
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 1.8;
    doorGroup.add(frame);

    // Sliding Door panel
    const doorGeo = axis === 'z' ? new THREE.BoxGeometry(0.25, 3.2, 2.6) : new THREE.BoxGeometry(2.6, 3.2, 0.25);
    const doorMat = new THREE.MeshStandardMaterial({
      map: textures.metal,
      metalness: 0.85,
      roughness: 0.25,
    });
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.y = 1.6;
    doorMesh.castShadow = true;
    doorGroup.add(doorMesh);

    // Status Indicator Light (Green = open, Red = closed)
    const indLight = new THREE.PointLight(0x00ff00, 0.8, 3);
    indLight.position.set(0, 3.2, 0);
    doorGroup.add(indLight);

    facilityGroup.add(doorGroup);

    const collider: BoxCollider = {
      minX: x - (axis === 'z' ? 0.3 : 1.4),
      maxX: x + (axis === 'z' ? 0.3 : 1.4),
      minZ: z - (axis === 'z' ? 1.4 : 0.3),
      maxZ: z + (axis === 'z' ? 1.4 : 0.3),
    };

    return {
      group: doorGroup,
      doorMesh,
      isOpen: false,
      isLocked: false,
      collider,
      position: new THREE.Vector3(x, 0, z),
      openAmount: 0,
      targetOpen: 0,
      axis,
    };
  };

  // Place interactive doors at sector gates
  doors.push(createDoor(0, -8, 'x')); // North door
  doors.push(createDoor(8, 0, 'z')); // East door
  doors.push(createDoor(0, 8, 'x')); // South door
  doors.push(createDoor(-8, 0, 'z')); // West door

  // 4 Reactor Elements Scattered Across the 4 Wings:
  // Alpha: North Wing (Cryo Lab)
  // Beta: East Wing (Power Substation)
  // Gamma: South Wing (Incubation Cell)
  // Delta: West Wing (Observation Bunker)
  const elements: ElementModel[] = [
    createReactorElement(0), // Alpha
    createReactorElement(1), // Beta
    createReactorElement(2), // Gamma
    createReactorElement(3), // Delta
  ];

  elements[0].group.position.set(0, 0.8, -30);
  elements[1].group.position.set(30, 0.8, 0);
  elements[2].group.position.set(0, 0.8, 30);
  elements[3].group.position.set(-30, 0.8, 0);

  elements.forEach((el) => facilityGroup.add(el.group));

  // Extraction Elevator at Sector Boundary (x: -5, z: -38)
  const elevatorPos = new THREE.Vector3(0, 0, -38);
  const elevGeo = new THREE.CylinderGeometry(2.0, 2.0, 3.5, 12, 1, true);
  const elevMat = new THREE.MeshStandardMaterial({
    map: textures.hazard,
    roughness: 0.3,
    metalness: 0.8,
  });
  const elevMesh = new THREE.Mesh(elevGeo, elevMat);
  elevMesh.position.set(elevatorPos.x, 1.75, elevatorPos.z);
  facilityGroup.add(elevMesh);

  // Surface Elevator Emergency Light
  const elevLight = new THREE.PointLight(0x00ff88, 2.5, 8);
  elevLight.position.set(elevatorPos.x, 3.2, elevatorPos.z);
  facilityGroup.add(elevLight);

  // Overhead Lighting Fixtures & Emergency Beacons
  const addLightNode = (x: number, y: number, z: number, color: number, intensity: number, flicker: boolean = true) => {
    const light = new THREE.PointLight(color, intensity, 14);
    light.position.set(x, y, z);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    facilityGroup.add(light);

    // Lamp fixture housing
    const fixtureGeo = new THREE.BoxGeometry(0.8, 0.15, 0.4);
    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
    fixture.position.set(x, 3.9, z);
    facilityGroup.add(fixture);

    if (flicker) flickerLights.push(light);
    return light;
  };

  // Central Chamber Lights (Eerie faint white/cyan)
  addLightNode(0, 3.7, 0, 0xaaddee, 2.2, true);
  addLightNode(-4, 3.7, -4, 0x88bbcc, 1.4, false);
  addLightNode(4, 3.7, 4, 0x88bbcc, 1.4, false);

  // Wing Lights
  addLightNode(0, 3.7, -24, 0x77ddff, 2.0, true); // Cryo
  addLightNode(24, 3.7, 0, 0xffbb55, 2.0, true); // Substation
  addLightNode(0, 3.7, 24, 0x44ff77, 2.0, true); // Incubation
  addLightNode(-24, 3.7, 0, 0xff5555, 2.0, true); // Bunker

  // Emergency Red Rotating Beacons (Used when alarm is triggered)
  const addBeacon = (x: number, z: number) => {
    const beacon = new THREE.PointLight(0xff0000, 0, 16);
    beacon.position.set(x, 3.6, z);
    facilityGroup.add(beacon);
    emergencyBeacons.push(beacon);
  };
  addBeacon(0, 0);
  addBeacon(0, -28);
  addBeacon(28, 0);
  addBeacon(0, 28);
  addBeacon(-28, 0);

  // Lore notes / Terminals
  const loreNotes: LoreNote[] = [
    {
      id: 'note_1',
      title: 'ДНЕВНИК ДОКТОРА ВАСИЛЬЕВА (02:14)',
      text: 'Объект 67 проявил мутацию третьего порядка. Стандартные седативные препараты не действуют. Оно чувствует вибрации шагов и свет фонарей. Если оно вырвется, единственный способ — активировать перегрузку реактора через 4 стержня.',
      position: new THREE.Vector3(-28, 1.2, 5),
    },
    {
      id: 'note_2',
      title: 'ПРОТОКОЛ БЕЗОПАСНОСТИ СЕКТОРА 67',
      text: 'ВНИМАНИЕ ПЕРСОНАЛУ: Элементы стабилизации реактора разделены по отсекам (Крио-лаборатория, Подстанция, Инкубатор, Бункер). В случае катастрофы соберите все 4 и запустите кнопку самоуничтожения.',
      position: new THREE.Vector3(-2, 1.2, -7),
    },
    {
      id: 'note_3',
      title: 'РАПОРТ О БРЕШИ В ИНКУБАТОРЕ',
      text: 'Оно выломало бронированное стекло капсулы. Камеры зафиксировали огромные костяные жнецы на конечностях. Не бегайте рядом с ним — присядьте и выключите фонарик!',
      position: new THREE.Vector3(5, 1.2, 22),
    },
  ];

  return {
    sceneGroup: facilityGroup,
    colliders,
    elements,
    doors,
    loreNotes,
    reactor,
    elevatorPos,
    lights: {
      flickerLights,
      emergencyBeacons,
    },
  };
}
