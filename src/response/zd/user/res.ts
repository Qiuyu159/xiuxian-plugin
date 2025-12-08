import { Piece } from '../Piece/res';
import { AttackStrategy } from '../AttackStrategy/res';

// 技能接口定义
interface Skill {
    name: string;
    type: string;
    range: number;
    energyCost: number;
    description: string;
    execute: (piece: Piece, target: Piece) => SkillResult;
}

// 技能结果接口定义
interface SkillResult {
    skillName: string;
    hits?: number;
    poisonDuration?: number;
    poisonDamage?: number;
    swordMasteryBonus?: boolean;
}

// A队角色定义
const teamA: Piece[] = [
    new Piece({
        id: 1,
        name: '金书蕾',
        type: 'assassin',
        hp: 5000,
        maxHp: 5000,
        attack: 300,
        defense: 0,
        speed: 200,
        critRate: 0.2,
        critDamage: 2.5,
        position: { x: 0, y: 0 },
        skills: [
            {
                name: '夺命追魂帖',
                type: 'hidden_weapon',
                range: 5,
                energyCost: 50,
                description: '暗器类技能，对目标造成4-8次攻击，每次攻击随机选择目标，并附加中毒效果',
                execute: function(piece: Piece, target: Piece): SkillResult {
                    // 技能执行逻辑将在battle.js中实现
                    return {
                        skillName: this.name,
                        hits: Math.floor(Math.random() * 5) + 4, // 4-8次攻击
                        poisonDuration: 3,
                        poisonDamage: 20
                    };
                }
            }
        ],
        team: 'A',
        attackStrategy: AttackStrategy.NEAREST,
        
        // 精通属性
        hiddenWeaponMastery: 200,
        
        // 其他属性
        hitRate: 0.95,
        dodgeRate: 0.3,
        critResistance: 0.1,
        poisonResistance: 0.2
    })
];

// B队角色定义
const teamB: Piece[] = [
    new Piece({
        id: 2,
        name: '风冲',
        type: 'swordsman',
        hp: 6000,
        maxHp: 6000,
        attack: 400,
        defense: 50,
        speed: 150,
        critRate: 0.15,
        critDamage: 2.0,
        position: { x: 4, y: 4 },
        skills: [
            {
                name: '九式·求败剑决',
                type: 'sword',
                range: 2,
                energyCost: 40,
                description: '剑法类技能，对目标造成3次基础攻击，剑法精通加成',
                execute: function(piece: Piece, target: Piece): SkillResult {
                    // 技能执行逻辑将在battle.js中实现
                    return {
                        skillName: this.name,
                        hits: 3,
                        swordMasteryBonus: true
                    };
                }
            }
        ],
        team: 'B',
        attackStrategy: AttackStrategy.NEAREST,
        
        // 精通属性
        swordMastery: 180,
        
        // 其他属性
        hitRate: 0.9,
        dodgeRate: 0.2,
        critResistance: 0.15,
        parryRate: 0.1
    })
];

// 获取队伍数据的函数
export function getTeamA(): Piece[] {
    return teamA;
}

export function getTeamB(): Piece[] {
    return teamB;
}

// 获取所有角色
export function getAllPieces(): Piece[] {
    return [...teamA, ...teamB];
}

// 根据ID获取角色
export function getPieceById(id: number): Piece | undefined {
    return getAllPieces().find(piece => piece.id === id);
}

// 根据队伍获取角色
export function getPiecesByTeam(team: string): Piece[] {
    return getAllPieces().filter(piece => piece.team === team);
}