import 'package:flutter/material.dart';

import 'api_service.dart';
import 'signup_step_one.dart';
import 'facility_linkage_screen.dart';
import 'widgets/app_toast.dart';

class SignUpStepTwoScreen extends StatefulWidget {
  final SignUpData signUpData;

  const SignUpStepTwoScreen({super.key, required this.signUpData});

  @override
  State<SignUpStepTwoScreen> createState() => _SignUpStepTwoScreenState();
}

class _SignUpStepTwoScreenState extends State<SignUpStepTwoScreen> {
  final _formKey = GlobalKey<FormState>();
  final _ghanaCardController = TextEditingController();
  final _nhisIdController = TextEditingController();
  final _heightController = TextEditingController();
  final _weightController = TextEditingController();
  final _homeAddressController = TextEditingController();
  final _apiService = ApiService();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _ghanaCardController.dispose();
    _nhisIdController.dispose();
    _heightController.dispose();
    _weightController.dispose();
    _homeAddressController.dispose();
    super.dispose();
  }

  Future<void> _onSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    FocusScope.of(context).unfocus();

    setState(() {
      _isSubmitting = true;
    });

    try {
      await _apiService.registerUser(
        signUpData: widget.signUpData,
        ghanaCardId: _ghanaCardController.text.trim(),
        nhisId: _nhisIdController.text.trim(),
        heightCm: _heightController.text.trim(),
        weightKg: _weightController.text.trim(),
        homeAddress: _homeAddressController.text.trim(),
      );

      if (!mounted) return;
      showAppToast('Sign up successful. Let’s link your facility next.');

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => const FacilityLinkageScreen(),
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      showAppToast(e.message);
    } catch (_) {
      if (!mounted) return;
      showAppToast('Something went wrong. Please try again.');
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  InputDecoration _fieldDecoration(String label, {String? hint}) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      filled: true,
      fillColor: Colors.grey.shade100,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide.none,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const Spacer(),
                  Text(
                    'Step 2 of 2',
                    style: TextStyle(
                      color: Colors.grey.shade700,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: 1.0,
                  minHeight: 4,
                  backgroundColor: Colors.grey.shade200,
                  valueColor:
                      AlwaysStoppedAnimation<Color>(colorScheme.primary),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Verify Your Details',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'We use your Ghana Card and body measurements to keep your care personalised and secure.',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade700,
                ),
              ),
              const SizedBox(height: 24),
              Expanded(
                child: SingleChildScrollView(
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Ghana Card ID',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _ghanaCardController,
                          keyboardType: TextInputType.text,
                          decoration: _fieldDecoration(
                            'GHA-000000000-0',
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your Ghana Card ID';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Type the ID exactly as it appears on your Ghana Card (e.g. GHA-XXXXXXXXX-X).',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'NHIS number',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _nhisIdController,
                          keyboardType: TextInputType.text,
                          decoration: _fieldDecoration(
                            'National Health Insurance ID',
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your NHIS number';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Enter the number on your NHIS card. Staff may verify it when you link your facility.',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'Height (cm)',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _heightController,
                          keyboardType:
                              const TextInputType.numberWithOptions(decimal: true),
                          decoration: _fieldDecoration('Enter your height'),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your height';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Weight (kg)',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _weightController,
                          keyboardType:
                              const TextInputType.numberWithOptions(decimal: true),
                          decoration: _fieldDecoration('Enter your weight'),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your weight';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'Home address (optional)',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _homeAddressController,
                          keyboardType: TextInputType.streetAddress,
                          textCapitalization: TextCapitalization.sentences,
                          maxLines: 3,
                          decoration: _fieldDecoration(
                            'Street, area, city',
                            hint:
                                'Only if you’re comfortable sharing — helps staff reach you for urgent alerts',
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Totally optional. We may use this only for severe red-flag follow-up.',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 32),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _isSubmitting ? null : _onSubmit,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: colorScheme.secondary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(24),
                              ),
                              padding: const EdgeInsets.symmetric(
                                vertical: 14,
                              ),
                            ),
                            child: _isSubmitting
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor:
                                          AlwaysStoppedAnimation<Color>(
                                        Colors.white,
                                      ),
                                    ),
                                  )
                                : const Text(
                                    'Finish',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

