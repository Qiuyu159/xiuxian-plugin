import { Piece } from './Piece/res';
import { AttackStrategy } from './AttackStrategy/res';
import { BuffProcessor } from './buff/res';
import { getTeamA, getTeamB } from './user/res';

// 棋盘接口
interface Board {
    width: number;
    height: number;
    grid: (Piece | null)[][];
}

// 行动条项接口
interface ActionBarItem {
    piece: Piece;
    value: number;
    speed: number;
}

// 技能结果接口
interface SkillResult {
    hits?: number;
    swordMasteryBonus?: boolean;
    poisonDuration?: number;
    poisonDamage?: number;
}

// 天赋效果接口
interface TianfuEffect {
    [key: string]: string;
}

// 天赋接口
interface Tianfu {
    quality: string;
    effects: TianfuEffect;
}

// 技能接口
interface Skill {
    name: string;
    type: string;
    range: number;
    energyCost: number;
    execute(attacker: Piece, target: Piece): SkillResult;
}

// 战斗管理器类
export class BattleManager {
    private board: Board | null = null;
    private pieces: Piece[] = [];
    private round: number = 0;
    private maxRounds: number = 100;
    private actionBars: ActionBarItem[] = [];
    private isBattleOver: boolean = false;
    private winner: string | null = null;
    private teamA: Piece[];
    private teamB: Piece[];

    constructor() {
        this.teamA = getTeamA();
        this.teamB = getTeamB();
        this.pieces = [...this.teamA, ...this.teamB];
    }

    // 创建棋盘
    createBoard(width: number = 5, height: number = 5): Board {
        this.board = {
            width: width,
            height: height,
            grid: Array(height).fill(null).map(() => Array(width).fill(null))
        };
        return this.board;
    }

    // 开始战斗
    startBattle(): string | null {
        console.log('=== 战斗开始 ===');

        // 创建棋盘
        this.createBoard();

        // 放置角色到棋盘
        this.placePiecesOnBoard();

        // 应用助战BUFF
        this.applySupportBuffsOptimized();

        // 初始化行动条
        this.initializeActionBars();

        // 开始战斗循环
        this.battleLoopOptimized();

        return this.winner;
    }

    // 放置角色到棋盘
    private placePiecesOnBoard(): void {
        this.pieces.forEach(piece => {
            const { x, y } = piece.position;
            if (x >= 0 && x < this.board!.width && y >= 0 && y < this.board!.height) {
                this.board!.grid[y][x] = piece;
            }
        });
    }

    // 应用助战BUFF
    private applySupportBuffsOptimized(): void {
        // 检查队伍配置
        const hasAssassin = this.teamA.some(piece => piece.type === 'assassin');
        const hasSwordsman = this.teamB.some(piece => piece.type === 'swordsman');

        if (hasAssassin) {
            // 刺客助战BUFF：轻盈+10
            this.teamA.forEach(piece => {
                BuffProcessor.applyBuff(piece, 'agile', 10, 999);
            });
            console.log('A队获得刺客助战BUFF：轻盈+10');
        }

        if (hasSwordsman) {
            // 剑客助战BUFF：强壮+10
            this.teamB.forEach(piece => {
                BuffProcessor.applyBuff(piece, 'strong', 10, 999);
            });
            console.log('B队获得剑客助战BUFF：强壮+10');
        }
    }

    // 初始化行动条
    private initializeActionBars(): void {
        this.actionBars = this.pieces.map(piece => ({
            piece: piece,
            value: 0,
            speed: piece.speed
        }));
    }

    // 战斗循环
    private battleLoopOptimized(): void {
        while (this.round < this.maxRounds && !this.isBattleOver) {
            this.round++;
            console.log(`\n=== 第${this.round}回合开始 ===`);

            // 回合开始处理
            this.processRoundStart();

            // 执行回合
            this.executeRound();

            // 回合结束处理
            this.processRoundEnd();

            // 检查战斗是否结束
            this.checkBattleEnd();

            if (this.isBattleOver) {
                break;
            }
        }

        if (!this.isBattleOver) {
            console.log('战斗超时，平局！');
            this.winner = 'DRAW';
        }
    }

    // 回合开始处理
    private processRoundStart(): void {
        // 所有角色恢复真气
        this.pieces.forEach(piece => {
            if (piece.isAlive) {
                const recovery = piece.recoverEnergy();
                if (recovery > 0) {
                    console.log(`${piece.name} 恢复真气 ${recovery}`);
                }
            }
        });

        // 处理buff/debuff效果
        this.pieces.forEach(piece => {
            if (piece.isAlive) {
                BuffProcessor.processBuffs(piece);
            }
        });
    }

    // 执行回合
    private executeRound(): void {
        // 更新行动条
        this.actionBars.forEach(actionBar => {
            if (actionBar.piece.isAlive) {
                actionBar.value += actionBar.speed;
            }
        });

        // 按行动条值排序
        this.actionBars.sort((a, b) => b.value - a.value);

        // 执行行动
        let actionsExecuted = 0;
        for (const actionBar of this.actionBars) {
            if (actionBar.piece.isAlive && actionBar.value >= 100) {
                this.executeAction(actionBar.piece);
                actionBar.value -= 100;
                actionsExecuted++;

                // 每回合最多执行5次行动
                if (actionsExecuted >= 5) {
                    break;
                }
            }
        }

        console.log(`本回合执行了 ${actionsExecuted} 次行动`);
    }

    // 执行角色行动
    private executeAction(piece: Piece): void {
        console.log(`${piece.name} 开始行动`);

        // 选择目标
        const target = this.selectTarget(piece);
        if (!target) {
            console.log(`${piece.name} 没有找到目标，跳过行动`);
            return;
        }

        // 执行技能
        this.executeActionWithSkill(piece, target);
    }

    // 选择目标
    private selectTarget(piece: Piece): Piece | null {
        const enemyTeam = piece.team === 'A' ? this.teamB : this.teamA;
        const aliveEnemies = enemyTeam.filter(enemy => enemy.isAlive);

        if (aliveEnemies.length === 0) {
            return null;
        }

        // 根据攻击策略选择目标
        switch (piece.attackStrategy) {
            case AttackStrategy.NEAREST:
                return this.findNearestTarget(piece, aliveEnemies);
            case AttackStrategy.LOWEST_HP:
                return this.findLowestHpTarget(aliveEnemies);
            case AttackStrategy.HIGHEST_THREAT:
                return this.findHighestThreatTarget(aliveEnemies);
            default:
                return aliveEnemies[0];
        }
    }

    // 查找最近目标
    private findNearestTarget(piece: Piece, enemies: Piece[]): Piece {
        let nearestTarget: Piece = enemies[0];
        let minDistance = Infinity;

        enemies.forEach(enemy => {
            const distance = this.calculateDistance(piece.position, enemy.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearestTarget = enemy;
            }
        });

        return nearestTarget;
    }

    // 计算距离
    private calculateDistance(pos1: {x: number, y: number}, pos2: {x: number, y: number}): number {
        return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    }

    // 查找最低血量目标
    private findLowestHpTarget(enemies: Piece[]): Piece {
        return enemies.reduce((lowest, current) => 
            current.hp < lowest.hp ? current : lowest
        );
    }

    // 查找最高威胁目标
    private findHighestThreatTarget(enemies: Piece[]): Piece {
        // 简单实现：选择攻击力最高的目标
        return enemies.reduce((highest, current) => 
            current.attack > highest.attack ? current : highest
        );
    }

    // 执行技能
    private executeActionWithSkill(attacker: Piece, target: Piece): void {
        const skill = attacker.skills[attacker.activeSkillIndex];

        if (!skill) {
            console.log(`${attacker.name} 没有可用技能`);
            return;
        }

        // 检查真气是否足够
        if (!attacker.consumeEnergy(skill.energyCost)) {
            console.log(`${attacker.name} 真气不足，无法使用 ${skill.name}`);
            return;
        }

        console.log(`${attacker.name} 使用技能: ${skill.name}`);

        // 检查目标是否闪避
        if (this.checkDodge(attacker, target)) {
            console.log(`${target.name} 闪避了 ${attacker.name} 的攻击！`);
            return;
        }

        // 执行技能
        const skillResult = skill.execute(attacker, target);

        // 处理技能效果
        this.executeSkillOnTarget(attacker, target, skill, skillResult);

        // 应用天赋特殊效果
        this.applyTianfuSpecialEffects(attacker, target, skill);
    }

    // 执行技能效果
    private executeSkillOnTarget(attacker: Piece, target: Piece, skill: Skill, skillResult: SkillResult): void {
        if (skillResult.hits && skillResult.hits > 1) {
            // 多段攻击
            this.executeMultiHitSkill(attacker, target, skill, skillResult);
        } else {
            // 单次攻击
            this.executeSingleHitSkill(attacker, target, skill, skillResult);
        }
    }

    // 执行多段攻击
    private executeMultiHitSkill(attacker: Piece, target: Piece, skill: Skill, skillResult: SkillResult): void {
        const hits = skillResult.hits || 1;
        console.log(`${attacker.name} 的多段攻击开始，共 ${hits} 次攻击`);

        // 第一次攻击使用原始目标
        let firstTarget = target;
        let baseDamage = 0; // 记录原本的基础伤害

        for (let i = 0; i < hits; i++) {
            // 选择攻击目标：第一次使用原始目标，后续攻击优先攻击同一个目标
            let currentTarget: Piece | null;
            if (i === 0) {
                currentTarget = firstTarget;
            } else {
                // 后续攻击：优先攻击第一个目标，如果第一个目标死亡则选择其他目标
                currentTarget = firstTarget.isAlive ? firstTarget : this.selectTargetBySkillRange(attacker, skill);

                // 如果仍然没有目标，尝试选择任何存活的目标
                if (!currentTarget) {
                    const enemyTeam = attacker.team === 'A' ? this.teamB : this.teamA;
                    const aliveEnemies = enemyTeam.filter(enemy => enemy.isAlive);
                    currentTarget = aliveEnemies.length > 0 ? aliveEnemies[0] : null;
                }
            }

            if (!currentTarget) {
                console.log(`第 ${i + 1} 次攻击：没有找到有效目标`);
                continue;
            }

            console.log(`第 ${i + 1} 次攻击：${currentTarget.name}`);

            // 计算伤害
            let damage: number;
            if (i === 0) {
                // 第一次攻击：正常伤害
                damage = this.calculateDamage(attacker, currentTarget, skill, skillResult);

                // 计算原本的基础伤害（不考虑暴击、防御减免等）
                baseDamage = attacker.attack;

                // 剑法精通加成
                if (skillResult.swordMasteryBonus && attacker.swordMastery > 0) {
                    baseDamage += Math.floor(attacker.swordMastery * 0.5);
                }
            } else {
                // 后续攻击：伤害为原本伤害的30%
                damage = Math.floor(baseDamage * 0.3);
            }

            // 应用伤害
            this.applyDamage(currentTarget, damage, attacker);

            // 应用技能特殊效果（只在第一次攻击时应用）
            if (i === 0) {
                this.applySkillEffects(attacker, currentTarget, skill, skillResult);
            }
        }
    }

    // 根据技能范围选择目标
    private selectTargetBySkillRange(attacker: Piece, skill: Skill): Piece | null {
        const enemyTeam = attacker.team === 'A' ? this.teamB : this.teamA;
        const aliveEnemies = enemyTeam.filter(enemy => enemy.isAlive);

        // 检查范围内的目标
        const targetsInRange = aliveEnemies.filter(enemy => 
            this.isInSkillRange(attacker, enemy, skill.range)
        );

        if (targetsInRange.length === 0) {
            return null;
        }

        // 随机选择一个目标
        return targetsInRange[Math.floor(Math.random() * targetsInRange.length)];
    }

    // 检查是否在技能范围内
    private isInSkillRange(attacker: Piece, target: Piece, range: number): boolean {
        const distance = this.calculateDistance(attacker.position, target.position);
        return distance <= range;
    }

    // 计算伤害
    private calculateDamage(attacker: Piece, target: Piece, skill: Skill, skillResult: SkillResult): number {
        let baseDamage = attacker.attack;

        // 剑法精通加成
        if (skillResult.swordMasteryBonus && attacker.swordMastery > 0) {
            baseDamage += Math.floor(attacker.swordMastery * 0.5);
            console.log(`剑法精通加成：+${Math.floor(attacker.swordMastery * 0.5)}`);
        }

        // 天赋效果加成
        const tianfuBonus = this.calculateTianfuDamageBonus(attacker, skill, skillResult);
        baseDamage += tianfuBonus;
        if (tianfuBonus > 0) {
            console.log(`天赋加成：+${tianfuBonus}`);
        }

        // 暴击判定（考虑天赋暴击率加成）
        const finalCritRate = attacker.critRate + this.calculateTianfuCritRateBonus(attacker);
        const isCrit = Math.random() < finalCritRate;
        if (isCrit) {
            baseDamage *= attacker.critDamage;
            console.log('暴击！');
        }

        // 防御减免（考虑天赋防御穿透效果）
        const defenseReduction = target.defense * 0.1;
        const finalDamage = Math.max(1, baseDamage - defenseReduction);

        return finalDamage;
    }

    // 应用伤害
    private applyDamage(target: Piece, damage: number, attacker: Piece): void {
        target.hp = Math.max(0, target.hp - damage);
        console.log(`${target.name} 受到 ${damage} 点伤害，剩余血量: ${target.hp}`);

        if (target.hp <= 0) {
            target.isAlive = false;
            console.log(`${target.name} 被击败！`);
        }
    }

    // 应用技能特殊效果
    private applySkillEffects(attacker: Piece, target: Piece, skill: Skill, skillResult: SkillResult): void {
        // 中毒效果
        if (skillResult.poisonDuration && skillResult.poisonDamage) {
            BuffProcessor.applyDebuff(target, 'poison', skillResult.poisonDamage, skillResult.poisonDuration);
            console.log(`${target.name} 中毒，每回合受到 ${skillResult.poisonDamage} 点伤害，持续 ${skillResult.poisonDuration} 回合`);
        }
    }

    // 执行单次攻击
    private executeSingleHitSkill(attacker: Piece, target: Piece, skill: Skill, skillResult: SkillResult): void {
        const damage = this.calculateDamage(attacker, target, skill, skillResult);
        this.applyDamage(target, damage, attacker);
        this.applySkillEffects(attacker, target, skill, skillResult);
    }

    // 回合结束处理
    private processRoundEnd(): void {
        // 更新buff/debuff持续时间
        this.pieces.forEach(piece => {
            if (piece.isAlive) {
                BuffProcessor.updateDurations(piece);
            }
        });
    }

    // 检查战斗是否结束
    private checkBattleEnd(): void {
        const teamAAlive = this.teamA.some(piece => piece.isAlive);
        const teamBAlive = this.teamB.some(piece => piece.isAlive);

        if (!teamAAlive) {
            this.isBattleOver = true;
            this.winner = 'B';
            console.log('=== 战斗结束 ===');
            console.log('B队胜利！');
        } else if (!teamBAlive) {
            this.isBattleOver = true;
            this.winner = 'A';
            console.log('=== 战斗结束 ===');
            console.log('A队胜利！');
        }
    }

    // 天赋效果计算方法

    // 计算天赋伤害加成
    private calculateTianfuDamageBonus(attacker: Piece, skill: Skill, skillResult: SkillResult): number {
        let bonusDamage = 0;

        // 检查攻击者的天赋（添加空数组检查）
        if (!attacker.tianfus || attacker.tianfus.length === 0) {
            return bonusDamage;
        }

        attacker.tianfus.forEach(tianfu => {
            // 检查天赋对象和效果是否存在
            if (!tianfu || !tianfu.effects) {
                return;
            }

            const effects = tianfu.effects;

            // 通用伤害加成
            if (effects['伤害加成']) {
                bonusDamage += parseInt(effects['伤害加成']);
            }

            // 特定技能类型加成
            if (skill.type === '剑法' && effects['剑法伤害加成']) {
                bonusDamage += parseInt(effects['剑法伤害加成']);
            }

            if (skill.type === '刀法' && effects['刀法伤害加成']) {
                bonusDamage += parseInt(effects['刀法伤害加成']);
            }

            if (skill.type === '拳掌' && effects['拳掌伤害加成']) {
                bonusDamage += parseInt(effects['拳掌伤害加成']);
            }

            // 多段攻击加成
            if (skillResult.hits && skillResult.hits > 1 && effects['多段攻击加成']) {
                bonusDamage += parseInt(effects['多段攻击加成']);
            }

            // 根据品质加成
            if (tianfu.quality === '传说' && effects['传说品质加成']) {
                bonusDamage += parseInt(effects['传说品质加成']);
            }

            if (tianfu.quality === '史诗' && effects['史诗品质加成']) {
                bonusDamage += parseInt(effects['史诗品质加成']);
            }
        });

        return bonusDamage;
    }

    // 计算天赋暴击率加成
    private calculateTianfuCritRateBonus(attacker: Piece): number {
        let critBonus = 0;

        // 检查攻击者的天赋（添加空数组检查）
        if (!attacker.tianfus || attacker.tianfus.length === 0) {
            return critBonus;
        }

        attacker.tianfus.forEach(tianfu => {
            // 检查天赋对象和效果是否存在
            if (!tianfu || !tianfu.effects) {
                return;
            }

            const effects = tianfu.effects;

            if (effects['暴击率']) {
                critBonus += parseFloat(effects['暴击率'].replace('%', '')) / 100;
            }

            if (effects['额外暴击率']) {
                critBonus += parseFloat(effects['额外暴击率'].replace('%', '')) / 100;
            }
        });

        return critBonus;
    }

    // 计算天赋闪避率加成
    private calculateTianfuDodgeRateBonus(defender: Piece): number {
        let dodgeBonus = 0;

        // 检查防御者的天赋（添加空数组检查）
        if (!defender.tianfus || defender.tianfus.length === 0) {
            return dodgeBonus;
        }

        defender.tianfus.forEach(tianfu => {
            // 检查天赋对象和效果是否存在
            if (!tianfu || !tianfu.effects) {
                return;
            }

            const effects = tianfu.effects;

            if (effects['闪避率']) {
                dodgeBonus += parseFloat(effects['闪避率'].replace('%', '')) / 100;
            }

            if (effects['额外闪避率']) {
                dodgeBonus += parseFloat(effects['额外闪避率'].replace('%', '')) / 100;
            }
        });

        return dodgeBonus;
    }

    // 检查闪避
    private checkDodge(attacker: Piece, target: Piece): boolean {
        const finalDodgeRate = target.dodgeRate + this.calculateTianfuDodgeRateBonus(target);
        return Math.random() < finalDodgeRate;
    }

    // 应用天赋特殊效果
    private applyTianfuSpecialEffects(attacker: Piece, target: Piece, skill: Skill): void {
        // 检查攻击者的天赋（添加空数组检查）
        if (!attacker.tianfus || attacker.tianfus.length === 0) {
            return;
        }

        attacker.tianfus.forEach(tianfu => {
            // 检查天赋对象和效果是否存在
            if (!tianfu || !tianfu.effects) {
                return;
            }

            const effects = tianfu.effects;

            // 吸血效果
            if (effects['吸血率']) {
                const vampireRate = parseFloat(effects['吸血率'].replace('%', '')) / 100;
                const damage = this.calculateDamage(attacker, target, skill, {});
                const healAmount = Math.floor(damage * vampireRate);

                if (healAmount > 0) {
                    attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount);
                    console.log(`${attacker.name} 吸血 ${healAmount} 点生命值`);
                }
            }

            // 反击效果
            if (effects['反击率'] && Math.random() < parseFloat(effects['反击率'].replace('%', '')) / 100) {
                console.log(`${attacker.name} 触发反击！`);
                // 这里可以添加反击逻辑
            }

            // 连击效果
            if (effects['连击率'] && Math.random() < parseFloat(effects['连击率'].replace('%', '')) / 100) {
                console.log(`${attacker.name} 触发连击！`);
                // 这里可以添加连击逻辑
            }
        });
    }
}

// 战斗测试函数
export function startBattleTest(): string | null {
    const battleManager = new BattleManager();
    const winner = battleManager.startBattle();

    console.log(`战斗结果: ${winner}队胜利`);
    console.log(`总回合数: ${battleManager.round}`);

    return winner;
}