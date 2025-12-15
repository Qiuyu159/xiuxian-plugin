import { Text, useSend } from 'alemonjs';
import { selects } from '@src/response/mw-captcha';
import mw from '@src/response/mw-captcha';
export const regular = /^(#|＃|\/)?侠客上阵.*$/;

const res = onResponse(selects, e => {
  const Send = useSend(e);

  logger.info(`测试上阵成功: ${e.MessageText}`);
  void Send(Text('测试上阵'));

  return false;
});

export default onResponse(selects, [mw.current, res.current]);
