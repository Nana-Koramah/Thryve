import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';

import 'smart_plate_screen.dart';

class MealService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  Future<void> logMeal({
    required File photo,
    required Iterable<MealIngredient> ingredients,
  }) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw MealException('You must be signed in to save a meal.');
    }

    final userDoc = await _firestore.collection('users').doc(user.uid).get();
    final data = userDoc.data();
    final facilityId = data?['linkedFacilityId'] as String?;
    final facilityName = data?['linkedFacilityName'] as String? ?? '';

    final mealDoc = _firestore.collection('meals').doc();
    final mealId = mealDoc.id;

    final ref = _storage
        .ref()
        .child('users')
        .child(user.uid)
        .child('meals')
        .child('$mealId.jpg');

    await ref.putFile(
      photo,
      SettableMetadata(contentType: 'image/jpeg'),
    );

    final imageUrl = await ref.getDownloadURL();
    final now = FieldValue.serverTimestamp();

    final ingredientsData = ingredients
        .map((i) => {
              'id': i.id,
              'name': i.name,
              'carbsGrams': i.carbsGrams,
              'proteinGrams': i.proteinGrams,
              'ironMg': i.ironMg,
              'folateMcg': i.folateMcg,
            })
        .toList();

    final totalCarbs =
        ingredients.fold<double>(0, (sum, i) => sum + i.carbsGrams);
    final totalProtein =
        ingredients.fold<double>(0, (sum, i) => sum + i.proteinGrams);
    final totalIron = ingredients.fold<double>(0, (sum, i) => sum + i.ironMg);
    final totalFolate =
        ingredients.fold<double>(0, (sum, i) => sum + i.folateMcg);

    await mealDoc.set({
      'userId': user.uid,
      'facilityId': facilityId,
      'facilityName': facilityName,
      'loggedAt': now,
      'imageUrl': imageUrl,
      'ingredients': ingredientsData,
      'nutrients': {
        'carbsGrams': totalCarbs,
        'proteinGrams': totalProtein,
        'ironMg': totalIron,
        'folateMcg': totalFolate,
      },
      'createdAt': now,
    });
  }
}

class MealException implements Exception {
  MealException(this.message);
  final String message;

  @override
  String toString() => 'MealException: $message';
}

