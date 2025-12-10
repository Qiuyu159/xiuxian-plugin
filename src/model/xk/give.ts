import { redis } from '../api';
import * as fs from 'fs';
import * as path from 'path';

// 材料品质对应好感度点数
const qualityFavorabilityPoints: Record<string, number> = {
  白: 5,
  绿: 6,
  蓝: 8,
  紫: 10,
  橙: 12,
  金: 12,
  暗金: 15
};

// 好感度要求映射 - 不能赠送的品质列表
const forbiddenQualityByFavorability: { [key: string]: string[] } = {
  '0-20': [], // 0-20可以送所有品质物品
  '21-30': ['白'], // 21-30除了白的不能送其他品质的可以送物品
  '31-40': ['白', '绿'], // 31-40除了白和绿的不能送其他品质的可以送物品
  '41-50': ['白', '绿', '蓝'], // 41-50除了白、绿和蓝的不能送其他品质的可以送物品
  '51-60': ['白', '绿', '蓝', '紫'], // 51-60除了白、绿、蓝和紫的不能送其他品质的可以送物品
  '61-80': ['白', '绿', '蓝', '紫', '橙'], // 61-80除了白、绿、蓝、紫和橙的不能送其他品质的可以送物品
  '81-99': ['白', '绿', '蓝', '紫', '橙', '金'] // 81-99只能送暗金品质的物品
};

// 加载侠客角色数据
function loadCharacterData(): any[] {
  try {
    const filePath = path.join(process.cwd(), 'src/resources/data/xk/侠客角色.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    return JSON.parse(fileContent);
  } catch (error) {
    console.error('加载侠客角色数据失败:', error);

    return [];
  }
}

// 加载侠客物品数据
function loadItemData(): any[] {
  try {
    const filePath = path.join(process.cwd(), 'src/resources/data/xk/侠客物品.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    return JSON.parse(fileContent);
  } catch (error) {
    console.error('加载侠客物品数据失败:', error);

    return [];
  }
}

// 获取玩家对特定角色的好感度
async function getPlayerFavorability(userId: string, characterName: string): Promise<number> {
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

// 检查物品品质是否满足好感度要求
function checkQualityRequirement(favorability: number, itemQuality: string): boolean {
  // 获取好感度范围
  let favorabilityRange = '';

  if (favorability <= 20) {
    favorabilityRange = '0-20';
  } else if (favorability <= 30) {
    favorabilityRange = '21-30';
  } else if (favorability <= 40) {
    favorabilityRange = '31-40';
  } else if (favorability <= 50) {
    favorabilityRange = '41-50';
  } else if (favorability <= 60) {
    favorabilityRange = '51-60';
  } else if (favorability <= 80) {
    favorabilityRange = '61-80';
  } else {
    favorabilityRange = '81-99';
  }

  // 获取该好感度范围不能赠送的品质列表
  const forbiddenQualities = forbiddenQualityByFavorability[favorabilityRange];

  if (!forbiddenQualities) { return false; }

  // 检查物品品质是否在不能赠送的列表中
  return !forbiddenQualities.includes(itemQuality);
}

// 检查物品类型是否在角色的like数组中
function checkItemTypeInLikes(itemType: string, characterLikes: string[]): boolean {
  return characterLikes.includes(itemType);
}

// 根据好感度获取对应的范围字符串
function getFavorabilityRange(favorability: number): string {
  if (favorability <= 20) {
    return '0-20';
  } else if (favorability <= 30) {
    return '21-30';
  } else if (favorability <= 40) {
    return '31-40';
  } else if (favorability <= 50) {
    return '41-50';
  } else if (favorability <= 60) {
    return '51-60';
  } else if (favorability <= 80) {
    return '61-80';
  } else {
    return '81-99';
  }
}

// 获取玩家背包数据
async function getPlayerBagData(userId: string): Promise<any> {
  try {
    const bagData = await redis.get(`xk_bag:${userId}`);

    if (!bagData) {
      return null;
    }

    return JSON.parse(bagData);
  } catch (error) {
    console.error('获取玩家背包数据失败:', error);

    return null;
  }
}

// 更新玩家背包数据
async function updatePlayerBagData(userId: string, bagData: any): Promise<boolean> {
  try {
    await redis.set(`xk_bag:${userId}`, JSON.stringify(bagData));

    return true;
  } catch (error) {
    console.error('更新玩家背包数据失败:', error);

    return false;
  }
}

// 更新玩家好感度
async function updatePlayerFavorability(userId: string, characterName: string, favorability: number): Promise<boolean> {
  try {
    const favorabilityData = await redis.get('xk_favorability_data');

    if (!favorabilityData) {
      // 如果好感度数据不存在，创建新的数据结构
      const newData: Record<string, Record<string, number>> = {};

      newData[characterName] = {};
      newData[characterName][userId] = favorability;
      await redis.set('xk_favorability_data', JSON.stringify(newData));

      return true;
    }

    const data = JSON.parse(favorabilityData);

    // 查找并更新角色好感度
    for (const charName in data) {
      if (charName === characterName) {
        data[charName][userId] = favorability;
        await redis.set('xk_favorability_data', JSON.stringify(data));

        return true;
      }
    }

    // 如果角色不存在，添加新的角色好感度数据
    data[characterName] = data[characterName] || {};
    data[characterName][userId] = favorability;
    await redis.set('xk_favorability_data', JSON.stringify(data));

    return true;
  } catch (error) {
    console.error('更新玩家好感度失败:', error);

    return false;
  }
}

// 主赠送函数
export async function giveItemToCharacter(
  userId: string,
  characterName: string,
  itemName: string,
  quantity: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // 加载数据
    const characterData = loadCharacterData();
    const itemData = loadItemData();

    // 查找角色
    const character = characterData.find((char: any) => char.name === characterName);

    if (!character) {
      return { success: false, error: `角色"${characterName}"不存在！` };
    }

    // 查找物品
    const item = itemData.find((item: any) => item.name === itemName);

    if (!item) {
      return { success: false, error: `物品"${itemName}"不存在！` };
    }

    // 检查物品类型是否在角色的like数组中
    if (!checkItemTypeInLikes(item.type, character.like)) {
      return { success: false, error: `${characterName}不喜欢${itemName}这个物品！` };
    }

    // 获取玩家好感度
    const favorability = await getPlayerFavorability(userId, characterName);

    // 检查物品品质是否满足好感度要求
    if (!checkQualityRequirement(favorability, item.quality)) {
      // 获取不能赠送的品质列表
      const favorabilityRange = getFavorabilityRange(favorability);
      const forbiddenQualities = forbiddenQualityByFavorability[favorabilityRange || ''] || [];

      return {
        success: false,
        error: `好感度不足！当前好感度${favorability}，不能赠送${forbiddenQualities.join('、')}品质的物品。`
      };
    }

    // 获取玩家背包数据
    const bagData = await getPlayerBagData(userId);

    if (!bagData) {
      return { success: false, error: '背包数据不存在，请先注册侠客！' };
    }

    // 查找背包中的物品
    let itemFound = false;
    let itemIndex = -1;
    let categoryFound = '';

    // 搜索所有物品类型数组（使用侠客背包系统的分类）
    const itemTypes = ['装备', '消耗', '武学', '材料', '任务', '其他'];

    for (const type of itemTypes) {
      if (bagData[type] && Array.isArray(bagData[type])) {
        const index = bagData[type].findIndex((bagItem: any) => bagItem.name === itemName);

        if (index !== -1) {
          itemFound = true;
          itemIndex = index;
          categoryFound = type;

          // 检查数量是否足够
          if (bagData[type][index].quantity < quantity) {
            return {
              success: false,
              error: `背包中的${itemName}数量不足！当前数量：${bagData[type][index].quantity}，需要数量：${quantity}`
            };
          }

          // 扣除物品数量
          bagData[type][index].quantity -= quantity;

          // 如果数量为0，移除物品
          if (bagData[type][index].quantity === 0) {
            bagData[type].splice(index, 1);
          }

          break;
        }
      }
    }

    if (!itemFound) {
      return { success: false, error: `背包中没有${itemName}！` };
    }

    // 更新背包数据
    const updateSuccess = await updatePlayerBagData(userId, bagData);

    if (!updateSuccess) {
      return { success: false, error: '更新背包数据失败！' };
    }

    // 计算好感度增加（根据物品品质对应的好感度点数）
    const favorabilityPoints = qualityFavorabilityPoints[item.quality] || 5;
    const favorabilityIncrease = favorabilityPoints * quantity;
    const newFavorability = favorability + favorabilityIncrease;

    // 更新好感度
    const favorabilitySuccess = await updatePlayerFavorability(userId, characterName, newFavorability);

    if (!favorabilitySuccess) {
      return { success: false, error: '更新好感度失败！' };
    }

    return {
      success: true,
      message: `成功赠送${quantity}个${itemName}给${characterName}！好感度增加${favorabilityIncrease}点，当前好感度：${newFavorability}`
    };
  } catch (error) {
    console.error('赠送物品失败:', error);

    return { success: false, error: '处理赠送请求时发生错误，请稍后重试！' };
  }
}
