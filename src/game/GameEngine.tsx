/**
 * Main 3D Game Engine Component for Subject 67
 * Integrates Three.js PBR scene, RoomEnvironment, player kinematics,
 * Subject 67 AI loop, interaction raycaster, and self-destruction sequence.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createProceduralTextures } from './textures';
import { buildFacility, FacilityData, InteractiveDoor, LoreNote } from './facility';
import { createSubject67AI, CreatureAI } from './creature';
import { createPlayerController, PlayerController } from './controls';
import { createHeldFlashlight } from './models';
import { soundEngine } from './audio';

export type GameStatus = 'PLAYING' | 'COUNTDOWN' | 'ESCAPED' | 'CAUGHT' | 'EXPLODED';

export interface GameEngineProps {
  onStatusChange: (status: GameStatus) => void;
  onElementsUpdate: (collected: boolean[], insertedCount: number) => void;
  onStatsUpdate: (health: number, stamina: number, battery: number, terror: number) => void;
  onInteractPrompt: (prompt: string | null) => void;
  onCountdownUpdate: (secondsLeft: number) => void;
  onReadNote: (note: LoreNote | null) => void;
  isPaused: boolean;
}

export const GameEngine: React.FC<GameEngineProps> = ({
  onStatusChange,
  onElementsUpdate,
  onStatsUpdate,
  onInteractPrompt,
  onCountdownUpdate,
  onReadNote,
  isPaused,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // References for mutable game loop state
  const playerRef = useRef<PlayerController | null>(null);
  const creatureRef = useRef<CreatureAI | null>(null);
  const facilityRef = useRef<FacilityData | null>(null);
  const flashlightRef = useRef<{
    spot: THREE.SpotLight;
    mesh: THREE.Group;
  } | null>(null);

  // Game progression state
  const collectedElementsRef = useRef<boolean[]>([false, false, false, false]);
  const insertedCountRef = useRef<number>(0);
  const gameStatusRef = useRef<GameStatus>('PLAYING');
  const countdownRef = useRef<number>(55.0); // 55 seconds self-destruct escape window
  const activePromptRef = useRef<string | null>(null);
  const cameraShakeRef = useRef<number>(0);

  // Pre-allocated math objects to avoid GC in the render loop
  const _raycaster = useRef(new THREE.Raycaster());
  const _centerVec = useRef(new THREE.Vector2(0, 0));
  const _tempVec = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    soundEngine.init();

    // 1. Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize WebGLRenderer & Scene
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07080a, 0.05);

    // Studio Environment reflection
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Hemisphere ambient light (cool ground, dim overhead)
    const hemiLight = new THREE.HemisphereLight(0x445566, 0x111620, 0.6);
    scene.add(hemiLight);

    // 3. Camera & Player Controls
    const camera = new THREE.PerspectiveCamera(72, width / height, 0.1, 100);
    const player = createPlayerController(canvasRef.current, camera);
    playerRef.current = player;

    // 4. Player Held Flashlight (PBR SpotLight)
    const spotLight = new THREE.SpotLight(0xfff5e6, 3.8, 28, Math.PI * 0.22, 0.45, 1.2);
    spotLight.castShadow = !isSoftwareGl;
    spotLight.shadow.bias = -0.0008;
    camera.add(spotLight);
    spotLight.position.set(0.2, -0.15, -0.1);
    spotLight.target.position.set(0, 0, -10);
    camera.add(spotLight.target);

    const heldFlashlight = createHeldFlashlight();
    heldFlashlight.position.set(0.28, -0.22, -0.4);
    camera.add(heldFlashlight);
    scene.add(camera);

    flashlightRef.current = { spot: spotLight, mesh: heldFlashlight };

    // 5. Procedural Textures & Facility Generation
    const textures = createProceduralTextures(renderer.capabilities.getMaxAnisotropy());
    const facility = buildFacility(textures);
    facilityRef.current = facility;
    scene.add(facility.sceneGroup);

    // 6. Subject 67 Creature AI
    const creature = createSubject67AI();
    creatureRef.current = creature;
    scene.add(creature.model.group);

    // Debris / Falling Sparks Particle Group for Self-Destruct
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount; p++) {
      particlePositions[p * 3] = (Math.random() - 0.5) * 60;
      particlePositions[p * 3 + 1] = Math.random() * 4;
      particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 60;
      particleVelocities[p * 3 + 1] = -1.5 - Math.random() * 3.0;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xff4400,
      size: 0.08,
      transparent: true,
      opacity: 0.0,
    });
    const debrisParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(debrisParticles);

    // 7. Interaction Handler
    const handleInteraction = () => {
      soundEngine.resume();
      if (gameStatusRef.current === 'CAUGHT' || gameStatusRef.current === 'EXPLODED') return;

      // Cast ray from center of screen
      _raycaster.current.setFromCamera(_centerVec.current, camera);
      const playerPos = player.position;

      // A. Check Core Elements pickup
      facility.elements.forEach((el, index) => {
        if (!collectedElementsRef.current[index]) {
          const dist = playerPos.distanceTo(el.group.position);
          if (dist < 2.8) {
            collectedElementsRef.current[index] = true;
            el.group.visible = false;
            soundEngine.playPickup();
            onElementsUpdate([...collectedElementsRef.current], insertedCountRef.current);
          }
        }
      });

      // B. Check Doors
      facility.doors.forEach((door) => {
        const dist = playerPos.distanceTo(door.position);
        if (dist < 3.2) {
          door.isOpen = !door.isOpen;
          door.targetOpen = door.isOpen ? 1.0 : 0.0;
          soundEngine.playDoorSlide();
        }
      });

      // C. Check Reactor Console Slots (Insert Elements)
      const distToReactor = playerPos.distanceTo(new THREE.Vector3(0, 1.2, 1.8));
      if (distToReactor < 2.5) {
        // Find if player has uninserted collected elements
        const collectedCount = collectedElementsRef.current.filter(Boolean).length;
        if (insertedCountRef.current < collectedCount) {
          const slotIdx = insertedCountRef.current;
          insertedCountRef.current++;
          // Light up the socket slot
          const slot = facility.reactor.socketSlots[slotIdx];
          if (slot) {
            (slot.material as THREE.MeshStandardMaterial).color.setHex(0x00ff88);
            (slot.material as THREE.MeshStandardMaterial).emissive.setHex(0x00cc66);
          }
          soundEngine.playConsoleBeep();
          onElementsUpdate([...collectedElementsRef.current], insertedCountRef.current);
        } else if (insertedCountRef.current === 4 && gameStatusRef.current === 'PLAYING') {
          // Trigger Self-Destruct!
          gameStatusRef.current = 'COUNTDOWN';
          onStatusChange('COUNTDOWN');
          soundEngine.startDestructionAlarm();
          soundEngine.playExplosion(1.5);
          cameraShakeRef.current = 1.0;
        }
      }

      // D. Check Lore Terminals
      facility.loreNotes.forEach((note) => {
        const dist = playerPos.distanceTo(note.position);
        if (dist < 2.4) {
          onReadNote(note);
          soundEngine.playConsoleBeep();
        }
      });

      // E. Check Evacuation Elevator
      if (gameStatusRef.current === 'COUNTDOWN') {
        const distToElevator = playerPos.distanceTo(facility.elevatorPos);
        if (distToElevator < 2.8) {
          gameStatusRef.current = 'ESCAPED';
          onStatusChange('ESCAPED');
          soundEngine.stopDestructionAlarm();
          soundEngine.playExplosion(2.0);
        }
      }
    };

    // Click on canvas to lock pointer or interact
    const onCanvasClick = () => {
      soundEngine.resume();
      if (!player.isLocked) {
        canvasRef.current?.requestPointerLock();
      } else {
        handleInteraction();
      }
    };

    const canvasDom = canvasRef.current;
    canvasDom.addEventListener('click', onCanvasClick);

    // Keydown for interaction key [E]
    const onKeyInteraction = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') {
        handleInteraction();
      }
    };
    window.addEventListener('keydown', onKeyInteraction);

    // 8. Main Animation & Render Loop
    let clock = new THREE.Clock();
    let frameId = 0;
    let heartbeatCooldown = 0;
    let explosionTimer = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = Math.min(0.1, clock.getDelta());

      if (!isPaused && gameStatusRef.current !== 'ESCAPED') {
        // A. Update Player
        player.update(delta, facility.colliders);

        // B. Update Flashlight state & visual
        if (flashlightRef.current) {
          const { spot, mesh } = flashlightRef.current;
          const batteryEffective = player.flashlightBattery > 0;
          spot.visible = player.isFlashlightOn && batteryEffective;
          mesh.visible = true;

          // Battery flicker below 15%
          if (player.flashlightBattery < 15 && Math.random() < 0.12) {
            spot.intensity = 0.5;
          } else {
            spot.intensity = player.isFlashlightOn ? 3.5 : 0;
          }

          // Weapon sway damping
          mesh.position.x = THREE.MathUtils.damp(
            mesh.position.x,
            0.28 + (player.isSprinting ? Math.sin(clock.elapsedTime * 12) * 0.04 : 0),
            10,
            delta
          );
        }

        // C. Update Doors Sliding Animation
        facility.doors.forEach((door) => {
          door.openAmount = THREE.MathUtils.damp(door.openAmount, door.targetOpen, 6, delta);
          if (door.axis === 'z') {
            door.doorMesh.position.z = door.openAmount * 2.2;
          } else {
            door.doorMesh.position.x = door.openAmount * 2.2;
          }
        });

        // D. Update Floating Core Elements Rotation
        facility.elements.forEach((el, i) => {
          if (!collectedElementsRef.current[i]) {
            el.coreMesh.rotation.y += delta * 2.0;
            el.coreMesh.rotation.x += delta * 1.2;
            el.group.position.y = 0.8 + Math.sin(clock.elapsedTime * 2.5 + i) * 0.1;
          }
        });

        // E. Update Subject 67 AI
        creature.update(
          delta,
          player.position,
          player.isSprinting,
          player.isCrouching,
          player.isFlashlightOn && player.flashlightBattery > 0,
          facility.colliders,
          facility.doors
        );

        // Handle Damage
        if (creature.healthDamage > 0) {
          player.takeDamage(creature.healthDamage);
          cameraShakeRef.current = 0.8;
          if (player.health <= 0) {
            gameStatusRef.current = 'CAUGHT';
            onStatusChange('CAUGHT');
            soundEngine.playJumpscare();
          }
        }

        // F. Heartbeat Audio & Terror
        heartbeatCooldown -= delta;
        if (heartbeatCooldown <= 0 && creature.terrorLevel > 0.1) {
          const bpm = THREE.MathUtils.lerp(70, 160, creature.terrorLevel);
          heartbeatCooldown = 60 / bpm;
          soundEngine.playHeartbeat(bpm, creature.terrorLevel);
        }

        // G. Fluorescent Lights Flicker
        facility.lights.flickerLights.forEach((light, i) => {
          if (Math.random() < 0.03) {
            light.intensity = Math.random() * 2.2;
          }
        });

        // H. Self-Destruct Countdown & Destruction sequence
        if (gameStatusRef.current === 'COUNTDOWN') {
          countdownRef.current = Math.max(0, countdownRef.current - delta);
          onCountdownUpdate(Math.ceil(countdownRef.current));

          // Emergency red beacons rotating
          facility.lights.emergencyBeacons.forEach((beacon) => {
            beacon.intensity = 2.5 + Math.sin(clock.elapsedTime * 10) * 2.2;
          });

          // Periodic explosion tremors
          explosionTimer += delta;
          if (explosionTimer > 4.5) {
            explosionTimer = 0;
            soundEngine.playExplosion(0.8 + Math.random() * 0.6);
            cameraShakeRef.current = 0.6;
          }

          // Falling debris particles
          particleMat.opacity = 0.85;
          const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
          const posArray = posAttr.array as Float32Array;
          for (let p = 0; p < particleCount; p++) {
            posArray[p * 3 + 1] += particleVelocities[p * 3 + 1] * delta;
            if (posArray[p * 3 + 1] < 0) {
              posArray[p * 3 + 1] = 3.9;
            }
          }
          posAttr.needsUpdate = true;

          // Out of time -> Building Exploded!
          if (countdownRef.current <= 0) {
            gameStatusRef.current = 'EXPLODED';
            onStatusChange('EXPLODED');
            soundEngine.stopDestructionAlarm();
            soundEngine.playExplosion(3.0);
          }
        }

        // Camera Shake effect during explosions / hits
        if (cameraShakeRef.current > 0.01) {
          camera.position.x += (Math.random() - 0.5) * cameraShakeRef.current * 0.12;
          camera.position.y += (Math.random() - 0.5) * cameraShakeRef.current * 0.12;
          cameraShakeRef.current = THREE.MathUtils.damp(cameraShakeRef.current, 0, 4, delta);
        }

        // I. Interact Prompt Detection (Raycasting)
        _raycaster.current.setFromCamera(_centerVec.current, camera);
        let prompt: string | null = null;
        const playerPos = player.position;

        // Check elements
        facility.elements.forEach((el, index) => {
          if (!collectedElementsRef.current[index] && playerPos.distanceTo(el.group.position) < 2.8) {
            const names = [
              'КРИО-СТЕРЖЕНЬ (АЛЬФА)',
              'КВАНТОВЫЙ ЭЛЕМЕНТ (БЕТА)',
              'БИО-КАТАЛИЗАТОР (ГАММА)',
              'КЛЮЧ ПЕРЕГРУЗКИ (ДЕЛЬТА)',
            ];
            prompt = `[E] / [КЛИК] Подобрать ${names[index]}`;
          }
        });

        // Check doors
        facility.doors.forEach((door) => {
          if (playerPos.distanceTo(door.position) < 3.0) {
            prompt = door.isOpen ? '[E] Закрыть бронедверь' : '[E] Открыть бронедверь';
          }
        });

        // Check reactor console
        const distReactor = playerPos.distanceTo(new THREE.Vector3(0, 1.2, 1.8));
        if (distReactor < 2.5) {
          const collectedCount = collectedElementsRef.current.filter(Boolean).length;
          if (insertedCountRef.current < collectedCount) {
            prompt = `[E] Вставить элемент в слот (${insertedCountRef.current + 1}/4)`;
          } else if (insertedCountRef.current === 4 && gameStatusRef.current === 'PLAYING') {
            prompt = '⚠️ [E] ЗАПУСТИТЬ ПЕРЕГРУЗКУ И САМОУНИЧТОЖЕНИЕ!';
          } else if (insertedCountRef.current < 4) {
            prompt = `Требуется найти элементы: ${collectedCount}/4 собрано`;
          }
        }

        // Check Lore
        facility.loreNotes.forEach((note) => {
          if (playerPos.distanceTo(note.position) < 2.4) {
            prompt = `[E] Читать: ${note.title}`;
          }
        });

        // Check Elevator
        if (gameStatusRef.current === 'COUNTDOWN') {
          if (playerPos.distanceTo(facility.elevatorPos) < 2.8) {
            prompt = '🚀 [E] ВОЙТИ В ЭВАКУАЦИОННЫЙ ЛИФТ НА ПОВЕРХНОСТЬ!';
          }
        }

        if (prompt !== activePromptRef.current) {
          activePromptRef.current = prompt;
          onInteractPrompt(prompt);
        }

        // Update HUD Stats
        onStatsUpdate(
          Math.round(player.health),
          Math.round(player.stamina),
          Math.round(player.flashlightBattery),
          creature.terrorLevel
        );
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    if (isSoftwareGl) afterDraw(tick);
    else frameId = requestAnimationFrame(tick);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyInteraction);
      canvasDom.removeEventListener('click', onCanvasClick);
      player.dispose();
      renderer.dispose();
      soundEngine.stopDestructionAlarm();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none bg-black">
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
    </div>
  );
};
