import 'package:flutter/material.dart';

import '../../../presentation/theme/app_theme.dart';

class ShipGlowsSettingsGroup extends StatelessWidget {
  const ShipGlowsSettingsGroup({
    required this.title,
    required this.children,
    super.key,
  });

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final colorScheme = Theme.of(context).colorScheme;
    final groupedChildren = <Widget>[];
    for (var index = 0; index < children.length; index += 1) {
      groupedChildren.add(children[index]);
      if (index < children.length - 1) {
        groupedChildren.add(Divider(height: tokens.focus.width));
      }
    }

    return Semantics(
      container: true,
      label: title,
      child: Card(
        child: Padding(
          padding: EdgeInsets.all(tokens.spacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              SizedBox(height: tokens.spacing.sm),
              Material(
                color: colorScheme.surfaceContainerHighest,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(tokens.radii.control),
                  side: BorderSide(color: colorScheme.outlineVariant),
                ),
                clipBehavior: Clip.antiAlias,
                child: Column(children: groupedChildren),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ShipGlowsSettingsRow extends StatelessWidget {
  const ShipGlowsSettingsRow({
    required this.title,
    required this.icon,
    this.subtitle,
    this.selected = false,
    this.onTap,
    super.key,
  });

  final String title;
  final String? subtitle;
  final IconData icon;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final colorScheme = Theme.of(context).colorScheme;
    return Semantics(
      button: onTap != null,
      selected: selected,
      child: ConstrainedBox(
        constraints: BoxConstraints(minHeight: tokens.minimumTarget),
        child: ListTile(
          contentPadding: EdgeInsets.symmetric(horizontal: tokens.spacing.md),
          leading: Icon(icon),
          title: Text(title),
          subtitle: subtitle == null ? null : Text(subtitle!),
          trailing: selected
              ? Icon(Icons.check_rounded, color: colorScheme.primary)
              : null,
          selected: selected,
          onTap: onTap,
        ),
      ),
    );
  }
}
