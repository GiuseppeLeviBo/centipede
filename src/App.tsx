import { useEffect, useRef } from 'react';
import { createGame, startGame, updateGame, resizeGame, updateAttractMode } from './game/engine';
import { renderGame, renderMenu, renderGameOver, renderDemoGame, renderHighScores } from './game/renderer';
import { initAudio, playShoot, playDeath, playLevelClear } from './game/audio';
import type { GameData } from './game/types';

function createDemoInput(game: GameData) {
  const player = game.player;
  const segments = game.centipede.flat();
  const target = segments
    .filter((seg) => seg.y < player.y)
    .sort((a, b) => Math.abs(a.x - player.x) - Math.abs(b.x - player.x))[0];

  let targetX = target?.x ?? game.canvasWidth / 2;
  let targetY = game.canvasHeight - game.cellSize * 2;

  if (game.spider && Math.abs(game.spider.y - player.y) < game.cellSize * 3) {
    targetX = game.spider.x < player.x ? game.canvasWidth - game.cellSize : game.cellSize;
  }

  return {
    left: targetX < player.x - game.cellSize * 0.25,
    right: targetX > player.x + game.cellSize * 0.25,
    up: targetY < player.y - game.cellSize * 0.2,
    down: targetY > player.y + game.cellSize * 0.2,
    fire: true,
  };
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameData | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const pointerDownRef = useRef(false);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const context = ctx;

    // Initialize game
    const w = window.innerWidth;
    const h = window.innerHeight;
    const game = createGame(w, h);
    gameRef.current = game;

    canvas.width = game.canvasWidth;
    canvas.height = game.canvasHeight;
    canvas.style.width = `${game.canvasWidth}px`;
    canvas.style.height = `${game.canvasHeight}px`;

    // Center canvas
    const marginLeft = Math.max(0, (w - game.canvasWidth) / 2);
    const marginTop = Math.max(0, (h - game.canvasHeight) / 2);
    canvas.style.marginLeft = `${marginLeft}px`;
    canvas.style.marginTop = `${marginTop}px`;

    const fixedStepMs = 1000 / 60;
    let lastTimestamp = performance.now();
    let accumulator = 0;

    function readInput() {
      const keys = keysRef.current;
      return {
        left: keys.has('ArrowLeft') || keys.has('KeyA') || keys.has('a') || keys.has('A'),
        right: keys.has('ArrowRight') || keys.has('KeyD') || keys.has('d') || keys.has('D'),
        up: keys.has('ArrowUp') || keys.has('KeyW') || keys.has('w') || keys.has('W'),
        down: keys.has('ArrowDown') || keys.has('KeyS') || keys.has('s') || keys.has('S'),
        fire: keys.has('Space') || keys.has(' ') || pointerDownRef.current,
      };
    }

    function updateTick() {
      timeRef.current++;

      if (game.state === 'playing') {
        const prevLives = game.lives;
        const prevLevel = game.level;
        const previousShotsFired = game.shotsFired;

        updateGame(game, readInput(), pointerDownRef.current ? pointerRef.current : null);

        if (game.shotsFired > previousShotsFired) {
          playShoot();
        }
        if (game.lives < prevLives) {
          playDeath();
        }
        if (game.level > prevLevel) {
          playLevelClear();
        }
      } else if (game.state === 'demo') {
        updateGame(game, createDemoInput(game), null);
        updateAttractMode(game);
      } else {
        updateAttractMode(game);
      }
    }

    function renderFrame() {
      const time = timeRef.current;
      context.clearRect(0, 0, canvas!.width, canvas!.height);

      switch (game.state) {
        case 'menu':
          renderMenu(context, game, time);
          break;
        case 'playing':
          renderGame(context, game, time);
          break;
        case 'demo':
          renderDemoGame(context, game, time);
          break;
        case 'scores':
          renderHighScores(context, game, time);
          break;
        case 'gameover':
          renderGameOver(context, game, time);
          break;
      }
    }

    // Fixed-step simulation: gameplay always advances at 60 updates/sec,
    // independent of 120/144 Hz monitors or variable browser frame pacing.
    function gameLoop(timestamp: number) {
      if (!game || !context) return;

      const frameDelta = Math.min(timestamp - lastTimestamp, 250);
      lastTimestamp = timestamp;
      accumulator += frameDelta;

      let ticksThisFrame = 0;
      while (accumulator >= fixedStepMs && ticksThisFrame < 5) {
        updateTick();
        accumulator -= fixedStepMs;
        ticksThisFrame++;
      }
      if (ticksThisFrame === 5) {
        accumulator = 0;
      }

      renderFrame();
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);

    // Keyboard events
    function onKeyDown(e: KeyboardEvent) {
      keysRef.current.add(e.code);
      keysRef.current.add(e.key);

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (game.state !== 'playing') {
          initAudio();
          startGame(game);
        }
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) || 
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      keysRef.current.delete(e.code);
      keysRef.current.delete(e.key);
    }

    // Pointer coordinate conversion
    function getGameCoords(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      const scaleX = game.canvasWidth / rect.width;
      const scaleY = game.canvasHeight / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    }

    function onPointerDown(e: PointerEvent) {
      e.preventDefault();
      canvas!.setPointerCapture?.(e.pointerId);
      pointerDownRef.current = true;
      pointerRef.current = getGameCoords(e.clientX, e.clientY);

      if (game.state !== 'playing') {
        initAudio();
        startGame(game);
      }
    }

    function onPointerMove(e: PointerEvent) {
      e.preventDefault();
      if (pointerDownRef.current) {
        pointerRef.current = getGameCoords(e.clientX, e.clientY);
      }
    }

    function onPointerUp(e: PointerEvent) {
      e.preventDefault();
      if (canvas!.hasPointerCapture?.(e.pointerId)) {
        canvas!.releasePointerCapture?.(e.pointerId);
      }
      pointerDownRef.current = false;
      pointerRef.current = null;
    }

    function onInputBlur() {
      keysRef.current.clear();
      pointerDownRef.current = false;
      pointerRef.current = null;
    }

    // Resize handler
    function onResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;

      resizeGame(game, w, h);

      canvas!.width = game.canvasWidth;
      canvas!.height = game.canvasHeight;
      canvas!.style.width = `${game.canvasWidth}px`;
      canvas!.style.height = `${game.canvasHeight}px`;

      const marginLeft = Math.max(0, (w - game.canvasWidth) / 2);
      const marginTop = Math.max(0, (h - game.canvasHeight) / 2);
      canvas!.style.marginLeft = `${marginLeft}px`;
      canvas!.style.marginTop = `${marginTop}px`;
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('blur', onInputBlur);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('blur', onInputBlur);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div 
      className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden outline-none"
      tabIndex={0}
      ref={(el) => {
        if (el) el.focus();
      }}
    >
      <canvas
        ref={canvasRef}
        className="block cursor-crosshair"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}

export default App;
