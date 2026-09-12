import { el } from "./utils.js";

/**
 * @param {HTMLElement} node
 * @param {import("../types.js").CardDef} def
 */
export function applyCardSigil(node, def) {
  node.innerHTML =
    `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" ` +
    `stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${def.icon}</svg>`;
}

/** @param {import("../types.js").CardDef} def */
export function createCardWatermark(def) {
  const watermark = el("span", "card-watermark");
  watermark.setAttribute("aria-hidden", "true");
  applyCardSigil(watermark, def);

  return watermark;
}

const PLAQUE_MARKS = {
  cost: `
    <path d="M8,1.6 C9.9,4.4 11.2,6 11.2,8.2 a3.2,3.2 0 1 1 -6.4,0 C4.8,6 6.1,4.4 8,1.6 Z"/>
    <path d="M8,6.5 C8.8,7.8 9.3,8.7 9.3,9.8 a1.3,1.3 0 1 1 -2.6,0 C6.7,8.7 7.2,7.8 8,6.5 Z" stroke-width="1.05"/>`,
  atk: `
    <path d="M6.2,9.8 L5.7,7.6 L11.8,1.8 L14.2,1.8 L14.2,4.2 L8.4,10.3 Z"/>
    <path d="M4.3,7.9 L8.1,11.7 M6.2,9.8 L2.8,13.2"/>
    <circle cx="2.8" cy="13.2" r="1" fill="currentColor" stroke="none"/>`,
  hp: `
    <path d="M8,13.7 L2.4,8.2 C-1.1,4.5 4.2,-0.4 8,3.8 C11.8,-0.4 17.1,4.5 13.6,8.2 Z" fill="currentColor" fill-opacity=".16"/>`,
};

/** @param {"cost" | "atk" | "hp"} kind */
export function plaqueMarkMarkup(kind) {
  const body = PLAQUE_MARKS[kind];

  return (
    `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" ` +
    `stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
  );
}
