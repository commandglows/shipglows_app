class AffiliateLink {
  const AffiliateLink({
    this.id,
    required this.name,
    required this.url,
    this.userId,
    this.projectId,
    this.description,
    this.contactUrl,
    this.loginUrl,
    this.researchSummary,
    this.researchedAt,
    this.category,
    this.commission,
    this.keywords = const [],
    this.status = 'active',
    this.notes,
    this.expiresAt,
    this.createdAt,
    this.updatedAt,
  });

  final String? id;
  final String? userId;
  final String? projectId;
  final String name;
  final String url;
  final String? description;
  final String? contactUrl;
  final String? loginUrl;
  final String? researchSummary;
  final DateTime? researchedAt;
  final String? category;
  final String? commission;
  final List<String> keywords;
  final String status;
  final String? notes;
  final DateTime? expiresAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory AffiliateLink.fromJson(Map<String, dynamic> json) {
    return AffiliateLink(
      id: json['id'] as String?,
      userId: json['userId'] as String?,
      projectId: json['projectId'] as String?,
      name: json['name'] as String? ?? '',
      url: json['url'] as String? ?? '',
      description: json['description'] as String?,
      contactUrl: json['contactUrl'] as String?,
      loginUrl: json['loginUrl'] as String?,
      researchSummary: json['researchSummary'] as String?,
      researchedAt: _parseDateTime(json['researchedAt']),
      category: json['category'] as String?,
      commission: json['commission'] as String?,
      keywords: (json['keywords'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      status: json['status'] as String? ?? 'active',
      notes: json['notes'] as String?,
      expiresAt: _parseDateTime(json['expiresAt']),
      createdAt: _parseDateTime(json['createdAt']),
      updatedAt: _parseDateTime(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        'name': name,
        'url': url,
        if (projectId != null) 'projectId': projectId,
        if (description != null) 'description': description,
        if (contactUrl != null) 'contactUrl': contactUrl,
        if (loginUrl != null) 'loginUrl': loginUrl,
        if (category != null) 'category': category,
        if (commission != null) 'commission': commission,
        if (keywords.isNotEmpty) 'keywords': keywords,
        'status': status,
        if (notes != null) 'notes': notes,
        if (expiresAt != null) 'expiresAt': expiresAt!.toIso8601String(),
      };

  AffiliateLink copyWith({
    String? id,
    String? userId,
    String? projectId,
    String? name,
    String? url,
    String? description,
    String? contactUrl,
    String? loginUrl,
    String? researchSummary,
    DateTime? researchedAt,
    String? category,
    String? commission,
    List<String>? keywords,
    String? status,
    String? notes,
    DateTime? expiresAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return AffiliateLink(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      projectId: projectId ?? this.projectId,
      name: name ?? this.name,
      url: url ?? this.url,
      description: description ?? this.description,
      contactUrl: contactUrl ?? this.contactUrl,
      loginUrl: loginUrl ?? this.loginUrl,
      researchSummary: researchSummary ?? this.researchSummary,
      researchedAt: researchedAt ?? this.researchedAt,
      category: category ?? this.category,
      commission: commission ?? this.commission,
      keywords: keywords ?? this.keywords,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      expiresAt: expiresAt ?? this.expiresAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  static DateTime? _parseDateTime(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is String) return DateTime.tryParse(value);
    if (value is num) {
      return DateTime.fromMillisecondsSinceEpoch(value.toInt() * 1000);
    }
    return null;
  }
}
