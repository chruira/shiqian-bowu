/* ============================================================
 * B 模块 · 战斗引擎（纯逻辑，无 DOM）
 * 规则依据：B任务交接文档 §5「一回合的统一结算」
 * ------------------------------------------------------------
 * 设计约束：
 *   1. 不依赖动画；动画只是消费已经生成的事件；
 *   2. 可复现：无随机数、无暴击、无闪避；
 *   3. 每个事件都带 reasonId，便于「原因解释面板」；
 *   4. 同一生物的数据只维护一份（来自 B.Creatures）。
 * ============================================================ */
(function (B) {
  'use strict';

  var ENGINE_VERSION = 1;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---------------- 单位 ---------------- */
  function makeUnit(creature, side) {
    var s = creature.stats;
    return {
      side: side,
      creatureId: creature.id,
      name: creature.name,
      hp: s.maxHp,
      maxHp: s.maxHp,
      attack: s.attack,
      defense: s.defense,
      speed: s.speed,
      energy: 2,
      maxEnergy: s.maxEnergy || 3,
      basicActionId: creature.basicActionId,
      signatureActionId: creature.signatureActionId,
      traitId: creature.traitId,
      /* 本回合状态 */
      guardAbsorb: 0,
      guardUsed: false,
      traitUsedThisTurn: false,
      enemyAttackMod: 0,
      /* 统计 */
      stat: { dealt: 0, taken: 0, guardCount: 0 }
    };
  }

  /* ---------------- 创建战斗 ---------------- */
  function createBattle(opts) {
    var challenge = B.Challenges.byId[opts.challengeId];
    if (!challenge) throw new Error('未知挑战: ' + opts.challengeId);
    var playerC = B.Creatures.byId[opts.playerCreatureId];
    var enemyC = B.Creatures.byId[opts.opponentId || challenge.opponentId];
    if (!playerC || !enemyC) throw new Error('未知生物');

    /* 兼容性检查：时期 + 栖息地标签（文档 §3.3） */
    if (playerC.eraId !== challenge.eraId) throw new Error('时期不匹配');
    var tags = challenge.allowedTags || [];
    var ok = tags.some(function (t) { return (playerC.habitatTags || []).indexOf(t) >= 0; });
    if (tags.length && !ok) throw new Error('生物与关卡环境不兼容');

    var battleId = 'battle_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e4);
    var state = {
      engineVersion: ENGINE_VERSION,
      battleId: battleId,
      challengeId: challenge.id,
      eraId: challenge.eraId,
      turnLimit: challenge.turnLimit || 6,
      turn: 1,
      phase: 'select',           // select | resolving | over
      firstMover: playerC.stats.speed >= enemyC.stats.speed ? 'player' : 'enemy',
      player: makeUnit(playerC, 'player'),
      enemy: makeUnit(enemyC, 'enemy'),
      intent: null,
      log: [],                   // 事件流（文档 §7）
      events: [],
      outcome: null,
      startedAt: Date.now(),
      knowledgeSeen: []
    };
    // 同速时交替先手：记录本局第一次由谁先手，之后每回合轮换
    state.tieAlternate = (playerC.stats.speed === enemyC.stats.speed);

    pickEnemyIntent(state);
    push(state, { type: 'battle_start', turn: 1, challengeId: challenge.id,
      playerId: playerC.id, enemyId: enemyC.id, turnLimit: state.turnLimit });
    push(state, { type: 'intent', side: 'enemy', category: state.intent.category,
      reasonId: 'intent_public' });
    return state;
  }

  /* ---------------- 事件 ---------------- */
  function push(state, ev) {
    ev.battleId = state.battleId;
    if (ev.turn == null) ev.turn = state.turn;
    state.events.push(ev);
    state.log.push(ev);
    return ev;
  }

  function unit(state, side) { return side === 'player' ? state.player : state.enemy; }
  function foe(state, side) { return side === 'player' ? state.enemy : state.player; }

  /* ---------------- 可用行动 ---------------- */
  function availableActions(state, side) {
    var u = unit(state, side);
    var list = [
      { id: u.basicActionId, action: B.Actions[u.basicActionId], usable: true, why: '' },
      { id: 'guard', action: B.Actions.guard, usable: true, why: '' }
    ];
    if (u.signatureActionId && B.Actions[u.signatureActionId]) {
      var act = B.Actions[u.signatureActionId];
      var usable = u.energy >= act.cost;
      list.push({ id: act.id, action: act, usable: usable,
        why: usable ? '' : '能量不足（需要 ' + act.cost + '）' });
    }
    return list;
  }

  /* ---------------- 电脑行动（文档 §5 最简策略） ---------------- */
  function pickEnemyIntent(state) {
    var e = state.enemy, p = state.player;
    var sig = e.signatureActionId && B.Actions[e.signatureActionId];
    var lowHp = e.hp / e.maxHp <= 0.35;

    var choice;
    if (lowHp && p.energy <= 0) {
      choice = { id: 'guard', category: 'guard' };
    } else if (sig && e.energy >= sig.cost) {
      choice = { id: sig.id, category: 'skill' };
    } else {
      choice = { id: e.basicActionId, category: 'attack' };
    }
    state.intent = { actionId: choice.id, category: choice.category, decidedAtTurn: state.turn };
    return state.intent;
  }

  /* ---------------- 特性条件 ---------------- */
  function applyOwnDamageTrait(state, side, action, damage) {
    var u = unit(state, side);
    var trait = B.Traits[u.traitId];
    if (!trait) return { damage: damage, applied: null };
    if (u.traitUsedThisTurn) return { damage: damage, applied: null };
    var delta = 0, hit = null;
    (trait.effects || []).forEach(function (ef) {
      if (ef.type === 'conditionalModifier' && ef.target === 'ownDamage' && action.kind === 'attack') {
        delta += ef.delta; hit = ef;
      }
    });
    if (!hit) return { damage: damage, applied: null };
    u.traitUsedThisTurn = true;
    return { damage: damage + delta, applied: { traitId: trait.id, name: trait.name, delta: delta,
      reasonId: 'trait_' + trait.id } };
  }

  function applyIncomingTrait(state, side, damage) {
    var u = unit(state, side);
    var trait = B.Traits[u.traitId];
    if (!trait || u.traitUsedThisTurn) return { damage: damage, applied: null };
    var delta = 0, hit = null;
    (trait.effects || []).forEach(function (ef) {
      if (ef.type === 'conditionalModifier' && ef.target === 'incomingDamage') { delta += ef.delta; hit = ef; }
    });
    if (!hit) return { damage: damage, applied: null };
    u.traitUsedThisTurn = true;
    return { damage: Math.max(0, damage + delta), applied: { traitId: trait.id, name: trait.name,
      delta: delta, reasonId: 'trait_' + trait.id } };
  }

  /* ---------------- 单个攻击行动 ---------------- */
  function performAttack(state, side, action) {
    var actor = unit(state, side), target = foe(state, side);

    /* 1) 基础伤害 */
    var base = Math.max(1, actor.attack + (action.power || 0) - target.defense);
    push(state, { type: 'action', side: side, actionId: action.id, actionName: action.name,
      baseDamage: base, reasonId: 'action_' + action.id });

    /* 2) 本回合攻击修正（如剑龙尾刺） */
    var atkMod = actor.enemyAttackMod || 0;
    if (atkMod) {
      base = Math.max(1, base + atkMod);
      push(state, { type: 'modifier', side: side, target: 'damage', delta: atkMod,
        value: base, reasonId: 'mod_enemy_attack' });
    }

    /* 3) 攻击方特性 */
    var own = applyOwnDamageTrait(state, side, action, base);
    if (own.applied) {
      base = own.damage;
      push(state, { type: 'trait', side: side, traitId: own.applied.traitId,
        name: own.applied.name, delta: own.applied.delta, value: base,
        reasonId: own.applied.reasonId });
    }

    /* 4) 受击方特性 */
    var inc = applyIncomingTrait(state, target.side, base);
    if (inc.applied) {
      base = inc.damage;
      push(state, { type: 'trait', side: target.side, traitId: inc.applied.traitId,
        name: inc.applied.name, delta: inc.applied.delta, value: base,
        reasonId: inc.applied.reasonId });
    }

    /* 5) 临时防御 */
    var absorbed = 0;
    if (target.guardAbsorb > 0 && !target.guardUsed) {
      absorbed = Math.min(target.guardAbsorb, base);
      target.guardUsed = true;
      base = base - absorbed;
      push(state, { type: 'guard', side: target.side, absorb: absorbed, value: base,
        reasonId: 'guard_absorb' });
    }

    var final = Math.max(0, base);
    target.hp = clamp(target.hp - final, 0, target.maxHp);
    actor.stat.dealt += final;
    target.stat.taken += final;

    push(state, { type: 'damage', side: side, targetSide: target.side,
      final: final, absorbed: absorbed, hpAfter: target.hp,
      reasonId: 'damage_' + action.id });

    return final;
  }

  /* ---------------- 防御行动 ---------------- */
  function performGuard(state, side, action) {
    var u = unit(state, side);
    u.guardAbsorb = action.absorb || 8;
    u.guardUsed = false;
    u.stat.guardCount++;
    push(state, { type: 'guard_set', side: side, absorb: u.guardAbsorb, reasonId: 'guard_set' });
  }

  /* ---------------- 确认行动合法 ---------------- */
  function validateAction(state, side, actionId) {
    if (state.phase !== 'select') return { ok: false, why: '当前不是选择阶段' };
    var u = unit(state, side);
    if (u.hp <= 0) return { ok: false, why: '已倒下' };
    var all = availableActions(state, side);
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === actionId) {
        if (!all[i].usable) return { ok: false, why: all[i].why };
        return { ok: true, action: all[i].action };
      }
    }
    return { ok: false, why: '未知行动' };
  }

  /* ---------------- 结算一回合（文档 §5 第 4–9 步） ---------------- */
  function resolveTurn(state, playerActionId) {
    if (state.over || state.outcome) return [];
    var v = validateAction(state, 'player', playerActionId);
    if (!v.ok) return [{ type: 'invalid', why: v.why, reasonId: 'invalid' }];

    state.phase = 'resolving';
    state.events = [];

    var pAct = v.action;
    var eIntent = state.intent;
    var eAct = B.Actions[eIntent.actionId] || B.Actions.basic_attack;

    /* 4) 锁定并扣能量 */
    var p = state.player, e = state.enemy;
    p.energy = clamp(p.energy - (pAct.cost || 0), 0, p.maxEnergy);
    e.energy = clamp(e.energy - (eAct.cost || 0), 0, e.maxEnergy);
    push(state, { type: 'locked', turn: state.turn, playerActionId: pAct.id,
      enemyActionId: eAct.id, playerEnergy: p.energy, enemyEnergy: e.energy,
      reasonId: 'lock' });

    /* 5) 先处理防御 */
    var order = [];
    if (pAct.kind === 'guard') { performGuard(state, 'player', pAct); order.push({ side: 'player', act: pAct, attack: false }); }
    else order.push({ side: 'player', act: pAct, attack: true });
    if (eAct.kind === 'guard') { performGuard(state, 'enemy', eAct); order.push({ side: 'enemy', act: eAct, attack: false }); }
    else order.push({ side: 'enemy', act: eAct, attack: true });

    /* 6) 按速度排序；同速交替先手 */
    var speedP = state.player.speed, speedE = state.enemy.speed;
    var attacks = order.filter(function (o) { return o.attack; });
    attacks.sort(function (a, b) {
      var sa = unit(state, a.side).speed, sb = unit(state, b.side).speed;
      if (sa === sb) {
        // 同速：本局先手方优先，之后每回合轮换
        if (state.tieAlternate) {
          var first = (state.turn % 2 === 1) ? state.firstMover : (state.firstMover === 'player' ? 'enemy' : 'player');
          if (a.side === first) return -1;
          if (b.side === first) return 1;
        }
        return a.side === state.firstMover ? -1 : 1;
      }
      return sb - sa;
    });
    push(state, { type: 'order', order: attacks.map(function (o) { return o.side; }),
      reasonId: 'speed_order' });

    /* 7) 依次结算攻击，倒下则不执行后续 */
    for (var i = 0; i < attacks.length; i++) {
      var o = attacks[i];
      if (unit(state, o.side).hp <= 0) {
        push(state, { type: 'cancelled', side: o.side, reasonId: 'dead_cancel' });
        continue;
      }
      if (foe(state, o.side).hp <= 0) {
        push(state, { type: 'cancelled', side: o.side, reasonId: 'target_dead' });
        continue;
      }
      performAttack(state, o.side, o.act);
      if (state.player.hp <= 0 || state.enemy.hp <= 0) break;
    }

    /* 8) 清理回合状态 + 回能 */
    [state.player, state.enemy].forEach(function (u) {
      u.guardAbsorb = 0;
      u.guardUsed = false;
      u.traitUsedThisTurn = false;
      u.enemyAttackMod = 0;
      var before = u.energy;
      u.energy = clamp(u.energy + 1, 0, u.maxEnergy);
      if (u.energy !== before) {
        push(state, { type: 'energy', side: u.side, delta: u.energy - before, after: u.energy,
          reasonId: 'energy_regen' });
      }
    });

    /* 胜负判定 */
    if (state.player.hp <= 0 || state.enemy.hp <= 0) {
      finish(state);
      return state.events;
    }

    /* 9) 回合上限 */
    if (state.turn >= state.turnLimit) {
      finish(state, 'turn_limit');
      return state.events;
    }

    /* 下一回合 */
    state.turn += 1;
    state.phase = 'select';
    pickEnemyIntent(state);
    push(state, { type: 'turn_start', turn: state.turn, reasonId: 'turn_start' });
    push(state, { type: 'intent', side: 'enemy', category: state.intent.category,
      reasonId: 'intent_public' });
    return state.events;
  }

  function finish(state, by) {
    state.phase = 'over';
    var pRatio = state.player.hp / state.player.maxHp;
    var eRatio = state.enemy.hp / state.enemy.maxHp;
    if (state.player.hp <= 0 && state.enemy.hp <= 0) state.outcome = 'draw';
    else if (state.enemy.hp <= 0) state.outcome = 'win';
    else if (state.player.hp <= 0) state.outcome = 'lose';
    else {
      if (Math.abs(pRatio - eRatio) < 1e-9) state.outcome = 'draw';
      else state.outcome = pRatio > eRatio ? 'win' : 'lose';
    }
    state.endedAt = Date.now();
    push(state, { type: 'end', outcome: state.outcome, by: by || 'hp',
      turnCount: state.turn,
      playerHpRatio: +pRatio.toFixed(3), opponentHpRatio: +eRatio.toFixed(3),
      reasonId: 'end_' + (by || 'hp') });
  }

  /* ---------------- 退出 ---------------- */
  function abort(state) {
    if (state.phase === 'over') return [];
    state.phase = 'over';
    state.outcome = 'aborted';
    state.events = [];
    push(state, { type: 'end', outcome: 'aborted', by: 'player_exit',
      turnCount: state.turn,
      playerHpRatio: +(state.player.hp / state.player.maxHp).toFixed(3),
      opponentHpRatio: +(state.enemy.hp / state.enemy.maxHp).toFixed(3),
      reasonId: 'end_aborted' });
    return state.events;
  }

  B.Engine = {
    VERSION: ENGINE_VERSION,
    createBattle: createBattle,
    resolveTurn: resolveTurn,
    abort: abort,
    availableActions: availableActions,
    validateAction: validateAction,
    unit: unit
  };
})(window.B = window.B || {});
