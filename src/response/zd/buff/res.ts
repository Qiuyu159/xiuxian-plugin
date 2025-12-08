// BUFF/DEBUFF系统

// BUFF类型枚举
export enum BuffType {
    STRONG = 'strong',      // 强壮
    TOUGH = 'tough',        // 坚韧
    AGILE = 'agile',        // 轻盈
    HEAL = 'heal',          // 疗伤
    MEDITATE = 'meditate'   // 调息
}

// DEBUFF类型枚举
export enum DebuffType {
    POISON = 'poison',              // 中毒
    INTERNAL_INJURY = 'internal_injury',  // 内伤
    BLEED = 'bleed',                // 流血
    SLOW = 'slow',                  // 减速
    ARMOR_BREAK = 'armor_break',    // 破甲
    DISABLE = 'disable'             // 残废
}

// BUFF效果处理器
export class BuffProcessor {
    static applyBuff(piece: any, buffType: BuffType, stacks: number, duration: number = 2): void {
        piece.addBuff(buffType, stacks, duration);
    }
    
    static applyDebuff(piece: any, debuffType: DebuffType, stacks: number, duration: number = 2): void {
        piece.addDebuff(debuffType, stacks, duration);
    }
    
    static processBuffs(piece: any): void {
        piece.processBuffDebuffEffects();
    }
    
    static updateDurations(piece: any): void {
        piece.updateBuffDebuffDurations();
    }
    
    static hasBuff(piece: any, buffType: BuffType): boolean {
        return piece.buffs.some((buff: any) => buff.type === buffType);
    }
    
    static hasDebuff(piece: any, debuffType: DebuffType): boolean {
        return piece.debuffs.some((debuff: any) => debuff.type === debuffType);
    }
    
    static getBuffStacks(piece: any, buffType: BuffType): number {
        const buff = piece.buffs.find((buff: any) => buff.type === buffType);
        return buff ? buff.stacks : 0;
    }
    
    static getDebuffStacks(piece: any, debuffType: DebuffType): number {
        const debuff = piece.debuffs.find((debuff: any) => debuff.type === debuffType);
        return debuff ? debuff.stacks : 0;
    }
    
    static removeBuff(piece: any, buffType: BuffType): void {
        piece.buffs = piece.buffs.filter((buff: any) => buff.type !== buffType);
    }
    
    static removeDebuff(piece: any, debuffType: DebuffType): void {
        piece.debuffs = piece.debuffs.filter((debuff: any) => debuff.type !== debuffType);
    }
    
    static clearAllBuffs(piece: any): void {
        piece.buffs = [];
    }
    
    static clearAllDebuffs(piece: any): void {
        piece.debuffs = [];
    }
    
    // 检查是否具有高级效果
    static hasAdvancedEffect(piece: any, buffType: BuffType): boolean {
        const buff = piece.buffs.find((buff: any) => buff.type === buffType);
        return buff ? buff.advancedTriggered : false;
    }
    
    static hasAdvancedDebuffEffect(piece: any, debuffType: DebuffType): boolean {
        const debuff = piece.debuffs.find((debuff: any) => debuff.type === debuffType);
        return debuff ? debuff.advancedTriggered : false;
    }
}