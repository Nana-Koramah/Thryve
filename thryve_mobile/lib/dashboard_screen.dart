import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';

import 'mother_profile.dart';
import 'edit_profile_screen.dart';
import 'widgets/app_toast.dart';
import 'smart_plate_screen.dart';
import 'check_in_screen.dart';
import 'facility_linkage_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, this.initialIndex = 0});

  final int initialIndex;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late int _selectedIndex;
  MotherProfile _motherProfile = const MotherProfile(
    fullName: 'Abena',
    email: 'abena@example.com',
    phoneNumber: '+233 24 123 4567',
    ghanaCardId: 'GHA-123456789-0',
    linkedHospitalName: 'Korle-Bu Teaching Hospital',
    primaryLanguage: 'Twi',
    dateOfBirth: '12th June 1995',
  );
  bool _isProfileLoading = true;

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.initialIndex;
    _loadProfile();
  }

  void _onNavTap(int index) {
    if (index == 1) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => const CheckInScreen(),
        ),
      );
      return;
    }

    if (index == 2) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => const SmartPlateScreen(),
        ),
      );
      return;
    }

    setState(() {
      _selectedIndex = index;
    });
  }

  void _onProfileUpdated(MotherProfile updatedProfile) {
    setState(() {
      _motherProfile = updatedProfile;
    });
  }

  Future<void> _loadProfile() async {
    try {
      final currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser == null) {
        setState(() {
          _isProfileLoading = false;
        });
        return;
      }

      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(currentUser.uid)
          .get();

      if (!doc.exists) {
        setState(() {
          _isProfileLoading = false;
        });
        return;
      }

      final data = doc.data() ?? {};

      final loaded = MotherProfile(
        fullName: (data['fullName'] ?? '') as String,
        email: (data['email'] ?? '') as String,
        phoneNumber: (data['phone'] ?? '') as String,
        ghanaCardId: (data['ghanaCardId'] ?? '') as String,
        linkedHospitalName: (data['linkedFacilityName'] ?? 'Not linked yet') as String,
        primaryLanguage: (data['primaryLanguage'] ?? '') as String,
        dateOfBirth: (data['dateOfBirth'] ?? '') as String,
        profilePhotoPath: (data['profilePhotoUrl'] ?? '') as String,
      );

      setState(() {
        _motherProfile = loaded;
        _isProfileLoading = false;
      });
    } catch (_) {
      setState(() {
        _isProfileLoading = false;
      });
      showAppToast('Unable to load your profile. Please try again later.');
    }
  }

  Future<void> _onChangeFacility() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const FacilityLinkageScreen(),
      ),
    );
    await _loadProfile();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFFF9A8D4),
        elevation: 0,
        centerTitle: false,
        automaticallyImplyLeading: false,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(
              'assets/images/thryve_logo.png',
              height: 28,
            ),
          ],
        ),
      ),
      backgroundColor: const Color(0xFFF8F9FF),
      body: SafeArea(
        child: IndexedStack(
          index: _selectedIndex,
          children: [
            _HomeTab(colorScheme: colorScheme),
            const _PlaceholderTab(title: 'Check-in'),
            const _PlaceholderTab(title: 'Meals'),
            _isProfileLoading
                ? const Center(
                    child: CircularProgressIndicator(),
                  )
                : _ProfileTab(
                    profile: _motherProfile,
                    onProfileUpdated: _onProfileUpdated,
                    onChangeFacility: _onChangeFacility,
                  ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onNavTap,
        selectedItemColor: colorScheme.secondary,
        unselectedItemColor: Colors.grey.shade500,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.favorite_border_rounded),
            label: 'Check-in',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.restaurant_menu_rounded),
            label: 'Meals',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  const _HomeTab({required this.colorScheme});

  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Your Daily Actions',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Colors.grey.shade900,
            ),
          ),
          const SizedBox(height: 12),
          _ActionCard(
            backgroundColor: const Color(0xFFE5F2FF),
            title: 'Postnatal Check-In',
            subtitle: 'Tap to track how your recovery is going today.',
            buttonLabel: 'Start Assessment',
            colorScheme: colorScheme,
            imageAsset: 'assets/images/postnatal_checkin.png',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const CheckInScreen(),
                ),
              );
            },
          ),
          const SizedBox(height: 12),
          _ActionCard(
            backgroundColor: const Color(0xFFFFF3E7),
            title: 'Log Your Meals',
            subtitle: 'Capture what you eat to see patterns over time.',
            buttonLabel: 'Add Meal',
            colorScheme: colorScheme,
            imageAsset: 'assets/images/meal_log.jpg',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const SmartPlateScreen(),
                ),
              );
            },
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Mood Pulse',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey.shade900,
                ),
              ),
              Text(
                'Updated 1h ago',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _MoodCard(colorScheme: colorScheme),
          const SizedBox(height: 24),
          Text(
            'Nutrition Progress',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Colors.grey.shade900,
            ),
          ),
          const SizedBox(height: 12),
          _NutritionRow(colorScheme: colorScheme),
          const SizedBox(height: 24),
          Text(
            'Health Tip',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Colors.grey.shade900,
            ),
          ),
          const SizedBox(height: 12),
          _HealthTipCard(colorScheme: colorScheme),
        ],
      ),
    );
  }
}

class _ProfileTab extends StatelessWidget {
  const _ProfileTab({
    required this.profile,
    required this.onProfileUpdated,
    required this.onChangeFacility,
  });

  final MotherProfile profile;
  final ValueChanged<MotherProfile> onProfileUpdated;
  final VoidCallback onChangeFacility;

  Future<void> _onChangePhoto(BuildContext context) async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(source: ImageSource.gallery);
      if (picked == null) return;

      final currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser == null) {
        showAppToast('Please sign in again to update your photo.');
        return;
      }

      final file = File(picked.path);
      final storageRef = FirebaseStorage.instance
          .ref()
          .child('users/${currentUser.uid}/profile_photo.jpg');

      await storageRef.putFile(file);
      final url = await storageRef.getDownloadURL();

      await FirebaseFirestore.instance
          .collection('users')
          .doc(currentUser.uid)
          .update({
        'profilePhotoUrl': url,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      final updated = profile.copyWith(profilePhotoPath: url);
      onProfileUpdated(updated);
      showAppToast('Profile photo updated.');
    } catch (_) {
      showAppToast('Unable to update profile photo. Please try again.');
    }
  }

  Future<void> _onEditProfile(BuildContext context) async {
    final updatedProfile = await Navigator.of(context).push<MotherProfile>(
      MaterialPageRoute(
        builder: (_) => EditProfileScreen(profile: profile),
      ),
    );

    if (updatedProfile != null) {
      onProfileUpdated(updatedProfile);
      showAppToast('Profile updated successfully.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Column(
              children: [
                Stack(
                  children: [
                    _ProfileAvatar(profile: profile),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: GestureDetector(
                        onTap: () => _onChangePhoto(context),
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Icon(
                            Icons.camera_alt_rounded,
                            size: 16,
                            color: colorScheme.secondary,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  profile.fullName,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    profile.ghanaCardId,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade800,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Personal Info',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey.shade900,
                ),
              ),
              Text(
                'Private',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                _ProfileInfoRow(
                  icon: Icons.cake_rounded,
                  label: 'Date of birth',
                  value: profile.dateOfBirth,
                ),
                const SizedBox(height: 12),
                _ProfileInfoRow(
                  icon: Icons.phone_rounded,
                  label: 'Phone Number',
                  value: profile.phoneNumber,
                ),
                const SizedBox(height: 12),
                _ProfileInfoRow(
                  icon: Icons.email_rounded,
                  label: 'Email',
                  value: profile.email,
                ),
                const SizedBox(height: 12),
                _ProfileInfoRow(
                  icon: Icons.language_rounded,
                  label: 'Primary Language',
                  value: profile.primaryLanguage,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Clinical Info',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Colors.grey.shade900,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                GestureDetector(
                  onTap: onChangeFacility,
                  child: _ProfileInfoRow(
                    icon: Icons.local_hospital_rounded,
                    label: 'Linked Facility',
                    value: profile.linkedHospitalName,
                  ),
                ),
                const SizedBox(height: 12),
                _ProfileInfoRow(
                  icon: Icons.info_outline_rounded,
                  label: 'Status',
                  value: 'Postnatal Phase',
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _onEditProfile(context),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(
                      color: colorScheme.secondary,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text(
                    'Edit Profile',
                    style: TextStyle(
                      color: colorScheme.secondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    showAppToast('Health record updates coming soon.');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: colorScheme.secondary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text(
                    'Update Health Record',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProfileAvatar extends StatelessWidget {
  const _ProfileAvatar({required this.profile});

  final MotherProfile profile;

  @override
  Widget build(BuildContext context) {
    final hasPhoto = profile.profilePhotoPath != null &&
        profile.profilePhotoPath!.isNotEmpty;

    if (hasPhoto) {
      final path = profile.profilePhotoPath!;
      // If the path looks like a URL, load from network; otherwise treat as local file.
      final isUrl = path.startsWith('http://') || path.startsWith('https://');

      return CircleAvatar(
        radius: 40,
        backgroundImage:
            isUrl ? NetworkImage(path) as ImageProvider : FileImage(File(path)),
      );
    }

    return CircleAvatar(
      radius: 40,
      backgroundColor: const Color(0xFFFFE5F0),
      child: Text(
        profile.fullName.isNotEmpty ? profile.fullName[0] : '?',
        style: const TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
    );
  }
}

class _ProfileInfoRow extends StatelessWidget {
  const _ProfileInfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.blue.shade50,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            icon,
            size: 18,
            color: Colors.blue.shade600,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.backgroundColor,
    required this.title,
    required this.subtitle,
    required this.buttonLabel,
    required this.colorScheme,
    required this.imageAsset,
    required this.onTap,
  });

  final Color backgroundColor;
  final String title;
  final String subtitle;
  final String buttonLabel;
  final ColorScheme colorScheme;
  final String imageAsset;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    subtitle,
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      buttonLabel,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: colorScheme.secondary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.asset(
                imageAsset,
                width: 72,
                height: 72,
                fit: BoxFit.cover,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MoodCard extends StatefulWidget {
  const _MoodCard({required this.colorScheme});

  final ColorScheme colorScheme;

  @override
  State<_MoodCard> createState() => _MoodCardState();
}

class _MoodCardState extends State<_MoodCard> {
  final List<double> _baseBars = [0.4, 0.7, 0.9, 0.6, 0.8, 0.5, 0.7];
  final List<String> _labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  String _selectedMood = 'Calm';
  late List<double> _currentBars = List<double>.from(_baseBars);

  void _onMoodSelected(String mood) {
    setState(() {
      _selectedMood = mood;
      switch (mood) {
        case 'Happy':
          _currentBars = [0.7, 0.8, 0.9, 0.85, 0.9, 0.75, 0.8];
          break;
        case 'Sad':
          _currentBars = [0.3, 0.4, 0.35, 0.3, 0.45, 0.4, 0.35];
          break;
        case 'Anxious':
          _currentBars = [0.5, 0.6, 0.4, 0.7, 0.5, 0.65, 0.55];
          break;
        default:
          _currentBars = List<double>.from(_baseBars);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = widget.colorScheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Today's Pulse",
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _selectedMood,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: colorScheme.secondary.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.favorite,
                  color: colorScheme.secondary,
                  size: 20,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _MoodIconChip(
                icon: Icons.sentiment_satisfied_alt_rounded,
                label: 'Happy',
                isSelected: _selectedMood == 'Happy',
                onTap: () => _onMoodSelected('Happy'),
              ),
              _MoodIconChip(
                icon: Icons.sentiment_dissatisfied_rounded,
                label: 'Sad',
                isSelected: _selectedMood == 'Sad',
                onTap: () => _onMoodSelected('Sad'),
              ),
              _MoodIconChip(
                icon: Icons.sentiment_very_dissatisfied_rounded,
                label: 'Anxious',
                isSelected: _selectedMood == 'Anxious',
                onTap: () => _onMoodSelected('Anxious'),
              ),
              _MoodIconChip(
                icon: Icons.self_improvement_rounded,
                label: 'Calm',
                isSelected: _selectedMood == 'Calm',
                onTap: () => _onMoodSelected('Calm'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 80,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(_currentBars.length, (index) {
                return Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Container(
                      width: 12,
                      height: 60 * _currentBars[index],
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(6),
                        gradient: LinearGradient(
                          colors: [
                            const Color(0xFFFFC8DD),
                            colorScheme.secondary,
                          ],
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _labels[index],
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

class _MoodIconChip extends StatelessWidget {
  const _MoodIconChip({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = isSelected ? Colors.pink.shade400 : Colors.grey.shade600;

    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFFFFE5F0) : Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              size: 20,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: isSelected ? Colors.black : Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }
}

class _NutritionRow extends StatelessWidget {
  const _NutritionRow({required this.colorScheme});

  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: const [
        _NutritionItem(
          label: 'Calories',
          value: '1,850',
          unit: 'kcal',
          icon: Icons.local_fire_department_rounded,
        ),
        _NutritionItem(
          label: 'Protein',
          value: '65',
          unit: 'g',
          icon: Icons.fitness_center_rounded,
        ),
        _NutritionItem(
          label: 'Hydration',
          value: '2.4',
          unit: 'L',
          icon: Icons.water_drop_rounded,
        ),
      ],
    );
  }
}

class _NutritionItem extends StatelessWidget {
  const _NutritionItem({
    required this.label,
    required this.value,
    required this.unit,
    required this.icon,
  });

  final String label;
  final String value;
  final String unit;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: colorScheme.secondary.withOpacity(0.12),
              child: Icon(icon, size: 18, color: colorScheme.secondary),
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            Text(
              unit,
              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
            ),
          ],
        ),
      ),
    );
  }
}

class _HealthTipCard extends StatelessWidget {
  const _HealthTipCard({required this.colorScheme});

  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.asset(
              'assets/images/health_tip.png',
              width: 64,
              height: 64,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Power of iron',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Iron-rich foods help restore your energy and support postpartum recovery.',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PlaceholderTab extends StatelessWidget {
  const _PlaceholderTab({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        '$title screen coming soon',
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
      ),
    );
  }
}
