import { applyCardSigil } from "./card-icons.js";
import { createCardRules } from "./card-rules.js";
import { clamp, el } from "./utils.js";

/**
 * 卡牌悬浮时的美观提示
 */
export class CardTooltip {
  /** @type {HTMLElement | undefined} */
  #anchor;
  /** @type {HTMLElement | undefined} */
  #element;
  #root;

  /** @param {HTMLElement} root */
  constructor(root) {
    this.#root = root;
  }

  hide() {
    this.#element?.remove();
    this.#element = undefined;
    this.#anchor = undefined;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {import("../game/battle.js").Battle} battle
   */
  update(x, y, battle) {
    const hit = document.elementFromPoint(x, y);
    if (hit instanceof Element && hit.closest(".tooltip-card")) {
      return;
    }

    if (
      !(hit instanceof Element) ||
      battle.phase === "over" ||
      hit.closest(".dragging, .dead")
    ) {
      this.hide();

      return;
    }

    const cell = hit.closest(".lane-cell[data-side]");
    const unitCard = hit.closest(".lane-cell .card");
    if (cell && unitCard) {
      const side = cell.dataset.side === "enemy" ? "enemy" : "player";
      const board = side === "enemy" ? battle.enemyBoard : battle.playerBoard;
      const col = Number(cell.dataset.col);
      const unit = board[col];
      const preview = battle.enemyIntents.find(
        (intent) => intent.kind === "summon" && intent.col === col,
      );
      const def = unit?.def ?? (side === "enemy" ? preview?.def : undefined);
      if (def) {
        this.#show(unitCard, def, unit?.hp ?? def.health, side);

        return;
      }
    }

    const handCard = hit.closest(".hand .card");
    if (handCard) {
      const def = battle.hand[Number(handCard.dataset.index)];
      if (def) {
        this.#show(handCard, def, def.health, "player", true);

        return;
      }
    }

    this.hide();
  }

  /**
   * @param {HTMLElement} anchor
   * @param {import("../types.js").CardDef} def
   * @param {number} hp
   * @param {import("../types.js").Side} side
   * @param {boolean} [showCost]
   */
  #show(anchor, def, hp, side, showCost = false) {
    if (this.#anchor === anchor) {
      return;
    }

    this.hide();
    const tip = el("div", "tooltip-card");
    const head = el("div", "tt-head");
    const seal = el("div", "tt-seal");
    applyCardSigil(seal, def);
    head.append(seal);
    const meta = el("div");
    meta.append(el("div", "tt-name", def.name));
    if (def.nameEn) {
      meta.append(el("div", "tt-en", def.nameEn));
    }
    meta.append(
      el(
        "div",
        "tt-meta",
        `${showCost ? `${def.cost} 圣力 · ` : ""}${def.attack}攻 · ${hp}/${def.health}血${side === "enemy" ? "（敌）" : ""}`,
      ),
    );
    head.append(meta);
    tip.append(head);
    tip.append(createCardRules(def, side));
    if (def.flavor) {
      tip.append(el("div", "tt-flavor", `「${def.flavor}」`));
    }
    this.#anchor = anchor;
    this.#element = tip;
    this.#root.append(tip);
    this.#reposition();
  }

  #reposition() {
    const tip = this.#element;
    const rect = tip.getBoundingClientRect();
    const anchor = this.#anchor.getBoundingClientRect();
    const margin = 12;
    let x = anchor.right + margin;
    let y = anchor.top;
    if (x + rect.width > window.innerWidth - margin) {
      x = anchor.left - rect.width - margin;
      if (x < margin) {
        x = anchor.left + (anchor.width - rect.width) / 2;
        y = anchor.top - rect.height - margin;
        if (y < margin) {
          y = anchor.bottom + margin;
        }
      }
    }
    tip.style.left = `${clamp(
      x,
      margin,
      window.innerWidth - rect.width - margin,
    )}px`;
    tip.style.top = `${clamp(
      y,
      margin,
      window.innerHeight - rect.height - margin,
    )}px`;
  }
}
