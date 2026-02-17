import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:thryve_mobile/main.dart';
import 'package:thryve_mobile/splash_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('Splash screen shows logo and navigates after delay', (
    WidgetTester tester,
  ) async {
    // 1. Build our app and trigger a frame.
    await tester.pumpWidget(const ThryveApp());

    // 2. Verify that the Splash Screen elements are present initially.
    expect(find.byType(SplashScreen), findsOneWidget);
    expect(find.text('Thryve'), findsOneWidget);

    // Check for the logo (it looks for an Image widget with the asset path)
    expect(find.byType(Image), findsOneWidget);

    // 3. Fast-forward time by 3 seconds to trigger the Timer.
    // We use pump() with a duration to simulate the passing of time.
    await tester.pump(const Duration(seconds: 3));

    // 4. Trigger the navigation transition (animation).
    await tester.pumpAndSettle();

    // 5. Verify that we have navigated to the Onboarding/Placeholder screen.
    expect(find.text('Onboarding Screen Starts Here'), findsOneWidget);
    expect(find.text('Thryve'), findsNothing); // Splash text should be gone
  });
}
