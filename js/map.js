import { OATHS, RELICS } from "../game/content/equipment.js";
import {
  ENDINGS,
  MAP_ROUTES,
  MAP_STAGES,
  getMapNode,
} from "../game/content/map.js";
import { AbyssFront } from "../game/encounters/battlefield.js";
import { getNodeEntry, getRun, startNewCampaign } from "../game/session.js";
import { choiceCard, element, icon, renderRunStatus } from "./journey-ui.js";

const run = getRun();
const board = document.querySelector("#map-board");
const continueButton = document.querySelector("#map-continue");
const types = {
  battle: "普通战斗",
  duel: "剧情决斗",
  peaceful: "道德抉择",
  elite: "精英战斗",
  shop: "商店",
  forge: "锻炉",
  camp: "营地",
  event: "事件",
};
const bossIds = ["node-3", "node-6", "node-7"];
const activeId = run.pendingBattle?.nodeId ?? run.battle?.nodeId;
const available = run.ending ? [] : run.progress.available;
const currentStage = MAP_STAGES.findIndex((stage) =>
  stage.some((id) => available.includes(id)),
);

renderRunStatus(document.querySelector("#map-status"), run);
const equipment = document.querySelector("#map-equipment");
const oath = OATHS.find((entry) => entry.id === run.oath);
if (oath) {
  const oathBadge = element("span", "map-equipment-item", oath.name);
  oathBadge.prepend(icon("oath"));
  oathBadge.title = oath.text;
  equipment.append(oathBadge);
}
for (const id of run.relics) {
  const relic = RELICS.find((entry) => entry.id === id);
  const badge = element("span", "map-equipment-item", relic.name);
  badge.prepend(icon("relic"));
  badge.title = relic.text;
  equipment.append(badge);
}
equipment.hidden = equipment.children.length === 0;

const history = document.querySelector("#map-choices");
for (const [key, nodeId] of Object.entries({
  bandit: "node-1",
  barbarians: "node-2",
  knight: "node-4",
  temple: "node-5",
  lord: "node-6",
})) {
  const node = getMapNode(nodeId);
  const selected = node.choices.find((entry) => entry.id === run.choices[key]);
  if (selected) {
    history.append(
      element(
        "span",
        "choice-history-item",
        `${node.label}：${selected.title}`,
      ),
    );
  }
}
document.querySelector("#map-choice-history").hidden =
  history.children.length === 0;
document.querySelector("#map-route-progress").textContent =
  `已走过 ${run.progress.completed.length} 站`;
for (const [name, label] of [
  ["route", "可前往"],
  ["check", "已完成"],
  ["lock", "未开启"],
]) {
  const item = element("span", "map-state", label);
  item.prepend(icon(name));
  document.querySelector("#map-legend").append(item);
}

const focusTitle = document.querySelector("#map-current-title");
const focusCopy = document.querySelector("#map-current-copy");
const focusIcon = document.querySelector("#map-current-icon");
document.querySelector("#map-current-step").textContent = run.ending
  ? "旅程记录"
  : `路程 ${currentStage + 1} / ${MAP_STAGES.length}`;
if (run.ending) {
  const ending = ENDINGS[run.ending];
  const panel = document.querySelector("#map-ending");
  panel.hidden = false;
  panel.append(element("h2", "", ending.title), element("p", "", ending.text));
  focusTitle.textContent = "旅程结束";
  focusIcon.append(icon("story"));
  continueButton.textContent = "回看结局 →";
  continueButton.hidden = false;
} else if (activeId) {
  const node = getMapNode(activeId);
  focusTitle.textContent = node.label;
  focusIcon.append(icon(node.kind));
  continueButton.textContent = run.pendingBattle
    ? "战后结算 →"
    : `返回「${node.label}」战场 →`;
  continueButton.hidden = false;
} else {
  const branching = available.length > 1;
  const currentNode = getMapNode(available[0]);
  const serviceCompleted =
    !branching &&
    ["camp", "event"].includes(currentNode.kind) &&
    run.services[currentNode.id]?.used;
  focusTitle.textContent = branching
    ? "选择路线"
    : serviceCompleted
      ? "当前停留"
      : "下一站";
  if (branching) {
    const nextId = MAP_ROUTES.find(([from]) => from === available[0])[1];
    focusCopy.textContent = `仅选一条，随后前往「${getMapNode(nextId).label}」。`;
    focusCopy.hidden = false;
  }
  focusIcon.append(icon(branching ? "route" : currentNode.kind));
  for (const id of available) {
    const node = getMapNode(id);
    const route = choiceCard({
      title: node.label,
      eyebrow: bossIds.includes(id) ? "首领战" : types[node.kind],
      icon: node.kind,
      ...routeDetails(node),
      onClick: () => {
        location.href = getNodeEntry(id);
      },
    });
    route.classList.add("route-option");
    document.querySelector("#map-current-options").append(route);
  }
}
continueButton.parentElement.hidden = continueButton.hidden;

for (const [index, stage] of MAP_STAGES.entries()) {
  const row = element(
    "div",
    `map-stage ${index === currentStage ? "active-stage" : ""}`,
  );
  row.append(
    element("span", "map-stage-number", String(index + 1).padStart(2, "0")),
  );
  const options = element("div", "map-stage-options");
  for (const id of stage) {
    const node = getMapNode(id);
    const passed = run.progress.completed.includes(id);
    const open = available.includes(id);
    const record = run.records[id];
    const hasRecord = !!record;
    const skipped =
      !passed &&
      stage.some((sibling) => run.progress.completed.includes(sibling));
    const state = open
      ? "current"
      : passed
        ? "passed"
        : hasRecord
          ? "recorded"
          : "locked";
    const button = element(
      "button",
      `campaign-node ${state} ${bossIds.includes(id) ? "boss" : ""}`,
    );
    button.type = "button";
    button.disabled = !open && !hasRecord;
    if (open) {
      button.setAttribute("aria-current", "step");
    }
    const emblem = element("span", "campaign-node-seal");
    emblem.append(icon(node.kind));
    const body = element("span", "campaign-node-copy");
    body.append(
      element("strong", "", `${node.hidden ? "隐藏 · " : ""}${node.label}`),
    );
    const label = open
      ? activeId === id
        ? "当前进度"
        : "可前往"
      : passed
        ? "已完成"
        : hasRecord
          ? record.result === "defeat"
            ? "战败 · 旅程止步"
            : record.result === "draw"
              ? "平局 · 旅程止步"
              : "已结束"
          : skipped
            ? "未选择"
            : "未开启";
    body.append(
      element(
        "small",
        "",
        `${bossIds.includes(id) ? "首领战" : types[node.kind]} · ${label}${hasRecord ? " · 回看结果" : ""}`,
      ),
    );
    if (id === "node-7" && !open && !passed && !hasRecord) {
      body.append(element("small", "", "条件：放走骑士 · 保护庙宇 · 反抗领主"));
    }
    const stateIcon = element("span", "map-state-icon");
    stateIcon.append(
      icon(open ? "arrow" : passed ? "check" : hasRecord ? "story" : "lock"),
    );
    button.append(emblem, body, stateIcon);
    button.addEventListener("click", () => {
      location.href = getNodeEntry(id);
    });
    options.append(button);
  }
  row.append(options);
  board.append(row);
}
continueButton.addEventListener("click", () => {
  location.href = getNodeEntry(activeId ?? run.progress.current);
});
document.querySelector("#map-new").addEventListener("click", () => {
  startNewCampaign();
  location.reload();
});

function routeDetails(node) {
  const effect = (label, value, tone = "gain") => ({ label, value, tone });
  if (["camp", "event"].includes(node.kind) && run.services[node.id]?.used) {
    return {
      effects: [effect("状态", "行动已完成", "neutral")],
      action: `返回${node.label}，结束停留 →`,
      selected: true,
    };
  }
  if (node.kind === "camp") {
    return {
      effects: [
        effect("休息", `最多恢复 ${Math.ceil(run.maxHealth * 0.35)} 圣焰`),
        effect("搜寻", "+20 灰烬"),
        effect("限制", "二选一", "neutral"),
      ],
      action: `前往${node.label} →`,
    };
  }
  if (node.kind === "shop") {
    return {
      effects: [
        effect("购牌", "25 灰烬 / 张", "cost"),
        effect("治疗", "20 灰烬最多恢复 8 圣焰", "cost"),
        effect("删牌", "35 灰烬 / 张", "cost"),
        effect("战具", "60 灰烬 / 件", "cost"),
      ],
      action: "进入商店 →",
    };
  }
  if (node.kind === "forge") {
    return {
      effects: [
        effect("强化", "单位 / 军令二选一"),
        effect("费用", "30 灰烬 / 张", "cost"),
        effect("持续", "本趟冒险", "neutral"),
      ],
      action: "进入锻炉 →",
    };
  }
  if (node.kind === "event") {
    return {
      effects: [
        effect("打开", "+40 灰烬"),
        effect("代价", "失去 4 圣焰", "risk"),
        effect("祈祷", "最多恢复 4 圣焰"),
      ],
      action: "查看遗匣 →",
    };
  }
  const encounter = new AbyssFront(run.seed, {
    nodeId: node.id,
    choices: run.choices,
  });
  if (node.kind === "peaceful") {
    return {
      description: "这里的人不会攻击，也不会还击。",
      effects: [
        effect("选择", "可直接拒绝军令", "neutral"),
        effect("风险", "击溃平民后不能保护庙宇", "risk"),
      ],
      action: "走进庙宇 →",
    };
  }
  const effects = [effect("敌方圣焰", String(encounter.maxHealth), "neutral")];
  if (node.kind === "duel") {
    effects.push(effect("决斗", "最多 6 轮 · 英雄不会死亡", "neutral"));
  }
  effects.push(
    effect(
      "战后",
      `+${node.kind === "elite" ? 35 : bossIds.includes(node.id) ? 40 : 20} 灰烬 · 卡牌三选一`,
    ),
  );
  if (node.kind === "elite") {
    effects.push(effect("精英战利品", "获得一件战具"));
  }
  if (node.id === "node-3") {
    effects.push(effect("首领战后", "誓约三选一 · 本趟生效"));
  }

  return {
    description: encounter.rule,
    effects,
    action: node.kind === "duel" ? "前往酒馆 →" : `前往${node.label} →`,
  };
}
