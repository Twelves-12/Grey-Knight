/**
 * 扣除双方生命，按出手顺序返回命中快照和存活者的溢伤
 *
 * @param {import("../types.js").Unit} player
 * @param {import("../types.js").Unit} enemy
 */
export function resolveDuel(player, enemy) {
  const enemyFirst =
    enemy.def.keyword === "firstStrike" && player.def.keyword !== "firstStrike";
  const first = enemyFirst ? enemy : player;
  const second = enemyFirst ? player : enemy;
  const firstSide = enemyFirst ? "enemy" : "player";
  const secondSide = enemyFirst ? "player" : "enemy";
  const interrupts =
    first.def.keyword === "firstStrike" && second.def.keyword !== "firstStrike";
  const hits = [strike(first, second, firstSide)];
  if (!interrupts || second.hp > 0) {
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
