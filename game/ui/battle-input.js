import { $, $$ } from "../../js/dom.js";
import { DraggedCard } from "./card-motion.js";
import { createCard } from "./card-view.js";

/**
 * @typedef {{
 *   getBattle: () => import("../game/battle.js").Battle;
 *   canAct: () => boolean;
 *   play: (index: number, col: number, drag?: DraggedCard) => import("../types.js").PlayResult;
 *   endTurn: () => void;
 *   restart: () => void;
 * }} BattleControls
 * @typedef {{
 *   card: HTMLElement;
 *   index: number;
 *   pointerId: number;
 *   x: number;
 *   y: number;
 *   drag?: DraggedCard;
 * }} CardGesture
 */

export class BattleInput {
  /** @type {CardGesture | undefined} */
  #gesture;
  /** @type {number | undefined} */
  #selected;
  #controls;
  #cardTemplate;
  #fxLayer;
  #hand;
  #audio;
  #stage;
  #tooltip;
  #toggleMute;

  /**
   * @param {{
   *   cardTemplate: HTMLTemplateElement;
   *   fxLayer: HTMLElement;
   *   hand: HTMLElement;
   *   audio: import("../audio/audio.js").GameAudio;
   *   stage: HTMLElement;
   *   tooltip: import("./card-tooltip.js").CardTooltip;
   *   toggleMute: () => void;
   * }} elements
   * @param {BattleControls} controls
   */
  constructor(elements, controls) {
    this.#controls = controls;
    this.#cardTemplate = elements.cardTemplate;
    this.#fxLayer = elements.fxLayer;
    this.#hand = elements.hand;
    this.#audio = elements.audio;
    this.#stage = elements.stage;
    this.#tooltip = elements.tooltip;
    this.#toggleMute = elements.toggleMute;
  }

  attach() {
    this.#hand.addEventListener("pointerdown", this.#onHandPointerDown);
    window.addEventListener("pointermove", this.#onPointerMove);
    window.addEventListener("pointerup", this.#onPointerUp);
    window.addEventListener("pointercancel", this.#onPointerCancel);
    window.addEventListener("blur", () => this.reset());
    window.addEventListener("resize", () => this.#tooltip.hide());
    document.addEventListener(
      "scroll",
      (event) => {
        if (
          !(event.target instanceof Element) ||
          !event.target.closest(".tooltip-card")
        ) {
          this.#tooltip.hide();
        }
      },
      true,
    );
    this.#stage.addEventListener("pointerdown", this.#onStagePointerDown);
    this.#stage.addEventListener("contextmenu", (event) => {
      if (
        event.target === this.#stage ||
        (event.target instanceof Element &&
          event.target.closest(".card, .lane-cell"))
      ) {
        event.preventDefault();
        this.reset();
      }
    });
    document.addEventListener("keydown", this.#onKeyDown);
    document.addEventListener("pointerdown", () => this.#audio.unlock(), {
      once: true,
    });
    const endTurn = $("#end-turn", this.#stage);
    const mute = $("#mute-toggle", this.#stage);
    endTurn.addEventListener("click", () => {
      if (!this.#gesture) {
        this.#controls.endTurn();
      }
    });
    mute.addEventListener("click", this.#toggleMute);
  }

  reset() {
    if (this.#gesture) {
      this.#gesture.drag?.remove();
      this.#gesture = undefined;
    }
    this.#clearSelection();
    this.#tooltip.hide();
    for (const element of $$(
      ".c-cost, .energy-cluster, .lane-cell",
      this.#stage,
    )) {
      for (const animation of element.getAnimations()) {
        animation.cancel();
      }
    }
  }

  #clearSelection() {
    this.#selected = undefined;
    for (const card of $$(".card.selected", this.#hand)) {
      card.classList.remove("selected");
    }
    this.#clearDropTarget();
    this.#clearPlayableCells();
  }

  /** @param {KeyboardEvent} event */
  #onKeyDown = (event) => {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      (event.target instanceof Element &&
        event.target.closest(
          "input, textarea, select, [contenteditable]:not([contenteditable='false'])",
        ))
    ) {
      return;
    }
    const key = event.key.toLowerCase();
    // 长按不算第二次操作，也别抢浏览器和输入框的快捷键。
    if (event.repeat) {
      if ([" ", "e", "enter", "m"].includes(key)) {
        event.preventDefault();
      }

      return;
    }
    if (key === "m") {
      this.#toggleMute();
    } else if (key === "escape") {
      event.preventDefault();
      this.reset();
    } else if (
      (key === "e" || key === " ") &&
      (!(event.target instanceof Element) || !event.target.closest("button, a"))
    ) {
      event.preventDefault();
      if (!this.#gesture && this.#controls.canAct()) {
        this.#controls.endTurn();
      }
    }
  };

  /** @param {PointerEvent} event */
  #onHandPointerDown = (event) => {
    if (event.button !== 0 || this.#gesture || !this.#controls.canAct()) {
      return;
    }
    const card =
      event.target instanceof Element ? event.target.closest(".card") : null;
    if (!(card instanceof HTMLElement)) {
      return;
    }
    this.#audio.unlock();
    this.#tooltip.hide();
    if (card.classList.contains("disabled")) {
      this.#audio.play("deny");
      this.#deny($(".c-cost", card), $(".energy-cluster", this.#stage));

      return;
    }
    try {
      this.#stage.setPointerCapture(event.pointerId);
    } catch {}
    this.#gesture = {
      card,
      index: Number(card.dataset.index),
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    this.#audio.play("select");
  };

  /** @param {PointerEvent} event */
  #onPointerMove = (event) => {
    const gesture = this.#gesture;
    if (gesture) {
      if (event.pointerId !== gesture.pointerId) {
        return;
      }
      this.#tooltip.hide();
      if (!gesture.drag) {
        const dx = event.clientX - gesture.x;
        const dy = event.clientY - gesture.y;
        if (
          Math.hypot(dx, dy) < 8 ||
          (event.pointerType === "touch" && Math.abs(dx) > Math.abs(dy))
        ) {
          return;
        }
        const cell = $('.lane-cell[data-side="player"]', this.#stage);
        const boardCard = createCard(
          this.#cardTemplate,
          this.#controls.getBattle().hand[gesture.index],
          "player",
        );
        gesture.drag = new DraggedCard(
          gesture.card,
          boardCard,
          cell.getBoundingClientRect(),
          this.#fxLayer,
        );
        this.#clearSelection();
        this.#showPlayableCells();
        this.#audio.play("select");
      }
      gesture.drag.move(event.clientX, event.clientY);
      this.#updateDropTarget(event.clientX, event.clientY);

      return;
    }

    if (this.#selected !== undefined) {
      this.#updateDropTarget(event.clientX, event.clientY);
      this.#tooltip.hide();

      return;
    }
    if (this.#controls.canAct() && event.pointerType !== "touch") {
      this.#tooltip.update(
        event.clientX,
        event.clientY,
        this.#controls.getBattle(),
      );
    }
  };

  /** @param {PointerEvent} event */
  #onPointerUp = (event) => {
    const gesture = this.#gesture;
    if (!gesture || event.pointerId !== gesture.pointerId) {
      return;
    }
    this.#gesture = undefined;
    if (!gesture.drag) {
      // 横划是在翻手牌，不要在松手时顺便选中一张。
      if (
        Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) >= 8
      ) {
        return;
      }
      this.#toggleSelect(gesture.index);

      return;
    }

    const cell = cellAt(event.clientX, event.clientY);
    this.#clearDropTarget();
    this.#clearPlayableCells();
    const played =
      cell?.dataset.side === "player" &&
      this.#play(gesture.index, cell, gesture.drag);
    if (!played) {
      gesture.drag.returnToHand();
      this.#audio.play("deny");
    }
  };

  /** @param {PointerEvent} event */
  #onPointerCancel = (event) => {
    const gesture = this.#gesture;
    if (!gesture || event.pointerId !== gesture.pointerId) {
      return;
    }
    gesture.drag?.remove();
    this.#gesture = undefined;
    this.#clearSelection();
  };

  /** @param {PointerEvent} event */
  #onStagePointerDown = (event) => {
    if (event.button === 2) {
      this.reset();

      return;
    }
    if (event.button !== 0 || !this.#controls.canAct() || this.#gesture) {
      return;
    }
    this.#audio.unlock();
    const cell = cellAt(event.clientX, event.clientY);
    if (this.#selected !== undefined) {
      if (
        cell?.dataset.side === "player" &&
        !this.#play(this.#selected, cell)
      ) {
        this.#audio.play("deny");

        return;
      }
      this.#clearSelection();

      return;
    }
    this.#tooltip.update(
      event.clientX,
      event.clientY,
      this.#controls.getBattle(),
    );
  };

  /** @param {number} index */
  #toggleSelect(index) {
    this.#selected = this.#selected === index ? undefined : index;
    for (const card of $$(".card", this.#hand)) {
      card.classList.toggle(
        "selected",
        Number(card.dataset.index) === this.#selected,
      );
    }
    this.#clearDropTarget();
    this.#clearPlayableCells();
    this.#audio.play("select");
    if (this.#selected !== undefined) {
      this.#showPlayableCells();
    }
  }

  /**
   * @param {number} index
   * @param {HTMLElement} cell
   * @param {DraggedCard} [drag]
   */
  #play(index, cell, drag) {
    const result = this.#controls.play(index, Number(cell.dataset.col), drag);
    if (result.ok === false) {
      if (result.reason === "afford") {
        this.#deny(
          $(".c-cost", this.#hand.children[index]),
          $(".energy-cluster", this.#stage),
        );
      } else if (result.reason === "occupied") {
        this.#deny(cell);
      }
    }

    return result.ok;
  }

  /**
   * 让不能点击的卡牌位闪一下
   *
   * @param {...HTMLElement} elements
   */
  #deny(...elements) {
    const distance = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 3;
    for (const element of elements) {
      for (const animation of element.getAnimations()) {
        animation.cancel();
      }
      element.animate(
        [
          {
            outline: "2px solid #f28d7d",
            outlineOffset: "2px",
            translate: `${-distance}px 0`,
          },
          {
            outline: "2px solid #f28d7d",
            outlineOffset: "2px",
            translate: `${distance}px 0`,
            offset: 0.3,
          },
          {
            outline: "2px solid transparent",
            outlineOffset: "2px",
            translate: "0px 0",
          },
        ],
        { duration: 320, easing: "ease-out" },
      );
    }
  }

  #showPlayableCells() {
    const battle = this.#controls.getBattle();
    for (const cell of $$('.lane-cell[data-side="player"]', this.#stage)) {
      cell.classList.toggle(
        "playable",
        !battle.playerBoard[Number(cell.dataset.col)],
      );
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  #updateDropTarget(x, y) {
    const cell = cellAt(x, y);
    this.#clearDropTarget();
    if (cell?.dataset.side === "player") {
      const occupied =
        this.#controls.getBattle().playerBoard[Number(cell.dataset.col)];
      cell.classList.add(occupied ? "invalid-target" : "target");
    }
  }

  #clearDropTarget() {
    for (const cell of $$(
      ".lane-cell.target, .lane-cell.invalid-target",
      this.#stage,
    )) {
      cell.classList.remove("target", "invalid-target");
    }
  }

  #clearPlayableCells() {
    for (const cell of $$(".lane-cell.playable", this.#stage)) {
      cell.classList.remove("playable");
    }
  }
}

/**
 * @param {number} x
 * @param {number} y
 */
function cellAt(x, y) {
  const hit = document.elementFromPoint(x, y);
  const cell = hit instanceof Element ? hit.closest(".lane-cell") : null;

  return cell instanceof HTMLElement ? cell : null;
}
