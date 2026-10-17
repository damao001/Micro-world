import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Anchor,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bird,
  Bug,
  Castle,
  Check,
  ChevronDown,
  ChevronUp,
  Cloud,
  CloudSnow,
  Compass,
  Eraser,
  Fan,
  Flame,
  Flower2,
  Home,
  LampFloor,
  Maximize2,
  Moon,
  Mountain,
  Pencil,
  Play,
  Rainbow,
  RotateCcw,
  Sailboat,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Sun,
  Sunset,
  TowerControl,
  Trees,
  Users,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { PocketWorldController } from './three/PocketWorldScene';
import {
  CameraViewId,
  TimeMode,
  TOOL_DEFINITIONS,
  ToolCategory,
  ToolId,
  WorldState,
} from './types/world';
import { soundscape } from './utils/soundscape';

const TOOL_GROUPS: { category: Exclude<ToolCategory, 'all'>; title: string }[] = [
  { category: 'village', title: '村庄与地标' },
  { category: 'water', title: '水域与海岸' },
  { category: 'nature', title: '自然与生灵' },
  { category: 'weather', title: '天气与天空' },
  { category: 'sculpt', title: '地形与清理' },
];

const CAMERA_VIEW_OPTIONS: {
  id: CameraViewId;
  label: string;
  description: string;
}[] = [
  { id: 'orb', label: '玻璃球全景', description: '饱览悬浮在胡桃木底座玻璃球内的微缩星球全景' },
  { id: 'surface', label: '海岸平视', description: '贴近地表，掠过沙滩、碧海与起伏丘陵的低空视角' },
  { id: 'orbit', label: '环绕俯瞰', description: '居中拉近视角，适合精细塑造地形与布置建筑' },
  { id: 'village', label: '村庄特写', description: '深入村庄街巷，近距离观赏屋瓦、栅栏与往来村民' },
];

const TIME_MODE_OPTIONS: {
  id: TimeMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'auto',
    label: '昼夜循环',
    description: '日月交替流转，自动演绎晨曦、午后、黄昏与星夜',
    icon: <Compass className="w-3.5 h-3.5" />,
  },
  {
    id: 'day',
    label: '晴朗白昼',
    description: '温暖明媚的午后阳光，清晰展现多面体星球的缤纷色彩',
    icon: <Sun className="w-3.5 h-3.5" />,
  },
  {
    id: 'twilight',
    label: '浪漫黄昏',
    description: '柔和静谧的暮色时刻，街灯、篝火与小屋窗格渐次亮起',
    icon: <Sunset className="w-3.5 h-3.5" />,
  },
  {
    id: 'night',
    label: '静谧星夜',
    description: '银白月光洒落大地，萤火虫飞舞，灯塔光束划破夜空',
    icon: <Moon className="w-3.5 h-3.5" />,
  },
];

function renderToolIcon(id: ToolId) {
  const cls = 'w-4 h-4 shrink-0';
  switch (id) {
    case 'tree':
      return <Trees className={cls} />;
    case 'house':
      return <Home className={cls} />;
    case 'windmill':
      return <Fan className={cls} />;
    case 'lighthouse':
      return <TowerControl className={cls} />;
    case 'watchtower':
      return <Castle className={cls} />;
    case 'campfire':
      return <Flame className={cls} />;
    case 'lantern':
      return <LampFloor className={cls} />;
    case 'balloon':
      return <Wind className={cls} />;
    case 'sailboat':
      return <Sailboat className={cls} />;
    case 'dock':
      return <Anchor className={cls} />;
    case 'duck':
      return <Bird className={cls} />;
    case 'mountain':
      return <Mountain className={cls} />;
    case 'lake':
      return <Waves className={cls} />;
    case 'flower':
      return <Flower2 className={cls} />;
    case 'beehive':
      return <Bug className={cls} />;
    case 'cloud':
      return <Cloud className={cls} />;
    case 'snowcloud':
      return <CloudSnow className={cls} />;
    case 'rainbow':
      return <Rainbow className={cls} />;
    case 'shootingstar':
      return <Sparkles className={cls} />;
    case 'villager':
      return <Users className={cls} />;
    case 'sheep':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cls}
          aria-hidden="true"
        >
          <path d="M8 15a4 4 0 0 1-2-7.5 4.5 4.5 0 0 1 8.5-1A3.5 3.5 0 0 1 18 10a3.5 3.5 0 0 1-1 6.8H8Z" />
          <path d="M9 17v3" />
          <path d="M15 17v3" />
        </svg>
      );
    case 'raise':
      return <ArrowUpFromLine className={cls} />;
    case 'lower':
      return <ArrowDownToLine className={cls} />;
    case 'remove':
      return <Eraser className={cls} />;
  }
}

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<PocketWorldController | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [worldState, setWorldState] = useState<WorldState>({
    planetName: '微风牧场',
    population: 12,
    happiness: 96,
    dayCount: 1,
    activeTool: 'tree',
    activeView: 'orb',
    timeMode: 'auto',
    timeOfDay: 0.24,
    tourActive: false,
    tourElapsed: 0,
    tourPhase: '',
    objectCounts: {
      houses: 4,
      trees: 22,
      windmills: 1,
      lighthouses: 2,
      villagers: 12,
      sheep: 8,
      clouds: 3,
      flowers: 5,
      boats: 3,
    },
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [webglLost, setWebglLost] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [uiVisible, setUiVisible] = useState(false);
  const [showToolHint, setShowToolHint] = useState(false);
  const [mobileDockExpanded, setMobileDockExpanded] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(() =>
    soundscape.isAudioEnabled(),
  );
  // 0 = normal, 1 = first confirmation, 2 = second (final) confirmation
  const [resetConfirmStep, setResetConfirmStep] = useState<0 | 1 | 2>(0);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const uiTimerRef = useRef<number | null>(null);
  const hintTimerRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const mobileScrollRef = useRef<HTMLDivElement | null>(null);
  const dragScrollState = useRef<{
    isDown: boolean;
    startX: number;
    scrollLeft: number;
    moved: boolean;
  }>({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });
  const dockSwipeStartY = useRef<number | null>(null);

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => {
      setStatusNotice(null);
    }, 3500);
  };

  const wakeUpUI = (alsoShowToolHint = false) => {
    soundscape.unlockOnInteraction();
    setUiVisible(true);
    if (uiTimerRef.current !== null) {
      window.clearTimeout(uiTimerRef.current);
    }
    uiTimerRef.current = window.setTimeout(() => {
      setUiVisible(false);
      setMobileDockExpanded(false);
      setShowToolHint(false);
    }, 6000);

    if (alsoShowToolHint) {
      setShowToolHint(true);
      if (hintTimerRef.current !== null) {
        window.clearTimeout(hintTimerRef.current);
      }
      hintTimerRef.current = window.setTimeout(() => {
        setShowToolHint(false);
      }, 6000);
    }
  };

  useEffect(() => {
    return () => {
      if (uiTimerRef.current !== null) {
        window.clearTimeout(uiTimerRef.current);
      }
      if (hintTimerRef.current !== null) {
        window.clearTimeout(hintTimerRef.current);
      }
      if (noticeTimerRef.current !== null) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const controller = new PocketWorldController(container, setWorldState);
    controllerRef.current = controller;

    const canvas = container.querySelector('canvas');
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglLost(true);
    };
    const onContextRestored = () => {
      setWebglLost(false);
    };

    if (canvas) {
      canvas.addEventListener('webglcontextlost', onContextLost);
      canvas.addEventListener('webglcontextrestored', onContextRestored);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', onContextLost);
        canvas.removeEventListener('webglcontextrestored', onContextRestored);
      }
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!filtersOpen) {
      setResetConfirmStep(0);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFiltersOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filtersOpen]);

  const handleSelectTool = (tool: ToolId) => {
    controllerRef.current?.setTool(tool);
    soundscape.playToolSound(tool);
    wakeUpUI(true);
  };

  const handleSelectView = (view: CameraViewId) => {
    controllerRef.current?.stopTour();
    controllerRef.current?.applyCameraPreset(view);
    controllerRef.current?.saveToLocalStorage();
    wakeUpUI(false);
  };

  const handleSelectTimeMode = (mode: TimeMode) => {
    controllerRef.current?.setTimeMode(mode);
    wakeUpUI(false);
  };

  const handleGrow = () => {
    controllerRef.current?.triggerGrowVillage();
    soundscape.playToolSound('tree');
    wakeUpUI(false);
  };

  const handleToggleTour = () => {
    setFiltersOpen(false);
    setMobileDockExpanded(false);
    setUiVisible(false);
    setShowToolHint(false);
    if (worldState.tourActive) {
      controllerRef.current?.stopTour();
    } else {
      controllerRef.current?.startTour();
    }
  };

  const handleZoomIn = () => {
    controllerRef.current?.zoomBy(-0.65);
    wakeUpUI(false);
  };

  const handleZoomOut = () => {
    controllerRef.current?.zoomBy(0.65);
    wakeUpUI(false);
  };

  const handleResetPanorama = () => {
    controllerRef.current?.stopTour();
    controllerRef.current?.applyCameraPreset('orb');
    wakeUpUI(false);
  };

  const handleToggleAudio = (nextVal?: boolean) => {
    const target = nextVal !== undefined ? nextVal : !audioEnabled;
    const enabled = soundscape.setEnabled(target);
    setAudioEnabled(enabled);
    if (enabled) {
      soundscape.playToolSound(worldState.activeTool);
    }
    wakeUpUI(false);
  };

  const handleCommitPlanetName = () => {
    const trimmed = worldState.planetName.trim() || '微风牧场';
    controllerRef.current?.setPlanetName(trimmed);
    setIsEditingName(false);
    showNotice('星球名称已保存至本地存档');
  };

  const handleConfirmResetDefault = () => {
    controllerRef.current?.resetToDefaultWorld();
    const enabled = soundscape.setEnabled(true);
    setAudioEnabled(enabled);
    setResetConfirmStep(0);
    soundscape.playToolSound('rainbow');
    showNotice('已恢复出厂默认生态世界');
  };

  const orderedTools = TOOL_GROUPS.flatMap((group) =>
    TOOL_DEFINITIONS.filter((t) => t.category === group.category),
  );

  const activeToolDef =
    TOOL_DEFINITIONS.find((t) => t.id === worldState.activeTool) ??
    TOOL_DEFINITIONS[0];

  const activeViewDef =
    CAMERA_VIEW_OPTIONS.find((v) => v.id === worldState.activeView) ??
    CAMERA_VIEW_OPTIONS[0];

  const activeTimeDef =
    TIME_MODE_OPTIONS.find((m) => m.id === worldState.timeMode) ??
    TIME_MODE_OPTIONS[0];

  const renderSettingsContent = () => (
    <div className="p-4 flex flex-col gap-5 overflow-y-auto">
      {statusNotice && (
        <div className="px-3 py-2 rounded-xl bg-[#e3eedc] border border-[#a6cfa0] text-[#23451e] text-xs font-medium flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* 1. 星球名称与实时生态统计 */}
      <section className="flex flex-col gap-1.5 pb-3 border-b border-[#e6dccb]">
        <div className="flex items-center justify-between gap-2">
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={worldState.planetName}
              maxLength={28}
              onChange={(e) =>
                setWorldState((prev) => ({
                  ...prev,
                  planetName: e.target.value,
                }))
              }
              onBlur={handleCommitPlanetName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  nameInputRef.current?.blur();
                }
              }}
              aria-label="星球名称"
              className="w-full px-2 py-0.5 text-lg font-semibold bg-[#fffdf9] border border-[#cbbba3] rounded text-[#2b221b] focus:outline-none focus:ring-2 focus:ring-[#a6cfa0]"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="group flex items-center gap-1.5 text-left cursor-pointer focus:outline-none"
              title="点击修改星球名称"
            >
              <h3 className="text-lg font-semibold tracking-tight text-[#2b221b] group-hover:text-[#4e6e3a] transition-colors">
                {worldState.planetName}
              </h3>
              <Pencil className="w-3.5 h-3.5 text-[#8c7d6b] opacity-70 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-[#594d40] font-mono-tabular">
          <span>
            人口{' '}
            <strong className="font-semibold text-[#2b221b]">
              {worldState.population}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            幸福度{' '}
            <strong className="font-semibold text-[#2e5926]">
              {worldState.happiness}%
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            第{' '}
            <strong className="font-semibold text-[#2b221b]">
              {worldState.dayCount}
            </strong>{' '}
            天
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-[#695b4c] font-mono-tabular pt-0.5">
          <span>{worldState.objectCounts.houses} 座房屋</span>
          <span aria-hidden="true">·</span>
          <span>{worldState.objectCounts.trees} 棵林木</span>
          <span aria-hidden="true">·</span>
          <span>{worldState.objectCounts.boats} 艘船只</span>
          <span aria-hidden="true">·</span>
          <span>{worldState.objectCounts.sheep} 只绵羊</span>
          <span aria-hidden="true">·</span>
          <span>{worldState.objectCounts.clouds} 朵云彩</span>
        </div>
      </section>

      {/* 2. 核心互动操作：繁荣生长 & 30秒环游 */}
      <section className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleGrow}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#23451e] bg-[#d4ebc8] hover:bg-[#c5e3b5] border border-[#a3cf8e] rounded-xl transition-colors cursor-pointer"
            title="推动村庄发展，自动添置新房屋、鹅卵石小径与茂密树木"
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>繁荣生长</span>
          </button>

          <button
            type="button"
            onClick={handleToggleTour}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl border bg-[#382f27] text-[#fcf8f0] border-[#261f19] hover:bg-[#4d4136] transition-colors cursor-pointer"
            title="开启 30 秒微缩星球全景运镜与昼夜奇观演示"
          >
            <Play className="w-3.5 h-3.5" />
            <span>30秒环游</span>
          </button>
        </div>
        <p className="text-[11px] text-[#695b4c] leading-relaxed">
          点击「繁荣生长」可让林木茂盛并扩建村落；点击「30秒环游」可欣赏电影级自动运镜。
        </p>
      </section>

      {/* 3. 环境白噪音与元素音效（开/关） */}
      <section className="flex flex-col gap-1.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
          环境白噪音与音效
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleToggleAudio(true)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
              audioEnabled
                ? 'bg-[#e3eedc] text-[#23451e] border-[#a6cfa0] shadow-xs'
                : 'bg-[#f3ede2] border-transparent text-[#594d40] hover:bg-[#eae1d3] hover:text-[#2b221b]'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>开启白噪音</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleAudio(false)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
              !audioEnabled
                ? 'bg-[#f7dede] text-[#692626] border-[#dfa4a4] shadow-xs'
                : 'bg-[#f3ede2] border-transparent text-[#594d40] hover:bg-[#eae1d3] hover:text-[#2b221b]'
            }`}
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>关闭静音</span>
          </button>
        </div>
        <p className="text-[11px] text-[#695b4c] leading-relaxed">
          当前混音：林间微风 ({worldState.objectCounts.trees}) · 海岸潮汐 ({worldState.objectCounts.boats}) · 细雨云层 ({worldState.objectCounts.clouds}) · 篝火噼啪与昼夜鸟语虫鸣。
        </p>
      </section>

      {/* 4. 镜头视角 */}
      <section className="flex flex-col gap-1.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
          镜头视角
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {CAMERA_VIEW_OPTIONS.map((v) => {
            const active =
              worldState.activeView === v.id && !worldState.tourActive;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => handleSelectView(v.id)}
                title={v.description}
                className={`px-3 py-2.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#e3eedc] text-[#23451e] border-[#a6cfa0] shadow-xs'
                    : 'bg-[#f3ede2] border-transparent text-[#594d40] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-[#695b4c]">
          {activeViewDef.description}
        </p>
      </section>

      {/* 5. 光影与昼夜 */}
      <section className="flex flex-col gap-1.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
          光影与昼夜
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {TIME_MODE_OPTIONS.map((m) => {
            const active = worldState.timeMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectTimeMode(m.id)}
                title={m.description}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#e1ecf7] text-[#264669] border-[#a4c2e3] shadow-xs'
                    : 'bg-[#f3ede2] border-transparent text-[#594d40] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                }`}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-[#695b4c]">
          {activeTimeDef.description}
        </p>
      </section>

      {/* 6. 本地自动存档与恢复默认设置（二次确认防误操作） */}
      <section className="flex flex-col gap-2.5 pt-3 border-t border-[#e6dccb]">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
            本地存档与重置
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#e3eedc] text-[#23451e] font-medium">
            本地自动存档已开启
          </span>
        </div>

        <p className="text-[11px] text-[#695b4c] leading-relaxed">
          所有地形改造、建筑布局与设置均自动保存在本地，每次进入自动读档恢复。
        </p>

        {/* 恢复默认设置（需重复二次确认，防止误操作） */}
        <div className="pt-0.5">
          {resetConfirmStep === 0 && (
            <button
              type="button"
              onClick={() => setResetConfirmStep(1)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-xl border bg-[#f9ecec] border-[#e6c5c5] text-[#7a2e2e] hover:bg-[#f3dede] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>恢复默认设置（重置初始星球）</span>
            </button>
          )}

          {resetConfirmStep === 1 && (
            <div className="p-3 rounded-xl bg-[#fff4e5] border border-[#ebc48a] flex flex-col gap-2">
              <div className="flex items-start gap-2 text-[#734912]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#c77c1c]" />
                <div className="text-xs leading-snug">
                  <strong className="font-semibold block mb-0.5">
                    第一次确认 (1/2)：确定要重置吗？
                  </strong>
                  恢复默认将清空您当前建造的所有房屋、林木、地形改造与本地存档。
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResetConfirmStep(0)}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-[#faf5ec] border border-[#dcd0be] text-[#473c32] hover:bg-[#efe6d8] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => setResetConfirmStep(2)}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#d9822b] text-white hover:bg-[#c27120] cursor-pointer"
                >
                  继续重置 (1/2)
                </button>
              </div>
            </div>
          )}

          {resetConfirmStep === 2 && (
            <div className="p-3 rounded-xl bg-[#fdeaea] border border-[#e39b9b] flex flex-col gap-2">
              <div className="flex items-start gap-2 text-[#701c1c]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#c93030]" />
                <div className="text-xs leading-snug">
                  <strong className="font-semibold block mb-0.5">
                    最后再次确认 (2/2)：此操作不可撤销！
                  </strong>
                  点击下方红色按钮将立即清除本地存档，并恢复初始「微风牧场」默认状态。
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResetConfirmStep(0)}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-[#faf5ec] border border-[#dcd0be] text-[#473c32] hover:bg-[#efe6d8] cursor-pointer"
                >
                  保留当前存档
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResetDefault}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#c93030] text-white hover:bg-[#ab2222] cursor-pointer"
                >
                  确认恢复默认 (2/2)
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );

  return (
    <div
      onPointerDown={() => wakeUpUI(true)}
      onTouchStart={() => wakeUpUI(true)}
      className="relative flex w-screen h-screen overflow-hidden select-none bg-[#221d2b]"
    >
      {/* 全屏 3D Three.js 生态球视口 */}
      <div className="relative flex-1 min-w-0 h-full">
        <div
          ref={mountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          aria-label="交互式 3D 迷你口袋世界生态星球"
        />

        {/* 右上角快捷缩放、全景与白噪音开关控制按钮（默认隐藏，点击屏幕后浮现，无操作数秒后自动隐藏） */}
        {!worldState.tourActive && (
          <div
            className={`fixed top-3 right-3 md:right-20 z-20 flex items-center gap-1.5 bg-[#faf5ec]/92 backdrop-blur-md border border-[#e2d7c5] rounded-xl p-1 shadow-md transition-all duration-300 ${
              uiVisible
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 -translate-y-3 pointer-events-none'
            }`}
          >
            <button
              type="button"
              onClick={() => handleToggleAudio()}
              title={audioEnabled ? '点击关闭环境白噪音与音效' : '点击开启环境白噪音与音效'}
              aria-label={audioEnabled ? '关闭环境白噪音' : '开启环境白噪音'}
              className={`h-8 px-2 flex items-center justify-center gap-1 rounded-lg border transition-all text-xs font-medium cursor-pointer active:scale-95 ${
                audioEnabled
                  ? 'bg-[#e3eedc] border-[#a6cfa0] text-[#23451e]'
                  : 'bg-[#f3ede2] border-[#e2d7c5] text-[#7a6b5a] hover:bg-[#eae1d3]'
              }`}
            >
              {audioEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>白噪音</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>已静音</span>
                </>
              )}
            </button>
            <div className="w-px h-4 bg-[#e2d7c5]" aria-hidden="true" />
            <button
              type="button"
              onClick={handleZoomIn}
              title="放大画面"
              aria-label="放大画面"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#473c32] hover:bg-[#eae1d3] active:scale-95 transition-all cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="缩小画面"
              aria-label="缩小画面"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#473c32] hover:bg-[#eae1d3] active:scale-95 transition-all cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetPanorama}
              title="恢复全景视角"
              aria-label="恢复全景视角"
              className="h-8 px-2 flex items-center justify-center gap-1 rounded-lg bg-[#f3ede2] border border-[#e2d7c5] text-[#382f27] hover:bg-[#eae1d3] active:scale-95 transition-all text-xs font-medium cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>全景</span>
            </button>
          </div>
        )}

        {/* 当前选中工具与描述浮层提示（默认隐藏，点击屏幕或切换工具后浮现，几秒后自动消失） */}
        {!worldState.tourActive && (
          <div
            className={`pointer-events-none fixed ${
              mobileDockExpanded ? 'bottom-56' : 'bottom-22'
            } md:bottom-5 left-1/2 -translate-x-1/2 z-10 px-3.5 py-2 rounded-2xl bg-[#faf5ec]/92 backdrop-blur-md border border-[#e2d7c5] shadow-lg flex items-center gap-2.5 max-w-[92vw] transition-all duration-300 ${
              uiVisible && showToolHint
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-3'
            }`}
          >
            <span
              className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${activeToolDef.accentBg} ${activeToolDef.accentBorder} ${activeToolDef.accentText}`}
            >
              {renderToolIcon(activeToolDef.id)}
            </span>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#2b221b] truncate">
                  {activeToolDef.label}
                </span>
                <span className="text-[10px] text-[#8c7d6b]">
                  · 点击星球放置，双指缩放/拖拽旋转
                </span>
              </div>
              <p className="text-[11px] text-[#594d40] truncate">
                {activeToolDef.description}
              </p>
            </div>
          </div>
        )}

        {/* WebGL 上下文丢失提示 */}
        {webglLost && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#231e2d]/90 text-[#faf6ee]">
            <div className="max-w-md p-6 text-center bg-[#322b3f] rounded-xl border border-white/10">
              <h2 className="text-xl font-semibold mb-2">
                生态球视图已暂停
              </h2>
              <p className="text-sm text-[#d6cee2]">
                3D WebGL 渲染上下文已中断。请刷新或恢复当前标签页以继续探索「{worldState.planetName}」。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 右侧栏：桌面端工具与设置侧边栏（默认沉浸式隐藏，点击屏幕后浮现，无操作数秒后自动隐藏） */}
      {!worldState.tourActive && (
        <aside
          aria-label="生态球控制与建造工具栏"
          onPointerMove={() => wakeUpUI(false)}
          className={`hidden md:flex fixed right-0 top-0 bottom-0 w-16 bg-[#faf5ec]/96 backdrop-blur-md border-l border-[#e2d7c5] text-[#382f27] flex-col items-center py-3 gap-2.5 z-20 transition-all duration-300 ${
            uiVisible
              ? 'opacity-100 translate-x-0 pointer-events-auto'
              : 'opacity-0 translate-x-full pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            title="世界设置与本地存档"
            aria-label="打开世界设置与本地存档"
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-[#382f27] text-[#fcf8f0] border border-[#261f19] hover:bg-[#4d4136] active:scale-95 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
          </button>

          <div className="w-8 h-px bg-[#e2d7c5] shrink-0" aria-hidden="true" />

          <div
            className="flex-1 w-full flex flex-col items-center gap-2 overflow-y-auto no-scrollbar py-0.5"
            role="toolbar"
            aria-orientation="vertical"
            aria-label="世界建造工具"
          >
            {orderedTools.map((tool) => {
              const isSelected = worldState.activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleSelectTool(tool.id)}
                  title={`${tool.label}：${tool.description}`}
                  aria-label={`${tool.label}：${tool.description}`}
                  className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? `${tool.accentBg} ${tool.accentBorder} ${tool.accentText} shadow-xs`
                      : 'bg-[#f3ede2] border-[#e2d7c5] text-[#54483c] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                  }`}
                >
                  {renderToolIcon(tool.id)}
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {/* 桌面端世界设置弹窗（已移除重复的工具说明列表，新增本地存档、纯离线HTML下载与二次确认恢复默认） */}
      {!worldState.tourActive && filtersOpen && (
        <div className="hidden md:flex fixed inset-0 z-40 items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setFiltersOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="世界设置与本地数据管理"
            className="relative z-10 w-full max-w-md max-h-[85vh] bg-[#faf5ec] text-[#382f27] rounded-2xl border border-[#e2d7c5] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="px-4 py-3 flex items-center justify-between border-b border-[#e6dccb] shrink-0">
              <h2 className="text-sm font-semibold text-[#2b221b]">
                世界设置与数据管理
              </h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="关闭设置窗口"
                title="关闭设置窗口"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#594d40] hover:bg-[#eae1d3] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renderSettingsContent()}
          </div>
        </div>
      )}

      {/* 移动端底部栏：默认隐藏，点击屏幕后浮现，无操作数秒后自动隐藏；支持左右顺滑滑动 + 上滑/点击展开 */}
      {!worldState.tourActive && (
        <div
          aria-label="移动端工具栏"
          onTouchStart={(e) => {
            wakeUpUI(false);
            dockSwipeStartY.current = e.touches[0]?.clientY ?? null;
          }}
          onTouchMove={() => wakeUpUI(false)}
          onTouchEnd={(e) => {
            wakeUpUI(false);
            if (dockSwipeStartY.current === null) return;
            const endY = e.changedTouches[0]?.clientY ?? dockSwipeStartY.current;
            const deltaY = dockSwipeStartY.current - endY;
            if (deltaY > 36 && !mobileDockExpanded) {
              setMobileDockExpanded(true);
            } else if (deltaY < -36 && mobileDockExpanded) {
              setMobileDockExpanded(false);
            }
            dockSwipeStartY.current = null;
          }}
          className={`md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#faf5ec]/96 backdrop-blur-md border-t border-[#e2d7c5] rounded-t-2xl shadow-xl flex flex-col transition-all duration-300 ${
            uiVisible
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-full pointer-events-none'
          }`}
        >
          {/* 顶部上滑/点击展开把手 */}
          <button
            type="button"
            onClick={() => {
              wakeUpUI(false);
              setMobileDockExpanded((prev) => !prev);
            }}
            className="w-full pt-1.5 pb-1 flex items-center justify-center gap-1 text-[11px] text-[#7a6b5a] hover:text-[#2b221b] cursor-pointer"
            aria-label={mobileDockExpanded ? '收起更多元素面板' : '展开显示更多元素'}
          >
            <span className="w-8 h-1 rounded-full bg-[#d6c8b4]" />
            <span className="flex items-center gap-0.5 font-medium">
              {mobileDockExpanded ? (
                <>
                  <span>收起</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>左右滑动或上滑更多 ({orderedTools.length})</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              )}
            </span>
          </button>

          {!mobileDockExpanded ? (
            /* 单行模式：支持手指左右滑动、滚轮与鼠标拖拽滑动 */
            <div className="px-3 pb-2.5 pt-0.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  wakeUpUI(false);
                  setFiltersOpen(true);
                }}
                className="h-11 px-3 shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-[#382f27] text-[#fcf8f0] border border-[#261f19] text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
                aria-label="打开世界设置"
              >
                <SlidersHorizontal className="w-4 h-4 shrink-0" />
                <span>设置</span>
              </button>

              <div className="relative flex-1 min-w-0">
                <div
                  ref={mobileScrollRef}
                  role="toolbar"
                  aria-label="世界建造工具"
                  onScroll={() => wakeUpUI(false)}
                  onWheel={(e) => {
                    wakeUpUI(false);
                    if (mobileScrollRef.current && e.deltaY !== 0) {
                      mobileScrollRef.current.scrollLeft += e.deltaY;
                    }
                  }}
                  onPointerDown={(e) => {
                    const el = mobileScrollRef.current;
                    if (!el) return;
                    dragScrollState.current = {
                      isDown: true,
                      startX: e.clientX - el.offsetLeft,
                      scrollLeft: el.scrollLeft,
                      moved: false,
                    };
                  }}
                  onPointerMove={(e) => {
                    const state = dragScrollState.current;
                    const el = mobileScrollRef.current;
                    if (!state.isDown || !el) return;
                    const x = e.clientX - el.offsetLeft;
                    const walk = x - state.startX;
                    if (Math.abs(walk) > 5) {
                      state.moved = true;
                      el.scrollLeft = state.scrollLeft - walk;
                    }
                  }}
                  onPointerUp={() => {
                    dragScrollState.current.isDown = false;
                  }}
                  onPointerLeave={() => {
                    dragScrollState.current.isDown = false;
                  }}
                  className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain py-0.5 pr-6 select-none"
                >
                  {orderedTools.map((tool) => {
                    const isSelected = worldState.activeTool === tool.id;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => {
                          if (dragScrollState.current.moved) {
                            dragScrollState.current.moved = false;
                            return;
                          }
                          handleSelectTool(tool.id);
                        }}
                        title={`${tool.label}：${tool.description}`}
                        aria-label={`${tool.label}：${tool.description}`}
                        className={`h-11 px-2.5 shrink-0 flex items-center justify-center gap-1.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? `${tool.accentBg} ${tool.accentBorder} ${tool.accentText} shadow-xs`
                            : 'bg-[#f3ede2] border-[#e2d7c5] text-[#54483c] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                        }`}
                      >
                        {renderToolIcon(tool.id)}
                        <span className="text-[11px] font-medium whitespace-nowrap">
                          {tool.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {/* 右侧渐隐提示，指示可继续向左滑动浏览更多元素 */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-linear-to-l from-[#faf5ec] to-transparent"
                />
              </div>
            </div>
          ) : (
            /* 展开模式：多行网格直接展示更多元素，可上下滑动快速点选 */
            <div className="px-3 pb-3 pt-1 flex flex-col gap-2.5 max-h-48 overflow-y-auto no-scrollbar touch-pan-y">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#473c32]">
                  全部建造元素 ({orderedTools.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMobileDockExpanded(false);
                    setFiltersOpen(true);
                  }}
                  className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg bg-[#382f27] text-[#fcf8f0] text-xs font-semibold cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>世界设置</span>
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {orderedTools.map((tool) => {
                  const isSelected = worldState.activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleSelectTool(tool.id)}
                      className={`py-2 px-1.5 flex flex-col items-center justify-center gap-1 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? `${tool.accentBg} ${tool.accentBorder} ${tool.accentText} shadow-xs`
                          : 'bg-[#f3ede2] border-[#e2d7c5] text-[#54483c] hover:bg-[#eae1d3]'
                      }`}
                    >
                      {renderToolIcon(tool.id)}
                      <span className="text-[11px] font-medium truncate max-w-full">
                        {tool.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 移动端底部抽屉弹窗（同样移除重复工具列表，共用世界设置与本地数据管理面板） */}
      {!worldState.tourActive && filtersOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setFiltersOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="世界设置与数据管理"
            className="relative z-10 w-full max-h-[82vh] bg-[#faf5ec] text-[#382f27] rounded-t-3xl border-t border-[#e2d7c5] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="w-10 h-1.5 bg-[#d6c8b4] rounded-full mx-auto mt-3 mb-1 shrink-0" />
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#e6dccb] shrink-0">
              <h2 className="text-sm font-semibold text-[#2b221b]">
                世界设置与数据管理
              </h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="关闭世界设置"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#594d40] hover:bg-[#eae1d3] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renderSettingsContent()}
          </div>
        </div>
      )}
    </div>
  );
}

