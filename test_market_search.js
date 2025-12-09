import { getIoRedis } from '@alemonjs/db';

async function testMarketSearch() {
  try {
    console.log('=== 测试市场功能搜索侠客物品 ===');
    
    const redis = getIoRedis();
    
    // 检查Redis连接
    await redis.ping();
    console.log('✅ Redis连接正常');
    
    // 从Redis获取侠客物品数据
    const xkItemData = await redis.get('XKItem');
    
    if (!xkItemData) {
      console.log('❌ Redis中未找到XKItem数据');
      return;
    }
    
    const xkItemList = JSON.parse(xkItemData);
    console.log(`✅ Redis中侠客物品数量: ${xkItemList.length}`);
    
    // 测试搜索布鞋（模拟市场功能的搜索逻辑）
    const searchTerm = '布鞋';
    console.log(`\n🔍 搜索物品: "${searchTerm}"`);
    
    const foundItem = xkItemList.find(item => 
      item.name === searchTerm || 
      item.名称 === searchTerm || 
      item.itemName === searchTerm
    );
    
    if (foundItem) {
      console.log('✅ 搜索成功！找到物品:');
      console.log(JSON.stringify(foundItem, null, 2));
      
      // 检查价格信息
      console.log(`💰 购买价格: ${foundItem.buyPrice || '无'}`);
      console.log(`💰 出售价格: ${foundItem.sellPrice || '无'}`);
    } else {
      console.log('❌ 未找到匹配的物品');
      
      // 显示前10个物品名称供参考
      const itemNames = xkItemList.map(item => item.name || item.名称 || item.itemName).filter(Boolean);
      console.log(`\n可用物品名称 (前10个): ${itemNames.slice(0, 10).join(', ')}`);
    }
    
    // 测试搜索其他常见物品
    const testItems = ['经验丹', '武学丹', '擂台币', '布衣'];
    
    console.log('\n=== 测试其他常见物品搜索 ===');
    for (const itemName of testItems) {
      const item = xkItemList.find(item => 
        item.name === itemName || 
        item.名称 === itemName || 
        item.itemName === itemName
      );
      
      if (item) {
        console.log(`✅ "${itemName}": 找到 (ID: ${item.id}, 品质: ${item.quality})`);
      } else {
        console.log(`❌ "${itemName}": 未找到`);
      }
    }
    
    console.log('\n✅ 市场功能搜索测试完成！');
    
  } catch (error) {
    console.error('测试市场功能搜索时出错:', error);
  } finally {
    process.exit(0);
  }
}

testMarketSearch();