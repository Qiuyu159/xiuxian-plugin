import { useSend, Text } from 'alemonjs';
import { getPlayerFavorability, hasFavorabilityRecord, getCharacterList } from '../../../model/xk/favorability';
import { selects } from '../../mw-captcha';
import mw from '@src/response/mw-captcha';
// 查看好感度指令前缀
export const regular = /^(#|＃|\/)?侠客查看好感度.*$/;

const res = onResponse(selects, async e => {
  const Send = useSend(e);

  try {
    const messageText = e.MessageText.trim();

    // 提取指令主体部分
    const body = messageText.split('侠客查看好感度')[1]?.trim() || '';

    // 如果没有指定角色名称，显示所有角色的好感度
    if (!body) {
      const characterList = await getCharacterList();

      if (characterList.length === 0) {
        void Send(Text('您还没有与任何侠客建立好感度记录！'));

        return true;
      }

      // 获取所有角色的好感度
      let message = '您与各侠客的好感度：\\n';
      let hasRecord = false;

      for (const characterName of characterList) {
        const favorability = await getPlayerFavorability(e.UserId, characterName);

        if (favorability > 0) {
          message += `${characterName}：${favorability}点好感度\\n`;
          hasRecord = true;
        }
      }

      if (!hasRecord) {
        void Send(Text('您还没有与这些侠客建立好感度记录！'));
      } else {
        void Send(Text(message));
      }

      return true;
    }

    // 处理指定角色名称的情况
    const characterName = body;

    // 检查是否有该角色的好感度记录
    const hasRecord = await hasFavorabilityRecord(e.UserId, characterName);

    if (!hasRecord) {
      void Send(Text(`您还没有与${characterName}建立好感度记录！`));

      return true;
    }

    // 获取好感度数值
    const favorability = await getPlayerFavorability(e.UserId, characterName);

    // 根据好感度等级显示不同的描述
    let levelDescription = '';

    if (favorability <= 20) {
      levelDescription = '（萍水相逢）';
    } else if (favorability <= 40) {
      levelDescription = '（点头之交）';
    } else if (favorability <= 60) {
      levelDescription = '（知交好友）';
    } else if (favorability <= 80) {
      levelDescription = '（莫逆之交）';
    } else {
      levelDescription = '（生死之交）';
    }

    void Send(Text(`您与${characterName}的好感度为：${favorability}点${levelDescription}`));
  } catch (error) {
    console.error('查看好感度处理错误:', error);
    void Send(Text('处理查看好感度请求时发生错误，请稍后重试！'));
  }

  return true;
});

export default onResponse(selects, [mw.current, res.current]);
