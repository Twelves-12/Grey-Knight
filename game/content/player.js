import {
  GENERATABLE_CARDS,
  GREY_KNIGHT_STARTER_DECK,
  RITUAL_STAGES,
} from "./cards.js";

/** @type {import("../types.js").PlayerDef} */
export const GREY_KNIGHT = {
  deck: GREY_KNIGHT_STARTER_DECK,
  cardPool: [...GENERATABLE_CARDS, ...RITUAL_STAGES],
  hero: {
    glyph: "灰",
    name: "灰骑士",
    nameEn: "Grey Knight",
  },
  maxHealth: 26,
};
