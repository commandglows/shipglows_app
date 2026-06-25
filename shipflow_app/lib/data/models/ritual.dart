enum EntryType {
  reflection,
  win,
  struggle,
  idea,
  pivot,
}

class RitualEntry {
  final EntryType type;
  final String content;
  final List<String> tags;

  const RitualEntry({
    required this.type,
    this.content = '',
    this.tags = const [],
  });

  RitualEntry copyWith({String? content, List<String>? tags}) {
    return RitualEntry(
      type: type,
      content: content ?? this.content,
      tags: tags ?? this.tags,
    );
  }

  Map<String, dynamic> toJson() => {
        'entry_type': type.name,
        'content': content,
        'tags': tags,
      };

  String get label => switch (type) {
        EntryType.reflection => 'Reflection',
        EntryType.win => 'Win',
        EntryType.struggle => 'Struggle',
        EntryType.idea => 'Idea',
        EntryType.pivot => 'Pivot',
      };

  String get emoji => switch (type) {
        EntryType.reflection => '🪞',
        EntryType.win => '🏆',
        EntryType.struggle => '💪',
        EntryType.idea => '💡',
        EntryType.pivot => '🔄',
      };

  String get hint => switch (type) {
        EntryType.reflection =>
          'What have you been thinking about this week regarding your work, your audience, your direction?',
        EntryType.win =>
          'What went well? A milestone, a positive reaction, a breakthrough?',
        EntryType.struggle =>
          'What was difficult? A blocker, a doubt, a frustration?',
        EntryType.idea =>
          'Any new ideas? Content topics, product features, collaborations?',
        EntryType.pivot =>
          'Are you reconsidering something? A strategy shift, a new angle?',
      };

  bool get isEmpty => content.trim().isEmpty;
}

class NarrativeSynthesisResult {
  final Map<String, dynamic> voiceDelta;
  final Map<String, dynamic> positioningDelta;
  final String narrativeSummary;
  final bool chapterTransition;
  final String? suggestedChapterTitle;

  const NarrativeSynthesisResult({
    this.voiceDelta = const {},
    this.positioningDelta = const {},
    required this.narrativeSummary,
    this.chapterTransition = false,
    this.suggestedChapterTitle,
  });

  factory NarrativeSynthesisResult.fromJson(Map<String, dynamic> json) =>
      NarrativeSynthesisResult(
        voiceDelta: json['voice_delta'] as Map<String, dynamic>? ?? {},
        positioningDelta:
            json['positioning_delta'] as Map<String, dynamic>? ?? {},
        narrativeSummary: json['narrative_summary'] as String? ?? '',
        chapterTransition: json['chapter_transition'] as bool? ?? false,
        suggestedChapterTitle: json['suggested_chapter_title'] as String?,
      );
}

class AngleSuggestion {
  final String title;
  final String hook;
  final String angle;
  final String contentType;
  final String narrativeThread;
  final String painPointAddressed;
  final int confidence;

  const AngleSuggestion({
    required this.title,
    required this.hook,
    required this.angle,
    required this.contentType,
    required this.narrativeThread,
    required this.painPointAddressed,
    required this.confidence,
  });

  factory AngleSuggestion.fromJson(Map<String, dynamic> json) =>
      AngleSuggestion(
        title: json['title'] as String,
        hook: json['hook'] as String,
        angle: json['angle'] as String,
        contentType: json['content_type'] as String,
        narrativeThread: json['narrative_thread'] as String? ?? '',
        painPointAddressed: json['pain_point_addressed'] as String? ?? '',
        confidence: json['confidence'] as int? ?? 0,
      );
}
