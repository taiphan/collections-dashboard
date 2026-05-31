export const APP_VERSION = '2.0.0';

export const CHANGELOG: VersionEntry[] = [
  {
    version: '2.0.0',
    date: '2026-05-31',
    title: 'FE CREDIT Collection Hub',
    changes: [
      'Full collection management platform with multi-page navigation',
      'Case management with detailed debtor profiles',
      'Strategy designer for collection workflows',
      'Advanced analytics with ML-powered insights',
      'FE CREDIT corporate branding with dark/light mode',
      'Digital self-collection portal concept',
      'Monitoring & continuous improvement dashboard',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-05-30',
    title: 'Collections Dashboard MVP',
    changes: [
      'Initial dashboard with bucket monitoring (B1-B5)',
      'CSV import with validation',
      'Stats cards and chart visualizations',
      'Status management for collection records',
      'Filterable records table',
    ],
  },
];

export interface VersionEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}
