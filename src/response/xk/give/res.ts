import { useSend, Text } from 'alemonjs';
import { giveItemToCharacter } from '../../../model/xk/give';
import { selects } from '../../mw-captcha';
import mw from '@src/response/mw-captcha';
// 赠予指令前缀
export const regular = /^(#|＃|\/)?侠客赠予.*$/;

const res = onResponse(selects, async e => {
  const Send = useSend(e);

  try {
    // 解析赠送命令 - 使用字符串分割方式
    const messageText = e.MessageText.trim();

    // 提取指令主体部分
    const body = messageText.split('侠客赠予')[1]?.trim() || '';

    // 使用*号分割参数
    const parts = body
      .split('*')
      .map(s => s.trim())
      .filter(Boolean);

    if (parts.length !== 3) {
      void Send(Text(`指令格式错误！请使用：${regular}+角色名称*物品名称*数量`));

      return false;
    }

    const characterName = parts[0];
    const itemName = parts[1];
    const quantity = parseInt(parts[2]);

    if (quantity <= 0) {
      void Send(Text('数量必须大于0！'));

      return false;
    }

    // 调用赠送逻辑
    const result = await giveItemToCharacter(e.UserId, characterName, itemName, quantity);

    if (result.success) {
      void Send(Text(result.message ?? '赠送成功！'));
    } else {
      void Send(Text(result.error || '赠送失败！'));
    }
  } catch (error) {
    console.error('侠客赠送处理错误:', error);
    void Send(Text('处理赠送请求时发生错误，请稍后重试！'));
  }

  return false;
});

export default onResponse(selects, [mw.current, res.current]);
