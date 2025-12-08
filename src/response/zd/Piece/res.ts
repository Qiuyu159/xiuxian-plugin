import { AttackStrategy } from '../AttackStrategy/res';
import { BuffType, DebuffType } from '../buff/res';

// 天赋数据接口
interface TianfuData {
    tianfu: {
        [category: string]: Tianfu[];
    };
}

interface Tianfu {
    id: string;
    name: string;
    quality: string;
    description: string;
    effects: { [effect: string]: string };
}

// 门派数据接口
interface MenpaiData {
    menpai: {
        [name: string]: Menpai;
    };
}

interface Menpai {
    name: string;
    description: string;
    specialty: string;
    attributes: { [attr: string]: number };
    skills: string[];
    tianfus: string[];
}

// BUFF/DEBUFF接口
interface Buff {
    type: BuffType;
    stacks: number;
    duration: number;
    advancedTriggered: boolean;
}

interface Debuff {
    type: DebuffType;
    stacks: number;
    duration: number;
    advancedTriggered: boolean;
}

// 角色类
export class Piece {
    id: number;
    name: string;
    type: string;
    team: string;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
    energy: number;
    maxEnergy: number;
    energyRecoveryRate: number;
    position: { x: number; y: number };
    attackStrategy: AttackStrategy;
    skills: any[];
    activeSkillIndex: number;
    isAlive: boolean;
    buffs: Buff[];
    debuffs: Debuff[];
    actionBar: number;

    // 攻击属性
    hitRate: number;
    comboRate: number;
    sequenceRate: number;
    ignoreDefenseRate: number;
    coopRate: number;

    // 防御属性
    critRate: number;
    critDamage: number;
    dodgeRate: number;
    critResistance: number;
    antiComboRate: number;
    counterRate: number;
    parryRate: number;
    reflectRate: number;
    vampireRate: number;
    reflectMultiplier: number;

    // 抗性属性
    poisonResistance: number;
    bleedResistance: number;
    armorPenetrationResistance: number;
    slowResistance: number;
    internalInjuryResistance: number;
    disableResistance: number;

    // 精通属性
    swordMastery: number;
    qimenMastery: number;
    bladeMastery: number;
    hiddenWeaponMastery: number;
    fistMastery: number;
    medicalMastery: number;
    legMastery: number;
    internalMastery: number;

    // 天赋系统
    tianfus: Tianfu[];
    maxTianfuCount: number;

    // 门派系统
    menpai: string | null;
    menpaiAttributes: { [attr: string]: number };

    constructor(data: any) {
        this.id = data.id || 0;
        this.name = data.name || '未知角色';
        this.type = data.type || 'warrior';
        this.team = data.team || 'A';
        this.hp = data.hp || 100;
        this.maxHp = data.maxHp || this.hp;
        this.attack = data.attack || 50;
        this.defense = data.defense || 10;
        this.speed = data.speed || 100;
        this.energy = data.energy || 2000;
        this.maxEnergy = data.maxEnergy || 2000;
        this.energyRecoveryRate = data.energyRecoveryRate || 0.1;
        this.position = data.position || { x: 0, y: 0 };
        this.attackStrategy = data.attackStrategy || AttackStrategy.NEAREST;
        this.skills = data.skills || [];
        this.activeSkillIndex = data.activeSkillIndex || 0;
        this.isAlive = data.isAlive !== undefined ? data.isAlive : true;
        this.buffs = data.buffs || [];
        this.debuffs = data.debuffs || [];
        this.actionBar = data.actionBar || 0;

        // 攻击属性
        this.hitRate = data.hitRate || 1.0;
        this.comboRate = data.comboRate || 0;
        this.sequenceRate = data.sequenceRate || 0;
        this.ignoreDefenseRate = data.ignoreDefenseRate || 0;
        this.coopRate = data.coopRate || 0;

        // 防御属性
        this.critRate = data.critRate || 0;
        this.critDamage = data.critDamage || 2.0;
        this.dodgeRate = data.dodgeRate || 0;
        this.critResistance = data.critResistance || 0;
        this.antiComboRate = data.antiComboRate || 0;
        this.counterRate = data.counterRate || 0;
        this.parryRate = data.parryRate || 0;
        this.reflectRate = data.reflectRate || 0;
        this.vampireRate = data.vampireRate || 0;
        this.reflectMultiplier = data.reflectMultiplier || 1.0;

        // 抗性属性
        this.poisonResistance = data.poisonResistance || 0;
        this.bleedResistance = data.bleedResistance || 0;
        this.armorPenetrationResistance = data.armorPenetrationResistance || 0;
        this.slowResistance = data.slowResistance || 0;
        this.internalInjuryResistance = data.internalInjuryResistance || 0;
        this.disableResistance = data.disableResistance || 0;

        // 精通属性
        this.swordMastery = data.swordMastery || 0;
        this.qimenMastery = data.qimenMastery || 0;
        this.bladeMastery = data.bladeMastery || 0;
        this.hiddenWeaponMastery = data.hiddenWeaponMastery || 0;
        this.fistMastery = data.fistMastery || 0;
        this.medicalMastery = data.medicalMastery || 0;
        this.legMastery = data.legMastery || 0;
        this.internalMastery = data.internalMastery || 0;

        // 天赋系统
        this.tianfus = data.tianfus || [];
        this.maxTianfuCount = 20;

        // 门派系统
        this.menpai = data.menpai || null;
        this.menpaiAttributes = {};

        // 应用门派效果
        this.applyMenpaiEffects();

        // 根据精通计算属性加成
        this.calculateMasteryBonuses();

        // 应用天赋效果
        this.applyTianfuEffects();
    }

    // 根据精通计算属性加成
    calculateMasteryBonuses(): void {
        // 拳掌精通：影响武学攻击，忽视防御率，反击率，连招率
        this.attack += Math.floor(this.fistMastery * 0.5);
        this.ignoreDefenseRate += this.fistMastery * 0.001;
        this.counterRate += this.fistMastery * 0.001;
        this.sequenceRate += this.fistMastery * 0.001;

        // 刀法精通：影响武学攻击，吸血率，反弹倍数，忽视防御率
        this.attack += Math.floor(this.bladeMastery * 0.5);
        this.vampireRate += this.bladeMastery * 0.001;
        this.reflectMultiplier += this.bladeMastery * 0.005;
        this.ignoreDefenseRate += this.bladeMastery * 0.001;

        // 腿法精通：影响武学攻击，闪避率，速度值，连击率
        this.attack += Math.floor(this.legMastery * 0.5);
        this.dodgeRate += this.legMastery * 0.001;
        this.speed += Math.floor(this.legMastery * 0.2);
        this.comboRate += this.legMastery * 0.001;

        // 剑法精通：影响武学攻击，暴击率，合击率，破招率
        this.attack += Math.floor(this.swordMastery * 0.5);
        this.critRate += this.swordMastery * 0.001;
        this.coopRate += this.swordMastery * 0.001;
        this.parryRate += this.swordMastery * 0.001;

        // 内功精通：影响武学攻击，暴击抵抗率，抗连击率，最大真气
        this.attack += Math.floor(this.internalMastery * 0.5);
        this.critResistance += this.internalMastery * 0.001;
        this.antiComboRate += this.internalMastery * 0.001;
        this.maxEnergy += Math.floor(this.internalMastery * 0.5);
        this.energy = Math.min(this.energy, this.maxEnergy);

        // 医术精通：影响武学攻击，回合恢复生命，回合回真气，最大生命
        this.attack += Math.floor(this.medicalMastery * 0.5);
        this.energyRecoveryRate += this.medicalMastery * 0.0005;
        this.maxHp += Math.floor(this.medicalMastery * 0.5);
        this.hp = Math.min(this.hp, this.maxHp);

        // 奇门精通：影响武学攻击，反弹率，命中率，连招率
        this.attack += Math.floor(this.qimenMastery * 0.5);
        this.reflectRate += this.qimenMastery * 0.001;
        this.hitRate += this.qimenMastery * 0.001;
        this.sequenceRate += this.qimenMastery * 0.001;

        // 暗器精通：影响武学攻击，连击率，暴击伤害倍数，闪避率
        this.attack += Math.floor(this.hiddenWeaponMastery * 0.5);
        this.comboRate += this.hiddenWeaponMastery * 0.001;
        this.critDamage += this.hiddenWeaponMastery * 0.005;
        this.dodgeRate += this.hiddenWeaponMastery * 0.001;

        // 确保属性不会超过合理范围
        this.ensureAttributeLimits();
    }

    // 恢复真气
    recoverEnergy(): number {
        const recovery = 100; // 固定每回合恢复100真气

        this.energy = Math.min(this.energy + recovery, this.maxEnergy);

        return recovery;
    }

    // 消耗真气
    consumeEnergy(amount: number): boolean {
        if (this.energy >= amount) {
            this.energy -= amount;

            return true;
        }

        return false;
    }

    // 确保属性不会超过合理范围
    ensureAttributeLimits(): void {
        // 概率类属性限制
        this.critRate = Math.max(0, Math.min(this.critRate, 1));
        this.critDamage = Math.max(1, Math.min(this.critDamage, 5));
        this.hitRate = Math.max(0.5, Math.min(this.hitRate, 1));
        this.comboRate = Math.max(0, Math.min(this.comboRate, 0.5));
        this.sequenceRate = Math.max(0, Math.min(this.sequenceRate, 0.3));
        this.ignoreDefenseRate = Math.max(0, Math.min(this.ignoreDefenseRate, 0.9));
        this.coopRate = Math.max(0, Math.min(this.coopRate, 0.2));

        // 防御类属性限制
        this.dodgeRate = Math.max(0, Math.min(this.dodgeRate, 0.5));
        this.critResistance = Math.max(0, Math.min(this.critResistance, 0.8));
        this.antiComboRate = Math.max(0, Math.min(this.antiComboRate, 0.8));
        this.counterRate = Math.max(0, Math.min(this.counterRate, 0.3));
        this.parryRate = Math.max(0, Math.min(this.parryRate, 0.2));
        this.reflectRate = Math.max(0, Math.min(this.reflectRate, 0.3));
        this.vampireRate = Math.max(0, Math.min(this.vampireRate, 0.5));
        this.reflectMultiplier = Math.max(1, Math.min(this.reflectMultiplier, 2));

        // 抗性类属性限制
        this.poisonResistance = Math.max(0, Math.min(this.poisonResistance, 0.8));
        this.bleedResistance = Math.max(0, Math.min(this.bleedResistance, 0.8));
        this.armorPenetrationResistance = Math.max(0, Math.min(this.armorPenetrationResistance, 0.8));
        this.slowResistance = Math.max(0, Math.min(this.slowResistance, 0.8));
        this.internalInjuryResistance = Math.max(0, Math.min(this.internalInjuryResistance, 0.8));
        this.disableResistance = Math.max(0, Math.min(this.disableResistance, 0.8));

        // 基础属性限制
        this.attack = Math.max(1, this.attack);
        this.defense = Math.max(0, this.defense);
        this.speed = Math.max(1, this.speed);
        this.hp = Math.max(1, Math.min(this.hp, this.maxHp));
        this.maxHp = Math.max(1, this.maxHp);
        this.energy = Math.max(0, Math.min(this.energy, this.maxEnergy));
        this.maxEnergy = Math.max(1, this.maxEnergy);
    }

    // 添加BUFF
    addBuff(type: BuffType, stacks: number, duration = 2): void {
        const existingBuff = this.buffs.find(buff => buff.type === type);

        if (existingBuff) {
            existingBuff.stacks = Math.min(existingBuff.stacks + stacks, 200);
            existingBuff.duration = Math.max(existingBuff.duration, duration);
        } else {
            this.buffs.push({
                type,
                stacks,
                duration,
                advancedTriggered: false
            });
        }
    }

    // 添加DEBUFF
    addDebuff(type: DebuffType, stacks: number, duration = 2): void {
        const existingDebuff = this.debuffs.find(debuff => debuff.type === type);

        if (existingDebuff) {
            existingDebuff.stacks = Math.min(existingDebuff.stacks + stacks, 200);
            existingDebuff.duration = Math.max(existingDebuff.duration, duration);
        } else {
            this.debuffs.push({
                type,
                stacks,
                duration,
                advancedTriggered: false
            });
        }
    }

    // 处理BUFF/DEBUFF效果
    processBuffDebuffEffects(): void {
        // 处理BUFF效果
        this.buffs.forEach(buff => {
            switch (buff.type) {
                case BuffType.STRONG: // 强壮
                    this.attack += buff.stacks * 50;
                    if (buff.stacks >= 100 && !buff.advancedTriggered) {
                        buff.advancedTriggered = true;
                        // 力道、灵巧、内劲增加50%
                        this.attack *= 1.5;
                        this.speed *= 1.5;
                        this.energyRecoveryRate *= 1.5;
                    }
                    break;
                case BuffType.TOUGH: // 坚韧
                    this.defense += buff.stacks * 2;
                    if (buff.stacks >= 100 && !buff.advancedTriggered) {
                        buff.advancedTriggered = true;
                        // 减伤100%
                        this.defense *= 2;
                    }
                    break;
                case BuffType.AGILE: // 轻盈
                    this.speed += buff.stacks * 2;
                    if (buff.stacks >= 100 && !buff.advancedTriggered) {
                        buff.advancedTriggered = true;
                        this.dodgeRate += 0.5;
                    }
                    break;
                case BuffType.HEAL: // 疗伤
                    this.hp = Math.min(this.hp + buff.stacks * 20, this.maxHp);
                    if (buff.stacks >= 100 && !buff.advancedTriggered) {
                        buff.advancedTriggered = true;
                        this.vampireRate += 1.0;
                    }
                    break;
                case BuffType.MEDITATE: // 调息
                    this.energy = Math.min(this.energy + buff.stacks * 20, this.maxEnergy);
                    if (buff.stacks >= 100 && !buff.advancedTriggered) {
                        buff.advancedTriggered = true;
                        this.comboRate = 1.0; // 下次攻击必然连击
                    }
                    break;
            }
        });

        // 处理DEBUFF效果
        this.debuffs.forEach(debuff => {
            switch (debuff.type) {
                case DebuffType.POISON: // 中毒
                    this.energy = Math.max(0, this.energy - debuff.stacks * 10);
                    this.hp = Math.max(0, this.hp - debuff.stacks * 30);
                    if (debuff.stacks >= 100 && !debuff.advancedTriggered) {
                        debuff.advancedTriggered = true;
                        this.attack *= 0.1; // 伤害降低90%
                    }
                    break;
                case DebuffType.INTERNAL_INJURY: // 内伤
                    const reduction = Math.min(debuff.stacks * 0.01, 0.8);

                    this.energyRecoveryRate *= (1 - reduction);
                    this.vampireRate *= (1 - reduction);
                    if (debuff.stacks >= 100 && !debuff.advancedTriggered) {
                        debuff.advancedTriggered = true;
                        // 真气消耗+400%
                    }
                    break;
                case DebuffType.BLEED: // 流血
                    this.hp = Math.max(0, this.hp - debuff.stacks * 50);
                    if (debuff.stacks >= 100 && !debuff.advancedTriggered) {
                        debuff.advancedTriggered = true;
                        // 封印所有外功
                    }
                    break;
                case DebuffType.SLOW: // 减速
                    this.speed = Math.max(1, this.speed - debuff.stacks * 2);
                    if (debuff.stacks >= 100 && !debuff.advancedTriggered) {
                        debuff.advancedTriggered = true;
                        // 跳过行动回合
                    }
                    break;
                case DebuffType.ARMOR_BREAK: // 破甲
                    this.defense = Math.max(0, this.defense - debuff.stacks * 2);
                    if (debuff.stacks >= 100 && !debuff.advancedTriggered) {
                        debuff.advancedTriggered = true;
                        // 受到伤害+100%
                    }
                    break;
                case DebuffType.DISABLE: // 残废
                    this.attack = Math.max(1, this.attack - debuff.stacks * 50);
                    if (debuff.stacks >= 100 && !debuff.advancedTriggered) {
                        debuff.advancedTriggered = true;
                        // 力道、灵巧、内劲降低50%
                        this.attack *= 0.5;
                        this.speed *= 0.5;
                        this.energyRecoveryRate *= 0.5;
                    }
                    break;
            }
        });
    }

    // 更新BUFF/DEBUFF持续时间
    updateBuffDebuffDurations(): void {
        // 更新BUFF持续时间
        this.buffs = this.buffs.filter(buff => {
            buff.duration--;

            return buff.duration > 0;
        });

        // 更新DEBUFF持续时间
        this.debuffs = this.debuffs.filter(debuff => {
            debuff.duration--;

            return debuff.duration > 0;
        });
    }

    // 天赋相关方法

    // 添加天赋
    addTianfu(tianfuId: string): boolean {
        if (this.tianfus.length >= this.maxTianfuCount) {
            console.log(`${this.name} 已达到最大天赋数量限制`);

            return false;
        }

        const tianfu = this.findTianfuById(tianfuId);

        if (!tianfu) {
            console.log(`未找到天赋ID: ${tianfuId}`);

            return false;
        }

        // 检查是否已拥有该天赋
        if (this.tianfus.some(t => t.id === tianfuId)) {
            console.log(`${this.name} 已拥有天赋: ${tianfu.name}`);

            return false;
        }

        this.tianfus.push({
            id: tianfu.id,
            name: tianfu.name,
            quality: tianfu.quality,
            description: tianfu.description,
            effects: tianfu.effects
        });

        // 重新应用天赋效果
        this.applyTianfuEffects();

        console.log(`${this.name} 获得天赋: ${tianfu.name}`);

        return true;
    }

    // 移除天赋
    removeTianfu(tianfuId: string): boolean {
        const index = this.tianfus.findIndex(t => t.id === tianfuId);

        if (index === -1) {
            console.log(`${this.name} 未拥有天赋ID: ${tianfuId}`);

            return false;
        }

        const removedTianfu = this.tianfus.splice(index, 1)[0];

        // 重新应用天赋效果
        this.applyTianfuEffects();

        console.log(`${this.name} 移除天赋: ${removedTianfu.name}`);

        return true;
    }

    // 根据ID查找天赋
    findTianfuById(tianfuId: string): Tianfu | null {
        // 这里需要根据实际的天赋数据源实现
        // 暂时返回null，实际实现中需要加载天赋数据
        return null;
    }

    // 应用天赋效果
    applyTianfuEffects(): void {
        // 重置所有受天赋影响的属性
        this.resetTianfuAttributes();

        // 应用每个天赋的效果
        this.tianfus.forEach(tianfu => {
            this.applySingleTianfuEffect(tianfu);
        });

        // 确保属性在合理范围内
        this.ensureAttributeLimits();
    }

    // 重置受天赋影响的属性
    resetTianfuAttributes(): void {
        // 这里重置所有可能被天赋影响的属性
        // 实际实现中需要根据具体天赋效果来重置
        // 暂时留空，需要根据具体实现来完善
    }

    // 应用单个天赋效果
    applySingleTianfuEffect(tianfu: Tianfu): void {
        const effects = tianfu.effects;

        for (const effect in effects) {
            const value = effects[effect];

            switch (effect) {
                case '剑法精通':
                    this.swordMastery += parseInt(value);
                    break;
                case '刀法精通':
                    this.bladeMastery += parseInt(value);
                    break;
                case '暗器精通':
                    this.hiddenWeaponMastery += parseInt(value);
                    break;
                case '奇门精通':
                    this.qimenMastery += parseInt(value);
                    break;
                case '拳掌精通':
                    this.fistMastery += parseInt(value);
                    break;
                case '腿法精通':
                    this.legMastery += parseInt(value);
                    break;
                case '医术精通':
                    this.medicalMastery += parseInt(value);
                    break;
                case '内功精通':
                    this.internalMastery += parseInt(value);
                    break;
                case '力道':
                    this.attack += parseInt(value);
                    break;
                case '体质':
                    this.maxHp += parseInt(value);
                    this.hp = Math.min(this.hp, this.maxHp);
                    break;
                case '精力':
                    this.maxEnergy += parseInt(value);
                    this.energy = Math.min(this.energy, this.maxEnergy);
                    break;
                case '灵巧':
                    this.speed += parseInt(value);
                    break;
                case '悟性':
                    // 悟性可能影响其他属性，这里暂时只记录
                    break;
                case '内劲':
                    // 内劲可能影响其他属性，这里暂时只记录
                    break;
                case '吸血率':
                    this.vampireRate += parseFloat(value.replace('%', '')) / 100;
                    break;
                case '反击率':
                    this.counterRate += parseFloat(value.replace('%', '')) / 100;
                    break;
                case '暴击率':
                    this.critRate += parseFloat(value.replace('%', '')) / 100;
                    break;
                case '闪避率':
                    this.dodgeRate += parseFloat(value.replace('%', '')) / 100;
                    break;
                case '连击率':
                    this.comboRate += parseFloat(value.replace('%', '')) / 100;
                    break;
                case '全属性':
                    const allAttrValue = parseInt(value);

                    this.attack += allAttrValue;
                    this.defense += allAttrValue;
                    this.speed += allAttrValue;
                    this.maxHp += allAttrValue;
                    this.maxEnergy += allAttrValue;
                    this.hp = Math.min(this.hp, this.maxHp);
                    this.energy = Math.min(this.energy, this.maxEnergy);
                    break;
                default:
                    // 处理其他特殊效果
                    console.log(`应用天赋 ${tianfu.name} 的特殊效果: ${effect} = ${value}`);
            }
        }

        // 重新计算精通加成
        this.calculateMasteryBonuses();
    }

    // 获取天赋列表
    getTianfuList(): { name: string; quality: string; description: string }[] {
        return this.tianfus.map(t => ({
            name: t.name,
            quality: t.quality,
            description: t.description
        }));
    }

    // 检查是否拥有指定天赋
    hasTianfu(tianfuId: string): boolean {
        return this.tianfus.some(t => t.id === tianfuId);
    }

    // 门派相关方法

    // 加入门派
    joinMenpai(menpaiName: string): boolean {
        if (this.menpai) {
            console.log(`${this.name} 已经加入了 ${this.menpai} 门派`);

            return false;
        }

        const menpai = this.findMenpaiByName(menpaiName);

        if (!menpai) {
            console.log(`未找到门派: ${menpaiName}`);

            return false;
        }

        this.menpai = menpaiName;
        this.menpaiAttributes = { ...menpai.attributes };

        // 应用门派效果
        this.applyMenpaiEffects();

        console.log(`${this.name} 加入了 ${menpaiName} 门派`);

        return true;
    }

    // 退出门派
    leaveMenpai(): boolean {
        if (!this.menpai) {
            console.log(`${this.name} 没有加入任何门派`);

            return false;
        }

        const oldMenpai = this.menpai;

        this.menpai = null;
        this.menpaiAttributes = {};

        // 重新计算属性
        this.resetMenpaiAttributes();
        this.calculateMasteryBonuses();
        this.applyTianfuEffects();

        console.log(`${this.name} 退出了 ${oldMenpai} 门派`);

        return true;
    }

    // 根据名称查找门派
    findMenpaiByName(menpaiName: string): Menpai | null {
        // 这里需要根据实际的门派数据源实现
        // 暂时返回null，实际实现中需要加载门派数据
        return null;
    }

    // 应用门派效果
    applyMenpaiEffects(): void {
        if (!this.menpai) { return; }

        const menpai = this.findMenpaiByName(this.menpai);

        if (!menpai) { return; }

        // 应用门派属性加成
        this.applyMenpaiAttributeBonuses(menpai);

        // 应用门派专属天赋
        this.applyMenpaiTianfus(menpai);

        console.log(`${this.name} 应用了 ${this.menpai} 门派效果`);
    }

    // 应用门派属性加成
    applyMenpaiAttributeBonuses(menpai: Menpai): void {
        const attributes = menpai.attributes;

        if (attributes['力道']) {
            this.attack += attributes['力道'];
        }

        if (attributes['体质']) {
            this.maxHp += attributes['体质'];
            this.hp = Math.min(this.hp, this.maxHp);
        }

        if (attributes['灵巧']) {
            this.speed += attributes['灵巧'];
        }

        if (attributes['悟性']) {
            // 悟性可能影响其他属性，这里暂时只记录
        }

        if (attributes['内劲']) {
            this.maxEnergy += attributes['内劲'];
            this.energy = Math.min(this.energy, this.maxEnergy);
        }
    }

    // 应用门派专属天赋
    applyMenpaiTianfus(menpai: Menpai): void {
        if (!menpai.tianfus || menpai.tianfus.length === 0) { return; }

        menpai.tianfus.forEach(tianfuName => {
            // 查找天赋ID
            const tianfuId = this.findTianfuIdByName(tianfuName);

            if (tianfuId && !this.hasTianfu(tianfuId)) {
                this.addTianfu(tianfuId);
            }
        });
    }

    // 根据天赋名称查找天赋ID
    findTianfuIdByName(tianfuName: string): string | null {
        // 这里需要根据实际的天赋数据源实现
        // 暂时返回null，实际实现中需要加载天赋数据
        return null;
    }

    // 重置门派属性
    resetMenpaiAttributes(): void {
        // 重置所有可能被门派影响的属性
        // 实际实现中需要根据具体门派效果来重置
        // 暂时留空，需要根据具体实现来完善
    }

    // 获取门派信息
    getMenpaiInfo(): { name: string; description: string; specialty?: string; attributes?: any; skills?: string[] } {
        if (!this.menpai) {
            return { name: '无', description: '未加入任何门派' };
        }

        const menpai = this.findMenpaiByName(this.menpai);

        if (!menpai) {
            return { name: this.menpai, description: '门派信息不存在' };
        }

        return {
            name: menpai.name,
            description: menpai.description,
            specialty: menpai.specialty,
            attributes: menpai.attributes,
            skills: menpai.skills
        };
    }
}
