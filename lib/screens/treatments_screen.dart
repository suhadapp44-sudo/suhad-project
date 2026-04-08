import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_colors.dart';
import '../widgets/background_decoration.dart';
import '../l10n/app_localizations.dart';
import '../services/pdf_service.dart';

class TreatmentsScreen extends StatefulWidget {
  const TreatmentsScreen({super.key});

  @override
  State<TreatmentsScreen> createState() => _TreatmentsScreenState();
}

class _TreatmentsScreenState extends State<TreatmentsScreen> with SingleTickerProviderStateMixin {
  String? _patientId;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
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

    return Scaffold(
      body: Stack(
        children: [
          const BackgroundDecoration(),
          Container(
            decoration: const BoxDecoration(gradient: AppColors.bgGradient),
            child: SafeArea(
              child: Column(
                children: [
                  _buildHeader(context),
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: TabBar(
                        controller: _tabController,
                        labelColor: AppColors.primary,
                        unselectedLabelColor: AppColors.textBody,
                        indicatorColor: AppColors.primary,
                        indicatorSize: TabBarIndicatorSize.tab,
                        indicator: BoxDecoration(
                          borderRadius: BorderRadius.circular(15),
                          color: Colors.white,
                        ),
                        tabs: [
                          Tab(
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.medication),
                                const SizedBox(width: 8),
                                Text(AppLocalizations.of(context)!.translate('medications')),
                              ],
                            ),
                          ),
                          Tab(
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.medical_services),
                                const SizedBox(width: 8),
                                Text(AppLocalizations.of(context)!.translate('procedures')),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Expanded(
                    child: TabBarView(
                      controller: _tabController,
                      children: [
                        _buildMedicationsList(),
                        _buildProceduresList(),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => PdfService.generatePatientReport(_patientId!),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.download, color: Colors.white),
        label: const Text('تحميل التقرير الكامل', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back_ios, color: AppColors.primary),
              ),
              const Expanded(
                child: Text(
                  'الخطة العلاجية',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primary),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(width: 48), // Equalizer for back button
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'متابعة حالة الأدوية والإجراءات الطبية الحالية',
            style: TextStyle(fontSize: 14, color: AppColors.secondary, fontWeight: FontWeight.w500),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildMedicationsList() {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('patients')
          .doc(_patientId)
          .collection('medications')
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
        final docs = snapshot.data!.docs;

        if (docs.isEmpty) return _buildEmptyState(Icons.medication_outlined, 'لا توجد أدوية مسجلة حالياً');

        return ListView.builder(
          padding: const EdgeInsets.all(20),
          itemCount: docs.length,
          itemBuilder: (context, index) {
            final data = docs[index].data() as Map<String, dynamic>;
            return _buildTreatmentCard(
              title: data['name'] ?? 'دواء غير معروف',
              subtitle: data['dosage'] ?? 'الجرعة غير محددة',
              trailing: data['status'] ?? 'Scheduled',
              date: data['orderedAt'] ?? data['createdAt'] ?? data['date'] ?? data['timestamp'],
              color: AppColors.accent,
              icon: Icons.medication,
            );
          },
        );
      },
    );
  }

  Widget _buildProceduresList() {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('patients')
          .doc(_patientId)
          .collection('procedures')
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
        final docs = snapshot.data!.docs;

        if (docs.isEmpty) return _buildEmptyState(Icons.medical_services_outlined, 'لا توجد إجراءات طبية مسجلة');

        return ListView.builder(
          padding: const EdgeInsets.all(20),
          itemCount: docs.length,
          itemBuilder: (context, index) {
            final data = docs[index].data() as Map<String, dynamic>;
            return _buildTreatmentCard(
              title: data['name'] ?? 'إجراء طبي',
              subtitle: data['notes'] ?? 'لا توجد ملاحظات إضافية',
              trailing: data['status'] ?? 'Pending',
              date: data['orderedAt'] ?? data['createdAt'] ?? data['date'] ?? data['time'] ?? data['timestamp'],
              color: Colors.purple,
              icon: Icons.medical_services,
            );
          },
        );
      },
    );
  }

  Widget _buildTreatmentCard({
    required String title,
    required String subtitle,
    required String trailing,
    required dynamic date,
    required Color color,
    required IconData icon,
  }) {
    String dateStr = '--';
    if (date != null) {
      final dt = _parseTimestamp(date);
      dateStr = '${dt.year}/${dt.month}/${dt.day} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                const SizedBox(height: 4),
                Text(dateStr, style: const TextStyle(color: AppColors.textBody, fontSize: 11)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: (trailing == 'Completed' || trailing == 'Taken') ? Colors.green.withOpacity(0.1) : color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              trailing,
              style: TextStyle(
                fontSize: 10, 
                fontWeight: FontWeight.bold, 
                color: (trailing == 'Completed' || trailing == 'Taken') ? Colors.green : color
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(IconData icon, String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 60, color: Colors.grey[300]),
          const SizedBox(height: 15),
          Text(message, style: const TextStyle(color: Colors.grey, fontSize: 16)),
        ],
      ),
    );
  }

  DateTime _parseTimestamp(dynamic time) {
    if (time == null) return DateTime(1900);
    if (time is Timestamp) return time.toDate();
    if (time is String) {
      try {
        return DateTime.parse(time);
      } catch (_) {
        return DateTime(1900);
      }
    }
    return DateTime(1900);
  }
}
