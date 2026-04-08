import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/background_decoration.dart';
import '../routes/app_routes.dart';
import '../l10n/app_localizations.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _phoneController = TextEditingController();
  final _patientIdController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _patientIdController.dispose();
    super.dispose();
  }

  Future<void> _verifyAndLogin() async {
    final phone = _phoneController.text.trim();
    final patientId = _patientIdController.text.trim();
    final tr = AppLocalizations.of(context)!;

    if (phone.isEmpty || patientId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(tr.translate('auth_enter_credentials'))),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      // 1. Check if patient exists
      final docRef = FirebaseFirestore.instance.collection('patients').doc(patientId);
      final docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        throw tr.translate('auth_invalid_patient_id');
      }

      final data = docSnapshot.data();
      final storedPhone = data?['familyPhone'] as String?;

      // 2. Verify Phone Number
      if (storedPhone != phone) {
        throw tr.translate('auth_invalid_phone');
      }

      // 3. Register FCM Token (for notifications)
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await docRef.update({
          'fcmTokens': FieldValue.arrayUnion([token]),
        });
      }

      // 4. Save Session Locally
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('patientId', patientId);
      await prefs.setString('familyPhone', phone);

      if (!mounted) return;

      // 5. Navigate to Dashboard
      Navigator.pushReplacementNamed(context, AppRoutes.dashboard);

    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${tr.translate('auth_login_error')}$e')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const BackgroundDecoration(),
          Container(
            decoration: const BoxDecoration(gradient: AppColors.bgGradient),
            child: SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 20),
                  child: Column(
                    children: [
                      _buildHeader(),
                      const SizedBox(height: 30),
                      _buildLoginCard(),
                    ],
                  ),
                ),
              ),
            ),
          ),
          if (_isLoading)
            Container(
              color: Colors.black45,
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child:  Image.asset(
            'assets/images/icon.png',
            width: 70,
            height: 70,
          ),
        ),
        const SizedBox(height: 20),
        Text(
          AppLocalizations.of(context)!.translate('login'),
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w500,
            color: AppColors.secondary,
          ),
        ),
      ],
    );
  }

  Widget _buildLoginCard() {
    final tr = AppLocalizations.of(context)!;
    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          children: [
            Row(
              children: [
                const Icon(Icons.login, color: AppColors.primary),
                const SizedBox(width: 10),
                Text(
                  tr.translate('auth_family_login'),
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 30),
            _buildTextField(
              controller: _phoneController,
              label: tr.translate('auth_family_phone'),
              hint: tr.translate('auth_phone_hint'),
              icon: Icons.phone,
            ),
            const SizedBox(height: 20),
            _buildTextField(
              controller: _patientIdController,
              label: tr.translate('auth_patient_file'),
              hint: tr.translate('auth_file_hint'),
              icon: Icons.folder_shared,
              isPassword: true,
            ),
            const SizedBox(height: 30),
            _buildButton(
              text: tr.translate('auth_login_btn'),
              icon: Icons.arrow_forward,
              onPressed: _verifyAndLogin,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    bool isPassword = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textBody),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: controller,
          obscureText: isPassword,
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: AppColors.primary.withOpacity(0.7)),
            hintText: hint,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE0E0E0), width: 2),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildButton({required String text, required IconData icon, required VoidCallback onPressed}) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon),
        label: Text(text, style: const TextStyle(fontSize: 18)),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }
}
