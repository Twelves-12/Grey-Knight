import { PLAYER_CARDS } from "../game/content/cards.js";
import { RELICS, OATHS } from "../game/content/equipment.js";
import { getRun } from "../game/session.js";
import { createCardWatermark } from "../game/ui/card-icons.js";
import { createCardRules } from "../game/ui/card-rules.js";
import { el } from "../game/ui/utils.js";

const run = getRun();
const cardMap = new Map(PLAYER_CARDS.map((def) => [def.id, def]));
const relicMap = new Map(RELICS.map((r) => [r.id, r]));
const oathMap = new Map(OATHS.map((o) => [o.id, o]));

// --- 卡组 ---
const deckGrid = document.querySelector("#deck-grid");
const deckMeta = document.querySelector("#deck-meta");
const deckEmpty = document.querySelector("#deck-empty");

if (!run || run.ending || !run.deck || run.deck.length === 0) {
  deckEmpty.hidden = false;
} else {
  deckEmpty.hidden = true;

  const factionCounts = { A: 0, B: 0, C: 0 };

  for (const entry of run.deck) {
    const def = cardMap.get(entry.cardId);
    if (!def) continue;

    const faction = def.faction || "none";
    if (factionCounts[faction] !== undefined) factionCounts[faction]++;

    const node = el("article", "codex-card player");
    const heading = el("header", "codex-card-heading");
    const top = el("div", "codex-card-top");
    top.append(
      el("span", "", `灰骑士 · ${def.faction ?? "无"} 类`),
      el("span", "", `${def.cost} 圣力`),
    );

    const attack = (def.attack ?? 0) + (entry.growth ?? 0);
    const stats = el("div", "codex-stats");
    stats.append(
      el("span", "", `${attack} 攻击`),
      el("span", "", `${def.health ?? 0} 生命`),
    );

    const tags = [
      { unit: "单位", tactic: "战术", ritual: "仪式", enhancement: "强化" }[
        def.type
      ],
      def.keyword === "firstStrike" ? "先手" : "",
      def.keyword === "piercing" ? "穿透" : "",
      def.sleep ? `沉睡 ${def.sleep}` : "",
      def.onDeploy?.length ? "入场" : "",
      entry.upgrade ? `已强化` : "",
      entry.growth > 0 ? `成长 +${entry.growth}` : "",
    ].filter(Boolean);

    heading.append(
      top,
      el("h2", "", def.name),
      el("span", "codex-tags", tags.join(" · ") || "普通单位"),
      ...(def.type === "unit" ? [stats] : []),
    );

    const body = el("div", "codex-card-detail");
    body.append(createCardRules(def, "player"));
    if (def.flavor) {
      const flavor = el("details", "codex-flavor");
      flavor.append(
        el("summary", "", "铭文"),
        el("p", "", `「${def.flavor}」`),
      );
      body.append(flavor);
    }

    node.append(createCardWatermark(def), heading);
    if (body.hasChildNodes()) {
      node.append(body);
    }
    deckGrid.append(node);
  }

  const parts = [`共 ${run.deck.length} 张`];
  if (factionCounts.A) parts.push(`军事 ${factionCounts.A}`);
  if (factionCounts.B) parts.push(`蛮荒 ${factionCounts.B}`);
  if (factionCounts.C) parts.push(`民众 ${factionCounts.C}`);
  deckMeta.textContent = parts.join(" · ");
}

// --- 战具与誓约 ---
const relicList = document.querySelector("#relic-list");
const relicEmpty = document.querySelector("#relic-empty");

const allRelics = [...(run?.relics ?? [])];
const hasContent = allRelics.length > 0 || !!run?.oath;

if (!hasContent) {
  relicEmpty.hidden = false;
} else {
  relicEmpty.hidden = true;

  for (const relicId of allRelics) {
    const relic = relicMap.get(relicId);
    if (!relic) continue;

    const card = el("article", "relic-card");
    card.append(
      el("div", "relic-name", relic.name),
      el("div", "relic-text", relic.text),
    );
    relicList.append(card);
  }

  if (run?.oath) {
    const oath = oathMap.get(run.oath);
    if (oath) {
      const card = el("article", "relic-card oath");
      card.append(
        el("div", "relic-name", oath.name),
        el("div", "relic-text", oath.text),
      );
      relicList.append(card);
    }
  }
}