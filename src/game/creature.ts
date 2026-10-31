/**
 * Subject 67 Monster AI & Kinematics
 * Advanced sensory perception (footstep noise, flashlight beam, line-of-sight),
 * multi-part procedural animation, and terror radius.
 */
import * as THREE from 'three';
import { createSubject67Model, CreatureParts } from './models';
import { BoxCollider, InteractiveDoor } from './facility';
import { soundEngine } from './audio';

export type CreatureState = 'PATROL' | 'INVESTIGATE' | 'CHASE' | 'ATTACK';

export interface CreatureAI {
  model: CreatureParts;
  state: CreatureState;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationY: number;
  terrorLevel: number; // 0 to 1
  healthDamage: number; // damage dealt to player
  update: (
    delta: number,
    playerPos: THREE.Vector3,
    isPlayerRunning: boolean,
    isPlayerCrouching: boolean,
    isFlashlightOn: boolean,
    colliders: BoxCollider[],
    doors: InteractiveDoor[]
  ) => void;
  reset: (spawnPos?: THREE.Vector3) => void;
}

export function createSubject67AI(): CreatureAI {
  const model = createSubject67Model();

  // Patrol Waypoints across Sector 67
  const waypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 0, 24), // Incubation wing
    new THREE.Vector3(0, 0, 8), // South junction
    new THREE.Vector3(0, 0, 0), // Central reactor
    new THREE.Vector3(18, 0, 0), // East substation
    new THREE.Vector3(0, 0, -18), // North corridor
    new THREE.Vector3(0, 0, -28), // Cryo lab
    new THREE.Vector3(-18, 0, 0), // West bunker
  ];

  let currentWpIndex = 0;
  let state: CreatureState = 'PATROL';
  let targetPos = waypoints[0].clone();
  let stateTimer = 0;
  let roarCooldown = 0;
  let attackCooldown = 0;
  let terrorLevel = 0;
  let healthDamage = 0;
  let animTime = 0;

  const position = new THREE.Vector3(0, 0, 26);
  const velocity = new THREE.Vector3();
  let rotationY = 0;

  model.group.position.copy(position);

  const reset = (spawnPos?: THREE.Vector3) => {
    position.copy(spawnPos || new THREE.Vector3(0, 0, 26));
    model.group.position.copy(position);
    state = 'PATROL';
    currentWpIndex = 0;
    targetPos.copy(waypoints[0]);
    stateTimer = 0;
    roarCooldown = 0;
    attackCooldown = 0;
    terrorLevel = 0;
    healthDamage = 0;
  };

  const update = (
    delta: number,
    playerPos: THREE.Vector3,
    isPlayerRunning: boolean,
    isPlayerCrouching: boolean,
    isFlashlightOn: boolean,
    colliders: BoxCollider[],
    doors: InteractiveDoor[]
  ) => {
    healthDamage = 0;
    stateTimer += delta;
    animTime += delta;
    if (roarCooldown > 0) roarCooldown -= delta;
    if (attackCooldown > 0) attackCooldown -= delta;

    const distToPlayer = position.distanceTo(playerPos);

    // 1. Sensory Perception (Footstep noise, flashlight detection)
    const noiseHearingRange = isPlayerRunning ? 24 : isPlayerCrouching ? 4 : 11;
    const canHearPlayer = distToPlayer < noiseHearingRange;

    // Flashlight beam detection: if monster is close and player is shining flashlight
    const playerToMonster = position.clone().sub(playerPos).normalize();
    const canSeeFlashlight = isFlashlightOn && distToPlayer < 20;

    // State Transitions
    if (state === 'PATROL') {
      if (distToPlayer < 8 || (canSeeFlashlight && distToPlayer < 16)) {
        state = 'CHASE';
        stateTimer = 0;
        if (roarCooldown <= 0) {
          soundEngine.playCreatureRoar(distToPlayer / 30);
          roarCooldown = 6.0;
        }
      } else if (canHearPlayer || (canSeeFlashlight && distToPlayer < 22)) {
        state = 'INVESTIGATE';
        targetPos.copy(playerPos);
        stateTimer = 0;
      } else {
        // Patrol waypoint navigation
        if (position.distanceTo(targetPos) < 2.0) {
          currentWpIndex = (currentWpIndex + 1) % waypoints.length;
          targetPos.copy(waypoints[currentWpIndex]);
        }
      }
    } else if (state === 'INVESTIGATE') {
      if (distToPlayer < 9 || (canSeeFlashlight && distToPlayer < 18)) {
        state = 'CHASE';
        stateTimer = 0;
        if (roarCooldown <= 0) {
          soundEngine.playCreatureRoar(distToPlayer / 30);
          roarCooldown = 5.0;
        }
      } else if (canHearPlayer) {
        targetPos.copy(playerPos);
      } else if (stateTimer > 7.0 || position.distanceTo(targetPos) < 1.5) {
        state = 'PATROL';
        targetPos.copy(waypoints[currentWpIndex]);
      }
    } else if (state === 'CHASE') {
      targetPos.copy(playerPos);

      // If player managed to hide far away and quiet
      if (distToPlayer > 26 && !isPlayerRunning && !canSeeFlashlight) {
        state = 'INVESTIGATE';
        stateTimer = 0;
      }

      // Attack if in close melee range
      if (distToPlayer < 2.0 && attackCooldown <= 0) {
        state = 'ATTACK';
        stateTimer = 0;
        attackCooldown = 1.2;
        soundEngine.playJumpscare();
        healthDamage = 45; // Substantial damage
      }
    } else if (state === 'ATTACK') {
      if (stateTimer > 0.8) {
        state = 'CHASE';
      }
    }

    // 2. Movement & Door Obstruction
    let moveSpeed = 0;
    if (state === 'PATROL') moveSpeed = 2.0;
    else if (state === 'INVESTIGATE') moveSpeed = 3.0;
    else if (state === 'CHASE') moveSpeed = 5.2; // Fast predator sprint!
    else if (state === 'ATTACK') moveSpeed = 1.0;

    // Check if monster is blocked by a closed door
    let doorBlock = false;
    for (const door of doors) {
      if (!door.isOpen && position.distanceTo(door.position) < 2.2) {
        doorBlock = true;
        // Monster bangs on and breaks open door after 2 seconds
        if (stateTimer > 1.8) {
          door.targetOpen = 1.0;
          door.isOpen = true;
          soundEngine.playDoorSlide();
        }
        break;
      }
    }

    if (!doorBlock) {
      const dir = targetPos.clone().sub(position);
      dir.y = 0;
      if (dir.length() > 0.2) {
        dir.normalize();
        const targetRot = Math.atan2(dir.x, dir.z);
        // Smooth rotation damping
        rotationY = THREE.MathUtils.damp(rotationY, targetRot, 8, delta);

        const moveStep = dir.multiplyScalar(moveSpeed * delta);
        const nextX = position.x + moveStep.x;
        const nextZ = position.z + moveStep.z;

        // Wall collision check for monster
        let collideX = false;
        let collideZ = false;
        for (const col of colliders) {
          if (nextX >= col.minX && nextX <= col.maxX && position.z >= col.minZ && position.z <= col.maxZ) {
            collideX = true;
          }
          if (position.x >= col.minX && position.x <= col.maxX && nextZ >= col.minZ && nextZ <= col.maxZ) {
            collideZ = true;
          }
        }

        if (!collideX) position.x = nextX;
        if (!collideZ) position.z = nextZ;
      }
    }

    model.group.position.copy(position);
    model.group.rotation.y = rotationY;

    // Footstep audio when moving
    if (moveSpeed > 0 && Math.sin(animTime * moveSpeed * 3) > 0.95) {
      soundEngine.playMonsterStomp(Math.min(1.0, distToPlayer / 35));
    }

    // 3. Procedural Multi-Part Horror Animation
    const speedRatio = moveSpeed / 5.2;
    const walkCycle = Math.sin(animTime * (4 + speedRatio * 8));

    // Torso breathing & predatory hunch
    model.torso.position.y = 1.4 + Math.sin(animTime * 2) * 0.05 - speedRatio * 0.25;
    model.torso.rotation.x = 0.25 + speedRatio * 0.35 + Math.sin(animTime * 3) * 0.05;

    // Head erratic twitching
    model.head.rotation.y = Math.sin(animTime * 1.5) * 0.3 + (state === 'CHASE' ? Math.sin(animTime * 12) * 0.1 : 0);
    model.head.rotation.x = Math.sin(animTime * 2.2) * 0.15;

    // Jaws gaping wide when charging
    model.jaw.rotation.x = state === 'CHASE' || state === 'ATTACK' ? 0.6 + Math.sin(animTime * 8) * 0.2 : 0.2;

    // Limbs swinging
    model.leftArm.rotation.x = walkCycle * 0.6;
    model.rightArm.rotation.x = -walkCycle * 0.6;
    model.leftLeg.rotation.x = -walkCycle * 0.7;
    model.rightLeg.rotation.x = walkCycle * 0.7;

    // Claw scythes flexing
    const scytheFlex = Math.sin(animTime * 4) * 0.2;
    model.leftForearm.rotation.z = scytheFlex;
    model.rightForearm.rotation.z = -scytheFlex;

    // Back tendrils writhing
    model.tendrils.children.forEach((child, i) => {
      child.rotation.z = Math.sin(animTime * 6 + i) * 0.3;
    });

    // Eye glow intensity increases in chase mode
    const baseGlow = state === 'CHASE' ? 4.5 + Math.sin(animTime * 15) * 1.5 : 1.8;
    model.eyeLight.intensity = baseGlow;

    // 4. Terror level calculation (proximity + state)
    let rawTerror = Math.max(0, 1 - distToPlayer / 28);
    if (state === 'CHASE') rawTerror = Math.max(rawTerror, 0.7);
    terrorLevel = THREE.MathUtils.damp(terrorLevel, rawTerror, 4, delta);
  };

  return {
    model,
    state,
    position,
    velocity,
    rotationY,
    get terrorLevel() {
      return terrorLevel;
    },
    get healthDamage() {
      return healthDamage;
    },
    update,
    reset,
  };
}
