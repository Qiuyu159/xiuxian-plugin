import { onResponse, useSend, Text } from 'alemonjs';
import { redis } from '@src/model/api';
import { existplayer } from '@src/model/index';
import { selects } from '@src/response/mw-captcha';
import mw from '@src/response/mw-captcha';
import { startBattle } from '../../../model/xk/battle';
import { Piece } from '../../../model/xk/Piece';

// 侠客切磋指令正则表达式
export const regular = /^(#|＃|\/)?侠客切磋\s*(.+)$/;

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

const res = onResponse(selects, async e => {
  const Send = useSend(e);
  const userId = e.UserId;

  // 检查玩家是否存在
  if (!(await existplayer(userId))) {
    void Send(Text('请先在修仙系统中注册！'));

    return false;
  }

  // 检查玩家是否已在侠客江湖注册过
  const xkPlayerDataStr = await redis.get(`xk_player_data:${userId}`);

  if (!xkPlayerDataStr) {
    void Send(Text('请先进入侠客江湖！'));

    return false;
  }

  // 检查消息是否匹配侠客切磋指令
  const match = e.MessageText.match(regular);

  if (!match) {
    return true; // 不匹配，继续处理其他模块
  }

  const characterName = match[2]?.trim();

  if (!characterName) {
    void Send(Text('请输入要切磋的角色名称！例如：侠客切磋风冲'));

    return false;
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
    let battleReport = '=== 侠客切磋结果 ===\\n';

    battleReport += `玩家 ${player.name} vs ${opponent.name}\\n`;
    battleReport += `战斗结果：${result.winner === 'player' ? '胜利' : '失败'}\\n`;
    battleReport += `战斗回合数：${result.rounds}\\n\\n`;

    // 添加战斗详情
    battleReport += '战斗详情：\\n';
    result.battleLog.forEach((event, index) => {
      battleReport += `${index + 1}. ${event}\\n`;
    });

    void Send(Text(battleReport));
  } catch (error) {
    console.error('战斗处理错误:', error);
    void Send(Text(`战斗处理失败：${error instanceof Error ? error.message : '未知错误'}`));
  }

  return false;
});

export default onResponse(selects, [mw.current, res.current]);
