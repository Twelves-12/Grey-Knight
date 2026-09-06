import {
  ABYSS_FRONT_ENEMIES,
  GREY_KNIGHT_STARTER_DECK,
} from "../game/content/cards.js";
import { applyCardSigil } from "../game/ui/card-icons.js";
import { createCardRules } from "../game/ui/card-rules.js";
import { el } from "../game/ui/utils.js";

import "./site.js";

const form = document.querySelector("#card-filters");
const grid = document.querySelector("#card-grid");
const entries = [
  ...GREY_KNIGHT_STARTER_DECK.map((def) => ({ def, side: "player" })),
  ...ABYSS_FRONT_ENEMIES.map((def) => ({ def, side: "enemy" })),
].map(({ def, side }) => {
  const node = el("details", `codex-card ${side}`);
  const summary = el("summary");
  const top = el("div", "codex-card-top");
  top.append(
    el("span", "", side === "player" ? "灰骑士" : "深渊"),
    el("span", "", `${def.cost} 圣力`),
  );
  const sigil = el("div", "codex-sigil");
  applyCardSigil(sigil, def);
  const stats = el("div", "codex-stats");
  stats.append(
    el("span", "", `${def.attack} 攻击`),
    el("span", "", `${def.health} 生命`),
  );
  const tags = [
    def.keyword === "firstStrike" ? "先手" : "",
    def.onDeploy?.length ? (side === "player" ? "入场" : "降临") : "",
  ].filter(Boolean);
  summary.append(
    top,
    sigil,
    el("h2", "", def.name),
    el("span", "codex-tags", tags.join(" · ") || "普通单位"),
    stats,
    el("span", "codex-expand", "规则与铭文"),
  );
  const body = el("div", "codex-card-detail");
  body.append(createCardRules(def, side));
  if (def.flavor) {
    body.append(el("p", "codex-flavor", `「${def.flavor}」`));
  }
  node.append(summary, body);
  grid.append(node);

  return { def, side, node };
});

function filterCards() {
  const data = new FormData(form);
  const search = String(data.get("search")).trim().toLocaleLowerCase();
  const side = data.get("side");
  const cost = data.get("cost");
  const effect = data.get("effect");
  let count = 0;
  for (const entry of entries) {
    const { def, node } = entry;
    const text =
      `${def.name} ${def.nameEn ?? ""} ${def.text} ${def.flavor ?? ""}`.toLocaleLowerCase();
    const effectMatches =
      effect === "all" ||
      (effect === "firstStrike" && def.keyword === "firstStrike") ||
      (effect === "deploy" && Boolean(def.onDeploy?.length)) ||
      Boolean(def.onDeploy?.some((item) => item.kind === effect));
    const matches =
      text.includes(search) &&
      (side === "all" || side === entry.side) &&
      (cost === "all" || Number(cost) === def.cost) &&
      effectMatches;
    node.hidden = !matches;
    if (matches) {
      count += 1;
    }
  }
  document.querySelector("#card-count").textContent =
    `${count} / ${entries.length} 张卡牌`;
  document.querySelector("#card-empty").hidden = count !== 0;
}

form.addEventListener("input", filterCards);
form.addEventListener("change", filterCards);
form.addEventListener("submit", (event) => event.preventDefault());
document.querySelector("#clear-filters").addEventListener("click", () => {
  form.reset();
  filterCards();
});
filterCards();
