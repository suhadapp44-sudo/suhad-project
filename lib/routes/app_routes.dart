import 'package:flutter/material.dart';
import '../screens/splash_screen.dart';
import '../screens/onboarding_screen.dart';
import '../screens/auth_screen.dart';
import '../screens/family_dashboard_screen.dart';
import '../screens/patient_detail_screen.dart';
import '../screens/lab_results_screen.dart';
import '../screens/emergency_screen.dart';
import '../screens/treatments_screen.dart';
import '../screens/notifications_screen.dart';
class AppRoutes {
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String auth = '/auth';
  static const String dashboard = '/dashboard';
  static const String patientDetail = '/patient-detail';
  static const String keyFeatures = '/key-features';
  static const String labResults = '/lab-results';
  static const String secureChat = '/secure-chat';
  static const String settingsEmergency = '/settings-emergency';
  static const String treatments = '/treatments';
  static const String notifications = '/notifications';
  static Map<String, WidgetBuilder> get routes => {
    splash: (context) => const SplashScreen(),
    onboarding: (context) => const OnboardingScreen(),
    auth: (context) => const AuthScreen(),
    dashboard: (context) => const FamilyDashboardScreen(),
    patientDetail: (context) => const PatientDetailScreen(),
    labResults: (context) => const LabResultsScreen(),
    settingsEmergency: (context) => const SettingsEmergencyScreen(),
    treatments: (context) => const TreatmentsScreen(),
    notifications: (context) => const NotificationsScreen(),
  };
}
