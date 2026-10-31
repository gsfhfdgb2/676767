/**
 * Immersive Horror HUD & UI Overlay for Subject 67
 * Zero backdrop-filter, zero pulsating dots, zero obstruction of central viewport.
 * Fully bilingual (Russian/English), responsive with tactical scanner and horror overlays.
 */
import React, { useState } from 'react';
import {
  ShieldAlert,
  Zap,
  Activity,
  Battery,
  Flame,
  Volume2,
  VolumeX,
  Compass,
  FileText,
  HelpCircle,
  RotateCcw,
  Footprints,
  Eye,
  Radio,
} from 'lucide-react';
import { GameStatus } from './GameEngine';
import { LoreNote } from './facility';
import { soundEngine } from './audio';

interface HUDProps {
  status: GameStatus;
  health: number;
  stamina: number;
  battery: number;
  terror: number;
  collectedElements: boolean[];
  insertedCount: number;
  countdown: number;
  interactPrompt: string | null;
  activeNote: LoreNote | null;
  onCloseNote: () => void;
  onRestart: () => void;
  lang: 'ru' | 'en';
  onToggleLang: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  status,
  health,
  stamina,
  battery,
  terror,
  collectedElements,
  insertedCount,
  countdown,
  interactPrompt,
  activeNote,
  onCloseNote,
  onRestart,
  lang,
  onToggleLang,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showScanner, setShowScanner] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const t = {
    ru: {
      title: 'СЕКТОР 67 // ПРОТОКОЛ ЛИКВИДАЦИИ',
      objectiveFind: 'ЦЕЛЬ: Найти 4 стержня реактора и запустить самоуничтожение',
      objectiveCountdown: 'ВНИМАНИЕ: КОМПЛЕКС ДЕТОНИРУЕТ! БЕГИТЕ В ЛИФТ!',
      objectiveEscaped: 'ЭВАКУАЦИЯ УСПЕШНА // ЗДАНИЕ УНИЧТОЖЕНО',
      objectiveCaught: 'СИГНАЛ ЖИЗНИ ПОТЕРЯН // ВАС УНИЧТОЖИЛ ОБЪЕКТ 67',
      health: 'СОСТОЯНИЕ',
      stamina: 'ВЫНОСЛИВОСТЬ',
      battery: 'БАТАРЕЯ',
      bpm: 'ПУЛЬС',
      elements: 'СТЕРЖНИ',
      inserted: 'ВСТАВЛЕНО',
      scanner: 'БИО-СКАНЕР',
      controls: 'УПРАВЛЕНИЕ',
      helpText: 'W,A,S,D - Ходьба\nSHIFT - Бег (шумит!)\nC/CTRL - Присесть (скрытно)\nF - Фонарик\nE / КЛИК - Взаимодействие\nМышь - Осмотр (кликните для захвата курсора)',
      elementsList: [
        'Альфа: Крио-отсек',
        'Бета: Подстанция',
        'Гамма: Инкубатор',
        'Дельта: Бункер',
      ],
      caughtTitle: 'ВЫ ПОГИБЛИ',
      caughtDesc: 'Объект 67 настиг вас во мраке коридоров. Органическая форма разорвала броню.',
      explodedTitle: 'ВЫ НЕ УСПЕЛИ',
      explodedDesc: 'Реактор сдетонировал до того, как вы достигли поверхности. Комплекс погребен.',
      victoryTitle: 'КОМПЛЕКС СТЕРТ С ЛИЦА ЗЕМЛИ',
      victoryDesc: 'Вы успели подняться на эвакуационном лифте. Термоядерный взрыв уничтожил Сектор 67 и все следы мутации Объекта 67.',
      btnRetry: 'ПОПРОБОВАТЬ СНОВА',
      close: 'ЗАКРЫТЬ [E]',
    },
    en: {
      title: 'SECTOR 67 // CONTAINMENT PURGE',
      objectiveFind: 'OBJECTIVE: Locate 4 stabilizer rods and initiate self-destruct',
      objectiveCountdown: 'WARNING: FACILITY DETONATION IN PROGRESS! RUN TO ELEVATOR!',
      objectiveEscaped: 'EVACUATION SUCCESSFUL // COMPLEX DESTROYED',
      objectiveCaught: 'VITAL SIGNS LOST // KILLED BY SUBJECT 67',
      health: 'HEALTH',
      stamina: 'STAMINA',
      battery: 'BATTERY',
      bpm: 'PULSE',
      elements: 'RODS',
      inserted: 'INSERTED',
      scanner: 'BIO-RADAR',
      controls: 'CONTROLS',
      helpText: 'W,A,S,D - Move\nSHIFT - Sprint (makes noise!)\nC/CTRL - Crouch (stealth)\nF - Flashlight\nE / CLICK - Interact\nMouse - Look (click to lock cursor)',
      elementsList: [
        'Alpha: Cryo Wing',
        'Beta: Substation',
        'Gamma: Incubation',
        'Delta: Bunker',
      ],
      caughtTitle: 'SUBJECT 67 ELIMINATED YOU',
      caughtDesc: 'The apex predator caught you in the dark corridors. Your biological readings ceased.',
      explodedTitle: 'DETONATION OVERTAKEN',
      explodedDesc: 'The facility imploded before you reached the surface blast elevator.',
      victoryTitle: 'FACILITY ANNIHILATED',
      victoryDesc: 'You reached the surface elevator just in time. The thermonuclear overload obliterated Sector 67 and Subject 67.',
      btnRetry: 'TRY AGAIN',
      close: 'CLOSE [E]',
    },
  }[lang];

  const handleToggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const bpmValue = Math.round(72 + terror * 88);
  const totalCollected = collectedElements.filter(Boolean).length;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-mono text-xs text-neutral-300">
      {/* 1. Terror & Low-Health Screen Vignette (Edge Darkening & Blood Tint) */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          boxShadow: `inset 0 0 ${100 + terror * 160}px rgba(0, 0, 0, ${0.7 + terror * 0.28})`,
          backgroundColor: health < 40 ? `rgba(140, 0, 0, ${(40 - health) * 0.012})` : 'transparent',
        }}
      />

      {/* 2. Proximity Creature Static Glitch Overlay */}
      {terror > 0.25 && (
        <div
          className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 2px)`,
            filter: `contrast(${1 + terror * 0.8})`,
          }}
        />
      )}

      {/* 3. Minimal Top Navigation Bar */}
      <header className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-auto">
        {/* Left: Spec Title */}
        <div className="flex items-center gap-2 bg-[#101216] border border-neutral-800 px-3 py-1.5 rounded-sm">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span className="font-bold tracking-wider text-neutral-100">{t.title}</span>
        </div>

        {/* Center: Objective Banner */}
        <div className="flex items-center gap-3">
          {status === 'COUNTDOWN' ? (
            <div className="flex items-center gap-2.5 bg-red-950 border border-red-600 px-4 py-1.5 rounded-sm text-red-200">
              <Flame className="w-4 h-4 text-red-400" />
              <span className="font-black text-sm tracking-widest text-red-100 animate-pulse">
                {t.objectiveCountdown} [{countdown}s]
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#101216] border border-neutral-800 px-4 py-1.5 rounded-sm">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-neutral-200">{t.objectiveFind}</span>
              <span className="text-cyan-400 font-bold ml-1">
                [{totalCollected}/4]
              </span>
            </div>
          )}
        </div>

        {/* Right: Sound, Help, Lang toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLang}
            className="bg-[#101216] hover:bg-neutral-800 border border-neutral-800 px-2.5 py-1.5 rounded-sm text-neutral-300 font-bold cursor-pointer transition-colors"
          >
            {lang.toUpperCase()}
          </button>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="bg-[#101216] hover:bg-neutral-800 border border-neutral-800 p-1.5 rounded-sm text-neutral-300 cursor-pointer transition-colors"
            title="Controls & Instructions"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleSound}
            className="bg-[#101216] hover:bg-neutral-800 border border-neutral-800 p-1.5 rounded-sm text-neutral-300 cursor-pointer transition-colors"
            title="Mute / Unmute"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* 4. Center Crosshair & Interactive Prompt (100% Unobstructed Center Viewport) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative flex flex-col items-center">
          {/* Subtle crosshair dot */}
          <div className="w-1.5 h-1.5 bg-white/70 rounded-full" />

          {/* Interactive Prompt Popup */}
          {interactPrompt && (
            <div className="absolute top-6 whitespace-nowrap bg-[#0d0f12] border border-cyan-500/60 px-3 py-1.5 rounded-sm text-cyan-200 font-bold text-xs tracking-wider shadow-lg">
              {interactPrompt}
            </div>
          )}
        </div>
      </div>

      {/* 5. Mobile On-Screen Action Buttons (Touch Friendly) */}
      <div className="absolute bottom-24 right-4 flex flex-col gap-2 pointer-events-auto md:hidden z-20">
        <button
          onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }))}
          onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE' }))}
          onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }))}
          onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE' }))}
          className="w-12 h-12 bg-cyan-900/80 border border-cyan-500 text-cyan-200 rounded-full flex items-center justify-center font-bold text-xs active:bg-cyan-600"
          title="Interact"
        >
          [E]
        </button>
        <button
          onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF' }))}
          onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF' }))}
          className="w-12 h-12 bg-amber-900/80 border border-amber-500 text-amber-200 rounded-full flex items-center justify-center font-bold text-xs active:bg-amber-600"
          title="Flashlight"
        >
          [F]
        </button>
        <button
          onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft' }))}
          onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft' }))}
          onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft' }))}
          onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft' }))}
          className="w-12 h-12 bg-neutral-800/80 border border-neutral-600 text-neutral-200 rounded-full flex items-center justify-center font-bold text-[10px] active:bg-neutral-600"
          title="Sprint"
        >
          RUN
        </button>
        <button
          onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC' }))}
          onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC' }))}
          className="w-12 h-12 bg-neutral-800/80 border border-neutral-600 text-neutral-200 rounded-full flex items-center justify-center font-bold text-[10px] active:bg-neutral-600"
          title="Crouch"
        >
          SNEAK
        </button>
      </div>

      {/* 5b. Mobile Virtual D-Pad (Left side) */}
      <div className="absolute bottom-24 left-4 grid grid-cols-3 gap-1 pointer-events-auto md:hidden z-20 w-32 h-32">
        <div />
        <button
          onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }))}
          onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }))}
          onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }))}
          onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }))}
          className="bg-neutral-800/70 border border-neutral-600 text-white rounded flex items-center justify-center text-xs font-bold active:bg-neutral-600"
        >
          ▲
        </button>
        <div />
        <button
          onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }))}
          onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }))}
          onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }))}
          onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }))}
          className="bg-neutral-800/70 border border-neutral-600 text-white rounded flex items-center justify-center text-xs font-bold active:bg-neutral-600"
        >
          ◀
        </button>
        <button
          onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' }))}
          onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyS' }))}
          onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' }))}
          onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyS' }))}
          className="bg-neutral-800/70 border border-neutral-600 text-white rounded flex items-center justify-center text-xs font-bold active:bg-neutral-600"
        >
          ▼
        </button>
        <button
          onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }))}
          onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }))}
          onMouseDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }))}
          onMouseUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }))}
          className="bg-neutral-800/70 border border-neutral-600 text-white rounded flex items-center justify-center text-xs font-bold active:bg-neutral-600"
        >
          ▶
        </button>
      </div>

      {/* 5c. Quick Controls Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-auto z-40">
          <div className="bg-[#12151a] border border-neutral-700 p-6 max-w-md w-full rounded-sm text-neutral-200">
            <h2 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> {t.controls}
            </h2>
            <div className="whitespace-pre-line text-neutral-300 leading-relaxed text-xs bg-black/50 p-3 rounded-sm border border-neutral-800 mb-4">
              {t.helpText}
            </div>
            <div className="text-xs text-neutral-400 mb-4">
              💡 <span className="text-neutral-200">Тактика:</span> Объект 67 следит за звуками шагов. Приседайте (C/Ctrl), выключайте фонарик (F), когда чудище близко. Закрывайте бронедвери (E), чтобы задержать его!
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full bg-cyan-700 hover:bg-cyan-600 text-white py-2 rounded-sm font-bold cursor-pointer transition-colors"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* 6. Lore Note Modal */}
      {activeNote && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/85 pointer-events-auto z-40 p-4">
          <div className="bg-[#12161d] border border-neutral-700 max-w-lg w-full p-6 rounded-sm text-neutral-200 shadow-2xl">
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-4 border-b border-neutral-800 pb-2">
              <FileText className="w-4 h-4" />
              <span>{activeNote.title}</span>
            </div>
            <p className="text-xs leading-relaxed text-neutral-300 mb-6 bg-black/40 p-4 rounded-sm border border-neutral-800">
              {activeNote.text}
            </p>
            <button
              onClick={onCloseNote}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-sm font-bold cursor-pointer transition-colors"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* 7. Game Over / Victory Modal */}
      {(status === 'CAUGHT' || status === 'EXPLODED' || status === 'ESCAPED') && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 pointer-events-auto z-50 p-4">
          <div className="bg-[#13161c] border border-neutral-700 max-w-lg w-full p-8 rounded-sm text-center shadow-2xl">
            {status === 'CAUGHT' && (
              <>
                <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-red-500 mb-2">{t.caughtTitle}</h1>
                <p className="text-xs text-neutral-300 leading-relaxed mb-6">{t.caughtDesc}</p>
              </>
            )}
            {status === 'EXPLODED' && (
              <>
                <Flame className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-amber-500 mb-2">{t.explodedTitle}</h1>
                <p className="text-xs text-neutral-300 leading-relaxed mb-6">{t.explodedDesc}</p>
              </>
            )}
            {status === 'ESCAPED' && (
              <>
                <Zap className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-emerald-400 mb-2">{t.victoryTitle}</h1>
                <p className="text-xs text-neutral-300 leading-relaxed mb-6">{t.victoryDesc}</p>
              </>
            )}
            <button
              onClick={onRestart}
              className="inline-flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 text-white px-6 py-2.5 rounded-sm font-bold cursor-pointer transition-colors text-xs tracking-wider"
            >
              <RotateCcw className="w-4 h-4" />
              {t.btnRetry}
            </button>
          </div>
        </div>
      )}

      {/* 8. Ergonomic Collapsible Bottom Control Dock (Three.js Skill Directive) */}
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[94vw] max-w-4xl pointer-events-auto z-30">
        {/* Dock Collapse Toggle Button */}
        <div className="flex justify-center -mb-px">
          <button
            onClick={() => setDockCollapsed(!dockCollapsed)}
            className="bg-[#101216] border border-b-0 border-neutral-800 text-neutral-400 hover:text-neutral-200 px-3 py-1 rounded-t-sm text-[11px] cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <span>{dockCollapsed ? '▴ Развернуть HUD / Expand' : '▾ Свернуть HUD / Collapse'}</span>
          </button>
        </div>

        {/* Main Dock Container */}
        <div
          className={`bg-[#0d0f13] border border-neutral-800 p-3 rounded-sm shadow-xl transition-all duration-300 ${
            dockCollapsed ? 'hidden' : 'grid grid-cols-1 md:grid-cols-4 gap-3 items-center'
          }`}
        >
          {/* Card 1: Vitals & Health */}
          <div className="bg-[#14171d] border border-neutral-800/80 p-2.5 rounded-sm">
            <div className="flex items-center justify-between text-neutral-400 mb-1.5">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-red-400" />
                {t.health}
              </span>
              <span className="text-red-400 font-bold">{health}%</span>
            </div>
            <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-red-500 h-full transition-all duration-300"
                style={{ width: `${health}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <Footprints className="w-3 h-3 text-cyan-400" />
                {t.bpm}
              </span>
              <span className={bpmValue > 120 ? 'text-red-400 font-bold' : 'text-neutral-300'}>
                {bpmValue} BPM
              </span>
            </div>
          </div>

          {/* Card 2: Stamina & Battery */}
          <div className="bg-[#14171d] border border-neutral-800/80 p-2.5 rounded-sm">
            <div className="flex items-center justify-between text-neutral-400 mb-1.5">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                {t.stamina}
              </span>
              <span className="text-cyan-400 font-bold">{stamina}%</span>
            </div>
            <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-cyan-500 h-full transition-all duration-150"
                style={{ width: `${stamina}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <Battery className="w-3.5 h-3.5 text-amber-400" />
                {t.battery}
              </span>
              <span className="text-amber-400 font-bold">{battery}%</span>
            </div>
          </div>

          {/* Card 3: Stabilizer Rods Progress (4 elements) */}
          <div className="bg-[#14171d] border border-neutral-800/80 p-2.5 rounded-sm col-span-1 md:col-span-2">
            <div className="flex items-center justify-between text-neutral-400 mb-1.5">
              <span className="font-bold text-neutral-200">
                {t.elements}: {totalCollected}/4 | {t.inserted}: {insertedCount}/4
              </span>
              <span className="text-cyan-400 text-[11px]">
                {insertedCount === 4 ? 'ГОТОВ К ПЕРЕГРУЗКЕ' : 'СБОР В ПРОЦЕССЕ'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {t.elementsList.map((name, i) => {
                const isCollected = collectedElements[i];
                const isInserted = i < insertedCount;
                return (
                  <div
                    key={i}
                    className={`p-1.5 rounded-sm text-center border text-[10px] ${
                      isInserted
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : isCollected
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-500'
                    }`}
                  >
                    <div className="font-bold truncate">{name.split(':')[0]}</div>
                    <div className="text-[9px] opacity-80 truncate">{name.split(':')[1]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
