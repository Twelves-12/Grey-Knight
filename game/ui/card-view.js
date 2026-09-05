import { $ } from "../../js/dom.js";
import { applyCardSigil, plaqueMarkMarkup } from "./card-icons.js";
import { createCardRules } from "./card-rules.js";

/**
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
 * @param {{ inHand?: boolean; hp?: number }} [options]
 */
export function createCard(template, def, side, options = {}) {
  const card = template.content.firstElementChild.cloneNode(true);
  card.classList.add(side);
  card.classList.toggle("hand-card", Boolean(options.inHand));
  if (def.keyword) {
    card.classList.add("first-strike");
  }
  const deployEffect = def.onDeploy?.[0];
  if (deployEffect) {
    card.dataset.effect = deployEffect.kind;
  }
  $(".c-name", card).textContent = def.name;
  applyCardSigil($(".sigil", card), def);
  setPlaque($(".stat.atk", card), "atk", def.attack);
  setCardHp(
    card,
    options.hp ?? def.health,
    (options.hp ?? def.health) < def.health,
  );
  const effect = $(".c-effect", card);
  const cost = $(".c-cost", card);
  if (!options.inHand) {
    effect.remove();
    cost.remove();

    return card;
  }
  effect.replaceWith(createCardRules(def, side));
  setPlaque(cost, "cost", def.cost);

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
