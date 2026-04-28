import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../shared_preferences_provider.dart';
import 'in_app_tour_step.dart';
import 'in_app_tour_steps.dart';

const _stepIndexKey = 'inapp_tour_step';
const _completedKey = 'inapp_tour_completed';
const _activeKey = 'inapp_tour_active';

class InAppTourState {
  const InAppTourState({
    required this.stepIndex,
    required this.active,
    required this.completed,
  });

  final int stepIndex;
  final bool active;
  final bool completed;

  InAppTourStep get currentStep => kInAppTourSteps[stepIndex];
  int get totalSteps => kInAppTourSteps.length;
  bool get isFirst => stepIndex == 0;
  bool get isLast => stepIndex == kInAppTourSteps.length - 1;

  InAppTourState copyWith({int? stepIndex, bool? active, bool? completed}) {
    return InAppTourState(
      stepIndex: stepIndex ?? this.stepIndex,
      active: active ?? this.active,
      completed: completed ?? this.completed,
    );
  }
}

class InAppTourController extends StateNotifier<InAppTourState> {
  InAppTourController(this._prefs) : super(_loadInitial(_prefs));

  final SharedPreferences _prefs;

  static InAppTourState _loadInitial(SharedPreferences prefs) {
    final rawIndex = prefs.getInt(_stepIndexKey) ?? 0;
    final clamped = rawIndex.clamp(0, kInAppTourSteps.length - 1);
    return InAppTourState(
      stepIndex: clamped,
      // Never auto-resume the tour on app startup/resume; users must explicitly
      // start or resume it from onboarding/settings.
      active: false,
      completed: prefs.getBool(_completedKey) ?? false,
    );
  }

  Future<void> _persist() async {
    await _prefs.setInt(_stepIndexKey, state.stepIndex);
    await _prefs.setBool(_activeKey, state.active);
    await _prefs.setBool(_completedKey, state.completed);
  }

  /// Démarre la visite depuis le début. Utilisé après le pre-app onboarding
  /// ou via le bouton « Relancer » dans les paramètres.
  Future<void> start(BuildContext context) async {
    state = const InAppTourState(stepIndex: 0, active: true, completed: false);
    _navigateToCurrentStep(context);
    await _persist();
  }

  /// Reprend la visite à l'étape sauvegardée.
  Future<void> resume(BuildContext context) async {
    state = state.copyWith(active: true, completed: false);
    _navigateToCurrentStep(context);
    await _persist();
  }

  /// Met en pause sans marquer comme complété — l'utilisateur pourra reprendre.
  Future<void> pause() async {
    state = state.copyWith(active: false);
    await _persist();
  }

  /// L'utilisateur abandonne la visite — marquée complétée pour ne pas
  /// redémarrer automatiquement.
  Future<void> skip() async {
    state = state.copyWith(active: false, completed: true);
    await _persist();
  }

  Future<void> next(BuildContext context) async {
    if (state.isLast) {
      state = state.copyWith(active: false, completed: true);
      await _persist();
      return;
    }
    state = state.copyWith(stepIndex: state.stepIndex + 1);
    _navigateToCurrentStep(context);
    await _persist();
  }

  Future<void> previous(BuildContext context) async {
    if (state.isFirst) return;
    state = state.copyWith(stepIndex: state.stepIndex - 1);
    _navigateToCurrentStep(context);
    await _persist();
  }

  void _navigateToCurrentStep(BuildContext context) {
    final route = state.currentStep.routePath;
    if (route == null) return;
    if (!context.mounted) return;
    final current = GoRouterState.of(context).uri.path;
    if (current == route) return;
    context.go(route);
  }
}

final inAppTourProvider =
    StateNotifierProvider<InAppTourController, InAppTourState>((ref) {
      return InAppTourController(ref.read(sharedPrefsProvider));
    });
