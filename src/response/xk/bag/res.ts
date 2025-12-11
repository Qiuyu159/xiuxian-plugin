import { onResponse, useSend, Text } from 'alemonjs';
import { redis } from '@src/model/api';
import { existplayer } from '@src/model/index';
import { selects } from '@src/response/mw-captcha';
import mw from '@src/response/mw-captcha';
import {
  getBagInfo,
  getBagItems,
  getItemCategory,
  savePlayerBag,
  ITEM_CATEGORIES,
  BagData
} from '@src/model/xk/bag';

export const regular = /^(#|＃|\/)?侠客背包$/;

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

  // 获取背包信息
  const bagInfo = await getBagInfo(userId);

  if (!bagInfo) {
    // 如果背包不存在，创建初始背包
    const xkPlayerData = JSON.parse(xkPlayerDataStr);
    const initialBagData: BagData = {
      id: xkPlayerData.id || userId,
      uid: userId,
      名号: xkPlayerData.名号,
      装备: [],
      消耗: [],
      武学: [],
      材料: [],
      任务: [],
      其他: []
    };

    // 保存初始背包数据
    await savePlayerBag(userId, initialBagData);

    void Send(Text(`------侠客背包------\n玩家：${xkPlayerData.名号}\n背包已初始化，当前为空`));

    return false;
  }

  // 构建背包信息显示
  let bagMessage = `------侠客背包------\n玩家：${JSON.parse(xkPlayerDataStr).名号}\n`;

  bagMessage += `总物品数：${bagInfo.totalItems}\n\n`;

  for (const [category, info] of Object.entries(bagInfo.categories)) {
    bagMessage += `${category}：${info.count}种 ${info.totalQuantity}个\n`;
  }

  // 获取物品列表
  const allItems = await getBagItems(userId);

  if (allItems.length > 0) {
    bagMessage += '\n物品列表：\n';

    // 按分类显示物品 - 包括所有分类和"其他"分类
    const allCategories = { ...ITEM_CATEGORIES, 其他: [] };

    for (const [category, _items] of Object.entries(allCategories)) {
      const categoryItems = allItems.filter(item => getItemCategory(item.type) === category);

      if (categoryItems.length > 0) {
        bagMessage += `\n【${category}】\n`;

        categoryItems.forEach((item, index) => {
          if (index < 10) { // 限制显示数量
            let itemDisplay = `${item.name} x${item.quantity}`;

            // 显示品质
            if (item.quality) {
              itemDisplay += ` (${item.quality})`;
            }

            // 显示装备唯一ID
            if (item.uniqueId) {
              itemDisplay += ` [ID:${item.uniqueId}]`;
            }

            // 显示锻造数（如果有）
            if (item.forgeLevel) {
              itemDisplay += ` [锻造:${item.forgeLevel}]`;
            }

            bagMessage += itemDisplay + '\n';
          }
        });

        if (categoryItems.length > 10) {
          bagMessage += `... 还有${categoryItems.length - 10}件物品\n`;
        }
      }
    }
  } else {
    bagMessage += '\n背包为空';
  }

  void Send(Text(bagMessage));

  return false;
});

export default onResponse(selects, [mw.current, res.current]);
