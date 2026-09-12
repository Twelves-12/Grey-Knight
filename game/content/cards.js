import { CARD_ICONS } from "./card-icons.js";

/**
 * @param {string} id
 * @param {string} name
 * @param {"A" | "B" | "C"} faction
 * @param {number} cost
 * @param {number} attack
 * @param {number} health
 * @param {string} icon
 * @param {Partial<import("../types.js").CardDef>} [extra]
 * @returns {import("../types.js").CardDef}
 */
const card = (id, name, faction, cost, attack, health, icon, extra = {}) => ({
  id,
  name,
  faction,
  cost: Math.min(3, cost),
  sourceCost: cost,
  attack,
  health,
  type: "unit",
  command: { kind: "guard", count: 2, text: "一名友方单位获得 2 护甲。" },
  icon: CARD_ICONS[icon],
  text: "",
  ...extra,
});

// gamecard.xlsx 的 30 个有效数据行。匿名单位补名，保留原表各行数值与特质。
export const SCOUT = card("scout", "斥候", "A", 1, 1, 2, "scout");
export const INFANTRY = card("infantry", "步兵", "A", 2, 2, 3, "swordsman");

const SWORDSMAN = card(
  "veteran-swordsman",
  "老练剑士",
  "A",
  3,
  3,
  4,
  "greatsworder",
);
const BASTION_KNIGHT = card(
  "bastion-knight",
  "壁垒骑士",
  "A",
  4,
  4,
  5,
  "bastion-knight",
);
const SIEGE_ARCHER = card(
  "siege-archer",
  "破城弓手",
  "A",
  2,
  1,
  1,
  "arbalist",
  {
    heroDamageBonus: 2,
    text: "攻击英雄时，伤害额外 +2。",
  },
);
const WAR_DRUMMER = card("war-drummer", "战鼓兵", "A", 2, 1, 1, "herald", {
  onAllyDeploy: { faction: "A", kind: "damageHero", count: 1 },
  text: "其他友方 A 类单位打出时，对敌方英雄造成 1 伤害。",
});

export const HERALD = card("herald", "军旗手", "A", 2, 1, 1, "herald", {
  aura: { faction: "A", attack: 1, health: 1 },
  text: "在场时，所有友方 A 类单位（包括自己）+1 攻击、+1 生命。",
});

const RECRUITER = card("recruiter", "募兵官", "A", 3, 2, 2, "inquisitor", {
  onDeploy: [{ kind: "generateCard", faction: "A", attack: 2 }],
  text: "入场：获得一张随机 A 类牌，其攻击 +2。",
});
const FIELD_MARSHAL = card(
  "field-marshal",
  "授勋军官",
  "A",
  3,
  2,
  1,
  "duelist",
  {
    onDeploy: [{ kind: "buffTarget", attack: 2, health: 2 }],
    text: "入场：选择一名其他友方已出场单位，令其 +2 攻击、+2 生命。",
  },
);

export const ARBALIST = card("arbalist", "穿甲弩手", "A", 2, 2, 1, "arbalist", {
  command: { kind: "damage", count: 2, text: "对选定敌方单位造成 2 伤害。" },
  keyword: "piercing",
  text: "穿透：攻击时，同时伤害当前线路单位和敌方英雄。",
});

const OATH_BEARER = card("oath-bearer", "誓约执旗者", "A", 3, 0, 1, "herald", {
  onDeploy: [{ kind: "attackPerAlly", faction: "A", count: 2 }],
  text: "入场：场上每有一个友方 A 类单位（包括自己），自身获得 2 攻击。",
});

export const SHIELDBEARER = card(
  "shieldbearer",
  "重装护卫",
  "A",
  4,
  3,
  5,
  "shieldbearer",
);

const PACT_STEWARD = card(
  "pact-steward",
  "吞契执事",
  "A",
  5,
  4,
  3,
  "stitched-puppet",
  {
    fusionFaction: "A",
    onDeploy: [{ kind: "fusionDamageLane", count: 3 }],
    text: "融合友方 A 类单位时，材料死亡，并对同列敌方单位造成 3 伤害。",
  },
);

const WILD_CUB = card("wild-cub", "荒野幼兽", "B", 1, 1, 1, "shadow-wolf", {
  onAllyDamage: { faction: "B", attack: 1, cap: 4 },
  text: "另一名友方 B 类单位造成伤害时，自身获得 1 攻击，最多 4 攻击。",
});
const FANG_RAIDER = card(
  "fang-raider",
  "獠牙掠夺者",
  "B",
  2,
  1,
  1,
  "light-eater",
  {
    heroDamageBonus: 3,
    text: "攻击英雄时，伤害额外 +3。",
  },
);
const VOLATILE_BEAST = card(
  "volatile-beast",
  "裂潮兽",
  "B",
  2,
  2,
  1,
  "shadow-binder",
  {
    onFusionDamage: 2,
    text: "可被另一张单位牌融合；作为融合材料死亡时，对本线路敌方单位造成 2 伤害，不伤害英雄。",
  },
);
const SIEGE_BEAST = card(
  "siege-beast",
  "破门巨兽",
  "B",
  3,
  1,
  3,
  "great-devourer",
  {
    heroDamageBonus: 3,
    text: "攻击英雄时，伤害额外 +3。",
  },
);
const STORM_CALLER = card(
  "storm-caller",
  "蛮荒唤雷者",
  "B",
  3,
  3,
  2,
  "night-owl",
  {
    onAllyDeploy: { faction: "B", kind: "damageRandomEnemy", count: 2 },
    text: "其他友方 B 类单位打出时，对随机敌方单位造成 2 伤害。",
  },
);
const PACK_LEADER = card(
  "pack-leader",
  "群猎首领",
  "B",
  4,
  3,
  2,
  "shadow-wolf",
  {
    aura: { faction: "B", damage: 1 },
    text: "在场时，友方 B 类单位每次造成的伤害 +1，不增加攻击属性。",
  },
);
const TIDAL_HORROR = card(
  "tidal-horror",
  "潮汐恐兽",
  "B",
  4,
  2,
  2,
  "great-devourer",
  {
    onDeploy: [{ kind: "damageAllEnemies", count: 1 }],
    text: "入场：对所有敌方单位造成 1 伤害，不伤害英雄。",
  },
);
const ABYSS_HUNTER = card(
  "abyss-hunter",
  "深渊猎手",
  "B",
  5,
  3,
  3,
  "blade-shadow",
  {
    onDeploy: [{ kind: "damageTarget", count: 2 }],
    text: "入场：对选定敌方单位造成 2 伤害。",
  },
);
const FROST_SERPENT = card(
  "frost-serpent",
  "霜海巨蛇",
  "B",
  5,
  4,
  1,
  "shadow-binder",
  {
    onDeploy: [{ kind: "freezeLane", count: 1 }],
    text: "入场：冰冻本线路敌方单位，使其跳过下一次攻击。",
  },
);

const REFUGEE = card("refugee", "饥寒流民", "C", 1, 0, 3, "refugee");
const TORCH_BEARER = card(
  "torch-bearer",
  "执炬乡民",
  "C",
  1,
  1,
  1,
  "ember-squire",
);
const SHELTER_KEEPER = card(
  "shelter-keeper",
  "庇护所守望者",
  "C",
  2,
  0,
  5,
  "shelter",
);
const VILLAGE_ELDER = card(
  "village-elder",
  "结社乡老",
  "C",
  3,
  0,
  8,
  "shelter",
  {
    onDeploy: [{ kind: "generateCard", faction: "C" }],
    text: "入场：获得一张随机 C 类牌。",
  },
);
const VILLAGE_DEFENDER = card(
  "village-defender",
  "守村人",
  "C",
  3,
  2,
  3,
  "shieldbearer",
);
const PILGRIM = card("pilgrim", "远行信徒", "C", 3, 2, 4, "inquisitor");
const RELIEF_PREACHER = card(
  "relief-preacher",
  "布施教士",
  "C",
  4,
  2,
  3,
  "shelter",
  {
    onDeploy: [{ kind: "buffAllies", faction: "C", health: 2 }],
    text: "入场：所有友方 C 类单位 +2 生命。",
  },
);
const LIFE_ORACLE = card(
  "life-oracle",
  "众生先知",
  "C",
  5,
  0,
  7,
  "life-oracle",
  {
    healthAttack: true,
    text: "在场时，双方所有单位以当前生命值作为攻击力。",
  },
);

const SOURCE_CARDS = [
  SCOUT,
  INFANTRY,
  SWORDSMAN,
  BASTION_KNIGHT,
  SIEGE_ARCHER,
  WAR_DRUMMER,
  HERALD,
  RECRUITER,
  FIELD_MARSHAL,
  ARBALIST,
  OATH_BEARER,
  SHIELDBEARER,
  PACT_STEWARD,
  WILD_CUB,
  FANG_RAIDER,
  VOLATILE_BEAST,
  SIEGE_BEAST,
  STORM_CALLER,
  PACK_LEADER,
  TIDAL_HORROR,
  ABYSS_HUNTER,
  FROST_SERPENT,
  REFUGEE,
  TORCH_BEARER,
  SHELTER_KEEPER,
  VILLAGE_ELDER,
  VILLAGE_DEFENDER,
  PILGRIM,
  RELIEF_PREACHER,
  LIFE_ORACLE,
];

const BATTLEFIELD_CLERK = card(
  "battlefield-clerk",
  "战地书记",
  "A",
  2,
  1,
  3,
  "herald",
  {
    freeRequisition: true,
    text: "在场且清醒时，每轮第一次征调免费。",
  },
);
const NIGHT_WATCH = card("night-watch", "守夜人", "A", 2, 2, 3, "night-owl", {
  holdDiscount: true,
  text: "在手中保留一轮后，费用减 1（最低 0）。",
});
const ASH_CANNON = card(
  "ash-cannon",
  "灰烬炮骑",
  "A",
  3,
  3,
  6,
  "bastion-knight",
  {
    sleep: 2,
    onWake: { kind: "blast", count: 3 },
    command: {
      kind: "mark",
      count: 2,
      text: "标记一名敌方单位，其下次受到攻击或军令伤害 +2。",
    },
    text: "蓄势 2：沉睡时不能攻击或发动持续能力；苏醒时对敌方英雄造成 3 伤害。",
  },
);
const CLOCKTOWER_GUARD = card(
  "clocktower-guard",
  "钟楼弩卫",
  "A",
  3,
  5,
  4,
  "arbalist",
  {
    sleep: 1,
    cycleSleep: 1,
    command: { kind: "damage", count: 2, text: "对选定敌方单位造成 2 伤害。" },
    text: "蓄势 1；每次攻击后重新沉睡 1 轮。沉睡时不能攻击或发动持续能力。",
  },
);
const DAWN_HERALD = card("dawn-herald", "晨钟使", "C", 2, 2, 4, "herald", {
  sleep: 1,
  onWake: { kind: "draw", count: 1 },
  command: {
    kind: "wake",
    count: 1,
    text: "令一名友方单位的沉睡倒计时减少 1。",
  },
  text: "蓄势 1；苏醒时抽 1 张牌。沉睡时不能攻击或发动持续能力。",
});
const DREAM_SISTER = card("dream-sister", "守梦修女", "C", 2, 1, 5, "shelter", {
  protectsSleep: 1,
  command: {
    kind: "wake",
    count: 1,
    text: "令一名友方单位的沉睡倒计时减少 1。",
  },
  text: "在场且清醒时，相邻友方沉睡单位每次受到的伤害减少 1。",
});
const COMMANDER = card("commander", "号令者", "A", 1, 1, 2, "herald", {
  command: {
    kind: "swap",
    count: 1,
    text: "选择两个友方单位，交换它们的位置。",
  },
});
const DUELIST = card("duelist", "决斗士", "A", 2, 2, 2, "duelist", {
  keyword: "firstStrike",
  command: {
    kind: "firstStrike",
    count: 1,
    text: "令一名友方单位本轮获得先手。",
  },
  text: "先手：同列对拼先攻击，若击杀目标则不受还击。",
});
const ASH_SQUIRE = card(
  "ash-squire",
  "灰烬侍从",
  "A",
  1,
  1,
  1,
  "ember-squire",
  {
    onDeploy: [{ kind: "energy", count: 1 }],
    command: {
      kind: "recall",
      count: 1,
      text: "撤回一名友方单位到弃牌堆，并抽 1 张牌。",
    },
    text: "入场：恢复 1 圣力，不能超过 3 点。",
  },
);
const SPELL_KNIGHT = card(
  "spell-knight",
  "圣印近卫",
  "A",
  2,
  1,
  5,
  "inquisitor",
  {
    onSpellAttack: 1,
    text: "在场且清醒时，每使用一张独立行动牌，自身本场获得 1 攻击。",
  },
);

/** @param {string} id @param {string} name @param {number} cost @param {import("../types.js").CardDef["type"]} type @param {import("../types.js").CardDef["action"]} action @param {string} text @param {boolean} [exhaust] */
const actionCard = (id, name, cost, type, action, text, exhaust = false) => ({
  id,
  name,
  cost,
  sourceCost: cost,
  type,
  action,
  text,
  exhaust,
  faction: "C",
  attack: 0,
  health: 0,
  icon: CARD_ICONS.inquisitor,
});

const TACTICS = [
  actionCard(
    "aimed-shot",
    "瞄准射击",
    1,
    "tactic",
    { kind: "damage", count: 2 },
    "对选定敌方单位造成 2 伤害。",
  ),
  actionCard(
    "field-dressing",
    "战地包扎",
    1,
    "tactic",
    { kind: "heal", count: 3 },
    "为一名友方单位恢复 3 生命，不超过其生命上限。",
  ),
  actionCard(
    "shield-wall",
    "盾墙",
    1,
    "tactic",
    { kind: "guard", count: 3 },
    "一名友方单位获得 3 护甲。",
  ),
  actionCard(
    "wake-bell",
    "唤醒晨钟",
    1,
    "tactic",
    { kind: "wake", count: 1 },
    "令一名友方单位的沉睡倒计时减少 1。",
  ),
  actionCard(
    "stunning-blow",
    "震慑打击",
    1,
    "tactic",
    { kind: "stun", count: 1 },
    "眩晕一名敌方单位，使其跳过下一次攻击。",
  ),
  actionCard(
    "last-gamble",
    "孤注一掷",
    1,
    "tactic",
    { kind: "redraw", count: 3 },
    "弃掉其余全部手牌，然后抽 3 张。本场移除。",
    true,
  ),
  actionCard(
    "blood-levy",
    "血税征召",
    0,
    "tactic",
    { kind: "bloodDraw", count: 2 },
    "失去 2 点英雄生命，抽 2 张牌。",
    false,
  ),
  actionCard(
    "ash-recovery",
    "灰烬回收",
    1,
    "tactic",
    { kind: "recover", count: 1 },
    "选择弃牌堆的 1 张牌，放到牌库顶。",
  ),
  actionCard(
    "foreseer",
    "预见者",
    1,
    "tactic",
    { kind: "foresee", count: 3 },
    "查看牌库顶 3 张牌，并重新排列它们的顺序。",
  ),
  actionCard(
    "blessing",
    "祝福",
    1,
    "enhancement",
    { kind: "bless", count: 1 },
    "为一张手牌附加祝福：下次打出费用减 1，最低为 0；战后清除。",
  ),
  actionCard(
    "sharpening",
    "磨锋",
    1,
    "enhancement",
    { kind: "sharpen", count: 1 },
    "为一张单位手牌附加磨锋：本场攻击 +1，印记随该牌在牌堆间保留。",
  ),
  actionCard(
    "sealed-order",
    "封令",
    0,
    "enhancement",
    { kind: "seal", count: 1 },
    "为一张单位手牌附加封令：本场暂不能作为军令使用，换取本场攻击 +1。",
  ),
  actionCard(
    "dream-mark",
    "梦印",
    0,
    "enhancement",
    { kind: "dream", count: 1 },
    "为一张单位手牌附加梦印：下次部署额外沉睡 1 轮，换取本场攻击 +2。",
  ),
  actionCard(
    "honor",
    "授勋",
    1,
    "enhancement",
    { kind: "honor", count: 1 },
    "指定一名友方单位；本轮若其击杀敌人并存活，其对应冒险卡牌永久获得 1 攻击。本场移除。",
    true,
  ),
];

const KINDLING = actionCard(
  "kindling",
  "引火",
  1,
  "ritual",
  { kind: "ritual", nextCardId: "inscribe-oath" },
  "仪式第一阶段：将「铭誓」加入牌库。本场移除。",
  true,
);

export const RITUAL_STAGES = [
  actionCard(
    "inscribe-oath",
    "铭誓",
    2,
    "ritual",
    { kind: "ritual", nextCardId: "holy-seal" },
    "仪式第二阶段：将「圣印」加入牌库。本场移除；临时阶段牌不加入冒险牌组。",
    true,
  ),
  actionCard(
    "holy-seal",
    "圣印",
    3,
    "ritual",
    { kind: "ritual", count: 3 },
    "完成仪式：本场每轮结束时，对敌方英雄造成 3 伤害。本场移除；临时阶段牌不加入冒险牌组。",
    true,
  ),
].map((def) => ({ ...def, stage: true }));

export const GENERATABLE_CARDS = [
  ...SOURCE_CARDS,
  BATTLEFIELD_CLERK,
  NIGHT_WATCH,
  ASH_CANNON,
  CLOCKTOWER_GUARD,
  DAWN_HERALD,
  DREAM_SISTER,
  COMMANDER,
  DUELIST,
  ASH_SQUIRE,
  SPELL_KNIGHT,
  ...TACTICS,
  KINDLING,
];

// gameflow.docx 的命名单位采用文档明确数值；剧情奖励不进入随机生成池。
const SURRENDERED_BANDIT = card(
  "surrendered-bandit",
  "归顺匪首",
  "A",
  3,
  2,
  4,
  "duelist",
  {
    onDeploy: [{ kind: "generateCard", faction: "A", attack: 2 }],
    text: "入场：获得一张随机 A 类牌，其攻击 +2。",
    flavor: "投降的劫匪头目，愿意为灰骑士效力。",
  },
);
const BARBARIAN_CAPTIVE = card(
  "barbarian-captive",
  "蛮族俘虏",
  "B",
  2,
  1,
  2,
  "shadow-wolf",
  {
    onAllyDamage: { faction: "B", attack: 1, cap: 4 },
    text: "另一名友方 B 类单位造成伤害时，自身获得 1 攻击，最多 4 攻击。",
  },
);
const SEA_MONSTER_SKULL = card(
  "sea-monster-skull",
  "海怪之颅",
  "B",
  4,
  3,
  5,
  "bone-soldier",
  {
    keyword: "piercing",
    text: "穿透：攻击时，同时伤害当前线路单位和敌方英雄。",
  },
);
const KNIGHT_OATH = card("knight-oath", "骑士誓言", "A", 3, 2, 4, "herald", {
  onDeploy: [{ kind: "attackPerAlly", faction: "A", count: 2 }],
  text: "入场：场上每有一个友方 A 类单位（包括自己），自身获得 2 攻击。",
});
const REFUGEE_RELIEF = card(
  "refugee-relief",
  "流民接济",
  "C",
  2,
  0,
  5,
  "shelter",
  {
    onDeploy: [{ kind: "generateCard", faction: "C" }],
    text: "入场：获得一张随机 C 类牌。",
  },
);
const TRUTH_EVIDENCE = card(
  "truth-evidence",
  "真相之证",
  "A",
  4,
  3,
  5,
  "inquisitor",
  {
    onDeploy: [{ kind: "damageTarget", count: 2 }],
    text: "入场：对选定敌方单位造成 2 伤害。",
  },
);
const BROKEN_OATH = card(
  "broken-oath",
  "背弃誓约",
  "A",
  5,
  4,
  3,
  "greatsworder",
  {
    onDeploy: [{ kind: "buffAllies", faction: "A", health: 2 }],
    text: "入场：所有友方 A 类单位 +2 生命。",
  },
);

export const CHAPTER_REWARDS = {
  "node-1": [SURRENDERED_BANDIT],
  "node-2": [BARBARIAN_CAPTIVE],
  "node-3": [SEA_MONSTER_SKULL],
  "node-4": [KNIGHT_OATH],
  "node-5": [REFUGEE_RELIEF],
  "node-6": [TRUTH_EVIDENCE],
  "node-7": [BROKEN_OATH],
};

export const PLAYER_CARDS = [
  ...GENERATABLE_CARDS,
  ...Object.values(CHAPTER_REWARDS).flat(),
];

export const GREY_KNIGHT_STARTER_DECK = [
  INFANTRY,
  ARBALIST,
  COMMANDER,
  ASH_SQUIRE,
  WILD_CUB,
  VOLATILE_BEAST,
  DAWN_HERALD,
  DREAM_SISTER,
  TACTICS[0],
  KINDLING,
];

const BANDIT_GRUNT = card(
  "bandit-grunt",
  "匪徒杂兵",
  "A",
  1,
  1,
  2,
  "bone-soldier",
);
const BANDIT_DEPUTY = card(
  "bandit-deputy",
  "匪首副手",
  "A",
  2,
  2,
  3,
  "blade-shadow",
);
const RAIDING_PARTY = card(
  "raiding-party",
  "劫掠小队",
  "A",
  2,
  1,
  2,
  "duelist",
);
const BARBARIAN_SCOUT = card(
  "barbarian-scout",
  "蛮族斥候",
  "B",
  2,
  1,
  2,
  "scout",
);
const BARBARIAN_WARRIOR = card(
  "barbarian-warrior",
  "蛮族战士",
  "B",
  3,
  3,
  1,
  "greatsworder",
);
const BARBARIAN_WARBAND = card(
  "barbarian-warband",
  "蛮族战团",
  "B",
  4,
  3,
  2,
  "shadow-wolf",
);
const SEA_CLAW = card("sea-claw", "海栖爪兵", "B", 2, 1, 2, "shadow-binder");
const SEA_MONSTER = card(
  "deep-sea-monster",
  "深海海怪",
  "B",
  5,
  4,
  7,
  "great-devourer",
  {
    onDeploy: [{ kind: "damageAllEnemies", count: 1 }],
    text: "入场：对所有敌方单位造成 1 伤害，不伤害英雄。",
  },
);
const EXILED_SQUIRE = card(
  "exiled-squire",
  "流亡侍从",
  "A",
  1,
  1,
  2,
  "ember-squire",
);
const RENEGADE_KNIGHT = card(
  "renegade-knight",
  "叛逃骑士",
  "A",
  4,
  3,
  5,
  "duelist",
  {
    onDeploy: [{ kind: "buffTarget", attack: 2, health: 2 }],
    text: "入场：选择一名其他友方已出场单位，令其 +2 攻击、+2 生命。",
  },
);
const REFUGEE_ELDER = card(
  "refugee-elder",
  "流民乡老",
  "C",
  3,
  0,
  8,
  "shelter",
  {
    text: "分发物资救济难民，不主动攻击。",
  },
);
const OLD_BUTLER = card(
  "old-butler",
  "老管家",
  "A",
  5,
  4,
  3,
  "stitched-puppet",
  {
    fusionFaction: "A",
    onDeploy: [{ kind: "fusionDamageLane", count: 3 }],
    text: "融合一名友方 A 类单位后入场，对本线路敌方单位造成 3 伤害，不伤害英雄。",
  },
);
const PRIVATE_GUARD = card(
  "private-guard",
  "领主私人卫队",
  "A",
  4,
  3,
  5,
  "bastion-knight",
);
const TYRANT_LORD = card("tyrant-lord", "暴君领主", "A", 6, 5, 6, "crown", {
  onDeploy: [{ kind: "damageAllEnemies", count: 1 }],
  text: "入场：对所有敌方单位造成 1 伤害，不伤害英雄。",
});

const REBORN_SOLDIER = card(
  "reborn-soldier",
  "复生骸兵",
  "B",
  1,
  1,
  2,
  "bone-soldier",
  {
    text: "骸骨军团的援军会在指定轮次复生。",
  },
);
const ABYSS_CANNON = card(
  "abyss-cannon",
  "深渊炮兽",
  "B",
  3,
  3,
  6,
  "great-devourer",
  {
    sleep: 2,
    onWake: { kind: "blast", count: 4 },
    text: "蓄势 2；苏醒时对敌方英雄造成 4 伤害。沉睡时不能攻击或发动持续能力。",
  },
);
const NIGHTMARE_PRIEST = card(
  "nightmare-priest",
  "梦魇祭司",
  "B",
  3,
  1,
  5,
  "abyss-wraith",
  {
    sleep: 2,
    onWake: { kind: "attack", count: 3 },
    text: "蓄势 2；苏醒时获得 3 攻击。沉睡时不能攻击或发动持续能力。",
  },
);
const FACELESS_BELL = card(
  "faceless-bell",
  "无面钟",
  "B",
  3,
  4,
  5,
  "night-owl",
  {
    sleep: 1,
    cycleSleep: 1,
    text: "蓄势 1；每次攻击后重新沉睡 1 轮。沉睡时不能攻击或发动持续能力。",
  },
);

export const CHAPTER_ENEMY_CARDS = {
  "node-1": [BANDIT_GRUNT, BANDIT_DEPUTY, RAIDING_PARTY],
  "node-2": [BARBARIAN_SCOUT, BARBARIAN_WARRIOR, BARBARIAN_WARBAND],
  "node-3": [SEA_CLAW, SEA_MONSTER],
  "node-4": [EXILED_SQUIRE, RENEGADE_KNIGHT],
  "node-5": [REFUGEE, REFUGEE_ELDER],
  "node-6": [
    BANDIT_GRUNT,
    BANDIT_DEPUTY,
    RAIDING_PARTY,
    BARBARIAN_SCOUT,
    BARBARIAN_WARRIOR,
    OLD_BUTLER,
  ],
  "node-7": [PRIVATE_GUARD, TYRANT_LORD],
  "road-1": [REBORN_SOLDIER, BANDIT_DEPUTY],
  "road-2": [BARBARIAN_SCOUT, ABYSS_CANNON],
  "road-3": [SEA_CLAW, NIGHTMARE_PRIEST],
  "elite-1": [FACELESS_BELL, PRIVATE_GUARD],
  "elite-2": [NIGHTMARE_PRIEST, ABYSS_CANNON, SEA_CLAW],
};

export const ABYSS_FRONT_ENEMIES = [
  ...new Set(Object.values(CHAPTER_ENEMY_CARDS).flat()),
];

export const CARD_LIBRARY = [
  ...PLAYER_CARDS,
  ...RITUAL_STAGES,
  ...ABYSS_FRONT_ENEMIES,
];

/** @param {import("../types.js").CardDef} def @param {"unit" | "command"} branch */
export function applyCardUpgrade(def, branch) {
  if (def.type !== "unit") {
    if (branch === "unit") {
      return {
        ...def,
        name: `${def.name}·速成`,
        cost: Math.max(0, def.cost - 1),
        exhaust: true,
        text: `${def.text}【速成】费用 -1，使用后本场移除。`,
      };
    }
    if (
      def.action?.nextCardId ||
      ["foresee", "recover"].includes(def.action?.kind)
    ) {
      return {
        ...def,
        name: `${def.name}·精研`,
        action: { ...def.action, draw: 1 },
        text: `${def.text}【精研】结算后额外抽 1 张。`,
      };
    }

    return {
      ...def,
      name: `${def.name}·精研`,
      action: { ...def.action, count: (def.action?.count ?? 1) + 1 },
      text: `${def.text}【精研】主要效果数值 +1。`,
    };
  }
  if (branch === "unit") {
    return {
      ...def,
      name: `${def.name}·重装`,
      attack: def.attack + 2,
      sleep: (def.sleep ?? 0) + 1,
      text: `${def.text}【重装】攻击 +2；部署额外沉睡 1 轮。`,
    };
  }
  if (["firstStrike", "recall", "swap"].includes(def.command?.kind)) {
    return {
      ...def,
      name: `${def.name}·令使`,
      command: {
        ...def.command,
        draw: 1,
        text: `${def.command.text}【令使】结算后额外抽 1 张。`,
      },
    };
  }

  return {
    ...def,
    name: `${def.name}·令使`,
    command: {
      ...def.command,
      count: (def.command?.count ?? 1) + 1,
      text: `${def.command?.text ?? ""}【令使】军令效果数值 +1。`,
    },
  };
}
