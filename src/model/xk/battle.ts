import { AttackStrategy } from './AttackStrategy';
import { Piece } from './Piece';
import { BuffProcessor, BuffType, DebuffType } from './buff';

// 战斗相关接口定义
interface BattleResult {
  winner: string
  rounds: number
  teamAAlive: number
  teamBAlive: number
  battleLog: string[]
}

interface SkillResult {
  damage: number
  critical: boolean
  combo: boolean
  skillUsed: string
  target: Piece
  attacker: Piece
}

interface Position {
  x: number
  y: number
}

// 棋盘类
class Board {
  width: number;
  height: number;
  grid: (Piece | null)[][];

  constructor(width = 8, height = 8) {
    this.width = width;
    this.height = height;
    this.grid = Array(height)
      .fill(null)
      .map(() => Array(width).fill(null));
  }

  // 放置棋子
  placePiece(piece: Piece, position: Position): boolean {
    if (
      position.x >= 0
      && position.x < this.width
      && position.y >= 0
      && position.y < this.height
    ) {
      if (this.grid[position.y][position.x] === null) {
        this.grid[position.y][position.x] = piece;
        piece.position = position;

        return true;
      }
    }

    return false;
  }

  // 移除棋子
  removePiece(position: Position): Piece | null {
    if (
      position.x >= 0
      && position.x < this.width
      && position.y >= 0
      && position.y < this.height
    ) {
      const piece = this.grid[position.y][position.x];

      this.grid[position.y][position.x] = null;

      return piece;
    }

    return null;
  }

  // 获取棋子
  getPiece(position: Position): Piece | null {
    if (
      position.x >= 0
      && position.x < this.width
      && position.y >= 0
      && position.y < this.height
    ) {
      return this.grid[position.y][position.x];
    }

    return null;
  }

  // 计算距离
  calculateDistance(pos1: Position, pos2: Position): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  // 获取所有棋子
  getAllPieces(): Piece[] {
    const pieces: Piece[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x]) {
          pieces.push(this.grid[y][x]);
        }
      }
    }

    return pieces;
  }

  // 获取敌方棋子
  getEnemyPieces(team: string): Piece[] {
    return this.getAllPieces().filter(piece => piece.team !== team);
  }

  // 获取友方棋子
  getFriendlyPieces(team: string): Piece[] {
    return this.getAllPieces().filter(piece => piece.team === team);
  }
}

// 战斗管理器
class BattleManager {
  teamA: Piece[];
  teamB: Piece[];
  board: Board;
  battleLog: string[];
  maxRounds: number;
  currentRound: number;

  constructor(teamA: Piece[], teamB: Piece[], boardWidth = 8, boardHeight = 8) {
    this.teamA = teamA;
    this.teamB = teamB;
    this.board = new Board(boardWidth, boardHeight);
    this.battleLog = [];
    this.maxRounds = 50;
    this.currentRound = 0;

    this.initializeBoard();
  }

  // 初始化棋盘
  initializeBoard(): void {
    // 清空棋盘
    this.board = new Board(this.board.width, this.board.height);

    // 放置A队棋子（左侧）
    this.teamA.forEach((piece, index) => {
      const position = { x: 0, y: index * 2 };

      this.board.placePiece(piece, position);
    });

    // 放置B队棋子（右侧）
    this.teamB.forEach((piece, index) => {
      const position = { x: this.board.width - 1, y: index * 2 };

      this.board.placePiece(piece, position);
    });

    this.battleLog.push('棋盘初始化完成');
  }

  // 开始战斗
  async startBattle(): Promise<BattleResult> {
    this.battleLog = ['战斗开始！'];
    this.currentRound = 0;

    while (this.currentRound < this.maxRounds) {
      this.currentRound++;
      this.battleLog.push(`=== 第 ${this.currentRound} 回合 ===`);

      // 处理行动条
      const actionOrder = this.calculateActionOrder();

      for (const piece of actionOrder) {
        if (piece.isAlive) {
          await this.processPieceTurn(piece);
        }

        // 检查战斗是否结束
        const battleResult = this.checkBattleEnd();

        if (battleResult) {
          this.battleLog.push(`战斗结束！胜利队伍：${battleResult.winner}`);

          return battleResult;
        }
      }

      // 更新buff/debuff持续时间
      this.updateBuffDebuffDurations();

      // 恢复真气
      this.recoverEnergy();
    }

    // 达到最大回合数，平局
    this.battleLog.push('战斗达到最大回合数，平局！');

    return {
      winner: 'draw',
      rounds: this.currentRound,
      teamAAlive: this.getAliveCount('A'),
      teamBAlive: this.getAliveCount('B'),
      battleLog: this.battleLog
    };
  }

  // 计算行动顺序
  calculateActionOrder(): Piece[] {
    const allPieces = this.board.getAllPieces().filter(piece => piece.isAlive);

    // 根据速度排序，速度快的先行动
    return allPieces.sort((a, b) => {
      // 考虑buff/debuff对速度的影响
      const aSpeed = a.speed * (1 - this.getSpeedReduction(a));
      const bSpeed = b.speed * (1 - this.getSpeedReduction(b));

      return bSpeed - aSpeed;
    });
  }

  // 获取速度减少效果
  getSpeedReduction(piece: Piece): number {
    let reduction = 0;

    // 减速debuff
    if (BuffProcessor.hasDebuff(piece, DebuffType.SLOW)) {
      reduction += 0.3;
    }

    return Math.min(reduction, 0.8);
  }

  // 处理棋子回合
  async processPieceTurn(piece: Piece): Promise<void> {
    this.battleLog.push(`${piece.name} 开始行动`);

    // 处理buff/debuff效果
    BuffProcessor.processBuffs(piece);

    // 选择目标
    const target = this.selectTarget(piece);

    if (!target) {
      this.battleLog.push(`${piece.name} 没有找到可攻击的目标`);

      return;
    }

    // 使用技能
    const skillResult = await this.useSkill(piece, target);

    if (skillResult) {
      this.battleLog.push(
        `${piece.name} 对 ${target.name} 使用 ${skillResult.skillUsed}，造成 ${skillResult.damage} 点伤害`
        + (skillResult.critical ? ' (暴击！)' : '')
        + (skillResult.combo ? ' (连击！)' : '')
      );

      // 处理伤害
      this.processDamage(target, skillResult.damage);

      // 检查目标是否死亡
      if (!target.isAlive) {
        this.battleLog.push(`${target.name} 被击败！`);
        this.board.removePiece(target.position);
      }
    }

    // 恢复行动条
    piece.actionBar = 0;
  }

  // 选择目标
  selectTarget(piece: Piece): Piece | null {
    const enemyPieces = this.board.getEnemyPieces(piece.team);

    if (enemyPieces.length === 0) { return null; }

    switch (piece.attackStrategy) {
      case AttackStrategy.NEAREST:
        return this.findNearestTarget(piece, enemyPieces);
      case AttackStrategy.FARTHEST:
        return this.findFarthestTarget(piece, enemyPieces);
      case AttackStrategy.HIGHEST_HP:
        return this.findHighestHpTarget(enemyPieces);
      case AttackStrategy.LOWEST_HP:
        return this.findLowestHpTarget(enemyPieces);
      case AttackStrategy.FASTEST:
        return this.findFastestTarget(enemyPieces);
      case AttackStrategy.SLOWEST:
        return this.findSlowestTarget(enemyPieces);
      default:
        return enemyPieces[0];
    }
  }

  // 各种目标选择策略的实现
  findNearestTarget(piece: Piece, enemies: Piece[]): Piece | null {
    let nearest: Piece | null = null;
    let minDistance = Infinity;

    for (const enemy of enemies) {
      const distance = this.board.calculateDistance(piece.position, enemy.position);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = enemy;
      }
    }

    return nearest;
  }

  findFarthestTarget(piece: Piece, enemies: Piece[]): Piece | null {
    let farthest: Piece | null = null;
    let maxDistance = -1;

    for (const enemy of enemies) {
      const distance = this.board.calculateDistance(piece.position, enemy.position);

      if (distance > maxDistance) {
        maxDistance = distance;
        farthest = enemy;
      }
    }

    return farthest;
  }

  findHighestHpTarget(enemies: Piece[]): Piece | null {
    return enemies.reduce((max, enemy) => (enemy.hp > max.hp ? enemy : max), enemies[0]);
  }

  findLowestHpTarget(enemies: Piece[]): Piece | null {
    return enemies.reduce((min, enemy) => (enemy.hp < min.hp ? enemy : min), enemies[0]);
  }

  findFastestTarget(enemies: Piece[]): Piece | null {
    return enemies.reduce((fastest, enemy) => (enemy.speed > fastest.speed ? enemy : fastest), enemies[0]);
  }

  findSlowestTarget(enemies: Piece[]): Piece | null {
    return enemies.reduce((slowest, enemy) => (enemy.speed < slowest.speed ? enemy : slowest), enemies[0]);
  }

  // 使用技能
  async useSkill(attacker: Piece, target: Piece): Promise<SkillResult | null> {
    if (attacker.skills.length === 0) {
      // 使用普通攻击
      return this.useBasicAttack(attacker, target);
    }

    // 选择技能（这里简单选择第一个技能）
    const skill = attacker.skills[0];

    // 检查真气是否足够
    if (!attacker.consumeEnergy(skill.energyCost || 0)) {
      this.battleLog.push(`${attacker.name} 真气不足，无法使用技能`);

      return this.useBasicAttack(attacker, target);
    }

    // 计算伤害
    const damage = this.calculateSkillDamage(attacker, target, skill);
    const critical = this.checkCritical(attacker);
    const combo = this.checkCombo(attacker);

    return {
      damage: critical ? damage * attacker.critDamage : damage,
      critical,
      combo,
      skillUsed: skill.name,
      target,
      attacker
    };
  }

  // 使用普通攻击
  useBasicAttack(attacker: Piece, target: Piece): SkillResult {
    const damage = this.calculateBasicDamage(attacker, target);
    const critical = this.checkCritical(attacker);
    const combo = this.checkCombo(attacker);

    return {
      damage: critical ? damage * attacker.critDamage : damage,
      critical,
      combo,
      skillUsed: '普通攻击',
      target,
      attacker
    };
  }

  // 计算基础伤害
  calculateBasicDamage(attacker: Piece, target: Piece): number {
    let damage = attacker.attack;

    // 考虑防御
    damage = Math.max(1, damage - target.defense);

    // 考虑忽视防御
    damage = damage * (1 + attacker.ignoreDefenseRate);

    // 考虑命中率
    if (Math.random() > attacker.hitRate) {
      return 0; // 未命中
    }

    // 考虑闪避
    if (Math.random() < target.dodgeRate) {
      return 0; // 被闪避
    }

    return Math.max(1, Math.floor(damage));
  }

  // 计算技能伤害
  calculateSkillDamage(attacker: Piece, target: Piece, skill: any): number {
    let damage = this.calculateBasicDamage(attacker, target);

    // 技能倍率（这里简单设为1.5倍）
    damage *= 1.5;

    return Math.max(1, Math.floor(damage));
  }

  // 检查暴击
  checkCritical(attacker: Piece): boolean {
    return Math.random() < attacker.critRate;
  }

  // 检查连击
  checkCombo(attacker: Piece): boolean {
    return Math.random() < attacker.comboRate;
  }

  // 处理伤害
  processDamage(target: Piece, damage: number): void {
    target.hp = Math.max(0, target.hp - damage);

    if (target.hp <= 0) {
      target.isAlive = false;
      target.hp = 0;
    }
  }

  // 更新buff/debuff持续时间
  updateBuffDebuffDurations(): void {
    const allPieces = this.board.getAllPieces();

    allPieces.forEach(piece => {
      BuffProcessor.updateDurations(piece);
    });
  }

  // 恢复真气
  recoverEnergy(): void {
    const allPieces = this.board.getAllPieces();

    allPieces.forEach(piece => {
      if (piece.isAlive) {
        piece.recoverEnergy();
      }
    });
  }

  // 检查战斗是否结束
  checkBattleEnd(): BattleResult | null {
    const teamAAlive = this.getAliveCount('A');
    const teamBAlive = this.getAliveCount('B');

    if (teamAAlive === 0) {
      return {
        winner: 'B',
        rounds: this.currentRound,
        teamAAlive: 0,
        teamBAlive: teamBAlive,
        battleLog: this.battleLog
      };
    }

    if (teamBAlive === 0) {
      return {
        winner: 'A',
        rounds: this.currentRound,
        teamAAlive: teamAAlive,
        teamBAlive: 0,
        battleLog: this.battleLog
      };
    }

    return null;
  }

  // 获取存活数量
  getAliveCount(team: string): number {
    const pieces = team === 'A' ? this.teamA : this.teamB;

    return pieces.filter(piece => piece.isAlive).length;
  }
}

// 导出战斗管理器
const startBattle = async (teamA: Piece[], teamB: Piece[]): Promise<BattleResult> => {
  const battleManager = new BattleManager(teamA, teamB);

  return await battleManager.startBattle();
};

export { BattleManager, startBattle, BattleResult, SkillResult, Position, Board };
