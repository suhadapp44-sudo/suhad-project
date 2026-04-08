// ========================================
// WEB PUSH NOTIFICATIONS CONFIGURATION
// ========================================
// 
// هذا الملف للاحتياط - إذا أردت في المستقبل
// أن تستقبل لوحة التحكم الويب إشعارات أيضاً
//
// ========================================

export const webPushConfig = {
    // Web Push Certificate من Firebase Cloud Messaging
    vapidKey: "BLcQptMbWwSve2wjlQbtEkAnBo-Q2-DaBs-ygSlllBd_R20_mTCoco0p9CIpeAmB1l-U6pViHTXb2UN1ubjduQU"
};

// ========================================
// كيفية الاستخدام (في المستقبل):
// ========================================
//
// import { getMessaging, getToken } from 'firebase/messaging';
// import { webPushConfig } from './web-push-config.js';
//
// const messaging = getMessaging();
//
// getToken(messaging, { vapidKey: webPushConfig.vapidKey })
//   .then((currentToken) => {
//     if (currentToken) {
//       console.log('Token:', currentToken);
//       // إرسال Token للـ backend
//     }
//   });
//
// ========================================

// حالياً: لا نحتاج هذا
// لوحة التحكم الويب فقط تُرسل إشعارات
// التطبيق Flutter هو الذي يستقبلها
