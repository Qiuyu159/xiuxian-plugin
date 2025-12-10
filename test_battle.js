// 战斗功能测试脚本
import { handleBattleCommand, testBattleWithOldData } from './lib/response/xk/battle/res.js';

async function testBattleFunctionality() {
  console.log('=== 开始测试战斗功能 ===\n')
  
  // 测试1：使用正则指令测试
  console.log('测试1：正则指令测试')
  console.log('指令：侠客切磋风冲')
  const result1 = await handleBattleCommand('侠客切磋风冲')
  console.log('结果：')
  console.log(result1)
  console.log('\n')
  
  // 测试2：使用旧数据测试
  console.log('测试2：旧数据测试')
  const result2 = await testBattleWithOldData()
  console.log('结果：')
  console.log(result2)
  console.log('\n')
  
  // 测试3：测试不同角色
  console.log('测试3：不同角色测试')
  console.log('指令：侠客切磋张三丰')
  const result3 = await handleBattleCommand('侠客切磋张三丰')
  console.log('结果：')
  console.log(result3)
  console.log('\n')
  
  console.log('=== 战斗功能测试完成 ===')
}

// 运行测试
testBattleFunctionality().catch(error => {
  console.error('测试失败:', error)
})