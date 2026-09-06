// TODO: 整个文件都需要重构。目前只是一个纯战斗demo，之后要跟随不同关卡和剧情变更
import { BattleView } from "../ui/battle-view.js";

/**
 * @typedef {{
 *   audio: import("../audio/audio.js").GameAudio;
 *   createBattle: (seed: number) => import("../game/battle.js").Battle;
 *   seed?: number;
 * }} BattlePageOptions
 */

export class BattlePage {
  #nextSeed;
  #createBattle;
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
    this.#nextSeed =
      options.seed ?? crypto.getRandomValues(new Uint32Array(1))[0];
    this.#battle = this.#nextBattle();
    this.#view = new BattleView(room, {
      audio: options.audio,
      controls: {
        getBattle: () => this.#battle,
        canAct: this.#canAct,
        play: this.#tryPlay,
        endTurn: this.#requestEndTurn,
        restart: this.#restart,
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
  }

  #requestEndTurn = () => {
    if (!this.#canAct()) {
      return;
    }
    this.#battle.endTurn();
    this.#busy = true;
    this.#runResolution();
  };

  /**
   * @param {number} index
   * @param {number} col
   * @param {import("../ui/card-motion.js").DraggedCard} [drag]
   * @returns {import("../types.js").PlayResult}
   */
  #tryPlay = (index, col, drag) => {
    if (this.#busy) {
      return { ok: false, reason: "phase" };
    }
    const result = this.#battle.playCard(index, col);
    if (result.ok === false) {
      return result;
    }

    this.#busy = true;
    this.#deploy(index, col, this.#ac.signal, drag);

    return result;
  };

  /**
   * @param {number} index
   * @param {number} col
   * @param {AbortSignal} signal
   * @param {import("../ui/card-motion.js").DraggedCard} [drag]
   */
  async #deploy(index, col, signal, drag) {
    await this.#view.deploy(this.#battle, index, col, signal, drag);
    if (!signal.aborted) {
      await this.#runResolution();
    }
  }

  #restart = () => {
    this.#ac.abort();
    this.#ac = new AbortController();
    this.#busy = true;
    this.#battle = this.#nextBattle();
    this.#view.startBattle(this.#battle);
    this.#runResolution();
  };

  #nextBattle() {
    const seed = this.#nextSeed;
    this.#nextSeed = (seed + 0x9e_37_79_b9) >>> 0;

    return this.#createBattle(seed);
  }
}
