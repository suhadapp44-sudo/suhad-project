import 'package:flutter/material.dart';

class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  static const Map<String, Map<String, String>> _localizedValues = {
    'en': {
      // General
      'app_title': 'Suhad',
      'app_tagline': 'We are with you with expertise and warmth',
      'login': 'Login',
      'get_started': 'Get Started',
      'back': 'Back',
      'loading': 'Loading...',
      'error': 'Error',
      'success': 'Success',
      'confirm': 'Confirm',
      
      // Auth
      'phone_number': 'Registered File Number',
      'password': 'Password',
      'forgot_password': 'Forgot Password?',
      'login_with_fingerprint': 'Login with fingerprint',
      'two_factor_auth': 'Two-Factor Authentication',
      'enter_verification_code': 'Enter verification code sent to your phone',
      'verification_code': 'Verification Code',
      'verify': 'Verify',
      'resend_code': 'Resend Code',
      'auth_enter_credentials': 'Please enter phone number and file number',
      'auth_invalid_patient_id': 'Invalid patient file number',
      'auth_invalid_phone': 'Phone number does not match the registered file',
      'auth_login_error': 'Login Error: ',
      'auth_family_login': 'Family Login',
      'auth_family_phone': 'Family Phone Number',
      'auth_phone_hint': '05xxxxxxxx',
      'auth_patient_file': 'Patient File Number (Password)',
      'auth_file_hint': 'Enter document ID',
      'auth_login_btn': 'Enter',
      
      // Dashboard
      'family_dashboard': 'Family Dashboard',
      'patient_condition': 'Patient Condition',
      'stable': 'Stable',
      'critical': 'Critical',
      'improving': 'Improving',
      'vital_signs': 'Vital Signs',
      'heart_rate': 'Heart Rate',
      'blood_pressure': 'Blood Pressure',
      'oxygen_level': 'Oxygen Level',
      'temperature': 'Temperature',
      'recent_alerts': 'Recent Alerts',
      'quick_actions': 'Quick Actions',
      'message_staff': 'Message Staff',
      'lab_results': 'Lab Results',
      'medications': 'Medications',
      'meds': 'Meds',
      'procedures': 'Procedures',
      'ai_messages': 'AI Messages',
      'profile': 'Profile',
      'vitals': 'Vitals',
      'tests': 'Tests',
      'condition_stable_alert': 'Condition is now stable — you will be notified of any changes',
      'critical_alert_simulated': 'Vital signs unstable. Medical staff is attending to the patient.',
      'improving_alert_simulated': 'Patient is showing positive response to treatment.',
      
      // Patient Detail
      'patient_profile': 'Patient Profile',
      'ai_summary': 'AI Summary',
      'family_contacts': 'Family Contact Information',
      'download_report': 'Download Report',
      'smart_app_desc': 'Smart Application for Connecting ICU Families',
      
      // Settings
      'settings': 'Settings',
      'emergency_alert': 'Emergency Alert',
      'call_hospital': 'Call Hospital',
      'logout': 'Logout',
      'language': 'Language',
      'notifications': 'Notifications',
      'emergency_status': 'Emergency Status',
      'header_settings': 'Settings & Account', // Renamed to avoid partial match with 'settings'
      'emergency_settings': 'Emergency Settings',
      'sms_sent': 'SMS has been sent to emergency contacts',
      'account_management': 'Account Management',
      'security_privacy': 'Security & Privacy',
      'personal_info': 'Personal Information',
      'contact_info': 'Contact Information',
      'authorized_persons': 'Authorized Persons',
      'biometric_auth': 'Biometric Authentication',
      'otp_sms': 'OTP SMS Verification',
      'notification_prefs': 'Notification Preferences',
      'privacy_note': 'Suhad respects your privacy — all data is protected',
      
      // Onboarding
      'real_time_updates': 'Real-time Updates',
      'real_time_desc': 'Get instant information about patient status directly from the hospital system',
      'supportive_messages': 'Supportive Messages',
      'supportive_messages_desc': 'Receive reassuring AI-powered messages to reduce anxiety and stress',
      'secure_communication': 'Secure Communication',
      'secure_communication_desc': 'Communicate with medical staff through a secure, encrypted channel',
      'hospital_approval': 'Hospital Approval',
      'skip_introduction': 'Skip Introduction',
      'view_demo': 'View Demo',
      
      // Overview
      'app_purpose': 'App Purpose',
      'app_purpose_desc': 'Suhad is a smart and secure mobile application designed to serve as a humane and effective channel of communication between medical staff and patients\' families in the ICU.',
      'main_features': 'Main Features',
      'key_benefits': 'Key Benefits',
      'reduces_stress': 'Reduces psychological burden',
      'improves_trust': 'Improves trust in healthcare',
      'enhances_efficiency': 'Enhances workflow efficiency',
      'connecting_families': 'Connecting ICU Families with Medical Staff',
      
      // Additional Splash & Onboarding
      'splash_title': 'Suhad App ',
      'splash_tagline_ar': 'نحن معكم بخبرة ودفء', // Keeping Arabic explicitly as requested in design or just translate
      'onboarding_1_title': 'Real-time Updates',
      'onboarding_1_desc': 'Get instant information about patient status directly from the hospital system',
      'onboarding_2_title': 'Supportive Messages',
      'onboarding_2_desc': 'Receive reassuring AI-powered messages to reduce anxiety and stress',
      'onboarding_3_title': 'Secure Communication',
      'onboarding_3_desc': 'Communicate with medical staff through a secure, encrypted channel',
      'skip_intro': 'Skip Introduction',

      // Conclusion Summary
      'conclusion_title': 'Suhad App Summary',
      'reduced_anxiety': 'Reduced anxiety and stress for families',
      'increased_trust': 'Increased trust in healthcare system',
      'improved_workflow': 'Improved workflow efficiency for staff',
      'better_communication': 'Better communication with families',
      'instant_emergency_alerts': 'Instant emergency alerts',
      'contact_info_title': 'Contact Information',
      'email': 'Email',
      'support': 'Support',
      'website': 'Website',

      // Key Features
      'key_features_subtitle': 'Vitals, Procedures, and Medications',
      'upcoming_procedures': 'Upcoming Procedures',
      'chest_xray': 'Chest X-Ray',
      'dressing_change': 'Dressing Change',
      'scheduled': 'Scheduled',
      'in_progress': 'In Progress',
      'paracetamol': 'Paracetamol',
      'amoxicillin': 'Amoxicillin',
      'given': 'Given',
      'delayed': 'Delayed',
      'dose_warning': 'Please do not modify doses without consulting staff',

      // Lab Notifications
      'lab_results_notifications': 'Lab Results & Notifications',
      'track_medical_results': 'Track medical results and stay informed',
      'hemoglobin': 'Hemoglobin',
      'wbc': 'White Blood Cells',
      'sodium': 'Sodium',
      'low': 'Low',
      'normal': 'Normal',
      'ref_range': 'Ref Range',
      'download_lab_report': 'Download Lab Report (PDF)',
      'medication_reminder': 'Medication Reminder',
      'message_notif': 'Message',
      'drop_bp_detected': 'Sharp drop in blood pressure detected',
      'time_for_meds': 'Time for Paracetamol dose',
      'patient_improving_visit': 'Patient condition improving, family can visit',

      // Secure Chat
      'secure_chat_dashboard': 'Secure Chat & Staff Dashboard',
      'secure_comm_desc': 'Secure communication and patient management',
      'secure_chat': 'Secure Chat',
      'staff_dashboard': 'Staff Dashboard',
      'chat_msg_1': 'Hello, I would like to inquire about the condition of patient Ahmed Mohammed',
      'chat_msg_2': 'Hello, the patient\'s condition is stable now, and he has been given the scheduled medications',
      'type_message': 'Type your message...',
      'patient_status_emergency': 'Emergency',
      'patient_status_follow_up': 'Follow-up',
      'room': 'Room',
    },
    'ar': {
      // General
      'app_title': 'سهاد',
      'app_tagline': 'نحن معكم بخبرة ودفء',
      'login': 'تسجيل الدخول',
      'get_started': 'ابدأ الآن',
      'back': 'رجوع',
      'loading': 'جاري التحميل...',
      'error': 'خطأ',
      'success': 'نجاح',
      'confirm': 'تأكيد',
      
      // Auth
      'phone_number': 'رقم الملف المسجل',
      'password': 'كلمة المرور',
      'forgot_password': 'نسيت كلمة المرور؟',
      'login_with_fingerprint': 'الدخول بالبصمة',
      'two_factor_auth': 'التحقق الثنائي',
      'enter_verification_code': 'أدخل رمز التحقق المرسل إلى هاتفك',
      'verification_code': 'رمز التحقق',
      'verify': 'تحقق',
      'resend_code': 'إعادة إرسال الرمز',
      'auth_enter_credentials': 'الرجاء إدخال رقم الجوال ورقم الملف',
      'auth_invalid_patient_id': 'رقم ملف المريض غير صحيح',
      'auth_invalid_phone': 'رقم الجوال غير مطابق للمسجل في ملف المريض',
      'auth_login_error': 'خطأ في تسجيل الدخول: ',
      'auth_family_login': 'تسجيل دخول العائلة',
      'auth_family_phone': 'رقم جوال العائلة',
      'auth_phone_hint': '05xxxxxxxx',
      'auth_patient_file': 'رقم ملف المريض (كلمة المرور)',
      'auth_file_hint': 'أدخل معرف المستند',
      'auth_login_btn': 'دخول',
      
      // Dashboard
      'family_dashboard': 'لوحة تحكم العائلة',
      'patient_condition': 'حالة المريض',
      'stable': 'مستقرة',
      'critical': 'حرجة',
      'improving': 'تتحسن',
      'vital_signs': 'العلامات الحيوية',
      'heart_rate': 'نبضات القلب',
      'blood_pressure': 'ضغط الدم',
      'oxygen_level': 'مستوى الأكسجين',
      'temperature': 'درجة الحرارة',
      'recent_alerts': 'التنبيهات الأخيرة',
      'quick_actions': 'إجراءات سريعة',
      'message_staff': 'مراسلة الطاقم',
      'lab_results': 'نتائج المختبر',
      'medications': 'الأدوية',
      'meds': 'أدوية',
      'procedures': 'الإجراءات',
      'ai_messages': 'رسائل الذكاء الاصطناعي',
      'profile': 'الملف',
      'vitals': 'العلامات',
      'tests': 'تحاليل',
      'condition_stable_alert': 'الحالة مستقرة الآن — سيتم إعلامك بأي تغييرات',
      'critical_alert_simulated': 'العلامات الحيوية غير مستقرة. الطاقم الطبي يقوم باللازم.',
      'improving_alert_simulated': 'المريض يبدي استجابة إيجابية للعلاج.',
      
      // Patient Detail
      'patient_profile': 'ملف المريض',
      'ai_summary': 'ملخص الذكاء الاصطناعي',
      'family_contacts': 'معلومات اتصال العائلة',
      'download_report': 'تحميل التقرير',
      'smart_app_desc': 'تطبيق ذكي لربط عائلات العناية المركزة',
      
      // Settings
      'settings': 'الإعدادات',
      'emergency_alert': 'تنبيه الطوارئ',
      'call_hospital': 'اتصل بالمستشفى',
      'logout': 'تسجيل الخروج',
      'language': 'الغة',
      'notifications': 'الإشعارات',
      'emergency_status': 'حالة الطوارئ',
      'header_settings': 'الإعدادات والحساب',
      'emergency_settings': 'إعدادات الطوارئ',
      'sms_sent': 'تم إرسال رسالة نصية لجهات الاتصال في الطوارئ',
      'account_management': 'إدارة الحساب',
      'security_privacy': 'الأمان والخصوصية',
      'personal_info': 'المعلومات الشخصية',
      'contact_info': 'معلومات الاتصال',
      'authorized_persons': 'الأشخاص المصرح لهم',
      'biometric_auth': 'المصادقة البيومترية',
      'otp_sms': 'التحقق عبر الرسائل النصية',
      'notification_prefs': 'تفضيلات الإشعارات',
      'privacy_note': 'سهاد تحترم خصوصيتك — جميع البيانات محمية',
      
      // Onboarding
      'real_time_updates': 'تحديثات فورية',
      'real_time_desc': 'احصل على معلومات فورية حول حالة المريض مباشرة من نظام المستشفى',
      'supportive_messages': 'رسائل داعمة',
      'supportive_messages_desc': 'تلقي رسائل مطمئنة مدعومة بالذكاء الاصطناعي لتقليل القلق والتوتر',
      'secure_communication': 'تواصل آمن',
      'secure_communication_desc': 'تواصل مع الطاقم الطبي عبر قناة آمنة ومشفرة',
       'skip_introduction': 'تخطي المقدمة',
      'view_demo': 'مشاهدة تجربة',
      
      // Overview
      'app_purpose': 'هدف التطبيق',
      'app_purpose_desc': 'سهاد هو تطبيق ذكي وآمن مصمم ليكون قناة تواصل إنسانية وفعالة بين الطاقم الطبي وعائلات المرضى في العناية المركزة.',
      'main_features': 'المميزات الرئيسية',
      'key_benefits': 'الفوائد الرئيسية',
      'reduces_stress': 'يقلل العبء النفسي',
      'improves_trust': 'يعزز الثقة في الرعاية الصحية',
      'enhances_efficiency': 'يحسن كفاءة سير العمل',
      'connecting_families': 'ربط عائلات العناية المركزة بالطاقم الطبي',

      // Additional Splash & Onboarding
      'splash_title': ' تطبيق سهاد',
      'splash_tagline_ar': 'نحن معكم بخبرة ودفء',
      'onboarding_1_title': 'تحديثات فورية',
      'onboarding_1_desc': 'احصل على معلومات فورية حول حالة المريض مباشرة من نظام المستشفى',
      'onboarding_2_title': 'رسائل داعمة',
      'onboarding_2_desc': 'تلقي رسائل مطمئنة مدعومة بالذكاء الاصطناعي لتقليل القلق والتوتر',
      'onboarding_3_title': 'تواصل آمن',
      'onboarding_3_desc': 'تواصل مع الطاقم الطبي عبر قناة آمنة ومشفرة',
      'skip_intro': 'تخطي المقدمة',
      'hospital_approval': 'اعتماد المستشفى',

      // Conclusion Summary
      'conclusion_title': 'ملخص تطبيق سهاد',
      'reduced_anxiety': 'تقليل القلق والتوتر للعائلات',
      'increased_trust': 'زيادة الثقة في النظام الصحي',
      'improved_workflow': 'تحسين كفاءة العمل للطاقم',
      'better_communication': 'تواصل أفضل مع العائلات',
      'instant_emergency_alerts': 'تنبيهات طوارئ فورية',
      'contact_info_title': 'معلومات الاتصال',
      'email': 'البريد الإلكتروني',
      'support': 'الدعم الفني',
      'website': 'الموقع الإلكتروني',

      // Key Features
      'key_features_subtitle': 'العلامات الحيوية، الإجراءات، والأدوية',
      'upcoming_procedures': 'الإجراءات القادمة',
      'chest_xray': 'أشعة سينية للصدر',
      'dressing_change': 'تغيير الضمادة',
      'scheduled': 'مجدول',
      'in_progress': 'قيد الإجراء',
      'paracetamol': 'باراسيتامول',
      'amoxicillin': 'أموكسيسيلين',
      'given': 'تم الإعطاء',
      'delayed': 'مؤجل',
      'dose_warning': 'الرجاء عدم تعديل الجرعات دون استشارة الطاقم',

      // Lab Notifications
      'lab_results_notifications': 'نتائج المختبر والإشعارات',
      'track_medical_results': 'تتبع النتائج الطبية وكن على اطلاع',
      'hemoglobin': 'الهيموجلوبين',
      'wbc': 'كريات الدم البيضاء',
      'sodium': 'الصوديوم',
      'low': 'منخفض',
      'normal': 'طبيعي',
      'ref_range': 'المعدل الطبيعي',
      'download_lab_report': 'تحميل تقرير المختبر (PDF)',
      'medication_reminder': 'تذكير الدواء',
      'message_notif': 'رسالة',
      'drop_bp_detected': 'تم اكتشاف انخفاض حاد في ضغط الدم',
      'time_for_meds': 'وقت جرعة الباراسيتامول',
      'patient_improving_visit': 'حالة المريض تتحسن، يمكن للعائلة الزيارة',

      // Secure Chat
      'secure_chat_dashboard': 'المحادثة الآمنة ولوحة الطاقم',
      'secure_comm_desc': 'تواصل آمن وإدارة المرضى',
      'secure_chat': 'محادثة آمنة',
      'staff_dashboard': 'لوحة الطاقم',
      'chat_msg_1': 'مرحباً، أود الاستفسار عن حالة المريض أحمد محمد',
      'chat_msg_2': 'مرحباً، حالة المريض مستقرة الآن، وتم إعطاؤه الأدوية المجدولة',
      'type_message': 'اكتب رسالتك...',
      'patient_status_emergency': 'طوارئ',
      'patient_status_follow_up': 'متابعة',
      'room': 'غرفة',
    },
  };

  String translate(String key) {
    return _localizedValues[locale.languageCode]![key] ?? key;
  }
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['en', 'ar'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) {
    return Future.value(AppLocalizations(locale));
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
