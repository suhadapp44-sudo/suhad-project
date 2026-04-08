import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/background_decoration.dart';
import '../routes/app_routes.dart';
import '../l10n/app_localizations.dart';

class SettingsEmergencyScreen extends StatefulWidget {
  final String? alertTitle;
  final String? alertMessage;

  const SettingsEmergencyScreen({
    super.key,
    this.alertTitle,
    this.alertMessage,
  });

  @override
  State<SettingsEmergencyScreen> createState() => _SettingsEmergencyScreenState();
}

class _SettingsEmergencyScreenState extends State<SettingsEmergencyScreen> {
  bool highVolumeAlert = true;
  bool vibration = true;
  bool doNotDisturb = false;
  bool biometricAuth = true;
  bool otpSms = true;

  @override
  Widget build(BuildContext context) {
    // Check if arguments were passed if notification properties are null
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final title = widget.alertTitle ?? args?['title'];
    final message = widget.alertMessage ?? args?['body'];
    
    final bool hasActiveAlert = title != null;

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
                    _buildHeader(hasActiveAlert),
                    const SizedBox(height: 30),
                    if (hasActiveAlert)
                      _buildEmergencyAlertCard(title, message!)
                    else
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 50),
                          child: Text(
                            'No active alerts',
                            style: TextStyle(color: AppColors.secondary, fontSize: 18),
                          ),
                        ),
                      ),
                    
                    // Only show settings if there is NO active alert or if you want it at the bottom
                    if (!hasActiveAlert) ...[
                      const SizedBox(height: 30),
                      _buildSettingsCard(context),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(bool hasActiveAlert) {
    return Column(
      children: [
        Row(
          children: [
            IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back_ios, color: AppColors.primary),
            ),
            Expanded(
              child: Text(
                hasActiveAlert ? 'Emergency Response' : 'Settings & Safety',
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primary),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Text(
          hasActiveAlert 
              ? 'Immediate action may be required'
              : 'Manage emergency situations and customize your app',
          style: const TextStyle(fontSize: 14, color: AppColors.secondary, fontWeight: FontWeight.w500),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildEmergencyAlertCard(String title, String message) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              children: [
                const CircleAvatar(
                  backgroundColor: Color(0x26F44336),
                  child: Icon(Icons.emergency, color: AppColors.error),
                ),
                const SizedBox(width: 15),
                Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(25),
              decoration: BoxDecoration(
                color: const Color(0x1AF44336),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.error.withOpacity(0.3)),
              ),
              child: Column(
                children: [
                  const Icon(Icons.warning, color: AppColors.error, size: 60),
                  const SizedBox(height: 15),
                  Text(
                    message,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.error),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 15),
                  const Text(
                    'Your family member needs immediate attention.',
                    style: TextStyle(fontSize: 14, color: Colors.black54),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 25),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.call),
                          label: const Text('Call Hospital'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.error,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.location_on),
                          label: const Text('Directions'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.secondary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 25),
            _buildSettingsSectionTitle(Icons.settings, 'Emergency Preferences', AppColors.error),   ],
        ),
      ),
    );
  }

  Widget _buildSettingsCard(BuildContext context) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              children: [
                const CircleAvatar(
                  backgroundColor: Color(0x264285F4),
                  child: Icon(Icons.settings, color: AppColors.primary),
                ),
                const SizedBox(width: 15),
                Text(AppLocalizations.of(context)!.translate('header_settings'), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 25),

            const SizedBox(height: 10),
            _buildLogoutButton(context),
            const SizedBox(height: 20),
            _buildPrivacyNote(),
          ],
        ),
      ),
    );
  }


  Widget _buildSettingsSectionTitle(IconData icon, String title, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: 8),
          Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }



  Widget _buildLogoutButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: TextButton.icon(
        onPressed: () => Navigator.pushNamedAndRemoveUntil(context, AppRoutes.auth, (route) => false),
        icon: const Icon(Icons.logout, color: AppColors.error),
        label: Text(AppLocalizations.of(context)!.translate('logout'), style: const TextStyle(color: AppColors.error, fontSize: 16, fontWeight: FontWeight.bold)),
        style: TextButton.styleFrom(
          backgroundColor: AppColors.error.withOpacity(0.1),
          padding: const EdgeInsets.symmetric(vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
    );
  }

  Widget _buildPrivacyNote() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.secondary.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
      child: Row(
        children: [
          const Icon(Icons.security, color: AppColors.secondary, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              AppLocalizations.of(context)!.translate('privacy_note'),
              style: const TextStyle(color: AppColors.secondary, fontSize: 13, fontWeight: FontWeight.w500),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}
