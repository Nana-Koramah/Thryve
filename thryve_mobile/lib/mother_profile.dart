class MotherProfile {
  const MotherProfile({
    required this.fullName,
    required this.email,
    required this.phoneNumber,
    required this.ghanaCardId,
    required this.nhisId,
    required this.linkedHospitalName,
    required this.primaryLanguage,
    required this.dateOfBirth,
    this.homeAddress = '',
    this.profilePhotoPath,
  });

  final String fullName;
  final String email;
  final String phoneNumber;
  final String ghanaCardId;
  /// National Health Insurance Scheme ID — stored in Firestore as `NhisId`.
  final String nhisId;
  /// Optional home address for emergency / severe alert follow-up. Firestore: `homeAddress`.
  final String homeAddress;
  final String linkedHospitalName;
  final String primaryLanguage;
  final String dateOfBirth;
  final String? profilePhotoPath;

  MotherProfile copyWith({
    String? fullName,
    String? email,
    String? phoneNumber,
    String? ghanaCardId,
    String? nhisId,
    String? linkedHospitalName,
    String? primaryLanguage,
    String? dateOfBirth,
    String? homeAddress,
    String? profilePhotoPath,
  }) {
    return MotherProfile(
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      ghanaCardId: ghanaCardId ?? this.ghanaCardId,
      nhisId: nhisId ?? this.nhisId,
      linkedHospitalName: linkedHospitalName ?? this.linkedHospitalName,
      primaryLanguage: primaryLanguage ?? this.primaryLanguage,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      homeAddress: homeAddress ?? this.homeAddress,
      profilePhotoPath: profilePhotoPath ?? this.profilePhotoPath,
    );
  }
}

