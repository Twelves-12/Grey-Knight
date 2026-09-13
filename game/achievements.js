import { ACHIEVEMENTS } from "./content/achievements.js";
import { getProfile, setProfile } from "./kv.js";

const BOSS_IDS = ["node-3", "node-6", "node-7"];

function ensureAchievements(profile) {
  if (!profile.achievements) {
    profile.achievements = {
      unlocked: [],
      progress: {},
    };
  }
  return profile.achievements;
}

export function initAchievements() {
  const profile = getProfile();
  ensureAchievements(profile);
  setProfile(profile);
  return profile.achievements;
}

function _unlock(achievements, achievementId) {
  if (!achievements.unlocked.includes(achievementId)) {
    achievements.unlocked = [...achievements.unlocked, achievementId];
    return true;
  }
  return false;
}

function _checkProgress(achievements) {
  for (const def of ACHIEVEMENTS) {
    if (
      def.progress &&
      (achievements.progress[def.progress.key] ?? 0) >= def.progress.target
    ) {
      _unlock(achievements, def.id);
    }
  }
}

export function checkBattleAchievements(profile, summary) {
  const achievements = ensureAchievements(profile);
  const run = profile.run;
  const totalBattlesWon = (achievements.progress.battlesWon ?? 0) + 1;
  achievements.progress.battlesWon = totalBattlesWon;
  _checkProgress(achievements);

  _unlock(achievements, "first-victory");

  const nodeId = run.progress.current;
  if (BOSS_IDS.includes(nodeId)) {
    _unlock(achievements, "boss-slayer");
    if (summary.heroDamageTaken === 0) {
      _unlock(achievements, "flawless-victory");
    }
    if ((summary.health ?? run.health) === run.maxHealth) {
      _unlock(achievements, "full-health-boss");
    }
  }
}

export function checkStoryAchievements(profile, nodeId, choiceId) {
  const achievements = ensureAchievements(profile);
  const run = profile.run;

  if (nodeId === "node-1" && choiceId === "recruit") {
    _unlock(achievements, "mercy-bandit");
  }
  if (nodeId === "node-2" && choiceId === "ledger-guard") {
    _unlock(achievements, "truth-seeker");
  }
  if (nodeId === "node-3" && choiceId === "dig-grave") {
    _unlock(achievements, "grave-digger");
  }
  if (nodeId === "node-5" && choiceId === "protect") {
    _unlock(achievements, "protect-innocent");
  }
  if (nodeId === "node-6" && choiceId === "confront") {
    _unlock(achievements, "face-the-lord");
  }
  if (run.oath) {
    _unlock(achievements, "oath-keeper");
  }
}

export function checkEndingAchievements(profile, ending) {
  const achievements = ensureAchievements(profile);

  const endingAchievements = {
    justice: "justice-ending",
    loyalty: "loyalty-ending",
    tragedy: "tragedy-ending",
    fallen: "fallen-ending",
  };

  const achievementId = endingAchievements[ending];
  if (achievementId) {
    _unlock(achievements, achievementId);
  }

  achievements.progress.endings = (profile.endings ?? []).length;
  _checkProgress(achievements);
}

export function checkCollectionAchievements(profile) {
  const achievements = ensureAchievements(profile);

  if (profile.run.relics.length >= 3) {
    _unlock(achievements, "three-relics");
  }
}

export function checkSpendingAchievements(profile, totalSpent) {
  const achievements = ensureAchievements(profile);

  achievements.progress.maxAshesSpent = Math.max(
    achievements.progress.maxAshesSpent ?? 0,
    totalSpent,
  );
  _checkProgress(achievements);
  if (totalSpent >= 200) {
    _unlock(achievements, "rich-merchant");
  }
}