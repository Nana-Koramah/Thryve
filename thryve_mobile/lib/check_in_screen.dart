import 'dart:io';

import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import 'check_in_service.dart';
import 'widgets/app_toast.dart';
import 'dashboard_screen.dart';
import 'smart_plate_screen.dart';

class CheckInScreen extends StatefulWidget {
  const CheckInScreen({super.key});

  @override
  State<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends State<CheckInScreen> {
  final Set<String> _selectedSymptoms = {};
  final TextEditingController _detailsController = TextEditingController();
  final TextEditingController _ppdTextController = TextEditingController();

  final List<_SymptomOption> _symptomOptions = const [
    _SymptomOption(id: 'heavy_bleeding', label: 'Heavy Bleeding', isSevere: true),
    _SymptomOption(id: 'severe_headache', label: 'Severe Headache', isSevere: true),
    _SymptomOption(id: 'blurred_vision', label: 'Blurred Vision', isSevere: true),
    _SymptomOption(id: 'extreme_pain', label: 'Extreme Pain', isSevere: true),
    _SymptomOption(id: 'high_fever', label: 'High Fever', isSevere: true),
    _SymptomOption(id: 'hard_to_breathe', label: 'Hard to Breathe', isSevere: true),
  ];

  final AudioRecorder _recorder = AudioRecorder();
  bool _isListening = false;
  String? _currentRecordingPath;
  String? _recordedAudioPath;
  bool _isSavingPpd = false;
  bool _isSendingReport = false;
  String _firstName = 'Mama';

  @override
  void initState() {
    super.initState();
    _loadFirstName();
  }

  Future<void> _loadFirstName() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return;

      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .get();
      final data = doc.data();
      final fullName = (data?['fullName'] as String?)?.trim();
      if (fullName == null || fullName.isEmpty) return;

      final parts = fullName.split(' ');
      final first = parts.isNotEmpty ? parts.first : fullName;

      if (mounted) {
        setState(() {
          _firstName = first;
        });
      }
    } catch (_) {
      // If anything fails, we silently keep the default "Mama".
    }
  }

  @override
  void dispose() {
    _detailsController.dispose();
    _ppdTextController.dispose();
    _recorder.dispose();
    super.dispose();
  }

  void _toggleSymptom(String id) {
    setState(() {
      if (_selectedSymptoms.contains(id)) {
        _selectedSymptoms.remove(id);
      } else {
        _selectedSymptoms.add(id);
      }
    });
  }

  Future<void> _onSendReport() async {
    if (_selectedSymptoms.isEmpty) {
      showAppToast('Please select at least one symptom.');
      return;
    }
    if (_isSendingReport) return;
    setState(() => _isSendingReport = true);
    try {
      final service = CheckInService();
      await service.submitRedFlagReport(
        symptomIds: _selectedSymptoms.toList(),
        additionalNotes: _detailsController.text.trim().isEmpty
            ? null
            : _detailsController.text.trim(),
      );
      if (mounted) {
        showAppToast('Report sent to your care team.');
      }
    } on CheckInException catch (e) {
      if (mounted) showAppToast(e.message);
    } catch (_) {
      if (mounted) showAppToast('Could not send report. Please try again.');
    } finally {
      if (mounted) setState(() => _isSendingReport = false);
    }
  }

  Future<void> _toggleListening() async {
    if (_isListening) {
      await _recorder.stop();
      setState(() {
        _recordedAudioPath = _currentRecordingPath;
        _currentRecordingPath = null;
        _isListening = false;
      });
      if (mounted) showAppToast('Recording saved. Tap Save and Exit when ready.');
      return;
    }
    final hasPermission = await _recorder.hasPermission();
    if (!hasPermission) {
      showAppToast('Microphone permission is needed to record.');
      return;
    }
    try {
      final dir = await getTemporaryDirectory();
      final path = '${dir.path}/ppd_${DateTime.now().millisecondsSinceEpoch}.m4a';
      await _recorder.start(const RecordConfig(encoder: AudioEncoder.aacLc), path: path);
      setState(() {
        _currentRecordingPath = path;
        _isListening = true;
      });
      if (mounted) showAppToast('Recording… tap the mic again to stop.');
    } catch (_) {
      if (mounted) showAppToast('Could not start recording. Please try again.');
    }
  }

  Future<void> _onSaveAndExit() async {
    final hasAudio = _recordedAudioPath != null &&
        (await File(_recordedAudioPath!).exists());
    final hasText = _ppdTextController.text.trim().isNotEmpty;
    if (!hasAudio && !hasText) {
      showAppToast('Record audio or type how you feel, then save.');
      return;
    }
    if (_isSavingPpd) return;
    setState(() => _isSavingPpd = true);
    try {
      final service = CheckInService();
      await service.submitPpdScreening(
        audioFile: hasAudio ? File(_recordedAudioPath!) : null,
        textSummary: hasText ? _ppdTextController.text.trim() : null,
      );
      if (mounted) {
        showAppToast('Your PPD check-in has been saved for your care team.');
        Navigator.of(context).maybePop();
      }
    } on CheckInException catch (e) {
      if (mounted) showAppToast(e.message);
    } catch (_) {
      if (mounted) showAppToast('Could not save. Please try again.');
    } finally {
      if (mounted) setState(() => _isSavingPpd = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FF),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF9A8D4),
        elevation: 0,
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
        centerTitle: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'PPD Screening',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey.shade900,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Take a quick audio check-in so your care team can understand how you\'re feeling emotionally.',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey.shade700,
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          radius: 14,
                          backgroundColor: const Color(0xFF89CFF0),
                          child: const Icon(
                            Icons.smart_toy_rounded,
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              'Hi $_firstName, I\'m here to check in on you. How have you been feeling lately? Are you getting enough rest?',
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Center(
                      child: Column(
                        children: [
                          const Text(
                            'I\'m listening…',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Take your time, Mama. I\'m here for as long as you need to talk.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade700,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE0F2FF),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.graphic_eq_rounded,
                                size: 40,
                                color: Color(0xFF89CFF0),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          GestureDetector(
                            onTap: _toggleListening,
                            child: CircleAvatar(
                              radius: 32,
                              backgroundColor: const Color(0xFF89CFF0),
                              child: Icon(
                                _isListening
                                    ? Icons.stop_rounded
                                    : Icons.mic_rounded,
                                color: Colors.white,
                                size: 30,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _isListening
                                ? 'Listening… tap to stop'
                                : 'Tap to speak',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade700,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Or type how you feel (optional)',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: _ppdTextController,
                            maxLines: 2,
                            decoration: InputDecoration(
                              hintText: 'Type your thoughts here…',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              contentPadding: const EdgeInsets.all(12),
                            ),
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton(
                              onPressed: _isSavingPpd ? null : _onSaveAndExit,
                              style: OutlinedButton.styleFrom(
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(24),
                                ),
                                padding:
                                    const EdgeInsets.symmetric(vertical: 12),
                              ),
                              child: _isSavingPpd
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Text('Save and Exit'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'Red Flag Report',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey.shade900,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Are you experiencing any of these?\nSelect all symptoms that apply. Help is available 24/7.',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey.shade700,
                ),
              ),
              const SizedBox(height: 16),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 3 / 2,
                ),
                itemCount: _symptomOptions.length,
                itemBuilder: (context, index) {
                  final option = _symptomOptions[index];
                  final isSelected = _selectedSymptoms.contains(option.id);
                  return _SymptomCard(
                    option: option,
                    isSelected: isSelected,
                    onTap: () => _toggleSymptom(option.id),
                  );
                },
              ),
              const SizedBox(height: 16),
              Text(
                'Additional Details',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade900,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: TextField(
                  controller: _detailsController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: 'Describe how you feel (optional)...',
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.all(16),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Icon(
                    Icons.location_on_rounded,
                    size: 18,
                    color: colorScheme.secondary,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Your location: Accra, Ghana',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSendingReport ? null : _onSendReport,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: colorScheme.secondary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: _isSendingReport
                      ? const SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Send Report to Care Team',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 1,
        selectedItemColor: colorScheme.secondary,
        unselectedItemColor: Colors.grey.shade500,
        type: BottomNavigationBarType.fixed,
        onTap: (index) {
          if (index == 1) return;
          if (index == 0) {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(
                builder: (_) => const DashboardScreen(),
              ),
              (route) => false,
            );
          } else if (index == 2) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(
                builder: (_) => const SmartPlateScreen(),
              ),
            );
          } else if (index == 3) {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(
                builder: (_) => const DashboardScreen(initialIndex: 3),
              ),
              (route) => false,
            );
          }
        },
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

class _SymptomOption {
  const _SymptomOption({
    required this.id,
    required this.label,
    required this.isSevere,
  });

  final String id;
  final String label;
  final bool isSevere;
}

class _SymptomCard extends StatelessWidget {
  const _SymptomCard({
    required this.option,
    required this.isSelected,
    required this.onTap,
  });

  final _SymptomOption option;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFFE5E9) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: isSelected
                  ? colorScheme.secondary
                  : colorScheme.secondary.withOpacity(0.12),
              child: Icon(
                Icons.warning_rounded,
                size: 18,
                color: isSelected ? Colors.white : colorScheme.secondary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              option.label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade900,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

