enum ContentType {
  blogPost,
  socialPost,
  newsletter,
  videoScript,
  reel,
  short,
}

enum ContentStatus {
  pending,
  approved,
  rejected,
  published,
  editing,
}

enum PublishingChannel {
  wordpress,
  ghost,
  twitter,
  linkedin,
  instagram,
  tiktok,
  youtube,
}

class ContentItem {
  final String id;
  final String title;
  final String body;
  final String? summary;
  final ContentType type;
  final ContentStatus status;
  final List<PublishingChannel> channels;
  final String? imageUrl;
  final String? projectName;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;
  final DateTime? publishedAt;
  final int priority;
  final List<String> tags;
  final String? sourceRobot;
  final String? reviewedBy;
  final String? reviewActorType;
  final String? reviewActorId;
  final String? reviewActorLabel;
  final Map<String, dynamic>? reviewActorMetadata;

  const ContentItem({
    required this.id,
    required this.title,
    required this.body,
    this.summary,
    required this.type,
    required this.status,
    this.channels = const [],
    this.imageUrl,
    this.projectName,
    this.metadata,
    required this.createdAt,
    this.publishedAt,
    this.priority = 3,
    this.tags = const [],
    this.sourceRobot,
    this.reviewedBy,
    this.reviewActorType,
    this.reviewActorId,
    this.reviewActorLabel,
    this.reviewActorMetadata,
  });

  ContentItem copyWith({
    String? id,
    String? title,
    String? body,
    String? summary,
    ContentType? type,
    ContentStatus? status,
    List<PublishingChannel>? channels,
    String? imageUrl,
    String? projectName,
    Map<String, dynamic>? metadata,
    DateTime? createdAt,
    DateTime? publishedAt,
    String? reviewedBy,
    String? reviewActorType,
    String? reviewActorId,
    String? reviewActorLabel,
    Map<String, dynamic>? reviewActorMetadata,
  }) {
    return ContentItem(
      id: id ?? this.id,
      title: title ?? this.title,
      body: body ?? this.body,
      summary: summary ?? this.summary,
      type: type ?? this.type,
      status: status ?? this.status,
      channels: channels ?? this.channels,
      imageUrl: imageUrl ?? this.imageUrl,
      projectName: projectName ?? this.projectName,
      metadata: metadata ?? this.metadata,
      createdAt: createdAt ?? this.createdAt,
      publishedAt: publishedAt ?? this.publishedAt,
      priority: priority,
      tags: tags,
      sourceRobot: sourceRobot,
      reviewedBy: reviewedBy ?? this.reviewedBy,
      reviewActorType: reviewActorType ?? this.reviewActorType,
      reviewActorId: reviewActorId ?? this.reviewActorId,
      reviewActorLabel: reviewActorLabel ?? this.reviewActorLabel,
      reviewActorMetadata: reviewActorMetadata ?? this.reviewActorMetadata,
    );
  }

  /// Parse from backend ContentResponse or mock data.
  /// Backend sends: content_type (string), status (string), content_preview, etc.
  /// Mock sends: type (enum string), body, channels, etc.
  factory ContentItem.fromJson(Map<String, dynamic> json) {
    return ContentItem(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String? ??
          json['content_preview'] as String? ??
          '',
      summary: json['summary'] as String? ??
          json['content_preview'] as String?,
      type: _parseContentType(
          json['content_type'] as String? ?? json['type'] as String? ?? 'article'),
      status: _parseStatus(json['status'] as String? ?? 'pending'),
      channels: _parseChannels(json['channels'] ?? json['tags'] ?? []),
      imageUrl: json['image_url'] as String?,
      projectName: json['project_name'] as String? ??
          json['project_id'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: _parseDateTime(json['created_at']),
      publishedAt: json['published_at'] != null
          ? _parseDateTime(json['published_at'])
          : null,
      priority: json['priority'] as int? ?? 3,
      tags: (json['tags'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      sourceRobot: json['source_robot'] as String?,
      reviewedBy: json['reviewed_by'] as String?,
      reviewActorType: json['review_actor_type'] as String?,
      reviewActorId: json['review_actor_id'] as String?,
      reviewActorLabel: json['review_actor_label'] as String?,
      reviewActorMetadata: json['review_actor_metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'summary': summary,
        'content_type': _contentTypeToString(type),
        'status': _statusToString(status),
        'channels':
            channels.map((c) => c.name).toList(),
        'image_url': imageUrl,
        'project_name': projectName,
        'metadata': metadata,
        'created_at': createdAt.toIso8601String(),
        'published_at': publishedAt?.toIso8601String(),
        'priority': priority,
        'tags': tags,
        'source_robot': sourceRobot,
        'reviewed_by': reviewedBy,
        'review_actor_type': reviewActorType,
        'review_actor_id': reviewActorId,
        'review_actor_label': reviewActorLabel,
        'review_actor_metadata': reviewActorMetadata,
      };

  String get typeLabel => switch (type) {
        ContentType.blogPost => 'Article',
        ContentType.socialPost => 'Social',
        ContentType.newsletter => 'Newsletter',
        ContentType.videoScript => 'Video',
        ContentType.reel => 'Reel',
        ContentType.short => 'Short',
      };

  String get channelLabels =>
      channels.map((c) => c.name).join(', ');

  String? get reviewActorDisplay =>
      reviewActorLabel ?? reviewActorId ?? reviewedBy;

  // ── Format-specific metadata helpers ──

  /// SEO keyword for blog articles (from angle enrichment)
  String? get seoKeyword => metadata?['seo_keyword'] as String?
      ?? metadata?['angle']?['seo_keyword'] as String?;

  /// Primary keyword search volume
  int? get seoVolume => metadata?['seo_signals']?['volume'] as int?;

  /// Short: target platform (tiktok, instagram_reels, youtube_shorts)
  String? get shortPlatform => metadata?['platform'] as String?;

  /// Short: duration in seconds
  int? get shortDuration => metadata?['duration_seconds'] as int?
      ?? metadata?['max_duration'] as int?;

  /// Short: hashtags list
  List<String> get shortHashtags =>
      (metadata?['hashtags'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList() ?? [];

  /// Social: target platforms
  List<String> get socialPlatforms =>
      (metadata?['platforms'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList() ?? [];

  /// Angle confidence score
  int? get angleConfidence => metadata?['confidence'] as int?
      ?? metadata?['angle']?['confidence'] as int?;

  /// Narrative thread this content draws from
  String? get narrativeThread => metadata?['narrative_thread'] as String?
      ?? metadata?['angle']?['narrative_thread'] as String?;

  /// SEO keyword difficulty (0-100)
  int? get seoDifficulty => metadata?['seo_signals']?['difficulty'] as int?;

  /// Source idea IDs that contributed to this content
  List<String> get sourceIdeaIds =>
      (metadata?['source_idea_ids'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList() ?? [];

  /// Source of the idea (seo_keywords, competitor_watch, weekly_ritual, etc.)
  String? get ideaSource => metadata?['source_idea_source'] as String?
      ?? metadata?['angle']?['source'] as String?;

  /// Human-readable reason why this content was generated
  String? get generationReason {
    final source = ideaSource;
    final keyword = seoKeyword;
    final vol = seoVolume;

    if (source == 'competitor_watch' || source == 'competitor_gap') {
      return 'Competitor gap';
    }
    if (source == 'serp_feedback') {
      return 'SERP refresh';
    }
    if (keyword != null && vol != null) {
      final volLabel = vol >= 1000 ? '${(vol / 1000).toStringAsFixed(1)}K' : '$vol';
      return 'SEO: $keyword ($volLabel vol)';
    }
    if (keyword != null) {
      return 'SEO: $keyword';
    }
    if (source == 'newsletter_inbox') {
      return 'Newsletter insight';
    }
    if (source == 'weekly_ritual') {
      return 'Your ritual';
    }
    if (source == 'social_listening') {
      return 'Social trend';
    }
    return null;
  }

  // ── Parsing helpers ──

  static ContentType _parseContentType(String raw) {
    final normalized = raw.toLowerCase().replaceAll('-', '_');
    return switch (normalized) {
      'blog_post' || 'article' || 'seo_content' || 'seo-content' =>
        ContentType.blogPost,
      'social_post' || 'social' => ContentType.socialPost,
      'newsletter' => ContentType.newsletter,
      'video_script' || 'video' => ContentType.videoScript,
      'reel' || 'reels' => ContentType.reel,
      'short' || 'shorts' => ContentType.short,
      _ => ContentType.blogPost,
    };
  }

  static ContentStatus _parseStatus(String raw) {
    final normalized = raw.toLowerCase().replaceAll('-', '_');
    return switch (normalized) {
      'pending' || 'pending_review' || 'todo' || 'generated' =>
        ContentStatus.pending,
      'approved' || 'scheduled' => ContentStatus.approved,
      'rejected' => ContentStatus.rejected,
      'published' => ContentStatus.published,
      'editing' || 'in_progress' => ContentStatus.editing,
      _ => ContentStatus.pending,
    };
  }

  static List<PublishingChannel> _parseChannels(dynamic raw) {
    if (raw is! List) return [];
    return raw
        .map((e) {
          final s = e.toString().toLowerCase();
          return switch (s) {
            'wordpress' => PublishingChannel.wordpress,
            'ghost' => PublishingChannel.ghost,
            'twitter' || 'x' => PublishingChannel.twitter,
            'linkedin' => PublishingChannel.linkedin,
            'instagram' => PublishingChannel.instagram,
            'tiktok' => PublishingChannel.tiktok,
            'youtube' => PublishingChannel.youtube,
            _ => null,
          };
        })
        .whereType<PublishingChannel>()
        .toList();
  }

  static DateTime _parseDateTime(dynamic raw) {
    if (raw is DateTime) return raw;
    if (raw is String) return DateTime.tryParse(raw) ?? DateTime.now();
    return DateTime.now();
  }

  static String _contentTypeToString(ContentType type) => switch (type) {
        ContentType.blogPost => 'article',
        ContentType.socialPost => 'social_post',
        ContentType.newsletter => 'newsletter',
        ContentType.videoScript => 'video_script',
        ContentType.reel => 'reel',
        ContentType.short => 'short',
      };

  static String _statusToString(ContentStatus status) => switch (status) {
        ContentStatus.pending => 'pending_review',
        ContentStatus.approved => 'approved',
        ContentStatus.rejected => 'rejected',
        ContentStatus.published => 'published',
        ContentStatus.editing => 'in_progress',
      };
}
