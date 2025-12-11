import { Text, useSend } from 'alemonjs';
import { onResponse } from 'alemonjs';
import {
  isPlayerRegistered,
  registerNewXKPlayer,
  generatePlayerInfoText
} from '@src/model/xk/register';
import { selects } from '@src/response/mw-captcha';
import mw from '@src/response/mw-captcha';
import { existplayer } from '@src/model';

// 侠客注册指令正则表达式 - 只处理"进入侠客江湖"
export const regular = /^(#|＃|\/)?进入侠客江湖$/;
const res = onResponse(selects, async e => {
  const Send = useSend(e);
  const userId = e.UserId;

if (!(await existplayer(userId))) {
    return false;
  }
  // 检查玩家是否已在侠客江湖注册过
  const isRegistered = await isPlayerRegistered(userId);

  if (isRegistered) {
    // 玩家已注册，提示已注册信息
    void Send(Text('您已经在侠客江湖注册过了！'));

    return false;
  }

  // 执行注册流程
  const result = await registerNewXKPlayer(userId);

  if (result.success && result.playerData) {
    const welcomeMessage = generatePlayerInfoText(result.playerData);

    void Send(Text(welcomeMessage));
  } else {
    void Send(Text(result.error || '侠客注册失败，请稍后重试！'));
  }

  return false;
});

export default onResponse(selects, [mw.current, res.current]);
