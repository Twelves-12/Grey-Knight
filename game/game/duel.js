/**
 * 扣除双方生命，按出手顺序返回命中快照和存活者的溢伤
 *
 * @param {import("../types.js").Unit} player
 * @param {import("../types.js").Unit} enemy
 */
export function resolveDuel(
  player,
  enemy,
  { playerAttack, enemyAttack, playerCanAttack, enemyCanAttack, absorb },
) {
  const playerHasFirstStrike =
    player.def.keyword === "firstStrike" || player.temporaryFirstStrike;
  const enemyHasFirstStrike =
    enemy.def.keyword === "firstStrike" || enemy.temporaryFirstStrike;
  // 无人或双方均有先手时，玩家优先
  const playerStrikesFirst = playerHasFirstStrike || !enemyHasFirstStrike;
  const first = playerStrikesFirst ? player : enemy;
  const second = playerStrikesFirst ? enemy : player;
  const firstSide = playerStrikesFirst ? "player" : "enemy";
  const secondSide = playerStrikesFirst ? "enemy" : "player";

  const firstCanAttack = playerStrikesFirst ? playerCanAttack : enemyCanAttack;
  const secondCanAttack = playerStrikesFirst ? enemyCanAttack : playerCanAttack;
  const firstAttack = playerStrikesFirst ? playerAttack : enemyAttack;
  const secondAttack = playerStrikesFirst ? enemyAttack : playerAttack;
  const hits =
    firstCanAttack && firstAttack > 0
      ? [strike(second, firstSide, absorb(second, firstAttack, secondSide))]
      : [];

  // 只有一边有先手时，才提前结算是否死亡，否则正常进行
  const exclusiveFirstStrike = playerHasFirstStrike !== enemyHasFirstStrike;
  if (
    secondCanAttack &&
    secondAttack > 0 &&
    (!exclusiveFirstStrike || second.hp > 0)
  ) {
    hits.push(
      strike(first, secondSide, absorb(first, secondAttack, firstSide)),
    );
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
function strike(defender, side, amount) {
  defender.hp -= amount;

  return { amount, lethal: defender.hp <= 0, side, targetHp: defender.hp };
}
