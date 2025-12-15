import { Text, useSend } from 'alemonjs';
import { selects } from '@src/response/mw-captcha';
import mw from '@src/response/mw-captcha';
import { isPlayerRegistered } from '@src/model/xk/register';
export const regular = /^(#|＃|\/)?测试空存档$/;

const res = onResponse(selects, async e => {
  const userId = e.UserId;
  const isRegistered = await isPlayerRegistered(userId);
  const Send = useSend(e);

  logger.info(`测试空存档成功: ${isRegistered}`);
  void Send(Text('测试空存档'));

  return false;
});

export default onResponse(selects, [mw.current, res.current]);
