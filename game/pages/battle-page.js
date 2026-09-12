import {
  clearBattleState,
  recordBattleResult,
  saveBattleState,
} from "../session.js";
import { BattleView } from "../ui/battle-view.js";

/**
 * @typedef {{
 *   audio: import("../audio/audio.js").GameAudio;
 *   createBattle: (seed: number) => import("../game/battle.js").Battle;
 *   seed?: number;
 *   nodeId?: string;
 * }} BattlePageOptions
 */

export class BattlePage {
  #nextSeed;
  #createBattle;
  #nodeId;
  #ac = new AbortController();
  #battle;
  // 模型进入玩家回合时，动画可能还没播完，这个锁得单独留着。
  #busy = true;
  #view;

  /**
   * @param {HTMLElement} room
   * @param {BattlePageOptions} options
   */
  constructor(room, options) {
    this.#createBattle = options.createBattle;
    this.#nodeId = options.nodeId ?? "node-1";
    this.#nextSeed =
      options.seed ?? crypto.getRandomValues(new Uint32Array(1))[0];
    this.#battle = this.#nextBattle();
    this.#view = new BattleView(room, {
      audio: options.audio,
      controls: {
        getBattle: () => this.#battle,
        canAct: this.#canAct,
        play: this.#tryPlay,
        action: this.#tryAction,
        endTurn: this.#requestEndTurn,
        restart: this.#restart,
        skipBattle: this.#skipBattle,
      },
    });
    this.#view.startBattle(this.#battle);
  }

  async enter() {
    this.#view.attach();
    await this.#runResolution();
  }

  #canAct = () => !this.#busy && this.#battle.phase === "player";

  async #runResolution() {
    const signal = this.#ac.signal;
    this.#view.lock(this.#battle);
    while (!signal.aborted) {
      const event = this.#battle.advance();
      if (!event) {
        break;
      }
      await this.#view.playEvent(event, this.#battle, signal);
    }
    if (signal.aborted) {
      return;
    }

    this.#busy = false;
    this.#view.ready(this.#battle);

    if (this.#battle.winner) {
      this.#finishBattle(
        this.#battle.winner === "player"
          ? "victory"
          : this.#battle.winner === "enemy"
            ? "defeat"
            : "draw",
      );
    } else if (this.#battle.phase === "player") {
      saveBattleState(this.#nodeId, this.#battle.snapshot);
    }
  }

  #requestEndTurn = () => {
    if (!this.#canAct()) {
      return;
    }
    this.#battle.endTurn();
    this.#busy = true;
    this.#runResolution();
  };

  #skipBattle = () => {
    if (this.#busy) {
      return;
    }
    if (this.#nodeId === "node-5") {
      this.#finishBattle("peaceful");

      return;
    }
    saveBattleState(this.#nodeId, this.#battle.snapshot);
    this.#ac.abort();
    location.href = "/game/map.html";
  };

  /**
   * @param {number} index
   * @param {number} col
   * @param {import("../ui/card-motion.js").DraggedCard} [drag]
   * @returns {import("../types.js").PlayResult}
   */
  #tryPlay = (index, col, drag, target) => {
    if (this.#busy) {
      return { ok: false, reason: "phase" };
    }
    const result = this.#battle.playCard(index, col, target);
    if (result.ok === false) {
      return result;
    }

    this.#busy = true;
    this.#deploy(index, col, result.unit, this.#ac.signal, drag);

    return result;
  };

  #tryAction = (action, options) => {
    if (!this.#canAct()) {
      return { ok: false, reason: "phase" };
    }
    const result = this.#battle.act(action, options);
    if (result.ok === false) {
      return result;
    }
    this.#busy = true;
    this.#runResolution();

    return result;
  };

  /**
   * @param {number} index
   * @param {number} col
   * @param {import("../types.js").DisplayUnit} unit
   * @param {AbortSignal} signal
   * @param {import("../ui/card-motion.js").DraggedCard} [drag]
   */
  async #deploy(index, col, unit, signal, drag) {
    await this.#view.deploy(this.#battle, index, col, unit, signal, drag);
    if (!signal.aborted) {
      await this.#runResolution();
    }
  }

  #restart = () => {
    this.#ac.abort();
    this.#ac = new AbortController();
    this.#busy = true;
    clearBattleState();
    this.#battle = this.#nextBattle();
    this.#view.startBattle(this.#battle);
    this.#runResolution();
  };

  #finishBattle(result) {
    this.#ac.abort();
    this.#busy = true;
    recordBattleResult(this.#nodeId, result, {
      health: this.#battle.player.health,
      growth: this.#battle.growth,
    });
    location.href = `/game/settlement.html?node=${encodeURIComponent(this.#nodeId)}`;
  }

  #nextBattle() {
    const seed = this.#nextSeed;
    this.#nextSeed = (seed + 0x9e_37_79_b9) >>> 0;

    return this.#createBattle(seed);
  }
}
