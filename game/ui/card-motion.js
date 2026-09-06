// 这里处理“卡从 A 移动到 B”时的临时假卡。
//
// 真卡先放到终点再藏起来，飞行结束才露出来。
// 抽牌直接拿手牌的正面飞进来，敌方出卡直接拿战场小卡飞进来，都不翻面。
// 玩家点击出牌时，从手牌翻成战场小卡，再落到格子里。
// 起点只传位置；需要翻面时，再带上原来的手牌卡面
// 拖牌也是先翻成小卡，跟着鼠标跑，能出就落下，不能就飞回手里。
// 动画结束删掉假卡，只留下真卡。
import { el, finishAnimations } from "./utils.js";

/** @typedef {{ bounds: DOMRect; face?: HTMLElement }} CardOrigin */

/**
 * 手牌翻成战场小卡
 *
 * @param {HTMLElement} turn
 * @param {KeyframeAnimationOptions} timing
 */
const flipCard = (turn, timing) =>
  turn.animate(
    [
      { transform: "perspective(900px) rotateY(0deg)" },
      {
        offset: 0.72,
        transform: "perspective(900px) rotateY(174deg)",
      },
      { transform: "perspective(900px) rotateY(180deg)" },
    ],
    timing,
  );

/** 拖牌时跟着鼠标跑的假卡，不要动原本的真卡 */
export class DraggedCard {
  #handCard;
  #flight;
  #size;
  #animations;

  /**
   * 拖动过程：
   *
   * - 创建假卡
   * - 隐藏真卡
   * - 假卡翻成战场小卡
   *
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
      flipCard(turn, timing),
    ];
  }

  /**
   * 跟随鼠标
   *
   * @param {number} x
   * @param {number} y
   */
  move(x, y) {
    this.#flight.style.left = `${x - this.#size.width / 2}px`;
    this.#flight.style.top = `${y - this.#size.height / 2}px`;
  }

  /**
   * 出牌成功，假卡飞到战场上的真卡位置
   *
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

  /** 没出成就飞回手里 */
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

  /** 把真手牌露出来，删掉假卡 */
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
 * @param {CardOrigin} origin
 * @param {HTMLElement} layer
 * @param {AbortSignal} signal
 */
export async function dealCard(card, origin, layer, signal) {
  const from = origin.bounds;
  const target = card.getBoundingClientRect();
  const dx = from.x + from.width / 2 - (target.x + target.width / 2);
  const dy = from.y + from.height / 2 - (target.y + target.height / 2);
  const { flight, turn } = createFlight(card, target, origin);
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
        opacity: origin.face ? 1 : 0,
        transform: `translate(${dx}px, ${dy}px) rotate(${origin.face ? 0 : -8}deg) scale(${from.width / target.width}, ${from.height / target.height})`,
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
  const animations = [animation];
  if (origin.face) {
    animations.push(flipCard(turn, timing));
  }
  try {
    await finishAnimations(animations, signal);
  } finally {
    flight.remove();
    card.style.visibility = "";
  }
}

/**
 * @param {HTMLElement} card
 * @param {DOMRect} target
 * @param {CardOrigin} origin
 */
function createFlight(card, target, origin) {
  const flight = el("div", "card-flight");
  flight.style.left = `${target.x}px`;
  flight.style.top = `${target.y}px`;
  flight.style.width = `${target.width}px`;
  flight.style.height = `${target.height}px`;
  const turn = el("div", "card-turn");
  flight.append(turn);
  const arrival = cloneFace(card);
  if (origin.face) {
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
    turn.append(arrival);
  }

  return { flight, turn };
}

/**
 * 复制卡面给动画用，移除一些不必要的属性和类
 *
 * @param {HTMLElement} card
 */
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
