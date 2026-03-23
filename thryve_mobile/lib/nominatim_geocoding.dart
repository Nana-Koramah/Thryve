import 'dart:convert';

import 'package:http/http.dart' as http;

/// Forward geocoding via OpenStreetMap Nominatim (free; respect usage policy).
///
/// Use a dedicated instance or Google/Mapbox for high volume. See:
/// https://operations.osmfoundation.org/policies/nominatim/
class NominatimGeocoding {
  NominatimGeocoding._();

  /// Identifies your app to Nominatim (required). Change URL to your site/repo.
  static const String userAgent = 'ThryveMaternalHealth/1.0 (support@thryve.app)';

  /// Returns coordinates for a free-text address, biased to Ghana.
  static Future<({double lat, double lng})?> geocodeAddressGhana(
    String address,
  ) async {
    final trimmed = address.trim();
    if (trimmed.isEmpty) return null;

    final q = Uri.encodeComponent('$trimmed, Ghana');
    final uri = Uri.parse(
      'https://nominatim.openstreetmap.org/search?q=$q&format=json&limit=1&countrycodes=gh',
    );

    try {
      final res = await http
          .get(
            uri,
            headers: {'User-Agent': userAgent},
          )
          .timeout(const Duration(seconds: 18));

      if (res.statusCode != 200) return null;
      final decoded = json.decode(res.body);
      if (decoded is! List || decoded.isEmpty) return null;
      final first = decoded.first;
      if (first is! Map<String, dynamic>) return null;
      final lat = double.tryParse('${first['lat']}');
      final lng = double.tryParse('${first['lon']}');
      if (lat == null || lng == null) return null;
      return (lat: lat, lng: lng);
    } catch (_) {
      return null;
    }
  }
}
