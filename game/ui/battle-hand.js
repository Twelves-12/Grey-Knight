import { createCard } from "./card-view.js";

export class BattleHand {
  #element;
  #template;

  /** @param {import("../types.js").CardDef} def @param {number} index @param {number} cost */
  #create(def, index, cost) {
    const card = createCard(this.#template, def, "player", {
      inHand: true,
      cost,
    });
    card.dataset.index = String(index);
    card.dataset.state = JSON.stringify(def);

    return card;
  }

  /**
   * @param {HTMLElement} element
   * @param {HTMLTemplateElement} template
   */
  constructor(element, template) {
    this.#element = element;
    this.#template = template;
  }

  reset() {
    for (const animation of this.#element.getAnimations({ subtree: true })) {
      animation.cancel();
    }
    this.#element.replaceChildren();
    this.#element.scrollLeft = 0;
  }

  /** @param {import("../types.js").CardDef} def @param {number} cost */
  draw(def, cost) {
    const positions = this.#measure();
    const card = this.#create(def, this.#element.children.length, cost);
    this.#element.append(card);
    this.#reflow(positions);

    return card;
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

  /**
   * @param {import("../game/battle.js").Battle} battle
   * @param {import("../types.js").CardDef[]} [cards]
   */
  sync(battle, cards = battle.hand) {
    if (
      this.#element.children.length !== cards.length ||
      cards.some(
        (def, index) =>
          this.#element.children[index].dataset.state !== JSON.stringify(def),
      )
    ) {
      this.#element.replaceChildren(
        ...cards.map((def, index) =>
          this.#create(def, index, battle.cardCost(def)),
        ),
      );
    }
    for (const [index, card] of [...this.#element.children].entries()) {
      card.classList.toggle(
        "disabled",
        battle.cardCost(cards[index]) > battle.energy,
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
