/**
 * Subject 67 - 3D Horror Survival
 * Main React Application Entry Point
 */
import React, { useState, useCallback } from 'react';
import { ShieldAlert, Play, Skull, Flame, Radio, Zap, Volume2, Info, Compass } from 'lucide-react';
import { GameEngine, GameStatus } from './game/GameEngine';
import { HUD } from './game/HUD';
import { LoreNote } from './game/facility';
import { soundEngine } from './game/audio';

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [status, setStatus] = useState<GameStatus>('PLAYING');
  const [health, setHealth] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [battery, setBattery] = useState(100);
  const [terror, setTerror] = useState(0);
  const [collectedElements, setCollectedElements] = useState<boolean[]>([false, false, false, false]);
  const [insertedCount, setInsertedCount] = useState(0);
  const [countdown, setCountdown] = useState(55);
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<LoreNote | null>(null);
  const [lang, setLang] = useState<'ru' | 'en'>('ru');
  const [gameKey, setGameKey] = useState(0);

  const handleStart = () => {
    soundEngine.init();
    soundEngine.resume();
    setHasStarted(true);
    setStatus('PLAYING');
  };

  const handleRestart = () => {
    setHealth(100);
    setStamina(100);
    setBattery(100);
    setTerror(0);
    setCollectedElements([false, false, false, false]);
    setInsertedCount(0);
    setCountdown(55);
    setInteractPrompt(null);
    setActiveNote(null);
    setStatus('PLAYING');
    setGameKey((prev) => prev + 1);
  };

  const t = {
    ru: {
      title: 'ОБЪЕКТ 67',
      subTitle: '3D ХОРРОР ВЫЖИВАНИЕ ОТ ПЕРВОГО ЛИЦА',
      loreP1:
        'Подземный научно-исследовательский комплекс «Сектор 67-Дельта» заблокирован. Высшая биологическая форма — Объект 67 — вырвалась из капсулы содержания. Весь гарнизон и научный состав ликвидированы.',
      loreP2:
        'Ваша задача — проникнуть в глубь комплекса, найти 4 скрытых элемента стабилизации реактора, вставить их в центральную консоль, запустить критическую перегрузку для ПОЛНОГО УНИЧТОЖЕНИЯ ЗДАНИЯ и успеть добраться до эвакуационного лифта.',
      warning:
        'ВНИМАНИЕ: Объект 67 слеп во тьме, но обладает сверхчутким слухом и мгновенно атакует на свет фонаря и быстрые шаги. Приседайте, чтобы двигаться бесшумно, и используйте герметичные двери для укрытия.',
      startBtn: 'НАЧАТЬ ОПЕРАЦИЮ // ВОЙТИ В КОМПЛЕКС',
      elementsTitle: 'НЕОБХОДИМЫЕ СТЕРЖНИ:',
      e1: 'Крио-стержень (Северный сектор)',
      e2: 'Квантовая ячейка (Восточная подстанция)',
      e3: 'Био-катализатор (Южный инкубатор)',
      e4: 'Ключ перегрузки (Западный бункер)',
    },
    en: {
      title: 'SUBJECT 67',
      subTitle: 'FIRST-PERSON 3D SURVIVAL HORROR',
      loreP1:
        'Subterranean research complex "Sector 67-Delta" is in total lockdown. The apex synthetic mutation — Subject 67 — has ruptured its containment cylinder. All personnel are dead.',
      loreP2:
        'Your mission is to infiltrate the complex, retrieve 4 reactor stabilizer elements, install them into the central core console, trigger the emergency self-destruction overload to ANNIHILATE THE FACILITY, and escape via the surface elevator.',
      warning:
        'WARNING: Subject 67 is attuned to sound vibrations and flashlight glare. Sprinting will draw it to your position. Crouch to move silently and lock blast doors behind you.',
      startBtn: 'COMMENCE MISSION // ENTER COMPLEX',
      elementsTitle: 'REQUIRED CORE ELEMENTS:',
      e1: 'Cryo Rod (North Cryo Wing)',
      e2: 'Quantum Cell (East Substation)',
      e3: 'Bio-Catalyst (South Incubation)',
      e4: 'Overload Key (West Bunker)',
    },
  }[lang];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-mono">
      {/* Start Screen / Mission Briefing */}
      {!hasStarted ? (
        <div className="relative z-50 flex items-center justify-center w-full h-full bg-[#07090c] p-4 text-neutral-200">
          <div className="max-w-2xl w-full bg-[#0d1015] border border-neutral-800 p-8 rounded-sm shadow-2xl">
            {/* Top Bar with Language Selector */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
              <div className="flex items-center gap-2 text-red-500 font-black tracking-widest text-lg">
                <Skull className="w-6 h-6" />
                <span>{t.title}</span>
              </div>
              <button
                onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
                className="text-xs bg-neutral-900 border border-neutral-700 hover:border-neutral-500 px-3 py-1 rounded-sm text-neutral-300 font-bold cursor-pointer transition-colors"
              >
                {lang === 'ru' ? 'RU / EN' : 'EN / RU'}
              </button>
            </div>

            <div className="text-xs tracking-widest text-cyan-400 font-bold mb-4 uppercase">
              {t.subTitle}
            </div>

            {/* Lore & Mission Briefing */}
            <div className="space-y-3 text-xs leading-relaxed text-neutral-300 mb-6 bg-black/40 p-4 rounded-sm border border-neutral-900">
              <p>{t.loreP1}</p>
              <p className="text-neutral-200">{t.loreP2}</p>
              <p className="text-amber-400/90 border-t border-neutral-900 pt-2">{t.warning}</p>
            </div>

            {/* 4 Required Rods List */}
            <div className="mb-6">
              <div className="text-[11px] font-bold text-neutral-400 mb-2">{t.elementsTitle}</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-neutral-950 border border-cyan-900/60 p-2 rounded-sm text-cyan-300">
                  ✦ {t.e1}
                </div>
                <div className="bg-neutral-950 border border-amber-900/60 p-2 rounded-sm text-amber-300">
                  ✦ {t.e2}
                </div>
                <div className="bg-neutral-950 border border-emerald-900/60 p-2 rounded-sm text-emerald-300">
                  ✦ {t.e3}
                </div>
                <div className="bg-neutral-950 border border-purple-900/60 p-2 rounded-sm text-purple-300">
                  ✦ {t.e4}
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStart}
              className="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 text-white py-3.5 rounded-sm font-bold tracking-widest text-sm cursor-pointer transition-colors shadow-lg shadow-red-950/40"
            >
              <Play className="w-5 h-5 fill-current" />
              {t.startBtn}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Main 3D Three.js Viewport */}
          <GameEngine
            key={gameKey}
            onStatusChange={setStatus}
            onElementsUpdate={(collected, inserted) => {
              setCollectedElements(collected);
              setInsertedCount(inserted);
            }}
            onStatsUpdate={(h, s, b, tr) => {
              setHealth(h);
              setStamina(s);
              setBattery(b);
              setTerror(tr);
            }}
            onInteractPrompt={setInteractPrompt}
            onCountdownUpdate={setCountdown}
            onReadNote={setActiveNote}
            isPaused={status !== 'PLAYING' && status !== 'COUNTDOWN'}
          />

          {/* Immersive HUD Overlay */}
          <HUD
            status={status}
            health={health}
            stamina={stamina}
            battery={battery}
            terror={terror}
            collectedElements={collectedElements}
            insertedCount={insertedCount}
            countdown={countdown}
            interactPrompt={interactPrompt}
            activeNote={activeNote}
            onCloseNote={() => setActiveNote(null)}
            onRestart={handleRestart}
            lang={lang}
            onToggleLang={() => setLang(lang === 'ru' ? 'en' : 'ru')}
          />
        </>
      )}
    </div>
  );
}
