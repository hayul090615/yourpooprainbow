import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import rainbowPoopUrl from '../assets/rainbow-poop.png';

type GameItem = { id: number; type: 'poop' | 'coin' | 'magnet'; x: number; y: number; speed: number; size: 'normal' | 'giant' | 'cluster'; scale: number; spawnDelay: number; clusterCount: number };
const PLAYER_SPEED_PERCENT_PER_SECOND = 32;
const MAX_STAGE = 5;
const GIANT_POOP_CHANCE = 0.16;
const CLUSTER_POOP_CHANCE = 0.2;
const MAX_DIFFICULTY_SPEED_MULTIPLIER = 2.3;
const MAX_DIFFICULTY_GIANT_CHANCE = 0.3;
const MAX_DIFFICULTY_CLUSTER_CHANCE = 0.24;
const MAGNET_DURATION_MS = 5_000;
const MAGNET_MAX_COINS = 3;
const STAGE_FOUR_MAGNET_CHANCE = 0.28;
const STAGE_FIVE_MAGNET_CHANCE = 0.18;
const STAGE_SPEED_MULTIPLIERS = [1, 1.42, 1.7, 1.98, 2.2] as const;
const GIANT_PAIR_SCALE = 2.1;
const HIGH_SCORE_KEY = 'your-poop-rainbow-best-score';
const START_RAINBOW_DURATION_MS = 1600;
const PLAYER_MIN_X = 6;
const PLAYER_MAX_X = 94;
const SPAWN_MIN_X = 3;
const SPAWN_MAX_X = 97;
const SPAWN_LINE_Y = 12;
const BOTTOM_LINE_Y = 96;
const PLAYER_HIT_Y_CENTER = 94;
const PLAYER_HIT_Y_RADIUS = 2.2;
const ITEM_HIT_X_RADIUS = 2.8;
const COIN_HIT_X_RADIUS = 6;
const COIN_HIT_Y_RADIUS = 3.5;
const MAGNET_HIT_X_RADIUS = 5;
const MAGNET_HIT_Y_RADIUS = 3.5;
const STAGE_ITEM_COUNTS = [
  { poop: 8, coin: 6, magnet: 0 },
  { poop: 10, coin: 5, magnet: 0 },
  { poop: 11, coin: 4, magnet: 0 },
  { poop: 12, coin: 3, magnet: 1 },
  { poop: 14, coin: 2, magnet: 1 },
] as const;
const getLargePoopScale = (stage: number) => stage === 2 ? 2 : stage === 3 ? 2.5 : 3;
const getMagnetSpawnChance = (stage: number) => stage === 4 ? STAGE_FOUR_MAGNET_CHANCE : STAGE_FIVE_MAGNET_CHANCE;
const STAGE_FIVE_VARIANTS = ['normal', 'pair', 'triple', 'giant', 'giantPair'] as const;
type StageFiveVariant = typeof STAGE_FIVE_VARIANTS[number];
const POOP_EXPLOSION_PARTICLES = [
  { left: 2, top: 3 }, { left: 17, top: 1 }, { left: 34, top: 3 }, { left: 52, top: 1 }, { left: 70, top: 3 }, { left: 88, top: 1 },
  { left: 98, top: 19 }, { left: 98, top: 39 }, { left: 98, top: 61 }, { left: 98, top: 81 },
  { left: 88, top: 98 }, { left: 70, top: 99 }, { left: 52, top: 98 }, { left: 34, top: 99 }, { left: 17, top: 98 },
  { left: 2, top: 82 }, { left: 2, top: 62 }, { left: 2, top: 38 },
].map((particle, index) => ({ ...particle, delay: (index % 5) * 0.04 }));
const RAINBOW_COLORS = ['#ff4d6d', '#ff9f43', '#ffe066', '#58d68d', '#4dabf7', '#6c5ce7', '#b967ff'];
const readHighScore = () => {
  try {
    return Number(window.localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
};
const saveHighScore = (score: number) => {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // localStorage may be unavailable in private browsing contexts.
  }
};
const getRandomSpawnX = () => SPAWN_MIN_X + Math.random() * (SPAWN_MAX_X - SPAWN_MIN_X);
const getSpreadSpawnXs = (count: number) => Array.from({ length: count }, (_, index) => {
  const segmentWidth = (SPAWN_MAX_X - SPAWN_MIN_X) / count;
  const segmentStart = SPAWN_MIN_X + index * segmentWidth;
  const segmentPadding = Math.min(2, segmentWidth * 0.18);
  return segmentStart + segmentPadding + Math.random() * Math.max(0, segmentWidth - segmentPadding * 2);
}).sort(() => Math.random() - 0.5);
const getStaggeredSpawnDelays = (count: number) => Array.from({ length: count }, (_, index) => index * 0.42 + Math.random() * 0.16)
  .sort(() => Math.random() - 0.5);
const getClusterCount = (item: GameItem) => item.size === 'cluster' ? Math.max(2, item.clusterCount || 3) : 1;
const getItemHitXRadius = (item: GameItem) => item.type === 'coin' ? COIN_HIT_X_RADIUS : item.type === 'magnet' ? MAGNET_HIT_X_RADIUS : item.size === 'giant'
  ? Math.min(5.6, ITEM_HIT_X_RADIUS * item.scale)
  : item.size === 'cluster' ? Math.min(8, ITEM_HIT_X_RADIUS * (1.2 + getClusterCount(item) * 0.45) * item.scale) : ITEM_HIT_X_RADIUS;
const getItemHitYRadius = (item: GameItem) => item.type === 'coin' ? COIN_HIT_Y_RADIUS : item.type === 'magnet' ? MAGNET_HIT_Y_RADIUS : item.size === 'giant'
  ? Math.min(4.5, PLAYER_HIT_Y_RADIUS * item.scale)
  : item.size === 'cluster' ? Math.min(6, PLAYER_HIT_Y_RADIUS * (1.2 + getClusterCount(item) * 0.45) * item.scale) : PLAYER_HIT_Y_RADIUS;
const makeItem = (id: number, type: GameItem['type'], size: GameItem['size'] = 'normal', scale = 1, spawnX = getRandomSpawnX(), spawnY = SPAWN_LINE_Y, spawnDelay = 0, clusterCount = 1): GameItem => ({
  id,
  type,
  size,
  scale,
  clusterCount,
  x: spawnX,
  y: spawnY,
  speed: 0.012 + Math.random() * 0.005,
  spawnDelay,
});
const makePoopVariant = (item: GameItem, variant: StageFiveVariant, spawnX = item.x, spawnY = item.y, spawnDelay = item.spawnDelay) => {
  if (variant === 'pair') return makeItem(item.id, 'poop', 'cluster', 1, spawnX, spawnY, spawnDelay, 2);
  if (variant === 'triple') return makeItem(item.id, 'poop', 'cluster', 1, spawnX, spawnY, spawnDelay, 3);
  if (variant === 'giant') return makeItem(item.id, 'poop', 'giant', 3, spawnX, spawnY, spawnDelay);
  if (variant === 'giantPair') return makeItem(item.id, 'poop', 'cluster', GIANT_PAIR_SCALE, spawnX, spawnY, spawnDelay, 2);
  return makeItem(item.id, 'poop', 'normal', 1, spawnX, spawnY, spawnDelay);
};
const getRandomStageFiveVariant = () => STAGE_FIVE_VARIANTS[Math.floor(Math.random() * STAGE_FIVE_VARIANTS.length)];
const createStageItems = (stage: number) => {
  const counts = STAGE_ITEM_COUNTS[stage - 1];
  const types: GameItem['type'][] = [
    ...Array.from({ length: counts.poop }, () => 'poop' as const),
    ...Array.from({ length: counts.coin }, () => 'coin' as const),
    ...Array.from({ length: counts.magnet }, () => Math.random() < getMagnetSpawnChance(stage) ? 'magnet' as const : 'coin' as const),
  ];
  const spawnXs = getSpreadSpawnXs(types.length);
  const spawnDelays = getStaggeredSpawnDelays(types.length);
  const items = types.sort(() => Math.random() - 0.5).map((type, id) => makeItem(id, type, 'normal', 1, spawnXs[id], SPAWN_LINE_Y, spawnDelays[id]));
  const poopItems = items.filter((item) => item.type === 'poop');
  if (stage >= 2 && stage <= 4 && poopItems.length > 1) {
    const pairTarget = stage <= 3 ? poopItems[Math.floor(Math.random() * poopItems.length)] : undefined;
    const giantCandidates = pairTarget ? poopItems.filter((item) => item.id !== pairTarget.id) : poopItems;
    const giantTarget = giantCandidates[Math.floor(Math.random() * giantCandidates.length)];
    const tripleCandidates = poopItems.filter((item) => item.id !== giantTarget.id && item.id !== pairTarget?.id);
    const tripleTarget = stage === 4 ? tripleCandidates[0] : undefined;
    return items.map((item) => {
      if (pairTarget && item.id === pairTarget.id) return makePoopVariant(item, 'pair');
      if (item.id === giantTarget.id) return makeItem(item.id, 'poop', 'giant', getLargePoopScale(stage), item.x, item.y, item.spawnDelay);
      if (tripleTarget && item.id === tripleTarget.id) return makePoopVariant(item, 'triple');
      return item;
    });
  }
  if (stage === MAX_STAGE && poopItems.length > 0) {
    const shuffledVariants = [...STAGE_FIVE_VARIANTS].sort(() => Math.random() - 0.5);
    let poopIndex = 0;
    return items.map((item) => {
      if (item.type !== 'poop') return item;
      const variant = poopIndex < shuffledVariants.length ? shuffledVariants[poopIndex] : getRandomStageFiveVariant();
      poopIndex += 1;
      return makePoopVariant(item, variant);
    });
  }
  return items;
};
const createMaxDifficultyItems = () => {
  const types: GameItem['type'][] = [
    ...Array.from({ length: 20 }, () => 'poop' as const),
    ...Array.from({ length: 5 }, () => 'coin' as const),
  ];
  const spawnXs = getSpreadSpawnXs(types.length);
  const spawnDelays = getStaggeredSpawnDelays(types.length);
  const items = types.sort(() => Math.random() - 0.5).map((type, id) => makeItem(id, type, 'normal', 1, spawnXs[id], SPAWN_LINE_Y, spawnDelays[id]));
  return items.map((item) => {
    if (item.type !== 'poop') return item;
    const roll = Math.random();
    if (roll < MAX_DIFFICULTY_CLUSTER_CHANCE) return makeItem(item.id, 'poop', 'cluster', 1.15, item.x, item.y, item.spawnDelay, 3);
    if (roll < MAX_DIFFICULTY_CLUSTER_CHANCE + MAX_DIFFICULTY_GIANT_CHANCE) return makeItem(item.id, 'poop', 'giant', 3, item.x, item.y, item.spawnDelay);
    return item;
  });
};
type AuthSideGameProps = { onExit?: () => void };

export default function AuthSideGame({ onExit }: AuthSideGameProps) {
  const [items, setItems] = useState<GameItem[]>(() => createStageItems(1));
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(readHighScore);
  const [stage, setStage] = useState(1);
  const [lives, setLives] = useState(3);
  const [playerX, setPlayerX] = useState(50);
  const [coinEffect, setCoinEffect] = useState(false);
  const [damageEffect, setDamageEffect] = useState<{ id: number; x: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [fireEffect, setFireEffect] = useState<{ id: number; x: number } | null>(null);
  const [magnetActive, setMagnetActive] = useState(false);
  const [magnetCoinsLeft, setMagnetCoinsLeft] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [maxDifficulty, setMaxDifficulty] = useState(false);
  const playerXRef = useRef(50);
  const directionRef = useRef<-1 | 0 | 1>(0);
  const scoreRef = useRef(0);
  const highScoreRef = useRef(highScore);
  const stageRef = useRef(1);
  const livesRef = useRef(3);
  const maxDifficultyRef = useRef(false);
  const magnetActiveRef = useRef(false);
  const magnetCoinsLeftRef = useRef(0);
  const magnetTimeoutRef = useRef<number | null>(null);
  const coinEffectTimeoutRef = useRef<number | null>(null);
  const fireEffectUntilRef = useRef(0);
  const itemsRef = useRef<GameItem[]>(items);
  const damageEffectId = useRef(0);
  const pointerStartRef = useRef<{ id: number; x: number; playerX: number } | null>(null);
  const itemElementRefs = useRef(new Map<number, HTMLDivElement>());
  const playerElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isStarting) return undefined;
    const timeout = window.setTimeout(() => setIsStarting(false), START_RAINBOW_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [isStarting]);

  useEffect(() => () => {
    if (magnetTimeoutRef.current !== null) window.clearTimeout(magnetTimeoutRef.current);
    if (coinEffectTimeoutRef.current !== null) window.clearTimeout(coinEffectTimeoutRef.current);
  }, []);

  const setPointerDirection = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const center = bounds.left + bounds.width / 2;
    const deadZone = bounds.width * 0.15;
    directionRef.current = event.clientX < center - deadZone ? -1 : event.clientX > center + deadZone ? 1 : 0;
  };
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (gameOver || completed || isStarting || paused) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerStartRef.current = { id: event.pointerId, x: event.clientX, playerX: playerXRef.current };
    setPointerDirection(event);
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (paused) return;
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      const bounds = event.currentTarget.getBoundingClientRect();
      const nextPlayerX = Math.max(8, Math.min(92, ((event.clientX - bounds.left) / bounds.width) * 100));
      playerXRef.current = nextPlayerX;
      setPlayerX(nextPlayerX);
      return;
    }
    const pointerStart = pointerStartRef.current;
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const deltaPercent = ((event.clientX - pointerStart.x) / bounds.width) * 100;
    if (Math.abs(deltaPercent) < 1) return;
    const nextPlayerX = Math.max(8, Math.min(92, pointerStart.playerX + deltaPercent));
    playerXRef.current = nextPlayerX;
    setPlayerX(nextPlayerX);
    directionRef.current = 0;
  };
  const stopPointerDirection = () => {
    pointerStartRef.current = null;
    directionRef.current = 0;
  };
  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStartRef.current?.id === event.pointerId) stopPointerDirection();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (paused || completed || isStarting) return;
      event.preventDefault();
      directionRef.current = event.key === 'ArrowLeft' ? -1 : 1;
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') directionRef.current = 0;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', stopPointerDirection);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', stopPointerDirection);
    };
  }, [completed, isStarting, paused]);

  useEffect(() => {
    if (gameOver || completed || isStarting || paused) return undefined;
    let frame = 0;
    let previousTime: number | null = null;
    const syncDomPositions = (currentItems: GameItem[], nextPlayerX: number) => {
      const gameElement = playerElementRef.current?.parentElement;
      if (!gameElement) return;
      const gameWidth = gameElement.clientWidth;
      const gameHeight = gameElement.clientHeight;
      if (!gameWidth || !gameHeight) return;

      currentItems.forEach((item) => {
        const element = itemElementRefs.current.get(item.id);
        if (!element) return;
        element.style.visibility = item.spawnDelay > 0 ? 'hidden' : 'visible';
        element.style.transform = `translate3d(${gameWidth * item.x / 100}px, ${gameHeight * item.y / 100}px, 0) translate3d(-50%, -50%, 0)`;
      });
      if (playerElementRef.current) {
        playerElementRef.current.style.transform = `translate3d(${gameWidth * nextPlayerX / 100}px, 0, 0) translateX(-50%)`;
      }
    };
    const createRespawnItem = (item: GameItem, currentItems: GameItem[]) => {
      if (maxDifficultyRef.current && item.type === 'poop') {
        const roll = Math.random();
        if (roll < MAX_DIFFICULTY_CLUSTER_CHANCE) return makeItem(item.id, 'poop', 'cluster', 1.15, getRandomSpawnX(), SPAWN_LINE_Y, 0, 3);
        if (roll < MAX_DIFFICULTY_CLUSTER_CHANCE + MAX_DIFFICULTY_GIANT_CHANCE) return makeItem(item.id, 'poop', 'giant', 3);
      }
      if (stageRef.current === MAX_STAGE && item.type === 'poop') return makePoopVariant(item, getRandomStageFiveVariant(), getRandomSpawnX(), SPAWN_LINE_Y, 0);
      const shouldSpawnGiant = stageRef.current >= 2 && stageRef.current < MAX_STAGE && item.type === 'poop'
        && !currentItems.some((currentItem) => currentItem.size === 'giant')
        && Math.random() < GIANT_POOP_CHANCE;
      const shouldSpawnPair = stageRef.current >= 2 && stageRef.current <= 3 && item.type === 'poop'
        && !currentItems.some((currentItem) => currentItem.size === 'cluster' && currentItem.clusterCount === 2)
        && Math.random() < CLUSTER_POOP_CHANCE;
      const shouldSpawnTriple = stageRef.current === 4 && item.type === 'poop'
        && !currentItems.some((currentItem) => currentItem.size === 'cluster' && currentItem.clusterCount === 3)
        && Math.random() < CLUSTER_POOP_CHANCE;
      if (shouldSpawnGiant) return makeItem(item.id, item.type, 'giant', getLargePoopScale(stageRef.current));
      if (shouldSpawnPair) return makeItem(item.id, 'poop', 'cluster', 1, getRandomSpawnX(), SPAWN_LINE_Y, 0, 2);
      if (shouldSpawnTriple) return makeItem(item.id, 'poop', 'cluster', 1, getRandomSpawnX(), SPAWN_LINE_Y, 0, 3);
      if (item.type === 'magnet' && stageRef.current >= 4 && !maxDifficultyRef.current) {
        return Math.random() < getMagnetSpawnChance(stageRef.current)
          ? makeItem(item.id, 'magnet')
          : makeItem(item.id, 'coin');
      }
      return makeItem(item.id, item.type);
    };
    const tick = (time: number) => {
      const elapsedSeconds = previousTime === null ? 0 : Math.min((time - previousTime) / 1000, 0.1);
      const frameScale = elapsedSeconds * 60;
      previousTime = time;
      const nextPlayerX = Math.max(PLAYER_MIN_X, Math.min(PLAYER_MAX_X, playerXRef.current + directionRef.current * PLAYER_SPEED_PERCENT_PER_SECOND * elapsedSeconds));
      playerXRef.current = nextPlayerX;
      const currentItems = itemsRef.current;
      let collectedCoins = 0;
      let hasRespawned = false;
      const respawnItem = (item: GameItem) => {
        hasRespawned = true;
        return createRespawnItem(item, currentItems);
      };
      const nextItems = currentItems.map((item) => {
        if (item.spawnDelay > 0) {
          return { ...item, y: SPAWN_LINE_Y, spawnDelay: Math.max(0, item.spawnDelay - elapsedSeconds) };
        }
        const stageSpeedMultiplier = maxDifficultyRef.current ? MAX_DIFFICULTY_SPEED_MULTIPLIER : STAGE_SPEED_MULTIPLIERS[stageRef.current - 1];
        let nextX = item.x;
        let nextY = item.y + item.speed * 16 * stageSpeedMultiplier * frameScale;
        const isFallingCoin = item.type === 'coin' && item.y > SPAWN_LINE_Y + 0.5;
        if (isFallingCoin && magnetActiveRef.current && magnetCoinsLeftRef.current > 0) {
          const attraction = Math.min(1, elapsedSeconds * 5.5);
          nextX += (playerXRef.current - nextX) * attraction;
          nextY += (PLAYER_HIT_Y_CENTER - nextY) * attraction;
        }
        const nearPlayer = Math.abs(nextY - PLAYER_HIT_Y_CENTER) < getItemHitYRadius(item)
          && Math.abs(nextX - playerXRef.current) < getItemHitXRadius(item);
        if (nearPlayer) {
          if (item.type === 'coin') {
            collectedCoins += 1;
            setCoinEffect(true);
            if (coinEffectTimeoutRef.current !== null) window.clearTimeout(coinEffectTimeoutRef.current);
            coinEffectTimeoutRef.current = window.setTimeout(() => {
              setCoinEffect(false);
              coinEffectTimeoutRef.current = null;
            }, 350);
            if (isFallingCoin && magnetActiveRef.current && magnetCoinsLeftRef.current > 0) {
              const nextMagnetCoinsLeft = magnetCoinsLeftRef.current - 1;
              magnetCoinsLeftRef.current = nextMagnetCoinsLeft;
              setMagnetCoinsLeft(nextMagnetCoinsLeft);
              if (nextMagnetCoinsLeft === 0) {
                magnetActiveRef.current = false;
                setMagnetActive(false);
                if (magnetTimeoutRef.current !== null) window.clearTimeout(magnetTimeoutRef.current);
                magnetTimeoutRef.current = null;
              }
            }
            return respawnItem(item);
          }
          if (item.type === 'magnet') {
            magnetActiveRef.current = true;
            magnetCoinsLeftRef.current = MAGNET_MAX_COINS;
            setMagnetCoinsLeft(MAGNET_MAX_COINS);
            setMagnetActive(true);
            if (magnetTimeoutRef.current !== null) window.clearTimeout(magnetTimeoutRef.current);
            magnetTimeoutRef.current = window.setTimeout(() => {
              magnetActiveRef.current = false;
              magnetCoinsLeftRef.current = 0;
              setMagnetActive(false);
              setMagnetCoinsLeft(0);
              magnetTimeoutRef.current = null;
            }, MAGNET_DURATION_MS);
            return respawnItem(item);
          }
          const nextLives = livesRef.current - 1;
          const currentDamageEffectId = damageEffectId.current + 1;
          damageEffectId.current = currentDamageEffectId;
          setDamageEffect({ id: currentDamageEffectId, x: playerXRef.current });
          window.setTimeout(() => setDamageEffect((current) => current?.id === currentDamageEffectId ? null : current), 700);
          livesRef.current = nextLives;
          setLives(nextLives);
          if (nextLives <= 0) setGameOver(true);
          return respawnItem(item);
        }
        const touchesPoopLine = item.y < BOTTOM_LINE_Y && nextY >= BOTTOM_LINE_Y;
        if (touchesPoopLine) {
          if (time >= fireEffectUntilRef.current) {
            fireEffectUntilRef.current = time + 120;
            setFireEffect({ id: item.id, x: item.x });
            window.setTimeout(() => setFireEffect((current) => current?.id === item.id ? null : current), 320);
          }
          return respawnItem(item);
        }
        return nextY > 108 ? respawnItem(item) : { ...item, x: nextX, y: nextY };
      });
      let itemsToRender = nextItems;
      if (collectedCoins > 0) {
        const nextScore = scoreRef.current + collectedCoins;
        scoreRef.current = nextScore;
        setPlayerX(nextPlayerX);
        setScore(nextScore);
        if (nextScore > highScoreRef.current) {
          highScoreRef.current = nextScore;
          setHighScore(nextScore);
          saveHighScore(nextScore);
        }
        const nextStage = Math.min(MAX_STAGE, Math.floor(nextScore / 10) + 1);
        if (!maxDifficultyRef.current && nextScore >= MAX_STAGE * 10) {
          directionRef.current = 0;
          magnetActiveRef.current = false;
          magnetCoinsLeftRef.current = 0;
          setMagnetActive(false);
          setMagnetCoinsLeft(0);
          if (magnetTimeoutRef.current !== null) window.clearTimeout(magnetTimeoutRef.current);
          magnetTimeoutRef.current = null;
          itemsRef.current = [];
          itemsToRender = [];
          setGameOver(false);
          setCompleted(true);
        } else if (nextStage > stageRef.current) {
          stageRef.current = nextStage;
          setStage(nextStage);
          magnetActiveRef.current = false;
          magnetCoinsLeftRef.current = 0;
          setMagnetActive(false);
          setMagnetCoinsLeft(0);
          if (magnetTimeoutRef.current !== null) window.clearTimeout(magnetTimeoutRef.current);
          magnetTimeoutRef.current = null;
          const stageItems = createStageItems(nextStage);
          itemsRef.current = stageItems;
          itemsToRender = stageItems;
        } else {
          itemsRef.current = nextItems;
        }
      } else {
        itemsRef.current = nextItems;
      }
      syncDomPositions(itemsToRender, nextPlayerX);
      if (hasRespawned || collectedCoins > 0) setItems(itemsToRender);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [completed, gameOver, isStarting, paused]);

  const restart = () => {
    directionRef.current = 0;
    maxDifficultyRef.current = false;
    scoreRef.current = 0;
    livesRef.current = 3;
    stageRef.current = 1;
    playerXRef.current = 50;
    setPlayerX(50);
    itemElementRefs.current.forEach((element) => {
      element.style.removeProperty('transform');
      element.style.removeProperty('visibility');
    });
    if (playerElementRef.current) {
      playerElementRef.current.style.removeProperty('transform');
    }
    const stageItems = createStageItems(1);
    itemsRef.current = stageItems;
    setItems(stageItems);
    setScore(0);
    setLives(3);
    setStage(1);
    setPaused(false);
    setGameOver(false);
    setCoinEffect(false);
    setDamageEffect(null);
    setFireEffect(null);
    if (magnetTimeoutRef.current !== null) window.clearTimeout(magnetTimeoutRef.current);
    if (coinEffectTimeoutRef.current !== null) window.clearTimeout(coinEffectTimeoutRef.current);
    magnetTimeoutRef.current = null;
    coinEffectTimeoutRef.current = null;
    magnetActiveRef.current = false;
    magnetCoinsLeftRef.current = 0;
    setMagnetActive(false);
    setMagnetCoinsLeft(0);
    setCompleted(false);
    setMaxDifficulty(false);
    setIsStarting(true);
  };
  const continueWithMaxDifficulty = () => {
    const maxItems = createMaxDifficultyItems();
    directionRef.current = 0;
    maxDifficultyRef.current = true;
    itemsRef.current = maxItems;
    livesRef.current = 3;
    stageRef.current = MAX_STAGE;
    setMaxDifficulty(true);
    setStage(MAX_STAGE);
    setLives(3);
    setItems(maxItems);
    setGameOver(false);
    setCompleted(false);
    setPaused(false);
    setDamageEffect(null);
    setFireEffect(null);
    if (magnetTimeoutRef.current !== null) window.clearTimeout(magnetTimeoutRef.current);
    magnetTimeoutRef.current = null;
    magnetActiveRef.current = false;
    magnetCoinsLeftRef.current = 0;
    setMagnetActive(false);
    setMagnetCoinsLeft(0);
  };
  const togglePause = () => {
    if (gameOver || completed || isStarting) return;
    pointerStartRef.current = null;
    directionRef.current = 0;
    setPaused((current) => !current);
  };

  return <div className={`auth-side-game stage-${stage}${isStarting ? ' is-starting' : ''}`} aria-label="Poop dodge coin game" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd} onPointerLeave={handlePointerEnd}>
    <button className="auth-game-pause" type="button" aria-label={paused ? '게임 재개' : '게임 일시정지'} onPointerDown={(event) => event.stopPropagation()} onClick={togglePause}>{paused ? '▶️' : '⏸️'}</button>
    <div className="auth-game-lives" aria-label={`생명 ${lives}개`}>❤️ × {lives}</div>
    <div className={`auth-game-score${coinEffect ? ' is-coin-pop' : ''}`}><span className="auth-coin-icon" aria-hidden="true" /> {score}</div>
    <div className="auth-game-best">최고기록 {highScore}</div>
    <div className="auth-game-stage">{maxDifficulty ? 'MAX DIFFICULTY' : `STAGE ${stage} / ${MAX_STAGE}`}</div>
    <div className="auth-game-spawn-line" aria-hidden="true" />
    {magnetActive && <div className="auth-game-magnet-status" aria-live="polite">🧲 코인 {magnetCoinsLeft}개 끌어당김</div>}
    {coinEffect && <span className="auth-game-coin-burst" style={{ left: `${playerX}%` }} aria-hidden="true">+1 ✨</span>}
    {items.map((item) => <div
      key={item.id}
      ref={(element) => {
        if (element) itemElementRefs.current.set(item.id, element);
        else itemElementRefs.current.delete(item.id);
      }}
      className={`auth-game-item${magnetActive && item.type === 'coin' ? ' is-magnetized' : ''}`}
    >
        {item.type === 'coin' ? <span className="auth-falling-item coin"><span className="auth-coin-icon" aria-hidden="true" /></span> : item.type === 'magnet' ? <span className="auth-falling-item magnet" role="img" aria-label="코인 자석">🧲</span> : item.size === 'cluster' ? <span className="auth-falling-item poop cluster" aria-hidden="true" style={{ width: `${31 * item.scale + (getClusterCount(item) - 1) * 23 * item.scale}px`, height: `${31 * item.scale}px` }}>{Array.from({ length: getClusterCount(item) }, (_, index) => <img key={index} src={rainbowPoopUrl} alt="" style={{ width: `${31 * item.scale}px`, height: `${31 * item.scale}px`, marginLeft: index === 0 ? 0 : `${-8 * item.scale}px` }} />)}</span> : <img className={`auth-falling-item poop${item.size === 'giant' ? ' giant' : ''}`} style={item.size === 'giant' ? { width: `${32 * item.scale}px`, height: `${32 * item.scale}px` } : undefined} src={rainbowPoopUrl} alt="" />}
    </div>)}
    <div className="auth-poop-line" aria-hidden="true" />
    {fireEffect && <span className="auth-poop-fire" style={{ left: `${fireEffect.x}%` }} aria-hidden="true">🔥</span>}
    <div className="auth-game-player" ref={playerElementRef} aria-label="Player">🚽</div>
    {damageEffect && <span className="auth-game-damage" style={{ left: `${damageEffect.x}%` }} aria-live="polite">
      <span>-1</span><span className="auth-broken-heart" role="img" aria-label="깨지는 하트" />
    </span>}
    {isStarting && <div className="auth-game-start-rainbow" aria-label="게임 시작 무지개">
      {RAINBOW_COLORS.map((color, index) => <span key={color} style={{ '--rainbow-color': color, '--rainbow-band': `${index * 7}%` } as CSSProperties} />)}
    </div>}
    {paused && !gameOver && <div className="auth-game-paused" aria-live="polite">일시정지</div>}
    {completed && <div className="auth-game-complete" role="dialog" aria-modal="true" aria-label="게임 완료">
      <div className="auth-poop-explosion" aria-hidden="true">
        {POOP_EXPLOSION_PARTICLES.map((particle, index) => <img
          key={index}
          src={rainbowPoopUrl}
          alt=""
          style={{ '--explosion-left': `${particle.left}%`, '--explosion-top': `${particle.top}%`, '--explosion-delay': `${particle.delay}s` } as CSSProperties}
        />)}
      </div>
      <strong>수고하셨습니다!</strong>
      <span>5단계를 모두 완료했어요 🎉</span>
      <div><button className="auth-game-continue" type="button" onClick={continueWithMaxDifficulty}>이어하기</button><button type="button" onClick={restart}>다시하기</button><button type="button" onClick={onExit}>종료하기</button></div>
    </div>}
    {gameOver && <div className="auth-game-over" role="dialog" aria-modal="true" aria-label="게임 종료"><strong>똥에 맞았어요!</strong><span>점수: {score}</span><div><button type="button" onClick={restart}>다시하기</button><button type="button" onClick={onExit}>종료하기</button></div></div>}
  </div>;
}
