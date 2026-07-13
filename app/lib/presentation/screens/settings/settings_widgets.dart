import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../l10n/app_localizations.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';

/// Adaptive page padding: tighter on phones, breathable on tablets/desktop.
EdgeInsets settingsPagePadding(BuildContext context) {
  final width = MediaQuery.sizeOf(context).width;
  final horizontal = width < 480 ? 12.0 : 20.0;
  return EdgeInsets.fromLTRB(horizontal, 16, horizontal, 32);
}

/// Spacing between settings groups.
double settingsGroupGap(BuildContext context) {
  final width = MediaQuery.sizeOf(context).width;
  return width < 480 ? 20.0 : 28.0;
}

/// A grouped, iOS-style settings section: optional caption + a single rounded
/// surface that holds one or more visually-related rows. Reduces "wall of cards"
/// density vs. one card per setting.
class SettingsGroup extends StatelessWidget {
  const SettingsGroup({
    super.key,
    this.title,
    this.caption,
    required this.children,
    this.padding,
    this.gap = 0,
  });

  final String? title;
  final String? caption;
  final List<Widget> children;
  final EdgeInsets? padding;

  /// Inner spacing between children. 0 = stacked rows with dividers,
  /// >0 = gap between blocks (use for free-form content).
  final double gap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    final colorScheme = theme.colorScheme;

    Widget body;
    if (gap > 0) {
      final spaced = <Widget>[];
      for (var i = 0; i < children.length; i++) {
        spaced.add(children[i]);
        if (i != children.length - 1) {
          spaced.add(SizedBox(height: gap));
        }
      }
      body = Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: spaced,
      );
    } else {
      final stacked = <Widget>[];
      for (var i = 0; i < children.length; i++) {
        stacked.add(children[i]);
        if (i != children.length - 1) {
          stacked.add(Divider(
            height: 1,
            thickness: 1,
            color: palette.borderSubtle,
          ));
        }
      }
      body = Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: stacked,
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 0, 4, 10),
            child: Text(
              context.tr(title!).toUpperCase(),
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurfaceVariant,
                letterSpacing: 1.4,
              ),
            ),
          ),
        Container(
          padding: padding ?? EdgeInsets.zero,
          decoration: BoxDecoration(
            color: palette.elevatedSurface,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: palette.borderSubtle),
          ),
          child: body,
        ),
        if (caption != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 8, 4, 0),
            child: Text(
              context.tr(caption!),
              style: TextStyle(
                fontSize: 12,
                color: colorScheme.onSurfaceVariant,
                height: 1.4,
              ),
            ),
          ),
      ],
    );
  }
}

/// Minimum touch target on mobile (WCAG 2.5.8 AAA recommends 44).
const double _kMinTouch = 48.0;

/// A row in a [SettingsGroup]. Larger touch target on mobile, optional
/// trailing widget (chevron / status pill / switch).
class SettingsRow extends StatelessWidget {
  const SettingsRow({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.iconColor,
    this.trailing,
    this.onTap,
    this.contentPadding,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Color? iconColor;
  final Widget? trailing;
  final VoidCallback? onTap;
  final EdgeInsets? contentPadding;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final color = iconColor ?? colorScheme.primary;

    final tile = ListTile(
      contentPadding: contentPadding ??
          const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      minVerticalPadding: 10,
      minLeadingWidth: 36,
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: color.withAlpha(25),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(
        context.tr(title),
        style: TextStyle(
          color: colorScheme.onSurface,
          fontSize: 15,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: subtitle == null
          ? null
          : Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                context.tr(subtitle!),
                style: TextStyle(
                  color: colorScheme.onSurfaceVariant,
                  fontSize: 12,
                  height: 1.35,
                ),
              ),
            ),
      trailing: trailing ??
          (onTap != null
              ? Icon(
                  Icons.chevron_right,
                  color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                )
              : null),
      onTap: onTap,
    );

    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: _kMinTouch),
      child: tile,
    );
  }
}

/// Free-form block inside a [SettingsGroup]. Use when a row layout doesn't fit
/// (sliders, multi-line forms, etc.).
class SettingsBlock extends StatelessWidget {
  const SettingsBlock({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.fromLTRB(16, 16, 16, 16),
  });

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Padding(padding: padding, child: child);
  }
}

/// Status pill (Connected / Offline / Pending). Compact, inline-safe.
class SettingsStatusPill extends StatelessWidget {
  const SettingsStatusPill({
    super.key,
    required this.label,
    required this.color,
    this.icon,
  });

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withAlpha(28),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, color: color, size: 12),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}

/// Diagnostic row used inside error states: details + open/copy actions.
class SettingsErrorDiagnostic extends ConsumerWidget {
  const SettingsErrorDiagnostic({
    super.key,
    required this.details,
    required this.linkUrl,
    required this.linkLabel,
  });

  final String details;
  final String linkUrl;
  final String linkLabel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final clippedDetails = details.trim();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          clippedDetails,
          style: TextStyle(
            color: theme.colorScheme.onSurfaceVariant,
            fontSize: 12,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 10,
          runSpacing: 8,
          children: [
            TextButton.icon(
              onPressed: () => openSettingsUrl(context, ref, linkUrl),
              icon: const Icon(Icons.open_in_new, size: 18),
              label: Text(linkLabel),
              style: TextButton.styleFrom(
                foregroundColor: AppTheme.infoColor,
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                minimumSize: const Size(0, _kMinTouch),
              ),
            ),
            OutlinedButton.icon(
              onPressed: () => copySettingsErrorText(context, clippedDetails),
              icon: const Icon(Icons.content_copy, size: 18),
              label: Text(context.tr('Copy')),
              style: OutlinedButton.styleFrom(
                foregroundColor: theme.colorScheme.onSurfaceVariant,
                side: BorderSide(color: theme.colorScheme.outlineVariant),
                minimumSize: const Size(0, _kMinTouch),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

Future<void> openSettingsUrl(
  BuildContext context,
  WidgetRef ref,
  String url,
) async {
  final uri = Uri.tryParse(url);
  if (uri == null) {
    showCopyableDiagnosticSnackBar(
      context,
      ref,
      message: context.tr('Cannot open URL: invalid format.'),
      scope: 'settings.open_url.invalid_format',
      contextData: {'url': url},
    );
    return;
  }

  final canOpen = await canLaunchUrl(uri);
  if (!canOpen) {
    if (!context.mounted) return;
    showCopyableDiagnosticSnackBar(
      context,
      ref,
      message: context.tr('Could not open link in browser.'),
      scope: 'settings.open_url.cannot_open',
      contextData: {'url': url},
    );
    return;
  }

  await launchUrl(uri, mode: LaunchMode.externalApplication);
}

Future<void> copySettingsErrorText(BuildContext context, String text) async {
  await Clipboard.setData(ClipboardData(text: text));
  if (!context.mounted) return;
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(context.tr('Error copied to clipboard.')),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  );
}
