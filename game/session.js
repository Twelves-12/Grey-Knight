import {
  CHAPTER_ENEMY_CARDS,
  GENERATABLE_CARDS,
  GREY_KNIGHT_STARTER_DECK,
} from "./content/cards.js";
import { OATHS, RELICS } from "./content/equipment.js";
import { MAP_ROUTES, getMapNode } from "./content/map.js";
import { GREY_KNIGHT } from "./content/player.js";
import { Random } from "./game/random.js";
import * as kv from "./kv.js";

export const GAME_PAGES = {
  "/game/story": "../js/story.js",
  "/game/story2": "../js/story2.js",
  "/game/event": "../js/event.js",
  "/game/event2": "../js/event2.js",
  "/game/battle": "./main.js",
  "/game/map": "../js/map.js",
  "/game/settlement": "../js/settlement.js",
  "/game/cards": "../js/cards.js",
  "/game/rules": null,
};

const CHOICE_KEYS = {
  "node-1": "bandit",
  "node-2": "barbarians",
  "node-4": "knight",
  "node-5": "temple",
  "node-6": "lord",
};

function newRun(seed = crypto.getRandomValues(new Uint32Array(1))[0]) {
  const run = {
    version: 1,
    seed,
    nextInstance: 0,
    deck: [],
    health: GREY_KNIGHT.maxHealth,
    maxHealth: GREY_KNIGHT.maxHealth,
    ashes: 50,
    relics: [],
    oath: null,
    choices: {},
    rewards: {},
    records: {},
    services: {},
    progress: {
      current: "node-1",
      available: ["node-1"],
      unlocked: ["node-1"],
      completed: [],
    },
    pendingBattle: null,
    battle: null,
    ending: null,
  };
  for (const card of GREY_KNIGHT_STARTER_DECK) {
    addCard(run, card.id);
  }

  return run;
}

function addCard(run, cardId, upgrade = null) {
  run.deck.push({
    instanceId: `${run.seed}-${run.nextInstance++}`,
    cardId,
    upgrade,
    growth: 0,
  });
}

function save(profile) {
  profile.progress = profile.run.progress;
  profile.choices = profile.run.choices;
  profile.rewards = profile.run.rewards;
  kv.setProfile(profile);

  return profile.run;
}

export function getCampaign() {
  const profile = kv.getProfile();
  if (!profile.run) {
    // 原版本的章节记录留在旧字段中；新的冒险使用独立 RunState。
    if (profile.progress) {
      profile.previousCampaign = {
        progress: profile.progress,
        rewards: profile.rewards,
        branch: profile.branch,
      };
    }
    profile.run = newRun();
    save(profile);
  }

  return profile;
}

export const getRun = () => getCampaign().run;

export function startNewCampaign(seed) {
  const profile = getCampaign();
  profile.run = newRun(seed);

  return save(profile);
}

export function requireSession() {
  const loggedIn = kv.get("session") !== null;
  document.body.hidden = !loggedIn;
  if (!loggedIn) {
    const next = encodeURIComponent(
      location.pathname + location.search + location.hash,
    );
    location.replace(`/login.html?next=${next}`);
  }

  return loggedIn;
}

export function getNodeEntry(nodeId) {
  const run = getRun();
  if (run.pendingBattle?.nodeId === nodeId || run.records[nodeId]) {
    return `/game/settlement.html?node=${encodeURIComponent(nodeId)}`;
  }
  if (run.battle?.nodeId === nodeId) {
    return `/game/battle.html?node=${encodeURIComponent(nodeId)}`;
  }
  const node = getMapNode(nodeId);
  if (!node) {
    return "/game/map.html";
  }

  return ["camp", "event", "forge", "shop"].includes(node.kind)
    ? `/game/event2.html?node=${encodeURIComponent(nodeId)}`
    : `/game/story2.html?node=${encodeURIComponent(nodeId)}`;
}

export function requireCampaignNode(nodeId, { allowCompleted = false } = {}) {
  const profile = getCampaign();
  const run = profile.run;
  if (allowCompleted && run.records[nodeId]) {
    return true;
  }
  if (
    !getMapNode(nodeId) ||
    run.ending ||
    !run.progress.available.includes(nodeId)
  ) {
    location.replace("/game/map.html");

    return false;
  }
  if (run.pendingBattle && !location.pathname.includes("settlement")) {
    location.replace(
      `/game/settlement.html?node=${encodeURIComponent(run.pendingBattle.nodeId)}`,
    );

    return false;
  }
  if (
    location.pathname.includes("battle") &&
    ["camp", "event", "forge", "shop"].includes(getMapNode(nodeId).kind)
  ) {
    location.replace(getNodeEntry(nodeId));

    return false;
  }
  run.progress.current = nodeId;
  run.progress.available = [nodeId];
  save(profile);

  return true;
}

export function saveBattleState(nodeId, state) {
  const profile = getCampaign();
  if (
    profile.run.progress.current !== nodeId ||
    profile.run.ending ||
    profile.run.pendingBattle
  ) {
    return;
  }
  profile.run.battle = { nodeId, state };
  save(profile);
}

export function clearBattleState() {
  const profile = getCampaign();
  profile.run.battle = null;
  save(profile);
}

function randomOptions(run, key, pool, count = 3) {
  let seed = run.seed;
  for (const character of key) {
    seed = Math.imul(seed ^ character.charCodeAt(0), 16_777_619) >>> 0;
  }

  return new Random(seed)
    .shuffled(pool)
    .slice(0, count)
    .map((entry) => entry.id);
}

function unlock(profile, id, side = "player") {
  profile.codex = [...new Set([...profile.codex, `${side}:${id}`])];
}

function endRun(profile, ending) {
  profile.run.ending = ending;
  profile.endings = [...new Set([...(profile.endings ?? []), ending])];
}

function advance(profile, nodeId) {
  const run = profile.run;
  const progress = run.progress;
  progress.completed = [...new Set([...progress.completed, nodeId])];
  let next = MAP_ROUTES.filter(([from]) => from === nodeId).map(([, to]) => to);
  if (nodeId === "node-6") {
    if (run.choices.lord === "loyal") {
      endRun(profile, "loyalty");
    } else if (
      run.choices.knight !== "spare" ||
      run.choices.temple !== "protect"
    ) {
      endRun(profile, "unresolved");
    }
  }
  if (nodeId === "node-7") {
    endRun(profile, "justice");
  }
  if (run.ending) {
    next = [];
  }
  progress.available = next;
  progress.current = next[0] ?? nodeId;
  progress.unlocked = [...new Set([...progress.unlocked, ...next])];
}

function finishSettlement(profile) {
  const run = profile.run;
  const pending = run.pendingBattle;
  if (
    !pending ||
    !pending.storyResolved ||
    !pending.rewardResolved ||
    !pending.oathResolved
  ) {
    return;
  }
  run.records[pending.nodeId] = { ...pending };
  run.pendingBattle = null;
  advance(profile, pending.nodeId);
}

export function recordBattleResult(nodeId, result, summary = {}) {
  const profile = getCampaign();
  const run = profile.run;
  if (
    run.progress.current !== nodeId ||
    run.ending ||
    run.pendingBattle ||
    run.records[nodeId]
  ) {
    return run;
  }
  const node = getMapNode(nodeId);
  if (!["defeat", "draw", "peaceful", "victory"].includes(result)) {
    throw new Error("Unknown battle result");
  }
  if (Number.isFinite(summary.health)) {
    run.health = Math.max(0, Math.min(run.maxHealth, summary.health));
  }
  for (const instance of run.deck) {
    instance.growth += Math.max(0, summary.growth?.[instance.instanceId] ?? 0);
  }
  run.battle = null;
  for (const enemy of CHAPTER_ENEMY_CARDS[nodeId] ?? []) {
    unlock(profile, typeof enemy === "string" ? enemy : enemy.id, "enemy");
  }
  if ((result === "defeat" || result === "draw") && nodeId !== "node-4") {
    run.records[nodeId] = { nodeId, result };
    endRun(profile, nodeId === "node-7" ? "tragedy" : "fallen");

    return save(profile);
  }
  const rewardNeeded = node.kind !== "peaceful";
  const ashesReward =
    node.kind === "elite"
      ? 35
      : nodeId === "node-3" || nodeId === "node-6" || nodeId === "node-7"
        ? 40
        : rewardNeeded
          ? 20
          : 0;
  run.pendingBattle = {
    nodeId,
    result,
    ashesReward,
    storyResolved: !node.choices?.length,
    choiceId: null,
    rewardOptions: rewardNeeded
      ? randomOptions(run, nodeId, GENERATABLE_CARDS)
      : [],
    rewardResolved: !rewardNeeded,
    rewardId: null,
    rerolls: 0,
    oathOptions:
      nodeId === "node-3" && !run.oath
        ? OATHS.map((oath) => oath.id).slice(0, 3)
        : [],
    oathResolved: nodeId !== "node-3" || !!run.oath,
  };
  run.ashes += ashesReward;
  if (node.kind === "elite") {
    const relicId = randomOptions(
      run,
      nodeId,
      RELICS.filter((relic) => !run.relics.includes(relic.id)),
      1,
    )[0];
    if (relicId) {
      run.relics.push(relicId);
      run.pendingBattle.relicId = relicId;
    }
  }

  return save(profile);
}

export function settleChapter(nodeId, choiceId) {
  const profile = getCampaign();
  const run = profile.run;
  const pending = run.pendingBattle;
  if (!pending || pending.nodeId !== nodeId || pending.storyResolved) {
    return run;
  }
  const choice = getMapNode(nodeId).choices.find(
    (entry) => entry.id === choiceId,
  );
  if (
    !choice ||
    (nodeId === "node-5" &&
      pending.result === "victory" &&
      choiceId === "protect")
  ) {
    return run;
  }
  if (CHOICE_KEYS[nodeId]) {
    run.choices[CHOICE_KEYS[nodeId]] = choiceId;
  }
  if (choice.rewardId) {
    addCard(run, choice.rewardId, choice.rewardUpgrade ?? null);
    unlock(profile, choice.rewardId);
  }
  const ashes = choice.bonus?.ashes ?? 0;
  const health = Math.min(choice.bonus?.heal ?? 0, run.maxHealth - run.health);
  run.ashes += ashes;
  run.health += health;
  pending.storyReward = {
    cardId: choice.rewardId,
    upgrade: choice.rewardUpgrade ?? null,
    ashes,
    health,
  };
  run.rewards[nodeId] = choice.rewardId;
  pending.storyResolved = true;
  pending.choiceId = choiceId;
  finishSettlement(profile);

  return save(profile);
}

export function chooseBattleReward(cardId) {
  const profile = getCampaign();
  const pending = profile.run.pendingBattle;
  if (!pending || pending.rewardResolved || !pending.storyResolved) {
    return profile.run;
  }
  if (cardId !== null && !pending.rewardOptions.includes(cardId)) {
    return profile.run;
  }
  if (cardId) {
    addCard(profile.run, cardId);
    unlock(profile, cardId);
  } else {
    profile.run.ashes += 12;
  }
  pending.rewardId = cardId;
  pending.rewardResolved = true;
  finishSettlement(profile);

  return save(profile);
}

export function rerollBattleReward() {
  const profile = getCampaign();
  const run = profile.run;
  const pending = run.pendingBattle;
  if (
    !pending ||
    !pending.storyResolved ||
    pending.rewardResolved ||
    run.ashes < 10
  ) {
    return run;
  }
  run.ashes -= 10;
  pending.rerolls += 1;
  pending.rewardOptions = randomOptions(
    run,
    `${pending.nodeId}:${pending.rerolls}`,
    GENERATABLE_CARDS,
  );

  return save(profile);
}

export function chooseOath(oathId) {
  const profile = getCampaign();
  const run = profile.run;
  const pending = run.pendingBattle;
  if (
    !pending ||
    !pending.rewardResolved ||
    pending.oathResolved ||
    run.oath ||
    !pending.oathOptions.includes(oathId)
  ) {
    return run;
  }
  run.oath = oathId;
  pending.oathResolved = true;
  finishSettlement(profile);

  return save(profile);
}

export function getService(nodeId) {
  const profile = getCampaign();
  const run = profile.run;
  if (!run.services[nodeId]) {
    run.services[nodeId] = {
      cards: randomOptions(run, nodeId, GENERATABLE_CARDS),
      bought: [],
      used: false,
      relicId: randomOptions(
        run,
        nodeId,
        RELICS.filter((relic) => !run.relics.includes(relic.id)),
        1,
      )[0],
    };
    save(profile);
  }

  return run.services[nodeId];
}

export function useService(nodeId, action, options = {}) {
  const profile = getCampaign();
  const run = profile.run;
  const node = getMapNode(nodeId);
  const service = run.services[nodeId];
  if (
    !service ||
    !["camp", "event", "forge", "shop"].includes(node?.kind) ||
    run.ending ||
    run.progress.current !== nodeId ||
    run.pendingBattle ||
    run.progress.completed.includes(nodeId)
  ) {
    return { ok: false, reason: "此节点不能进行旅途服务。" };
  }
  function spend(amount) {
    if (run.ashes < amount) {
      return false;
    }
    run.ashes -= amount;

    return true;
  }
  const before = {
    health: run.health,
    ashes: run.ashes,
    deckCount: run.deck.length,
  };
  const cardId =
    options.cardId ??
    run.deck.find((card) => card.instanceId === options.instanceId)?.cardId;
  if (action === "leave") {
    advance(profile, nodeId);
  } else if (action === "buy" && node.kind === "shop") {
    if (
      !service.cards.includes(options.cardId) ||
      service.bought.includes(options.cardId)
    ) {
      return { ok: false, reason: "这张牌已售出。" };
    }
    if (!spend(25)) {
      return { ok: false, reason: "需要 25 灰烬。" };
    }
    addCard(run, options.cardId);
    unlock(profile, options.cardId);
    service.bought.push(options.cardId);
  } else if (action === "relic" && node.kind === "shop") {
    if (!service.relicId || run.relics.includes(service.relicId)) {
      return { ok: false, reason: "战具已售出。" };
    }
    if (!spend(60)) {
      return { ok: false, reason: "需要 60 灰烬。" };
    }
    run.relics.push(service.relicId);
  } else if (action === "remove" && node.kind === "shop") {
    if (run.deck.length <= 5) {
      return { ok: false, reason: "牌组至少保留 5 张牌。" };
    }
    if (!run.deck.some((card) => card.instanceId === options.instanceId)) {
      return { ok: false, reason: "请先选择一张牌。" };
    }
    if (!spend(35)) {
      return { ok: false, reason: "需要 35 灰烬。" };
    }
    run.deck = run.deck.filter(
      (card) => card.instanceId !== options.instanceId,
    );
  } else if (action === "heal" && node.kind === "shop") {
    if (run.health === run.maxHealth) {
      return { ok: false, reason: "圣焰已满。" };
    }
    if (!spend(20)) {
      return { ok: false, reason: "需要 20 灰烬。" };
    }
    run.health = Math.min(run.maxHealth, run.health + 8);
  } else if (action === "upgrade" && node.kind === "forge") {
    const card = run.deck.find(
      (entry) => entry.instanceId === options.instanceId,
    );
    if (
      !card ||
      card.upgrade ||
      !["command", "unit"].includes(options.upgrade)
    ) {
      return { ok: false, reason: "请选择尚未升级的具体卡牌与分支。" };
    }
    if (!spend(30)) {
      return { ok: false, reason: "需要 30 灰烬。" };
    }
    card.upgrade = options.upgrade;
  } else if (
    ["rest", "scavenge"].includes(action) &&
    node.kind === "camp" &&
    !service.used
  ) {
    if (action === "rest") {
      run.health = Math.min(
        run.maxHealth,
        run.health + Math.ceil(run.maxHealth * 0.35),
      );
    } else {
      run.ashes += 20;
    }
    service.used = true;
  } else if (
    ["open", "respect"].includes(action) &&
    node.kind === "event" &&
    !service.used
  ) {
    if (action === "open") {
      if (run.health <= 4) {
        return { ok: false, reason: "开启遗匣需要保留至少 1 点圣焰。" };
      }
      run.health -= 4;
      run.ashes += 40;
    } else {
      run.health = Math.min(run.maxHealth, run.health + 4);
    }
    service.used = true;
  } else {
    return { ok: false, reason: "这里不能进行这个操作。" };
  }
  if (action !== "leave") {
    service.lastAction = {
      action,
      options: { ...options, cardId },
      before,
      after: {
        health: run.health,
        ashes: run.ashes,
        deckCount: run.deck.length,
      },
    };
  }
  save(profile);

  return { ok: true };
}
