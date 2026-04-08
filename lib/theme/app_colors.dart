import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFF4285F4);
  static const Color secondary = Color(0xFF0F9D58);
  static const Color accent = Color(0xFFF4B400);
  static const Color error = Color(0xFFF44336);
  static const Color background = Color(0xFFF5F5F5);
  static const Color white = Colors.white;
  static const Color textBody = Color(0xFF666666);
  static const Color textTitle = Color(0xFF333333);

  static const LinearGradient bgGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF5F9FF), Color(0xFFE8F5E9)],
  );
}
