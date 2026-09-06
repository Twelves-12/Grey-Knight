/**
 * 扣除双方生命，按出手顺序返回命中快照和存活者的溢伤
 *
 * @param {import("../types.js").Unit} player
 * @param {import("../types.js").Unit} enemy
 */
export function resolveDuel(player, enemy) {
  const playerHasFirstStrike = player.def.keyword === "firstStrike";
  const enemyHasFirstStrike = enemy.def.keyword === "firstStrike";
  // 无人或双方均有先手时，玩家优先
  const playerStrikesFirst = playerHasFirstStrike || !enemyHasFirstStrike;
  const first = playerStrikesFirst ? player : enemy;
  const second = playerStrikesFirst ? enemy : player;
  const firstSide = playerStrikesFirst ? "player" : "enemy";
  const secondSide = playerStrikesFirst ? "enemy" : "player";

  const hits = [strike(first, second, firstSide)];

  // 只有一边有先手时，才提前结算是否死亡，否则正常进行
  const exclusiveFirstStrike = playerHasFirstStrike !== enemyHasFirstStrike;
  if (!exclusiveFirstStrike || second.hp > 0) {
    hits.push(strike(second, first, secondSide));
  }

  return {
    hits,
    playerOverflow: player.hp > 0 ? Math.max(0, -enemy.hp) : 0,
    enemyOverflow: enemy.hp > 0 ? Math.max(0, -player.hp) : 0,
  };
}

/**
 * @param {import("../types.js").Unit} attacker
 * @param {import("../types.js").Unit} defender
 * @param {import("../types.js").Side} side
 * @returns {import("../types.js").Hit}
 */
function strike(attacker, defender, side) {
  const amount = attacker.def.attack;
  defender.hp -= amount;

  return { amount, lethal: defender.hp <= 0, side, targetHp: defender.hp };
}
