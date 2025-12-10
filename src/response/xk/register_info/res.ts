import { Text, useSend } from 'alemonjs';
import { onResponse } from 'alemonjs';
import {
  isPlayerRegistered,
  getPlayerXKData,
  generatePlayerInfoText,
  generateRegistrationPrompt
} from '@src/model/xk/register';
import { selects } from '@src/response/mw-captcha';
import mw from '@src/response/mw-captcha';

// 侠客信息查询指令正则表达式 - 只处理"侠客信息"
export const infoRegular = /^(#|＃|\/)?侠客信息$/;

const infoResponse = onResponse(selects, async e => {
  const Send = useSend(e);
  const userId = e.UserId;

  // 检查消息是否匹配侠客信息指令
  if (!infoRegular.test(e.MessageText)) {
    return true; // 不匹配，继续处理其他模块
  }

  // 检查玩家是否已注册
  const isRegistered = await isPlayerRegistered(userId);

  if (isRegistered) {
    // 获取玩家数据并显示信息
    const playerData = await getPlayerXKData(userId);

    if (playerData) {
      const infoMessage = generatePlayerInfoText(playerData);

      void Send(Text(infoMessage));
    } else {
      void Send(Text('未能获取您的侠客信息，请重新注册！'));
    }
  } else {
    // 显示注册提示
    const registrationPrompt = generateRegistrationPrompt();

    void Send(Text(registrationPrompt));
  }

  return false;
});

export default onResponse(selects, [mw.current, infoResponse.current]);
