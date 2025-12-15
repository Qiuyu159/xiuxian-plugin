import { Text, useSend } from 'alemonjs';
import { redis } from '@src/model/api';
import { existplayer } from '@src/model/index';
import { selects } from '@src/response/mw-captcha';
import { parseGMCommand, executeGMGiveItem } from '@src/model/xk/gm';
import mw from '@src/response/mw-captcha';
/**
 * GM指令：侠客获得物品名称*数量
 * 如果物品名称是铜钱，则直接在角色信息里加对应数量的money
 * 其他物品在XKItem表中查找对应物品的对象数据，然后加入到玩家的背包里面
 * 背包逻辑：如果背包里有物品了，那么直接背包里的物品数量加上加入到背包里的物品数量
 * 如果背包里没有，就直接把对象数据加入到背包里
 */
// GM指令前缀
export const regular = /^(#|＃|\/)?侠客获得.*$/;

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
  const parseResult = parseGMCommand(e.MessageText);

  if (!parseResult.isValid) {
    void Send(Text(parseResult.error || '格式错误！正确格式：侠客获得物品名称*数量'));

    return false;
  }

  // 执行GM指令
  const result = await executeGMGiveItem(userId, parseResult.itemName!, parseResult.quantity!);

  if (result.success) {
    if (result.currentMoney !== undefined) {
      void Send(Text(`${result.message}\n当前铜钱：${result.currentMoney}`));
    } else {
      void Send(Text(result.message));
    }
  } else {
    void Send(Text(result.message));
  }

  return false;
});

export default onResponse(selects, [mw.current, res.current]);
