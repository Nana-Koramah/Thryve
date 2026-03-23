import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import 'mother_profile.dart';
import 'facility_linkage_screen.dart';
import 'user_home_geo_service.dart';
import 'widgets/app_toast.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({
    super.key,
    required this.profile,
  });

  final MotherProfile profile;

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  late final TextEditingController _phoneController;
  late final TextEditingController _ghanaCardController;
  late final TextEditingController _nhisIdController;
  late final TextEditingController _hospitalController;
  late final TextEditingController _primaryLanguageController;
  late final TextEditingController _dateOfBirthController;
  late final TextEditingController _homeAddressController;

  final List<String> _ghanaLanguages = const [
    'English',
    'Akan / Twi',
    'Ga',
    'Ewe',
    'Fante',
    'Hausa',
    'Dagbani',
    'Nzema',
    'Gonja',
    'Dagaare',
    'Kasem',
    'Other',
  ];

  String? _selectedLanguage;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.profile.fullName);
    _emailController = TextEditingController(text: widget.profile.email);
    _phoneController = TextEditingController(text: widget.profile.phoneNumber);
    _ghanaCardController = TextEditingController(text: widget.profile.ghanaCardId);
    _nhisIdController = TextEditingController(text: widget.profile.nhisId);
    _hospitalController =
        TextEditingController(text: widget.profile.linkedHospitalName);
    _primaryLanguageController =
        TextEditingController(text: widget.profile.primaryLanguage);
    _dateOfBirthController =
        TextEditingController(text: widget.profile.dateOfBirth);
    _homeAddressController =
        TextEditingController(text: widget.profile.homeAddress);

    if (widget.profile.primaryLanguage.isNotEmpty &&
        _ghanaLanguages.contains(widget.profile.primaryLanguage)) {
      _selectedLanguage = widget.profile.primaryLanguage;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _ghanaCardController.dispose();
    _nhisIdController.dispose();
    _hospitalController.dispose();
    _primaryLanguageController.dispose();
    _dateOfBirthController.dispose();
    _homeAddressController.dispose();
    super.dispose();
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
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    );
  }

  Future<void> _onSave() async {
    if (!_formKey.currentState!.validate()) return;

    final updatedProfile = widget.profile.copyWith(
      fullName: _nameController.text.trim(),
      email: _emailController.text.trim(),
      phoneNumber: _phoneController.text.trim(),
      ghanaCardId: _ghanaCardController.text.trim(),
      nhisId: _nhisIdController.text.trim(),
      linkedHospitalName: _hospitalController.text.trim(),
      primaryLanguage: _primaryLanguageController.text.trim(),
      dateOfBirth: _dateOfBirthController.text.trim(),
      homeAddress: _homeAddressController.text.trim(),
    );

    try {
      final currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser == null) {
        showAppToast('Please sign in again to save your profile.');
        return;
      }

      // One Firestore write: profile + geocode fields (always sets homeGeoStatus when relevant).
      final geoPatch = await UserHomeGeoService.buildGeoPatch(
        updatedProfile.homeAddress,
      );
      await FirebaseFirestore.instance
          .collection('users')
          .doc(currentUser.uid)
          .update({
        'fullName': updatedProfile.fullName,
        'email': updatedProfile.email,
        'phone': updatedProfile.phoneNumber,
        'ghanaCardId': updatedProfile.ghanaCardId,
        'NhisId': updatedProfile.nhisId,
        'primaryLanguage': updatedProfile.primaryLanguage,
        'dateOfBirth': updatedProfile.dateOfBirth,
        'homeAddress': updatedProfile.homeAddress,
        // Keep facility name in sync with whatever is linked in Facility Linkage.
        'linkedFacilityName': updatedProfile.linkedHospitalName,
        'updatedAt': FieldValue.serverTimestamp(),
        ...geoPatch.fields,
      });

      final geoOutcome = geoPatch.outcome;
      if (!mounted) return;
      if (geoOutcome == HomeGeoSyncOutcome.ok &&
          updatedProfile.homeAddress.isNotEmpty) {
        showAppToast(
          'Profile saved. Home location saved for the facility map.',
        );
      } else if (geoOutcome == HomeGeoSyncOutcome.failed &&
          updatedProfile.homeAddress.isNotEmpty) {
        showAppToast(
          'Profile saved. Map couldn’t find this address — check Firestore for homeGeoError, or add more detail.',
        );
      } else if (geoOutcome == HomeGeoSyncOutcome.cleared) {
        showAppToast('Profile saved. Home address removed from map.');
      }

      if (!mounted) return;
      Navigator.of(context).pop<MotherProfile>(updatedProfile);
    } catch (_) {
      showAppToast('Unable to save your profile. Please try again.');
    }
  }

  Future<void> _onChangeFacility() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const FacilityLinkageScreen(),
      ),
    );

    try {
      final currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser == null) return;

      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(currentUser.uid)
          .get();
      final data = doc.data() ?? {};
      final name = (data['linkedFacilityName'] ?? '') as String;

      if (!mounted) return;
      setState(() {
        _hospitalController.text = name.isEmpty ? 'Not linked yet' : name;
      });
      showAppToast('Facility updated.');
    } catch (_) {
      // Silent – facility linkage screen already handles its own toasts.
    }
  }

  Future<void> _pickDateOfBirth() async {
    final now = DateTime.now();
    final initial = DateTime(now.year - 25, now.month, now.day);

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1950),
      lastDate: now,
    );

    if (picked != null) {
      final formatted =
          '${picked.day.toString().padLeft(2, '0')}/${picked.month.toString().padLeft(2, '0')}/${picked.year}';
      setState(() {
        _dateOfBirthController.text = formatted;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: const Color(0xFFF9A8D4),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text(
          'Edit Profile',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Form(
            key: _formKey,
            child: ListView(
              children: [
                const SizedBox(height: 24),
                Text(
                  'Personal details',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Colors.grey.shade900,
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _nameController,
                  decoration: _fieldDecoration('Full Name'),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter your full name';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: _fieldDecoration('Email'),
                  validator: (value) {
                    final text = value?.trim() ?? '';
                    if (text.isEmpty) return 'Please enter your email';
                    if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(text)) {
                      return 'Please enter a valid email';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: _fieldDecoration('Phone Number'),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter your phone number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _homeAddressController,
                  keyboardType: TextInputType.streetAddress,
                  textCapitalization: TextCapitalization.sentences,
                  maxLines: 3,
                  decoration: _fieldDecoration(
                    'Home address (optional)',
                    hint: 'For urgent / severe alert follow-up only',
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Optional. Shared only with your linked facility if you choose to add it.',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Clinical details',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Colors.grey.shade900,
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _ghanaCardController,
                  decoration: _fieldDecoration('Ghana Card Number'),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter your Ghana Card number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _nhisIdController,
                  decoration: _fieldDecoration('NHIS number'),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter your NHIS number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _hospitalController,
                  readOnly: true,
                  decoration: _fieldDecoration('Linked Facility').copyWith(
                    suffixIcon: const Icon(Icons.chevron_right_rounded),
                  ),
                  onTap: _onChangeFacility,
                  validator: (_) => null,
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _selectedLanguage,
                  decoration: _fieldDecoration('Primary Language'),
                  items: _ghanaLanguages
                      .map(
                        (lang) => DropdownMenuItem<String>(
                          value: lang,
                          child: Text(lang),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedLanguage = value;
                      _primaryLanguageController.text = value ?? '';
                    });
                  },
                  validator: (value) {
                    if ((value ?? '').trim().isEmpty) {
                      return 'Please select your primary language';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _dateOfBirthController,
                  readOnly: true,
                  decoration: _fieldDecoration(
                    'Date of Birth',
                    hint: 'DD/MM/YYYY',
                  ).copyWith(
                    suffixIcon: const Icon(Icons.calendar_today_rounded),
                  ),
                  onTap: _pickDateOfBirth,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please select your date of birth';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _onSave,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: colorScheme.secondary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text(
                      'Save',
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
    );
  }
}

