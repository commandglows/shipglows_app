import '../models/project.dart';

class DemoSeed {
  static const projectId = 'demo-project';
  static const projectName = 'Tailwind Nextjs Starter Blog';
  static const repoUrl =
      'https://github.com/timlrx/tailwind-nextjs-starter-blog';
  static const siteUrl = 'https://tailwind-nextjs-starter-blog.vercel.app';
  static const description =
      'Public Next.js blog starter used as a fixed demo workspace.';

  static List<ContentTypeConfig> contentTypes() => const [
    ContentTypeConfig(
      type: 'blog_post',
      label: 'Blog articles',
      icon: 'article',
      enabled: true,
      frequencyPerWeek: 2,
      channels: ['ghost'],
    ),
    ContentTypeConfig(
      type: 'newsletter',
      label: 'Newsletters',
      icon: 'email',
      enabled: true,
      frequencyPerWeek: 1,
      channels: ['email'],
    ),
    ContentTypeConfig(
      type: 'social_post',
      label: 'Social posts',
      icon: 'chat',
      enabled: true,
      frequencyPerWeek: 4,
      channels: ['twitter', 'linkedin'],
    ),
    ContentTypeConfig(
      type: 'video_script',
      label: 'Video scripts',
      icon: 'videocam',
      enabled: false,
      frequencyPerWeek: 1,
      channels: ['youtube'],
    ),
    ContentTypeConfig(
      type: 'reel',
      label: 'Reels / Shorts',
      icon: 'slow_motion_video',
      enabled: false,
      frequencyPerWeek: 2,
      channels: ['instagram', 'tiktok'],
    ),
  ];
}
