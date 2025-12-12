import { Text, useSend } from 'alemonjs';

import { selects } from '@src/response/mw-captcha';
import mw from '@src/response/mw-captcha';
export const regular = /^(#|＃|\/)?测试空存档$/;

const res = onResponse(selects, e => {
  const Send = useSend(e);

  //
  void Send(Text('测试空存档'));

  return false;
});

export default onResponse(selects, [mw.current, res.current]);
