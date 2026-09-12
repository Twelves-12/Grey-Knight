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
    description:
      "商人将旅途中搜集的卡牌与战具铺在车旁。钱袋有限，为下一场交锋挑选补给。",
    title: "交易与补给",
    hint: "点击商品即可购买；可进行多笔交易，完成后继续前行。",
    seal: "市",
  },
  forge: {
    description: "炉火照亮旧甲与残刃。选出一张牌，决定将它锻成怎样的力量。",
    title: "选择卡牌，再选择升级",
    hint: "每张牌只能升级一次；同名的其他牌不受影响，升级随本趟冒险保留。",
    seal: "锻",
  },
  camp: {
    description: "行军队伍在背风处燃起篝火。今夜的时间，只够休整或搜集一次。",
    title: "如何度过这一夜？",
    hint: "两项行动只能选择一项。点击整张行动卡，立即执行。",
    seal: "营",
  },
  event: {
    description:
      "路旁躺着一只封存的军需遗匣。封口下藏着财物，也藏着致命的机关。",
    title: "如何处置遗匣？",
    hint: "两项行动只能选择一项。点击整张行动卡，立即执行。",
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

function serviceGroup(title, description) {
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
  const cards = serviceGroup(
    "购入卡牌",
    "每件商品点击即买，加入本趟冒险牌组。",
  );
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
  const removal = serviceGroup(
    "精简牌组",
    "选定具体一张牌后移除；牌组至少保留 5 张。",
  );
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
    actions.append(
      el("p", "journey-note", "所有卡牌均已升级。可以离开锻炉，继续前行。"),
    );

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
    el("p", "journey-note", "点击一个升级分支，支付 30 灰烬完成锻造。"),
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
        eyebrow: `升级分支 · ${upgraded.name.split("·").at(-1)}`,
        icon: "forge",
        description: change,
        content: cardDetails(upgraded),
        effects: [
          effect("支付", "30 灰烬", "cost"),
          effect("保留", "本趟冒险"),
        ],
        action: "选择此分支 →",
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
            description: "恢复 35% 最大圣焰。今夜不再外出搜集。",
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
            description: "带队寻找可用物资。今夜不再享有免费休整。",
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
            description: "承受机关的伤害，取出匣中的财物。",
            effects: [
              effect("失去", "4 圣焰", "cost"),
              effect("获得", "40 灰烬", "gain"),
            ],
            action: "承受伤害，开启 →",
            reason: run.health <= 4 ? "圣焰不足；开启后必须至少保留 1 点" : "",
          },
          {
            id: "respect",
            title: "整顿遗物，默立致意",
            icon: "health",
            description: "安顿亡者的遗物，让队伍重拾继续前行的意志。",
            effects: [
              effect("本次恢复", `${respect} 圣焰`, "gain"),
              effect("代价", "放弃匣中财物"),
            ],
            action: "整理遗物，恢复圣焰 →",
          },
        ];
  for (const choice of choices) {
    const selected = service.used && service.lastAction?.action === choice.id;
    const completed = service.used
      ? selected
        ? "此行动已完成"
        : "本次停留已结束，不能再选另一项"
      : (choice.reason ?? "");
    actions.append(
      choiceCard({
        ...choice,
        eyebrow: selected ? "已选择" : "本次停留二选一",
        action: selected ? "已完成 ✓" : choice.action,
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
      title: "暂时无法执行",
      tone: "error",
      text: failureMessage,
      effects: [],
    });

    return;
  }
  const record = service.lastAction;
  if (!record) {
    notice.hidden = !service.used;
    if (service.used) {
      resultNotice(notice, {
        title: "本次行动已完成",
        text: "这里的行动已结算，可以继续前行。",
        effects: [],
      });
    }

    return;
  }
  const def = PLAYER_CARDS.find((card) => card.id === record.options.cardId);
  const title = {
    rest: "休整完成",
    scavenge: "搜集完成",
    open: "遗匣已开启",
    respect: "已向亡者致意",
    buy: `已购入「${def?.name}」`,
    relic: "已购入战具",
    heal: "治疗完成",
    remove: `已移除「${def?.name}」`,
    upgrade: `「${def?.name}」升级完成`,
  }[record.action];
  const text = {
    rest: "队伍结束休整。今晚的营地行动已用完。",
    scavenge: "物资已入袋。今晚的营地行动已用完。",
    open: "你承受了机关伤害，取出了军需遗匣中的财物。",
    respect: "你整顿遗物后离开，没有取走匣中的财物。",
    buy: "新卡牌已加入本趟牌组。",
    relic: `${RELICS.find((entry) => entry.id === service.relicId)?.name}已装备，本趟冒险持续生效。`,
    heal: "药草已经使用，实际恢复量如下。",
    remove: "所选卡牌及其升级、成长已移出本趟牌组。",
    upgrade: def
      ? `已选择「${applyCardUpgrade(def, record.options.upgrade).name}」。同名的其他牌不受影响。`
      : "升级已应用。",
  }[record.action];
  const changes = [
    effect(
      "圣焰",
      `${record.before.health} → ${record.after.health}`,
      record.after.health > record.before.health
        ? "gain"
        : record.after.health < record.before.health
          ? "cost"
          : "neutral",
    ),
    effect(
      "灰烬",
      `${record.before.ashes} → ${record.after.ashes}`,
      record.after.ashes > record.before.ashes
        ? "gain"
        : record.after.ashes < record.before.ashes
          ? "cost"
          : "neutral",
    ),
  ];
  if (record.before.deckCount !== record.after.deckCount) {
    changes.push(
      effect(
        "牌组",
        `${record.before.deckCount} → ${record.after.deckCount} 张`,
      ),
    );
  }
  resultNotice(notice, { title, text, effects: changes });
}

function render() {
  const service = getService(nodeId);
  const run = getRun();
  const scene = scenes[node.kind];
  document.title = `Grey Knight · ${node.label}`;
  document.querySelector("#event-title").textContent = node.title;
  document.querySelector("#event-description").textContent = scene.description;
  document.querySelector("#event-seal").textContent = scene.seal;
  document.querySelector(".event-heading .eyebrow").textContent = {
    shop: "行商 · 旅途补给",
    forge: "锻炉 · 卡牌升级",
    camp: "营地 · 一次停留",
    event: "旅途事件 · 军需遗匣",
  }[node.kind];
  document.querySelector("#event-action-title").textContent = service.used
    ? "本次行动已完成"
    : scene.title;
  document.querySelector("#event-action-hint").textContent = service.used
    ? "结果已记入冒险。点击下方按钮，返回地图继续前行。"
    : scene.hint;
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
    `查看冒险牌组 · ${run.deck.length} 张`;
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
    ? "行动完成，继续前行 →"
    : oneTime
      ? "不作选择，继续前行 →"
      : "结束停留，继续前行 →";
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
