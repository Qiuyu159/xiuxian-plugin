// JSON files will be loaded dynamically to avoid TypeScript import issues

import type { TalentItem, LevelStageItem, PhysiqueStageItem, CommodityItem, GongfaItem, EquipmentTuzhiItem, PetItem, PetFoodItem } from '../types/data';
import type {
  MonsterItem,
  PlaceItem,
  SecretAreaItem,
  AuctionItem,
  EquipmentItem,
  DanyaoFullItem,
  NPCGroupItem,
  ShopItem,
  RealmShopGroupItem
} from '../types/data_extra';
import type { ScoreShopItem, LimitedEquipItem, OccupationItem, DanfangItem, BapinItem, HallItem, PermanentPetItem, SkillItem } from '../types/data_extra';
import { __PATH } from './keys.js';
import { getIoRedis } from '@alemonjs/db';
import { logger } from 'alemonjs';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';

// 动态加载JSON文件的函数
const loadJSON = (filePath: string) => {
  try {
    // 使用相对路径直接加载，避免import.meta兼容性问题
    const fullPath = join(__dirname, '..', filePath);
    const data = readFileSync(fullPath, 'utf8');

    return JSON.parse(data);
  } catch (error) {
    logger.error(`Failed to load JSON file ${filePath}: ${error}`);

    return [];
  }
};

export const DATA_LIST = {
  // 使用英文名
  Talent: loadJSON('../resources/data/灵根列表.json'),
  Monster: loadJSON('../resources/data/怪物列表.json'),
  Commodity: loadJSON('../resources/data/商品列表.json'),
  Level1: loadJSON('../resources/data/练气境界.json'),
  ScoreShop: loadJSON('../resources/data/积分商城.json'),
  Level2: loadJSON('../resources/data/炼体境界.json'),
  Equipment: loadJSON('../resources/data/装备列表.json'),
  Danyao: loadJSON('../resources/data/丹药列表.json'),
  NewDanyao: loadJSON('../resources/data/炼丹师丹药.json'),
  Daoju: loadJSON('../resources/data/道具列表.json'),
  Gongfa: loadJSON('../resources/data/功法列表.json'),
  Caoyao: loadJSON('../resources/data/草药列表.json'),
  Didian: loadJSON('../resources/data/地点列表.json'),
  Bless: loadJSON('../resources/data/洞天福地.json'),
  GuildSecrets: loadJSON('../resources/data/宗门秘境.json'),
  ForbiddenArea: loadJSON('../resources/data/禁地列表.json'),
  FairyRealm: loadJSON('../resources/data/仙境列表.json'),
  TimePlace: loadJSON('../resources/data/限定仙府.json'),
  TimeGongfa: loadJSON('../resources/data/限定功法.json'),
  TimeEquipment: loadJSON('../resources/data/限定装备.json'),
  TimeDanyao: loadJSON('../resources/data/限定丹药.json'),
  Occupation: loadJSON('../resources/data/职业列表.json'),
  experience: loadJSON('../resources/data/experience.json'),
  Danfang: loadJSON('../resources/data/炼丹配方.json'),
  Tuzhi: loadJSON('../resources/data/装备图纸.json'),
  Bapin: loadJSON('../resources/data/八品.json'),
  Xingge: loadJSON('../resources/data/星阁拍卖行列表.json'),
  Tianditang: loadJSON('../resources/data/天地堂.json'),
  Changzhuxianchon: loadJSON('../resources/data/常驻仙宠.json'),
  Xianchon: loadJSON('../resources/data/仙宠列表.json'),
  Xianchonkouliang: loadJSON('../resources/data/仙宠口粮列表.json'),
  NPC: loadJSON('../resources/data/npc列表.json'),
  Shop: loadJSON('../resources/data/shop列表.json'),
  Qinglong: loadJSON('../resources/data/青龙.json'),
  Qilin: loadJSON('../resources/data/麒麟.json'),
  Xuanwu: loadJSON('../resources/data/玄武朱雀白虎.json'),
  Mojie: loadJSON('../resources/data/魔界列表.json'),
  ExchangeItem: loadJSON('../resources/data/兑换列表.json'),
  Shenjie: loadJSON('../resources/data/神界列表.json'),
  Jineng1: loadJSON('../resources/data/技能列表1.json'),
  Jineng2: loadJSON('../resources/data/技能列表2.json'),
  Qianghua: loadJSON('../resources/data/强化列表.json'),
  Duanzhaocailiao: loadJSON('../resources/data/item/锻造材料.json'),
  Duanzhaowuqi: loadJSON('../resources/data/item/锻造武器.json'),
  Duanzhaohuju: loadJSON('../resources/data/item/锻造护具.json'),
  Duanzhaobaowu: loadJSON('../resources/data/item/锻造宝物.json'),
  Yincang: loadJSON('../resources/data/item/隐藏灵根.json'),
  Zalei: loadJSON('../resources/data/item/锻造杂类.json'),
  Jineng: loadJSON('../resources/data/item/技能列表.json'),
  // xk
  UpdateRecord: loadJSON('../resources/data/updateRecord.json'),
  MonthMarket: loadJSON('../resources/data/item/MothMarket.json'),
  Goods: loadJSON('../resources/data/xk/goods.json'),
  Menpai: loadJSON('../resources/data/xk/menpai.json'),
  Miji: loadJSON('../resources/data/xk/miji.json'),
  Player: loadJSON('../resources/data/xk/player.json'),
  Tianfu: loadJSON('../resources/data/xk/tianfu.json'),
  Zhuangbei: loadJSON('../resources/data/xk/zhuangbei.json')
};

export type DataList = typeof DATA_LIST;

export type DataListKeys = keyof typeof DATA_LIST;

export const hasDataList = (key: DataListKeys) => {
  return !!DATA_LIST[key];
};

/**
 *
 * @param key
 * @returns
 */
export const getDataList = async <T extends DataListKeys>(key: T): Promise<DataList[T]> => {
  const redis = getIoRedis();
  // 先判断 redis 有无，没有则读本地的
  const size = await redis.exists(key);

  if (size > 0) {
    try {
      const redisData = await redis.get(key);

      if (!redisData) {
        return DATA_LIST[key];
      }

      return JSON.parse(redisData);
    } catch (error) {
      logger.warn(`Failed to parse redis data for key ${key}: ${error}`);

      return DATA_LIST[key];
    }
  }

  return DATA_LIST[key];
};

/**
 * 写入则是直接写进 redis
 */
export const setDataList = async (key: keyof typeof DATA_LIST, data) => {
  const redis = getIoRedis();

  try {
    await redis.set(key, JSON.stringify(data));
  } catch (error) {
    logger.error(`Failed to set redis data for key ${key}: ${error}`);
  }
};

export default {
  player: __PATH.player_path,
  equipment: __PATH.equipment_path,
  najie: __PATH.najie_path,
  lib: __PATH.lib_path,
  association: __PATH.association,
  occupation: __PATH.occupation,
  lib_path: __PATH.lib_path,
  Timelimit: __PATH.Timelimit,
  Level: __PATH.Level,
  Occupation: __PATH.occupation,

  /**
   * list 读取优化 - 使用动态加载的数据
   */

  talent_list: DATA_LIST.Talent as TalentItem[],
  monster_list: DATA_LIST.Monster as MonsterItem[],
  commodities_list: DATA_LIST.Commodity as CommodityItem[],
  Level_list: DATA_LIST.Level1 as LevelStageItem[],
  shitujifen: DATA_LIST.ScoreShop as ScoreShopItem[],
  LevelMax_list: DATA_LIST.Level2 as PhysiqueStageItem[],
  equipment_list: DATA_LIST.Equipment as EquipmentItem[],
  danyao_list: DATA_LIST.Danyao as DanyaoFullItem[],
  newdanyao_list: DATA_LIST.NewDanyao as DanyaoFullItem[],
  daoju_list: DATA_LIST.Daoju as CommodityItem[],
  gongfa_list: DATA_LIST.Gongfa as GongfaItem[],
  caoyao_list: DATA_LIST.Caoyao as CommodityItem[],
  didian_list: DATA_LIST.Didian as PlaceItem[],
  bless_list: DATA_LIST.Bless as PlaceItem[],
  guildSecrets_list: DATA_LIST.GuildSecrets as SecretAreaItem[],
  forbiddenarea_list: DATA_LIST.ForbiddenArea as SecretAreaItem[],
  Fairyrealm_list: DATA_LIST.FairyRealm as PlaceItem[],
  timeplace_list: DATA_LIST.TimePlace as PlaceItem[],
  timegongfa_list: DATA_LIST.TimeGongfa as GongfaItem[],
  timeequipmen_list: DATA_LIST.TimeEquipment as LimitedEquipItem[],
  timedanyao_list: DATA_LIST.TimeDanyao as DanyaoFullItem[],
  occupation_list: DATA_LIST.Occupation as OccupationItem[],
  occupation_exp_list: DATA_LIST.experience as Array<{
    id: number;
    name: string;
    experience: number;
    rate: number;
  }>,
  danfang_list: DATA_LIST.Danfang as DanfangItem[],
  tuzhi_list: DATA_LIST.Tuzhi as EquipmentTuzhiItem[],

  npc_list: DATA_LIST.NPC as NPCGroupItem[],
  shop_list: DATA_LIST.Shop as ShopItem[],

  bapin: DATA_LIST.Bapin as BapinItem[],
  xingge: DATA_LIST.Xingge as AuctionItem[],
  tianditang: DATA_LIST.Tianditang as HallItem[],
  changzhuxianchon: DATA_LIST.Changzhuxianchon as PermanentPetItem[],
  xianchon: DATA_LIST.Xianchon as PetItem[],
  xianchonkouliang: DATA_LIST.Xianchonkouliang as PetFoodItem[],

  qinlong: DATA_LIST.Qinglong as RealmShopGroupItem[],
  qilin: DATA_LIST.Qilin as RealmShopGroupItem[],
  xuanwu: DATA_LIST.Xuanwu as RealmShopGroupItem[],
  mojie: DATA_LIST.Mojie as RealmShopGroupItem[],
  /**
   * 技能列表
   */
  jineng1: DATA_LIST.Jineng1 as SkillItem[],
  jineng2: DATA_LIST.Jineng2 as SkillItem[],
  jineng: DATA_LIST.Jineng as SkillItem[],

  /**
   * xk 目录数据列表
   */
  Goods: DATA_LIST.Goods,
  Menpai: DATA_LIST.Menpai,
  Miji: DATA_LIST.Miji,
  Player: DATA_LIST.Player,
  Tianfu: DATA_LIST.Tianfu,
  Zhuangbei: DATA_LIST.Zhuangbei
};
