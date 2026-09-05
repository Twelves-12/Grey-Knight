import { Battle } from "../game/battle.js";
import { BattleView } from "../ui/battle-view.js";
import { wait } from "../ui/utils.js";

/**
 * @typedef {import("../types.js").EncounterFactory} EncounterFactory
 * @typedef {import("../types.js").PlayerSetup} PlayerSetup
 * @typedef {import("../types.js").ResultKind} ResultKind
 * @typedef {{
 *   audio: import("../audio/audio.js").GameAudio;
 *   createEncounter: EncounterFactory;
 *   onVictory: (health: number) => void;
 *   player: PlayerSetup;
 *   seed?: number;
 * }} BattlePageOptions
 */

/** @type {Record<"defeat" | "draw", import("../types.js").ResultContent>} */
const ENDINGS = {
  defeat: {
    accent: "defeat",
    flavor: ["圣焰熄灭，阵地失守。", "灰烬之中，会有人接过这把剑。"],
    title: "骑士陨落",
  },
  draw: {
    accent: "draw",
    flavor: ["火光与影子同时归于寂静。", "仿佛谁也没赢。"],
    title: "同归于寂",
  },
};

export class BattlePage {
  #audio;
  #nextSeed;
  #createEncounter;
  #player;
  #onVictory;
  #ac = new AbortController();
  #battle;
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
    this.#audio = options.audio;
    this.#createEncounter = options.createEncounter;
    this.#player = options.player;
    this.#onVictory = options.onVictory;
    this.#nextSeed =
      options.seed ?? crypto.getRandomValues(new Uint32Array(1))[0];
    this.#battle = this.#createBattle();
    this.#view = new BattleView(room, {
      player: this.#player,
      audio: this.#audio,
      controls: {
        getBattle: () => this.#battle,
        canAct: this.#canAct,
        play: (index, col, drag) => this.#tryPlay(index, col, drag),
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

  destroy() {
    this.#ac.abort();
    this.#view.destroy();
  }

  #canAct = () => !this.#busy && this.#battle.phase === "player";

  /**
   * @param {ResultKind} kind
   * @param {AbortSignal} signal
   */
  async #finishBattle(kind, signal) {
    await wait(kind === "victory" ? 500 : 700, signal);
    if (signal.aborted) {
      return;
    }

    const stats = this.#battle.stats;
    const content =
      kind === "victory"
        ? { accent: kind, ...this.#battle.encounter.victory }
        : ENDINGS[kind];
    const result = {
      ...content,
      stats: {
        damageDealt: stats.heroDamageDealt,
        damageTaken: stats.heroDamageTaken,
        kills: stats.enemyUnitsSlain,
        played: stats.cardsPlayed,
        rounds: this.#battle.round,
      },
    };
    if (kind === "victory") {
      this.#onVictory(this.#battle.playerHealth);
      this.#audio.play("victory");
    } else if (kind === "defeat") {
      this.#audio.play("defeat");
    } else {
      this.#audio.play("doom");
    }
    this.#view.showResult(this.#battle, result);
  }

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
      switch (event.kind) {
        case "victory":
        case "defeat":
        case "draw": {
          await this.#finishBattle(event.kind, signal);

          break;
        }
        default: {
          await this.#view.playEvent(event, this.#battle, signal);
        }
      }
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
    if (ability?.kind === "ability") {
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
  #tryPlay(index, col, drag) {
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
  }

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
