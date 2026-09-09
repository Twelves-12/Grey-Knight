import { HAND_CAP } from "./rules.js";

/** @typedef {import("../types.js").CardDef} CardDef */

export class CardPiles {
  /** @type {CardDef[]} */
  #draw;
  /** @type {CardDef[]} */
  #hand = [];

  /**
   * @param {readonly CardDef[]} cards
   * @param {Random} random
   */
  constructor(cards, random) {
    this.#draw = random.shuffled(cards);
  }

  get drawCount() {
    return this.#draw.length;
  }

  get hand() {
    return this.#hand;
  }

  drawCard() {
    if (this.#hand.length >= HAND_CAP) {
      return { card: undefined, reshuffled: false };
    }
    const card = this.#draw.pop();

    // 这里可能没有牌
    // 1. 开局牌库本来就是空的
    // 2. 抽完了牌库
    // 3. 卡牌仍在手牌或战场上，尚未离场
    if (card) {
      this.#hand.push(card);
    }

    return { card, reshuffled: false };
  }

  /** @param {number} index */
  removeFromHand(index) {
    this.#hand.splice(index, 1);
  }
}
