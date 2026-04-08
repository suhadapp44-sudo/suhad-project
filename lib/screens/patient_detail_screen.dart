import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_colors.dart';
import '../widgets/background_decoration.dart';
import '../l10n/app_localizations.dart';
import '../services/pdf_service.dart';

class PatientDetailScreen extends StatefulWidget {
  const PatientDetailScreen({super.key});

  @override
  State<PatientDetailScreen> createState() => _PatientDetailScreenState();
}

class _PatientDetailScreenState extends State<PatientDetailScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String? _patientId;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _loadPatientId();
  }

  Future<void> _loadPatientId() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _patientId = prefs.getString('patientId');
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
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
              child: StreamBuilder<DocumentSnapshot>(
                stream: FirebaseFirestore.instance.collection('patients').doc(_patientId).snapshots(),
                builder: (context, snapshot) {
                  if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));
                  if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());

                  final data = snapshot.data!.data() as Map<String, dynamic>? ?? {};

                  return NestedScrollView(
                    headerSliverBuilder: (context, innerBoxIsScrolled) => [
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            children: [
                              _buildPatientHeader(context, data),
                              const SizedBox(height: 20),
                              _buildStatusSummary(context, data),
                              const SizedBox(height: 20),
                              TabBar(
                                controller: _tabController,
                                labelColor: AppColors.primary,
                                unselectedLabelColor: AppColors.textBody,
                                indicatorColor: AppColors.primary,
                                isScrollable: true,
                                  tabs: [
                                    Tab(icon: const Icon(Icons.person), text: AppLocalizations.of(context)!.translate('profile')),
                                    Tab(icon: const Icon(Icons.monitor_heart), text: AppLocalizations.of(context)!.translate('vitals')),
                                    Tab(icon: const Icon(Icons.medication), text: 'Medications'),
                                    Tab(icon: const Icon(Icons.science), text: 'Lab Tests'),
                                    Tab(icon: const Icon(Icons.medical_services), text: 'Procedures'),
                                  ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                    body: TabBarView(
                      controller: _tabController,
                      children: [
                        _buildProfileTab(data),
                        _buildVitalsTab(data),
                        _buildSubCollectionList('medications', Icons.medication, AppColors.accent),
                        _buildSubCollectionList('labTests', Icons.science, AppColors.secondary),
                        _buildSubCollectionList('procedures', Icons.medical_services, Colors.purple),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPatientHeader(BuildContext context, Map<String, dynamic> data) {
    final status = data['status'] ?? 'stable';
    String statusText = status;
    Color statusColor = AppColors.secondary;

    if (status == 'critical') {
      statusText = AppLocalizations.of(context)!.translate('critical');
      statusColor = AppColors.error;
    } else if (status == 'improving') {
       statusText = AppLocalizations.of(context)!.translate('improving');
       statusColor = Colors.blue;
    } else {
       statusText = AppLocalizations.of(context)!.translate('stable');
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 40,
            backgroundColor: AppColors.primary,
            child: Icon(Icons.person, size: 40, color: Colors.white),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: Text(data['name'] ?? 'Guest', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold))),
                    IconButton(
                      icon: const Icon(Icons.picture_as_pdf, color: AppColors.primary),
                      onPressed: () => PdfService.generatePatientReport(_patientId!),
                      tooltip: 'Download Report',
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                     const Icon(Icons.bed, color: AppColors.textBody, size: 18),
                     const SizedBox(width: 5),
                     Text('Room: ${data['room'] ?? '--'}', style: const TextStyle(color: AppColors.textBody)),
                     const SizedBox(width: 15),
                     Icon(Icons.check_circle, color: statusColor, size: 18),
                     const SizedBox(width: 5),
                     Text(statusText, style: TextStyle(color: statusColor, fontWeight: FontWeight.bold)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusSummary(BuildContext context, Map<String, dynamic> data) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('AI Summary', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          Text(
            data['aiAnalysis'] ?? 'No analysis available yet.',
            style: const TextStyle(fontSize: 14, height: 1.5, color: AppColors.textTitle),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileTab(Map<String, dynamic> data) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildInfoTile(Icons.cake, 'Age', '${data['age'] ?? '--'} years'),
        _buildInfoTile(Icons.medical_services, 'Diagnosis', data['diagnosis'] ?? '--'),
        _buildInfoTile(Icons.person, 'Gender', data['gender'] ?? '--'),
        _buildInfoTile(Icons.local_hospital, 'Admission Date', _formatItemDate(data['admissionDate'])),
      ],
    );
  }

  Widget _buildVitalsTab(Map<String, dynamic> data) {
    // Vitals are at root level
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildInfoTile(Icons.favorite, 'Heart Rate', '${data['heartRate'] ?? '--'} bpm'),
        _buildInfoTile(Icons.speed, 'Blood Pressure', '${data['bloodPressure'] ?? '--'}'),
        _buildInfoTile(Icons.air, 'Oxygen Level', '${data['oxygenLevel'] ?? '--'} %'),
        _buildInfoTile(Icons.thermostat, 'Temperature', '${data['temperature'] ?? '--'} °C'),
        _buildInfoTile(Icons.monitor_weight, 'Respiratory Rate', '${data['respiratoryRate'] ?? '--'} /min'),
      ],
    );
  }

  Widget _buildSubCollectionList(String collectionName, IconData icon, Color color) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('patients')
          .doc(_patientId)
          .collection(collectionName)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.hasError) return Text('Error: ${snapshot.error}');
        if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());

        final docs = snapshot.data!.docs;
        if (docs.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 50, color: Colors.grey[300]),
                const SizedBox(height: 10),
                const Text('No records found', style: TextStyle(color: Colors.grey)),
              ],
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.all(20),
          itemCount: docs.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            final itemData = docs[index].data() as Map<String, dynamic>;
            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4, offset:const Offset(0, 2)),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
                    child: Icon(icon, color: color),
                  ),
                  const SizedBox(width: 15),
                  Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            itemData['testName'] ?? itemData['name'] ?? 'Unknown',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)
                          ),
                          if (itemData['dosage'] != null)
                            Text('Dosage: ${itemData['dosage']}', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                          if (itemData['Summary'] != null || itemData['result'] != null)
                            Text(
                              'Result: ${itemData['Summary'] ?? itemData['result']}',
                              style: TextStyle(
                                color: (itemData['status'] == 'Abnormal' || itemData['status'] == 'Critical') ? Colors.red : Colors.green,
                                fontWeight: FontWeight.bold,
                                fontSize: 13
                              )
                            ),
                           if (itemData['orderedAt'] != null || itemData['createdAt'] != null || itemData['date'] != null)
                            Text(
                              _formatItemDate(itemData['orderedAt'] ?? itemData['createdAt'] ?? itemData['date']),
                              style: const TextStyle(color: Colors.grey, fontSize: 12)
                            ),
                          if (itemData['status'] != null && itemData['Summary'] == null && itemData['result'] == null)
                            Text('Status: ${itemData['status']}', style: const TextStyle(color: Colors.blue, fontSize: 12)),
                        ],
                      ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildInfoTile(IconData icon, String title, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary.withOpacity(0.7)),
          const SizedBox(width: 15),
          Expanded(
            child: Text(title, style: const TextStyle(fontSize: 16, color: AppColors.textBody)),
          ),
          Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textTitle)),
        ],
      ),
    );
  }

  String _formatItemDate(dynamic date) {
    if (date == null) return '--';
    if (date is Timestamp) {
      final dt = date.toDate();
      return '${dt.year}/${dt.month}/${dt.day} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    }
    return date.toString();
  }
}
