import { Piece } from './Piece';

// BUFF类型枚举
export enum BuffType {
  STRONG = 'strong', // 强壮
  TOUGH = 'tough', // 坚韧
  AGILE = 'agile', // 轻盈
  HEAL = 'heal', // 疗伤
  MEDITATE = 'meditate' // 调息
}

// DEBUFF类型枚举
export enum DebuffType {
  POISON = 'poison', // 中毒
  INTERNAL_INJURY = 'internal_injury', // 内伤
  BLEED = 'bleed', // 流血
  SLOW = 'slow', // 减速
  ARMOR_BREAK = 'armor_break', // 破甲
  DISABLE = 'disable' // 残废
}

// BUFF效果处理器
export class BuffProcessor {
  static applyBuff(
    piece: Piece,
    buffType: BuffType,
    stacks: number,
    duration = 2
  ): void {
    piece.addBuff(buffType, stacks, duration);
  }

  static applyDebuff(
    piece: Piece,
    debuffType: DebuffType,
    stacks: number,
    duration = 2
  ): void {
    piece.addDebuff(debuffType, stacks, duration);
  }

  static processBuffs(piece: Piece): void {
    piece.processBuffDebuffEffects();
  }

  static updateDurations(piece: Piece): void {
    piece.updateBuffDebuffDurations();
  }

  static hasBuff(piece: Piece, buffType: BuffType): boolean {
    return piece.buffs.some(buff => buff.type === buffType);
  }

  static hasDebuff(piece: Piece, debuffType: DebuffType): boolean {
    return piece.debuffs.some(debuff => debuff.type === debuffType);
  }

  static getBuffStacks(piece: Piece, buffType: BuffType): number {
    const buff = piece.buffs.find(buff => buff.type === buffType);

    return buff ? buff.stacks : 0;
  }

  static getDebuffStacks(piece: Piece, debuffType: DebuffType): number {
    const debuff = piece.debuffs.find(debuff => debuff.type === debuffType);

    return debuff ? debuff.stacks : 0;
  }

  static removeBuff(piece: Piece, buffType: BuffType): void {
    piece.buffs = piece.buffs.filter(buff => buff.type !== buffType);
  }

  static removeDebuff(piece: Piece, debuffType: DebuffType): void {
    piece.debuffs = piece.debuffs.filter(debuff => debuff.type !== debuffType);
  }

  static clearAllBuffs(piece: Piece): void {
    piece.buffs = [];
  }

  static clearAllDebuffs(piece: Piece): void {
    piece.debuffs = [];
  }

  // 检查是否具有高级效果
  static hasAdvancedEffect(piece: Piece, buffType: BuffType): boolean {
    const buff = piece.buffs.find(buff => buff.type === buffType);

    return buff ? buff.advancedTriggered : false;
  }

  static hasAdvancedDebuffEffect(
    piece: Piece,
    debuffType: DebuffType
  ): boolean {
    const debuff = piece.debuffs.find(debuff => debuff.type === debuffType);

    return debuff ? debuff.advancedTriggered : false;
  }
}
