/// Data model for an Idea Pool item coming from GET /api/ideas.
class Idea {
  final String id;
  final String source;
  final String title;
  final Map<String, dynamic> rawData;
  final Map<String, dynamic>? seoSignals;
  final Map<String, dynamic>? trendingSignals;
  final List<String> tags;
  final double? priorityScore;
  final String status;
  final String? projectId;
  final String? userId;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Idea({
    required this.id,
    required this.source,
    required this.title,
    this.rawData = const {},
    this.seoSignals,
    this.trendingSignals,
    this.tags = const [],
    this.priorityScore,
    this.status = 'raw',
    this.projectId,
    this.userId,
    required this.createdAt,
    required this.updatedAt,
  });

  Idea copyWith({
    String? id,
    String? source,
    String? title,
    Map<String, dynamic>? rawData,
    Map<String, dynamic>? seoSignals,
    Map<String, dynamic>? trendingSignals,
    List<String>? tags,
    double? priorityScore,
    String? status,
    String? projectId,
    String? userId,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Idea(
      id: id ?? this.id,
      source: source ?? this.source,
      title: title ?? this.title,
      rawData: rawData ?? this.rawData,
      seoSignals: seoSignals ?? this.seoSignals,
      trendingSignals: trendingSignals ?? this.trendingSignals,
      tags: tags ?? this.tags,
      priorityScore: priorityScore ?? this.priorityScore,
      status: status ?? this.status,
      projectId: projectId ?? this.projectId,
      userId: userId ?? this.userId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  factory Idea.fromJson(Map<String, dynamic> json) {
    return Idea(
      id: (json['id'] ?? '').toString(),
      source: (json['source'] ?? 'manual').toString(),
      title: (json['title'] ?? '').toString(),
      rawData: (json['raw_data'] as Map<String, dynamic>?) ?? {},
      seoSignals: json['seo_signals'] as Map<String, dynamic>?,
      trendingSignals: json['trending_signals'] as Map<String, dynamic>?,
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
          [],
      priorityScore: (json['priority_score'] as num?)?.toDouble(),
      status: (json['status'] ?? 'raw').toString(),
      projectId: json['project_id'] as String?,
      userId: json['user_id'] as String?,
      createdAt: _parseDate(json['created_at']),
      updatedAt: _parseDate(json['updated_at']),
    );
  }

  static DateTime _parseDate(dynamic v) {
    if (v is String) return DateTime.tryParse(v) ?? DateTime.now();
    if (v is num) return DateTime.fromMillisecondsSinceEpoch(v.toInt() * 1000);
    return DateTime.now();
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'source': source,
      'title': title,
      'raw_data': rawData,
      'seo_signals': seoSignals,
      'trending_signals': trendingSignals,
      'tags': tags,
      'priority_score': priorityScore,
      'status': status,
      'project_id': projectId,
      'user_id': userId,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  /// Human-readable source label.
  String get sourceLabel => switch (source) {
    'newsletter_inbox' => 'Newsletter',
    'seo_keywords' => 'SEO',
    'competitor_watch' => 'Competitor',
    'social_listening' => 'Social',
    'weekly_ritual' => 'Ritual',
    'manual' => 'Manual',
    _ => source,
  };

  /// Status display label.
  String get statusLabel => switch (status) {
    'raw' => 'Raw',
    'enriched' => 'Enriched',
    'used' => 'Used',
    'dismissed' => 'Dismissed',
    _ => status,
  };

  /// SEO search volume if available.
  int? get searchVolume => (seoSignals?['search_volume'] as num?)?.toInt();

  /// SEO keyword difficulty if available.
  double? get keywordDifficulty =>
      (seoSignals?['keyword_difficulty'] as num?)?.toDouble();
}
