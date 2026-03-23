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

  // EPDS / PPD state
  final TextEditingController _ppdTextController = TextEditingController();
  int _currentEpdsIndex = 0;
  final Map<String, int> _epdsSelectedScores = {};
  final Map<String, String> _epdsAnswerTexts = {};
  String _epdsLanguage = 'en'; // 'en', 'ga', 'tw'

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
  String? _currentRecordingQuestionId;
  final Map<String, String> _epdsAudioPaths = {};
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
      final savedPath = await _recorder.stop();
      setState(() {
        if (savedPath != null &&
            savedPath.isNotEmpty &&
            _currentRecordingQuestionId != null) {
          _epdsAudioPaths[_currentRecordingQuestionId!] = savedPath;
        }
        _currentRecordingQuestionId = null;
        _isListening = false;
      });
      if (mounted) {
        showAppToast('Recording saved for this question.');
      }
      return;
    }
    final hasPermission = await _recorder.hasPermission();
    if (!hasPermission) {
      showAppToast('Microphone permission is needed to record.');
      return;
    }
    try {
      final questionId = _epdsQuestions[_currentEpdsIndex].id;
      final dir = await getTemporaryDirectory();
      final path =
          '${dir.path}/ppd_${questionId}_${DateTime.now().millisecondsSinceEpoch}.m4a';
      await _recorder.start(
        const RecordConfig(
          encoder: AudioEncoder.aacLc,
          bitRate: 128000,
          sampleRate: 44100,
          numChannels: 1,
        ),
        path: path,
      );
      setState(() {
        _currentRecordingQuestionId = questionId;
        _isListening = true;
      });
      if (mounted) showAppToast('Recording… tap the mic again to stop.');
    } catch (_) {
      if (mounted) showAppToast('Could not start recording. Please try again.');
    }
  }

  void _goToPreviousEpdsQuestion() {
    if (_currentEpdsIndex == 0) return;
    // Persist current text before moving back
    final currentQuestion = _epdsQuestions[_currentEpdsIndex];
    _epdsAnswerTexts[currentQuestion.id] = _ppdTextController.text.trim();
    setState(() {
      _currentEpdsIndex--;
      final previousQuestion = _epdsQuestions[_currentEpdsIndex];
      _ppdTextController.text =
          _epdsAnswerTexts[previousQuestion.id] ?? '';
    });
  }

  Future<void> _onEpdsPrimaryPressed() async {
    final currentQuestion = _epdsQuestions[_currentEpdsIndex];
    final selectedScore = _epdsSelectedScores[currentQuestion.id];
    if (selectedScore == null) {
      showAppToast('Please choose an option to continue.');
      return;
    }

    // Persist current text for this question
    _epdsAnswerTexts[currentQuestion.id] = _ppdTextController.text.trim();

    // Move to next question if not at the end
    if (_currentEpdsIndex < _epdsQuestions.length - 1) {
      setState(() {
        _currentEpdsIndex++;
        final nextQuestion = _epdsQuestions[_currentEpdsIndex];
        _ppdTextController.text =
            _epdsAnswerTexts[nextQuestion.id] ?? '';
      });
      return;
    }

    // All questions answered, submit full screening
    if (_isSavingPpd) return;
    // Ensure any active recording is finalized before collecting audio files.
    if (_isListening) {
      await _toggleListening();
    }
    setState(() => _isSavingPpd = true);

    try {
      final totalScore = _epdsSelectedScores.values.fold<int>(
        0,
        (sum, value) => sum + value,
      );
      final riskLevel = _computeRiskLevel(totalScore);

      final answers = _epdsQuestions
          .map((q) => {
                'id': q.id,
                'text': _localizedEpdsText(q.id, _epdsLanguage),
                'score': _epdsSelectedScores[q.id],
                'answerText': _epdsAnswerTexts[q.id],
                'selectedLabel': _epdsAnswerSelectedLabel(
                  q,
                  _epdsSelectedScores[q.id],
                  _epdsLanguage,
                ),
              })
          .toList();

      // Build per-question audio file map.
      final Map<String, File> questionAudioFiles = {};
      for (final entry in _epdsAudioPaths.entries) {
        final file = File(entry.value);
        if (await file.exists()) {
          final bytes = await file.length();
          // Ignore empty/near-empty captures (often mic permission/device glitches).
          if (bytes < 1024) continue;
          questionAudioFiles[entry.key] = file;
        }
      }

      // Optional combined text summary from all answers
      final summaryBuffer = StringBuffer();
      for (final q in _epdsQuestions) {
        final text = _epdsAnswerTexts[q.id];
        if (text != null && text.trim().isNotEmpty) {
          summaryBuffer.writeln('${q.id}: $text');
        }
      }
      final summary = summaryBuffer.toString().trim().isEmpty
          ? null
          : summaryBuffer.toString().trim();

      final service = CheckInService();
      await service.submitEpdsResult(
        totalScore: totalScore,
        riskLevel: riskLevel,
        answers: answers,
        questionAudioFiles:
            questionAudioFiles.isEmpty ? null : questionAudioFiles,
        languageOverride: _epdsLanguage,
        textSummary: summary,
      );

      if (mounted) {
        showAppToast(
          'Your PPD questionnaire has been sent to your care team.',
        );
        Navigator.of(context).maybePop();
      }
    } on CheckInException catch (e) {
      if (mounted) showAppToast(e.message);
    } catch (_) {
      if (mounted) {
        showAppToast('Could not save. Please try again.');
      }
    } finally {
      if (mounted) setState(() => _isSavingPpd = false);
    }
  }

  String _computeRiskLevel(int totalScore) {
    if (totalScore >= 13) return 'high';
    if (totalScore >= 10) return 'medium';
    return 'low';
  }

  String _greetingForLanguage(String firstName) {
    switch (_epdsLanguage) {
      case 'ga':
        return 'Hi $firstName, mii shwɛ wɔso. Yɛre yɛ tsɔɔ kɛ ha shishi gbɛkɛ. Fa nɔ ni etsɔɔ ehi EPDS nsɛmmɔ neŋ kpɔŋkpɔŋ, fa yɛyɛ lɛ lɛ mli, na bo lɛ hiɛ kɛɛ ɔheŋfoɔ tsɔɔ lɛŋɔ ni lɛ. Tsɔɔ mi anyɔ anyɔ gbɛ gbɛ, bo lɛ niŋ afɔ nɛɛ lɛ. Yɛwɔ adwumayɛfoɔ a wɔte Ghana kasa akɛse akɛse ha.';
      case 'tw':
        return 'Hi $firstName, mewɔ ha sɛ mɛhwɛ wo so kakra. Mesrɛ wo, fa EPDS nsɛmmisa yi mu kɔ pi so na ka biribiara a wopɛ, na fa kasamu kɔɔmu anaa kasamu tenten. Tumi fa kasaa biara a wopɛ – yɛwɔ adwumayɛfo a wɔte Ghana kasa ahodoɔ mu.';
      default:
        return 'Hi $firstName, I\'m here to check in on you. Please go through these questions as expressively as you can. Feel free to use the audio and speak in any language you want. We have officials well-versed in Ghanaian languages to attend to you.';
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
                              _greetingForLanguage(_firstName),
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
                          const SizedBox(height: 16),
                          // Language selector + EPDS question
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Question ${_currentEpdsIndex + 1} of ${_epdsQuestions.length}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade700,
                                ),
                              ),
                              DropdownButton<String>(
                                value: _epdsLanguage,
                                underline: const SizedBox.shrink(),
                                items: const [
                                  DropdownMenuItem(
                                    value: 'en',
                                    child: Text('English'),
                                  ),
                                  DropdownMenuItem(
                                    value: 'ga',
                                    child: Text('Ga'),
                                  ),
                                  DropdownMenuItem(
                                    value: 'tw',
                                    child: Text('Twi'),
                                  ),
                                ],
                                onChanged: (value) {
                                  if (value == null) return;
                                  setState(() {
                                    _epdsLanguage = value;
                                  });
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              _localizedEpdsText(
                                _epdsQuestions[_currentEpdsIndex].id,
                                _epdsLanguage,
                              ),
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          // EPDS options
                          Column(
                            children: _epdsQuestions[_currentEpdsIndex]
                                .options
                                .map(
                                  (option) => _EpdsOptionTile(
                                    questionId:
                                        _epdsQuestions[_currentEpdsIndex].id,
                                    option: option,
                                    groupValue: _epdsSelectedScores[
                                        _epdsQuestions[_currentEpdsIndex].id],
                                    language: _epdsLanguage,
                                    onChanged: (score) {
                                      setState(() {
                                        _epdsSelectedScores[
                                                _epdsQuestions[_currentEpdsIndex]
                                                    .id] =
                                            score;
                                      });
                                    },
                                  ),
                                )
                                .toList(),
                          ),
                          const SizedBox(height: 16),
                          // Shared audio recording for the whole screening
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE0F2FF),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Center(
                              child: GestureDetector(
                                onTap: _toggleListening,
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.graphic_eq_rounded,
                                      size: 40,
                                      color: Color(0xFF89CFF0),
                                    ),
                                    const SizedBox(height: 12),
                                    CircleAvatar(
                                      radius: 28,
                                      backgroundColor:
                                          const Color(0xFF89CFF0),
                                      child: Icon(
                                        _isListening
                                            ? Icons.stop_rounded
                                            : Icons.mic_rounded,
                                        color: Colors.white,
                                        size: 26,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      _isListening
                                          ? 'Listening… tap to stop'
                                          : 'Tap to speak',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey.shade700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Or type your answer (optional)',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: _ppdTextController,
                            maxLines: 3,
                            decoration: InputDecoration(
                              hintText: 'Type your answer here…',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              contentPadding: const EdgeInsets.all(12),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              if (_currentEpdsIndex > 0)
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: _isSavingPpd
                                        ? null
                                        : () {
                                            _goToPreviousEpdsQuestion();
                                          },
                                    style: OutlinedButton.styleFrom(
                                      shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(24),
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 12,
                                      ),
                                    ),
                                    child: const Text('Previous'),
                                  ),
                                ),
                              if (_currentEpdsIndex > 0)
                                const SizedBox(width: 12),
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: _isSavingPpd
                                      ? null
                                      : () {
                                          _onEpdsPrimaryPressed();
                                        },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor:
                                        Theme.of(context).colorScheme.secondary,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(24),
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 12,
                                    ),
                                  ),
                                  child: _isSavingPpd
                                      ? const SizedBox(
                                          height: 20,
                                          width: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : Text(
                                          _currentEpdsIndex ==
                                                  _epdsQuestions.length - 1
                                              ? 'Submit screening'
                                              : 'Next',
                                        ),
                                ),
                              ),
                            ],
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

// EPDS question/option models reused for the in-card questionnaire.
class _EpdsQuestion {
  const _EpdsQuestion({
    required this.id,
    required this.text,
    required this.options,
  });

  final String id;
  final String text;
  final List<_EpdsOption> options;
}

class _EpdsOption {
  const _EpdsOption(this.text, this.score);

  final String text;
  final int score;
}

String _localizedEpdsText(String id, String language) {
  final byId = _epdsQuestionTranslations[id];
  if (byId == null) {
    final fallback =
        _epdsQuestions.firstWhere((q) => q.id == id, orElse: () => _epdsQuestions.first);
    return fallback.text;
  }
  return byId[language] ?? byId['en']!;
}

const Map<String, Map<String, String>> _epdsQuestionTranslations = {
  'q1': {
    'en':
        'In the past 7 days, I have been able to laugh and see the funny side of things…',
    'ga':
        'Niiŋ le, juma kɛ lɛ lɛ̃ lɛ, mɔni 7 da lɛ, miwɔ yɛ dɛ kɛ mihee shishi hewalɔ lɛ…',
    'tw':
        'Ndɔnhweemu 7 a atwa mu yi mu, metumi asere na mahu nneɛma ho anigye sɛnea ɛtɔ da no…',
  },
  'q2': {
    'en':
        'In the past 7 days, I have looked forward with enjoyment to things…',
    'ga':
        'Niiŋ le 7 da lɛ mli, miwɔ anigyesɛm kɛ mihe nɔ ni ebɛba enyɛɛ…',
    'tw':
        'Ndɔnhweemu 7 a atwa mu yi mu, mahu nneɛma a merehwɛ anim akɔ so anigye mu…',
  },
  'q3': {
    'en':
        'In the past 7 days, I have blamed myself unnecessarily when things went wrong…',
    'ga':
        'Niiŋ le 7 da lɛ mli, tsɔŋŋyii jiyaa mi lɛ hen ni eba nɔ ni ebaa mɔ ko…',
    'tw':
        'Ndɔnhweemu 7 a atwa mu yi mu, mabɔ me ho sobo a ehia adwene pii bere a nneɛma kɔɔ kwa…',
  },
  'q4': {
    'en':
        'In the past 7 days, I have been anxious or worried for no good reason…',
    'ga':
        'Niiŋ le 7 da lɛ mli, mihuu ni mihewɔ kɛ miyaatsɔɔ shi hewalɔ mli, ntsumɔ ni ohewalɛ…',
    'tw':
        'Ndɔnhweemu 7 a atwa mu yi mu, mebrɛɛ ne ahokyere mu a minhuu aduanekorɔ deɛ ɛma no…',
  },
  'q5': {
    'en':
        'In the past 7 days, I have felt scared or panicky for no very good reason…',
    'ga':
        'Niiŋ le 7 da lɛ mli, mihuu sukuu kɛ huuhuu mli, ntsumɔ ni ohia kɛse…',
    'tw':
        'Ndɔnhweemu 7 a atwa mu yi mu, mehuu hu anaa m’ani gyigyee me, nanso minhuu adeɛ kɛse bi…',
  },
  'q6': {
    'en': 'In the past 7 days, things have been getting on top of me…',
    'ga':
        'Niiŋ le 7 da lɛ mli, asɛm kɛ adwuma akɛse akɛse jiyaa mi lɛ shishi mli…',
    'tw':
        'Ndɔnhweemu 7 a atwa mu yi mu, nneɛma atɔ so me so den na mesuro sɛ merentumi nnhyia wɔn…',
  },
  'q7': {
    'en':
        'In the past 7 days, I have been so unhappy that I have had difficulty sleeping…',
    'ga':
        'Niiŋ le 7 da lɛ mli, mihuu ni miyaa mli kɛ oyaa kɛɛ miantumi ndaa yie…',
    'tw':
        'Ndɔnhweemu 7 a atwa mu yi mu, meyɛɛ awerɛhow sen na ɛyɛɛ me den paa sɛ memeda…',
  },
  'q8': {
    'en': 'In the past 7 days, I have felt sad or miserable…',
    'ga': 'Niiŋ le 7 da lɛ mli, miyaa mli kɛ owulaa mi lɛ…',
    'tw': 'Ndɔnhweemu 7 a atwa mu yi mu, mayɛɛ awerɛhow anaa adwemmɔne mu…',
  },
  'q9': {
    'en':
        'In the past 7 days, I have been so unhappy that I have been crying…',
    'ga':
        'Niiŋ le 7 da lɛ mli, miyaa mli kɛse shishi lɛ, na miwoo sukuu kɛ miyee asu…',
    'tw':
        'Ndɔnhweemu 7 a atwa mu yi mu, mayɛɛ awerɛhow pii ma ɛmaa mesu maa me ani gyei…',
  },
  'q10': {
    'en':
        'In the past 7 days, the thought of harming myself has occurred to me…',
    'ga':
        'Niiŋ le 7 da lɛ mli, adwene aba me so sɛ mibɛyɛ biribi bɔne ato me ho so…',
    'tw':
        'Ndɔnhweemu 7 a atwa mu yi mu, adwene aba me tirim sɛ metumi asɛe me ho anaa mayɛ me ho bɔne…',
  },
};

String _localizedEpdsOptionText(
  String questionId,
  String englishText,
  String language,
) {
  if (language == 'en') return '';
  final byQuestion = _epdsOptionTranslations[questionId];
  if (byQuestion == null) return '';
  final byEnglish = byQuestion[englishText];
  if (byEnglish == null) return '';
  return byEnglish[language] ?? '';
}

/// Text of the option the patient chose (for TSA). English + local line when applicable.
String _epdsAnswerSelectedLabel(_EpdsQuestion q, int? score, String language) {
  if (score == null) return '';
  for (final o in q.options) {
    if (o.score != score) continue;
    final en = o.text;
    if (language == 'en') return en;
    final loc = _localizedEpdsOptionText(q.id, en, language);
    if (loc.isNotEmpty) return '$loc — $en';
    return en;
  }
  return '';
}

const Map<String, Map<String, Map<String, String>>> _epdsOptionTranslations = {
  'q1': {
    'As much as I always could': {
      'ga': 'Sɛɛ kɛdaa, metsɔ anigye kɛ mihee shishi no.',
      'tw': 'Pɛpɛɛpɛ sɛnea na metumi yɛ daeɛ no.',
    },
    'Not quite so much now': {
      'ga': 'Kɛhewalɛ lɛ tsɔɔ mi lɛ kakraa sen kane.',
      'tw': 'Ɛnyɛ pɛpɛɛpɛ sɛnea na ɛte dada no.',
    },
    'Definitely not so much now': {
      'ga': 'Klarɔ, miher anigye no pii bio.',
      'tw': 'Pɛpɛɛpɛ, mensere anaa merennye no dodo bio.',
    },
    'Not at all': {
      'ga': 'Minsere anaa minhu hewalɔ mli koraa.',
      'tw': 'Koraa mpo, mensere na menhu anigye biara.',
    },
  },
  // For now we mirror q1’s style across others with lighter wording;
  // these can be refined with clinical input later.
};

// Static EPDS questions (English text for now).
const List<_EpdsQuestion> _epdsQuestions = [
  _EpdsQuestion(
    id: 'q1',
    text:
        'In the past 7 days, I have been able to laugh and see the funny side of things…',
    options: [
      _EpdsOption('As much as I always could', 0),
      _EpdsOption('Not quite so much now', 1),
      _EpdsOption('Definitely not so much now', 2),
      _EpdsOption('Not at all', 3),
    ],
  ),
  _EpdsQuestion(
    id: 'q2',
    text:
        'In the past 7 days, I have looked forward with enjoyment to things…',
    options: [
      _EpdsOption('As much as I ever did', 0),
      _EpdsOption('Rather less than I used to', 1),
      _EpdsOption('Definitely less than I used to', 2),
      _EpdsOption('Hardly at all', 3),
    ],
  ),
  _EpdsQuestion(
    id: 'q3',
    text:
        'In the past 7 days, I have blamed myself unnecessarily when things went wrong…',
    options: [
      _EpdsOption('Yes, most of the time', 3),
      _EpdsOption('Yes, some of the time', 2),
      _EpdsOption('Not very often', 1),
      _EpdsOption('No, never', 0),
    ],
  ),
  _EpdsQuestion(
    id: 'q4',
    text:
        'In the past 7 days, I have been anxious or worried for no good reason…',
    options: [
      _EpdsOption('No, not at all', 0),
      _EpdsOption('Hardly ever', 1),
      _EpdsOption('Yes, sometimes', 2),
      _EpdsOption('Yes, very often', 3),
    ],
  ),
  _EpdsQuestion(
    id: 'q5',
    text:
        'In the past 7 days, I have felt scared or panicky for no very good reason…',
    options: [
      _EpdsOption('Yes, quite a lot', 3),
      _EpdsOption('Yes, sometimes', 2),
      _EpdsOption('No, not much', 1),
      _EpdsOption('No, not at all', 0),
    ],
  ),
  _EpdsQuestion(
    id: 'q6',
    text: 'In the past 7 days, things have been getting on top of me…',
    options: [
      _EpdsOption(
        'Yes, most of the time I haven’t been able to cope at all',
        3,
      ),
      _EpdsOption(
        'Yes, sometimes I haven’t been coping as well as usual',
        2,
      ),
      _EpdsOption('No, most of the time I have coped quite well', 1),
      _EpdsOption('No, I have been coping as well as ever', 0),
    ],
  ),
  _EpdsQuestion(
    id: 'q7',
    text:
        'In the past 7 days, I have been so unhappy that I have had difficulty sleeping…',
    options: [
      _EpdsOption('Yes, most of the time', 3),
      _EpdsOption('Yes, sometimes', 2),
      _EpdsOption('Not very often', 1),
      _EpdsOption('No, not at all', 0),
    ],
  ),
  _EpdsQuestion(
    id: 'q8',
    text: 'In the past 7 days, I have felt sad or miserable…',
    options: [
      _EpdsOption('Yes, most of the time', 3),
      _EpdsOption('Yes, quite often', 2),
      _EpdsOption('Not very often', 1),
      _EpdsOption('No, not at all', 0),
    ],
  ),
  _EpdsQuestion(
    id: 'q9',
    text:
        'In the past 7 days, I have been so unhappy that I have been crying…',
    options: [
      _EpdsOption('Yes, most of the time', 3),
      _EpdsOption('Yes, quite often', 2),
      _EpdsOption('Only occasionally', 1),
      _EpdsOption('No, never', 0),
    ],
  ),
  _EpdsQuestion(
    id: 'q10',
    text:
        'In the past 7 days, the thought of harming myself has occurred to me…',
    options: [
      _EpdsOption('Yes, quite often', 3),
      _EpdsOption('Sometimes', 2),
      _EpdsOption('Hardly ever', 1),
      _EpdsOption('Never', 0),
    ],
  ),
];

class _EpdsOptionTile extends StatelessWidget {
  const _EpdsOptionTile({
    required this.questionId,
    required this.option,
    required this.groupValue,
    required this.language,
    required this.onChanged,
  });

  final String questionId;
  final _EpdsOption option;
  final int? groupValue;
  final String language;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isSelected = groupValue == option.score;
    final translated =
        language == 'en' ? null : _localizedEpdsOptionText(questionId, option.text, language);

    return InkWell(
      onTap: () => onChanged(option.score),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFFE5E9) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? colorScheme.secondary : Colors.grey.shade200,
          ),
        ),
        child: Row(
          children: [
            Radio<int>(
              value: option.score,
              groupValue: groupValue,
              activeColor: colorScheme.secondary,
              onChanged: (_) => onChanged(option.score),
            ),
            const SizedBox(width: 4),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    option.text,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                  if (translated != null && translated.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      translated,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
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

