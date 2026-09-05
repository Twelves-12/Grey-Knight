import { dealCard } from "./card-motion.js";
import { createCard } from "./card-view.js";

export class BattleHand {
  #element;
  #template;
  #deck;
  #layer;

  /**
   * @param {HTMLElement} element
   * @param {HTMLTemplateElement} template
   * @param {HTMLElement} deck
   * @param {HTMLElement} layer
   */
  constructor(element, template, deck, layer) {
    this.#element = element;
    this.#template = template;
    this.#deck = deck;
    this.#layer = layer;
  }

  reset() {
    for (const animation of this.#element.getAnimations({ subtree: true })) {
      animation.cancel();
    }
    this.#element.replaceChildren();
    this.#element.scrollLeft = 0;
  }

  /**
   * @param {import("../types.js").CardDef} def
   * @param {AbortSignal} signal
   */
  async deal(def, signal) {
    const positions = this.#measure();
    const card = createCard(this.#template, def, "player", { inHand: true });
    card.dataset.index = String(this.#element.children.length);
    this.#element.append(card);
    this.#element.scrollLeft = this.#element.scrollWidth;
    this.#reflow(positions);
    await dealCard(card, this.#deck, this.#layer, signal);
  }

  /** @param {number} index */
  take(index) {
    const positions = this.#measure();
    const face = this.#element.children[index];
    const origin = { bounds: face.getBoundingClientRect(), face };
    face.remove();
    for (const [nextIndex, card] of [...this.#element.children].entries()) {
      card.dataset.index = String(nextIndex);
    }
    this.#reflow(positions);

    return origin;
  }

  /** @param {import("../game/battle.js").Battle} battle */
  sync(battle) {
    for (const [index, card] of [...this.#element.children].entries()) {
      card.classList.toggle(
        "disabled",
        battle.hand[index].cost > battle.energy,
      );
    }
  }

  #measure() {
    const positions = new Map();
    for (const card of this.#element.children) {
      positions.set(card, card.getBoundingClientRect());
    }

    return positions;
  }

  /** @param {Map<Element, DOMRect>} positions */
  #reflow(positions) {
    for (const card of this.#element.children) {
      const from = positions.get(card);
      if (!from) {
        continue;
      }
      const to = card.getBoundingClientRect();
      card.animate(
        [
          { transform: `translate(${from.x - to.x}px, ${from.y - to.y}px)` },
          { transform: "translate(0, 0)" },
        ],
        { duration: 220, easing: "ease-out" },
      );
    }
  }
}
