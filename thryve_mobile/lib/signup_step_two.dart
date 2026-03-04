import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

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
  final _heightController = TextEditingController();
  final _weightController = TextEditingController();
  final _apiService = ApiService();
  File? _ghanaCardImage;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _ghanaCardController.dispose();
    _heightController.dispose();
    _weightController.dispose();
    super.dispose();
  }

  Future<void> _onScanCard() async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: ImageSource.camera,
      );

      if (pickedFile == null) return;

      setState(() {
        _ghanaCardImage = File(pickedFile.path);
      });
    } catch (e) {
      showAppToast('Unable to open camera. Please try again.');
    }
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
        heightCm: _heightController.text.trim(),
        weightKg: _weightController.text.trim(),
        ghanaCardImage: _ghanaCardImage,
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
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                controller: _ghanaCardController,
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
                            ),
                            const SizedBox(width: 8),
                            InkWell(
                              onTap: _onScanCard,
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: colorScheme.primary.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: _ghanaCardImage == null
                                    ? Icon(
                                        Icons.camera_alt_rounded,
                                        color: colorScheme.primary,
                                      )
                                    : ClipRRect(
                                        borderRadius:
                                            BorderRadius.circular(12),
                                        child: Image.file(
                                          _ghanaCardImage!,
                                          width: 32,
                                          height: 32,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(
                              Icons.info_outline,
                              size: 16,
                              color: colorScheme.primary,
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                'Scan your card for automatic data entry',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: colorScheme.primary,
                                ),
                              ),
                            ),
                          ],
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

