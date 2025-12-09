import { Text, useSend } from 'alemonjs';
import { onResponse } from 'alemonjs';
import { redis } from '@src/model/api';
import { keys } from '@src/model/keys';
import { selects } from '@src/response/mw-captcha';
import mw from '@src/response/mw-captcha';

// 侠客注册正则表达式 - 支持"我的侠客"、"侠客信息"和"进入侠客江湖"作为触发词
export const regular = /^(#|＃|\/)?(我的侠客|侠客信息|进入侠客江湖)$/;

/**
 * 获取所有侠客背包数据，用于编号排序
 */
async function getAllXKBagData(): Promise<Array<{ id: string; uid: string }>> {
  try {
    // 获取所有侠客背包数据的key
    const allKeys = await redis.keys('xk_bag:*');
    const bagDataList: Array<{ id: string; uid: string }> = [];

    for (const key of allKeys) {
      const bagDataStr = await redis.get(key);

      if (bagDataStr) {
        try {
          const bagData = JSON.parse(bagDataStr);

          if (bagData.id && bagData.uid) {
            bagDataList.push({
              id: bagData.id,
              uid: bagData.uid
            });
          }
        } catch (error) {
          console.error('解析侠客背包数据失败:', error);
        }
      }
    }

    return bagDataList;
  } catch (error) {
    console.error('获取侠客背包数据失败:', error);

    return [];
  }
}

/**
 * 获取指定用户的所有装备数据，用于装备编号排序
 */
async function getAllEquipmentDataByUID(uid: string): Promise<Array<{ id: string }>> {
  try {
    // 获取该用户所有装备数据的key
    const allKeys = await redis.keys(`xk_Equipment:${uid}:*`);
    const equipmentDataList: Array<{ id: string }> = [];

    for (const key of allKeys) {
      const equipmentDataStr = await redis.get(key);

      if (equipmentDataStr) {
        try {
          const equipmentData = JSON.parse(equipmentDataStr);

          if (equipmentData.id) {
            equipmentDataList.push({
              id: equipmentData.id
            });
          }
        } catch (error) {
          console.error('解析装备数据失败:', error);
        }
      }
    }

    return equipmentDataList;
  } catch (error) {
    console.error('获取装备数据失败:', error);

    return [];
  }
}

/**
 * 生成新的装备编号，遵循复杂排序规则：
 * 1. 从1开始顺序排列
 * 2. 每个UID对应的装备id单独计算
 * 3. 当出现空缺时从空缺处继续排序
 * 4. 补满空缺后再从最后面开始排
 */
async function generateEquipmentId(uid: string): Promise<string> {
  // 获取该用户的所有装备数据
  const equipmentDataList = await getAllEquipmentDataByUID(uid);

  // 提取所有编号中的数字部分
  const numberIds: number[] = [];

  equipmentDataList.forEach(equipmentData => {
    // 解析编号格式：eq_数字
    const match = equipmentData.id.match(/^eq_(\d+)$/);

    if (match?.[1]) {
      const num = parseInt(match[1]);

      if (!isNaN(num)) {
        numberIds.push(num);
      }
    }
  });

  // 如果没有现有编号，从1开始
  if (numberIds.length === 0) {
    return 'eq_1';
  }

  // 排序编号
  numberIds.sort((a, b) => a - b);

  // 寻找空缺编号
  let newNumber = 1;

  for (let i = 0; i < numberIds.length; i++) {
    if (numberIds[i] > newNumber) {
      // 找到空缺，使用空缺编号
      break;
    }
    newNumber = numberIds[i] + 1;
  }

  // 如果没有空缺，从最大编号+1开始
  if (newNumber <= numberIds[numberIds.length - 1]) {
    newNumber = numberIds[numberIds.length - 1] + 1;
  }

  return `eq_${newNumber}`;
}

/**
 * 生成新的侠客编号，遵循复杂排序规则：
 * 1. 从1开始顺序排列
 * 2. 当出现空缺时从空缺处继续排序
 * 3. 补满空缺后再从最后面开始排
 */
async function generateXKId(): Promise<string> {
  // 获取所有侠客背包数据
  const bagDataList = await getAllXKBagData();

  // 提取所有编号中的数字部分
  const numberIds: number[] = [];

  bagDataList.forEach(bagData => {
    // 解析编号格式：xk_数字 或 xk_数字_其他
    const match = bagData.id.match(/^xk_(\d+)(?:_|$)/);

    if (match?.[1]) {
      const num = parseInt(match[1]);

      if (!isNaN(num)) {
        numberIds.push(num);
      }
    }
  });

  // 如果没有现有编号，从1开始
  if (numberIds.length === 0) {
    return 'xk_1';
  }

  // 排序编号
  numberIds.sort((a, b) => a - b);

  // 寻找空缺编号
  let newNumber = 1;

  for (let i = 0; i < numberIds.length; i++) {
    if (numberIds[i] > newNumber) {
      // 找到空缺，使用空缺编号
      break;
    }
    newNumber = numberIds[i] + 1;
  }

  // 如果没有空缺，从最大编号+1开始
  if (newNumber <= numberIds[numberIds.length - 1]) {
    newNumber = numberIds[numberIds.length - 1] + 1;
  }

  return `xk_${newNumber}`;
}

const res = onResponse(selects, async e => {
  const Send = useSend(e);
  const userId = e.UserId;
  const message = e.message;

  // 检查玩家是否已在侠客江湖注册过（检查xk_player_data表）
  const existingPlayerData = await redis.get(`xk_player_data:${userId}`);

  // 判断触发词类型 - 使用精确匹配
  const isInfoCommand = /^(#|＃|\/)?(我的侠客|侠客信息)$/.test(message);
  const isRegisterCommand = /^(#|＃|\/)?进入侠客江湖$/.test(message);

  if (existingPlayerData) {
    // 玩家已注册，直接显示玩家信息
    try {
      const playerDataXK = JSON.parse(existingPlayerData);

      const playerInfo = `------侠客江湖------\n玩家ID：${playerDataXK.id}\n玩家名称：${playerDataXK.名号}\n玩家铜币：${playerDataXK.money}\n玩家周目：${playerDataXK.level}`;

      void Send(Text(playerInfo));

      return false;
    } catch (error) {
      console.error('解析玩家数据失败:', error);
      void Send(Text('获取玩家信息失败，请稍后重试！'));

      return false;
    }
  }

  // 如果是信息查询命令但玩家未注册
  if (isInfoCommand) {
    void Send(Text('您尚未在侠客江湖注册，请使用"进入侠客江湖"命令进行注册！'));

    return false;
  }

  // 如果是注册命令，继续执行注册流程
  if (isRegisterCommand) {
    const ex = await redis.exists(keys.player(userId));

    if (ex === 0) {
      void Send(Text('请先在修仙系统中注册！'));

      return false;
    }

    // 获取发送者的名号
    const player = await redis.get(keys.player(userId));

    if (!player) {
      void Send(Text('获取玩家信息失败，请稍后重试！'));

      return false;
    }

    // 解析玩家数据
    const playerData = JSON.parse(player);

    // 生成侠客编号（使用复杂排序规则）
    const xkId = await generateXKId();

    // 创建玩家数据（按照要求的格式）
    const playerDataXK = {
      id: userId,
      名号: playerData.名号,
      money: 0,
      level: 1
    };

    // 创建背包数据
    const bagData = {
      id: xkId,
      uid: userId,
      名号: playerData.名号,
      装备: [],
      消耗: [],
      武学: [],
      材料: [],
      任务: []
    };

    // 创建初始装备
    const equipmentData = {
      id: await generateEquipmentId(userId),
      UID: userId,
      名号: playerData.名号,
      name: '主角',
      registeredTime: new Date().toISOString(),
      part: 'weapon',
      equipment: [
        {
          id: 412102,
          name: '木剑',
          quality: '白',
          type: '剑',
          maxStack: 999,
          stackSize: 1,
          buyPrice: 320,
          sellPrice: 32,
          description: null
        }
      ]
    };

    // 写入数据到Redis
    try {
      // 写入玩家数据（使用xk_player_data表名）
      await redis.set(`xk_player_data:${userId}`, JSON.stringify(playerDataXK));

      // 写入装备数据（使用xk_Equipment表名，使用userId+xkId组合键避免冲突）
      await redis.set(`xk_Equipment:${userId}:${xkId}`, JSON.stringify(equipmentData));

      // 写入背包数据（使用xk_bag表名）
      await redis.set(`xk_bag:${userId}`, JSON.stringify(bagData));

      // 生成欢迎消息（与已注册玩家显示格式保持一致）
      const welcomeMessage = `------侠客江湖------\n玩家ID：${playerDataXK.id}\n玩家名称：${playerDataXK.名号}\n玩家铜币：${playerDataXK.money}\n玩家周目：${playerDataXK.level}`;

      void Send(Text(welcomeMessage));
    } catch (error) {
      console.error('侠客注册失败:', error);
      void Send(Text('侠客注册失败，请稍后重试！'));
    }
  }

  return false;
});

export default onResponse(selects, [mw.current, res.current]);
