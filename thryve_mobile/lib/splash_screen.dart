import 'dart:async';
import 'package:flutter/material.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    // Start a 3-second timer to transition to the next screen
    Timer(const Duration(seconds: 3), () {
      // Replace with your Onboarding or Login Screen later
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const PlaceholderHomeScreen()),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // The background is pure white
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Your Logo (Make sure the path matches your pubspec.yaml)
            Image.asset('assets/images/thryve_logo.jpeg', width: 50),
            const SizedBox(height: 24),
            // Tagline in Baby Pink
            Text(
              'Unifying Maternal Recovery',
              style: TextStyle(
                fontSize: 16,
                color: Theme.of(context).colorScheme.secondary, // Baby Pink
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Temporary placeholder for the next screen
class PlaceholderHomeScreen extends StatelessWidget {
  const PlaceholderHomeScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text("Onboarding Screen Starts Here")),
    );
  }
}
