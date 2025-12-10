import { AttackStrategy } from './AttackStrategy'

// 定义接口
interface PieceData {
  id: string
  name: string
  type: string
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  critRate?: number
  critDamage?: number
  position: { x: number; y: number }
  skills?: any[]
  activeSkillIndex?: number
  team: string
  energy?: number
  maxEnergy?: number
  energyRecoveryRate?: number
  menpai?: string
  attackStrategy?: AttackStrategy
  hitRate?: number
  comboRate?: number
  sequenceRate?: number
  ignoreDefenseRate?: number
  coopRate?: number
  dodgeRate?: number
  critResistance?: number
  antiComboRate?: number
  counterRate?: number
  parryRate?: number
  reflectRate?: number
  vampireRate?: number
  reflectMultiplier?: number
  poisonResistance?: number
  bleedResistance?: number
  armorPenetrationResistance?: number
  slowResistance?: number
  internalInjuryResistance?: number
  disableResistance?: number
  swordMastery?: number
  qimenMastery?: number
  bladeMastery?: number
  hiddenWeaponMastery?: number
  fistMastery?: number
  medicalMastery?: number
  legMastery?: number
  internalMastery?: number
  tianfus?: any[]
}

interface Buff {
  type: string
  stacks: number
  duration: number
  advancedTriggered: boolean
}

interface Debuff {
  type: string
  stacks: number
  duration: number
  advancedTriggered: boolean
}

interface Tianfu {
  id: string
  name: string
  quality: string
  description: string
  effects: any
}

interface Menpai {
  name: string
  description: string
  specialty: string
  attributes: any
  skills: any
  tianfus?: string[]
}

// 1. 核心数据结构（添加所有角色属性）
class Piece {
  id: string
  name: string
  type: string
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  critRate: number
  critDamage: number
  position: { x: number; y: number }
  skills: any[]
  activeSkillIndex: number
  team: string
  isAlive: boolean
  buffs: Buff[]
  debuffs: Debuff[]
  actionBar: number

  energy: number
  maxEnergy: number
  energyRecoveryRate: number

  // 门派系统
  menpai: string | null
  menpaiAttributes: any

  // 攻击策略属性
  attackStrategy: AttackStrategy

  // 攻击部分属性
  hitRate: number
  comboRate: number
  sequenceRate: number
  ignoreDefenseRate: number
  coopRate: number

  // 防御部分属性
  dodgeRate: number
  critResistance: number
  antiComboRate: number
  counterRate: number
  parryRate: number
  reflectRate: number
  vampireRate: number
  reflectMultiplier: number
  poisonResistance: number
  bleedResistance: number
  armorPenetrationResistance: number
  slowResistance: number
  internalInjuryResistance: number
  disableResistance: number

  // 精通属性
  swordMastery: number
  qimenMastery: number
  bladeMastery: number
  hiddenWeaponMastery: number
  fistMastery: number
  medicalMastery: number
  legMastery: number
  internalMastery: number

  // 天赋系统
  tianfus: Tianfu[]
  maxTianfuCount: number

  constructor(data: PieceData) {
    this.id = data.id
    this.name = data.name
    this.type = data.type
    this.hp = data.hp
    this.maxHp = data.maxHp
    this.attack = data.attack
    this.defense = data.defense
    this.speed = data.speed
    this.critRate = data.critRate || 0
    this.critDamage = data.critDamage || 2.0
    this.position = data.position
    this.skills = data.skills || []
    this.activeSkillIndex = 0
    this.team = data.team
    this.isAlive = true
    this.buffs = []
    this.debuffs = []
    this.actionBar = 0

    this.energy = data.energy || 2000
    this.maxEnergy = data.maxEnergy || 2000
    this.energyRecoveryRate = data.energyRecoveryRate || 0.1

    // 门派系统
    this.menpai = data.menpai || null
    this.menpaiAttributes = {}

    // 攻击策略属性
    this.attackStrategy = data.attackStrategy || AttackStrategy.NEAREST

    // 攻击部分属性
    this.hitRate = data.hitRate || 1.0
    this.comboRate = data.comboRate || 0
    this.sequenceRate = data.sequenceRate || 0
    this.ignoreDefenseRate = data.ignoreDefenseRate || 0
    this.coopRate = data.coopRate || 0

    // 防御部分属性
    this.dodgeRate = data.dodgeRate || 0
    this.critResistance = data.critResistance || 0
    this.antiComboRate = data.antiComboRate || 0
    this.counterRate = data.counterRate || 0
    this.parryRate = data.parryRate || 0
    this.reflectRate = data.reflectRate || 0
    this.vampireRate = data.vampireRate || 0
    this.reflectMultiplier = data.reflectMultiplier || 1.0
    this.poisonResistance = data.poisonResistance || 0
    this.bleedResistance = data.bleedResistance || 0
    this.armorPenetrationResistance = data.armorPenetrationResistance || 0
    this.slowResistance = data.slowResistance || 0
    this.internalInjuryResistance = data.internalInjuryResistance || 0
    this.disableResistance = data.disableResistance || 0

    // 精通属性
    this.swordMastery = data.swordMastery || 0
    this.qimenMastery = data.qimenMastery || 0
    this.bladeMastery = data.bladeMastery || 0
    this.hiddenWeaponMastery = data.hiddenWeaponMastery || 0
    this.fistMastery = data.fistMastery || 0
    this.medicalMastery = data.medicalMastery || 0
    this.legMastery = data.legMastery || 0
    this.internalMastery = data.internalMastery || 0

    // 天赋系统
    this.tianfus = data.tianfus || []
    this.maxTianfuCount = 20

    // 根据精通计算属性加成
    this.calculateMasteryBonuses()

    // 确保属性不会超过合理范围
    this.ensureAttributeLimits()
  }

  // 根据精通计算属性加成
  calculateMasteryBonuses(): void {
    // 拳掌精通：影响武学攻击，忽视防御率，反击率，连招率
    this.attack += Math.floor(this.fistMastery * 0.5)
    this.ignoreDefenseRate += this.fistMastery * 0.001
    this.counterRate += this.fistMastery * 0.001
    this.sequenceRate += this.fistMastery * 0.001

    // 刀法精通：影响武学攻击，吸血率，反弹倍数，忽视防御率
    this.attack += Math.floor(this.bladeMastery * 0.5)
    this.vampireRate += this.bladeMastery * 0.001
    this.reflectMultiplier += this.bladeMastery * 0.005
    this.ignoreDefenseRate += this.bladeMastery * 0.001

    // 腿法精通：影响武学攻击，闪避率，速度值，连击率
    this.attack += Math.floor(this.legMastery * 0.5)
    this.dodgeRate += this.legMastery * 0.001
    this.speed += Math.floor(this.legMastery * 0.2)
    this.comboRate += this.legMastery * 0.001

    // 剑法精通：影响武学攻击，暴击率，合击率，破招率
    this.attack += Math.floor(this.swordMastery * 0.5)
    this.critRate += this.swordMastery * 0.001
    this.coopRate += this.swordMastery * 0.001
    this.parryRate += this.swordMastery * 0.001

    // 内功精通：影响武学攻击，暴击抵抗率，抗连击率，最大真气
    this.attack += Math.floor(this.internalMastery * 0.5)
    this.critResistance += this.internalMastery * 0.001
    this.antiComboRate += this.internalMastery * 0.001
    this.maxEnergy += Math.floor(this.internalMastery * 0.5)
    this.energy = Math.min(this.energy, this.maxEnergy)

    // 医术精通：影响武学攻击，回合恢复生命，回合回真气，最大生命
    this.attack += Math.floor(this.medicalMastery * 0.5)
    this.energyRecoveryRate += this.medicalMastery * 0.0005
    this.maxHp += Math.floor(this.medicalMastery * 0.5)
    this.hp = Math.min(this.hp, this.maxHp)

    // 奇门精通：影响武学攻击，反弹率，命中率，连招率
    this.attack += Math.floor(this.qimenMastery * 0.5)
    this.reflectRate += this.qimenMastery * 0.001
    this.hitRate += this.qimenMastery * 0.001
    this.sequenceRate += this.qimenMastery * 0.001

    // 暗器精通：影响武学攻击，连击率，暴击伤害倍数，闪避率
    this.attack += Math.floor(this.hiddenWeaponMastery * 0.5)
    this.comboRate += this.hiddenWeaponMastery * 0.001
    this.critDamage += this.hiddenWeaponMastery * 0.005
    this.dodgeRate += this.hiddenWeaponMastery * 0.001

    // 确保属性不会超过合理范围
    this.ensureAttributeLimits()
  }

  recoverEnergy(): number {
    const recovery = 100 // 固定每回合恢复100真气
    this.energy = Math.min(this.energy + recovery, this.maxEnergy)
    return recovery
  }

  consumeEnergy(amount: number): boolean {
    if (this.energy >= amount) {
      this.energy -= amount
      return true
    }
    return false
  }

  // 确保属性不会超过合理范围
  ensureAttributeLimits(): void {
    // 概率类属性限制
    this.critRate = Math.max(0, Math.min(this.critRate, 1))
    this.critDamage = Math.max(1, Math.min(this.critDamage, 5))
    this.hitRate = Math.max(0.5, Math.min(this.hitRate, 1))
    this.comboRate = Math.max(0, Math.min(this.comboRate, 0.5))
    this.sequenceRate = Math.max(0, Math.min(this.sequenceRate, 0.3))
    this.ignoreDefenseRate = Math.max(0, Math.min(this.ignoreDefenseRate, 0.9))
    this.coopRate = Math.max(0, Math.min(this.coopRate, 0.2))

    // 防御类属性限制
    this.dodgeRate = Math.max(0, Math.min(this.dodgeRate, 0.5))
    this.critResistance = Math.max(0, Math.min(this.critResistance, 0.8))
    this.antiComboRate = Math.max(0, Math.min(this.antiComboRate, 0.8))
    this.counterRate = Math.max(0, Math.min(this.counterRate, 0.3))
    this.parryRate = Math.max(0, Math.min(this.parryRate, 0.2))
    this.reflectRate = Math.max(0, Math.min(this.reflectRate, 0.3))
    this.vampireRate = Math.max(0, Math.min(this.vampireRate, 0.5))
    this.reflectMultiplier = Math.max(1, Math.min(this.reflectMultiplier, 2))

    // 抗性类属性限制
    this.poisonResistance = Math.max(0, Math.min(this.poisonResistance, 0.8))
    this.bleedResistance = Math.max(0, Math.min(this.bleedResistance, 0.8))
    this.armorPenetrationResistance = Math.max(
      0,
      Math.min(this.armorPenetrationResistance, 0.8)
    )
    this.slowResistance = Math.max(0, Math.min(this.slowResistance, 0.8))
    this.internalInjuryResistance = Math.max(
      0,
      Math.min(this.internalInjuryResistance, 0.8)
    )
    this.disableResistance = Math.max(0, Math.min(this.disableResistance, 0.8))

    // 基础属性限制
    this.attack = Math.max(1, this.attack)
    this.defense = Math.max(0, this.defense)
    this.speed = Math.max(1, this.speed)
    this.hp = Math.max(1, Math.min(this.hp, this.maxHp))
    this.maxHp = Math.max(1, this.maxHp)
    this.energy = Math.max(0, Math.min(this.energy, this.maxEnergy))
    this.maxEnergy = Math.max(1, this.maxEnergy)
  }

  // 添加buff
  addBuff(buffType: string, stacks: number, duration: number = 2): void {
    const existingBuff = this.buffs.find(buff => buff.type === buffType)
    if (existingBuff) {
      existingBuff.stacks = Math.min(existingBuff.stacks + stacks, 200)
      existingBuff.duration = Math.max(existingBuff.duration, duration)
    } else {
      this.buffs.push({
        type: buffType,
        stacks: stacks,
        duration: duration,
        advancedTriggered: false
      })
    }
  }

  // 添加debuff
  addDebuff(debuffType: string, stacks: number, duration: number = 2): void {
    const existingDebuff = this.debuffs.find(
      debuff => debuff.type === debuffType
    )
    if (existingDebuff) {
      existingDebuff.stacks = Math.min(existingDebuff.stacks + stacks, 200)
      existingDebuff.duration = Math.max(existingDebuff.duration, duration)
    } else {
      this.debuffs.push({
        type: debuffType,
        stacks: stacks,
        duration: duration,
        advancedTriggered: false
      })
    }
  }

  // 处理buff/debuff效果
  processBuffDebuffEffects(): void {
    // 处理buff效果
    this.buffs.forEach(buff => {
      switch (buff.type) {
        case 'strong': // 强壮
          this.attack += buff.stacks * 50
          if (buff.stacks >= 100 && !buff.advancedTriggered) {
            buff.advancedTriggered = true
            // 力道、灵巧、内劲增加50%
            this.attack *= 1.5
            this.speed *= 1.5
            this.energyRecoveryRate *= 1.5
          }
          break
        case 'tough': // 坚韧
          this.defense += buff.stacks * 2
          if (buff.stacks >= 100 && !buff.advancedTriggered) {
            buff.advancedTriggered = true
            // 减伤100%
            this.defense *= 2
          }
          break
        case 'agile': // 轻盈
          this.speed += buff.stacks * 2
          if (buff.stacks >= 100 && !buff.advancedTriggered) {
            buff.advancedTriggered = true
            this.dodgeRate += 0.5
          }
          break
        case 'heal': // 疗伤
          this.hp = Math.min(this.hp + buff.stacks * 20, this.maxHp)
          if (buff.stacks >= 100 && !buff.advancedTriggered) {
            buff.advancedTriggered = true
            this.vampireRate += 1.0
          }
          break
        case 'meditate': // 调息
          this.energy = Math.min(this.energy + buff.stacks * 20, this.maxEnergy)
          if (buff.stacks >= 100 && !buff.advancedTriggered) {
            buff.advancedTriggered = true
            this.comboRate = 1.0 // 下次攻击必然连击
          }
          break
      }
    })

    // 处理debuff效果
    this.debuffs.forEach(debuff => {
      switch (debuff.type) {
        case 'poison': // 中毒
          this.energy = Math.max(0, this.energy - debuff.stacks * 10)
          this.hp = Math.max(0, this.hp - debuff.stacks * 30)
          if (debuff.stacks >= 100 && !debuff.advancedTriggered) {
            debuff.advancedTriggered = true
            this.attack *= 0.1 // 伤害降低90%
          }
          break
        case 'internal_injury': // 内伤
          const reduction = Math.min(debuff.stacks * 0.01, 0.8)
          this.energyRecoveryRate *= 1 - reduction
          this.vampireRate *= 1 - reduction
          if (debuff.stacks >= 100 && !debuff.advancedTriggered) {
            debuff.advancedTriggered = true
            // 真气消耗+400%
          }
          break
        case 'bleed': // 流血
          this.hp = Math.max(0, this.hp - debuff.stacks * 50)
          if (debuff.stacks >= 100 && !debuff.advancedTriggered) {
            debuff.advancedTriggered = true
            // 封印所有外功
          }
          break
        case 'slow': // 减速
          this.speed = Math.max(1, this.speed - debuff.stacks * 2)
          if (debuff.stacks >= 100 && !debuff.advancedTriggered) {
            debuff.advancedTriggered = true
            // 跳过行动回合
          }
          break
        case 'armor_break': // 破甲
          this.defense = Math.max(0, this.defense - debuff.stacks * 2)
          if (debuff.stacks >= 100 && !debuff.advancedTriggered) {
            debuff.advancedTriggered = true
            // 受到伤害+100%
          }
          break
        case 'disable': // 残废
          this.attack = Math.max(1, this.attack - debuff.stacks * 50)
          if (debuff.stacks >= 100 && !debuff.advancedTriggered) {
            debuff.advancedTriggered = true
            // 力道、灵巧、内劲降低50%
            this.attack *= 0.5
            this.speed *= 0.5
            this.energyRecoveryRate *= 0.5
          }
          break
      }
    })
  }

  // 更新buff/debuff持续时间
  updateBuffDebuffDurations(): void {
    // 更新buff持续时间
    this.buffs = this.buffs.filter(buff => {
      buff.duration--
      return buff.duration > 0
    })

    // 更新debuff持续时间
    this.debuffs = this.debuffs.filter(debuff => {
      debuff.duration--
      return debuff.duration > 0
    })
  }

  // 天赋相关方法

  // 添加天赋
  addTianfu(tianfuId: string): boolean {
    if (this.tianfus.length >= this.maxTianfuCount) {
      console.log(`${this.name} 已达到最大天赋数量限制`)
      return false
    }

    const tianfu = this.findTianfuById(tianfuId)
    if (!tianfu) {
      console.log(`未找到天赋ID: ${tianfuId}`)
      return false
    }

    // 检查是否已拥有该天赋
    if (this.tianfus.some(t => t.id === tianfuId)) {
      console.log(`${this.name} 已拥有天赋: ${tianfu.name}`)
      return false
    }

    this.tianfus.push({
      id: tianfu.id,
      name: tianfu.name,
      quality: tianfu.quality,
      description: tianfu.description,
      effects: tianfu.effects
    })

    console.log(`${this.name} 获得天赋: ${tianfu.name}`)
    return true
  }

  // 移除天赋
  removeTianfu(tianfuId: string): boolean {
    const index = this.tianfus.findIndex(t => t.id === tianfuId)
    if (index === -1) {
      console.log(`${this.name} 未拥有天赋ID: ${tianfuId}`)
      return false
    }

    const removedTianfu = this.tianfus.splice(index, 1)[0]

    console.log(`${this.name} 移除天赋: ${removedTianfu?.name || '未知天赋'}`)
    return true
  }

  // 根据ID查找天赋
  findTianfuById(tianfuId: string): any {
    // 这里简化处理，实际应该从数据源查找
    return null
  }

  // 应用天赋效果
  applyTianfuEffects(): void {
    // 这里简化处理，实际应该应用天赋效果
  }

  // 重置受天赋影响的属性
  resetTianfuAttributes(): void {
    // 这里简化处理
  }

  // 应用单个天赋效果
  applySingleTianfuEffect(tianfu: Tianfu): void {
    // 这里简化处理
  }

  // 应用门派效果
  applyMenpaiEffects(): void {
    // 这里简化处理
  }
}

export { Piece, PieceData, Buff, Debuff, Tianfu, Menpai }