import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import 'widgets/app_toast.dart';
import 'dashboard_screen.dart';
import 'check_in_screen.dart';

class SmartPlateScreen extends StatefulWidget {
  const SmartPlateScreen({super.key});

  @override
  State<SmartPlateScreen> createState() => _SmartPlateScreenState();
}

class _SmartPlateScreenState extends State<SmartPlateScreen> {
  final List<MealIngredient> _ingredients = const [
    MealIngredient(
      id: 'plantain',
      name: 'Plantain',
      carbsGrams: 30,
      proteinGrams: 1.5,
      ironMg: 0.8,
      folateMcg: 20,
    ),
    MealIngredient(
      id: 'yam',
      name: 'Yam',
      carbsGrams: 27,
      proteinGrams: 2,
      ironMg: 0.5,
      folateMcg: 10,
    ),
    MealIngredient(
      id: 'beans',
      name: 'Beans',
      carbsGrams: 20,
      proteinGrams: 8,
      ironMg: 2.5,
      folateMcg: 80,
    ),
    MealIngredient(
      id: 'stew',
      name: 'Stew',
      carbsGrams: 5,
      proteinGrams: 3,
      ironMg: 1.2,
      folateMcg: 30,
    ),
    MealIngredient(
      id: 'leafy',
      name: 'Leafy Greens',
      carbsGrams: 4,
      proteinGrams: 2,
      ironMg: 2,
      folateMcg: 90,
    ),
  ];

  final Set<String> _selectedIngredientIds = {};
  File? _mealPhoto;
  bool _isSaving = false;

  static const double _dailyIronTargetMg = 15; // simple placeholder
  static const double _dailyFolateTargetMcg = 400;

  Future<void> _onCaptureMeal() async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(source: ImageSource.camera);
      if (picked == null) return;

      setState(() {
        _mealPhoto = File(picked.path);
      });
      showAppToast('Meal photo captured.');
    } catch (_) {
      showAppToast('Unable to open camera. Please try again.');
    }
  }

  void _onToggleIngredient(MealIngredient ingredient) {
    setState(() {
      if (_selectedIngredientIds.contains(ingredient.id)) {
        _selectedIngredientIds.remove(ingredient.id);
      } else {
        _selectedIngredientIds.add(ingredient.id);
      }
    });
  }

  Iterable<MealIngredient> get _selectedIngredients => _ingredients.where(
        (ingredient) => _selectedIngredientIds.contains(ingredient.id),
      );

  double get _totalProteinGrams =>
      _selectedIngredients.fold(0, (sum, item) => sum + item.proteinGrams);

  double get _totalIronMg =>
      _selectedIngredients.fold(0, (sum, item) => sum + item.ironMg);

  double get _totalFolateMcg =>
      _selectedIngredients.fold(0, (sum, item) => sum + item.folateMcg);

  double get _ironPercent =>
      ((_dailyIronTargetMg == 0 ? 0 : _totalIronMg / _dailyIronTargetMg)
              .clamp(0, 1))
          .toDouble();

  double get _folatePercent =>
      ((_dailyFolateTargetMcg == 0
                  ? 0
                  : _totalFolateMcg / _dailyFolateTargetMcg)
              .clamp(0, 1))
          .toDouble();

  Future<void> _onSaveMeal() async {
    if (_mealPhoto == null) {
      showAppToast('Please add a photo of your meal.');
      return;
    }

    if (_selectedIngredientIds.isEmpty) {
      showAppToast('Please select at least one ingredient.');
      return;
    }

    setState(() {
      _isSaving = true;
    });

    await Future<void>.delayed(const Duration(milliseconds: 700));

    if (!mounted) return;

    setState(() {
      _isSaving = false;
    });

    showAppToast('Meal logged. We\'ll use this to track your nutrition.');
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
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Building your postnatal plate',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey.shade700,
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: GestureDetector(
                  onTap: _onCaptureMeal,
                  child: Container(
                    width: 200,
                    height: 200,
                    decoration: BoxDecoration(
                      color: const Color(0xFF89CFF0),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: ClipOval(
                      child: _mealPhoto == null
                          ? Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.restaurant_rounded,
                                  size: 40,
                                  color: Colors.white,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Tap to add your meal',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'We\'ll help you track\nnutrition from it.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.9),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            )
                          : Image.file(
                              _mealPhoto!,
                              fit: BoxFit.cover,
                            ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Select what\'s on your plate',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey.shade900,
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 90,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemBuilder: (context, index) {
                    final ingredient = _ingredients[index];
                    final isSelected =
                        _selectedIngredientIds.contains(ingredient.id);

                    return _IngredientChip(
                      ingredient: ingredient,
                      isSelected: isSelected,
                      onTap: () => _onToggleIngredient(ingredient),
                    );
                  },
                  separatorBuilder: (context, index) => const SizedBox(width: 12),
                  itemCount: _ingredients.length,
                ),
              ),
              const SizedBox(height: 20),
              _NutrientCard(
                title: 'Iron Level',
                percentage: _ironPercent,
                currentLabel:
                    '${_totalIronMg.toStringAsFixed(1)} mg attained',
                goalLabel: '${_dailyIronTargetMg.toStringAsFixed(0)} mg goal',
                barColor: colorScheme.secondary,
              ),
              const SizedBox(height: 12),
              _NutrientCard(
                title: 'Folic Acid',
                percentage: _folatePercent,
                currentLabel:
                    '${_totalFolateMcg.toStringAsFixed(0)} mcg attained',
                goalLabel:
                    '${_dailyFolateTargetMcg.toStringAsFixed(0)} mcg goal',
                barColor: const Color(0xFF89CFF0),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _MiniStat(
                    label: 'Protein',
                    value: '${_totalProteinGrams.toStringAsFixed(1)} g',
                    icon: Icons.fitness_center_rounded,
                  ),
                  _MiniStat(
                    label: 'Iron',
                    value: '${_totalIronMg.toStringAsFixed(1)} mg',
                    icon: Icons.bloodtype_rounded,
                  ),
                  _MiniStat(
                    label: 'Folate',
                    value: '${_totalFolateMcg.toStringAsFixed(0)} mcg',
                    icon: Icons.local_florist_rounded,
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text(
                'Maternal Health Tip',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey.shade900,
                ),
              ),
              const SizedBox(height: 8),
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
                child: Text(
                  _selectedIngredientIds.contains('leafy')
                      ? 'Great choice adding leafy greens – they boost both iron and folate for recovery.'
                      : 'Try adding leafy greens or beans to your plate for an extra boost of iron and folate.',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade800,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _onSaveMeal,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: colorScheme.secondary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: _isSaving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Save Meal',
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
        currentIndex: 2,
        selectedItemColor: colorScheme.secondary,
        unselectedItemColor: Colors.grey.shade500,
        type: BottomNavigationBarType.fixed,
        onTap: (index) {
          if (index == 2) return;
          if (index == 0) {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(
                builder: (_) => const DashboardScreen(),
              ),
              (route) => false,
            );
          } else if (index == 1) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(
                builder: (_) => const CheckInScreen(),
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

class MealIngredient {
  const MealIngredient({
    required this.id,
    required this.name,
    required this.carbsGrams,
    required this.proteinGrams,
    required this.ironMg,
    required this.folateMcg,
  });

  final String id;
  final String name;
  final double carbsGrams;
  final double proteinGrams;
  final double ironMg;
  final double folateMcg;
}

class _IngredientChip extends StatelessWidget {
  const _IngredientChip({
    required this.ingredient,
    required this.isSelected,
    required this.onTap,
  });

  final MealIngredient ingredient;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFF89CFF0) : Colors.white,
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            alignment: Alignment.center,
            child: Text(
              ingredient.name[0],
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: isSelected ? Colors.white : Colors.grey.shade800,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            ingredient.name,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade800,
            ),
          ),
        ],
      ),
    );
  }
}

class _NutrientCard extends StatelessWidget {
  const _NutrientCard({
    required this.title,
    required this.percentage,
    required this.currentLabel,
    required this.goalLabel,
    required this.barColor,
  });

  final String title;
  final double percentage;
  final String currentLabel;
  final String goalLabel;
  final Color barColor;

  @override
  Widget build(BuildContext context) {
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
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey.shade900,
                ),
              ),
              Text(
                '${(percentage * 100).toStringAsFixed(0)}%',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: percentage,
              minHeight: 8,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(barColor),
            ),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                goalLabel,
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey.shade600,
                ),
              ),
              Text(
                currentLabel,
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey.shade800,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        CircleAvatar(
          radius: 16,
          backgroundColor: Colors.blue.shade50,
          child: Icon(
            icon,
            size: 18,
            color: Colors.blue.shade600,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }
}

