// 攻击策略枚举类型
export enum AttackStrategy {
  HEALER = 'healer', // 治疗类型旗子
  DAMAGE_DEALER = 'damage_dealer', // 输出型旗子
  NEAREST = 'nearest', // 最近的旗子
  FARTHEST = 'farthest', // 最远的旗子
  HIGHEST_HP = 'highest_hp', // 血量最多的旗子
  LOWEST_HP = 'lowest_hp', // 血量最少的旗子
  FASTEST = 'fastest', // 速度最快的旗子
  SLOWEST = 'slowest' // 速度最慢的旗子
}
