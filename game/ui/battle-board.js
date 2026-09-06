import { $, $$ } from "../../js/dom.js";
import { LANE_COUNT } from "../game/rules.js";
import { createCard, setCardHp } from "./card-view.js";
import { animateDeath } from "./combat-motion.js";
import { el, finishAnimations } from "./utils.js";

/**
 * @typedef {import("../types.js").BattleCells} BattleCells
 * @typedef {import("../types.js").Unit} Unit
 * @typedef {import("../types.js").Side} Side
 */

export class BattleBoard {
  #element;
  #cardTemplate;
  /** @type {HTMLElement | undefined} */
  #omen;
  /** @type {BattleCells} */
  #cells;

  /**
   * @param {HTMLElement} element
   * @param {HTMLTemplateElement} cardTemplate
   */
  constructor(element, cardTemplate) {
    this.#element = element;
    this.#cardTemplate = cardTemplate;
    this.#cells = {
      enemy: [...$$('.lane-cell[data-side="enemy"]', element)],
      player: [...$$('.lane-cell[data-side="player"]', element)],
    };
  }

  get cells() {
    return this.#cells;
  }

  /** @param {import("../game/battle.js").Battle} battle */
  render(battle) {
    for (let col = 0; col < LANE_COUNT; col += 1) {
      this.#renderCell(this.#cells.enemy[col], battle.enemyBoard[col], "enemy");
      this.#renderCell(
        this.#cells.player[col],
        battle.playerBoard[col],
        "player",
      );
    }
  }

  /**
   * @param {Side} side
   * @param {number} col
   * @param {Unit} unit
   */
  place(side, col, unit) {
    const cell = this.#cells[side][col];
    cell.querySelector(".enemy-intent")?.remove();

    return this.#placeCard(cell, unit, side);
  }

  reset() {
    for (const cell of [...this.#cells.enemy, ...this.#cells.player]) {
      cell.classList.remove("target");
      for (const node of $$(".card, .enemy-intent", cell)) {
        node.remove();
      }
    }
    this.#element.querySelector(".round-banner")?.remove();
    this.#omen?.remove();
    this.#omen = undefined;
  }

  /**
   * @param {number} round
   * @param {AbortSignal} signal
   */
  async showRound(round, signal) {
    const node = el("div", "round-banner", `第 ${round} 回合`);
    this.#element.append(node);
    try {
      await finishAnimations(node.getAnimations(), signal);
    } finally {
      node.remove();
    }
  }

  /**
   * @param {HTMLElement} cell
   * @param {Unit | undefined} unit
   * @param {Side} side
   */
  #renderCell(cell, unit, side) {
    const existing = $(".card[data-uid]", cell);
    if (!unit) {
      if (existing) {
        animateDeath(existing);
      }

      return;
    }
    if (existing?.dataset.uid === String(unit.uid)) {
      setCardHp(existing, unit.hp, unit.hp < unit.def.health);

      return;
    }
    this.#placeCard(cell, unit, side);
  }

  /**
   * @param {HTMLElement} cell
   * @param {Unit} unit
   * @param {Side} side
   */
  #placeCard(cell, unit, side) {
    cell.querySelector(".card[data-uid]")?.remove();
    const card = createCard(this.#cardTemplate, unit.def, side, {
      hp: unit.hp,
    });
    card.dataset.uid = String(unit.uid);
    cell.append(card);

    return card;
  }

  /** @param {import("../game/battle.js").Battle} battle */
  renderIntent(battle) {
    const intents = battle.enemyIntents;
    for (const [col, cell] of this.#cells.enemy.entries()) {
      const summon = intents.find(
        (intent) => intent.kind === "summon" && intent.col === col,
      );
      const existing = $(".enemy-intent", cell);
      const show = summon && !battle.enemyBoard[col] && battle.phase !== "over";
      if (!show) {
        existing?.remove();

        continue;
      }
      if (existing?.dataset.cardId === summon.def.id) {
        continue;
      }
      existing?.remove();
      const intent = el("div", "enemy-intent");
      intent.dataset.cardId = summon.def.id;
      const card = createCard(this.#cardTemplate, summon.def, "enemy");
      card.classList.add("intent");
      intent.append(el("span", "intent-label", "将至"), card);
      cell.append(intent);
    }
    const abilities = intents.filter((intent) => intent.kind === "ability");
    if (abilities.length > 0 && battle.phase !== "over") {
      if (!this.#omen) {
        this.#omen = el("div", "ability-omen");
        this.#element.append(this.#omen);
      }
      this.#omen.textContent = abilities
        .map((intent) => intent.text)
        .join("；");
    } else {
      this.#omen?.remove();
      this.#omen = undefined;
    }
  }
}
