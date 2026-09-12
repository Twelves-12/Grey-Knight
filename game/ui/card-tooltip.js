import { createCardWatermark } from "./card-icons.js";
import { createCardRules } from "./card-rules.js";
import { markText } from "./card-view.js";
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
        this.#show(
          unitCard,
          def,
          unit?.hp ?? def.health,
          side,
          false,
          unit ? battle.attackOf(unit, side) : def.attack,
          unit?.maxHp ?? def.health,
          unit,
        );

        return;
      }
    }

    const handCard = hit.closest(".hand .card");
    if (handCard) {
      const def = battle.hand[Number(handCard.dataset.index)];
      if (def) {
        this.#show(
          handCard,
          def,
          def.health,
          "player",
          true,
          def.attack + (def.marks?.sharpen ?? 0),
          def.health,
          undefined,
          battle.cardCost(def),
        );

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
   * @param {number} [attack]
   * @param {number} [maxHp]
   * @param {import("../types.js").Unit} [unit]
   * @param {number} [cost]
   */
  #show(
    anchor,
    def,
    hp,
    side,
    showCost = false,
    attack = def.attack,
    maxHp = def.health,
    unit,
    cost = def.cost,
  ) {
    if (this.#anchor === anchor) {
      return;
    }

    this.hide();
    const tip = el("div", "tooltip-card");
    const meta = el("div", "tt-head");
    meta.append(el("div", "tt-name", def.name));
    if (def.nameEn) {
      meta.append(el("div", "tt-en", def.nameEn));
    }
    meta.append(
      el(
        "div",
        "tt-meta",
        `${def.faction ? `${def.faction} 种属 · ` : ""}${showCost ? `${cost} 圣力 · ` : ""}${def.type === "unit" ? `${attack}攻 · ${hp}/${maxHp}血` : { tactic: "战术", ritual: "仪式", enhancement: "强化" }[def.type]}${side === "enemy" ? "（敌）" : ""}`,
      ),
    );
    if (unit) {
      const states = [
        unit.armor ? `护甲 ${unit.armor}` : "",
        unit.sleep ? `沉睡 ${unit.sleep} 轮` : "",
        unit.stunned ? "眩晕：跳过下次攻击" : "",
        unit.marked ? `标记 ${unit.marked}` : "",
        unit.frozen ? "冰冻" : "",
      ].filter(Boolean);
      if (states.length > 0) {
        meta.append(el("div", "tt-meta", states.join(" · ")));
      }
    }
    if (def.marks && Object.values(def.marks).some(Boolean)) {
      meta.append(el("div", "tt-meta", `本场印记：${markText(def.marks)}`));
    }
    tip.append(createCardWatermark(def), meta);
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
