export type ToolId =
  // Original Tools
  | 'tree'
  | 'house'
  | 'windmill'
  | 'lighthouse'
  | 'mountain'
  | 'lake'
  | 'flower'
  | 'cloud'
  | 'villager'
  | 'sheep'
  | 'raise'
  | 'lower'
  | 'remove'
  // A. Water & Coastal Life
  | 'sailboat'
  | 'dock'
  | 'duck'
  // B. Cozy Village & Countryside Landmarks
  | 'campfire'
  | 'balloon'
  | 'watchtower'
  | 'beehive'
  | 'lantern'
  // C. Weather & Elemental Powers
  | 'rainbow'
  | 'snowcloud'
  | 'shootingstar';

export type ToolCategory = 'all' | 'village' | 'water' | 'nature' | 'weather' | 'sculpt';

export type CameraViewId = 'orb' | 'surface' | 'orbit' | 'village';

export type TimeMode = 'auto' | 'day' | 'twilight' | 'night';

export interface WorldState {
  planetName: string;
  population: number;
  happiness: number;
  dayCount: number;
  activeTool: ToolId;
  activeView: CameraViewId;
  timeMode: TimeMode;
  /** 0..1 where 0.25 = warm noon/afternoon, 0.52 = blue twilight, 0.78 = deep night */
  timeOfDay: number;
  tourActive: boolean;
  tourElapsed: number;
  tourPhase: string;
  objectCounts: {
    houses: number;
    trees: number;
    windmills: number;
    lighthouses: number;
    villagers: number;
    sheep: number;
    clouds: number;
    flowers: number;
    boats: number;
  };
}

export interface ToolDefinition {
  id: ToolId;
  label: string;
  category: Exclude<ToolCategory, 'all'>;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  description: string;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // 村庄与地标
  {
    id: 'house',
    label: '温馨小屋',
    category: 'village',
    accentBg: 'bg-[#fce4d6]',
    accentBorder: 'border-[#ebb69b]',
    accentText: 'text-[#6e3820]',
    description: '建造一座铺着屋瓦、窗户散发暖光的柔和色调小屋',
  },
  {
    id: 'windmill',
    label: '白色风车',
    category: 'village',
    accentBg: 'bg-[#fdf2d0]',
    accentBorder: 'border-[#e5cc87]',
    accentText: 'text-[#665014]',
    description: '竖起一座帆叶随风转动的白色乡村风车',
  },
  {
    id: 'lighthouse',
    label: '海岸灯塔',
    category: 'village',
    accentBg: 'bg-[#fadadd]',
    accentBorder: 'border-[#e59fa6]',
    accentText: 'text-[#70232b]',
    description: '建造一座带有旋转引航光束的红白条纹海岸灯塔',
  },
  {
    id: 'watchtower',
    label: '石砌瞭望塔',
    category: 'village',
    accentBg: 'bg-[#e6e2f5]',
    accentBorder: 'border-[#b8b0d9]',
    accentText: 'text-[#3c345c]',
    description: '建造一座飘扬着三角旗帜的童话石砌塔楼',
  },
  {
    id: 'campfire',
    label: '石围篝火',
    category: 'village',
    accentBg: 'bg-[#fde2c8]',
    accentBorder: 'border-[#eba972]',
    accentText: 'text-[#70360f]',
    description: '点燃噼啪作响的石围篝火，夜晚吸引村民围坐相聚',
  },
  {
    id: 'lantern',
    label: '街灯石径',
    category: 'village',
    accentBg: 'bg-[#fef0c9]',
    accentBorder: 'border-[#e5c777]',
    accentText: 'text-[#634b10]',
    description: '放置黄昏时自动亮起暖光的铁艺街灯与鹅卵石小径',
  },
  {
    id: 'balloon',
    label: '热气球',
    category: 'village',
    accentBg: 'bg-[#f9d9e6]',
    accentBorder: 'border-[#e39db9]',
    accentText: 'text-[#6b2543]',
    description: '放飞一只燃烧器闪烁着温暖火光的柔和条纹热气球',
  },

  // 水域与海岸
  {
    id: 'sailboat',
    label: '木制帆船',
    category: 'water',
    accentBg: 'bg-[#d6eff7]',
    accentBorder: 'border-[#8ec9de]',
    accentText: 'text-[#1c5166]',
    description: '放航一艘挂着柔和帆面与夜间航灯的木制帆船',
  },
  {
    id: 'dock',
    label: '码头与木桥',
    category: 'water',
    accentBg: 'bg-[#efe4d4]',
    accentBorder: 'border-[#cbb393]',
    accentText: 'text-[#543d22]',
    description: '在岸边搭建木制码头栈桥，或在水域上横跨拱形木桥',
  },
  {
    id: 'duck',
    label: '天鹅与水鸭',
    category: 'water',
    accentBg: 'bg-[#e2f5ef]',
    accentBorder: 'border-[#9ad1c0]',
    accentText: 'text-[#1f5747]',
    description: '添置成群结队戏水、漾起圈圈涟漪的白天鹅与水鸭',
  },

  // 自然与生灵
  {
    id: 'tree',
    label: '林木',
    category: 'nature',
    accentBg: 'bg-[#dff0d8]',
    accentBorder: 'border-[#a6cfa0]',
    accentText: 'text-[#2c5227]',
    description: '在丘陵种植橡树、山巅种植松树，或在沙滩种下棕榈树',
  },
  {
    id: 'flower',
    label: '繁花簇',
    category: 'nature',
    accentBg: 'bg-[#f5dff7]',
    accentBorder: 'border-[#d6a9dc]',
    accentText: 'text-[#5b2a61]',
    description: '在草地上撒落绚丽柔和的野花簇',
  },
  {
    id: 'beehive',
    label: '彩绘蜂箱',
    category: 'nature',
    accentBg: 'bg-[#fcf0c2]',
    accentBorder: 'border-[#e3c76b]',
    accentText: 'text-[#5e480d]',
    description: '放置彩绘木制蜂箱，吸引蝴蝶与蜜蜂翩翩环绕',
  },
  {
    id: 'villager',
    label: '村民',
    category: 'nature',
    accentBg: 'bg-[#fde8c8]',
    accentBorder: 'border-[#e6be83]',
    accentText: 'text-[#664414]',
    description: '迎来一位在房屋、篝火与石井之间悠闲漫步的村民',
  },
  {
    id: 'sheep',
    label: '小绵羊',
    category: 'nature',
    accentBg: 'bg-[#f2efe9]',
    accentBorder: 'border-[#ccc5b8]',
    accentText: 'text-[#474137]',
    description: '添置一只毛茸茸的白色吃草小绵羊',
  },

  // 天气与天空
  {
    id: 'cloud',
    label: '甘霖雨云',
    category: 'weather',
    accentBg: 'bg-[#e1ecf7]',
    accentBorder: 'border-[#a4c2e3]',
    accentText: 'text-[#264669]',
    description: '召唤一朵蓬松雨云，降下甘霖滋润并催生下方的树木',
  },
  {
    id: 'snowcloud',
    label: '寒霜雪云',
    category: 'weather',
    accentBg: 'bg-[#e4f2fc]',
    accentBorder: 'border-[#9ec8e8]',
    accentText: 'text-[#1e4b6e]',
    description: '召唤一朵寒霜雪云，为山丘与屋顶披上皑皑白雪',
  },
  {
    id: 'rainbow',
    label: '彩虹拱桥',
    category: 'weather',
    accentBg: 'bg-[#fce3f0]',
    accentBorder: 'border-[#e3a1c4]',
    accentText: 'text-[#662247]',
    description: '在天空中架起一道晶莹剔透的柔和彩虹桥',
  },
  {
    id: 'shootingstar',
    label: '许愿流星',
    category: 'weather',
    accentBg: 'bg-[#e5dff7]',
    accentBorder: 'border-[#b3a3e3]',
    accentText: 'text-[#392769]',
    description: '让一颗璀璨闪烁的流星划过玻璃球苍穹',
  },

  // 地形与清理
  {
    id: 'mountain',
    label: '覆雪山峰',
    category: 'sculpt',
    accentBg: 'bg-[#e3e6ee]',
    accentBorder: 'border-[#b2bacf]',
    accentText: 'text-[#363e52]',
    description: '隆起一座覆雪的多面体高山峰峦',
  },
  {
    id: 'lake',
    label: '碧绿湖泊',
    category: 'sculpt',
    accentBg: 'bg-[#d4f1f4]',
    accentBorder: 'border-[#8fd3db]',
    accentText: 'text-[#1c5961]',
    description: '开凿一处由浅入深的碧绿湖泊水湾',
  },
  {
    id: 'raise',
    label: '抬升陆地',
    category: 'sculpt',
    accentBg: 'bg-[#e6eed6]',
    accentBorder: 'border-[#b5c993]',
    accentText: 'text-[#3b4f1d]',
    description: '抬高球面多面体地形网格',
  },
  {
    id: 'lower',
    label: '降低陆地',
    category: 'sculpt',
    accentBg: 'bg-[#d8edf2]',
    accentBorder: 'border-[#96c9d6]',
    accentText: 'text-[#20515e]',
    description: '降低球面地形以引入清澈碧绿的海水',
  },
  {
    id: 'remove',
    label: '移除物件',
    category: 'sculpt',
    accentBg: 'bg-[#f7dede]',
    accentBorder: 'border-[#dfa4a4]',
    accentText: 'text-[#692626]',
    description: '清除星球表面上的单个建筑或物件',
  },
];
