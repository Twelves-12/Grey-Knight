import { setCardHp } from "./card-view.js";
import {
  animateDeath,
  animateHeroRecoil,
  animateRecoil,
  animateStrike,
} from "./combat-motion.js";
import {
  FX_COLORS,
  burst,
  cinders,
  floatText,
  heroTrail,
  impact,
  redFlash,
} from "./fx.js";
import { wait } from "./utils.js";

/**
 * @typedef {import("../types.js").BattleCells} BattleCells
 * @typedef {import("../types.js").HeroesBySide} AnimatedHeroes
 */

export class BattleAnimations {
  #cells;
  #fxLayer;
  #heroes;
  #overlayRoot;
  #audio;
  #stage;

  /**
   * @param {{
   *   cells: BattleCells;
   *   fxLayer: HTMLElement;
   *   heroes: AnimatedHeroes;
   *   overlayRoot: HTMLElement;
   *   audio: import("../audio/audio.js").GameAudio;
   *   stage: HTMLElement;
   * }} elements
   */
  constructor(elements) {
    this.#cells = elements.cells;
    this.#fxLayer = elements.fxLayer;
    this.#heroes = elements.heroes;
    this.#overlayRoot = elements.overlayRoot;
    this.#audio = elements.audio;
    this.#stage = elements.stage;
  }

  /**
   * @param {number} col
   * @param {AbortSignal} signal
   */
  async summon(col, signal) {
    const cell = this.#cells.enemy[col];
    cell.classList.add("summoning");
    const center = cellCenter(cell);
    this.#audio.play("summon");
    burst(this.#fxLayer, center[0], center[1], 24, [
      "#5a3f8f",
      "#33205c",
      "#8a6fd0",
      "#d1b8ff",
    ]);
    await wait(420, signal);
    cell.classList.remove("summoning");
  }

  /**
   * @param {"player" | "enemy"} target
   * @param {number} amount
   * @param {AbortSignal} signal
   */
  async heal(target, amount, signal) {
    const hero = this.#heroes[target].root;
    const rect = hero.getBoundingClientRect();
    const x = rect.left + rect.width * 0.7;
    const y = rect.top + 14;
    this.#audio.play("heal");
    hero.animate(
      [
        { filter: "brightness(1)", transform: "scale(1)" },
        {
          filter: "brightness(1.45) saturate(1.2)",
          offset: 0.35,
          transform: "scale(1.025)",
        },
        { filter: "brightness(1)", transform: "scale(1)" },
      ],
      { duration: 420, easing: "ease-out" },
    );
    burst(this.#fxLayer, x, y, 14, ["#d5ffe9", "#78d7a5", "#3b8d68"]);
    floatText(this.#fxLayer, x, y, `+${amount}`, {
      color: FX_COLORS.heal,
      size: 20,
    });
    await wait(300, signal);
  }

  /**
   * @param {import("../types.js").FightEvent} event
   * @param {AbortSignal} signal
   */
  async fight(event, signal) {
    const { col, died, hits } = event;
    const laneCells = [this.#cells.enemy[col], this.#cells.player[col]];
    this.#stage.classList.add("combat-resolving");
    for (const cell of laneCells) {
      cell.classList.add("resolving");
    }
    await wait(80, signal);

    const both = hits.length >= 2;
    for (const hit of hits) {
      if (signal.aborted) {
        break;
      }
      const attackerRow = hit.side;
      const targetRow = hit.side === "player" ? "enemy" : "player";
      const card = this.#cells[attackerRow][col].querySelector(".card");
      const targetCard = this.#cells[targetRow][col].querySelector(".card");
      const center = cellCenter(this.#cells[targetRow][col]);
      if (card && targetCard) {
        animateStrike(card, targetCard, hit.side);
      }
      await wait(192, signal);
      if (signal.aborted) {
        break;
      }
      if (targetCard instanceof HTMLElement) {
        setCardHp(targetCard, hit.targetHp, true);
        animateRecoil(targetCard, hit.side);
      }
      this.#audio.play(hit.lethal ? "kill" : "fight");
      impact(this.#fxLayer, center[0], center[1], {
        lethal: hit.lethal,
        shadow: hit.side === "enemy",
      });
      floatText(
        this.#fxLayer,
        center[0] + (Math.random() * 24 - 12),
        center[1] - 30,
        `-${hit.amount}`,
        {
          color: hit.lethal ? FX_COLORS.kill : FX_COLORS.hurt,
          size: hit.lethal ? 23 : 17,
        },
      );
      burst(
        this.#fxLayer,
        center[0],
        center[1] - (hit.lethal ? 0 : 10),
        hit.lethal ? 12 : 5,
        hit.lethal ? ["#ffe9b0", "#ffd9a0", "#c0453a"] : ["#ffe9b0", "#e0a95c"],
      );
      await wait(both ? 160 : 130, signal);
    }

    if (!signal.aborted) {
      for (const side of died) {
        const cell = this.#cells[side][col];
        const dying = cell.querySelector(".card");
        const center = cellCenter(cell);
        if (dying instanceof HTMLElement) {
          animateDeath(dying);
        }
        await wait(90, signal);
        if (signal.aborted) {
          break;
        }
        cinders(this.#fxLayer, center[0], center[1], side === "enemy");
      }
      if (!signal.aborted && died.length > 0) {
        await wait(190, signal);
      }
    }

    for (const cell of laneCells) {
      cell.classList.remove("resolving");
    }
    this.#stage.classList.remove("combat-resolving");
  }

  /**
   * @param {import("../types.js").HeroHitEvent} event
   * @param {AbortSignal} signal
   * @param {() => void} onImpact
   */
  async heroHit(event, signal, onImpact) {
    const { amount, origin, target } = event;
    const ability = origin.kind === "ability";
    const col = ability ? undefined : origin.col;
    const { root: hero, fill } = this.#heroes[target];
    const track = fill.parentElement;
    const side = target === "enemy" ? "player" : "enemy";
    const attacker =
      col === undefined
        ? undefined
        : this.#cells[side][col].querySelector(".card");
    if (attacker) {
      attacker.animate(
        [
          { transform: "translateY(0) scale(1)", filter: "brightness(1)" },
          {
            transform: `translateY(${side === "player" ? 6 : -6}px) scale(1.06)`,
            filter: "brightness(1.5)",
          },
          { transform: "translateY(0) scale(1)", filter: "brightness(1)" },
        ],
        { duration: 330, easing: "ease-out" },
      );
    }
    await wait(110, signal);
    if (signal.aborted) {
      return;
    }
    if (ability) {
      redFlash(this.#overlayRoot);
    }
    const trackRect = track.getBoundingClientRect();
    const fillRect = fill.getBoundingClientRect();
    const impactPoint = [
      Math.max(trackRect.left + 4, fillRect.right - 2),
      trackRect.top + trackRect.height / 2,
    ];
    await heroTrail(
      this.#fxLayer,
      cellCenter(
        col === undefined ? this.#heroes[side].seal : this.#cells[side][col],
      ),
      impactPoint,
      side === "enemy",
      signal,
    );
    if (signal.aborted) {
      return;
    }

    this.#audio.play(ability ? "doom" : "heroHit");
    animateHeroRecoil(hero);
    track.animate(
      [
        { filter: "brightness(1)", boxShadow: "0 0 0 transparent" },
        {
          offset: 0.12,
          filter: "brightness(3)",
          boxShadow: "0 0 22px 6px #f2c28c",
        },
        {
          offset: 0.4,
          filter: "brightness(1.5)",
          boxShadow: "0 0 14px 2px #c24f45",
        },
        { filter: "brightness(1)", boxShadow: "0 0 0 transparent" },
      ],
      { duration: 500, easing: "ease-out" },
    );
    impact(this.#fxLayer, impactPoint[0], impactPoint[1], {
      lethal: amount >= 3 || ability,
      shadow: target === "player",
    });
    burst(
      this.#fxLayer,
      impactPoint[0],
      impactPoint[1],
      Math.min(18, 7 + amount * 2),
      target === "player"
        ? ["#ffb08b", "#d65343", "#6b2030"]
        : ["#fff0b8", "#ffc45e", "#9d6727"],
    );
    onImpact();
    floatText(
      this.#fxLayer,
      impactPoint[0],
      impactPoint[1],
      ability ? `${origin.name} -${amount}` : `-${amount}`,
      {
        color: ability
          ? FX_COLORS.shadow
          : target === "player"
            ? FX_COLORS.hurt
            : FX_COLORS.candle,
        size: ability ? 25 : 20,
      },
    );
    await wait(260, signal);
  }

  reset() {
    this.#stage.classList.remove("combat-resolving");
    for (const animation of this.#stage.getAnimations()) {
      animation.cancel();
    }
    for (const { root } of Object.values(this.#heroes)) {
      for (const animation of root.getAnimations({ subtree: true })) {
        animation.cancel();
      }
    }
    for (const cell of [...this.#cells.enemy, ...this.#cells.player]) {
      cell.classList.remove("resolving", "summoning");
    }
  }
}

/**
 * @param {HTMLElement} cell
 * @returns {readonly [number, number]}
 */
function cellCenter(cell) {
  const rect = cell.getBoundingClientRect();

  return [rect.left + rect.width / 2, rect.top + rect.height / 2];
}
