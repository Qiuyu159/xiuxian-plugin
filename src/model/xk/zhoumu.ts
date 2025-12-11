import { Player } from '../../../types/player';

// 使用import方式导入JSON文件，兼容ES模块
import zhoumuQuestionsData from '../../resources/still_data/xk/zhoumu_questions.json' assert { type: 'json' };
import zhoumuTalentsData from '../../resources/still_data/xk/zhoumu_talents.json' assert { type: 'json' };
import zhoumuAttributesData from '../../resources/still_data/xk/zhoumu_attributes.json' assert { type: 'json' };

/**
 * 周目答题选项效果接口
 */
export interface QuestionEffect {
  /** 属性加成 */
  attributeBonus?: {
    /** 铜钱 */
    money?: number;
    /** 拳掌精通 */
    fistMastery?: number;
    /** 剑法精通 */
    swordMastery?: number;
    /** 刀法精通 */
    bladeMastery?: number;
    /** 腿法精通 */
    legMastery?: number;
    /** 奇门精通 */
    qimenMastery?: number;
    /** 暗器精通 */
    hiddenWeaponMastery?: number;
    /** 医术精通 */
    medicalMastery?: number;
    /** 仁义值 */
    morality?: number;
    /** 仁义值（新字段） */
    righteousness?: number;
    /** 攻击 */
    attack?: number;
    /** 攻击（新字段） */
    martialAttack?: number;
    /** 生命 */
    health?: number;
    /** 真气 */
    energy?: number;
    /** 防御 */
    defense?: number;
    /** 闪避 */
    dodge?: number;
    /** 闪避（新字段） */
    evasion?: number;
    /** 四海速度 */
    travelSpeed?: number;
    /** 每回合恢复真气 */
    energyRecovery?: number;
    /** 真气恢复（新字段） */
    energyRegen?: number;
    /** 女性好感度 */
    femaleFavor?: number;
  };
  /** 物品奖励 */
  itemRewards?: Array<{
    name: string;
    quantity: number;
    type: string;
  }>;
}

/**
 * 答题问题接口
 */
export interface Question {
  id: number;
  title: string;
  options: Array<{
    id: number;
    text: string;
    effect: QuestionEffect;
  }>;
}

/**
 * 天赋配置接口
 */
export interface Talent {
  name: string;
  quality: '白' | '绿' | '蓝' | '橙' | '紫' | '金';
  description: string;
  effects: {
    /** 属性加成百分比 */
    attributes?: {
      fistMastery?: number;
      swordMastery?: number;
      bladeMastery?: number;
      legMastery?: number;
      qimenMastery?: number;
      hiddenWeaponMastery?: number;
      attack?: number;
      health?: number;
      energy?: number;
      defense?: number;
      morality?: number;
      strength?: number;
      intelligence?: number;
      agility?: number;
      constitution?: number;
      spirit?: number;
      allAttributes?: number;
    };
    /** 固定属性加成 */
    fixedAttributes?: {
      strength?: number;
      intelligence?: number;
      agility?: number;
      constitution?: number;
      spirit?: number;
    };
    /** 特殊效果 */
    special?: string;
  };
}

/**
 * 角色属性接口
 */
export interface CharacterAttributes {
  /** 精通属性 */
  masteries: {
    fistMastery: number;
    swordMastery: number;
    bladeMastery: number;
    legMastery: number;
    qimenMastery: number;
    hiddenWeaponMastery: number;
    medicalMastery: number;
    internalMastery: number;
  };
  /** 基础属性 */
  basics: {
    attack: number;
    health: number;
    energy: number;
    defense: number;
  };
  /** 天赋 */
  talents: Talent[];
}

/**
 * 周目答题管理器
 */
export class ZhoumuManager {
  private static instance: ZhoumuManager;
  private questions: Question[] = [];
  private talents: Talent[] = [];
  private attributesConfig: any = {};

  private constructor() {
    this.loadQuestions();
    this.loadTalents();
    this.loadAttributesConfig();
  }

  public static getInstance(): ZhoumuManager {
    if (!ZhoumuManager.instance) {
      ZhoumuManager.instance = new ZhoumuManager();
    }

    return ZhoumuManager.instance;
  }

  /**
   * 加载答题问题
   */
  private loadQuestions(): void {
    try {
      this.questions = zhoumuQuestionsData.questions || [];
    } catch (error) {
      console.error('加载答题问题配置失败:', error);
      this.questions = [];
    }
  }

  /**
   * 加载天赋配置
   */
  private loadTalents(): void {
    try {
      this.talents = zhoumuTalentsData.talents || [];
    } catch (error) {
      console.error('加载天赋配置失败:', error);
      this.talents = [];
    }
  }

  /**
   * 加载属性配置
   */
  private loadAttributesConfig(): void {
    try {
      this.attributesConfig = zhoumuAttributesData || {};
    } catch (error) {
      console.error('加载属性配置失败:', error);
      this.attributesConfig = {};
    }
  }

  /**
   * 获取所有问题
   */
  public getQuestions(): Question[] {
    return this.questions;
  }

  /**
   * 根据问题ID获取问题
   */
  public getQuestionById(id: number): Question | undefined {
    return this.questions.find(q => q.id === id);
  }

  /**
   * 获取所有天赋
   */
  public getTalents(): Talent[] {
    return this.talents;
  }

  /**
   * 随机选择天赋
   */
  public getRandomTalents(count = 2): Talent[] {
    const shuffled = [...this.talents].sort(() => 0.5 - Math.random());

    return shuffled.slice(0, count);
  }

  /**
   * 生成随机属性
   */
  public generateRandomAttributes(): CharacterAttributes {
    const masteryRanges = this.attributesConfig.masteryRanges || {};
    const baseRanges = this.attributesConfig.baseRanges || {};

    return {
      masteries: {
        fistMastery: this.getRandomInRange(masteryRanges.fistMastery),
        swordMastery: this.getRandomInRange(masteryRanges.swordMastery),
        bladeMastery: this.getRandomInRange(masteryRanges.bladeMastery),
        legMastery: this.getRandomInRange(masteryRanges.legMastery),
        qimenMastery: this.getRandomInRange(masteryRanges.qimenMastery),
        hiddenWeaponMastery: this.getRandomInRange(masteryRanges.hiddenWeaponMastery),
        medicalMastery: this.getRandomInRange(masteryRanges.medicalMastery),
        internalMastery: this.getRandomInRange(masteryRanges.internalMastery)
      },
      basics: {
        attack: this.getRandomInRange(baseRanges.attack),
        health: this.getRandomInRange(baseRanges.health),
        energy: this.getRandomInRange(baseRanges.energy),
        defense: this.getRandomInRange(baseRanges.defense)
      },
      talents: this.getRandomTalents(3) // 默认3个天赋
    };
  }

  /**
   * 获取范围内的随机值
   */
  private getRandomInRange(range: {min: number, max: number}): number {
    if (!range || typeof range.min !== 'number' || typeof range.max !== 'number') {
      return Math.floor(Math.random() * 100) + 1; // 默认范围
    }

    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  /**
   * 应用答题效果到玩家
   */
  public applyQuestionEffects(player: Player, selectedOptions: Array<{ questionId: number; optionId: number }>): void {
    for (const selection of selectedOptions) {
      const question = this.getQuestionById(selection.questionId);

      if (!question) { continue; }

      const option = question.options.find(opt => opt.id === selection.optionId);

      if (!option?.effect) { continue; }

      const effect = option.effect;

      // 应用属性加成
      if (effect.attributeBonus) {
        this.applyAttributes(player, effect.attributeBonus);
      }

      // 应用物品奖励
      if (effect.itemRewards) {
        this.applyItems(player, effect.itemRewards);
      }
    }
  }

  /**
   * 应用属性加成
   */
  private applyAttributes(player: Player, attributes: any): void {
    // 这里需要根据实际的玩家数据结构来实现属性加成
    // 暂时使用简单的属性设置
    for (const [key, value] of Object.entries(attributes)) {
      if (typeof value === 'number') {
        // 根据属性键名设置对应的玩家属性
        // 这里需要根据实际的玩家数据结构进行调整
      }
    }
  }

  /**
   * 应用物品奖励
   */
  private applyItems(player: Player, items: any): void {
    // 这里需要实现物品奖励的逻辑
    // 暂时留空，需要根据具体的物品系统实现
  }
}
