import { startBattle } from '../../../model/xk/battle';
import { Piece } from '../../../model/xk/Piece';

// 根据角色名称创建对手
function createOpponentByCharacterName(characterName: string): Piece {
  // 这里可以根据角色名称返回不同的对手配置
  const opponentConfigs: Record<string, any> = {
    风冲: {
      name: '风冲',
      hp: 800,
      maxHp: 800,
      attack: 120,
      defense: 40,
      speed: 150,
      critRate: 0.15,
      critDamage: 2.2,
      skills: [
        {
          id: 'skill_1',
          name: '华山剑法',
          type: 'damage',
          damage: 120,
          cost: 0,
          cooldown: 0
        }
      ],
      menpai: '华山'
    },
    金书蕾: {
      name: '金书蕾',
      hp: 1000,
      maxHp: 1000,
      attack: 100,
      defense: 50,
      speed: 120,
      critRate: 0.1,
      critDamage: 2.0,
      skills: [
        {
          id: 'skill_1',
          name: '武当剑法',
          type: 'damage',
          damage: 100,
          cost: 0,
          cooldown: 0
        }
      ],
      menpai: '武当'
    },
    张三丰: {
      name: '张三丰',
      hp: 1500,
      maxHp: 1500,
      attack: 150,
      defense: 80,
      speed: 100,
      critRate: 0.2,
      critDamage: 2.5,
      skills: [
        {
          id: 'skill_1',
          name: '太极拳',
          type: 'damage',
          damage: 150,
          cost: 0,
          cooldown: 0
        }
      ],
      menpai: '武当'
    }
  };

  const config = opponentConfigs[characterName] || opponentConfigs['风冲'];

  return new Piece({
    id: `opponent_${characterName}`,
    name: config.name,
    type: 'opponent',
    hp: config.hp,
    maxHp: config.hp,
    attack: config.attack,
    defense: config.defense,
    speed: config.speed,
    critRate: config.critRate,
    critDamage: config.critDamage,
    position: { x: 1, y: 0 },
    skills: config.skills,
    team: 'opponent',
    energy: 2000,
    maxEnergy: 2000,
    energyRecoveryRate: 0.1,
    menpai: config.menpai,
    attackStrategy: 'NEAREST'
  });
}

// 创建玩家角色
function createPlayer(): Piece {
  return new Piece({
    id: 'player_1',
    name: '玩家',
    type: 'player',
    hp: 1000,
    maxHp: 1000,
    attack: 100,
    defense: 50,
    speed: 120,
    critRate: 0.1,
    critDamage: 2.0,
    position: { x: 0, y: 0 },
    skills: [
      {
        id: 'skill_1',
        name: '基础攻击',
        type: 'damage',
        damage: 100,
        cost: 0,
        cooldown: 0
      }
    ],
    team: 'player',
    energy: 2000,
    maxEnergy: 2000,
    energyRecoveryRate: 0.1,
    menpai: '无门派',
    attackStrategy: 'NEAREST'
  });
}

// 战斗响应函数
export async function handleBattleCommand(message: string): Promise<string> {
  // 正则匹配：侠客切磋+角色名称
  const match = message.match(/侠客切磋\s*(.+)/);

  if (!match) {
    return '指令格式错误！请使用：侠客切磋+角色名称，例如：侠客切磋风冲';
  }

  const characterName = match[1].trim();

  if (!characterName) {
    return '请输入要切磋的角色名称！例如：侠客切磋风冲';
  }

  try {
    // 创建玩家和对手
    const player = createPlayer();
    const opponent = createOpponentByCharacterName(characterName);

    // 创建队伍
    const playerTeam = [player];
    const opponentTeam = [opponent];

    // 开始战斗
    const result = await startBattle(playerTeam, opponentTeam);

    // 生成战斗结果报告
    let battleReport = '=== 侠客切磋结果 ===\n';

    battleReport += `玩家 ${player.name} vs ${opponent.name}\n`;
    battleReport += `战斗结果：${result.winner === 'player' ? '胜利' : '失败'}\n`;
    battleReport += `战斗回合数：${result.rounds}\n\n`;

    // 添加战斗详情
    battleReport += '战斗详情：\n';
    result.battleLog.forEach((event, index) => {
      battleReport += `${index + 1}. ${event}\n`;
    });

    return battleReport;
  } catch (error) {
    console.error('战斗处理错误:', error);

    return `战斗处理失败：${error instanceof Error ? error.message : '未知错误'}`;
  }
}

// 测试战斗函数（使用旧数据）
export async function testBattleWithOldData(): Promise<string> {
  try {
    // 创建测试队伍
    const playerTeam = [createPlayer()]; // 玩家作为A队伍
    const opponentTeam = [createOpponentByCharacterName('风冲')]; // 风冲作为B队伍

    const result = await startBattle(playerTeam, opponentTeam);

    let testReport = '=== 旧数据战斗测试结果 ===\n';

    testReport += `A队伍：${playerTeam[0].name} vs B队伍：${opponentTeam[0].name}\n`;
    testReport += `战斗结果：${result.winner === 'player' ? 'A队伍胜利' : 'B队伍胜利'}\n`;
    testReport += `战斗回合数：${result.rounds}\n\n`;

    // 添加战斗详情
    testReport += '战斗详情：\n';
    result.battleLog.forEach((event, index) => {
      testReport += `${index + 1}. ${event}\n`;
    });

    return testReport;
  } catch (error) {
    console.error('测试战斗错误:', error);

    return `测试战斗失败：${error instanceof Error ? error.message : '未知错误'}`;
  }
}

// 导出正则表达式用于注册
export const battleCommandRegex = /侠客切磋\s*(.+)/;

// 导出响应函数
export default {
  regex: battleCommandRegex,
  handler: handleBattleCommand
};
