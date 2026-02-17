import 'package:flutter/material.dart';
import 'splash_screen.dart';

void main() {
  runApp(const ThryveApp());
}

class ThryveApp extends StatelessWidget {
  const ThryveApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Thryve',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF89CFF0), // Baby Blue
          primary: const Color(0xFF89CFF0), // Baby Blue primary
          secondary: const Color(0xFFF4C2C2), // Baby Pink secondary
          surface: Colors.white, // Pure White background
        ),
      ),
      home: const SplashScreen(),
    );
  }
}
