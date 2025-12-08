import { PlayerManager } from './PlayerManager/res';
import { BagManager } from './bag/res';

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

// 物品价格配置（从goods.json动态获取）
function getItemPrice(itemName: string): PriceInfo {
    // 查找物品信息
    const itemInfo = BagManager.goodsData.find((item: any) => item.name === itemName);
    
    if (!itemInfo) {
        // 如果找不到物品，返回默认价格
        console.warn(`物品 "${itemName}" 未在goods.json中找到，使用默认价格`);
        return { buy: 100, sell: 10 };
    }
    
    // 使用goods.json中的价格
    return { 
        buy: itemInfo.buyPrice || 100, 
        sell: itemInfo.sellPrice || 10 
    };
}

// 主要交易函数
export function market(thing: string, account: number, marketType: string): TransactionResult {
    const playerId = 'test_player_001'; // 默认玩家ID，可以扩展为多玩家
    
    // 参数验证
    if (!thing || !account || !marketType) {
        return { success: false, message: '参数不完整：需要物品名称、数量和交易类型' };
    }
    
    if (typeof account !== 'number' || account <= 0) {
        return { success: false, message: '数量必须是大于0的数字' };
    }
    
    if (marketType !== 'buy' && marketType !== 'sell') {
        return { success: false, message: '交易类型必须是 buy 或 sell' };
    }
    
    try {
        if (marketType === 'buy') {
            return buyItem(thing, account, playerId);
        } else {
            return sellItem(thing, account, playerId);
        }
    } catch (error: any) {
        return { success: false, message: `交易失败: ${error.message}` };
    }
}

// 购买物品
function buyItem(itemName: string, quantity: number, playerId: string): TransactionResult {
    // 获取物品价格
    const priceInfo = getItemPrice(itemName);
    const totalCost = priceInfo.buy * quantity;
    
    // 检查玩家是否有足够货币
    if (!PlayerManager.hasEnoughMoney(playerId, totalCost)) {
        return { 
            success: false, 
            message: `货币不足！需要 ${totalCost}，当前只有 ${PlayerManager.getPlayerMoney(playerId)}` 
        };
    }
    
    // 添加到背包（bag.addItem返回布尔值）
    const addSuccess = BagManager.addItem(playerId, itemName, quantity);
    if (!addSuccess) {
        return { success: false, message: `添加到背包失败: 物品可能不存在或添加失败` };
    }
    
    // 扣除货币
    PlayerManager.updatePlayerMoney(playerId, -totalCost);
    
    return {
        success: true,
        message: `成功购买 ${quantity} 个 ${itemName}`,
        details: {
            item: itemName,
            quantity: quantity,
            cost: totalCost,
            remainingMoney: PlayerManager.getPlayerMoney(playerId)
        }
    };
}

// 出售物品
function sellItem(itemName: string, quantity: number, playerId: string): TransactionResult {
    // 检查背包中是否有足够物品
    const playerBag = BagManager.getPlayerBag(playerId);
    let itemFound = false;
    let availableQuantity = 0;
    let itemId: string | null = null;
    
    // 在所有分类中查找物品
    for (const category of Object.keys(playerBag)) {
        const items = playerBag[category];
        const item = items.find((i: any) => i.name === itemName);
        if (item) {
            itemFound = true;
            itemId = item.id;
            availableQuantity = item.quantity || 1;
            break;
        }
    }
    
    if (!itemFound) {
        return { success: false, message: `背包中没有 ${itemName}` };
    }
    
    if (availableQuantity < quantity) {
        return { 
            success: false, 
            message: `物品数量不足！需要 ${quantity}，当前只有 ${availableQuantity}` 
        };
    }
    
    // 获取物品价格
    const priceInfo = getItemPrice(itemName);
    const totalEarn = priceInfo.sell * quantity;
    
    // 从背包移除物品（bag.removeItem返回布尔值）
    const removeSuccess = BagManager.removeItem(playerId, itemId!, quantity);
    if (!removeSuccess) {
        return { success: false, message: `从背包移除失败: 物品可能不存在或移除失败` };
    }
    
    // 增加货币
    PlayerManager.updatePlayerMoney(playerId, totalEarn);
    
    return {
        success: true,
        message: `成功出售 ${quantity} 个 ${itemName}`,
        details: {
            item: itemName,
            quantity: quantity,
            earned: totalEarn,
            remainingMoney: PlayerManager.getPlayerMoney(playerId)
        }
    };
}

// 获取物品市场价格信息
export function getMarketPrice(itemName: string): PriceInfo {
    return getItemPrice(itemName);
}

// 获取玩家交易信息
export function getPlayerMarketInfo(playerId: string): PlayerMarketInfo {
    const player = PlayerManager.getPlayer(playerId);
    const playerBag = BagManager.getPlayerBag(playerId);
    
    // 计算背包中物品的总价值
    let totalValue = 0;
    const itemsValue: { [category: string]: ItemValueInfo[] } = {};
    
    for (const [category, items] of Object.entries(playerBag)) {
        itemsValue[category] = [];
        
        for (const item of items as any[]) {
            const priceInfo = getItemPrice(item.name);
            const itemValue = priceInfo.sell * (item.quantity || 1);
            totalValue += itemValue;
            
            itemsValue[category].push({
                name: item.name,
                quantity: item.quantity || 1,
                sellPrice: priceInfo.sell,
                totalValue: itemValue
            });
        }
    }
    
    return {
        playerId: playerId,
        money: player.money,
        totalInventoryValue: totalValue,
        itemsValue: itemsValue
    };
}