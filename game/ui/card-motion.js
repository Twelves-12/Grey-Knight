import { el, finishAnimations } from "./utils.js";

/** @typedef {{ bounds: DOMRect; face: HTMLElement }} PlayedCardOrigin */

/**
 * @param {HTMLElement} turn
 * @param {boolean} faceUp
 * @param {KeyframeAnimationOptions} timing
 */
const flipCard = (turn, faceUp, timing) =>
  turn.animate(
    [
      { transform: `perspective(900px) rotateY(${faceUp ? 0 : 170}deg)` },
      {
        offset: 0.72,
        transform: `perspective(900px) rotateY(${faceUp ? 174 : -6}deg)`,
      },
      { transform: `perspective(900px) rotateY(${faceUp ? 180 : 0}deg)` },
    ],
    timing,
  );

export class DraggedCard {
  #handCard;
  #flight;
  #size;
  #animations;

  /**
   * @param {HTMLElement} handCard
   * @param {HTMLElement} boardCard
   * @param {DOMRect} size
   * @param {HTMLElement} layer
   */
  constructor(handCard, boardCard, size, layer) {
    this.#handCard = handCard;
    this.#size = size;
    const bounds = handCard.getBoundingClientRect();
    const { flight, turn } = createFlight(boardCard, size, {
      bounds,
      face: handCard,
    });
    this.#flight = flight;
    flight.classList.add("dragging");
    layer.append(flight);
    handCard.style.visibility = "hidden";
    const timing = {
      duration: 260,
      easing: "cubic-bezier(0.2, 0.65, 0.25, 1)",
      fill: "both",
    };
    this.#animations = [
      flight.animate(
        [
          {
            transform: `scale(${bounds.width / size.width}, ${bounds.height / size.height})`,
          },
          { transform: "scale(1)" },
        ],
        timing,
      ),
      flipCard(turn, true, timing),
    ];
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  move(x, y) {
    this.#flight.style.left = `${x - this.#size.width / 2}px`;
    this.#flight.style.top = `${y - this.#size.height / 2}px`;
  }

  /**
   * @param {HTMLElement} card
   * @param {AbortSignal} signal
   */
  async land(card, signal) {
    const target = card.getBoundingClientRect();
    card.style.visibility = "hidden";
    const movement = this.#flight.animate(
      [
        { left: this.#flight.style.left, top: this.#flight.style.top },
        { left: `${target.x}px`, top: `${target.y}px` },
      ],
      { duration: 180, easing: "ease-out", fill: "both" },
    );
    try {
      await finishAnimations([...this.#animations, movement], signal);
    } finally {
      this.remove();
      card.style.visibility = "";
    }
  }

  returnToHand() {
    const target = this.#handCard.getBoundingClientRect();
    this.#handCard.style.visibility = "";
    const movement = this.#flight.animate(
      [
        {
          left: this.#flight.style.left,
          top: this.#flight.style.top,
          opacity: 1,
        },
        {
          left: `${target.x + (target.width - this.#size.width) / 2}px`,
          top: `${target.y + (target.height - this.#size.height) / 2}px`,
          opacity: 0,
        },
      ],
      { duration: 180, easing: "ease-in", fill: "both" },
    );
    movement.onfinish = () => this.remove();
  }

  remove() {
    this.#handCard.style.visibility = "";
    for (const animation of this.#flight.getAnimations({ subtree: true })) {
      animation.cancel();
    }
    this.#flight.remove();
  }
}

/**
 * @param {HTMLElement} card
 * @param {HTMLElement | PlayedCardOrigin | DraggedCard} origin
 * @param {HTMLElement} layer
 * @param {AbortSignal} signal
 */
export async function dealCard(card, origin, layer, signal) {
  if (origin instanceof DraggedCard) {
    await origin.land(card, signal);

    return;
  }
  const faceUp = !(origin instanceof HTMLElement);
  const from = faceUp ? origin.bounds : origin.getBoundingClientRect();
  const target = card.getBoundingClientRect();
  const dx = from.x + from.width / 2 - (target.x + target.width / 2);
  const dy = from.y + from.height / 2 - (target.y + target.height / 2);
  const { flight, turn } = createFlight(
    card,
    target,
    faceUp ? origin : undefined,
  );
  card.style.visibility = "hidden";
  layer.append(flight);
  const timing = {
    duration: 420,
    easing: "cubic-bezier(0.2, 0.65, 0.25, 1)",
    fill: "both",
  };
  const animation = flight.animate(
    [
      {
        opacity: faceUp ? 1 : 0,
        transform: `translate(${dx}px, ${dy}px) rotate(${faceUp ? 0 : -8}deg) scale(${from.width / target.width}, ${from.height / target.height})`,
      },
      {
        opacity: 1,
        offset: 0.72,
        transform: `translate(${dx * 0.06}px, ${dy * 0.06 - 8}px) rotate(1deg) scale(1.025)`,
      },
      {
        opacity: 1,
        transform: "translate(0, 0) rotate(0deg) scale(1)",
      },
    ],
    timing,
  );
  const rotation = flipCard(turn, faceUp, timing);
  try {
    await finishAnimations([animation, rotation], signal);
  } finally {
    flight.remove();
    card.style.visibility = "";
  }
}

/**
 * @param {HTMLElement} card
 * @param {DOMRect} target
 * @param {PlayedCardOrigin} [origin]
 */
function createFlight(card, target, origin) {
  const flight = el(
    "div",
    `card-flight ${card.classList.contains("enemy") ? "enemy" : "player"}`,
  );
  flight.style.left = `${target.x}px`;
  flight.style.top = `${target.y}px`;
  flight.style.width = `${target.width}px`;
  flight.style.height = `${target.height}px`;
  const turn = el("div", "card-turn");
  flight.append(turn);
  const arrival = cloneFace(card);
  if (origin) {
    const from = origin.bounds;
    const departure = cloneFace(origin.face);
    departure.style.width = `${from.width}px`;
    departure.style.height = `${from.height}px`;
    departure.style.left = `${(target.width - from.width) / 2}px`;
    departure.style.top = `${(target.height - from.height) / 2}px`;
    departure.style.transform = `scale(${target.width / from.width}, ${target.height / from.height})`;
    arrival.classList.add("card-arrival");
    turn.append(departure, arrival);
  } else {
    turn.append(arrival, el("div", "card-back"));
  }

  return { flight, turn };
}

/** @param {HTMLElement} card */
function cloneFace(card) {
  const face = card.cloneNode(true);
  face.classList.remove("selected", "disabled", "dragging");
  face.style.visibility = "";
  face.style.width = "100%";
  face.style.height = "100%";
  face.removeAttribute("data-index");
  face.removeAttribute("data-uid");

  return face;
}
