import { readFileSync } from 'fs';
import { getIoRedis } from '@alemonjs/db';

async function importXKItemToRedis() {
  try {
    console.log('=== 开始将侠客物品数据导入Redis ===');
    
    // 读取本地侠客物品数据
    const 侠客物品Data = readFileSync('./src/resources/data/xk/侠客物品.json', 'utf8');
    const 侠客物品 = JSON.parse(侠客物品Data);
    
    console.log(`本地侠客物品数量: ${侠客物品.length}`);
    
    // 检查是否有布鞋
    const clothShoes = 侠客物品.find(item => 
      item.name === '布鞋' || item.名称 === '布鞋' || item.itemName === '布鞋'
    );
    
    if (clothShoes) {
      console.log('✅ 本地数据中找到布鞋:');
      console.log(JSON.stringify(clothShoes, null, 2));
    } else {
      console.log('❌ 本地数据中未找到布鞋');
      const localNames = 侠客物品.map(item => item.name || item.名称 || item.itemName).filter(Boolean);
      console.log(`\n本地物品名称 (前10个): ${localNames.slice(0, 10).join(', ')}`);
    }
    
    // 直接使用Redis客户端将数据导入Redis
    console.log('\n正在将侠客物品数据导入Redis...');
    const redis = getIoRedis();
    
    // 检查Redis连接
    await redis.ping();
    console.log('✅ Redis连接正常');
    
    // 将数据导入Redis
    await redis.set('XKItem', JSON.stringify(侠客物品));
    
    // 验证数据是否成功写入
    const redisData = await redis.get('XKItem');
    if (redisData) {
      const parsedData = JSON.parse(redisData);
      console.log(`✅ Redis中侠客物品数量: ${parsedData.length}`);
      
      // 检查Redis中是否有布鞋
      const redisClothShoes = parsedData.find(item => 
        item.name === '布鞋' || item.名称 === '布鞋' || item.itemName === '布鞋'
      );
      
      if (redisClothShoes) {
        console.log('✅ Redis数据中找到布鞋:');
        console.log(JSON.stringify(redisClothShoes, null, 2));
      } else {
        console.log('❌ Redis数据中未找到布鞋');
        const redisNames = parsedData.map(item => item.name || item.名称 || item.itemName).filter(Boolean);
        console.log(`\nRedis物品名称 (前10个): ${redisNames.slice(0, 10).join(', ')}`);
      }
    }
    
    console.log('✅ 侠客物品数据已成功导入Redis');
    
  } catch (error) {
    console.error('导入侠客物品数据到Redis时出错:', error);
  } finally {
    process.exit(0);
  }
}

importXKItemToRedis();