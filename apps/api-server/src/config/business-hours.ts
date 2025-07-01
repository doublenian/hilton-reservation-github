// 餐厅营业时间配置
export interface BusinessHours {
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
  timezone?: string;
}

// 默认营业时间配置
export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  openHour: 8,      // 早上8点
  openMinute: 30,   // 30分
  closeHour: 22,    // 晚上10点
  closeMinute: 30,  // 30分
  timezone: 'Asia/Shanghai' // 中国时区
};

// 获取营业时间配置（可以从环境变量或数据库获取）
export function getBusinessHours(): BusinessHours {
  return {
    openHour: parseInt(process.env.BUSINESS_OPEN_HOUR || '8'),
    openMinute: parseInt(process.env.BUSINESS_OPEN_MINUTE || '30'),
    closeHour: parseInt(process.env.BUSINESS_CLOSE_HOUR || '22'),
    closeMinute: parseInt(process.env.BUSINESS_CLOSE_MINUTE || '30'),
    timezone: process.env.BUSINESS_TIMEZONE || 'Asia/Shanghai'
  };
}

// 检查给定时间是否在营业时间内 (时区感知)
export function isWithinBusinessHours(dateTime: Date, businessHours: BusinessHours = DEFAULT_BUSINESS_HOURS): boolean {
  // 将UTC时间转换为业务时区的本地时间
  const localDateTime = new Date(dateTime.toLocaleString("en-US", {timeZone: businessHours.timezone || 'Asia/Shanghai'}));
  
  const hour = localDateTime.getHours();
  const minute = localDateTime.getMinutes();
  
  const timeInMinutes = hour * 60 + minute;
  const openTimeInMinutes = businessHours.openHour * 60 + businessHours.openMinute;
  const closeTimeInMinutes = businessHours.closeHour * 60 + businessHours.closeMinute;
  
  return timeInMinutes >= openTimeInMinutes && timeInMinutes <= closeTimeInMinutes;
}

// 简化版本：直接使用系统本地时间（假设服务器在正确的时区）
export function isWithinBusinessHoursLocal(dateTime: Date, businessHours: BusinessHours = DEFAULT_BUSINESS_HOURS): boolean {
  const hour = dateTime.getHours();
  const minute = dateTime.getMinutes();
  
  const timeInMinutes = hour * 60 + minute;
  const openTimeInMinutes = businessHours.openHour * 60 + businessHours.openMinute;
  const closeTimeInMinutes = businessHours.closeHour * 60 + businessHours.closeMinute;
  
  return timeInMinutes >= openTimeInMinutes && timeInMinutes <= closeTimeInMinutes;
}

// 格式化营业时间为字符串
export function formatBusinessHours(businessHours: BusinessHours = DEFAULT_BUSINESS_HOURS): string {
  const openTime = `${businessHours.openHour}:${businessHours.openMinute.toString().padStart(2, '0')}`;
  const closeTime = `${businessHours.closeHour}:${businessHours.closeMinute.toString().padStart(2, '0')}`;
  return `${openTime} - ${closeTime}`;
}

// 获取时区信息文本
export function getTimezoneInfo(businessHours: BusinessHours = DEFAULT_BUSINESS_HOURS): string {
  const timezone = businessHours.timezone || 'Asia/Shanghai';
  return `(${timezone})`;
} 