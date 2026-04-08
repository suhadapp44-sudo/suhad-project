import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_colors.dart';
import '../widgets/background_decoration.dart';
import '../l10n/app_localizations.dart';
import '../services/pdf_service.dart';

class LabResultsScreen extends StatefulWidget {
  const LabResultsScreen({super.key});

  @override
  State<LabResultsScreen> createState() => _LabResultScreenState();
}

class _LabResultScreenState extends State<LabResultsScreen> {
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

    return Scaffold(
      body: Stack(
        children: [
          const BackgroundDecoration(),
          Container(
            decoration: const BoxDecoration(gradient: AppColors.bgGradient),
            child: SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(25),
                child: Column(
                  children: [
                    _buildHeader(context),
                    const SizedBox(height: 30),
                    _buildSectionCard(
                      icon: Icons.science,
                      title: AppLocalizations.of(context)!.translate('lab_results'),
                      color: AppColors.secondary,
                      child: _buildLabResultsList(context),
                    ),

                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Column(
      children: [
        Text(
          AppLocalizations.of(context)!.translate('lab_results'),
          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.primary),
        ),
        const SizedBox(height: 10),
        Text(
          AppLocalizations.of(context)!.translate('track_medical_results'),
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
              Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 20),
          child,
        ],
      ),
    );
  }

  Widget _buildLabResultsList(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('patients')
          .doc(_patientId)
          .collection('labTests')
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
        
        final docs = snapshot.data!.docs.map((d) => d.data() as Map<String, dynamic>).toList();
        
        if (docs.isEmpty) {
          return const Padding(
            padding: EdgeInsets.all(10),
            child: Text('لا توجد نتائج مخبرية', style: TextStyle(color: Colors.grey)),
          );
        }

        // Sort in memory by date (descending)
        docs.sort((a, b) {
          final dateA = _parseTimestamp(a['orderedAt'] ?? a['createdAt'] ?? a['date'] ?? a['timestamp']);
          final dateB = _parseTimestamp(b['orderedAt'] ?? b['createdAt'] ?? b['date'] ?? b['timestamp']);
          return dateB.compareTo(dateA);
        });

        final latestDocs = docs.take(5).toList();

        return Column(
          children: [
            ...latestDocs.map((data) {
              final testTitle = data['testName'] ?? data['name'] ?? 'Test';
              final testResult = data['Summary'] ?? data['result'] ?? '--';
              final rawStatus = data['status']?.toString() ?? '';
              
              String displayStatus = AppLocalizations.of(context)!.translate('normal');
              Color statusColor = AppColors.secondary;

              if (rawStatus == 'Abnormal' || rawStatus == 'Critical') {
                displayStatus = AppLocalizations.of(context)!.translate('danger'); 
                statusColor = AppColors.error;
              } else if (rawStatus == 'Ready') {
                displayStatus = 'جاهز (Ready)';
                statusColor = AppColors.primary;
              }

              return Column(
                children: [
                  _buildLabItem(
                    testTitle, 
                    testResult, 
                    displayStatus, 
                    statusColor,
                    context,
                    data['orderedAt'] ?? data['createdAt'] ?? data['date'] ?? data['timestamp'],
                  ),
                  const Divider(),
                ],
              );
            }).toList(),
            const SizedBox(height: 10),
            ElevatedButton.icon(
              onPressed: () => PdfService.generatePatientReport(_patientId!),
              icon: const Icon(Icons.file_download),
              label: Text(AppLocalizations.of(context)!.translate('download_lab_report')),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.secondary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildLabItem(String test, String value, String status, Color statusColor, BuildContext context, dynamic date) {
    String dateStr = '--';
    if (date != null) {
      final dt = _parseTimestamp(date);
      dateStr = '${dt.year}/${dt.month}/${dt.day} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(child: Text(test, style: const TextStyle(fontWeight: FontWeight.bold))),
              Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: statusColor, fontSize: 16)),
            ],
          ),
          const SizedBox(height: 5),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
               Text(status, style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.w600)),
               Text(dateStr, style: const TextStyle(fontSize: 10, color: AppColors.textBody)),
            ],
          ),
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
