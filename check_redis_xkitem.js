import { getIoRedis } from '@alemonjs/db';

async function checkXKItemInRedis() {
  try {
    const redis = getIoRedis();
    
    console.log('=== 检查Redis中侠客物品数据 ===');
    
    // 检查XKItem键是否存在
    const exists = await redis.exists('XKItem');
    console.log(`XKItem键是否存在: ${exists ? '是' : '否'}`);
    
    if (exists) {
      // 获取XKItem数据
      const xkItemData = await redis.get('XKItem');
      console.log(`XKItem数据长度: ${xkItemData ? xkItemData.length : 0} 字符`);
      
      if (xkItemData) {
        try {
          const parsedData = JSON.parse(xkItemData);
          console.log(`XKItem数据解析成功，类型: ${Array.isArray(parsedData) ? '数组' : typeof parsedData}`);
          
          if (Array.isArray(parsedData)) {
            console.log(`物品数量: ${parsedData.length}`);
            
            // 显示前5个物品的信息
            console.log('\n前5个物品信息:');
            parsedData.slice(0, 5).forEach((item, index) => {
              console.log(`  ${index + 1}. ${item.name || item.名称 || '未知名称'} (ID: ${item.id || '无'})`);
            });
            
            // 检查是否有布鞋
            const clothShoes = parsedData.find(item => 
              item.name === '布鞋' || item.名称 === '布鞋' || item.itemName === '布鞋'
            );
            
            if (clothShoes) {
              console.log('\n✅ 找到布鞋:');
              console.log(JSON.stringify(clothShoes, null, 2));
            } else {
              console.log('\n❌ 未找到布鞋');
              
              // 显示所有物品名称
              const allNames = parsedData.map(item => item.name || item.名称 || item.itemName).filter(Boolean);
              console.log(`\n所有物品名称 (共${allNames.length}个):`);
              console.log(allNames.join(', '));
            }
          }
        } catch (parseError) {
          console.log('❌ XKItem数据解析失败:', parseError.message);
          console.log('数据内容前100字符:', xkItemData.substring(0, 100));
        }
      }
    }
    
    // 检查其他可能的键
    console.log('\n=== 检查其他可能的键 ===');
    const possibleKeys = ['xk_item_list', '侠客物品', 'XKItem', 'xk_goods'];
    
    for (const key of possibleKeys) {
      const keyExists = await redis.exists(key);
      console.log(`${key} 是否存在: ${keyExists ? '是' : '否'}`);
    }
    
    // 检查侠客物品数据是否在DATA_LIST中
    console.log('\n=== 检查本地侠客物品数据 ===');
    const 侠客物品 = await import('./src/resources/data/xk/侠客物品.json', { assert: { type: 'json' } });
    console.log(`本地侠客物品数量: ${侠客物品.default.length}`);
    
    const localClothShoes = 侠客物品.default.find(item => 
      item.name === '布鞋' || item.名称 === '布鞋' || item.itemName === '布鞋'
    );
    
    if (localClothShoes) {
      console.log('✅ 本地数据中找到布鞋:');
      console.log(JSON.stringify(localClothShoes, null, 2));
    } else {
      console.log('❌ 本地数据中未找到布鞋');
      const localNames = 侠客物品.default.map(item => item.name || item.名称 || item.itemName).filter(Boolean);
      console.log(`\n本地物品名称 (前10个): ${localNames.slice(0, 10).join(', ')}`);
    }
    
  } catch (error) {
    console.error('检查Redis时出错:', error);
  } finally {
    process.exit(0);
  }
}

checkXKItemInRedis();