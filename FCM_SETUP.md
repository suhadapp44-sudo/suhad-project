# 🔔 Firebase Cloud Messaging (FCM) Setup Guide

## ✅ تم التحديث

تم تحديث ملفات Android بنجاح! الآن اتبع الخطوات التالية:

---

## 1️⃣ **في Firebase Console**

### أ) تأكد من تفعيل Cloud Messaging:
1. اذهب إلى: https://console.firebase.google.com/
2. اختر مشروع `suhad-80c82`
3. من القائمة اليسرى → **Build** → **Cloud Messaging**
4. Cloud Messaging **مفعّل تلقائياً** ✅

### ب) للويب - احصل على Web Push Certificate (اختياري):
1. في صفحة Cloud Messaging
2. تحت **Web configuration**
3. اضغط **Generate key pair**
4. انسخ الـ Key (سنحتاجه لاحقاً للويب)

---

## 2️⃣ **تحديث pubspec.yaml**

أضف Firebase packages:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Existing dependencies
  cupertino_icons: ^1.0.8
  font_awesome_flutter: ^10.12.0
  animations: ^2.1.1
  flutter_localizations:
    sdk: flutter
  
  # Add these Firebase packages
  firebase_core: ^2.24.2
  firebase_auth: ^4.15.3
  cloud_firestore: ^4.13.6
  firebase_messaging: ^14.7.10
```

---

## 3️⃣ **تشغيل flutter pub get**

```bash
flutter pub get
```

---

## 4️⃣ **إعداد Firebase في main.dart**

حدّث ملف `lib/main.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'theme/app_colors.dart';
import 'routes/app_routes.dart';
import 'l10n/app_localizations.dart';

// Handler for background messages
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('Handling background message: ${message.messageId}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Setup FCM background handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'سُهاد',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primary),
        useMaterial3: true,
        fontFamily: 'Cairo',
      ),
      locale: const Locale('ar'),
      supportedLocales: const [
        Locale('ar'),
        Locale('en'),
      ],
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      initialRoute: AppRoutes.auth,
      routes: AppRoutes.routes,
    );
  }
}
```

---

## 5️⃣ **إنشاء Firebase Messaging Service**

أنشئ ملف جديد: `lib/services/firebase_messaging_service.dart`:

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class FirebaseMessagingService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // Initialize FCM
  Future<void> initialize() async {
    // Request permission (iOS)
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted permission');
      
      // Get FCM token
      String? token = await _messaging.getToken();
      print('FCM Token: $token');
      
      // Save token to Firestore
      if (token != null) {
        await _saveTokenToFirestore(token);
      }
      
      // Listen to token refresh
      _messaging.onTokenRefresh.listen(_saveTokenToFirestore);
      
      // Setup message handlers
      _setupMessageHandlers();
    } else {
      print('User declined or has not accepted permission');
    }
  }

  // Save FCM token to Firestore
  Future<void> _saveTokenToFirestore(String token) async {
    User? user = _auth.currentUser;
    if (user != null) {
      await _firestore.collection('users').doc(user.uid).set({
        'fcmToken': token,
        'lastTokenUpdate': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
      
      print('Token saved to Firestore');
    }
  }

  // Setup message handlers
  void _setupMessageHandlers() {
    // Foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Got a message whilst in the foreground!');
      print('Message data: ${message.data}');

      if (message.notification != null) {
        print('Message also contained a notification: ${message.notification}');
        // TODO: Show local notification
        _showNotification(message);
      }
    });

    // Message clicked
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('A message was opened!');
      // TODO: Navigate to specific screen
      _handleMessageClick(message);
    });
  }

  // Show notification (you can use flutter_local_notifications package)
  void _showNotification(RemoteMessage message) {
    // TODO: Implement local notification display
    print('Notification: ${message.notification?.title}');
    print('Body: ${message.notification?.body}');
  }

  // Handle notification click
  void _handleMessageClick(RemoteMessage message) {
    // TODO: Navigate to patient detail screen
    String? patientId = message.data['patientId'];
    print('Navigate to patient: $patientId');
  }

  // Get current FCM token
  Future<String?> getToken() async {
    return await _messaging.getToken();
  }

  // Delete FCM token (for logout)
  Future<void> deleteToken() async {
    await _messaging.deleteToken();
    
    User? user = _auth.currentUser;
    if (user != null) {
      await _firestore.collection('users').doc(user.uid).update({
        'fcmToken': FieldValue.delete(),
      });
    }
  }
}
```

---

## 6️⃣ **استخدام FCM في التطبيق**

في شاشة تسجيل الدخول، بعد النجاح:

```dart
import 'package:suhad/services/firebase_messaging_service.dart';

// بعد تسجيل الدخول بنجاح:
final messagingService = FirebaseMessagingService();
await messagingService.initialize();
```

---

## 7️⃣ **إضافة Permissions للـ Android**

في `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    
    <application>
        <!-- Existing code -->
        
        <!-- FCM Service -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="suhad_notifications" />
    </application>
</manifest>
```

---

## 8️⃣ **اختبار الإشعارات**

### من Firebase Console:
1. **Cloud Messaging** → **Send your first message**
2. **Notification title:** "تحديث حالة مريض"
3. **Notification text:** "حالة المريض أحمد تحتاج متابعة"
4. **Next** → **Select target:** اختر التطبيق
5. **Next** → **Send**

### من لوحة التحكم الويب:
1. سجل دخول كموظف
2. حدّث بيانات مريض مع علامات حرجة
3. اضغط "تحليل بالذكاء الاصطناعي"
4. إذا كان alertLevel >= 5 → سيُرسل إشعار تلقائياً

---

## ✅ Checklist

- [ ] Firebase Config محدثة في جميع ملفات JS
- [ ] Gemini API Key محدثة
- [ ] Google Services plugin مضاف في build.gradle
- [ ] Firebase packages مضافة في pubspec.yaml
- [ ] عملت `flutter pub get`
- [ ] حدّثت main.dart
- [ ] أنشأت FirebaseMessagingService
- [ ] أضفت Permissions في AndroidManifest
- [ ] شغلت التطبيق واختبرت

---

## 🎯 النتيجة المتوقعة

بعد إكمال جميع الخطوات:

✅ **لوحة الويب:** يمكنها إرسال إشعارات  
✅ **التطبيق:** يستلم الإشعارات  
✅ **Firestore:** يحفظ FCM tokens  
✅ **AI:** يقرر متى يُرسل الإشعار  

---

**الخطوة التالية:** عملت `flutter pub get`؟
