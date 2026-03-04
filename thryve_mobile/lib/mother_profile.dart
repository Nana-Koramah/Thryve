class MotherProfile {
  const MotherProfile({
    required this.fullName,
    required this.email,
    required this.phoneNumber,
    required this.ghanaCardId,
    required this.linkedHospitalName,
    required this.primaryLanguage,
    required this.dateOfBirth,
    this.profilePhotoPath,
  });

  final String fullName;
  final String email;
  final String phoneNumber;
  final String ghanaCardId;
  final String linkedHospitalName;
  final String primaryLanguage;
  final String dateOfBirth;
  final String? profilePhotoPath;

  MotherProfile copyWith({
    String? fullName,
    String? email,
    String? phoneNumber,
    String? ghanaCardId,
    String? linkedHospitalName,
    String? primaryLanguage,
    String? dateOfBirth,
    String? profilePhotoPath,
  }) {
    return MotherProfile(
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      ghanaCardId: ghanaCardId ?? this.ghanaCardId,
      linkedHospitalName: linkedHospitalName ?? this.linkedHospitalName,
      primaryLanguage: primaryLanguage ?? this.primaryLanguage,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      profilePhotoPath: profilePhotoPath ?? this.profilePhotoPath,
    );
  }
}

