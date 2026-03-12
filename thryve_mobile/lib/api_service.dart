import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import 'signup_step_one.dart';

class ApiException implements Exception {
  final String message;

  ApiException(this.message);

  @override
  String toString() => 'ApiException: $message';
}

class ApiService {
  Future<void> registerUser({
    required SignUpData signUpData,
    required String ghanaCardId,
    required String heightCm,
    required String weightKg,
    File? ghanaCardImage,
  }) async {
    final auth = FirebaseAuth.instance;
    final firestore = FirebaseFirestore.instance;

    final trimmedEmail = signUpData.email?.trim() ?? '';
    final trimmedPhone = signUpData.phoneNumber.trim();

    // We allow sign up with email OR phone number. If there is no real email,
    // we create a synthetic email based on the phone so Firebase Auth can work.
    final loginIdentifier = trimmedEmail.isNotEmpty
        ? trimmedEmail
        : '$trimmedPhone@phone.thryve';

    try {
      final credential = await auth.createUserWithEmailAndPassword(
        email: loginIdentifier,
        password: signUpData.password.trim(),
      );

      final uid = credential.user?.uid;
      if (uid == null) {
        throw ApiException('Unable to complete sign up. Please try again.');
      }

      final now = FieldValue.serverTimestamp();

      await firestore.collection('users').doc(uid).set({
        'fullName': signUpData.fullName.trim(),
        'email': trimmedEmail,
        'phone': trimmedPhone,
        'ghanaCardId': ghanaCardId.trim(),
        'primaryLanguage': '',
        'dateOfBirth': '',
        'linkedFacilityId': null,
        'profilePhotoUrl': null,
        'role': 'mother',
        'age': signUpData.age,
        'postpartumDuration': signUpData.postpartumDuration.trim(),
        'heightCm': heightCm.trim(),
        'weightKg': weightKg.trim(),
        'createdAt': now,
        'updatedAt': now,
      });

      // Ghana card image upload will be added later when we wire Storage.
    } on FirebaseAuthException catch (e) {
      String message = 'Something went wrong. Please try again.';
      if (e.code == 'email-already-in-use') {
        message = 'An account already exists with these details.';
      } else if (e.code == 'weak-password') {
        message = 'Please choose a stronger password.';
      } else if (e.code == 'invalid-email') {
        message = 'Please check your email and try again.';
      }
      throw ApiException(message);
    } catch (e) {
      throw ApiException('Something went wrong. Please try again.');
    }
  }
}

