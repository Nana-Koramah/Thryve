import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import 'signup_step_one.dart';

class ApiException implements Exception {
  final String message;

  ApiException(this.message);

  @override
  String toString() => 'ApiException: $message';
}

class ApiService {
  ApiService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  // TODO: Replace with your real API base URL.
  static const String _baseUrl = 'https://your-api-base-url.com';

  Future<void> registerUser({
    required SignUpData signUpData,
    required String ghanaCardId,
    required String heightCm,
    required String weightKg,
    File? ghanaCardImage,
  }) async {
    final uri = Uri.parse('$_baseUrl/signup');

    http.Response response;

    final fields = <String, String>{
      'fullName': signUpData.fullName,
      'age': signUpData.age?.toString() ?? '',
      'phoneNumber': signUpData.phoneNumber,
      'email': signUpData.email ?? '',
      'postpartumDuration': signUpData.postpartumDuration,
      'password': signUpData.password,
      'ghanaCardId': ghanaCardId,
      'heightCm': heightCm,
      'weightKg': weightKg,
    };

    if (ghanaCardImage != null) {
      final request = http.MultipartRequest('POST', uri)
        ..fields.addAll(fields)
        ..files.add(
          await http.MultipartFile.fromPath(
            'ghanaCardImage',
            ghanaCardImage.path,
          ),
        );

      final streamed = await request.send();
      response = await http.Response.fromStream(streamed);
    } else {
      response = await _client.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(fields),
      );
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException('Failed to register. Status: ${response.statusCode}');
    }
  }
}
