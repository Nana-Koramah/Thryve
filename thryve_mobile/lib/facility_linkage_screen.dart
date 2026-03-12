import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import 'dashboard_screen.dart';
import 'widgets/app_toast.dart';

class FacilityLinkageScreen extends StatefulWidget {
  const FacilityLinkageScreen({super.key});

  @override
  State<FacilityLinkageScreen> createState() => _FacilityLinkageScreenState();
}

class _FacilityLinkageScreenState extends State<FacilityLinkageScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _facilityListController = ScrollController();

  final FacilityRepository _facilityRepository = FirestoreFacilityRepository();

  List<HealthFacility> _allFacilities = [];
  List<HealthFacility> _visibleFacilities = [];
  HealthFacility? _linkedFacility;
  HealthFacility? _highlightedFacility;

  bool _isLoading = true;
  bool _hasError = false;
  bool _isSavingLink = false;

  @override
  void initState() {
    super.initState();
    _loadFacilities();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    _facilityListController.dispose();
    super.dispose();
  }

  Future<void> _loadFacilities() async {
    try {
      final facilities = await _facilityRepository.fetchFacilities();

      // Check if the current user already has a linked facility
      HealthFacility? linked;
      try {
        final currentUser = FirebaseAuth.instance.currentUser;
        if (currentUser != null) {
          final userDoc = await FirebaseFirestore.instance
              .collection('users')
              .doc(currentUser.uid)
              .get();
          final data = userDoc.data();
          final linkedId = data?['linkedFacilityId'] as String?;

          if (linkedId != null) {
            for (final facility in facilities) {
              if (facility.id == linkedId) {
                linked = facility;
                break;
              }
            }
          }
        }
      } catch (_) {
        // If this lookup fails, we still show the facilities list;
        // the user can relink from this screen.
      }

      setState(() {
        _allFacilities = facilities;
        _visibleFacilities = facilities;
        _linkedFacility = linked;
        _isLoading = false;
      });
    } catch (_) {
      setState(() {
        _isLoading = false;
        _hasError = true;
      });
      showAppToast('Unable to load facilities. Please try again.');
    }
  }

  void _onSearchChanged() {
    final query = _searchController.text.trim().toLowerCase();
    if (query.isEmpty) {
      setState(() {
        _visibleFacilities = _allFacilities;
      });
      return;
    }

    setState(() {
      _visibleFacilities = _allFacilities.where((facility) {
        final nameMatch = facility.name.toLowerCase().contains(query);
        final addressMatch = facility.address.toLowerCase().contains(query);
        final regionMatch = facility.region.toLowerCase().contains(query);
        return nameMatch || addressMatch || regionMatch;
      }).toList();
    });
  }

  Future<void> _updateLinkedFacility({
    required String? facilityId,
    required String? facilityName,
  }) async {
    try {
      final currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser == null) {
        showAppToast('Please sign in again to link a facility.');
        return;
      }

      await FirebaseFirestore.instance
          .collection('users')
          .doc(currentUser.uid)
          .update({
        'linkedFacilityId': facilityId,
        'linkedFacilityName': facilityName ?? '',
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (_) {
      showAppToast('Unable to update your linked facility. Please try again.');
      rethrow;
    }
  }

  Future<void> _onLinkFacility(HealthFacility facility) async {
    if (_isSavingLink) return;

    setState(() {
      _isSavingLink = true;
    });

    try {
      await _updateLinkedFacility(
        facilityId: facility.id,
        facilityName: facility.name,
      );
      if (!mounted) return;
      setState(() {
        _linkedFacility = facility;
      });
      showAppToast('Facility linked successfully to ${facility.name}.');
    } catch (_) {
      // toast already shown in _updateLinkedFacility
    } finally {
      if (mounted) {
        setState(() {
          _isSavingLink = false;
        });
      }
    }
  }

  void _onHighlightFacility(HealthFacility facility) {
    setState(() {
      _highlightedFacility = facility;
    });

    final index = _visibleFacilities.indexWhere(
      (item) => item.id == facility.id,
    );

    if (index >= 0 && _facilityListController.hasClients) {
      _facilityListController.animateTo(
        index * 120,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _onSkip() async {
    if (_isSavingLink) return;

    setState(() {
      _isSavingLink = true;
    });

    try {
      await _updateLinkedFacility(facilityId: null, facilityName: null);
      if (!mounted) return;
      showAppToast(
        'You can link a facility anytime from your profile.',
      );

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const DashboardScreen()),
        (route) => false,
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSavingLink = false;
        });
      }
    }
  }

  void _onContinue() {
    if (_linkedFacility == null) {
      showAppToast('Please link a facility to continue.');
      return;
    }

    showAppToast('You\'re all set with ${_linkedFacility!.name}.');

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const DashboardScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FF),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => Navigator.of(context).maybePop(),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Facility Linkage',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                ],
              ),
            ),
            if (_linkedFacility != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _LinkedFacilityCard(
                  facility: _linkedFacility!,
                  colorScheme: colorScheme,
                ),
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _NoLinkedFacilityCard(colorScheme: colorScheme),
              ),
            const SizedBox(height: 16),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Find your Clinic',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Link with a GHS facility to share your postnatal progress and nutritional tracking with your healthcare provider.',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade700,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _SearchField(
                      controller: _searchController,
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Nearby Clinics',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Colors.grey.shade900,
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            // Scroll a bit further down so the map is visible.
                            Scrollable.ensureVisible(
                              _mapKey.currentContext!,
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeOut,
                            );
                          },
                          child: Text(
                            'View Map',
                            style: TextStyle(
                              color: colorScheme.secondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 260,
                      child: _buildFacilityList(colorScheme),
                    ),
                    const SizedBox(height: 24),
                    _GhanaMapSection(
                      key: _mapKey,
                      facilities: _allFacilities,
                      highlightedFacility: _highlightedFacility,
                      onFacilitySelected: _onHighlightFacility,
                      linkedFacility: _linkedFacility,
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed:
                          _isSavingLink || _linkedFacility == null ? null : _onContinue,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: colorScheme.secondary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(24),
                        ),
                        padding: const EdgeInsets.symmetric(
                          vertical: 14,
                        ),
                      ),
                      child: const Text(
                        'Continue',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: _isSavingLink ? null : _onSkip,
                    child: Text(
                      'Skip for now',
                      style: TextStyle(
                        color: Colors.grey.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFacilityList(ColorScheme colorScheme) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_hasError) {
      return Center(
        child: Text(
          'Could not load facilities.',
          style: TextStyle(
            color: Colors.grey.shade700,
          ),
        ),
      );
    }

    if (_visibleFacilities.isEmpty) {
      return Center(
        child: Text(
          'No facilities found. Try a different search.',
          style: TextStyle(
            color: Colors.grey.shade700,
          ),
          textAlign: TextAlign.center,
        ),
      );
    }

    return ListView.separated(
      controller: _facilityListController,
      scrollDirection: Axis.horizontal,
      itemBuilder: (context, index) {
        final facility = _visibleFacilities[index];
        final isLinked = _linkedFacility?.id == facility.id;
        final isHighlighted = _highlightedFacility?.id == facility.id;

        return _FacilityCard(
          facility: facility,
          isLinked: isLinked,
          isHighlighted: isHighlighted,
          colorScheme: colorScheme,
          onLinkPressed: _isSavingLink ? null : () => _onLinkFacility(facility),
          onTap: () => _onHighlightFacility(facility),
        );
      },
      separatorBuilder: (context, index) => const SizedBox(width: 12),
      itemCount: _visibleFacilities.length,
    );
  }
}

final GlobalKey _mapKey = GlobalKey();

class _SearchField extends StatelessWidget {
  const _SearchField({required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      decoration: InputDecoration(
        hintText: 'Search by facility name or location...',
        prefixIcon: const Icon(Icons.search_rounded),
        suffixIcon: controller.text.isEmpty
            ? null
            : IconButton(
                icon: const Icon(Icons.clear_rounded),
                onPressed: controller.clear,
              ),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide.none,
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
    );
  }
}

class _LinkedFacilityCard extends StatelessWidget {
  const _LinkedFacilityCard({
    required this.facility,
    required this.colorScheme,
  });

  final HealthFacility facility;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFE4EC),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.check_circle,
              color: colorScheme.secondary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Securely Linked',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Connected to ${facility.name}',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NoLinkedFacilityCard extends StatelessWidget {
  const _NoLinkedFacilityCard({required this.colorScheme});

  final ColorScheme colorScheme;

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
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: colorScheme.secondary.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.local_hospital_rounded,
              color: colorScheme.secondary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'No facility linked yet',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Link to your preferred GHS facility so your care team can follow your progress.',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FacilityCard extends StatelessWidget {
  const _FacilityCard({
    required this.facility,
    required this.isLinked,
    required this.isHighlighted,
    required this.colorScheme,
    required this.onLinkPressed,
    required this.onTap,
  });

  final HealthFacility facility;
  final bool isLinked;
  final bool isHighlighted;
  final ColorScheme colorScheme;
  final VoidCallback? onLinkPressed;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cardColor = isHighlighted ? Colors.white : const Color(0xFFFFF8FB);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 260,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(20),
          boxShadow: isHighlighted
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.06),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    Icons.local_hospital_rounded,
                    color: colorScheme.secondary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        facility.name,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${facility.distanceKm.toStringAsFixed(1)} km • ${facility.address}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade700,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Spacer(),
            Align(
              alignment: Alignment.bottomRight,
              child: ElevatedButton(
                onPressed: isLinked ? null : onLinkPressed,
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      isLinked ? Colors.grey.shade300 : colorScheme.secondary,
                  foregroundColor: isLinked ? Colors.grey.shade800 : Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 8,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
                child: Text(
                  isLinked ? 'Linked' : 'Link',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GhanaMapSection extends StatelessWidget {
  const _GhanaMapSection({
    super.key,
    required this.facilities,
    required this.highlightedFacility,
    required this.onFacilitySelected,
    required this.linkedFacility,
  });

  final List<HealthFacility> facilities;
  final HealthFacility? highlightedFacility;
  final HealthFacility? linkedFacility;
  final ValueChanged<HealthFacility> onFacilitySelected;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Map of facilities in Ghana',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: Colors.grey.shade900,
          ),
        ),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: SizedBox(
            height: 220,
            width: double.infinity,
            child: FlutterMap(
              options: MapOptions(
                initialCenter: const LatLng(7.9465, -1.0232),
                initialZoom: 6.3,
              ),
              children: [
                TileLayer(
                  urlTemplate:
                      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  subdomains: const ['a', 'b', 'c'],
                  userAgentPackageName: 'com.example.thryve_mobile',
                ),
                MarkerLayer(
                  markers: facilities.map((facility) {
                    final isHighlighted =
                        highlightedFacility?.id == facility.id;
                    final isLinked = linkedFacility?.id == facility.id;

                    return Marker(
                      point: LatLng(
                        facility.latitude,
                        facility.longitude,
                      ),
                      width: 40,
                      height: 40,
                      child: GestureDetector(
                        onTap: () => onFacilitySelected(facility),
                        child: _FacilityMarkerIcon(
                          isHighlighted: isHighlighted,
                          isLinked: isLinked,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _FacilityMarkerIcon extends StatelessWidget {
  const _FacilityMarkerIcon({
    required this.isHighlighted,
    required this.isLinked,
  });

  final bool isHighlighted;
  final bool isLinked;

  @override
  Widget build(BuildContext context) {
    final baseColor = isLinked ? Colors.green : Colors.pink;

    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: baseColor.withOpacity(isHighlighted ? 0.9 : 0.7),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.25),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Icon(
        Icons.location_on_rounded,
        color: Colors.white,
        size: isHighlighted ? 26 : 22,
      ),
    );
  }
}

class HealthFacility {
  const HealthFacility({
    required this.id,
    required this.name,
    required this.address,
    required this.region,
    required this.latitude,
    required this.longitude,
    required this.distanceKm,
  });

  final String id;
  final String name;
  final String address;
  final String region;
  final double latitude;
  final double longitude;
  final double distanceKm;
}

abstract class FacilityRepository {
  Future<List<HealthFacility>> fetchFacilities();
}

class FirestoreFacilityRepository implements FacilityRepository {
  @override
  Future<List<HealthFacility>> fetchFacilities() async {
    final snapshot =
        await FirebaseFirestore.instance.collection('facilities').get();

    return snapshot.docs.map((doc) {
      final data = doc.data();

      return HealthFacility(
        id: doc.id,
        name: (data['name'] ?? '') as String,
        address: (data['district'] ?? '') as String,
        region: (data['region'] ?? '') as String,
        latitude: (data['latitude'] as num?)?.toDouble() ?? 0,
        longitude: (data['longitude'] as num?)?.toDouble() ?? 0,
        // Distance will be refined later when we have location;
        // for now, we just show 0.
        distanceKm: 0,
      );
    }).toList();
  }
}

