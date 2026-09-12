import { PLAYER_CARDS, applyCardUpgrade } from "../game/content/cards.js";
import { RELICS } from "../game/content/equipment.js";
import { getMapNode } from "../game/content/map.js";
import {
  getNodeEntry,
  getRun,
  getService,
  requireCampaignNode,
  useService,
} from "../game/session.js";
import {
  cardDetails,
  choiceCard,
  element as el,
  renderRunStatus,
  resultNotice,
  sceneArt,
  sectionHeading,
} from "./journey-ui.js";

const nodeId =
  new URLSearchParams(location.search).get("node") ?? getRun().progress.current;
const node = getMapNode(nodeId);
const actions = document.querySelector("#event-actions");
let selectedInstance;
let failureMessage = "";
const scenes = {
  shop: {
    description: "商人将卡牌与战具铺在车旁。",
    title: "交易与补给",
    seal: "市",
  },
  forge: {
    description: "炉火照亮旧甲与残刃。",
    title: "锻造",
    hint: "每张牌只能升级一次，效果保留至本趟冒险结束。",
    seal: "锻",
  },
  camp: {
    description: "行军队伍在背风处燃起篝火。",
    title: "休整与搜集",
    hint: "本次停留限选一项。",
    seal: "营",
  },
  event: {
    description: "军需遗匣的封口下藏着财物和机关。",
    title: "军需遗匣",
    hint: "本次停留限选一项。",
    seal: "匣",
  },
};

function cardDef(instance) {
  const template = PLAYER_CARDS.find((card) => card.id === instance.cardId);
  const def = instance.upgrade
    ? applyCardUpgrade(template, instance.upgrade)
    : template;

  return def.type === "unit"
    ? { ...def, attack: def.attack + (instance.growth ?? 0) }
    : def;
}

function act(action, options = {}) {
  const result = useService(nodeId, action, options);
  failureMessage = result.ok ? "" : result.reason;
  if (result.ok && action === "leave") {
    location.href = "/game/map.html";
  } else {
    render();
    const notice = document.querySelector("#event-notice");
    notice.focus({ preventScroll: true });
    notice.scrollIntoView({ block: "nearest" });
  }
}

const costReason = (run, cost) =>
  run.ashes < cost ? `灰烬不足，还需 ${cost - run.ashes} 灰烬` : "";

const effect = (label, value, tone = "neutral") => ({ label, value, tone });

function serviceGroup(title, description = "") {
  const group = el("section", "service-group");
  const grid = el("div", "service-grid");
  group.append(sectionHeading(title, description), grid);
  actions.append(group);

  return grid;
}

function cardSelect(run, predicate) {
  const label = el("label", "service-select", "选择具体卡牌");
  const select = el("select");
  for (const instance of run.deck.filter(predicate)) {
    const def = cardDef(instance);
    const option = el(
      "option",
      "",
      `${def.name} · ${instance.growth ? `成长 +${instance.growth} · ` : ""}编号 ${instance.instanceId.split("-").at(-1)}`,
    );
    option.value = instance.instanceId;
    select.append(option);
  }
  if ([...select.options].some((option) => option.value === selectedInstance)) {
    select.value = selectedInstance;
  }
  selectedInstance = select.value;
  select.addEventListener("change", () => {
    selectedInstance = select.value;
    render();
  });
  label.append(select);

  return label;
}

function renderShop(service, run) {
  const cards = serviceGroup("购入卡牌");
  for (const id of service.cards) {
    const def = PLAYER_CARDS.find((card) => card.id === id);
    const sold = service.bought.includes(id);
    cards.append(
      choiceCard({
        title: def.name,
        eyebrow: "卡牌",
        icon: "cards",
        content: cardDetails(def),
        effects: [
          effect("支付", "25 灰烬", "cost"),
          effect("牌组", "+1 张", "gain"),
        ],
        action: sold ? "已购入" : "购入此牌 →",
        selected: sold,
        disabledReason: sold ? "此牌已售出" : costReason(run, 25),
        onClick: () => act("buy", { cardId: id }),
      }),
    );
  }
  const supplies = serviceGroup(
    "战具与治疗",
    "战具贯穿本趟冒险；治疗可按需多次购买。",
  );
  const relic = RELICS.find((entry) => entry.id === service.relicId);
  if (relic) {
    const sold = run.relics.includes(relic.id);
    supplies.append(
      choiceCard({
        title: relic.name,
        eyebrow: "战具",
        icon: "relic",
        description: relic.text,
        effects: [
          effect("支付", "60 灰烬", "cost"),
          effect("获得", "本趟战具", "gain"),
        ],
        action: sold ? "已购入" : "购入战具 →",
        selected: sold,
        disabledReason: sold ? "已拥有此战具" : costReason(run, 60),
        onClick: () => act("relic"),
      }),
    );
  }
  const healing = Math.min(8, run.maxHealth - run.health);
  supplies.append(
    choiceCard({
      title: "药草治疗",
      icon: "health",
      description: "恢复最多 8 点圣焰，不会超过生命上限。",
      effects: [
        effect("支付", "20 灰烬", "cost"),
        effect("本次恢复", `${healing} 圣焰`, "gain"),
      ],
      action: "购买治疗 →",
      disabledReason:
        healing === 0 ? "圣焰已满，无需治疗" : costReason(run, 20),
      onClick: () => act("heal"),
    }),
  );
  const removal = serviceGroup("精简牌组", "牌组至少保留 5 张。");
  const selection = el("div", "service-card-preview sheet");
  selection.append(cardSelect(run, () => true));
  const selected = run.deck.find(
    (card) => card.instanceId === selectedInstance,
  );
  const def = cardDef(selected);
  selection.append(cardDetails(def));
  removal.append(
    selection,
    choiceCard({
      title: `移除「${def.name}」`,
      icon: "cards",
      description: "这张牌及其升级、成长永久移出本趟牌组。",
      effects: [
        effect("支付", "35 灰烬", "cost"),
        effect("牌组", `${run.deck.length} → ${run.deck.length - 1} 张`),
      ],
      action: "移除所选卡牌 →",
      disabledReason:
        run.deck.length <= 5
          ? "牌组至少保留 5 张，无法继续移除"
          : costReason(run, 35),
      onClick: () => act("remove", { instanceId: selectedInstance }),
    }),
  );
}

function renderForge(run) {
  const available = run.deck.filter((card) => !card.upgrade);
  if (available.length === 0) {
    actions.append(el("p", "journey-note", "所有卡牌均已升级。"));

    return;
  }
  const selection = el("div", "service-block sheet");
  selection.append(cardSelect(run, (card) => !card.upgrade));
  actions.append(selection);
  const instance = available.find(
    (card) => card.instanceId === selectedInstance,
  );
  const original = cardDef(instance);
  const comparison = el("div", "forge-comparison");
  const current = el("article", "service-card-preview sheet");
  current.append(
    el("p", "eyebrow", "当前卡牌"),
    el("h3", "", original.name),
    cardDetails(original),
  );
  comparison.append(current);
  for (const branch of ["unit", "command"]) {
    const upgraded = applyCardUpgrade(original, branch);
    const change =
      original.type === "unit"
        ? branch === "unit"
          ? `攻击 ${original.attack} → ${upgraded.attack}；初始沉睡 ${original.sleep ?? 0} → ${upgraded.sleep} 轮。`
          : upgraded.command.draw
            ? "军令结算后额外抽 1 张。"
            : `军令主要效果数值 ${original.command.count ?? 1} → ${upgraded.command.count}。`
        : branch === "unit"
          ? `费用 ${original.cost} → ${upgraded.cost}；使用后本场移除。`
          : upgraded.action.draw
            ? "结算后额外抽 1 张。"
            : "主要效果数值 +1。";
    comparison.append(
      choiceCard({
        title: upgraded.name,
        icon: "forge",
        description: change,
        content: cardDetails(upgraded),
        effects: [
          effect("支付", "30 灰烬", "cost"),
          effect("保留", "本趟冒险"),
        ],
        action: "锻造 →",
        disabledReason: costReason(run, 30),
        onClick: () =>
          act("upgrade", { instanceId: selectedInstance, upgrade: branch }),
      }),
    );
  }
  actions.append(comparison);
}

function renderOneTime(service, run) {
  const health = service.lastAction?.before.health ?? run.health;
  const rest = Math.min(
    Math.ceil(run.maxHealth * 0.35),
    run.maxHealth - health,
  );
  const respect = Math.min(4, run.maxHealth - health);
  const choices =
    node.kind === "camp"
      ? [
          {
            id: "rest",
            title: "围火休整",
            icon: "camp",
            description: "恢复 35% 最大圣焰。",
            effects: [
              effect("本次恢复", `${rest} 圣焰`, "gain"),
              effect("代价", "放弃搜集"),
            ],
            action: "在此休整 →",
          },
          {
            id: "scavenge",
            title: "搜集灰烬",
            icon: "ashes",
            effects: [
              effect("获得", "20 灰烬", "gain"),
              effect("代价", "放弃休整"),
            ],
            action: "出发搜集 →",
          },
        ]
      : [
          {
            id: "open",
            title: "开启军需遗匣",
            icon: "event",
            effects: [
              effect("失去", "4 圣焰", "cost"),
              effect("获得", "40 灰烬", "gain"),
            ],
            action: "承受伤害，开启 →",
            reason: run.health <= 4 ? "圣焰不足；开启后必须至少保留 1 点" : "",
          },
          {
            id: "respect",
            title: "整顿遗物",
            icon: "health",
            effects: [
              effect("本次恢复", `${respect} 圣焰`, "gain"),
              effect("代价", "放弃匣中财物"),
            ],
            action: "整理遗物 →",
          },
        ];
  for (const choice of choices) {
    const selected = service.used && service.lastAction?.action === choice.id;
    const completed = service.used
      ? selected
        ? "已完成"
        : "已选择另一项"
      : (choice.reason ?? "");
    actions.append(
      choiceCard({
        ...choice,
        disabledReason: completed,
        selected,
        onClick: () => act(choice.id),
      }),
    );
  }
}

function renderNotice(service) {
  const notice = document.querySelector("#event-notice");
  if (failureMessage) {
    resultNotice(notice, {
      title: "无法执行",
      tone: "error",
      text: failureMessage,
      effects: [],
    });

    return;
  }
  const record = service.lastAction;
  if (!record) {
    notice.hidden = true;
    notice.replaceChildren();

    return;
  }
  const def = PLAYER_CARDS.find((card) => card.id === record.options.cardId);
  const title = {
    rest: "休整完成",
    scavenge: "搜集完成",
    open: "遗匣已开启",
    respect: "遗物已整理",
    buy: `已购入「${def?.name}」`,
    relic: `已购入「${RELICS.find((entry) => entry.id === service.relicId)?.name}」`,
    heal: "治疗完成",
    remove: `已移除「${def?.name}」`,
    upgrade: def
      ? `已锻造「${applyCardUpgrade(def, record.options.upgrade).name}」`
      : "升级完成",
  }[record.action];
  const changes = [];
  if (record.before.health !== record.after.health) {
    changes.push(
      effect(
        "圣焰",
        `${record.before.health} → ${record.after.health}`,
        record.after.health > record.before.health ? "gain" : "cost",
      ),
    );
  } else if (["respect", "rest"].includes(record.action)) {
    changes.push(effect("恢复", "0 圣焰（已满）"));
  }
  if (record.before.ashes !== record.after.ashes) {
    changes.push(
      effect(
        "灰烬",
        `${record.before.ashes} → ${record.after.ashes}`,
        record.after.ashes > record.before.ashes ? "gain" : "cost",
      ),
    );
  }
  if (record.before.deckCount !== record.after.deckCount) {
    changes.push(
      effect(
        "牌组",
        `${record.before.deckCount} → ${record.after.deckCount} 张`,
      ),
    );
  }
  resultNotice(notice, { title, effects: changes });
}

function render() {
  const service = getService(nodeId);
  const run = getRun();
  const scene = scenes[node.kind];
  document.title = `Grey Knight · ${node.label}`;
  document.querySelector("#event-title").textContent = node.title;
  document.querySelector("#event-description").textContent = scene.description;
  document.querySelector("#event-seal").textContent = scene.seal;
  document.querySelector("#event-action-title").textContent = scene.title;
  const hint = document.querySelector("#event-action-hint");
  hint.textContent = service.used ? "" : (scene.hint ?? "");
  hint.hidden = !hint.textContent;
  renderRunStatus(document.querySelector("#event-status"), run);
  renderNotice(service);
  actions.replaceChildren();
  if (node.kind === "shop") {
    renderShop(service, run);
  } else if (node.kind === "forge") {
    renderForge(run);
  } else {
    renderOneTime(service, run);
  }
  document.querySelector("#event-deck-summary").textContent =
    `冒险牌组 · ${run.deck.length} 张`;
  const list = document.querySelector("#event-deck-list");
  list.replaceChildren();
  for (const instance of run.deck) {
    const def = cardDef(instance);
    const entry = el("div", "deck-entry");
    entry.append(
      el("strong", "", def.name),
      el(
        "small",
        "",
        `${def.cost} 圣力 · ${def.type === "unit" ? "单位" : "行动"}${instance.growth ? ` · 本趟成长 +${instance.growth}` : ""}`,
      ),
    );
    list.append(entry);
  }
  const leave = document.querySelector("#event-continue");
  const oneTime = node.kind === "camp" || node.kind === "event";
  leave.classList.toggle("primary", service.used || !oneTime);
  leave.textContent = service.used
    ? "继续前行 →"
    : oneTime
      ? "放弃本次机会，离开 →"
      : "离开 →";
}

document
  .querySelector("#event-continue")
  .addEventListener("click", () => act("leave"));
if (node && ["camp", "event", "forge", "shop"].includes(node.kind)) {
  if (requireCampaignNode(nodeId)) {
    document.querySelector(".event-heading").prepend(sceneArt(node.kind));
    render();
  }
} else {
  location.replace(getNodeEntry(getRun().progress.current));
}
