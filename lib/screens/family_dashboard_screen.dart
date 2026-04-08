import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/background_decoration.dart';
import '../routes/app_routes.dart';
import '../l10n/app_localizations.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../services/ai_service.dart';

class FamilyDashboardScreen extends StatefulWidget {
  const FamilyDashboardScreen({super.key});

  @override
  State<FamilyDashboardScreen> createState() => _FamilyDashboardScreenState();
}

class _FamilyDashboardScreenState extends State<FamilyDashboardScreen> {
  String? _patientId;
  String _aiWelcomeMessage = "";
  DateTime? _lastVisit;

  @override
  void initState() {
    super.initState();
    _loadPatientId();
  }

  Future<void> _loadPatientId() async {
    final prefs = await SharedPreferences.getInstance();
    final lastVisitStr = prefs.getString('lastVisit');
    if (lastVisitStr != null) {
      _lastVisit = DateTime.parse(lastVisitStr);
    }

    // Save current visit timestamp
    await prefs.setString('lastVisit', DateTime.now().toIso8601String());

    setState(() {
      _patientId = prefs.getString('patientId');
    });
    if (_patientId != null) {
      _setupFCM();
    }
  }

  Future<void> _setupFCM() async {
    FirebaseMessaging messaging = FirebaseMessaging.instance;

    // Request permission
    NotificationSettings settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Get token
      String? token = await messaging.getToken();
      if (token != null && _patientId != null) {
        await FirebaseFirestore.instance.collection('patients').doc(_patientId).update({
          'fcmTokens': FieldValue.arrayUnion([token]),
        });
        print("FCM Token Saved: $token");
      }

      // Background/Terminated state clicks are already handled in main.dart via FirebaseMessaging.onMessageOpenedApp and getInitialMessage()
      // No duplicate logic needed here to avoid double navigation or context issues.

      // Handle Foreground Messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        if (message.notification != null) {
          // You could show a local notification here if needed
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: InkWell(
                onTap: () => _handleNotificationClick(message),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      message.notification!.title ?? 'تنبيه طارئ!',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(message.notification!.body ?? ''),
                  ],
                ),
              ),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 10),
              action: SnackBarAction(
                label: 'عرض',
                textColor: Colors.white,
                onPressed: () => _handleNotificationClick(message),
              ),
            ),
          );
        }
      });
    }
  }

  void _handleNotificationClick(RemoteMessage message) {
    // Navigate to notifications screen
    Navigator.pushNamed(context, AppRoutes.notifications);
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      return AppLocalizations.of(context)!.locale.languageCode == 'ar' ? "صباح الخير" : "Good Morning";
    } else if (hour < 17) {
      return AppLocalizations.of(context)!.locale.languageCode == 'ar' ? "مساء الخير" : "Good Afternoon";
    } else {
      return AppLocalizations.of(context)!.locale.languageCode == 'ar' ? "مساء الخير" : "Good Evening";
    }
  }

  void _generateAIWelcome(Map<String, dynamic> data) async {
    if (_aiWelcomeMessage.isNotEmpty) return; // Only generate once per session

    // Fetch context for AI
    final medsSnapshot = await FirebaseFirestore.instance.collection('patients').doc(_patientId).collection('medications').limit(3).get();
    final labsSnapshot = await FirebaseFirestore.instance.collection('patients').doc(_patientId).collection('labTests').limit(3).get();
    final proceduresSnapshot = await FirebaseFirestore.instance.collection('patients').doc(_patientId).collection('procedures').limit(3).get();

    final List<String> medications = medsSnapshot.docs.map((d) => (d.data())['name']?.toString() ?? '').toList();
    final List<String> labs = labsSnapshot.docs.map((d) => (d.data())['name']?.toString() ?? '').toList();
    final List<String> procedures = proceduresSnapshot.docs.map((d) => (d.data())['name']?.toString() ?? '').toList();

    final isArabic = AppLocalizations.of(context)!.locale.languageCode == 'ar';
    final prompt = AIService.createSummaryPrompt(data, medications, labs, procedures, isArabic);

    final summary = await AIService.getAIResponse(prompt);

    if (mounted) {
      setState(() {
        _aiWelcomeMessage = summary;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_patientId == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          const BackgroundDecoration(),
          Container(
            decoration: const BoxDecoration(gradient: AppColors.bgGradient),
            child: SafeArea(
              child: StreamBuilder<DocumentSnapshot>(
                stream: FirebaseFirestore.instance
                    .collection('patients')
                    .doc(_patientId)
                    .snapshots(),
                builder: (context, snapshot) {
                  if (snapshot.hasError) {
                    return Center(child: Text('Error: ${snapshot.error}'));
                  }

                  if (!snapshot.hasData || !snapshot.data!.exists) {
                     return const Center(child: CircularProgressIndicator());
                  }

                  final data = snapshot.data!.data() as Map<String, dynamic>;
                  _generateAIWelcome(data);

                  return SingleChildScrollView(
                    padding: const EdgeInsets.all(25),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildHeader(context, data),
                        const SizedBox(height: 20),
                        _buildWelcomeBanner(),
                        const SizedBox(height: 20),
                        _buildAIMessageCard(context, data),
                        const SizedBox(height: 25),
                        _buildSectionTitle(Icons.monitor_heart, AppLocalizations.of(context)!.translate('vital_signs')),
                        _buildVitalsGrid(context, data),
                        const SizedBox(height: 25),


                        _buildSectionTitle(Icons.bolt, AppLocalizations.of(context)!.translate('quick_actions')),
                        _buildQuickActionsGrid(context),
                        const SizedBox(height: 25),
                        _buildNewsTicker(),
                        const SizedBox(height: 80), // Space for FAB-like chat button if needed
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAIChatBottomSheet(context),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.psychology, color: Colors.white),
        label: Text(
          AppLocalizations.of(context)!.locale.languageCode == 'ar' ? "سهاد AI" : "SUHAD AI",
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildWelcomeBanner() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "${_getGreeting()} 👋",
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textTitle),
        ),
        const SizedBox(height: 4),
        Text(
          AppLocalizations.of(context)!.locale.languageCode == 'ar'
            ? "إليك ملخص ما حدث منذ زيارتك الأخيرة:"
            : "Here is a summary of what happened since your last visit:",
          style: const TextStyle(fontSize: 14, color: AppColors.textBody),
        ),
      ],
    );
  }

  Widget _buildHeader(BuildContext context, Map<String, dynamic> data) {
    final status = data['status'] ?? 'stable';
    String statusText;
    Color statusColor;

    // Simple localization mapping
    if (status == 'critical') {
        statusText = AppLocalizations.of(context)!.translate('critical');
        statusColor = AppColors.error;
    } else if (status == 'improving') {
        statusText = AppLocalizations.of(context)!.translate('improving');
        statusColor = Colors.blue;
    } else {
        statusText = AppLocalizations.of(context)!.translate('stable');
        statusColor = AppColors.secondary;
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        GestureDetector(
          onTap: () => Navigator.pushNamed(context, AppRoutes.patientDetail),
          child: Row(
            children: [
              const CircleAvatar(
                radius: 30,
                backgroundColor: AppColors.primary,
                child: Icon(Icons.person, color: Colors.white, size: 30),
              ),
              const SizedBox(width: 15),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    data['name'] ?? 'مريض',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  Row(
                    children: [
                      Icon(Icons.check_circle, color: statusColor, size: 18),
                      const SizedBox(width: 5),
                      Text(
                        statusText,
                        style: TextStyle(color: statusColor, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            GestureDetector(
              onTap: () => Navigator.pushNamed(context, AppRoutes.notifications),
              child: Container(
                width: 50,
                height: 50,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4)),
                  ],
                ),
                child: const Stack(
                  alignment: Alignment.center,
                  children: [
                    Icon(Icons.notifications, color: AppColors.primary),
                    // يمكنك هنا مستقبلاً إضافة نقطة حمراء (Badge) عند وجود إشعارات جديدة غير مقروءة
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            GestureDetector(
              onTap: () => Navigator.pushNamed(context, AppRoutes.settingsEmergency),
              child: Container(
                width: 50,
                height: 50,
                decoration: const BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: Color(0x4DF44336), blurRadius: 8, offset: Offset(0, 4)),
                  ],
                ),
                child: const Icon(Icons.emergency, color: Colors.white),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAIMessageCard(BuildContext context, Map<String, dynamic> data) {
     final status = data['status'] ?? 'stable';

     Color cardColor =  status == 'critical' ? AppColors.error.withOpacity(0.05) : Colors.white;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.secondary.withOpacity(0.3), width: 1),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.secondary.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.auto_awesome, color: AppColors.secondary, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  AppLocalizations.of(context)!.locale.languageCode == 'ar' ? "ملخص حالة المريض" : "Patient Status Summary",
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.secondary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 15),
          Text(
            _aiWelcomeMessage,
            style: const TextStyle(fontSize: 15, color: AppColors.textTitle, height: 1.6),
          ),
          const SizedBox(height: 15),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: () => _showAIChatBottomSheet(context),
              icon: const Icon(Icons.chat_bubble_outline, size: 18),
              label: Text(AppLocalizations.of(context)!.locale.languageCode == 'ar' ? "لديك سؤال؟ اسألني" : "Have a question? Ask me"),
              style: TextButton.styleFrom(foregroundColor: AppColors.primary),
            ),
          ),
        ],
      ),
    );
  }

  void _showAIChatBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, controller) => _AIChatInterface(scrollController: controller, patientId: _patientId!),
      ),
    );
  }

  Widget _buildSectionTitle(IconData icon, String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary, size: 24),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildVitalsGrid(BuildContext context, Map<String, dynamic> vitals) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      childAspectRatio: 1.5,
      mainAxisSpacing: 15,
      crossAxisSpacing: 15,
      children: [
        _buildVitalCard(AppLocalizations.of(context)!.translate('heart_rate'), '${vitals['heartRate'] ?? '--'} bpm', Icons.favorite, AppColors.error),
        _buildVitalCard(AppLocalizations.of(context)!.translate('blood_pressure'), '${vitals['bloodPressure'] ?? '--'}', Icons.speed, AppColors.primary),
        _buildVitalCard(AppLocalizations.of(context)!.translate('oxygen_level'), '${vitals['oxygenLevel'] ?? '--'}%', Icons.air, AppColors.secondary),
        _buildVitalCard(AppLocalizations.of(context)!.translate('temperature'), '${vitals['temperature'] ?? '--'}°C', Icons.thermostat, AppColors.accent),
      ],
    );
  }

  Widget _buildVitalCard(String name, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withOpacity(0.15), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(name, style: const TextStyle(fontSize: 12, color: AppColors.textBody)),
                Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
    );
  }



  Widget _buildQuickActionsGrid(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      childAspectRatio: 2.2,
      mainAxisSpacing: 15,
      crossAxisSpacing: 15,
      children: [
        _buildActionBtn(context, AppLocalizations.of(context)!.translate('lab_results'), Icons.science, AppColors.secondary, AppRoutes.labResults),
        _buildActionBtn(context, AppLocalizations.of(context)!.translate('medications'), Icons.medication, AppColors.accent, AppRoutes.treatments),
        _buildActionBtn(context, AppLocalizations.of(context)!.translate('procedures'), Icons.medical_services, Colors.purple, AppRoutes.treatments),
      ],
    );
  }

  Widget _buildActionBtn(BuildContext context, String text, IconData icon, Color color, String route) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => Navigator.pushNamed(context, route),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: color.withOpacity(0.15), shape: BoxShape.circle),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(width: 10),
                Text(text, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNewsTicker() {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(15),
      ),
      child: const Row(
        children: [
          Icon(Icons.info, color: AppColors.primary, size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'نظام المستشفى يعمل بكفاءة - زيارات العائلات متاحة من 4 إلى 6 مساءً',
              style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}

class _AIChatInterface extends StatefulWidget {
  final ScrollController scrollController;
  final String patientId;

  const _AIChatInterface({required this.scrollController, required this.patientId});

  @override
  State<_AIChatInterface> createState() => _AIChatInterfaceState();
}

class _AIChatInterfaceState extends State<_AIChatInterface> {
  final TextEditingController _messageController = TextEditingController();
  final List<Map<String, dynamic>> _messages = [];
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    _messages.add({
      'text': 'مرحباً بك! أنا سهاد، مساعدك الذكي. كيف يمكنني مساعدتك اليوم في الاستفسار عن الحالة الطبية؟',
      'isMe': false,
    });
  }

  void _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add({'text': text, 'isMe': true});
      _isTyping = true;
      _messageController.clear();
    });

    // Get latest patient data for context
    final doc = await FirebaseFirestore.instance.collection('patients').doc(widget.patientId).get();
    final data = doc.data() ?? {};

    // Fetch info from sub-collections
    final medsSnapshot = await FirebaseFirestore.instance.collection('patients').doc(widget.patientId).collection('medications').limit(3).get();
    final labsSnapshot = await FirebaseFirestore.instance.collection('patients').doc(widget.patientId).collection('labTests').limit(3).get();
    final proceduresSnapshot = await FirebaseFirestore.instance.collection('patients').doc(widget.patientId).collection('procedures').limit(3).get();
    final alertsSnapshot = await FirebaseFirestore.instance.collection('patients').doc(widget.patientId).collection('alerts').orderBy('timestamp', descending: true).limit(3).get();

    final List<String> medications = medsSnapshot.docs.map((d) {
      final m = d.data() as Map<String, dynamic>;
      return "${m['name'] ?? 'دواء'} (${m['dosage'] ?? 'جرعة غير محددة'})";
    }).toList();
    final List<String> labs = labsSnapshot.docs.map((d) {
      final l = d.data() as Map<String, dynamic>;
      return "${l['name'] ?? 'فحص'}: ${l['result'] ?? 'قيد الانتظار'}";
    }).toList();
    final List<String> procedures = proceduresSnapshot.docs.map((d) {
      final p = d.data() as Map<String, dynamic>;
      return "${p['name'] ?? 'إجراء'} (${p['status'] ?? 'تمت'})";
    }).toList();
    final List<String> recentAlerts = alertsSnapshot.docs.map((d) {
      final a = d.data() as Map<String, dynamic>;
      return a['message']?.toString() ?? 'تنبيه جديد';
    }).toList();

    // Simulate AI thinking delay
    await Future.delayed(const Duration(seconds: 1));

    final isArabic = AppLocalizations.of(context)!.locale.languageCode == 'ar';
    final prompt = AIService.createChatPrompt(text, data, medications, labs, procedures, isArabic);

    final response = await AIService.getAIResponse(prompt);

    setState(() {
      _messages.add({'text': response, 'isMe': false});
      _isTyping = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 5,
            decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(10)),
            margin: const EdgeInsets.only(bottom: 20),
          ),
          Row(
            children: [
              const Icon(Icons.psychology, color: AppColors.primary, size: 30),
              const SizedBox(width: 10),
              const Text("سهاد - المساعد الذكي", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const Spacer(),
              IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
            ],
          ),
          const Divider(),
          Expanded(
            child: ListView.builder(
              controller: widget.scrollController,
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                return Align(
                  alignment: msg['isMe'] ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    padding: const EdgeInsets.all(15),
                    decoration: BoxDecoration(
                      color: msg['isMe'] ? AppColors.primary : Colors.grey[100],
                      borderRadius: BorderRadius.circular(20).copyWith(
                        bottomRight: msg['isMe'] ? const Radius.circular(0) : const Radius.circular(20),
                        bottomLeft: msg['isMe'] ? const Radius.circular(20) : const Radius.circular(0),
                      ),
                    ),
                    child: Text(
                      msg['text'],
                      style: TextStyle(color: msg['isMe'] ? Colors.white : Colors.black87, fontSize: 16),
                    ),
                  ),
                );
              },
            ),
          ),
          if (_isTyping)
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Text("سهاد تفكر الآن...", style: TextStyle(fontSize: 12, color: Colors.grey[600], fontStyle: FontStyle.italic)),
            ),
          Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom + 20),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: "اسأل عن حالة المريض، الأدوية، أو أي شيء...",
                      filled: true,
                      fillColor: Colors.grey[100],
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: _sendMessage,
                  child: const CircleAvatar(
                    backgroundColor: AppColors.primary,
                    radius: 25,
                    child: Icon(Icons.send, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
