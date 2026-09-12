import { $, $$ } from "../../js/dom.js";
import { LANE_COUNT } from "../game/rules.js";
import { DraggedCard } from "./card-motion.js";
import { createCard } from "./card-view.js";
import { el } from "./utils.js";

/**
 * @typedef {{
 *   getBattle: () => import("../game/battle.js").Battle;
 *   canAct: () => boolean;
 *   play: (index: number, col: number, drag?: DraggedCard, target?: import("../types.js").CardTarget) => import("../types.js").PlayResult;
 *   action: (action: string, options?: object) => import("../types.js").PlayResult;
 *   endTurn: () => void;
 *   restart: () => void;
 *   skipBattle: () => void;
 * }} BattleControls
 * @typedef {{
 *   card: HTMLElement;
 *   index: number;
 *   pointerId: number;
 *   x: number;
 *   y: number;
 *   drag?: DraggedCard;
 * }} CardGesture
 * @typedef {{ index: number; col?: number; action?: string; from?: number; targets: import("../types.js").CardTarget[] }} PendingTarget
 */

export class BattleInput {
  /** @type {CardGesture | undefined} */
  #gesture;
  /** @type {number | undefined} */
  #selected;
  /** @type {PendingTarget | undefined} */
  #pendingTarget;
  /** @type {number | undefined} */
  #selectedUnit;
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
    const skip = $("#skip-battle", this.#stage);
    endTurn.addEventListener("click", () => {
      if (!this.#gesture) {
        this.#controls.endTurn();
      }
    });
    skip.addEventListener("click", () => {
      this.#controls.skipBattle();
    });
    mute.addEventListener("click", this.#toggleMute);
    $("#recruit", this.#stage).addEventListener("click", () =>
      this.#act("recruit"),
    );
    for (const button of $$("[data-direction]", this.#stage)) {
      button.addEventListener("click", () =>
        this.#act("direction", { direction: button.dataset.direction }),
      );
    }
    $("#issue-order", this.#stage).addEventListener("click", () =>
      this.#beginAction("order"),
    );
    for (const button of $$("[data-move]", this.#stage)) {
      button.addEventListener("click", () => {
        if (this.#selectedUnit !== undefined) {
          this.#act("move", {
            from: this.#selectedUnit,
            to: this.#selectedUnit + Number(button.dataset.move),
          });
        }
      });
    }
    $("#invoke-oath", this.#stage).addEventListener("click", () => {
      const battle = this.#controls.getBattle();
      if (battle.oath === "fate") {
        const targets = battle.enemyIntents
          .filter((intent) => Number.isInteger(intent.col))
          .map((intent) => ({ side: "enemy", col: intent.col }));
        if (new Set(targets.map((target) => target.col)).size < 2) {
          this.#reject("当前没有两个可交换的敌方意图。");

          return;
        }
        this.#selectTargets(
          { index: -1, action: "oath", targets },
          "选择要交换的第一个增援意图",
        );
      } else {
        this.#act("oath");
      }
    });
  }

  sync() {
    const battle = this.#controls.getBattle();
    const card =
      this.#selected === undefined ? undefined : battle.hand[this.#selected];
    const order = $("#issue-order", this.#stage);
    const choosingTarget = ["order", "swap"].includes(
      this.#pendingTarget?.action,
    );
    const canAct = this.#controls.canAct();
    order.disabled =
      !canAct ||
      battle.commandUsed ||
      !card?.command ||
      Boolean(card.marks?.sealed);
    order.textContent = battle.commandUsed
      ? "军令 · 本轮已用"
      : canAct
        ? choosingTarget
          ? "军令 · 选择目标"
          : card?.marks?.sealed
            ? "军令 · 已封令"
            : card?.command
              ? "发动军令"
              : "军令 · 选择手牌"
        : "军令 · 结算中";
    order.title = battle.commandUsed
      ? "本轮军令已使用，下一轮恢复。"
      : card?.marks?.sealed
        ? "这张牌已封令，不能发动军令。"
        : "弃掉选中的单位牌，发动其军令；不消耗圣力，每轮共一次。";
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
    this.#pendingTarget = undefined;
    this.#selectedUnit = undefined;
    $("#target-prompt", this.#stage).hidden = true;
    $("#unit-actions", this.#stage).hidden = true;
    $("#action-choices", this.#stage).replaceChildren();
    this.#stage.classList.remove("choosing-target");
    for (const card of $$(".card.selected", this.#stage)) {
      card.classList.remove("selected");
    }
    this.#clearDropTarget();
    this.#clearPlayableCells();
    this.sync();
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
    if (this.#pendingTarget) {
      this.#clearSelection();
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
        if (this.#controls.getBattle().hand[gesture.index].type !== "unit") {
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

    if (this.#selected !== undefined || this.#pendingTarget) {
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
    if (
      event.target instanceof Element &&
      event.target.closest(".command-panel, .hand")
    ) {
      return;
    }
    const cell = cellAt(event.clientX, event.clientY);
    if (this.#pendingTarget) {
      const pending = this.#pendingTarget;
      const target = pending.targets.find(
        (candidate) =>
          candidate.side === cell?.dataset.side &&
          candidate.col === Number(cell.dataset.col),
      );
      if (target) {
        if (pending.action) {
          if (pending.action === "oath" || pending.action === "swap") {
            if (pending.from === undefined) {
              pending.from = target.col;
              this.#prompt("再选择另一条战线完成交换 · Esc 取消");
            } else if (pending.from === target.col) {
              this.#prompt("请选择另一条高亮战线完成交换 · Esc 取消");
              this.#deny(cell);
            } else {
              this.#act(pending.action === "swap" ? "order" : "oath", {
                index: pending.index,
                target: { side: "player", col: pending.from },
                from: pending.from,
                to: target.col,
              });
            }
          } else {
            this.#act(pending.action, { index: pending.index, target });
          }
        } else {
          const result = this.#controls.play(
            pending.index,
            pending.col,
            undefined,
            target,
          );
          if (result.ok === false) {
            this.#reject(
              result.reason === "afford"
                ? "圣力不足，无法部署这张牌。"
                : "当前目标不可用，请重新选择手牌。",
            );
          }
        }
      } else if (cell) {
        this.#audio.play("deny");
        this.#deny(cell);
        this.#prompt("请选择高亮的有效目标 · Esc 取消");
      }

      return;
    }
    if (this.#selected !== undefined) {
      if (this.#controls.getBattle().hand[this.#selected].type !== "unit") {
        return;
      }
      if (
        cell?.dataset.side === "player" &&
        !this.#play(this.#selected, cell)
      ) {
        this.#audio.play("deny");

        return;
      }
      if (!this.#pendingTarget) {
        this.#clearSelection();
      }

      return;
    }
    if (cell?.dataset.side === "player") {
      const col = Number(cell.dataset.col);
      const unit = this.#controls.getBattle().playerBoard[col];
      if (unit) {
        this.#clearSelection();
        this.#selectedUnit = col;
        $(".card", cell).classList.add("selected");
        $("#unit-actions", this.#stage).hidden = false;
        const battle = this.#controls.getBattle();
        for (const button of $$("[data-move]", this.#stage)) {
          const to = col + Number(button.dataset.move);
          button.disabled =
            battle.moved ||
            battle.energy < 1 ||
            to < 0 ||
            to >= LANE_COUNT ||
            Boolean(battle.playerBoard[to]);
        }
        this.#prompt(
          `${unit.def.name}：可支付 1 圣力移动至相邻空列，每轮一次。`,
        );
      }
    }
    this.#tooltip.update(
      event.clientX,
      event.clientY,
      this.#controls.getBattle(),
    );
  };

  /** @param {number} index */
  #toggleSelect(index) {
    const selected = this.#selected === index ? undefined : index;
    this.#clearSelection();
    this.#selected = selected;
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
      const battle = this.#controls.getBattle();
      const def = battle.hand[this.#selected];
      if (def.type !== "unit") {
        this.#beginAction("cast");

        return;
      }
      this.#showPlayableCells();
      this.sync();
      this.#prompt(
        `${def.name}：点击己方战线部署或替换。军令：${def.command.text}`,
      );
    }
  }

  /** @param {"order" | "cast"} mode */
  #beginAction(mode) {
    if (this.#selected === undefined || !this.#controls.canAct()) {
      return;
    }
    const index = this.#selected;
    const battle = this.#controls.getBattle();
    const def = battle.hand[index];
    if (mode === "cast" && battle.cardCost(def) > battle.energy) {
      this.#deny(
        $(".c-cost", this.#hand.children[index]),
        $(".energy-cluster", this.#stage),
      );
      this.#reject(
        `${def.name}需要 ${battle.cardCost(def)} 圣力，当前只有 ${battle.energy} 点。`,
      );

      return;
    }
    if (mode === "order" && (battle.commandUsed || def.marks?.sealed)) {
      this.#reject(
        def.marks?.sealed
          ? "这张牌被封令，当前不能发动军令。"
          : "本轮军令已使用。",
      );

      return;
    }
    const selection = battle.getActionChoices(index, mode);
    if (selection.choices.length > 0) {
      const choices = [...selection.choices];
      const container = $("#action-choices", this.#stage);
      this.#prompt(
        selection.kind === "foresee"
          ? `${def.name}：按希望抽到的先后顺序依次选牌，第一张置于牌库顶 · Esc 取消`
          : `${def.name}：选择要处理的一张牌 · Esc 取消`,
      );
      container.replaceChildren();
      const ordering = [];
      for (const choice of choices) {
        const button = el("button", "btn", choice.name);
        button.type = "button";
        button.addEventListener("click", () => {
          if (selection.kind === "foresee") {
            ordering.push(choice.index);
            button.disabled = true;
            button.textContent = `${ordering.length}. ${choice.name}`;
            if (ordering.length === choices.length) {
              this.#act(mode, { index, cards: ordering });
            }
          } else {
            this.#act(mode, { index, cardIndex: choice.index });
          }
        });
        container.append(button);
      }

      return;
    }
    const targets = battle.getActionTargets(index, mode);
    if (targets.length > 0) {
      const swap = mode === "order" && def.command?.kind === "swap";
      if (swap && targets.length < 2) {
        this.#reject("交换军令需要两名已在场的己方单位。");

        return;
      }
      this.#selectTargets(
        { index, action: swap ? "swap" : mode, targets },
        swap
          ? `${def.name}：选择要交换的第一名己方单位 · Esc 取消`
          : `${def.name}：选择高亮的战场目标 · Esc 取消`,
      );

      return;
    }
    this.#act(mode, { index });
  }

  /** @param {PendingTarget} pending @param {string} text */
  #selectTargets(pending, text) {
    this.#clearSelection();
    this.#pendingTarget = pending;
    if (pending.index >= 0) {
      this.#hand.children[pending.index].classList.add("selected");
    }
    this.#stage.classList.add("choosing-target");
    this.#prompt(text);
    for (const target of pending.targets) {
      $(
        `.lane-cell[data-side="${target.side}"][data-col="${target.col}"]`,
        this.#stage,
      ).classList.add("effect-target");
    }
    this.sync();
  }

  /** @param {string} text */
  #prompt(text) {
    const prompt = $("#target-prompt", this.#stage);
    prompt.textContent = text;
    prompt.hidden = false;
  }

  /** @param {string} action @param {object} [options] */
  #act(action, options = {}) {
    const result = this.#controls.action(action, options);
    if (!result.ok) {
      const reasons = {
        afford: "资源不足，无法支付本次行动。",
        used: "本轮已使用这项行动。",
        target: "当前没有可用目标，请调整场面或牌堆后重试。",
        empty: "目前没有可操作的牌，请稍后重试。",
        phase: "请等待当前行动结算。",
      };
      this.#reject(reasons[result.reason] ?? "当前无法执行这项行动。");
    }

    return result.ok;
  }

  /** @param {string} text */
  #reject(text) {
    this.#clearSelection();
    this.#tooltip.hide();
    this.#audio.play("deny");
    this.#prompt(text);
  }

  /**
   * @param {number} index
   * @param {HTMLElement} cell
   * @param {DraggedCard} [drag]
   */
  #play(index, cell, drag) {
    const col = Number(cell.dataset.col);
    const battle = this.#controls.getBattle();
    if (
      battle.canDeploy(index, col) &&
      battle.cardCost(battle.hand[index]) <= battle.energy
    ) {
      const targets = battle.getPlayTargets(index, col);
      if (targets.length > 0) {
        drag?.returnToHand();
        this.#clearSelection();
        this.#selected = index;
        this.#pendingTarget = { index, col, targets };
        this.#hand.children[index].classList.add("selected");
        this.#stage.classList.add("choosing-target");
        const prompt = $("#target-prompt", this.#stage);
        const friendly = targets[0].side === "player";
        prompt.textContent = `${battle.hand[index].name}：选择一个${friendly ? "友方" : "敌方"}目标 · Esc 取消`;
        prompt.hidden = false;
        for (const target of targets) {
          $(
            `.lane-cell[data-side="${target.side}"][data-col="${target.col}"]`,
            this.#stage,
          ).classList.add("effect-target");
        }

        return true;
      }
    }
    const result = this.#controls.play(index, col, drag);
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
    const index = this.#selected ?? this.#gesture?.index;
    for (const cell of $$('.lane-cell[data-side="player"]', this.#stage)) {
      const col = Number(cell.dataset.col);
      const playable = index !== undefined && battle.canDeploy(index, col);
      cell.classList.toggle("playable", playable);
      cell.classList.toggle(
        "replacement-target",
        playable && Boolean(battle.playerBoard[col]),
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
    if (this.#pendingTarget) {
      if (
        cell &&
        this.#pendingTarget.targets.some(
          (target) =>
            target.side === cell.dataset.side &&
            target.col === Number(cell.dataset.col),
        )
      ) {
        cell.classList.add("target");
      }

      return;
    }
    if (cell?.dataset.side === "player") {
      const index = this.#selected ?? this.#gesture?.index;
      if (
        index !== undefined &&
        this.#controls.getBattle().hand[index].type !== "unit"
      ) {
        return;
      }
      const allowed =
        index !== undefined &&
        this.#controls.getBattle().canDeploy(index, Number(cell.dataset.col));
      cell.classList.add(allowed ? "target" : "invalid-target");
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
    for (const cell of $$(
      ".lane-cell.playable, .lane-cell.effect-target, .lane-cell.replacement-target",
      this.#stage,
    )) {
      cell.classList.remove("playable", "effect-target", "replacement-target");
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
