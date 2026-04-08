import 'dart:io';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class PdfService {
  static Future<void> generatePatientReport(String patientId) async {
    final pdf = pw.Document();
    
    // Load Cairo Font for Arabic support
    final fontData = await rootBundle.load("assets/fonts/Cairo-Regular.ttf");
    final ttf = pw.Font.ttf(fontData);

    // Load App Icon
    final iconData = await rootBundle.load("assets/images/suhad_icon.png");
    final appIcon = pw.MemoryImage(iconData.buffer.asUint8List());

    // Define Theme Color (matched to AppColors.primary #4285F4)
    const primaryColor = PdfColor.fromInt(0xFF4285F4);
    const secondaryColor = PdfColor.fromInt(0xFF0F9D58);

    // Fetch Patient Data
    final patientDoc = await FirebaseFirestore.instance.collection('patients').doc(patientId).get();
    final patientData = patientDoc.data() ?? {};
    final String name = patientData['name'] ?? 'Guest';

    // Fetch Sub-collections
    final medications = await _fetchCollection(patientId, 'medications');
    final labs = await _fetchCollection(patientId, 'labTests');
    final procedures = await _fetchCollection(patientId, 'procedures');
    final alerts = await _fetchCollection(patientId, 'alerts');

    // Combine all events for the timeline
    List<Map<String, dynamic>> timeline = [];
    timeline.addAll(medications.map((m) => {...m, 'type': 'Medication', 'color': PdfColors.blue}));
    timeline.addAll(labs.map((l) => {...l, 'type': 'Lab Test', 'color': PdfColors.green}));
    timeline.addAll(procedures.map((p) => {...p, 'type': 'Procedure', 'color': PdfColors.purple}));
    timeline.addAll(alerts.map((a) => {...a, 'type': 'Alert', 'name': a['message'], 'color': PdfColors.red}));

    // Sort timeline
    timeline.sort((a, b) {
      final dateA = _parseDate(a['date'] ?? a['timestamp']);
      final dateB = _parseDate(b['date'] ?? b['timestamp']);
      return dateB.compareTo(dateA);
    });

    pdf.addPage(
      pw.MultiPage(
        theme: pw.ThemeData.withFont(base: ttf, bold: ttf),
        textDirection: pw.TextDirection.rtl,
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(30),
        build: (context) => [
          _buildPremiumHeader(name, patientData, appIcon, primaryColor),
          pw.SizedBox(height: 30),
          _buildVitalsGrid(patientData, primaryColor),
          pw.SizedBox(height: 30),
          pw.Text('سجل الفعاليات الطبية | Medical Timeline', style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold, color: primaryColor)),
          pw.SizedBox(height: 10),
          ...timeline.map((event) => _buildPremiumEventRow(event)),
          pw.SizedBox(height: 20),
          pw.Divider(color: PdfColors.grey300),
          pw.Align(
            alignment: pw.Alignment.center,
            child: pw.Text('شكراً لاختياركم تطبيق سهاد - نتمنى لكم الشفاء العاجل', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey), textDirection: pw.TextDirection.rtl),
          ),
        ],
      ),
    );

    await Printing.layoutPdf(onLayout: (PdfPageFormat format) async => pdf.save());
  }

  static pw.Widget _buildPremiumHeader(String name, Map<String, dynamic> data, pw.ImageProvider icon, PdfColor primaryColor) {
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text('التقرير الطبي الذكي', style: pw.TextStyle(fontSize: 28, fontWeight: pw.FontWeight.bold, color: primaryColor), textDirection: pw.TextDirection.rtl),
            pw.Text('Suhad Smart Medical Report', style: pw.TextStyle(fontSize: 14, color: PdfColors.grey700)),
            pw.SizedBox(height: 15),
            pw.Text('اسم المريض: $name', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold), textDirection: pw.TextDirection.rtl),
            pw.Text('الاسم الكامل: ${data['fullName'] ?? name}', style: const pw.TextStyle(fontSize: 12), textDirection: pw.TextDirection.rtl),
            pw.Text('رقم الغرفة: ${data['roomNumber'] ?? '--'} | العمر: ${data['age'] ?? '--'}', style: const pw.TextStyle(fontSize: 12), textDirection: pw.TextDirection.rtl),
            pw.Text('التشخيص التاريخ: ${data['diagnosis'] ?? '--'}', style: const pw.TextStyle(fontSize: 12), textDirection: pw.TextDirection.rtl),
          ],
        ),
        pw.Column(
          children: [
            pw.Image(icon, width: 70, height: 70),
            pw.SizedBox(height: 5),
            pw.Text('تاريخ التقرير', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey), textDirection: pw.TextDirection.rtl),
            pw.Text(DateFormat('yyyy/MM/dd HH:mm').format(DateTime.now()), style:  pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
          ],
        ),
      ],
    );
  }

  static pw.Widget _buildVitalsGrid(Map<String, dynamic> data, PdfColor color) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(15),
      decoration: pw.BoxDecoration(
        color: PdfColors.blue50,
        borderRadius: pw.BorderRadius.circular(10),
        border: pw.Border.all(color: color.shade(0.2), width: 1),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text('العلامات الحيوية الحالية | Current Vitals', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: color)),
          pw.SizedBox(height: 10),
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              _buildVitalBox('نبض القلب', '${data['heartRate'] ?? '--'}', 'bpm'),
              _buildVitalBox('ضغط الدم', '${data['bloodPressure'] ?? '--'}', 'mmHg'),
              _buildVitalBox('الحرارة', '${data['temperature'] ?? '--'}', '°C'),
              _buildVitalBox('الأكسجين', '${data['oxygenLevel'] ?? '--'}', '%'),
            ],
          ),
        ],
      ),
    );
  }

  static pw.Widget _buildVitalBox(String label, String value, String unit) {
    return pw.Column(
      children: [
        pw.Text(label, style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700), textDirection: pw.TextDirection.rtl),
        pw.Text(value, style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800)),
        pw.Text(unit, style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey)),
      ],
    );
  }

  static pw.Widget _buildPremiumEventRow(Map<String, dynamic> event) {
    final date = _parseDate(event['orderedAt'] ?? event['createdAt'] ?? event['date'] ?? event['timestamp']);
    final dateStr = DateFormat('yyyy/MM/dd - HH:mm').format(date);
    final PdfColor color = event['color'] ?? PdfColors.blue;
    final String title = event['testName'] ?? event['name'] ?? 'حدث غير معروف';
    final String summary = '${event['Summary'] ?? event['result'] ?? ''} ${event['dosage'] ?? ''} ${event['status'] ?? ''}'.trim();
    
    return pw.Container(
      margin: const pw.EdgeInsets.only(bottom: 10),
      child: pw.Row(
        children: [
          pw.Container(
            width: 100,
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(dateStr.split('-')[0].trim(), style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey)),
                pw.Text(dateStr.split('-')[1].trim(), style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: color)),
              ],
            ),
          ),
          pw.Container(
            height: 40,
            width: 2,
            color: color.shade(0.3),
            margin: const pw.EdgeInsets.symmetric(horizontal: 10),
          ),
          pw.Expanded(
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Row(
                  children: [
                    pw.Text('[${event['type']}]', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: color)),
                    pw.SizedBox(width: 5),
                    pw.Expanded(child: pw.Text(title, style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold), textDirection: pw.TextDirection.rtl)),
                  ],
                ),
                if (summary.isNotEmpty)
                  pw.Text(
                    summary,
                    style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
                    textDirection: pw.TextDirection.rtl,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static Future<List<Map<String, dynamic>>> _fetchCollection(String patientId, String collection) async {
    final snapshot = await FirebaseFirestore.instance.collection('patients').doc(patientId).collection(collection).get();
    return snapshot.docs.map((doc) => doc.data()).toList();
  }

  static DateTime _parseDate(dynamic date) {
    if (date == null) return DateTime(1900);
    if (date is Timestamp) return date.toDate();
    if (date is String) {
      try {
        return DateTime.parse(date);
      } catch (_) {
        return DateTime(1900);
      }
    }
    return DateTime(1900);
  }
}
