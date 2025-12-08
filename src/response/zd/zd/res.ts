import { Image, Text, useMention, useSend } from 'alemonjs';
import { existplayer, keys } from '@src/model/index';
import { getDataJSONParseByKey } from '@src/model/DataControl';
import { getAvatar } from '@src/model/utils/utilsx.js';
import { screenshot } from '@src/image';
import { selects } from '@src/response/mw-captcha';
import mw from '@src/response/mw-captcha';
import type { Player } from '@src/types';

// 导入战斗相关模块
import { BattleManager } from '../BattleManager/res';

// 正则表达式配置 - 参考biwu/res.ts格式
export const regular = /^(#|＃|\/)?战斗测试$/;

// 装备相关正则表达式
export const equipmentRegular = /^(#|＃|\/)?查看装备$/;

// 天赋相关正则表达式
export const tianfuRegular = /^(#|＃|\/)?查看天赋$/;

// 背包相关正则表达式
export const bagRegular = /^(#|＃|\/)?查看背包$/;

// 门派相关正则表达式
export const menpaiRegular = /^(#|＃|\/)?查看门派$/;

// 秘籍相关正则表达式
export const mijiRegular = /^(#|＃|\/)?查看秘籍$/;

// 玩家信息相关正则表达式
export const playerRegular = /^(#|＃|\/)?查看玩家$/;

// 物品相关正则表达式
export const goodsRegular = /^(#|＃|\/)?查看物品$/;

// 装备制作相关正则表达式
export const zhuangbeiRegular = /^(#|＃|\/)?制作装备$/;

// 草药相关正则表达式
export const canyeRegular = /^(#|＃|\/)?查看草药$/;

// 装备查看响应处理
const equipmentRes = onResponse(selects, async e => {
    const Send = useSend(e);
    const userId = e.UserId;

    if (!(await existplayer(userId))) {
        void Send(Text('你还未开始修仙'));

        return false;
    }

    // 这里可以添加装备查看逻辑
    void Send(Text('装备查看功能开发中...'));

    return false;
});

// 天赋查看响应处理
const tianfuRes = onResponse(selects, async e => {
    const Send = useSend(e);
    const userId = e.UserId;

    if (!(await existplayer(userId))) {
        void Send(Text('你还未开始修仙'));

        return false;
    }

    // 这里可以添加天赋查看逻辑
    void Send(Text('天赋查看功能开发中...'));

    return false;
});

// 背包查看响应处理
const bagRes = onResponse(selects, async e => {
    const Send = useSend(e);
    const userId = e.UserId;

    if (!(await existplayer(userId))) {
        void Send(Text('你还未开始修仙'));

        return false;
    }

    // 这里可以添加背包查看逻辑
    void Send(Text('背包查看功能开发中...'));

    return false;
});

// 主战斗测试响应处理
const res = onResponse(selects, async e => {
    const Send = useSend(e);
    const userId = e.UserId;

    if (!(await existplayer(userId))) {
        void Send(Text('你还未开始修仙'));

        return false;
    }

    const [mention] = useMention(e);
    const res = await mention.findOne();
    const target = res?.data;

    if (!target || res.code !== 2000) {
        void Send(Text('请@要切磋的修仙者'));

        return false;
    }

    const targetUserId = target.UserId;

    if (userId === targetUserId) {
        void Send(Text('你还跟自己修炼上了是不是?'));

        return false;
    }

    const player = await getDataJSONParseByKey(keys.player(userId));

    if (!player) {
        void Send(Text('你的数据不存在'));

        return false;
    }

    const playerDataB = await getDataJSONParseByKey(keys.player(targetUserId));

    if (!playerDataB) {
        void Send(Text('对方数据不存在'));

        return false;
    }

    const playerA = player as Player;
    const playerB = playerDataB as Player;

    // 复制（避免副作用）
    const a = { ...playerA } as Player;
    const b = { ...playerB } as Player;

    // 设置初始血量
    a.当前血量 = a.血量上限;
    b.当前血量 = b.血量上限;

    try {
        // 创建战斗管理器
        const battleManager = new BattleManager();

        // 开始战斗
        const winner = battleManager.startBattle();

        const header = `${playerA.名号}向${playerB.名号}发起了战斗测试。\n`;
        const winA = `${playerA.名号}击败了${playerB.名号}`;
        const winB = `${playerB.名号}击败了${playerA.名号}`;

        const resultText = winner === 'A' ? winA : winner === 'B' ? winB : '平局';

        const img = await screenshot('BattleTestResult', userId, {
            msg: [header, `战斗结果: ${resultText}`],
            playerA: {
                id: userId,
                name: playerA.名号,
                avatar: getAvatar(userId),
                power: (playerA as any).战力,
                hp: playerA.当前血量,
                maxHp: playerA.血量上限
            },
            playerB: {
                id: targetUserId,
                name: playerB.名号,
                avatar: getAvatar(targetUserId),
                power: (playerB as any).战力,
                hp: playerB.当前血量,
                maxHp: playerB.血量上限
            },
            result: winner === 'A' ? 'A' : winner === 'B' ? 'B' : 'draw'
        });

        if (Buffer.isBuffer(img)) {
            void Send(Image(img));
        } else {
            void Send(Text(header + resultText));
        }
    } catch (_err) {
        void Send(Text('战斗过程出现异常'));
    }

    return false;
});

// 其他响应处理函数（简化版）
const menpaiRes = onResponse(selects, async e => {
    const Send = useSend(e);

    void Send(Text('门派查看功能开发中...'));

    return false;
});

const mijiRes = onResponse(selects, async e => {
    const Send = useSend(e);

    void Send(Text('秘籍查看功能开发中...'));

    return false;
});

const playerRes = onResponse(selects, async e => {
    const Send = useSend(e);

    void Send(Text('玩家信息查看功能开发中...'));

    return false;
});

const goodsRes = onResponse(selects, async e => {
    const Send = useSend(e);

    void Send(Text('物品查看功能开发中...'));

    return false;
});

const zhuangbeiRes = onResponse(selects, async e => {
    const Send = useSend(e);

    void Send(Text('装备制作功能开发中...'));

    return false;
});

const canyeRes = onResponse(selects, async e => {
    const Send = useSend(e);

    void Send(Text('草药查看功能开发中...'));

    return false;
});

export default onResponse(selects, [
    mw.current,
    res.current,
    onResponse(equipmentRegular, equipmentRes.current),
    onResponse(tianfuRegular, tianfuRes.current),
    onResponse(bagRegular, bagRes.current),
    onResponse(menpaiRegular, menpaiRes.current),
    onResponse(mijiRegular, mijiRes.current),
    onResponse(playerRegular, playerRes.current),
    onResponse(goodsRegular, goodsRes.current),
    onResponse(zhuangbeiRegular, zhuangbeiRes.current),
    onResponse(canyeRegular, canyeRes.current)
]);
