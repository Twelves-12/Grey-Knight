// TODO: 整个文件都需要重构。目前只是一个纯战斗demo，之后要跟随不同关卡和剧情变更
import { Battle } from "../game/battle.js";
import { BattleView } from "../ui/battle-view.js";

/**
 * @typedef {import("../types.js").EncounterFactory} EncounterFactory
 * @typedef {import("../types.js").PlayerSetup} PlayerSetup
 * @typedef {{
 *   audio: import("../audio/audio.js").GameAudio;
 *   createEncounter: EncounterFactory;
 *   player: PlayerSetup;
 *   seed?: number;
 * }} BattlePageOptions
 */

export class BattlePage {
  #nextSeed;
  #createEncounter;
  #player;
  #ac = new AbortController();
  #battle;
  // 模型进入玩家回合时，动画可能还没播完，这个锁得单独留着。
  #busy = true;
  /** @type {Set<string>} */
  #seenAbilities = new Set();
  #sawIntentTip = false;
  #view;

  /**
   * @param {HTMLElement} room
   * @param {BattlePageOptions} options
   */
  constructor(room, options) {
    this.#createEncounter = options.createEncounter;
    this.#player = options.player;
    this.#nextSeed =
      options.seed ?? crypto.getRandomValues(new Uint32Array(1))[0];
    this.#battle = this.#createBattle();
    this.#view = new BattleView(room, {
      player: this.#player,
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
    const opening = this.#battle.phase === "intro";
    const announceTurn = this.#battle.phase !== "player";
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
    if (this.#battle.phase !== "player" || !announceTurn) {
      return;
    }
    if (opening) {
      this.#view.say("点击手牌选中，或按住拖到空列部署", 6);

      return;
    }

    const intents = this.#battle.enemyIntents;
    const ability = intents.find(
      (intent) =>
        intent.kind === "ability" && !this.#seenAbilities.has(intent.name),
    );
    const summon = intents.find((intent) => intent.kind === "summon");
    if (ability) {
      this.#seenAbilities.add(ability.name);
      this.#view.say(ability.text, 5);
    } else if (summon && !this.#sawIntentTip) {
      this.#sawIntentTip = true;
      this.#view.say(
        `敌方意图：回合结束时第 ${summon.col + 1} 列将降临「${summon.def.name}」——提前同列布防可挡下它`,
        5,
      );
    } else {
      this.#view.say("你的回合——继续部署，或结束回合", 3);
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

  /**
   * @param {number} index
   * @param {number} col
   * @param {import("../ui/card-motion.js").DraggedCard} [drag]
   */
  #tryPlay = (index, col, drag) => {
    if (this.#busy) {
      return false;
    }
    const result = this.#battle.playCard(index, col);
    if (result.ok === false) {
      this.#view.say(
        result.reason === "afford"
          ? "圣力不足，无法部署"
          : result.reason === "occupied"
            ? "这一列已经站着单位了"
            : "现在不能出牌",
        1.8,
      );

      return false;
    }

    this.#busy = true;
    this.#deploy(index, col, this.#ac.signal, drag);

    return true;
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
    this.#seenAbilities.clear();
    this.#sawIntentTip = false;
    this.#battle = this.#createBattle();
    this.#view.startBattle(this.#battle);
    this.#runResolution();
  };

  #createBattle() {
    const seed = this.#nextSeed;
    this.#nextSeed = (seed + 0x9e_37_79_b9) >>> 0;

    return new Battle(seed, this.#player, this.#createEncounter);
  }
}
