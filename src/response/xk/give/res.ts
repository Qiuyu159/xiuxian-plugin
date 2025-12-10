import { Bot } from 'alemon';
import { giveItemToCharacter } from '../../../../model/xk/give';

// 侠客赠送正则表达式：侠客赠送+角色名称*物品名称*数量
const giveRegex = /^侠客赠送\s*(.+?)\s*\*\s*(.+?)\s*\*\s*(\d+)$/;

export const giveRes = Bot.Regex(/^侠客赠送/, async (e, _exec) => {
  try {
    // 解析赠送命令
    const match = e.msg.match(giveRegex);

    if (!match) {
      return Bot.html('格式错误！请使用格式：侠客赠送+角色名称*物品名称*数量');
    }

    const characterName = match[1].trim();
    const itemName = match[2].trim();
    const quantity = parseInt(match[3]);

    if (quantity <= 0) {
      return Bot.html('数量必须大于0！');
    }

    // 调用赠送逻辑
    const result = await giveItemToCharacter(e.user_id, characterName, itemName, quantity);

    if (result.success) {
      return Bot.html(result.message);
    } else {
      return Bot.html(result.error || '赠送失败！');
    }
  } catch (error) {
    console.error('侠客赠送处理错误:', error);

    return Bot.html('处理赠送请求时发生错误，请稍后重试！');
  }
});
