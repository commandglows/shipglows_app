class InAppTourStep {
  const InAppTourStep({
    required this.id,
    required this.title,
    required this.description,
    this.routePath,
    this.hint,
  });

  final String id;
  final String title;
  final String description;

  /// If non-null, the tour controller navigates here when this step becomes
  /// active. Steps without a route stay on the current screen (welcome /
  /// completion).
  final String? routePath;

  /// Optional one-line micro-CTA shown above the buttons (e.g. point to a FAB).
  final String? hint;
}
