import { DataListKeys, setDataList, DATA_LIST } from '@src/model/DataList';
import { keysLock } from '@src/model/keys';
import { getIoRedis } from '@alemonjs/db';
import { acquireLock, releaseLock } from '@src/model/locks';

/**
 * 数据初始化任务
 * 将本地JSON数据初始化到Redis中
 */
const initDataTask = async (): Promise<void> => {
  const redis = getIoRedis();

  // 检查是否已经初始化过
  const initKey = 'xiuxian:data:initialized';
  const isInitialized = await redis.exists(initKey);

  if (isInitialized > 0) {
    logger.info('数据已经初始化过，跳过初始化过程');

    return;
  }

  logger.info('开始初始化数据到Redis...');

  // 侠客相关数据键
  const xkDataKeys: DataListKeys[] = [
    'XKTalent', // 侠客天赋
    'XKChapter', // 侠客残页
    'XKItem', // 侠客物品
    'XKGongfa', // 侠客秘籍
    'XKEquipment', // 侠客装备
    'XKRole', // 侠客角色
    'XKSect' // 侠客门派
  ];

  let successCount = 0;
  let totalCount = 0;

  for (const key of xkDataKeys) {
    try {
      const data = DATA_LIST[key];

      if (data && Array.isArray(data) && data.length > 0) {
        await setDataList(key, data);
        successCount++;
        totalCount += data.length;
        logger.debug(`初始化 ${key} 数据成功，共 ${data.length} 条记录`);
      } else {
        logger.warn(`数据键 ${key} 对应的数据为空或格式不正确，跳过初始化`);
      }
    } catch (error) {
      logger.error(`初始化 ${key} 数据失败:`, error);
    }
  }

  // 标记数据已初始化
  await redis.set(initKey, '1');

  logger.info(`数据初始化完成，成功初始化 ${successCount} 个数据键，共 ${totalCount} 条记录`);
};

/**
 * 启动数据初始化任务
 */
export const startInitDataTask = async (): Promise<void> => {
  try {
    // 使用分布式锁确保同一时间只有一个实例在执行初始化
    const lockKey = keysLock.task('InitDataTask');
    const lockResult = await acquireLock(lockKey, { timeout: 30000 }); // 30秒锁

    if (lockResult.acquired && lockResult.value) {
      await initDataTask();
      await releaseLock(lockKey, lockResult.value);
    } else {
      logger.warn('InitDataTask 锁获取失败，可能已有其他实例在执行初始化');
    }
  } catch (error) {
    logger.error('启动数据初始化任务失败:', error);
  }
};

/**
 * 手动触发数据初始化（用于API调用）
 */
export const manualInitData = async (): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    await initDataTask();

    return {
      success: true,
      message: '数据初始化成功'
    };
  } catch (error) {
    logger.error('手动数据初始化失败:', error);

    return {
      success: false,
      message: `数据初始化失败: ${error}`
    };
  }
};

export const InitDataTask = () => {
  void startInitDataTask();
};
