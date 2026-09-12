import {
  ABYSS_FRONT_ENEMIES,
  GREY_KNIGHT_STARTER_DECK,
  PLAYER_CARDS,
} from "../game/content/cards.js";
import { getProfile, setProfile } from "../game/kv.js";
import { createCardWatermark } from "../game/ui/card-icons.js";
import { createCardRules } from "../game/ui/card-rules.js";
import { el } from "../game/ui/utils.js";

const form = document.querySelector("#card-filters");
const grid = document.querySelector("#card-grid");
const profile = getProfile();
const discovered = new Set(profile.codex);
for (const card of GREY_KNIGHT_STARTER_DECK) {
  discovered.add(`player:${card.id}`);
}
if (discovered.size !== profile.codex.length) {
  setProfile({ ...profile, codex: [...discovered] });
}
const entries = [
  ...PLAYER_CARDS.map((def) => ({ def, side: "player" })),
  ...ABYSS_FRONT_ENEMIES.map((def) => ({ def, side: "enemy" })),
]
  .filter(({ def, side }) => discovered.has(`${side}:${def.id}`))
  .map(({ def, side }) => {
    const node = el("article", `codex-card ${side}`);
    const heading = el("header", "codex-card-heading");
    const top = el("div", "codex-card-top");
    top.append(
      el(
        "span",
        "",
        `${side === "player" ? "灰骑士" : "敌方"} · ${def.faction} 类`,
      ),
      el("span", "", `${def.cost} 圣力`),
    );
    const stats = el("div", "codex-stats");
    stats.append(
      el("span", "", `${def.attack} 攻击`),
      el("span", "", `${def.health} 生命`),
    );
    const tags = [
      { unit: "单位", tactic: "战术", ritual: "仪式", enhancement: "强化" }[
        def.type
      ],
      def.keyword === "firstStrike" ? "先手" : "",
      def.keyword === "piercing" ? "穿透" : "",
      def.sleep ? `沉睡 ${def.sleep}` : "",
      def.onDeploy?.length ? "入场" : "",
    ].filter(Boolean);
    heading.append(
      top,
      el("h2", "", def.name),
      el("span", "codex-tags", tags.join(" · ") || "普通单位"),
      ...(def.type === "unit" ? [stats] : []),
    );
    const body = el("div", "codex-card-detail");
    body.append(createCardRules(def, side));
    if (def.flavor) {
      const flavor = el("details", "codex-flavor");
      flavor.append(
        el("summary", "", "铭文"),
        el("p", "", `「${def.flavor}」`),
      );
      body.append(flavor);
    }
    node.append(createCardWatermark(def), heading, body);
    grid.append(node);

    return { def, side, node };
  });

function filterCards() {
  const data = new FormData(form);
  const search = String(data.get("search")).trim().toLocaleLowerCase();
  const side = data.get("side");
  const faction = data.get("faction");
  const cost = data.get("cost");
  const effect = data.get("effect");
  let count = 0;
  for (const entry of entries) {
    const { def, node } = entry;
    const text =
      `${def.name} ${def.nameEn ?? ""} ${def.text} ${def.command?.text ?? ""} ${def.flavor ?? ""}`.toLocaleLowerCase();
    const effectMatches =
      effect === "all" ||
      effect === def.type ||
      (effect === "piercing" && def.keyword === "piercing") ||
      (effect === "sleep" && Boolean(def.sleep)) ||
      (effect === "firstStrike" && def.keyword === "firstStrike") ||
      (effect === "deploy" && Boolean(def.onDeploy?.length)) ||
      Boolean(def.onDeploy?.some((item) => item.kind === effect));
    const matches =
      text.includes(search) &&
      (side === "all" || side === entry.side) &&
      (faction === "all" || faction === def.faction) &&
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
