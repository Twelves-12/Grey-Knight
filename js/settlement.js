import { PLAYER_CARDS, applyCardUpgrade } from "../game/content/cards.js";
import { OATHS, RELICS } from "../game/content/equipment.js";
import { ENDINGS, getMapNode } from "../game/content/map.js";
import {
  chooseBattleReward,
  chooseOath,
  getNodeEntry,
  getRun,
  requireCampaignNode,
  rerollBattleReward,
  settleChapter,
  startNewCampaign,
} from "../game/session.js";
import {
  cardDetails,
  choiceCard,
  element,
  renderRunStatus,
  renderSteps,
  resultNotice,
  sectionHeading,
} from "./journey-ui.js";

const nodeId =
  new URLSearchParams(location.search).get("node") ?? getRun().progress.current;
const node = getMapNode(nodeId);
const back = document.querySelector("#settlement-back");
const restart = document.querySelector("#settlement-new");
let receipt = null;
const cardById = (id) => PLAYER_CARDS.find((card) => card.id === id);

function choiceFutureEffects(choice, run) {
  let future = choice.effects.future;
  if (nodeId === "node-6" && choice.id === "rebel") {
    const missing = [
      run.choices.knight === "spare" ? null : "骑士证人（酒馆未放走骑士）",
      run.choices.temple === "protect" ? null : "民众支持（未保护庙宇）",
    ].filter(Boolean);
    future =
      missing.length > 0
        ? [`缺少：${missing.join("、")}`, "结局「孤证难鸣」；无法进入宫殿"]
        : [
            "证人与民众支持齐备，开启宫殿终战",
            "击败公爵：正义结局；终战失败：悲剧结局",
          ];
  }

  return future.map((value) => ({
    label: "后续影响",
    value,
    tone:
      ["destroy", "execute", "expel"].includes(choice.id) ||
      (nodeId === "node-6" && choice.id === "rebel")
        ? "risk"
        : "neutral",
  }));
}

function storyCardName(id, upgrade) {
  const card = cardById(id);

  return upgrade ? applyCardUpgrade(card, upgrade).name : card.name;
}

function choiceEffects(choice, run) {
  const effects = choice.effects.immediate.map((value) => ({
    label: choice.rewardId ? "立即获得" : "当下结果",
    value,
    tone: choice.rewardId ? "gain" : "neutral",
  }));
  if (choice.bonus?.ashes) {
    effects.push({
      label: "立即到账",
      value: `+${choice.bonus.ashes} 灰烬`,
      tone: "gain",
    });
  }
  if (choice.bonus?.heal) {
    const health = Math.min(choice.bonus.heal, run.maxHealth - run.health);
    effects.push({
      label: "本次治疗",
      value:
        health > 0
          ? `恢复 ${health} 圣焰（最多 ${choice.bonus.heal}）`
          : "圣焰已满，本次恢复 0",
      tone: health > 0 ? "gain" : "neutral",
    });
  }

  return [...effects, ...choiceFutureEffects(choice, run)];
}

function storyRewardEffects(record, chosen) {
  const reward = record.storyReward;
  const cardId = reward ? reward.cardId : chosen?.rewardId;
  const effects = [];
  if (cardId) {
    effects.push({
      label: "剧情牌",
      value: storyCardName(cardId, reward?.upgrade),
      tone: "gain",
    });
  }
  if (reward?.ashes > 0) {
    effects.push({
      label: "剧情奖励",
      value: `+${reward.ashes} 灰烬`,
      tone: "gain",
    });
  }
  if (reward && (reward.health > 0 || chosen?.bonus?.heal)) {
    effects.push({
      label: "实际治疗",
      value: reward.health > 0 ? `恢复 ${reward.health} 圣焰` : "恢复 0 圣焰",
      tone: reward.health > 0 ? "gain" : "neutral",
    });
  }

  return effects;
}

function settlementSteps(record) {
  const steps = [];
  if (record.storyResolved !== undefined) {
    if (node.choices?.length) {
      steps.push({ key: "story", label: "处置抉择" });
    }
    if (node.kind !== "peaceful") {
      steps.push({ key: "reward", label: "战后选牌" });
    }
    if (record.oathOptions.length > 0) {
      steps.push({ key: "oath", label: "立下誓约" });
    }
  }
  steps.push({ key: "continue", label: "继续" });

  return steps;
}

function renderContext(record, chosen, ending, run) {
  const story = document.querySelector("#settlement-story");
  story.replaceChildren();
  story.hidden = Boolean(ending);
  if (ending) {
    return;
  }
  const paragraphs = chosen
    ? [
        nodeId === "node-6" &&
        chosen.id === "rebel" &&
        (run.choices.knight !== "spare" || run.choices.temple !== "protect")
          ? "你选择反抗，但缺少共同作证的人。这段旅程将以「孤证难鸣」结束。"
          : chosen.aftermath,
      ]
    : (node.aftermath ?? []);
  if (paragraphs.length > 0) {
    story.append(element("p", "settlement-context-lead", paragraphs.at(-1)));
  }
  if (!chosen && paragraphs.length > 1) {
    const details = element("details", "settlement-context-details");
    details.append(element("summary", "", "查看战后经过"));
    for (const text of paragraphs.slice(0, -1)) {
      details.append(element("p", "", text));
    }
    story.append(details);
  }
  const relic = RELICS.find((entry) => entry.id === record.relicId);
  if (relic) {
    story.append(
      element(
        "p",
        "settlement-found",
        `已获得战具：${relic.name} · ${relic.text}`,
      ),
    );
  }
}

function renderStory(choices, run, pending) {
  const actions = {
    recruit: "接受投降",
    execute: nodeId === "node-4" ? "处决骑士" : "处决匪首",
    expel: "驱逐蛮族",
    mercy: "放行蛮族",
    continue: "收下战利品",
    spare: "放走骑士",
    destroy: "摧毁庙宇",
    protect: "保护庙宇",
    loyal: "效忠领主",
    rebel: "反抗领主",
  };
  for (const choice of node.choices) {
    const disabledReason =
      nodeId === "node-5" &&
      pending.result === "victory" &&
      choice.id === "protect"
        ? "庙宇中的人已被击溃，无法再选择保护。"
        : "";
    const effects = choiceEffects(choice, run);
    choices.append(
      choiceCard({
        title: choice.title,
        description: choice.description,
        icon: "choice",
        effects,
        action: `${actions[choice.id]} →`,
        disabledReason,
        onClick() {
          settleChapter(nodeId, choice.id);
          receipt = null;
          render(true);
        },
      }),
    );
  }
}

function renderRewards(rewards, run, pending) {
  const options = element("div", "reward-options");
  for (const id of pending.rewardOptions) {
    const card = cardById(id);
    options.append(
      choiceCard({
        title: card.name,
        icon: "cards",
        content: cardDetails(card),
        action: "加入牌组 →",
        onClick() {
          chooseBattleReward(id);
          receipt = null;
          render(true);
        },
      }),
    );
  }
  rewards.append(options);
  const alternatives = element("div", "settlement-alternatives");
  alternatives.append(
    choiceCard({
      title: "换一组奖励",
      icon: "refresh",
      effects: [{ label: "花费", value: "10 灰烬", tone: "cost" }],
      action: "重掷 →",
      disabledReason:
        run.ashes < 10
          ? `还差 ${10 - run.ashes} 灰烬；当前持有 ${run.ashes}。`
          : "",
      onClick() {
        rerollBattleReward();
        receipt = {
          title: "奖励候选已更换",
          effects: [{ label: "花费", value: "10 灰烬", tone: "cost" }],
        };
        render(true);
      },
    }),
    choiceCard({
      title: "放弃选牌",
      icon: "ashes",
      effects: [{ label: "获得", value: "+12 灰烬", tone: "gain" }],
      action: "领取灰烬 →",
      onClick() {
        chooseBattleReward(null);
        receipt = null;
        render(true);
      },
    }),
  );
  rewards.append(alternatives);
}

function renderOaths(rewards, pending) {
  const options = element("div", "reward-options");
  for (const id of pending.oathOptions) {
    const oath = OATHS.find((entry) => entry.id === id);
    options.append(
      choiceCard({
        title: oath.name,
        icon: "oath",
        description: oath.text,
        action: "立下誓约 →",
        onClick() {
          chooseOath(id);
          receipt = null;
          render(true);
        },
      }),
    );
  }
  rewards.append(options);
}

function renderSummary(root, record, chosen, run) {
  const effects = [];
  if (record.ashesReward > 0) {
    effects.push({
      label: "战斗报酬",
      value: `+${record.ashesReward} 灰烬`,
      tone: "gain",
    });
  }
  if (chosen) {
    effects.push({ label: "处置", value: chosen.title, tone: "neutral" });
  }
  effects.push(...storyRewardEffects(record, chosen));
  if (record.rewardId) {
    effects.push({
      label: "战后选牌",
      value: cardById(record.rewardId).name,
      tone: "gain",
    });
  }
  if (record.rewardResolved && node.kind !== "peaceful" && !record.rewardId) {
    effects.push({ label: "跳过选牌", value: "+12 灰烬", tone: "gain" });
  }
  if (record.oathOptions?.length && record.oathResolved) {
    effects.push({
      label: "唯一誓约",
      value: OATHS.find((oath) => oath.id === run.oath).name,
      tone: "gain",
    });
  }
  if (effects.length === 0) {
    root.hidden = true;
    root.replaceChildren();

    return;
  }
  resultNotice(root, { title: "本关所得", effects });
}

function render(focusStep = false) {
  const run = getRun();
  const pending =
    run.pendingBattle?.nodeId === nodeId ? run.pendingBattle : null;
  const record = pending ?? run.records[nodeId];
  if (!record) {
    location.replace(getNodeEntry(run.progress.current));

    return;
  }
  const ending =
    run.ending && run.progress.current === nodeId ? ENDINGS[run.ending] : null;
  const chosen = node.choices?.find((choice) => choice.id === record.choiceId);
  const choices = document.querySelector("#settlement-choices");
  const rewards = document.querySelector("#settlement-rewards");
  choices.replaceChildren();
  rewards.replaceChildren();
  document.querySelector("#settlement-chapter").textContent = node.label;
  document.querySelector("#settlement-title").textContent =
    ending?.title ??
    (node.kind === "duel"
      ? "决斗结束"
      : node.kind === "peaceful"
        ? "庙门前的抉择"
        : "战斗胜利");
  document.querySelector("#settlement-seal").textContent =
    ending?.seal ?? node.seal ?? "胜";
  const copy = document.querySelector("#settlement-copy");
  copy.textContent = ending?.text ?? "";
  copy.hidden = !ending;
  renderRunStatus(document.querySelector("#settlement-status"), run);
  renderContext(record, chosen, ending, run);
  const stage = pending
    ? pending.storyResolved
      ? pending.rewardResolved
        ? "oath"
        : "reward"
      : "story"
    : "continue";
  const steps = settlementSteps(record);
  const stepIndex = steps.findIndex((step) => step.key === stage);
  renderSteps(
    document.querySelector("#settlement-steps"),
    steps.map((step) => step.label),
    stepIndex,
  );
  const headings = {
    story: ["处置抉择", ""],
    reward: ["战后选牌 · 三选一", ""],
    oath: ["立誓 · 三选一", "本趟不可更换，下一场战斗起生效。"],
    continue: [ending ? "旅程结束" : "整备完成", ""],
  };
  document
    .querySelector("#settlement-step-heading")
    .replaceChildren(
      sectionHeading(
        ...headings[stage],
        String(stepIndex + 1).padStart(2, "0"),
      ),
    );
  if (stage === "story") {
    renderStory(choices, run, pending);
  } else if (stage === "reward") {
    renderRewards(rewards, run, pending);
  } else if (stage === "oath") {
    renderOaths(rewards, pending);
  }
  const receiptRoot = document.querySelector("#settlement-receipt");
  if (receipt) {
    resultNotice(receiptRoot, receipt);
  } else {
    receiptRoot.hidden = true;
    receiptRoot.replaceChildren();
  }
  renderSummary(
    document.querySelector("#settlement-summary"),
    record,
    chosen,
    run,
  );
  const outcome = document.querySelector("#settlement-outcome");
  outcome.hidden = Boolean(pending);
  outcome.textContent = outcome.hidden
    ? ""
    : ending
      ? "新旅程将重置牌组、成长、灰烬与路线，保留图鉴和结局。"
      : `下一站：${run.progress.available.map((id) => getMapNode(id).label).join(" / ")}`;
  back.disabled = Boolean(pending);
  back.textContent = pending
    ? `先完成${steps[stepIndex].label}`
    : ending
      ? "查看冒险地图"
      : "返回地图 →";
  restart.hidden = !ending;
  if (focusStep) {
    const heading = document.querySelector("#settlement-step-heading");
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: "start", behavior: "instant" });
  }
}

back.addEventListener("click", () => {
  location.href = "/game/map.html";
});
restart.addEventListener("click", () => {
  startNewCampaign();
  location.href = "/game/map.html";
});
if (requireCampaignNode(nodeId, { allowCompleted: true })) {
  render();
}
