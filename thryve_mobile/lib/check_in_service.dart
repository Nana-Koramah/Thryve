import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';

/// Handles PPD screening submissions (audio + text) and Red Flag / check-in reports.
class CheckInService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  /// Symptom IDs that are considered severe and trigger an alert to the facility.
  static const Set<String> severeSymptomIds = {
    'heavy_bleeding',
    'severe_headache',
    'blurred_vision',
    'extreme_pain',
    'high_fever',
    'hard_to_breathe',
  };

  /// Submits a PPD screening: uploads optional audio to Storage and creates a
  /// [ppdScreenings] document. [textSummary] is optional (e.g. from text chat).
  Future<void> submitPpdScreening({
    File? audioFile,
    String? textSummary,
  }) async {
    final user = _auth.currentUser;
    if (user == null) throw CheckInException('You must be signed in to submit.');

    final userDoc = await _firestore.collection('users').doc(user.uid).get();
    final data = userDoc.data();
    final facilityId = data?['linkedFacilityId'] as String?;
    final facilityName = data?['linkedFacilityName'] as String? ?? '';
    final language = data?['primaryLanguage'] as String? ?? '';

    String? audioUrl;
    if (audioFile != null && await audioFile.exists()) {
      final ref = _storage
          .ref()
          .child('users')
          .child(user.uid)
          .child('ppd')
          .child('${DateTime.now().millisecondsSinceEpoch}.m4a');
      await ref.putFile(
        audioFile,
        SettableMetadata(contentType: 'audio/mp4'),
      );
      audioUrl = await ref.getDownloadURL();
    }

    final now = FieldValue.serverTimestamp();
    await _firestore.collection('ppdScreenings').add({
      'userId': user.uid,
      'facilityId': facilityId,
      'facilityName': facilityName,
      'conductedAt': now,
      'totalScore': null,
      'answers': <String, dynamic>{},
      'riskLevel': 'pending',
      'language': language,
      'audioUrl': audioUrl,
      'textSummary': textSummary?.trim().isEmpty == true ? null : textSummary?.trim(),
      'createdAt': now,
    });
  }

  /// Submits a Red Flag report: creates a [checkIns] document and, if any
  /// selected symptom is severe, also creates an [alerts] document.
  Future<void> submitRedFlagReport({
    required List<String> symptomIds,
    String? additionalNotes,
  }) async {
    final user = _auth.currentUser;
    if (user == null) throw CheckInException('You must be signed in to report.');

    final userDoc = await _firestore.collection('users').doc(user.uid).get();
    final data = userDoc.data();
    final facilityId = data?['linkedFacilityId'] as String?;
    final facilityName = data?['linkedFacilityName'] as String? ?? '';
    final fullName = data?['fullName'] as String? ?? '';

    final now = FieldValue.serverTimestamp();
    final hasSevere = symptomIds.any(severeSymptomIds.contains);

    await _firestore.collection('checkIns').add({
      'userId': user.uid,
      'facilityId': facilityId,
      'facilityName': facilityName,
      'loggedAt': now,
      'symptoms': symptomIds,
      'severity': hasSevere ? 'severe' : 'moderate',
      'notes': additionalNotes?.trim().isEmpty == true ? null : additionalNotes?.trim(),
      'createdAt': now,
    });

    if (hasSevere && facilityId != null && facilityId.isNotEmpty) {
      await _firestore.collection('alerts').add({
        'userId': user.uid,
        'facilityId': facilityId,
        'source': 'check_in',
        'severity': 'high',
        'status': 'new',
        'summary': 'Mother reported severe symptom(s): ${symptomIds.join(", ")}',
        'payload': <String, dynamic>{
          'symptoms': symptomIds,
          'additionalNotes': additionalNotes?.trim(),
          'motherName': fullName,
        },
        'createdAt': now,
        'updatedAt': now,
      });
    }
  }
}

class CheckInException implements Exception {
  final String message;
  CheckInException(this.message);
  @override
  String toString() => 'CheckInException: $message';
}
