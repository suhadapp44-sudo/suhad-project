import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'l10n/app_localizations.dart';
import 'routes/app_routes.dart';
import 'theme/app_colors.dart';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

/// معالج الإشعارات في الخلفية (يجب أن يكون دالة مستقلة تماماً بكلمة @pragma)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // يجب تهيئة الفايربيز مرة أخرى هنا للوصول إلى الخدمات (كاستخدام قاعدة البيانات) بالخلفية
  await Firebase.initializeApp();
  print("تم استلام إشعار في الخلفية بدون تفاعل: ${message.messageId}");
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // الاستماع لإشعارات الخلفية لتنفيذ أكواد برمجية معينة
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // الاستماع للإشعارات عندما يكون التطبيق مفتوح ونشط (Foreground)
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print("وصل إشعار جديد أثناء استخدام التطبيق: ${message.notification?.title}");
    // يمكنك هنا إظهار SnackBar في الواجهة أو إشعار منبثق للمستخدم
  });

  // Handle background/terminated notification clicks
  FirebaseMessaging.instance.getInitialMessage().then((RemoteMessage? message) {
    if (message != null) {
      _handleNotificationClick(message);
    }
  });

  // Handle notification clicks while app is in background
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    _handleNotificationClick(message);
  });

  runApp(const SuhadApp());
}

void _handleNotificationClick(RemoteMessage message) {
  // Navigate to Notifications Screen when notification is clicked
  navigatorKey.currentState?.pushNamed(
    AppRoutes.notifications,
    arguments: {
      'title': message.notification?.title,
      'body': message.notification?.body,
      'data': message.data,
    },
  );
}

class SuhadApp extends StatelessWidget {
  const SuhadApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey, // Assign the key here
      title: 'Suhad App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: AppColors.primary,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          primary: AppColors.primary,
          secondary: AppColors.secondary,
          error: AppColors.error,
        ),
        useMaterial3: true,
        fontFamily: 'Cairo', // Updated default font to Cairo
        textTheme: const TextTheme(
          displayLarge: TextStyle(fontFamily: 'Cairo'),
          bodyLarge: TextStyle(fontFamily: 'Cairo'),
          // You can add more text styles if needed
        ),),
      initialRoute: AppRoutes.splash,
      routes: AppRoutes.routes,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en', ''), // English
        Locale('ar', ''), // Arabic
      ],
      localeResolutionCallback: (locale, supportedLocales) {
        if (locale == null) return supportedLocales.first;
        for (var supportedLocale in supportedLocales) {
          if (supportedLocale.languageCode == locale.languageCode) {
            return supportedLocale;
          }
        }
        return supportedLocales.first;
      },
    );
  }
}
