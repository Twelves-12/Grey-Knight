import { $, $$ } from "../../js/dom.js";
import { DraggedCard } from "./card-motion.js";
import { createCard } from "./card-view.js";

/**
 * @typedef {{
 *   getBattle: () => import("../game/battle.js").Battle;
 *   canAct: () => boolean;
 *   play: (index: number, col: number, drag?: DraggedCard) => boolean;
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
  #notify;
  #audio;
  #stage;
  #tooltip;
  #toggleMute;

  /**
   * @param {{
   *   cardTemplate: HTMLTemplateElement;
   *   fxLayer: HTMLElement;
   *   hand: HTMLElement;
   *   notify: (text: string, seconds?: number) => void;
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
    this.#notify = elements.notify;
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
    this.#stage.addEventListener("pointerdown", this.#onStagePointerDown);
    document.addEventListener("keydown", this.#onKeyDown);
    document.addEventListener("pointerdown", () => this.#audio.unlock(), {
      once: true,
    });
    const endTurn = $("#end-turn", this.#stage);
    const mute = $("#mute-toggle", this.#stage);
    endTurn.addEventListener("click", this.#controls.endTurn);
    mute.addEventListener("click", this.#toggleMute);
  }

  reset() {
    if (this.#gesture) {
      this.#gesture.drag?.remove();
      this.#gesture = undefined;
    }
    this.#clearSelection();
    this.#tooltip.hide();
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
    const key = event.key.toLowerCase();
    if (key === "m") {
      this.#toggleMute();
    } else if (key === "r") {
      this.#controls.restart();
    } else if (key === "escape") {
      this.#clearSelection();
    } else if ((key === "e" || key === " ") && this.#controls.canAct()) {
      event.preventDefault();
      this.#controls.endTurn();
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
    if (card.classList.contains("disabled")) {
      this.#audio.play("deny");
      this.#notify("圣力不足，无法部署", 1.8);

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
        if (
          Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 8
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
        this.#audio.play("select");
      }
      gesture.drag.move(event.clientX, event.clientY);
      this.#updateDropTarget(event.clientX, event.clientY);

      return;
    }

    if (this.#selected !== undefined) {
      this.#updateDropTarget(event.clientX, event.clientY);
    }
    this.#tooltip.update(
      event.clientX,
      event.clientY,
      this.#controls.getBattle(),
    );
  };

  /** @param {PointerEvent} event */
  #onPointerUp = (event) => {
    const gesture = this.#gesture;
    if (!gesture || event.pointerId !== gesture.pointerId) {
      return;
    }
    this.#gesture = undefined;
    if (!gesture.drag) {
      this.#toggleSelect(gesture.index);

      return;
    }

    const cell = cellAt(event.clientX, event.clientY);
    this.#clearDropTarget();
    const played =
      cell?.dataset.side === "player" &&
      this.#controls.play(
        gesture.index,
        Number(cell.dataset.col),
        gesture.drag,
      );
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
    this.#clearDropTarget();
    this.#audio.play("deny");
  };

  /** @param {PointerEvent} event */
  #onStagePointerDown = (event) => {
    if (!this.#controls.canAct() || this.#gesture) {
      return;
    }
    this.#audio.unlock();
    const cell = cellAt(event.clientX, event.clientY);
    if (
      this.#selected !== undefined &&
      cell?.dataset.side === "player" &&
      !this.#controls.play(this.#selected, Number(cell.dataset.col))
    ) {
      this.#audio.play("deny");
    }
    this.#clearSelection();
  };

  /** @param {number} index */
  #toggleSelect(index) {
    const battle = this.#controls.getBattle();
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
      for (const cell of $$('.lane-cell[data-side="player"]', this.#stage)) {
        const col = Number(cell.dataset.col);
        cell.classList.toggle("playable", !battle.playerBoard[col]);
      }
      this.#notify("点击发光空列部署，或直接按住拖出", 2.6);
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  #updateDropTarget(x, y) {
    const cell = cellAt(x, y);
    this.#clearDropTarget();
    if (
      cell?.dataset.side === "player" &&
      !this.#controls.getBattle().playerBoard[Number(cell.dataset.col)]
    ) {
      cell.classList.add("target");
    }
  }

  #clearDropTarget() {
    for (const cell of $$(".lane-cell.target", this.#stage)) {
      cell.classList.remove("target");
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
