import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from "../game/content/achievements.js";
import { getProfile } from "../game/kv.js";
import { getRun } from "../game/session.js";
import { element, icon, renderRunStatus } from "./journey-ui.js";

const profile = getProfile();
const run = getRun();
const achievements = profile.achievements ?? { unlocked: [], progress: {} };
const unlockedSet = new Set(achievements.unlocked);

// --- 成就摘要 ---
document.querySelector("#achievement-summary").textContent =
  `已解锁 ${unlockedSet.size} / ${ACHIEVEMENTS.length} 项成就`;

// --- 分类过滤按钮 ---
const categoryContainer = document.querySelector("#achievement-categories");
const allButton = element("button", "category-filter active", "全部");
let activeCategory = "all";

allButton.addEventListener("click", () => {
  activeCategory = "all";
  renderAchievements();
  updateCategoryButtons();
});
categoryContainer.append(allButton);

for (const cat of ACHIEVEMENT_CATEGORIES) {
  const button = element("button", "category-filter", cat.label);
  button.addEventListener("click", () => {
    activeCategory = cat.key;
    renderAchievements();
    updateCategoryButtons();
  });
  categoryContainer.append(button);
}

function updateCategoryButtons() {
  for (const button of categoryContainer.querySelectorAll(".category-filter")) {
    const label = button.textContent;
    if (label === "全部") {
      button.classList.toggle("active", activeCategory === "all");
    } else {
      const cat = ACHIEVEMENT_CATEGORIES.find((c) => c.label === label);
      button.classList.toggle("active", cat && activeCategory === cat.key);
    }
  }
}

// --- 成就网格 ---
const grid = document.querySelector("#achievement-grid");

function renderAchievements() {
  grid.replaceChildren();

  const filtered = ACHIEVEMENTS.filter(
    (a) => activeCategory === "all" || a.category === activeCategory,
  );

  for (const def of filtered) {
    const unlocked = unlockedSet.has(def.id);
    const inProgress =
      !unlocked &&
      def.progress &&
      (achievements.progress[def.progress.key] ?? 0) > 0;

    const card = element(
      "article",
      `achievement-card ${unlocked ? "unlocked" : inProgress ? "in-progress" : "locked"}`,
    );
    card.setAttribute("aria-label", def.title);

    const seal = element("span", "achievement-seal");
    seal.append(icon(unlocked ? "check" : def.icon));

    const body = element("div", "achievement-body");
    body.append(
      element("strong", "", def.title),
      element("small", "", def.description),
    );

    if (inProgress) {
      const current = achievements.progress[def.progress.key] ?? 0;
      const target = def.progress.target;
      const progressBar = element("div", "progress-track");
      const fill = element("div", "progress-fill");
      fill.style.width = `${Math.min(100, (current / target) * 100)}%`;
      progressBar.append(fill);
      body.append(
        element("span", "progress-text", `${current} / ${target}`),
        progressBar,
      );
    }

    card.append(seal, body);
    grid.append(card);
  }
}

renderAchievements();

// --- 历史旅程列表 ---
const historyList = document.querySelector("#history-list");
const pastRuns = profile.pastRuns ?? [];

document.querySelector("#history-summary").textContent =
  pastRuns.length === 0
    ? "暂无已完成的旅程记录"
    : `共 ${pastRuns.length} 次旅程记录`;

for (const pastRun of pastRuns.slice(0, 20)) {
  const card = element("article", "history-card sheet");
  const header = element("div", "history-header");
  header.append(
    element("strong", "", pastRun.endingTitle ?? "未知旅程"),
  );
  const detail = element("div", "history-detail");
  const dateStr = pastRun.finishedAt
    ? new Date(pastRun.finishedAt).toLocaleDateString("zh-CN")
    : "未知日期";
  const summary = pastRun.summary ?? {};
  const stats = [
    `日期：${dateStr}`,
    `路径：${(pastRun.path ?? []).length} 站`,
    `战斗：${summary.battlesWon ?? "?"} 胜`,
    `牌组：${summary.finalDeckSize ?? "?"} 张`,
    `战具：${summary.relicsFound ?? "?"} 件`,
  ].join(" · ");
  detail.append(element("small", "", stats));
  card.append(header, detail);
  historyList.append(card);
}

// --- 当前旅程状态 ---
const statusRoot = document.querySelector("#current-run-status");
if (!run || run.ending) {
  statusRoot.append(
    element("p", "journey-note", "当前没有进行中的旅程。前往大地图开启新旅程。"),
  );
} else {
  renderRunStatus(statusRoot, run);
}