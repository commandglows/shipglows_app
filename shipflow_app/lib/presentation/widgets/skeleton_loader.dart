import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class SkeletonLoader extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const SkeletonLoader({
    super.key,
    this.width = double.infinity,
    required this.height,
    this.borderRadius = 12,
  });

  @override
  State<SkeletonLoader> createState() => _SkeletonLoaderState();
}

class _SkeletonLoaderState extends State<SkeletonLoader>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment(-1.0 + 2.0 * _controller.value, 0),
              end: Alignment(1.0 + 2.0 * _controller.value, 0),
              colors: [
                palette.surface,
                palette.mutedSurface,
                palette.surface,
              ],
            ),
          ),
        );
      },
    );
  }
}

class ContentCardSkeleton extends StatelessWidget {
  const ContentCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: palette.elevatedSurface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SkeletonLoader(width: 80, height: 28, borderRadius: 20),
              Spacer(),
              SkeletonLoader(width: 60, height: 16),
            ],
          ),
          SizedBox(height: 20),
          SkeletonLoader(height: 24),
          SizedBox(height: 12),
          SkeletonLoader(height: 16, width: 250),
          SizedBox(height: 8),
          SkeletonLoader(height: 16, width: 200),
          SizedBox(height: 8),
          SkeletonLoader(height: 16, width: 280),
          SizedBox(height: 20),
          SkeletonLoader(height: 14, width: 150),
        ],
      ),
    );
  }
}

class FeedSkeletonLoader extends StatelessWidget {
  const FeedSkeletonLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 40),
        child: ContentCardSkeleton(),
      ),
    );
  }
}
