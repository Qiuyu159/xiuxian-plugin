import { onResponse, useSend, Text } from 'alemonjs';
import { redis } from '@src/model/api';
import { existplayer, readPlayer } from '@src/model/index';
import { selects } from '@src/response/mw-captcha';

// 物品类型分类映射
const ITEM_CATEGORIES: { [category: string]: string[] } = {
  // 装备类别
  装备: ['剑', '刀', '拳', '棍', '扇', '针匣', '手杖', '衣服', '鞋子', '饰品', '神器'],

  // 消耗类别
  消耗: ['配方', '菜肴', '丹药', '可用杂物', '粮食'],

  // 武学类别
  武学: ['秘籍', '天书', '残章'],

  // 材料类别
  材料: ['书画', '花卉', '化妆品', '酒类', '矿石', '烹饪材料', '药材', '音律', '游戏'],

  // 任务类别
  任务: ['酒馆', '任务', '藏宝图', '生活道具', '杂物']
};

// 背包物品接口
interface BagItem {
  id: string;
  uniqueId?: string;
  name: string;
  type: string;
  quality: string;
  quantity: number;
  maxStack?: number;
  equipped?: boolean;
  equippedTo?: string | null;
}

// 背包数据接口
interface BagData {
  id: string;
  uid: string;
  名号: string;
  装备: BagItem[];
  消耗: BagItem[];
  武学: BagItem[];
  材料: BagItem[];
  任务: BagItem[];
}

// 背包信息接口
interface BagInfo {
  totalItems: number;
  categories: {
    [category: string]: {
      count: number;
      totalQuantity: number;
    };
  };
}

/**
 * 获取玩家背包数据
 */
async function getPlayerBag(userId: string): Promise<BagData | null> {
  try {
    const bagDataStr = await redis.get(`xk_bag:${userId}`);

    if (!bagDataStr) {
      return null;
    }

    return JSON.parse(bagDataStr);
  } catch (error) {
    console.error('获取玩家背包数据失败:', error);

    return null;
  }
}

/**
 * 保存玩家背包数据
 */
async function savePlayerBag(userId: string, bagData: BagData): Promise<boolean> {
  try {
    await redis.set(`xk_bag:${userId}`, JSON.stringify(bagData));

    return true;
  } catch (error) {
    console.error('保存玩家背包数据失败:', error);

    return false;
  }
}

/**
 * 获取物品分类
 */
function getItemCategory(itemType: string): string {
  for (const [category, types] of Object.entries(ITEM_CATEGORIES)) {
    if (types.includes(itemType)) {
      return category;
    }
  }

  return '其他';
}

/**
 * 添加物品到背包
 */
async function addItemToBag(userId: string, itemId: string, quantity = 1, uniqueId: string | null = null): Promise<boolean> {
  // 获取玩家背包数据
  let bagData = await getPlayerBag(userId);

  if (!bagData) {
    // 如果背包不存在，创建新的背包数据
    const playerData = await readPlayer(userId);

    if (!playerData) {
      console.error(`玩家 ${userId} 不存在`);

      return false;
    }

    // 获取侠客玩家数据
    const xkPlayerDataStr = await redis.get(`xk_player_data:${userId}`);

    if (!xkPlayerDataStr) {
      console.error(`侠客玩家 ${userId} 不存在`);

      return false;
    }

    const xkPlayerData = JSON.parse(xkPlayerDataStr);

    bagData = {
      id: xkPlayerData.id || userId,
      uid: userId,
      名号: xkPlayerData.名号 || playerData.名号,
      装备: [],
      消耗: [],
      武学: [],
      材料: [],
      任务: []
    };
  }

  // 这里需要从物品数据库获取物品信息
  // 暂时使用模拟数据
  const itemInfo = {
    id: itemId,
    name: `物品${itemId}`,
    type: '道具',
    quality: '白',
    maxStack: 999
  };

  const category = getItemCategory(itemInfo.type);

  // 确保分类存在
  if (!bagData[category as keyof BagData]) {
    bagData[category as keyof BagData] = [];
  }

  const categoryItems = bagData[category as keyof BagData] as BagItem[];

  if (category === '装备' && uniqueId) {
    // 装备类物品（有唯一ID）
    const equipmentItem: BagItem = {
      id: itemId,
      uniqueId: uniqueId,
      name: itemInfo.name,
      type: itemInfo.type,
      quality: itemInfo.quality,
      quantity: 1,
      equipped: false,
      equippedTo: null
    };

    categoryItems.push(equipmentItem);
  } else {
    // 检查是否已存在相同物品
    const existingItem = categoryItems.find(item => item.id === itemId && !item.uniqueId
    );

    if (existingItem && itemInfo.maxStack && itemInfo.maxStack > 1) {
      // 可堆叠物品
      existingItem.quantity += quantity;
      if (existingItem.quantity > itemInfo.maxStack) {
        existingItem.quantity = itemInfo.maxStack;
      }
    } else {
      // 新物品或不可堆叠物品
      const newItem: BagItem = {
        id: itemId,
        name: itemInfo.name,
        type: itemInfo.type,
        quality: itemInfo.quality,
        quantity: quantity,
        maxStack: itemInfo.maxStack || 1
      };

      categoryItems.push(newItem);
    }
  }

  // 保存背包数据
  return await savePlayerBag(userId, bagData);
}

/**
 * 从背包移除物品
 */
async function removeItemFromBag(userId: string, itemId: string, quantity = 1, uniqueId: string | null = null): Promise<boolean> {
  const bagData = await getPlayerBag(userId);

  if (!bagData) {
    console.error(`玩家 ${userId} 的背包不存在`);

    return false;
  }

  // 这里需要从物品数据库获取物品信息
  // 暂时使用模拟数据
  const itemInfo = {
    id: itemId,
    type: '道具'
  };

  const category = getItemCategory(itemInfo.type);

  if (!bagData[category as keyof BagData]) {
    console.error(`玩家 ${userId} 的 ${category} 分类不存在`);

    return false;
  }

  const categoryItems = bagData[category as keyof BagData] as BagItem[];

  if (uniqueId) {
    // 通过唯一ID移除装备
    const itemIndex = categoryItems.findIndex(item => item.uniqueId === uniqueId
    );

    if (itemIndex !== -1) {
      categoryItems.splice(itemIndex, 1);

      return await savePlayerBag(userId, bagData);
    }
  } else {
    // 通过物品ID移除
    const itemIndex = categoryItems.findIndex(item => item.id === itemId && !item.uniqueId
    );

    if (itemIndex !== -1) {
      const item = categoryItems[itemIndex];

      if (item.quantity > quantity) {
        item.quantity -= quantity;
      } else {
        categoryItems.splice(itemIndex, 1);
      }

      return await savePlayerBag(userId, bagData);
    }
  }

  console.error(`物品 ${itemId} 在玩家 ${userId} 的背包中不存在`);

  return false;
}

/**
 * 获取背包物品列表
 */
async function getBagItems(userId: string, category: string | null = null): Promise<BagItem[]> {
  const bagData = await getPlayerBag(userId);

  if (!bagData) {
    return [];
  }

  if (category) {
    return bagData[category as keyof BagData] as BagItem[] || [];
  }

  // 返回所有分类的物品
  const allItems: BagItem[] = [];

  Object.values(bagData).forEach(categoryItems => {
    if (Array.isArray(categoryItems)) {
      allItems.push(...categoryItems);
    }
  });

  return allItems;
}

/**
 * 获取背包容量信息
 */
async function getBagInfo(userId: string): Promise<BagInfo | null> {
  const bagData = await getPlayerBag(userId);

  if (!bagData) {
    return null;
  }

  const info: BagInfo = {
    totalItems: 0,
    categories: {}
  };

  for (const [category, items] of Object.entries(bagData)) {
    if (Array.isArray(items)) {
      const categoryInfo = {
        count: items.length,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0)
      };

      info.categories[category] = categoryInfo;
      info.totalItems += categoryInfo.totalQuantity;
    }
  }

  return info;
}

// 导出背包管理函数供响应层使用
export {
  getPlayerBag,
  savePlayerBag,
  getItemCategory,
  addItemToBag,
  removeItemFromBag,
  getBagItems,
  getBagInfo,
  ITEM_CATEGORIES
};

export type { BagItem, BagData, BagInfo };
