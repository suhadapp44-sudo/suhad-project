import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_colors.dart';
import '../widgets/background_decoration.dart';
import '../l10n/app_localizations.dart';
import 'package:intl/intl.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  String? _patientId;

  @override
  void initState() {
    super.initState();
    _loadPatientId();
  }

  Future<void> _loadPatientId() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _patientId = prefs.getString('patientId');
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_patientId == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final isArabic = AppLocalizations.of(context)!.locale.languageCode == 'ar';

    return Scaffold(
      extendBodyBehindAppBar: true, // لضمان امتداد الخلفية للأعلى بجانب زر الرجوع
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.primary),
      ),
      body: Stack(
        children: [
          const BackgroundDecoration(),
          Container(
            decoration: const BoxDecoration(gradient: AppColors.bgGradient),
            child: SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 10),
                child: Column(
                  children: [
                    _buildHeader(isArabic),
                    const SizedBox(height: 30),
                    _buildSectionCard(
                      icon: Icons.notifications_active,
                      title: isArabic ? 'سجل الإشعارات والتنبيهات' : 'Notifications Log',
                      color: AppColors.accent,
                      child: _buildNotificationsList(isArabic),
                    ),
                    const SizedBox(height: 25),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(bool isArabic) {
    return Column(
      children: [
        Text(
          isArabic ? 'الإشعارات' : 'Notifications',
          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.primary),
        ),
        const SizedBox(height: 10),
        Text(
          isArabic ? 'تتبع كل المستجدات الطارئة والمهمة' : 'Track all important and emergency updates',
          style: const TextStyle(fontSize: 16, color: AppColors.secondary, fontWeight: FontWeight.w500),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildSectionCard({required IconData icon, required String title, required Color color, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: color.withOpacity(0.15),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 20),
          child,
        ],
      ),
    );
  }

  Widget _buildNotificationsList(bool isArabic) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('patients')
          .doc(_patientId)
          .collection('alerts')
          .orderBy('timestamp', descending: true)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
           return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.data!.docs.isEmpty) {
           return Padding(
             padding: const EdgeInsets.symmetric(vertical: 20),
             child: Center(
               child: Text(
                 isArabic ? 'لا توجد إشعارات حالياً' : 'No notifications currently', 
                 style: const TextStyle(color: Colors.grey, fontSize: 16)
               ),
             ),
           );
        }

        return Column(
          children: snapshot.data!.docs.map((doc) {
             final data = doc.data() as Map<String, dynamic>;
             Color color = AppColors.primary;
             
             // تحديد لون الإشعار حسب نوعه
             if (data['type'] == 'critical') color = AppColors.error;
             if (data['type'] == 'lab') color = AppColors.secondary;

             final message = data['message'] ?? '';
             final title = data['title'] ?? (isArabic ? 'تنبيه' : 'Alert');
             
             // تنسيق الوقت
             String timeStr = data['time'] ?? '';
             if (timeStr.isEmpty && data['timestamp'] != null) {
                DateTime? date;
                final raw = data['timestamp'];
                if (raw is Timestamp) {
                  date = raw.toDate();
                } else if (raw is String) {
                  try {
                    date = DateTime.parse(raw);
                  } catch (_) {}
                }
                if (date != null) {
                  timeStr = DateFormat('yyyy/MM/dd - hh:mm a', 'en').format(date);
                }
             }

             if (timeStr.isEmpty) {
               timeStr = isArabic ? 'الآن' : 'Now';
             }

             return _buildNotificationItem(
               title,
               message,
               timeStr,
               color
             );
          }).toList(),
        );
      },
    );
  }

  Widget _buildNotificationItem(String title, String text, String time, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Icon(Icons.circle, color: color, size: 10),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 5),
                Text(text, style: const TextStyle(fontSize: 12, color: AppColors.textTitle)),
                const SizedBox(height: 5),
                Text(time, style: const TextStyle(fontSize: 10, color: AppColors.textBody)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
