import { $ } from "../../js/dom.js";
import {
  applyCardSigil,
  createCardWatermark,
  plaqueMarkMarkup,
} from "./card-icons.js";
import { createCardRules } from "./card-rules.js";
import { el } from "./utils.js";

/**
 * 设置卡牌的属性标记和数值
 *
 * @param {HTMLElement} plaque
 * @param {"cost" | "atk" | "hp"} kind
 * @param {number} value
 */
function setPlaque(plaque, kind, value) {
  $(".mark", plaque).innerHTML = plaqueMarkMarkup(kind);
  $(".num", plaque).textContent = String(value);
}

/**
 * @param {HTMLTemplateElement} template
 * @param {import("../types.js").CardDef} def
 * @param {import("../types.js").Side} side
 * @param {{ inHand?: boolean; hp?: number; attack?: number; maxHp?: number; frozen?: number; cost?: number }} [options]
 */
export function createCard(template, def, side, options = {}) {
  const card = template.content.firstElementChild.cloneNode(true);
  card.classList.add(side);
  card.classList.toggle("hand-card", Boolean(options.inHand));
  card.dataset.type = def.type;
  if (def.keyword === "firstStrike") {
    card.classList.add("first-strike");
  }
  if (def.keyword === "piercing") {
    card.classList.add("piercing");
    $(".c-kicker", card).textContent = "穿透";
  }
  if (def.faction) {
    card.dataset.faction = def.faction;
    $(".c-heading", card).before(
      el("span", "c-faction", `${def.faction} 种属`),
    );
  }
  if (def.type !== "unit") {
    $(".c-heading", card).before(
      el(
        "span",
        "c-card-type",
        { tactic: "战术", ritual: "仪式", enhancement: "强化" }[def.type],
      ),
    );
  }
  const deployEffect = def.onDeploy?.[0];
  if (deployEffect) {
    card.dataset.effect = deployEffect.kind;
  }
  $(".c-name", card).textContent = def.name;
  if (options.inHand) {
    $(".c-seal", card).remove();
    card.prepend(createCardWatermark(def));
  } else {
    applyCardSigil($(".sigil", card), def);
  }
  setPlaque(
    $(".stat.atk", card),
    "atk",
    options.attack ?? def.attack + (def.marks?.sharpen ?? 0),
  );
  setCardHp(
    card,
    options.hp ?? def.health,
    (options.hp ?? def.health) < (options.maxHp ?? def.health),
  );
  card.classList.toggle("frozen", (options.frozen ?? 0) > 0);
  card.append(el("span", "c-status"));
  const effect = $(".c-effect", card);
  const cost = $(".c-cost", card);

  // 对于场上的卡牌（不在手牌里，在战场上），不显示规则和消耗
  if (!options.inHand) {
    effect.remove();
    cost.remove();

    return card;
  }

  effect.replaceWith(createCardRules(def, side));
  setPlaque(cost, "cost", options.cost ?? def.cost);
  if (def.type !== "unit") {
    $(".c-stats", card).remove();
  }
  if (def.marks && Object.values(def.marks).some(Boolean)) {
    card.append(el("span", "c-marks", markText(def.marks)));
  }

  return card;
}

/**
 * @param {HTMLElement} card
 * @param {number} hp
 * @param {boolean} damaged
 */
export function setCardHp(card, hp, damaged) {
  const stat = $(".stat.hp", card);
  setPlaque(stat, "hp", Math.max(0, hp));
  stat.classList.toggle("damaged", damaged);
}

/**
 * @param {HTMLElement} card
 * @param {import("../types.js").Unit} unit
 * @param {number} attack
 */
export function setCardStats(card, unit, attack) {
  setPlaque($(".stat.atk", card), "atk", attack);
  $(".stat.atk", card).classList.toggle("buffed", attack > unit.def.attack);
  setCardHp(card, unit.hp, unit.hp < unit.maxHp);
  $(".stat.hp", card).classList.toggle("buffed", unit.hp > unit.def.health);
  card.classList.toggle("frozen", unit.frozen > 0);
  const statuses = [
    unit.armor ? `护甲 ${unit.armor}` : "",
    unit.sleep ? `沉睡 ${unit.sleep}` : "",
    unit.stunned ? "眩晕" : "",
    unit.marked ? `标记 ${unit.marked}` : "",
    unit.frozen ? "冰冻" : "",
  ].filter(Boolean);
  const status = $(".c-status", card);
  status.textContent = statuses.join(" · ");
  card.classList.toggle("has-status", statuses.length > 0);
}

/** @param {Record<string, number>} marks */
export function markText(marks) {
  const names = {
    blessing: "祝福",
    sharpen: "磨锋",
    sealed: "封令",
    dream: "梦印",
  };

  return Object.entries(marks)
    .filter(([, value]) => value)
    .map(([kind, value]) => `${names[kind] ?? kind} ${value}`)
    .join(" · ");
}
