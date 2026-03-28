import 'package:flutter/material.dart';

import 'check_in_service.dart';
import 'widgets/app_toast.dart';

class EpdsQuestionnaireScreen extends StatefulWidget {
  const EpdsQuestionnaireScreen({super.key});

  @override
  State<EpdsQuestionnaireScreen> createState() =>
      _EpdsQuestionnaireScreenState();
}

class _EpdsQuestionnaireScreenState extends State<EpdsQuestionnaireScreen> {
  // 10 EPDS questions with 4 options each and score per option
  static const List<_EpdsQuestion> _questions = [
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
        _EpdsOption('Yes, sometimes I haven’t been coping as well as usual', 2),
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

  int _currentIndex = 0;
  final Map<String, int> _selectedScores = {};
  bool _isSubmitting = false;

  @override
  Widget build(BuildContext context) {
    final question = _questions[_currentIndex];
    final totalQuestions = _questions.length;
    final selectedScore = _selectedScores[question.id];
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FF),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF9A8D4),
        elevation: 0,
        title: const Text(
          'PPD Questionnaire',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Question ${_currentIndex + 1} of $totalQuestions',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
              ),
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: (_currentIndex + 1) / totalQuestions,
                backgroundColor: Colors.grey.shade200,
                color: colorScheme.secondary,
              ),
              const SizedBox(height: 16),
              Text(
                question.text,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade900,
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: ListView.separated(
                  itemCount: question.options.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final option = question.options[index];
                    final isSelected = selectedScore == option.score;
                    return InkWell(
                      onTap: () {
                        setState(() {
                          _selectedScores[question.id] = option.score;
                        });
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? const Color(0xFFFFE5E9)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected
                                ? colorScheme.secondary
                                : Colors.grey.shade200,
                          ),
                        ),
                        child: Row(
                          children: [
                            Radio<int>(
                              value: option.score,
                              groupValue: selectedScore,
                              activeColor: colorScheme.secondary,
                              onChanged: (_) {
                                setState(() {
                                  _selectedScores[question.id] = option.score;
                                });
                              },
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                option.text,
                                style: const TextStyle(fontSize: 14),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  if (_currentIndex > 0)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _isSubmitting ? null : _goPrevious,
                        style: OutlinedButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(24),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        child: const Text('Previous'),
                      ),
                    ),
                  if (_currentIndex > 0) const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _onPrimaryPressed,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: colorScheme.secondary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(24),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Text(
                              _currentIndex == totalQuestions - 1
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
      ),
    );
  }

  void _goPrevious() {
    if (_currentIndex == 0) return;
    setState(() {
      _currentIndex--;
    });
  }

  Future<void> _onPrimaryPressed() async {
    final question = _questions[_currentIndex];
    if (!_selectedScores.containsKey(question.id)) {
      showAppToast('Please choose an option to continue.');
      return;
    }

    if (_currentIndex < _questions.length - 1) {
      setState(() {
        _currentIndex++;
      });
      return;
    }

    // All questions answered, submit
    final totalScore = _selectedScores.values.fold<int>(
      0,
      (sum, value) => sum + value,
    );
    final riskLevel = _computeRiskLevel(totalScore);

    final answers = _questions.map((q) {
      final s = _selectedScores[q.id];
      return {
        'id': q.id,
        'text': q.text,
        'score': s,
        'selectedLabel': _selectedOptionLabelFor(q, s),
      };
    }).toList();

    setState(() {
      _isSubmitting = true;
    });

    try {
      final service = CheckInService();
      await service.submitEpdsResult(
        totalScore: totalScore,
        riskLevel: riskLevel,
        answers: answers,
      );
      if (mounted) {
        showAppToast('Your PPD questionnaire has been sent to your care team.');
        Navigator.of(context).pop();
      }
    } on CheckInException catch (e) {
      if (mounted) showAppToast(e.message);
    } catch (_) {
      if (mounted) {
        showAppToast('Could not submit. Please try again.');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  String _computeRiskLevel(int totalScore) {
    if (totalScore >= 13) return 'high';
    if (totalScore >= 10) return 'medium';
    return 'low';
  }

  /// Wording the patient actually tapped (for staff / TSA — score alone is ambiguous).
  String? _selectedOptionLabelFor(_EpdsQuestion q, int? score) {
    if (score == null) return null;
    for (final o in q.options) {
      if (o.score == score) return o.text;
    }
    return null;
  }
}

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
