import { Text, useSend } from 'alemonjs';
import { redis } from '@src/model/api';
import { existplayer } from '@src/model/index';
import { selects } from '@src/response/mw-captcha';
import { onResponse } from 'alemonjs';

/**
 * GM指令：侠客获得物品名称*数量
 * 如果物品名称是铜钱，则直接在角色信息里加对应数量的money
 * 其他物品在XKItem表中查找对应物品的对象数据，然后加入到玩家的背包里面
 * 背包逻辑：如果背包里有物品了，那么直接背包里的物品数量加上加入到背包里的物品数量
 * 如果背包里没有，就直接把对象数据加入到背包里
 */
export const regular = /^(#|＃|\/)?侠客获得(.*)\*(\d+)$/;

/**
 * 将字符串转换为整数
 */
function toInt(v: string, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : d;
}

/**
 * 获取物品在XKItem表中的数据
 */
async function getItemData(itemName: string): Promise<any> {
  try {
    const xkItemData = await redis.get('XKItem');
    
    if (!xkItemData) {
      return null;
    }

    const xkItemList = JSON.parse(xkItemData);
    
    // 查找物品 - 支持多种可能的字段名
    const item = xkItemList.find((item: any) => 
      item.name === itemName || 
      item.名称 === itemName || 
      item.itemName === itemName
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
async function getPlayerXKData(userId: string): Promise<any> {
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
async function savePlayerXKData(userId: string, playerData: any): Promise<boolean> {
  try {
    await redis.set(`xk_player_data:${userId}`, JSON.stringify(playerData));
    return true;
  } catch (error) {
    console.error('保存玩家侠客数据失败:', error);
    return false;
  }
}

/**
 * 获取玩家背包数据
 */
async function getPlayerBagData(userId: string): Promise<any> {
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
async function savePlayerBagData(userId: string, bagData: any): Promise<boolean> {
  try {
    await redis.set(`xk_bag:${userId}`, JSON.stringify(bagData));
    return true;
  } catch (error) {
    console.error('保存玩家背包数据失败:', error);
    return false;
  }
}

/**
 * 处理铜钱添加逻辑
 */
async function handleMoneyAdd(userId: string, quantity: number): Promise<boolean> {
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
async function handleItemAdd(userId: string, itemName: string, quantity: number): Promise<boolean> {
  try {
    // 获取物品数据
    const itemData = await getItemData(itemName);
    
    if (!itemData) {
      return false;
    }

    // 获取玩家背包数据
    let bagData = await getPlayerBagData(userId);
    
    if (!bagData) {
      // 如果背包不存在，创建初始背包
      const playerData = await getPlayerXKData(userId);
      
      if (!playerData) {
        return false;
      }

      bagData = {
        id: playerData.id || userId,
        uid: userId,
        名号: playerData.名号,
        装备: [],
        消耗: [],
        武学: [],
        材料: [],
        任务: []
      };
    }

    // 根据物品类型确定分类
    let category = '消耗';
    if (itemData.type) {
      if (itemData.type.includes('装备') || itemData.type.includes('武器')) {
        category = '装备';
      } else if (itemData.type.includes('武学') || itemData.type.includes('秘籍')) {
        category = '武学';
      } else if (itemData.type.includes('材料')) {
        category = '材料';
      } else if (itemData.type.includes('任务')) {
        category = '任务';
      }
    }

    // 查找背包中是否已有该物品
    const existingItem = bagData[category].find((item: any) => 
      item.name === itemName || 
      item.名称 === itemName || 
      item.itemName === itemName
    );

    if (existingItem) {
      // 如果已有物品，增加数量
      existingItem.quantity = (existingItem.quantity || 0) + quantity;
    } else {
      // 如果没有物品，添加新物品
      bagData[category].push({
        name: itemName,
        quantity: quantity,
        quality: itemData.quality || '普通',
        type: itemData.type || '消耗',
        description: itemData.description || '',
        maxStack: itemData.maxStack || 999,
        buyPrice: itemData.buyPrice || 0,
        sellPrice: itemData.sellPrice || 0
      });
    }

    return await savePlayerBagData(userId, bagData);
  } catch (error) {
    console.error('处理物品添加到背包失败:', error);
    return false;
  }
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

  // 解析指令
  const match = e.MessageText.match(/^(#|＃|\/)?侠客获得(.*)\*(\d+)$/);
  
  if (!match) {
    void Send(Text('格式错误！正确格式：侠客获得物品名称*数量'));
    return false;
  }

  const itemName = match[2]?.trim();
  const rawQuantity = match[3];

  if (!itemName) {
    void Send(Text('物品名称不能为空！'));
    return false;
  }

  const quantity = toInt(rawQuantity, 1);

  if (quantity <= 0) {
    void Send(Text('数量必须大于0！'));
    return false;
  }

  // 防止数量过大
  const maxQuantity = 999999;
  const finalQuantity = Math.min(quantity, maxQuantity);

  // 处理铜钱逻辑
  if (itemName === '铜钱' || itemName === '铜币') {
    const success = await handleMoneyAdd(userId, finalQuantity);
    
    if (success) {
      const playerData = await getPlayerXKData(userId);
      void Send(Text(`GM指令执行成功！获得铜钱*${finalQuantity}\n当前铜钱：${playerData?.money || 0}`));
    } else {
      void Send(Text('GM指令执行失败！请检查系统状态。'));
    }
    
    return false;
  }

  // 处理普通物品逻辑
  const success = await handleItemAdd(userId, itemName, finalQuantity);
  
  if (success) {
    void Send(Text(`GM指令执行成功！获得${itemName}*${finalQuantity}`));
  } else {
    void Send(Text(`GM指令执行失败！物品${itemName}不存在或系统异常。`));
  }

  return false;
});

export default onResponse(selects, res.current);