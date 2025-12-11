import { redis } from '@src/model/api';
import { addItemToBag } from '@src/model/xk/bag';

/**
 * 将字符串转换为整数
 */
export function toInt(v: string, d = 0): number {
  const n = Number(v);

  return Number.isFinite(n) ? Math.trunc(n) : d;
}

/**
 * 获取物品在XKItem表中的数据
 */
export async function getItemData(itemName: string): Promise<any> {
  try {
    const xkItemData = await redis.get('XKItem');

    if (!xkItemData) {
      return null;
    }

    const xkItemList = JSON.parse(xkItemData);

    // 查找物品 - 支持多种可能的字段名
    const item = xkItemList.find((item: any) => item.name === itemName
      || item.名称 === itemName
      || item.itemName === itemName
    );

    return item || null;
  } catch (error) {
    console.error('获取物品数据失败:', error);

    return null;
  }
}

/**
 * 获取玩家侠客数据
 */
export async function getPlayerXKData(userId: string): Promise<any> {
  try {
    const playerDataStr = await redis.get(`xk_player_data:${userId}`);

    if (!playerDataStr) {
      return null;
    }

    return JSON.parse(playerDataStr);
  } catch (error) {
    console.error('获取玩家侠客数据失败:', error);

    return null;
  }
}

/**
 * 保存玩家侠客数据
 */
export async function savePlayerXKData(userId: string, playerData: any): Promise<boolean> {
  try {
    await redis.set(`xk_player_data:${userId}`, JSON.stringify(playerData));

    return true;
  } catch (error) {
    console.error('保存玩家侠客数据失败:', error);

    return false;
  }
}

/**
 * 处理铜钱添加逻辑
 */
export async function handleMoneyAdd(userId: string, quantity: number): Promise<boolean> {
  try {
    const playerData = await getPlayerXKData(userId);

    if (!playerData) {
      return false;
    }

    // 确保money字段存在
    if (typeof playerData.money !== 'number') {
      playerData.money = 0;
    }

    // 添加铜钱数量
    playerData.money += quantity;

    // 防止溢出
    if (playerData.money > 1e15) {
      playerData.money = 1e15;
    }

    return await savePlayerXKData(userId, playerData);
  } catch (error) {
    console.error('处理铜钱添加失败:', error);

    return false;
  }
}

/**
 * 处理物品添加到背包逻辑
 */
export async function handleItemAdd(userId: string, itemName: string, quantity: number): Promise<boolean> {
  try {
    // 获取物品数据
    const itemData = await getItemData(itemName);

    if (!itemData) {
      return false;
    }

    // 使用标准化的背包模型添加物品
    // 从物品数据中获取物品ID，如果没有则使用名称生成
    const itemId = itemData.id || itemData.itemId || `item_${itemName.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // 使用背包模型的addItemToBag函数
    return await addItemToBag(userId, itemId, quantity);
  } catch (error) {
    console.error('处理物品添加到背包失败:', error);

    return false;
  }
}

/**
 * 执行GM指令：侠客获得物品
 */
export async function executeGMGiveItem(userId: string, itemName: string, quantity: number): Promise<{
  success: boolean;
  message: string;
  currentMoney?: number;
}> {
  // 防止数量过大
  const maxQuantity = 999999;
  const finalQuantity = Math.min(quantity, maxQuantity);

  // 处理铜钱逻辑
  if (itemName === '铜钱' || itemName === '铜币') {
    const success = await handleMoneyAdd(userId, finalQuantity);

    if (success) {
      const playerData = await getPlayerXKData(userId);

      return {
        success: true,
        message: `GM指令执行成功！获得铜钱*${finalQuantity}`,
        currentMoney: playerData?.money || 0
      };
    } else {
      return {
        success: false,
        message: 'GM指令执行失败！请检查系统状态。'
      };
    }
  }

  // 处理普通物品逻辑
  const success = await handleItemAdd(userId, itemName, finalQuantity);

  if (success) {
    return {
      success: true,
      message: `GM指令执行成功！获得${itemName}*${finalQuantity}`
    };
  } else {
    return {
      success: false,
      message: `GM指令执行失败！物品${itemName}不存在或系统异常。`
    };
  }
}

/**
 * 解析GM指令
 */
export function parseGMCommand(messageText: string): {
  isValid: boolean;
  itemName?: string;
  quantity?: number;
  error?: string;
} {
  // 使用字符串分割方法解析指令，避免正则表达式问题
  if (!messageText.includes('侠客获得')) {
    return {
      isValid: false,
      error: '格式错误！正确格式：侠客获得物品名称*数量'
    };
  }

  // 提取指令部分
  const parts = messageText.split('侠客获得');

  if (parts.length < 2) {
    return {
      isValid: false,
      error: '格式错误！正确格式：侠客获得物品名称*数量'
    };
  }

  const itemPart = parts[1].trim();

  // 检查是否包含*号
  if (!itemPart.includes('*')) {
    return {
      isValid: false,
      error: '格式错误！正确格式：侠客获得物品名称*数量'
    };
  }

  const itemParts = itemPart.split('*');

  if (itemParts.length !== 2) {
    return {
      isValid: false,
      error: '格式错误！正确格式：侠客获得物品名称*数量'
    };
  }

  const itemName = itemParts[0].trim();
  const rawQuantity = itemParts[1].trim();

  if (!itemName) {
    return {
      isValid: false,
      error: '物品名称不能为空！'
    };
  }

  const quantity = toInt(rawQuantity, 1);

  if (quantity <= 0) {
    return {
      isValid: false,
      error: '数量必须大于0！'
    };
  }

  return {
    isValid: true,
    itemName,
    quantity
  };
}
