import { HAND_CAP } from "./rules.js";

/**
 * @typedef {import("../types.js").CardDef} CardDef
 * @typedef {import("./random.js").Random} Random
 */

export class CardPiles {
  /** @type {CardDef[]} */
  #discard = [];
  /** @type {CardDef[]} */
  #draw;
  /** @type {CardDef[]} */
  #hand = [];
  #random;

  /**
   * @param {readonly CardDef[]} cards
   * @param {Random} random
   */
  constructor(cards, random) {
    this.#draw = random.shuffled(cards);
    this.#random = random;
  }

  get discardCount() {
    return this.#discard.length;
  }

  get drawCount() {
    return this.#draw.length;
  }

  get hand() {
    return this.#hand;
  }

  /** @param {CardDef} card */
  discard(card) {
    this.#discard.push(card);
  }

  drawCard() {
    if (this.#hand.length >= HAND_CAP) {
      return { card: undefined, reshuffled: false };
    }
    let reshuffled = false;
    if (this.#draw.length === 0 && this.#discard.length > 0) {
      reshuffled = true;
      this.#draw = this.#random.shuffled(this.#discard);
      this.#discard.length = 0;
    }
    const card = this.#draw.pop();
    if (card) {
      this.#hand.push(card);
    }

    return { card, reshuffled };
  }

  /** @param {number} index */
  removeFromHand(index) {
    this.#hand.splice(index, 1);
  }
}
