import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

import 'nominatim_geocoding.dart';

enum HomeGeoSyncOutcome {
  /// Address cleared; coords removed.
  cleared,

  /// Nominatim returned coordinates.
  ok,

  /// Address present but not geocoded; stale coords cleared.
  failed,
}

/// Geocoding fields for `users/{uid}` — merge into a single [update] / [set].
///
/// [buildGeoPatch] never throws: Firestore can always receive `homeGeoStatus` etc.
class UserHomeGeoService {
  UserHomeGeoService._();

  static Future<({Map<String, dynamic> fields, HomeGeoSyncOutcome outcome})>
      _computeGeoPatch(String homeAddress) async {
    final trimmed = homeAddress.trim();
    final now = FieldValue.serverTimestamp();

    if (trimmed.isEmpty) {
      return (
        fields: <String, dynamic>{
          'homeLatitude': FieldValue.delete(),
          'homeLongitude': FieldValue.delete(),
          'homeGeoStatus': FieldValue.delete(),
          'homeGeoUpdatedAt': FieldValue.delete(),
          'homeGeoError': FieldValue.delete(),
        },
        outcome: HomeGeoSyncOutcome.cleared,
      );
    }

    final r = await NominatimGeocoding.geocodeAddressGhana(trimmed);
    if (r != null) {
      return (
        fields: <String, dynamic>{
          'homeLatitude': r.lat,
          'homeLongitude': r.lng,
          'homeGeoStatus': 'ok',
          'homeGeoUpdatedAt': now,
          'homeGeoError': FieldValue.delete(),
        },
        outcome: HomeGeoSyncOutcome.ok,
      );
    }

    return (
      fields: <String, dynamic>{
        'homeLatitude': FieldValue.delete(),
        'homeLongitude': FieldValue.delete(),
        'homeGeoStatus': 'failed',
        'homeGeoUpdatedAt': now,
        'homeGeoError':
            'Could not place this address on the map. Add area, city, or landmarks.',
      },
      outcome: HomeGeoSyncOutcome.failed,
    );
  }

  /// Patch fields only (no `updatedAt`). Never throws.
  static Future<({Map<String, dynamic> fields, HomeGeoSyncOutcome outcome})>
      buildGeoPatch(String homeAddress) async {
    try {
      final patch = await _computeGeoPatch(homeAddress);
      if (kDebugMode) {
        debugPrint(
          '[Thryve Geo] patch outcome=${patch.outcome} keys=${patch.fields.keys.toList()}',
        );
      }
      return patch;
    } catch (e, st) {
      if (kDebugMode) {
        debugPrint('[Thryve Geo] patch error: $e\n$st');
      }
      final now = FieldValue.serverTimestamp();
      return (
        fields: <String, dynamic>{
          'homeLatitude': FieldValue.delete(),
          'homeLongitude': FieldValue.delete(),
          'homeGeoStatus': 'failed',
          'homeGeoUpdatedAt': now,
          'homeGeoError':
              'Geocoding failed unexpectedly. Check internet and save again.',
        },
        outcome: HomeGeoSyncOutcome.failed,
      );
    }
  }

  /// Second write after profile — prefer [buildGeoPatch] merged into profile [update] instead.
  static Future<HomeGeoSyncOutcome> syncHomeCoordinates({
    required FirebaseFirestore firestore,
    required String uid,
    required String homeAddress,
  }) async {
    final patch = await buildGeoPatch(homeAddress);
    await firestore.collection('users').doc(uid).update({
      ...patch.fields,
      'updatedAt': FieldValue.serverTimestamp(),
    });
    return patch.outcome;
  }
}
