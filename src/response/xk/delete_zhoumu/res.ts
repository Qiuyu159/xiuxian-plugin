import { useSend, Text } from 'alemonjs';
import { readPlayer, writePlayer } from '@src/model/index';
import { selects } from '@src/response/mw-captcha';
import mw from '@src/response/mw-captcha';

// 删除周目数据指令正则表达式
export const regular = /^(#|＃|\/)?删除周目数据$/;

/**
 * 删除周目数据响应处理器
 */
const res = onResponse(selects, async e => {
  const Send = useSend(e);
  const userId = e.UserId;
  const message = e.MessageText;

  // 检查玩家是否存在
  const player = await readPlayer(userId);

  if (!player) {
    void Send(Text('请先创建角色！'));

    return false;
  }

  // 检查玩家是否有周目数据
  // if (!player.周目答题次数 || player.周目答题次数 === 0) {
  //   void Send(Text('您还没有进行过周目答题，无需删除周目数据。'));

  //   return false;
  // }

  // 确认删除操作
  if (message.includes('确认删除')) {
    // 执行删除操作
    await deleteZhoumuData(userId, player);

    void Send(Text('周目数据已成功删除！您可以重新进行周目答题。'));

    return false;
  } else if (message.includes('取消删除')) {
    void Send(Text('已取消删除周目数据。'));

    return false;
  } else {
    // 显示确认提示
    const confirmMessage = '=== 删除周目数据确认 ===\n'
      + '您确定要删除所有周目数据吗？\n'
      + '删除后将：\n'
      + '- 清除周目答题次数记录\n'
      + '- 清除周目属性数据\n'
      + '- 可以重新进行周目答题\n\n'
      + '回复"确认删除"执行删除，或"取消删除"取消操作。';

    void Send(Text(confirmMessage));

    return false;
  }
});

/**
 * 删除周目数据
 */
async function deleteZhoumuData(userId: string, player: any): Promise<void> {
  try {
    // 清除周目相关数据
    delete player.周目答题次数;
    delete player.周目属性;

    // 保存更新后的玩家数据
    await writePlayer(userId, player);
  } catch (error) {
    logger.error('删除周目数据失败:', error);
    throw new Error('删除周目数据失败');
  }
}

export default onResponse(selects, [mw.current, res.current]);
