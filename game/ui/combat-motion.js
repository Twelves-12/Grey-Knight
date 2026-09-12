import { finishAnimations } from "./utils.js";

/**
 * 让攻击单位向目标突进后归位。
 *
 * @param {Element} card
 * @param {Element} targetCard
 * @param {"player" | "enemy"} side
 */
export function animateStrike(card, targetCard, side) {
  const attackerRect = card.getBoundingClientRect();
  const targetRect = targetCard.getBoundingClientRect();
  const deltaY =
    targetRect.top +
    targetRect.height / 2 -
    (attackerRect.top + attackerRect.height / 2);
  const travel = deltaY - Math.sign(deltaY) * targetRect.height * 0.35;
  const windup = -Math.sign(deltaY) * Math.min(13, attackerRect.height * 0.1);
  const tilt = side === "player" ? -2.2 : 2.2;

  card.animate(
    [
      { filter: "brightness(1)", transform: "translate3d(0, 0, 0) scale(1)" },
      {
        filter: "brightness(0.92) saturate(1.2)",
        offset: 0.2,
        transform: `translate3d(0, ${windup}px, 0) rotate(${tilt}deg) scale(0.95)`,
      },
      {
        filter: "brightness(1.55) saturate(1.25)",
        offset: 0.48,
        transform: `translate3d(0, ${travel}px, 0) rotate(${-tilt}deg) scale(1.035)`,
      },
      {
        filter: "brightness(1.25)",
        offset: 0.6,
        transform: `translate3d(0, ${travel}px, 0) rotate(${-tilt}deg) scale(1.035)`,
      },
      { filter: "brightness(1)", transform: "translate3d(0, 0, 0) scale(1)" },
    ],
    {
      duration: 400,
      easing: "cubic-bezier(0.16, 0.74, 0.2, 1)",
    },
  );
}

/**
 * 让受击单位短暂后退并闪白。
 *
 * TODO: 重做。这个动画看着很鬼畜
 *
 * @param {HTMLElement} card
 * @param {"player" | "enemy"} attacker
 */
export function animateRecoil(card, attacker) {
  const recoil = attacker === "player" ? -10 : 10;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  return card.animate(
    reduced
      ? [{ opacity: 0.7 }, { opacity: 1 }]
      : [
          { filter: "brightness(1)", transform: "translate3d(0, 0, 0)" },
          {
            filter: "brightness(2.5) saturate(0.35)",
            offset: 0.12,
            transform: `translate3d(-3px, ${recoil}px, 0) rotate(-1deg)`,
          },
          {
            filter: "brightness(1.25)",
            offset: 0.42,
            transform: `translate3d(4px, ${recoil * 0.55}px, 0) rotate(1deg)`,
          },
          { filter: "brightness(1)", transform: "translate3d(0, 0, 0)" },
        ],
    { duration: reduced ? 80 : 180, easing: "ease-out" },
  );
}

/**
 * 让受击英雄短暂后仰。
 *
 * @param {HTMLElement} hero
 */
export function animateHeroRecoil(hero) {
  hero.animate(
    [
      { filter: "brightness(1)", transform: "translate3d(0, 0, 0)" },
      {
        filter: "brightness(2) saturate(0.4)",
        offset: 0.16,
        transform: "translate3d(0, -4px, 0) scale(1.015)",
      },
      {
        filter: "brightness(1.15)",
        offset: 0.48,
        transform: "translate3d(0, 2px, 0) scale(0.99)",
      },
      { filter: "brightness(1)", transform: "translate3d(0, 0, 0)" },
    ],
    { duration: 340, easing: "ease-out" },
  );
}

/**
 * 播放单位死亡动画，结束后移除卡牌。
 *
 * @param {HTMLElement} card
 * @param {AbortSignal} signal
 */
export async function animateDeath(card, signal) {
  if (card.classList.contains("dead")) {
    return;
  }
  card.classList.add("dead");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const direction = card.classList.contains("enemy") ? -1 : 1;
  const animation = card.animate(
    reduced
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [
          {
            opacity: 1,
            filter: "brightness(1)",
            transform: "translateY(0) scale(1)",
          },
          {
            opacity: 0.8,
            filter: "brightness(1.8)",
            transform: "translateY(0) scale(1.015)",
            offset: 0.2,
          },
          {
            opacity: 0,
            filter: "brightness(0.7) blur(2px)",
            transform: `translateY(${direction * 12}px) scale(0.9)`,
          },
        ],
    { duration: reduced ? 80 : 220, easing: "ease-out", fill: "forwards" },
  );
  try {
    await finishAnimations([animation], signal);
  } finally {
    animation.cancel();
    card.remove();
  }
}
