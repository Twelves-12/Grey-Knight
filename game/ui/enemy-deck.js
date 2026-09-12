import { createCardWatermark } from "./card-icons.js";
import { createCardRules } from "./card-rules.js";
import { el } from "./utils.js";

/** @param {import("../types.js").CardDef[]} cards */
function countCards(cards) {
  const counts = new Map();
  for (const card of cards) {
    counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
  }

  return counts;
}

/** @param {import("../types.js").CardDef[]} cards */
function cardList(cards) {
  const counts = countCards(cards);

  return [...counts]
    .map(
      ([id, count]) => `${cards.find((card) => card.id === id).name} ×${count}`,
    )
    .join("、");
}

export class EnemyDeck {
  #dialog;
  #body;
  #closeButton;
  /** @type {HTMLElement | null} */
  #opener = null;

  /** @param {HTMLElement} room */
  constructor(room) {
    this.#dialog = el("dialog", "enemy-deck");
    this.#dialog.id = "enemy-deck-dialog";
    this.#dialog.setAttribute("aria-labelledby", "enemy-deck-title");
    const header = el("header", "enemy-deck-header");
    const title = el("h2", "", "敌方牌库");
    title.id = "enemy-deck-title";
    this.#closeButton = el("button", "enemy-deck-close", "关闭 ×");
    this.#closeButton.type = "button";
    this.#closeButton.setAttribute("aria-label", "关闭敌方牌库");
    this.#closeButton.addEventListener("click", () => this.close());
    header.append(title, this.#closeButton);
    this.#body = el("div", "enemy-deck-body");
    this.#body.tabIndex = 0;
    this.#body.setAttribute("role", "region");
    this.#body.setAttribute("aria-label", "敌方牌库内容");
    this.#dialog.append(header, this.#body);
    this.#dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      this.close();
    });
    this.#dialog.addEventListener("close", () => {
      this.#opener?.focus({ preventScroll: true });
      this.#opener = null;
    });
    this.#dialog.addEventListener("click", (event) => {
      if (event.target !== this.#dialog) {
        return;
      }
      const rect = this.#dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        this.close();
      }
    });
    for (const type of ["keydown", "keyup", "keypress"]) {
      this.#dialog.addEventListener(type, (event) => event.stopPropagation());
    }
    room.append(this.#dialog);
  }

  /** @param {import("../game/battle.js").Battle} battle */
  open(battle) {
    const deck = battle.enemyDeck;
    const onBoard = battle.enemyBoard.filter(Boolean).map((unit) => unit.def);
    const planned = deck.planned.map((entry) => entry.def);
    const future = deck.waves.flatMap((wave) => wave.cards);
    const remaining = planned.length + deck.pending.length + future.length;
    const counts = {
      board: countCards(onBoard),
      planned: countCards(planned),
      pending: countCards(deck.pending),
      future: countCards(future),
      recurring: countCards(deck.recurring?.cards ?? []),
    };
    const intro = el(
      "p",
      "enemy-deck-intro",
      `第 ${battle.round} 轮 · 本关共 ${deck.cards.length} 种敌方卡牌。这里展示基础属性；战场上的增益与伤势请查看对应单位。`,
    );
    const overview = el("div", "enemy-deck-overview");
    for (const [label, value, detail] of [
      ["当前在场", `${onBoard.length} 个`, "已进入战线的敌方单位"],
      [
        "待出单位",
        `${remaining} 张`,
        `本轮预告 ${planned.length} · 待命 ${deck.pending.length} · 未来波次 ${future.length}`,
      ],
      [
        "持续增援",
        deck.recurring ? "有" : "无",
        deck.recurring
          ? `每 ${deck.recurring.interval} 轮加入待命`
          : "有限牌库，不循环补充",
      ],
    ]) {
      const stat = el("div", "enemy-deck-stat");
      stat.append(
        el("span", "", label),
        el("strong", "", value),
        el("small", "", detail),
      );
      overview.append(stat);
    }
    this.#body.replaceChildren(intro, overview);
    const mode = battle.encounter.mode;
    if (mode === "duel" || mode === "peaceful") {
      this.#body.append(
        el(
          "p",
          "enemy-deck-notice",
          `${mode === "duel" ? "本场决斗" : "本关庙宇"}只有开场单位，没有后续增援。`,
        ),
      );
    } else if (!remaining && !deck.recurring) {
      this.#body.append(
        el(
          "p",
          "enemy-deck-notice",
          "没有后续增援。有限牌库已用尽，场上剩余单位仍会继续战斗。",
        ),
      );
    }
    this.#renderSchedule(deck);
    const section = el("section", "enemy-deck-library");
    section.append(el("h3", "enemy-deck-section-title", "本关敌方卡牌"));
    const grid = el("div", "enemy-deck-grid");
    for (const def of deck.cards) {
      const card = el("article", "enemy-deck-card");
      const heading = el("header", "enemy-deck-card-heading");
      heading.append(
        el(
          "span",
          "enemy-deck-faction",
          def.faction ? `${def.faction} 种属` : "敌方单位",
        ),
        el("h4", "", def.name),
      );
      const stats = el("div", "enemy-deck-card-stats");
      stats.append(
        el("span", "", `基础攻击 ${def.attack}`),
        el("span", "", `基础生命 ${def.health}`),
      );
      const status = el("div", "enemy-deck-card-status");
      const board = counts.board.get(def.id) ?? 0;
      const preview = counts.planned.get(def.id) ?? 0;
      const pending = counts.pending.get(def.id) ?? 0;
      const futureCount = counts.future.get(def.id) ?? 0;
      status.append(el("span", board ? "on-board" : "", `在场 ${board}`));
      if (preview) {
        status.append(el("span", "is-planned", `本轮预告 ${preview}`));
      }
      if (pending) {
        status.append(el("span", "", `待命 ${pending}`));
      }
      if (futureCount) {
        status.append(el("span", "", `未来剩余 ${futureCount}`));
      }
      if (counts.recurring.has(def.id)) {
        status.append(el("span", "is-recurring", "循环增援"));
      } else if (!preview && !pending && !futureCount) {
        status.append(el("span", "is-exhausted", "无剩余同名增援"));
      }
      card.append(
        createCardWatermark(def),
        heading,
        stats,
        status,
        createCardRules(def, "enemy"),
      );
      grid.append(card);
    }
    section.append(grid);
    this.#body.append(section);
    if (!this.#dialog.open) {
      this.#opener =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      this.#dialog.showModal();
    }
    this.#body.scrollTop = 0;
    this.#closeButton.focus({ preventScroll: true });
  }

  /** @param {import("../game/battle.js").Battle["enemyDeck"]} deck */
  #renderSchedule(deck) {
    if (
      deck.planned.length === 0 &&
      deck.pending.length === 0 &&
      deck.waves.length === 0 &&
      !deck.recurring
    ) {
      return;
    }
    const section = el("section", "enemy-deck-schedule");
    section.append(el("h3", "enemy-deck-section-title", "增援安排"));
    if (deck.planned.length > 0) {
      const line = el("div", "enemy-deck-schedule-row");
      line.append(
        el("strong", "", "本轮交锋后入场"),
        el(
          "p",
          "",
          deck.planned
            .map(({ def, col }) => `第 ${col + 1} 战线：${def.name}`)
            .join("；"),
        ),
      );
      section.append(line);
    }
    if (deck.pending.length > 0) {
      const detail = el("details", "enemy-deck-details");
      detail.append(
        el("summary", "", `待命 ${deck.pending.length} 张 · 等待空战线`),
        el("p", "", cardList(deck.pending)),
        el("p", "enemy-deck-footnote", "下轮规划时若有空战线，将安排入场。"),
      );
      section.append(detail);
    }
    if (deck.waves.length > 0) {
      const detail = el("details", "enemy-deck-details");
      detail.append(
        el("summary", "", `未来 ${deck.waves.length} 批增援 · 查看轮次与牌种`),
      );
      const list = el("ol", "enemy-deck-wave-list");
      for (const wave of deck.waves) {
        const row = el("li");
        row.append(
          el("strong", "", `第 ${wave.round} 轮`),
          el("span", "", cardList(wave.cards)),
        );
        list.append(row);
      }
      detail.append(
        list,
        el(
          "p",
          "enemy-deck-footnote",
          "各批增援计划在对应轮次交锋后入场。满场时留在待命，等待后续轮次规划空战线。",
        ),
      );
      section.append(detail);
    }
    if (deck.recurring) {
      const recurring = el("div", "enemy-deck-recurring");
      recurring.append(
        el("strong", "", "持续增援 · 按以下顺序循环"),
        el(
          "p",
          "",
          `每 ${deck.recurring.interval} 轮补充 1 张，下一次在第 ${deck.recurring.nextRound} 轮加入待命；满场时等待空战线。`,
        ),
      );
      const list = el("ol", "enemy-deck-cycle");
      for (const [index, def] of deck.recurring.cards.entries()) {
        list.append(
          el("li", "", `${index === 0 ? "下一张：" : ""}${def.name}`),
        );
      }
      recurring.append(list);
      section.append(recurring);
    }
    this.#body.append(section);
  }

  close() {
    if (this.#dialog.open) {
      this.#dialog.close();
    }
  }
}
