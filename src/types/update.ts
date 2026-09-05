/**
 * Update system types
 * Types for app update checking and update sources.
 */

/** Information about an available update */
export interface UpdateInfo {
  version: string;
  date: string;
  body: string;
  downloadUrl: string;
  directDownloadUrl: string;
  prerelease: boolean;
  shouldUpdate: boolean;
  source: string;
}

/** Configuration for an update source */
export interface UpdateSourceConfig {
  name: string;
  description: string;
  apiUrl: string;
  releasesUrl: string;
  enabled: boolean;
}
