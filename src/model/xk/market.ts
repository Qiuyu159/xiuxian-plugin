import { redis } from '@src/model/api';
import { readPlayer } from '@src/model/index';

// 价格信息接口
interface PriceInfo {
    buy: number;
    sell: number;
}

// 交易结果接口
interface TransactionResult {
    success: boolean;
    message: string;
    details?: {
        item: string;
        quantity: number;
        cost?: number;
        earned?: number;
        remainingMoney: number;
    };
}

// 物品价值信息接口
interface ItemValueInfo {
    name: string;
    quantity: number;
    sellPrice: number;
    totalValue: number;
}

// 玩家市场信息接口
interface PlayerMarketInfo {
    playerId: string;
    money: number;
    totalInventoryValue: number;
    itemsValue: { [category: string]: ItemValueInfo[] };
}

// 侠客玩家数据接口
interface XKPlayerData {
    id: string;
    uid: string;
    名号: string;
    铜币: number;
    周目: number;
}

/**
 * 获取侠客玩家数据
 */
async function getXKPlayerData(userId: string): Promise<XKPlayerData | null> {
    try {
        const xkPlayerDataStr = await redis.get(`xk_player_data:${userId}`);

        if (!xkPlayerDataStr) {
            return null;
        }

        return JSON.parse(xkPlayerDataStr);
    } catch (error) {
        console.error('获取侠客玩家数据失败:', error);

        return null;
    }
}

/**
 * 保存侠客玩家数据
 */
async function saveXKPlayerData(userId: string, playerData: XKPlayerData): Promise<boolean> {
    try {
        await redis.set(`xk_player_data:${userId}`, JSON.stringify(playerData));

        return true;
    } catch (error) {
        console.error('保存侠客玩家数据失败:', error);

        return false;
    }
}

/**
 * 获取玩家背包数据
 */
async function getPlayerBag(userId: string): Promise<any> {
    try {
        const bagDataStr = await redis.get(`xk_bag:${userId}`);

        if (!bagDataStr) {
            return {};
        }

        return JSON.parse(bagDataStr);
    } catch (error) {
        console.error('获取玩家背包数据失败:', error);

        return {};
    }
}

/**
 * 保存玩家背包数据
 */
async function savePlayerBag(userId: string, bagData: any): Promise<boolean> {
    try {
        await redis.set(`xk_bag:${userId}`, JSON.stringify(bagData));

        return true;
    } catch (error) {
        console.error('保存玩家背包数据失败:', error);

        return false;
    }
}

/**
 * 添加物品到背包
 */
async function addItemToBag(userId: string, itemName: string, quantity: number): Promise<boolean> {
    const bagData = await getPlayerBag(userId);

    // 简化实现：直接添加到背包
    if (!bagData.items) {
        bagData.items = [];
    }

    // 查找是否已有相同物品
    const existingItem = bagData.items.find((item: any) => item.name === itemName);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        bagData.items.push({
            name: itemName,
            quantity: quantity
        });
    }

    return await savePlayerBag(userId, bagData);
}

/**
 * 从背包移除物品
 */
async function removeItemFromBag(userId: string, itemName: string, quantity: number): Promise<boolean> {
    const bagData = await getPlayerBag(userId);

    if (!bagData.items) {
        return false;
    }

    const itemIndex = bagData.items.findIndex((item: any) => item.name === itemName);

    if (itemIndex === -1) {
        return false;
    }

    const item = bagData.items[itemIndex];

    if (item.quantity > quantity) {
        item.quantity -= quantity;
    } else {
        bagData.items.splice(itemIndex, 1);
    }

    return await savePlayerBag(userId, bagData);
}

/**
 * 从Redis获取xk_goods数据
 */
async function getXKGoodsData(): Promise<any[]> {
    try {
        const xkGoodsDataStr = await redis.get('xk_goods');

        if (!xkGoodsDataStr) {
            console.error('xk_goods数据不存在于Redis中');

            return [];
        }

        return JSON.parse(xkGoodsDataStr);
    } catch (error) {
        console.error('获取xk_goods数据失败:', error);

        return [];
    }
}

/**
 * 从xk_goods数据中获取物品价格
 */
async function getItemPrice(itemName: string): Promise<PriceInfo> {
    try {
        const xkGoodsData = await getXKGoodsData();

        // 在xk_goods数据中搜索物品
        const item = xkGoodsData.find((goods: any) => goods.name === itemName);

        if (item?.buyPrice !== undefined && item.sellPrice !== undefined) {
            return {
                buy: item.buyPrice,
                sell: item.sellPrice
            };
        }

        // 如果找不到，返回默认价格
        console.warn(`在xk_goods中未找到物品"${itemName}"的价格信息，使用默认价格`);

        return { buy: 100, sell: 10 };
    } catch (error) {
        console.error('获取物品价格失败:', error);

        return { buy: 100, sell: 10 };
    }
}

/**
 * 主要交易函数
 */
export async function marketTransaction(itemName: string, quantity: number, transactionType: 'buy' | 'sell', userId: string): Promise<TransactionResult> {
    // 参数验证
    if (!itemName || !quantity || !transactionType || !userId) {
        return { success: false, message: '参数不完整：需要物品名称、数量、交易类型和玩家ID' };
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
        return { success: false, message: '数量必须是大于0的数字' };
    }

    if (transactionType !== 'buy' && transactionType !== 'sell') {
        return { success: false, message: '交易类型必须是 buy 或 sell' };
    }

    try {
        if (transactionType === 'buy') {
            return await buyItem(itemName, quantity, userId);
        } else {
            return await sellItem(itemName, quantity, userId);
        }
    } catch (error: any) {
        return { success: false, message: `交易失败: ${error.message}` };
    }
}

/**
 * 购买物品
 */
async function buyItem(itemName: string, quantity: number, userId: string): Promise<TransactionResult> {
    // 获取物品价格
    const priceInfo = await getItemPrice(itemName);
    const totalCost = priceInfo.buy * quantity;

    // 获取玩家数据
    const playerData = await getXKPlayerData(userId);

    if (!playerData) {
        return { success: false, message: '玩家数据不存在，请先注册侠客' };
    }

    // 检查玩家是否有足够货币
    if (playerData.铜币 < totalCost) {
        return {
            success: false,
            message: `铜币不足！需要 ${totalCost}，当前只有 ${playerData.铜币}`
        };
    }

    // 添加到背包
    const addSuccess = await addItemToBag(userId, itemName, quantity);

    if (!addSuccess) {
        return { success: false, message: '添加到背包失败' };
    }

    // 扣除货币
    playerData.铜币 -= totalCost;
    const saveSuccess = await saveXKPlayerData(userId, playerData);

    if (!saveSuccess) {
        return { success: false, message: '更新玩家数据失败' };
    }

    return {
        success: true,
        message: `成功购买 ${quantity} 个 ${itemName}`,
        details: {
            item: itemName,
            quantity: quantity,
            cost: totalCost,
            remainingMoney: playerData.铜币
        }
    };
}

/**
 * 出售物品
 */
async function sellItem(itemName: string, quantity: number, userId: string): Promise<TransactionResult> {
    // 检查背包中是否有足够物品
    const bagData = await getPlayerBag(userId);

    if (!bagData.items) {
        return { success: false, message: `背包中没有 ${itemName}` };
    }

    const item = bagData.items.find((item: any) => item.name === itemName);

    if (!item) {
        return { success: false, message: `背包中没有 ${itemName}` };
    }

    if (item.quantity < quantity) {
        return {
            success: false,
            message: `物品数量不足！需要 ${quantity}，当前只有 ${item.quantity}`
        };
    }

    // 获取物品价格
    const priceInfo = await getItemPrice(itemName);
    const totalEarn = priceInfo.sell * quantity;

    // 从背包移除物品
    const removeSuccess = await removeItemFromBag(userId, itemName, quantity);

    if (!removeSuccess) {
        return { success: false, message: '从背包移除失败' };
    }

    // 获取玩家数据
    const playerData = await getXKPlayerData(userId);

    if (!playerData) {
        return { success: false, message: '玩家数据不存在' };
    }

    // 增加货币
    playerData.铜币 += totalEarn;
    const saveSuccess = await saveXKPlayerData(userId, playerData);

    if (!saveSuccess) {
        return { success: false, message: '更新玩家数据失败' };
    }

    return {
        success: true,
        message: `成功出售 ${quantity} 个 ${itemName}`,
        details: {
            item: itemName,
            quantity: quantity,
            earned: totalEarn,
            remainingMoney: playerData.铜币
        }
    };
}

/**
 * 获取物品市场价格信息
 */
export async function getMarketPrice(itemName: string): Promise<PriceInfo> {
    return await getItemPrice(itemName);
}

/**
 * 获取玩家交易信息
 */
export async function getPlayerMarketInfo(userId: string): Promise<PlayerMarketInfo> {
    const playerData = await getXKPlayerData(userId);
    const bagData = await getPlayerBag(userId);

    if (!playerData) {
        return {
            playerId: userId,
            money: 0,
            totalInventoryValue: 0,
            itemsValue: {}
        };
    }

    // 计算背包中物品的总价值
    let totalValue = 0;
    const itemsValue: { [category: string]: ItemValueInfo[] } = {};

    if (bagData.items && Array.isArray(bagData.items)) {
        itemsValue['物品'] = [];

        for (const item of bagData.items) {
            const priceInfo = await getItemPrice(item.name);
            const itemValue = priceInfo.sell * (item.quantity || 1);

            totalValue += itemValue;

            itemsValue['物品'].push({
                name: item.name,
                quantity: item.quantity || 1,
                sellPrice: priceInfo.sell,
                totalValue: itemValue
            });
        }
    }

    return {
        playerId: userId,
        money: playerData.铜币,
        totalInventoryValue: totalValue,
        itemsValue: itemsValue
    };
}

// 导出市场管理函数供响应层使用
export type { PriceInfo, TransactionResult, PlayerMarketInfo };
