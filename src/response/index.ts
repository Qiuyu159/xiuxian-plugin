// 响应模块索引文件 - 自动导出所有响应模块

// 导入验证码响应模块
import captchaResponse from './res';

// 导入侠客相关响应模块
import xkRegisterResponse from './xk/register/res';
import xkRegisterInfoResponse from './xk/register_info/res';
import xkBagResponse from './xk/bag/res';
import xkMarketResponse from './xk/market/res';
import xkGiveResponse from './xk/give/res';

// 导入用户相关响应模块
import userStartNewbieResponse from './User/UserStart/newbie/res';

// 导入其他响应模块
import adminSuperUpdateRecordResponse from './AdminSuper/updateRecord/res';

// 导出所有响应模块
export default [
  captchaResponse,
  xkRegisterResponse,
  xkRegisterInfoResponse,
  xkBagResponse,
  xkMarketResponse,
  xkGiveResponse,
  userStartNewbieResponse,
  adminSuperUpdateRecordResponse
];
