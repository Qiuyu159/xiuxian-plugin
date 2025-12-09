import { redis } from '@src/model/api';
import { keys } from '@src/model/keys';

/**
 * 侠客玩家数据结构
 */
export interface XKPlayerData {
  id: string;
  名号: string;
  money: number;
  level: number;
}

/**
 * 侠客背包数据结构
 */
export interface XKBagData {
  id: string;
  uid: string;
  名号: string;
  装备: any[];
  消耗: any[];
  武学: any[];
  材料: any[];
  任务: any[];
}

/**
 * 侠客装备数据结构
 */
export interface XKEquipmentData {
  id: string;
  UID: string;
  名号: string;
  name: string;
  registeredTime: string;
  part: string;
  equipment: any[];
}

/**
 * 获取所有侠客背包数据，用于编号排序
 */
export async function getAllXKBagData(): Promise<Array<{ id: string; uid: string }>> {
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
export async function getAllEquipmentDataByUID(uid: string): Promise<Array<{ id: string }>> {
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
export async function generateEquipmentId(uid: string): Promise<string> {
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
export async function generateXKId(): Promise<string> {
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

/**
 * 检查玩家是否已在侠客江湖注册
 */
export async function isPlayerRegistered(userId: string): Promise<boolean> {
  try {
    const existingPlayerData = await redis.get(`xk_player_data:${userId}`);

    return !!existingPlayerData;
  } catch (error) {
    console.error('检查玩家注册状态失败:', error);

    return false;
  }
}

/**
 * 获取玩家侠客数据
 */
export async function getPlayerXKData(userId: string): Promise<XKPlayerData | null> {
  try {
    const playerDataStr = await redis.get(`xk_player_data:${userId}`);

    if (!playerDataStr) {
      return null;
    }

    return JSON.parse(playerDataStr) as XKPlayerData;
  } catch (error) {
    console.error('获取玩家侠客数据失败:', error);

    return null;
  }
}

/**
 * 检查玩家是否在修仙系统中注册
 */
export async function isPlayerInCultivationSystem(userId: string): Promise<boolean> {
  try {
    const ex = await redis.exists(keys.player(userId));

    return ex === 1;
  } catch (error) {
    console.error('检查修仙系统注册状态失败:', error);

    return false;
  }
}

/**
 * 获取修仙系统玩家数据
 */
export async function getCultivationPlayerData(userId: string): Promise<any> {
  try {
    const playerDataStr = await redis.get(keys.player(userId));

    if (!playerDataStr) {
      return null;
    }

    return JSON.parse(playerDataStr);
  } catch (error) {
    console.error('获取修仙系统玩家数据失败:', error);

    return null;
  }
}

/**
 * 注册新侠客玩家
 */
export async function registerNewXKPlayer(userId: string): Promise<{
  success: boolean;
  playerData?: XKPlayerData;
  error?: string;
}> {
  try {
    // 检查是否已在修仙系统注册
    if (!(await isPlayerInCultivationSystem(userId))) {
      return { success: false, error: '请先在修仙系统中注册！' };
    }

    // 获取修仙系统玩家数据
    const cultivationPlayerData = await getCultivationPlayerData(userId);

    if (!cultivationPlayerData) {
      return { success: false, error: '获取玩家信息失败，请稍后重试！' };
    }

    // 生成侠客编号
    const xkId = await generateXKId();

    // 创建玩家数据
    const playerDataXK: XKPlayerData = {
      id: userId,
      名号: cultivationPlayerData.名号,
      money: 0,
      level: 1
    };

    // 创建背包数据
    const bagData: XKBagData = {
      id: xkId,
      uid: userId,
      名号: cultivationPlayerData.名号,
      装备: [],
      消耗: [],
      武学: [],
      材料: [],
      任务: []
    };

    // 创建初始装备
    const equipmentData: XKEquipmentData = {
      id: await generateEquipmentId(userId),
      UID: userId,
      名号: cultivationPlayerData.名号,
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
    await redis.set(`xk_player_data:${userId}`, JSON.stringify(playerDataXK));
    await redis.set(`xk_Equipment:${userId}:${xkId}`, JSON.stringify(equipmentData));
    await redis.set(`xk_bag:${userId}`, JSON.stringify(bagData));

    return { success: true, playerData: playerDataXK };
  } catch (error) {
    console.error('侠客注册失败:', error);

    return { success: false, error: '侠客注册失败，请稍后重试！' };
  }
}

/**
 * 生成玩家信息文本
 */
export function generatePlayerInfoText(playerData: XKPlayerData): string {
  return `------侠客江湖------\n玩家ID：${playerData.id}\n玩家名称：${playerData.名号}\n玩家铜币：${playerData.money}\n玩家周目：${playerData.level}`;
}

/**
 * 生成注册提示文本
 */
export function generateRegistrationPrompt(): string {
  return '您尚未在侠客江湖注册，请使用"进入侠客江湖"命令进行注册！';
}
