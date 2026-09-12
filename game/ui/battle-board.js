import { $, $$ } from "../../js/dom.js";
import { LANE_COUNT } from "../game/rules.js";
import { createCard, setCardStats } from "./card-view.js";
import { animateDeath } from "./combat-motion.js";
import { el, finishAnimations } from "./utils.js";

/**
 * @typedef {import("../types.js").BattleCells} BattleCells
 * @typedef {import("../types.js").DisplayUnit} Unit
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
    for (const side of /** @type {const} */ (["player", "enemy"])) {
      for (const [col, cell] of this.#cells[side].entries()) {
        cell.setAttribute(
          "aria-label",
          `${side === "player" ? "己方" : "敌方"}第 ${col + 1} 条战线`,
        );
        cell.append(el("span", "lane-number", String(col + 1)));
      }
    }
  }

  get cells() {
    return this.#cells;
  }

  /** @param {import("../types.js").BoardState} state */
  render(state) {
    for (let col = 0; col < LANE_COUNT; col += 1) {
      this.#renderCell(this.#cells.enemy[col], state.enemy[col], "enemy");
      this.#renderCell(this.#cells.player[col], state.player[col], "player");
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

  /** @param {Side} side @param {number} col @param {Unit} unit */
  update(side, col, unit) {
    return /** @type {HTMLElement} */ (
      this.#renderCell(this.#cells[side][col], unit, side)
    );
  }

  /** @param {import("../types.js").MoveEvent} event @param {AbortSignal} signal */
  async move(event, signal) {
    if (signal.aborted) {
      return;
    }
    const moving = event.moves.map(({ from, to, unit }) => {
      const card = $(
        `.card[data-uid="${unit.uid}"]`,
        this.#cells[event.side][from],
      );

      return {
        to,
        unit,
        origin: card ? { card, bounds: card.getBoundingClientRect() } : null,
      };
    });
    for (const { origin } of moving) {
      origin?.card.remove();
    }
    const animations = [];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      for (const entry of moving) {
        const cell = this.#cells[event.side][entry.to];
        cell.querySelector(".enemy-intent")?.remove();
        cell.querySelector(".card[data-uid]")?.remove();
        if (!entry.origin) {
          this.#placeCard(cell, entry.unit, event.side);

          continue;
        }
        const { card, bounds } = entry.origin;
        cell.append(card);
        setCardStats(card, entry.unit, entry.unit.displayAttack);
        const target = card.getBoundingClientRect();
        const dx = bounds.left - target.left;
        const dy = bounds.top - target.top;
        card.classList.add("moving-unit");
        animations.push(
          card.animate(
            reduced
              ? [{ opacity: 0.65 }, { opacity: 1 }]
              : [
                  { transform: `translate(${dx}px, ${dy}px)` },
                  {
                    transform: `translate(${dx * 0.48}px, ${dy * 0.48 - 12}px) scale(1.035)`,
                    offset: 0.5,
                  },
                  { transform: "translate(0, 0) scale(1)" },
                ],
            {
              duration: reduced ? 80 : 240,
              easing: "cubic-bezier(0.22, 0.7, 0.25, 1)",
            },
          ),
        );
      }
      await finishAnimations(animations, signal);
    } finally {
      for (const animation of animations) {
        animation.cancel();
      }
      for (const { origin } of moving) {
        origin?.card.classList.remove("moving-unit");
      }
    }
  }

  /** @param {import("../types.js").UnitDeathEvent} event @param {AbortSignal} signal */
  async remove(event, signal) {
    const card = $(
      `.card[data-uid="${event.uid}"]`,
      this.#cells[event.target.side][event.target.col],
    );
    if (card) {
      await animateDeath(card, signal);
    }
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

  /** @param {number} from @param {number} to @param {number} bonus @param {AbortSignal} signal */
  async showBreakthrough(from, to, bonus, signal) {
    const source = this.#cells.player[from];
    const target = this.#cells.player[to];
    const banner = el(
      "div",
      "chain-banner",
      `破阵！${from + 1} ${from < to ? "→" : "←"} ${to + 1} · 攻击 +${bonus}`,
    );
    source.classList.add("chain-source");
    target.classList.add("chain-target");
    this.#element.append(banner);
    try {
      await finishAnimations(banner.getAnimations(), signal);
    } finally {
      source.classList.remove("chain-source");
      target.classList.remove("chain-target");
      banner.remove();
    }
  }

  /**
   * @param {HTMLElement} cell
   * @param {Unit | null} unit
   * @param {Side} side
   */
  #renderCell(cell, unit, side) {
    const existing = $(".card[data-uid]", cell);
    if (!unit) {
      existing?.remove();

      return;
    }
    if (existing?.dataset.uid === String(unit.uid)) {
      setCardStats(existing, unit, unit.displayAttack);

      return existing;
    }
    const card = this.#placeCard(cell, unit, side);

    return card;
  }

  /**
   * @param {HTMLElement} cell
   * @param {Unit} unit
   * @param {Side} side
   */
  #placeCard(cell, unit, side) {
    cell.querySelector(".card[data-uid]")?.remove();
    const card = /** @type {HTMLElement} */ (
      createCard(this.#cardTemplate, unit.def, side, {
        hp: unit.hp,
        attack: unit.displayAttack,
        maxHp: unit.maxHp,
        frozen: unit.frozen,
      })
    );
    card.dataset.uid = String(unit.uid);
    setCardStats(card, unit, unit.displayAttack);
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
      const card = /** @type {HTMLElement} */ (
        createCard(this.#cardTemplate, summon.def, "enemy")
      );
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
