import { Text, useSend } from 'alemonjs';
import { onResponse } from 'alemonjs';
import { redis } from '@src/model/api';
import { keys, getRedisKey } from '@src/model/keys';
import { existplayer, notUndAndNull, writePlayer, readPlayer, addNajieThing } from '@src/model/index';
import type { Player } from '@src/types/player';
import { ZhoumuManager } from '@src/model/xk/zhoumu';
import { selects } from '@src/response/mw-captcha';
import mw from '@src/response/mw-captcha';

// 周目指令正则表达式 - 处理"渡红尘劫+重数"指令
const zhoumuRegex = /^(#|＃|\/)?渡红尘劫(一重|二重|三重|四重|五重|六重)$/;

// 答题上下文状态管理
const KEY_ZHOUMU_CONTEXT = (id: string) => getRedisKey(id, 'zhoumu_context');
const KEY_ZHOUMU_ANSWERS = (id: string) => getRedisKey(id, 'zhoumu_answers');
const KEY_ZHOUMU_ATTRIBUTES = (id: string) => getRedisKey(id, 'zhoumu_attributes');
const KEY_ZHOUMU_LEVEL = (id: string) => getRedisKey(id, 'zhoumu_level');

// 答题阶段枚举
enum ZhoumuStage {
  INITIAL = 0, // 初始阶段
  CONFIRM_START = 1, // 确认开始答题
  ANSWERING = 2, // 答题进行中
  REVIEW_ATTRIBUTES = 3, // 查看属性
  CONFIRM_FINAL = 4 // 确认最终选择
}

// 扩展玩家类型
interface PlayerEx extends Player {
  周目答题次数?: number;
  周目属性?: any;
}

// 辅助函数
const numVal = (v: any, d = 0) => (typeof v === 'number' && !isNaN(v) ? v : typeof v === 'string' && !isNaN(+v) ? +v : d);

// 获取当前答题阶段
async function getZhoumuStage(userId: string): Promise<ZhoumuStage> {
  const stage = await redis.get(KEY_ZHOUMU_CONTEXT(userId));

  return numVal(stage, ZhoumuStage.INITIAL);
}

// 设置答题阶段
async function setZhoumuStage(userId: string, stage: ZhoumuStage): Promise<void> {
  await redis.set(KEY_ZHOUMU_CONTEXT(userId), stage);
}

// 获取已选择的答案
async function getSelectedAnswers(userId: string): Promise<Array<{questionId: number; optionId: number}>> {
  const answers = await redis.get(KEY_ZHOUMU_ANSWERS(userId));

  return answers ? JSON.parse(answers) : [];
}

// 保存选择的答案
async function saveSelectedAnswers(userId: string, answers: Array<{questionId: number; optionId: number}>): Promise<void> {
  await redis.set(KEY_ZHOUMU_ANSWERS(userId), JSON.stringify(answers));
}

// 保存生成的属性
async function saveGeneratedAttributes(userId: string, attributes: any): Promise<void> {
  await redis.set(KEY_ZHOUMU_ATTRIBUTES(userId), JSON.stringify(attributes));
}

// 获取生成的属性
async function getGeneratedAttributes(userId: string): Promise<any> {
  const attributes = await redis.get(KEY_ZHOUMU_ATTRIBUTES(userId));

  return attributes ? JSON.parse(attributes) : null;
}

// 获取周目等级
async function getZhoumuLevel(userId: string): Promise<number> {
  const level = await redis.get(KEY_ZHOUMU_LEVEL(userId));

  return numVal(level, 1);
}

// 设置周目等级
async function setZhoumuLevel(userId: string, level: number): Promise<void> {
  await redis.set(KEY_ZHOUMU_LEVEL(userId), level);
}

// 重置答题上下文
async function resetZhoumuContext(userId: string): Promise<void> {
  await redis.del(KEY_ZHOUMU_CONTEXT(userId));
  await redis.del(KEY_ZHOUMU_ANSWERS(userId));
  await redis.del(KEY_ZHOUMU_ATTRIBUTES(userId));
  await redis.del(KEY_ZHOUMU_LEVEL(userId));
}

// 显示问题选项
function formatQuestion(question: any, questionNumber: number): string {
  let result = `第${questionNumber}题：${question.title}\n\n`;

  question.options.forEach((option: any) => {
    result += `${option.id}、${option.text}\n`;
  });

  return result;
}

// 显示属性信息
function formatAttributes(attributes: any): string {
  const { masteries, basics, talents } = attributes;

  let result = '角色属性生成完成！\n\n';

  result += '精通属性：\n';

  const masteryMap = {
    fistMastery: '拳掌精通',
    swordMastery: '剑法精通',
    bladeMastery: '刀法精通',
    legMastery: '腿法精通',
    qimenMastery: '奇门精通',
    hiddenWeaponMastery: '暗器精通',
    medicalMastery: '医术精通',
    internalMastery: '内功精通'
  };

  Object.entries(masteries).forEach(([key, value]) => {
    result += `${masteryMap[key] || key}: ${value}\n`;
  });

  result += '\n基础属性：\n';
  result += `攻击: ${basics.attack}\n`;
  result += `生命: ${basics.health}\n`;
  result += `真气: ${basics.energy}\n`;
  result += `防御: ${basics.defense}\n`;

  result += '\n天赋：\n';
  talents.forEach((talent: any, index: number) => {
    result += `${talent.name}(${talent.quality}): ${talent.description}\n`;
  });

  return result;
}

// 生成属性函数
async function generateAttributes(answers: Array<{questionId: number; optionId: number}>): Promise<any> {
  const zhoumuManager = ZhoumuManager.getInstance();

  return zhoumuManager.generateRandomAttributes();
}

// 应用属性到玩家
async function applyAttributesToPlayer(userId: string, attributes: any, level: number): Promise<void> {
  const player = await readPlayer(userId);

  if (!player) { return; }

  const { masteries, basics, talents } = attributes;

  // 应用精通属性
  player.拳掌精通 = masteries.fistMastery;
  player.剑法精通 = masteries.swordMastery;
  player.刀法精通 = masteries.bladeMastery;
  player.腿法精通 = masteries.legMastery;
  player.奇门精通 = masteries.qimenMastery;
  player.暗器精通 = masteries.hiddenWeaponMastery;
  player.医术精通 = masteries.medicalMastery;
  player.内功精通 = masteries.internalMastery;

  // 应用基础属性
  player.攻击 = basics.attack;
  player.生命 = basics.health;
  player.真气 = basics.energy;
  player.防御 = basics.defense;

  // 记录周目答题次数
  player.周目答题次数 = 1;
  player.周目属性 = attributes;

  await writePlayer(userId, player);
}

/**
 * 周目答题响应处理器 - 基于Redis上下文
 */
const zhoumuRes = onResponse(selects, async e => {
  const Send = useSend(e);
  const userId = e.UserId;
  const message = e.MessageText;

  // 检查消息是否匹配周目答题指令
  if (!zhoumuRegex.test(message)) {
    return true; // 不匹配，继续处理其他模块
  }

  // 获取当前答题阶段
  const currentStage = await getZhoumuStage(userId);

  // 检查玩家是否存在
  const player = await readPlayer(userId);

  if (!player) {
    void Send(Text('请先创建角色！'));

    return false;
  }

  // 检查是否已经完成过周目答题
  if (player.周目答题次数 && player.周目答题次数 > 0) {
    void Send(Text('您已经完成过周目答题，无法再次进行！'));

    return false;
  }

  // 根据当前阶段处理
  switch (currentStage) {
    case ZhoumuStage.INITIAL:
      // 初始阶段 - 显示欢迎信息
      const match = message.match(/渡红尘劫(一重|二重|三重|四重|五重|六重)/);
      let level = 1;

      if (match) {
        const levelMap = {
          一重: 1,
          二重: 2,
          三重: 3,
          四重: 4,
          五重: 5,
          六重: 6
        };

        level = levelMap[match[1]] || 1;
      }

      await setZhoumuStage(userId, ZhoumuStage.CONFIRM_START);
      await setZhoumuLevel(userId, level);

      const welcomeMessage = `=== 红尘劫第${level}重 ===\n`
        + '欢迎来到红尘劫，通过答题来塑造你的角色属性。\n'
        + '答题将影响你的精通属性、基础属性和天赋。\n\n'
        + '是否开始答题？\n'
        + '回复"开始答题"开始，或"取消"退出。';

      void Send(Text(welcomeMessage));

      return false;

    case ZhoumuStage.CONFIRM_START:
      // 确认开始阶段
      if (message.includes('开始答题')) {
        await setZhoumuStage(userId, ZhoumuStage.ANSWERING);
        await saveSelectedAnswers(userId, []);

        // 获取第一题
        const zhoumuManager = ZhoumuManager.getInstance();
        const questions = zhoumuManager.getQuestions();

        if (!questions || questions.length === 0) {
          void Send(Text('周目答题系统暂未开放，请稍后再试！'));

          return false;
        }

        const questionMessage = '答题开始！\n\n' + formatQuestion(questions[0], 1) + '\n请选择你的答案（输入数字）：';

        void Send(Text(questionMessage));

        return false;
      } else if (message.includes('取消')) {
        await resetZhoumuContext(userId);
        void Send(Text('已取消周目答题。'));

        return false;
      } else {
        void Send(Text('请回复"开始答题"开始，或"取消"退出。'));

        return false;
      }

    case ZhoumuStage.ANSWERING:
      // 答题进行中 - 处理答题逻辑
      const answerMatch = message.match(/^(#|＃|\/)?答题\s*(\d+)$/);

      if (answerMatch) {
        const selectedOption = parseInt(answerMatch[2]);

        // 获取当前答案和问题
        const answers = await getSelectedAnswers(userId);
        const zhoumuManager = ZhoumuManager.getInstance();
        const questions = zhoumuManager.getQuestions();

        if (!questions || questions.length === 0) {
          void Send(Text('周目答题系统暂未开放，请稍后再试！'));

          return false;
        }

        const currentQuestionIndex = answers.length;

        // 检查是否所有问题已回答
        if (currentQuestionIndex >= questions.length) {
          void Send(Text('答题已完成，请使用"查看属性"查看结果。'));

          return false;
        }

        const currentQuestion = questions[currentQuestionIndex];

        // 验证选项有效性
        const validOptions = currentQuestion.options.map(opt => opt.id);

        if (!validOptions.includes(selectedOption)) {
          void Send(Text(`无效选项，请选择 ${validOptions.join('、')} 中的一个。`));

          return false;
        }

        // 保存答案
        answers.push({
          questionId: currentQuestion.id,
          optionId: selectedOption
        });
        await saveSelectedAnswers(userId, answers);

        // 检查是否还有下一题
        if (answers.length < questions.length) {
          const nextQuestion = questions[answers.length];
          const questionMessage = '答案已记录！\n\n' + formatQuestion(nextQuestion, answers.length + 1) + '\n请选择你的答案（输入数字）：';

          void Send(Text(questionMessage));

          return false;
        } else {
          // 所有问题已回答完成
          await setZhoumuStage(userId, ZhoumuStage.REVIEW_ATTRIBUTES);

          // 生成属性预览
          const attributes = await generateAttributes(answers);

          await saveGeneratedAttributes(userId, attributes);

          const level = await getZhoumuLevel(userId);
          const attributesMessage = '恭喜！所有问题已回答完成。\n\n'
            + formatAttributes(attributes)
            + '\n\n请选择后续操作：\n'
            + '1、确认属性 - 确认并创建角色\n'
            + '2、重铸属性 - 重新生成属性\n'
            + '3、重新答题 - 重新开始答题\n'
            + '\n回复对应操作名称。';

          void Send(Text(attributesMessage));

          return false;
        }
      } else {
        void Send(Text('请使用"答题 选项编号"格式继续答题。'));

        return false;
      }

    case ZhoumuStage.REVIEW_ATTRIBUTES:
      // 查看属性阶段
      if (message.includes('确认属性')) {
        await setZhoumuStage(userId, ZhoumuStage.CONFIRM_FINAL);

        const confirmMessage = '=== 最终确认 ===\n'
          + '确认使用当前属性创建角色？\n'
          + '回复"确认创建"完成角色创建，或"返回"重新选择。';

        void Send(Text(confirmMessage));

        return false;
      } else if (message.includes('重铸属性')) {
        // 重新生成属性
        const answers = await getSelectedAnswers(userId);
        const newAttributes = await generateAttributes(answers);

        await saveGeneratedAttributes(userId, newAttributes);

        const rerollMessage = '属性已重铸！\n\n'
          + formatAttributes(newAttributes)
          + '\n\n请选择后续操作：\n'
          + '1、确认属性 - 确认并创建角色\n'
          + '2、重铸属性 - 重新生成属性\n'
          + '3、重新答题 - 重新开始答题\n'
          + '\n回复对应操作名称。';

        void Send(Text(rerollMessage));

        return false;
      } else if (message.includes('重新答题')) {
        await resetZhoumuContext(userId);
        await setZhoumuStage(userId, ZhoumuStage.CONFIRM_START);

        const restartMessage = '已重置答题状态。\n\n'
          + '是否开始答题？\n'
          + '回复"开始答题"开始，或"取消"退出。';

        void Send(Text(restartMessage));

        return false;
      } else {
        const attributes = await getGeneratedAttributes(userId);

        if (!attributes) {
          void Send(Text('属性信息丢失，请重新开始答题。'));

          return false;
        }

        const reviewMessage = '当前属性预览：\n\n'
          + formatAttributes(attributes)
          + '\n\n请选择后续操作：\n'
          + '1、确认属性 - 确认并创建角色\n'
          + '2、重铸属性 - 重新生成属性\n'
          + '3、重新答题 - 重新开始答题\n'
          + '\n回复对应操作名称。';

        void Send(Text(reviewMessage));

        return false;
      }

    case ZhoumuStage.CONFIRM_FINAL:
      // 最终确认阶段
      if (message.includes('确认创建')) {
        // 完成角色创建
        const attributes = await getGeneratedAttributes(userId);

        if (!attributes) {
          void Send(Text('属性信息丢失，请重新开始答题。'));

          return false;
        }

        const level = await getZhoumuLevel(userId);

        // 应用属性到玩家
        await applyAttributesToPlayer(userId, attributes, level);

        // 重置上下文
        await resetZhoumuContext(userId);

        const successMessage = `恭喜！你已成功进入第${level}周目！\n\n`
          + '角色创建完成，可以开始你的江湖之旅了！\n\n'
          + formatAttributes(attributes);

        void Send(Text(successMessage));

        return false;
      } else if (message.includes('返回')) {
        await setZhoumuStage(userId, ZhoumuStage.REVIEW_ATTRIBUTES);

        const attributes = await getGeneratedAttributes(userId);

        if (!attributes) {
          void Send(Text('属性信息丢失，请重新开始答题。'));

          return false;
        }

        const returnMessage = '已返回属性预览。\n\n'
          + formatAttributes(attributes)
          + '\n\n请选择后续操作：\n'
          + '1、确认属性 - 确认并创建角色\n'
          + '2、重铸属性 - 重新生成属性\n'
          + '3、重新答题 - 重新开始答题\n'
          + '\n回复对应操作名称。';

        void Send(Text(returnMessage));

        return false;
      } else {
        void Send(Text('回复"确认创建"完成角色创建，或"返回"重新选择。'));

        return false;
      }

    default:
      void Send(Text('系统状态异常，请重新开始。'));

      return false;
  }

  return false;
});

import mw from '@src/response/mw-captcha';

// 导出所有响应处理器
export default onResponse(selects, [mw.current, zhoumuRes.current]);
