import * as fs from 'fs';
import * as path from 'path';

// 迁移脚本：将复杂的装备ID转换为简单的数字ID
export function migrateEquipmentIds(): void {
  console.log('开始迁移装备ID...');
  
  const equipmentFilePath = path.join(__dirname, 'data', 'Equipment.json');
  const bagFilePath = path.join(__dirname, 'data', 'bag.json');
  
  // 检查文件是否存在
  if (!fs.existsSync(equipmentFilePath)) {
    console.log('Equipment.json文件不存在，无需迁移');
    return;
  }
  
  if (!fs.existsSync(bagFilePath)) {
    console.log('bag.json文件不存在，无法迁移背包数据');
    return;
  }
  
  try {
    // 读取现有数据
    const equipmentData = JSON.parse(fs.readFileSync(equipmentFilePath, 'utf8'));
    const bagData = JSON.parse(fs.readFileSync(bagFilePath, 'utf8'));
    
    // 创建新的装备映射（使用数字ID）
    const newEquipmentMapping: { [key: number]: any } = {};
    const idMapping: { [key: string]: number } = {}; // 旧ID到新ID的映射
    
    let nextId = 1;
    
    // 迁移装备数据
    Object.keys(equipmentData).forEach(oldId => {
      const equipment = equipmentData[oldId];
      const newId = nextId++;
      
      // 更新装备的uniqueId
      equipment.uniqueId = newId;
      newEquipmentMapping[newId] = equipment;
      
      // 保存ID映射关系
      idMapping[oldId] = newId;
    });
    
    // 迁移背包数据中的装备ID
    Object.keys(bagData).forEach(playerId => {
      const playerBag = bagData[playerId];
      
      if (playerBag['装备']) {
        playerBag['装备'].forEach((equipment: any) => {
          const oldId = equipment.uniqueId;
          if (idMapping[oldId]) {
            equipment.uniqueId = idMapping[oldId];
          }
        });
      }
    });
    
    // 备份原文件
    const backupEquipmentPath = equipmentFilePath + '.backup';
    const backupBagPath = bagFilePath + '.backup';
    
    fs.writeFileSync(backupEquipmentPath, JSON.stringify(equipmentData, null, 2));
    fs.writeFileSync(backupBagPath, JSON.stringify(bagData, null, 2));
    
    // 保存新数据
    fs.writeFileSync(equipmentFilePath, JSON.stringify(newEquipmentMapping, null, 2));
    fs.writeFileSync(bagFilePath, JSON.stringify(bagData, null, 2));
    
    console.log('装备ID迁移完成！');
    console.log(`迁移了 ${Object.keys(idMapping).length} 个装备`);
    console.log(`原文件已备份为：${backupEquipmentPath} 和 ${backupBagPath}`);
    
  } catch (error: any) {
    console.error('迁移过程中发生错误:', error);
  }
}

// 运行迁移
if (require.main === module) {
  migrateEquipmentIds();
}