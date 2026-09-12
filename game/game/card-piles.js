import { HAND_CAP } from "./rules.js";

export class CardPiles {
  #draw;
  #hand = [];
  #discard = [];
  #random;

  constructor(cards, random, state) {
    this.#random = random;
    this.#draw =
      state?.draw ??
      random.shuffled(cards.map((card) => structuredClone(card)));
    if (state) {
      this.#hand = state.hand;
      this.#discard = state.discard;
      random.state = state.random;
    }
  }

  get drawCount() {
    return this.#draw.length;
  }
  get hand() {
    return this.#hand;
  }
  get discard() {
    return this.#discard;
  }
  get drawPile() {
    return this.#draw;
  }
  get state() {
    return structuredClone({
      draw: this.#draw,
      hand: this.#hand,
      discard: this.#discard,
      random: this.#random.state,
    });
  }

  drawCard() {
    if (this.#hand.length >= HAND_CAP) {
      return { card: undefined, reshuffled: false };
    }
    let reshuffled = false;
    if (this.#draw.length === 0 && this.#discard.length > 0) {
      this.#draw = this.#random.shuffled(this.#discard);
      this.#discard = [];
      reshuffled = true;
    }
    const card = this.#draw.pop();
    if (card) {
      this.#hand.push(card);
    }

    return { card, reshuffled };
  }

  removeFromHand(index) {
    return this.#hand.splice(index, 1)[0];
  }
  addToHand(card) {
    if (this.#hand.length >= HAND_CAP) {
      return false;
    }
    this.#hand.push(card);

    return true;
  }

  discardCard(card) {
    this.#discard.push(card);
  }
  addToDraw(card) {
    this.#draw.unshift(card);
  }
  recover(index) {
    const card = this.#discard.splice(index, 1)[0];
    this.#draw.push(card);
  }

  reorder(indices) {
    const cards = this.#draw.splice(-indices.length).reverse();
    this.#draw.push(...indices.map((index) => cards[index]).reverse());
  }
}
