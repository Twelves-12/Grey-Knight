import { CARD_ICONS } from "./card-icons.js";

/** @typedef {import("../types.js").CardDef} CardDef */

/** @type {CardDef} */
const card = (id, name, icon, cost, attack, health, extra = {}) => ({
  attack,
  cost,
  health,
  icon,
  id,
  name,
  text: "",
  ...extra,
});

export const SCOUT = card("scout", "斥候", CARD_ICONS.scout, 1, 1, 2);
export const INFANTRY = card("infantry", "步兵", CARD_ICONS.swordsman, 2, 2, 3);
export const ARBALIST = card("arbalist", "弩手", CARD_ICONS.arbalist, 2, 3, 2);
export const CASTLE_ARBALIST = card(
  "castle-arbalist",
  "城堡弩手",
  CARD_ICONS["bastion-knight"],
  2,
  3,
  2,
  { onDeploy: [{ count: 1, kind: "damageHero" }] },
);

export const FIRST_CHAPTER_CARDS = [
  card("kol-first-bandit", "前匪首·科尔", CARD_ICONS.duelist, 2, 2, 3, {
    keyword: "firstStrike",
  }),
  card("militia-spearman", "乡勇矛兵", CARD_ICONS.swordsman, 1, 1, 2, {
    onDeploy: [{ count: 1, kind: "energy" }],
  }),
  card("ledger-guard", "账册护卫", CARD_ICONS.shieldbearer, 3, 2, 5, {
    onDeploy: [{ count: 2, kind: "healHero" }],
  }),
];

export const SECOND_CHAPTER_A_CARDS = [
  card("light-scout", "轻装斥候", CARD_ICONS.scout, 1, 1, 2, {
    keyword: "firstStrike",
  }),
  card("barbarian-axe-thrower", "蛮族投斧手", CARD_ICONS.greatsworder, 2, 4, 1, {
    onDeploy: [{ count: 1, kind: "damageHero" }],
  }),
];

export const SECOND_CHAPTER_B_CARDS = [
  card("border-cavalry", "边境骑兵", CARD_ICONS.duelist, 2, 3, 2, {
    keyword: "firstStrike",
  }),
  card("knights-legacy", "骑士遗志", CARD_ICONS.shieldbearer, 3, 4, 5, {
    onDeploy: [{ count: 3, kind: "healHero" }],
  }),
];

export const THIRD_CHAPTER_AUDIT_CARDS = [
  card("northern-scout", "北境斥候", CARD_ICONS.scout, 1, 1, 2, {
    onDeploy: [{ count: 1, kind: "draw" }],
  }),
  card("sea-monster-banner", "海怪战旗", CARD_ICONS.herald, 1, 1, 2, {
    onDeploy: [{ count: 1, kind: "energy" }],
  }),
];

export const THIRD_CHAPTER_TRAITOR_CARDS = [
  card("abyss-guard", "深渊守卫", CARD_ICONS["bastion-knight"], 2, 3, 5, {
    onDeploy: [{ count: 2, kind: "damageHero" }],
  }),
  card("secret-letter", "密信文书", CARD_ICONS.herald, 1, 1, 1, {
    onDeploy: [{ count: 2, kind: "draw" }],
  }),
];

export const FOURTH_CHAPTER_CARDS = [
  card("edmund-traitor-knight", "叛徒骑士·艾德蒙", CARD_ICONS.greatsworder, 3, 4, 4, {
    onDeploy: [{ count: 2, kind: "damageHero" }],
  }),
  card("oath-swordsman", "誓约剑士", CARD_ICONS.swordsman, 2, 2, 4, {
    onDeploy: [{ count: 1, kind: "healHero" }],
  }),
  card("refugee-volunteer", "流民志愿兵", CARD_ICONS["ember-squire"], 1, 1, 2, {
    onDeploy: [{ count: 1, kind: "draw" }],
  }),
];

export const FIFTH_CHAPTER_CARDS = [
  card("disguised-cleric", "伪装教士", CARD_ICONS.inquisitor, 2, 2, 2, {
    keyword: "firstStrike",
  }),
];

export const BUTLER_TESTIMONY = card(
  "butler-testimony",
  "老管家口供",
  CARD_ICONS.herald,
  2,
  1,
  1,
  { onDeploy: [{ count: 2, kind: "damageHero" }] },
);

/** @type {readonly CardDef[]} */
export const PLAYER_CARDS = [
  SCOUT,
  INFANTRY,
  ARBALIST,
  CASTLE_ARBALIST,
  ...FIRST_CHAPTER_CARDS,
  ...SECOND_CHAPTER_A_CARDS,
  ...SECOND_CHAPTER_B_CARDS,
  ...THIRD_CHAPTER_AUDIT_CARDS,
  ...THIRD_CHAPTER_TRAITOR_CARDS,
  ...FOURTH_CHAPTER_CARDS,
  ...FIFTH_CHAPTER_CARDS,
  BUTLER_TESTIMONY,
];

/** @type {readonly CardDef[]} */
export const GREY_KNIGHT_STARTER_DECK = [
  SCOUT,
  INFANTRY,
  ARBALIST,
];

export const HERALD = SCOUT;
export const SHIELDBEARER = INFANTRY;

/** @type {readonly CardDef[]} */
export const ABYSS_FRONT_ENEMIES = [
  card("bandit-grunt", "匪徒杂兵", CARD_ICONS["bone-soldier"], 0, 1, 2),
  card("bandit-deputy", "匪首副手", CARD_ICONS["blade-shadow"], 0, 2, 3, {
    onDeploy: [{ count: 1, kind: "damageHero" }],
  }),
  card("duke-private", "公爵私兵", CARD_ICONS["shadow-wolf"], 0, 2, 2),
  card("private-captain", "私兵队长", CARD_ICONS["bastion-knight"], 0, 3, 3, {
    onDeploy: [{ count: 2, kind: "damageHero" }],
  }),
  card("barbarian-warrior", "蛮族勇士", CARD_ICONS["great-devourer"], 0, 2, 3),
  card("barbarian-bear", "蛮族战熊", CARD_ICONS["shadow-wolf"], 0, 3, 4, {
    keyword: "firstStrike",
  }),
  card("northern-commander", "北境守将", CARD_ICONS["shieldbearer"], 0, 3, 3, {
    onDeploy: [{ count: 1, kind: "buffAttackAllies" }],
  }),
  card("guard", "守卫", CARD_ICONS["bone-soldier"], 0, 2, 2),
  card("sea-monster", "海怪本体", CARD_ICONS["great-devourer"], 0, 3, 3, {
    onDeploy: [{ count: 1, kind: "summon", cardId: "tentacle" }],
  }),
  card("tentacle", "触手", CARD_ICONS["shadow-binder"], 0, 1, 2),
  card("old-butler", "旧管家", CARD_ICONS["stitched-puppet"], 0, 2, 2, {
    onDeploy: [{ count: 1, kind: "buffHealthAllies" }],
  }),
  card("guard-escort", "护卫", CARD_ICONS["shadow-wolf"], 0, 2, 2),
  card("traitor-knight-enemy", "叛徒骑士", CARD_ICONS["greatsworder"], 0, 3, 4),
  card("squire", "侍从", CARD_ICONS["ember-squire"], 0, 1, 2, {
    onDeploy: [{ count: 2, kind: "healHero" }],
  }),
  card("duke", "公爵本人", CARD_ICONS.inquisitor, 0, 3, 3, {
    onDeploy: [{ count: 1, kind: "summon", cardId: "royal-guard" }],
  }),
  card("royal-guard", "王室卫兵", CARD_ICONS["shieldbearer"], 0, 2, 2, {
    onDeploy: [{ count: 1, kind: "randomBuff" }],
  }),
  card("duke-clerk", "公爵书记官", CARD_ICONS.herald, 0, 1, 2, {
    onDeploy: [{ count: 3, kind: "healHero" }],
  }),
];
