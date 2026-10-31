/**
 * First-Person Player Controller with Pointer Lock, Smooth Kinematics,
 * Collision Sliding, Stamina, Head Bobbing & Mobile Touch Joystick.
 */
import * as THREE from 'three';
import { BoxCollider } from './facility';
import { soundEngine } from './audio';

export interface PlayerInputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  crouch: boolean;
  interact: boolean;
}

export interface PlayerController {
  camera: THREE.PerspectiveCamera;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  stamina: number; // 0 to 100
  health: number; // 0 to 100
  isFlashlightOn: boolean;
  flashlightBattery: number; // 0 to 100
  isSprinting: boolean;
  isCrouching: boolean;
  isLocked: boolean;
  setVirtualInput: (key: keyof PlayerInputState, value: boolean) => void;
  rotateBy: (dx: number, dy: number) => void;
  update: (delta: number, colliders: BoxCollider[]) => void;
  toggleFlashlight: () => void;
  takeDamage: (amount: number) => void;
  reset: (spawnPos?: THREE.Vector3) => void;
  dispose: () => void;
}

export function createPlayerController(
  domElement: HTMLElement,
  camera: THREE.PerspectiveCamera
): PlayerController {
  const keys: PlayerInputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    crouch: false,
    interact: false,
  };

  const position = new THREE.Vector3(0, 1.7, -4);
  const velocity = new THREE.Vector3();
  const rotation = new THREE.Euler(0, 0, 0, 'YXZ');
  let isLocked = false;
  let stamina = 100;
  let health = 100;
  let isFlashlightOn = true;
  let flashlightBattery = 100;
  let headBobTime = 0;
  let isSprinting = false;
  let isCrouching = false;

  // Mouse Look
  const onMouseMove = (event: MouseEvent) => {
    if (!isLocked) return;
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    const sensitivity = 0.0022;
    rotation.y -= movementX * sensitivity;
    rotation.x -= movementY * sensitivity;

    // Pitch clamp (-85 to +85 degrees)
    rotation.x = Math.max(-Math.PI * 0.46, Math.min(Math.PI * 0.46, rotation.x));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keys.sprint = true;
        break;
      case 'KeyC':
      case 'ControlLeft':
      case 'ControlRight':
        keys.crouch = !keys.crouch; // toggle crouch
        break;
      case 'KeyF':
        toggleFlashlight();
        break;
      case 'KeyE':
        keys.interact = true;
        break;
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keys.sprint = false;
        break;
      case 'KeyE':
        keys.interact = false;
        break;
    }
  };

  const onPointerLockChange = () => {
    isLocked = document.pointerLockElement === domElement;
  };

  document.addEventListener('mousemove', onMouseMove);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  document.addEventListener('pointerlockchange', onPointerLockChange);

  const toggleFlashlight = () => {
    isFlashlightOn = !isFlashlightOn;
    soundEngine.playFlashlightClick();
  };

  const takeDamage = (amount: number) => {
    health = Math.max(0, health - amount);
  };

  const setVirtualInput = (key: keyof PlayerInputState, value: boolean) => {
    keys[key] = value;
  };

  const rotateBy = (dx: number, dy: number) => {
    const sensitivity = 0.003;
    rotation.y -= dx * sensitivity;
    rotation.x -= dy * sensitivity;
    rotation.x = Math.max(-Math.PI * 0.46, Math.min(Math.PI * 0.46, rotation.x));
  };

  const reset = (spawnPos?: THREE.Vector3) => {
    position.copy(spawnPos || new THREE.Vector3(0, 1.7, -4));
    velocity.set(0, 0, 0);
    rotation.set(0, 0, 0);
    health = 100;
    stamina = 100;
    flashlightBattery = 100;
    isFlashlightOn = true;
  };

  const update = (delta: number, colliders: BoxCollider[]) => {
    // 1. Stamina & Sprint logic
    const isMoving = keys.forward || keys.backward || keys.left || keys.right;
    isCrouching = keys.crouch;

    if (keys.sprint && isMoving && stamina > 5 && !isCrouching) {
      isSprinting = true;
      stamina = Math.max(0, stamina - 22 * delta);
    } else {
      isSprinting = false;
      stamina = Math.min(100, stamina + 14 * delta);
    }

    // 2. Movement Speeds (m/s)
    let targetSpeed = 3.2; // Normal walk
    if (isSprinting) targetSpeed = 6.2;
    if (isCrouching) targetSpeed = 1.6;

    // Movement direction in local camera space
    const moveDir = new THREE.Vector3();
    if (keys.forward) moveDir.z -= 1;
    if (keys.backward) moveDir.z += 1;
    if (keys.left) moveDir.x -= 1;
    if (keys.right) moveDir.x += 1;

    if (moveDir.length() > 0) {
      moveDir.normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.y);
    }

    // Smooth kinematic velocity damping
    const targetVelX = moveDir.x * targetSpeed;
    const targetVelZ = moveDir.z * targetSpeed;
    velocity.x = THREE.MathUtils.damp(velocity.x, targetVelX, 10, delta);
    velocity.z = THREE.MathUtils.damp(velocity.z, targetVelZ, 10, delta);

    // 3. Collision sliding along 2D Box colliders
    const nextX = position.x + velocity.x * delta;
    const nextZ = position.z + velocity.z * delta;

    let canMoveX = true;
    let canMoveZ = true;

    for (const col of colliders) {
      // Check X motion
      if (nextX >= col.minX && nextX <= col.maxX && position.z >= col.minZ && position.z <= col.maxZ) {
        canMoveX = false;
      }
      // Check Z motion
      if (position.x >= col.minX && position.x <= col.maxX && nextZ >= col.minZ && nextZ <= col.maxZ) {
        canMoveZ = false;
      }
    }

    if (canMoveX) position.x = nextX;
    if (canMoveZ) position.z = nextZ;

    // 4. Head bobbing & Camera positioning
    const currentSpeed = Math.hypot(velocity.x, velocity.z);
    if (currentSpeed > 0.5) {
      headBobTime += delta * (isSprinting ? 14 : isCrouching ? 7 : 10);
      soundEngine.playFootstep(isSprinting, isCrouching);
    }

    const eyeHeight = isCrouching ? 1.0 : 1.7;
    const bobOffset = Math.sin(headBobTime) * (isSprinting ? 0.08 : 0.04);
    const bobTilt = Math.cos(headBobTime) * 0.01;

    camera.position.set(position.x, eyeHeight + bobOffset, position.z);
    camera.rotation.copy(rotation);
    camera.rotation.z = bobTilt;

    // 5. Flashlight Battery slow drain
    if (isFlashlightOn) {
      flashlightBattery = Math.max(0, flashlightBattery - 0.5 * delta);
    }
  };

  const dispose = () => {
    document.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('pointerlockchange', onPointerLockChange);
  };

  return {
    camera,
    position,
    rotation,
    get stamina() {
      return stamina;
    },
    get health() {
      return health;
    },
    get isFlashlightOn() {
      return isFlashlightOn;
    },
    get flashlightBattery() {
      return flashlightBattery;
    },
    get isSprinting() {
      return isSprinting;
    },
    get isCrouching() {
      return isCrouching;
    },
    get isLocked() {
      return isLocked;
    },
    setVirtualInput,
    rotateBy,
    update,
    toggleFlashlight,
    takeDamage,
    reset,
    dispose,
  };
}
