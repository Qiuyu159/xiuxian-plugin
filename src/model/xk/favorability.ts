import { redis } from '../api';

// 获取玩家对特定角色的好感度
export async function getPlayerFavorability(userId: string, characterName: string): Promise<number> {
  try {
    const favorabilityData = await redis.get('xk_favorability_data');

    if (!favorabilityData) {
      return 0;
    }

    const data = JSON.parse(favorabilityData);

    // 查找角色
    for (const charName in data) {
      if (charName === characterName && data[charName][userId] !== undefined) {
        return data[charName][userId];
      }
    }

    return 0;
  } catch (error) {
    console.error('获取玩家好感度失败:', error);

    return 0;
  }
}

// 获取所有角色的好感度数据
export async function getAllFavorabilityData(): Promise<Record<string, Record<string, number>>> {
  try {
    const favorabilityData = await redis.get('xk_favorability_data');

    if (!favorabilityData) {
      return {};
    }

    return JSON.parse(favorabilityData);
  } catch (error) {
    console.error('获取所有好感度数据失败:', error);

    return {};
  }
}

// 获取角色列表
export async function getCharacterList(): Promise<string[]> {
  try {
    const favorabilityData = await redis.get('xk_favorability_data');

    if (!favorabilityData) {
      return [];
    }

    const data = JSON.parse(favorabilityData);

    return Object.keys(data);
  } catch (error) {
    console.error('获取角色列表失败:', error);

    return [];
  }
}

// 检查玩家是否有某个角色的好感度记录
export async function hasFavorabilityRecord(userId: string, characterName: string): Promise<boolean> {
  try {
    const favorabilityData = await redis.get('xk_favorability_data');

    if (!favorabilityData) {
      return false;
    }

    const data = JSON.parse(favorabilityData);

    // 查找角色
    for (const charName in data) {
      if (charName === characterName && data[charName][userId] !== undefined) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('检查好感度记录失败:', error);

    return false;
  }
}
