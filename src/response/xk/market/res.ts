import { Text, useSend } from 'alemonjs';
import { redis } from '@src/model/api';
import { existplayer } from '@src/model/index';
import { selects } from '@src/response/mw-captcha';

export const regular = /^(#|＃|\/)?(开封|杭州|广州|大理|京城)?(购买|出售)((.*)|(.*)*(.*))$/;

function toInt(v, d = 0) {
  const n = Number(v);

  return Number.isFinite(n) ? Math.trunc(n) : d;
}

const MAX_QTY = 9999;

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

  const xkPlayerData = JSON.parse(xkPlayerDataStr);

  // 解析指令
  const match = e.MessageText.match(/^(#|＃|\/)?(开封|杭州|广州|大理|京城)?(购买|出售)((.*)|(.*)*(.*))$/);
  const city = match?.[2] || '';
  const operation = match?.[3];
  const raw = match?.[4]?.trim() || '';

  if (!raw) {
    void Send(Text(`格式: ${city}${operation}物品名*数量 (数量可省略)`));

    return false;
  }

  const [rawName, rawQty] = raw.split('*');
  const itemName = rawName?.trim();

  if (!itemName) {
    void Send(Text('物品名称不能为空'));

    return false;
  }

  // 从Redis中获取XKItem数据
  const xkItemData = await redis.get('XKItem');
  let xkItemList = [];

  if (xkItemData) {
    try {
      xkItemList = JSON.parse(xkItemData);
    } catch (_error) {
      void Send(Text('侠客物品数据异常'));

      return false;
    }
  }

  // 查找商品 - 支持多种可能的字段名
  const goods = xkItemList.find((item: any) => item.name === itemName
    || item.名称 === itemName
    || item.itemName === itemName
  );

  if (!goods) {
    // 如果找不到商品，显示可用的商品列表
    const availableItems = xkItemList.map((item: any) => item.name || item.名称 || item.itemName).filter(Boolean);

    if (availableItems.length > 0) {
      void Send(Text(`侠客江湖还没有这样的东西: ${itemName}\n当前可交易物品: ${availableItems.join(', ')}`));
    } else {
      void Send(Text(`侠客江湖还没有这样的东西: ${itemName}\n商品数据为空`));
    }

    return false;
  }

  let qty = toInt(rawQty, 1);

  if (!Number.isFinite(qty) || qty <= 0) {
    qty = 1;
  }
  if (qty > MAX_QTY) {
    qty = MAX_QTY;
  }

  const tongbi = Number(xkPlayerData.铜币) || 0;

  if (operation === '购买') {
    // 购买逻辑 - 支持多种可能的购买价格字段名
    const buyPrice = goods.buyPrice || goods.购买价 || goods.buy_price || goods.price || 0;
    const unitPrice = Math.max(0, Number(buyPrice) || 0);
    let totalPrice = Math.trunc(unitPrice * qty);

    if (totalPrice <= 0) {
      totalPrice = 1;
    }

    // 防溢出
    if (!Number.isFinite(totalPrice) || totalPrice > 1e15) {
      void Send(Text('价格异常，购买已取消'));

      return false;
    }

    if (tongbi < totalPrice) {
      void Send(Text(`口袋里的铜币不足以支付 ${itemName}, 还需要 ${totalPrice - tongbi} 铜币`));

      return false;
    }

    // 更新玩家数据
    xkPlayerData.铜币 = tongbi - totalPrice;

    // 更新背包
    if (!xkPlayerData.背包) {
      xkPlayerData.背包 = [];
    }

    const existingItem = xkPlayerData.背包.find((item: any) => item.name === itemName);

    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 0) + qty;
    } else {
      xkPlayerData.背包.push({
        name: itemName,
        quantity: qty
      });
    }

    await redis.set(`xk_player_data:${userId}`, JSON.stringify(xkPlayerData));
    void Send(Text(`${city}购买成功! 获得[${itemName}]*${qty}, 花费[${totalPrice}]铜币, 剩余[${tongbi - totalPrice}]铜币`));
  } else if (operation === '出售') {
    // 出售逻辑 - 支持多种可能的出售价格字段名
    const sellPrice = goods.sellPrice || goods.出售价 || goods.sell_price || goods.sellPrice || 0;
    const unitPrice = Math.max(0, Number(sellPrice) || 0);
    let totalPrice = Math.trunc(unitPrice * qty);

    if (totalPrice <= 0) {
      totalPrice = 1;
    }

    // 防溢出
    if (!Number.isFinite(totalPrice) || totalPrice > 1e15) {
      void Send(Text('价格异常，出售已取消'));

      return false;
    }

    // 检查背包是否有足够物品
    if (!xkPlayerData.背包) {
      xkPlayerData.背包 = [];
    }

    const existingItem = xkPlayerData.背包.find((item: any) => item.name === itemName);

    if (!existingItem || existingItem.quantity < qty) {
      void Send(Text(`背包中没有足够的 ${itemName} 用于出售`));

      return false;
    }

    // 更新玩家数据
    xkPlayerData.铜币 = tongbi + totalPrice;

    // 更新背包
    existingItem.quantity -= qty;
    if (existingItem.quantity <= 0) {
      xkPlayerData.背包 = xkPlayerData.背包.filter((item: any) => item.name !== itemName);
    }

    await redis.set(`xk_player_data:${userId}`, JSON.stringify(xkPlayerData));
    void Send(Text(`${city}出售成功! 出售[${itemName}]*${qty}, 获得[${totalPrice}]铜币, 剩余[${tongbi + totalPrice}]铜币`));
  }

  return false;
});

export default onResponse(selects, res.current);
