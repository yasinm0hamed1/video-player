import { VideoConfig } from '../types';

/**
 * Extracts a YouTube Video ID from various URL patterns or raw string
 */
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If directly an 11-character YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex covering standard watch, shorts, embed, youtu.be
  const regex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regex);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Formats time in seconds to mm:ss or hh:mm:ss
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSecs = Math.floor(seconds);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const pad = (n: number) => (n < 10 ? '0' + n : String(n));

  if (hours > 0) {
    return `${hours}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Parses "mm:ss" or seconds string to numeric seconds
 */
export function parseTimeToSeconds(input: string): number {
  if (!input) return 0;
  const str = input.trim();
  if (/^\d+$/.test(str)) {
    return parseInt(str, 10);
  }
  const parts = str.split(':').map((p) => parseInt(p, 10) || 0);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * Obfuscates the video configuration into a safe Base64 token
 * so the raw YouTube ID isn't obvious in URL parameters.
 */
export function encodeVideoConfig(config: VideoConfig): string {
  try {
    const jsonStr = JSON.stringify(config);
    // Use standard UTF-8 safe base64
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    let binary = '';
    utf8Bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (err) {
    console.error('Failed to encode video config', err);
    return '';
  }
}

/**
 * Decodes an obfuscated token back into VideoConfig
 */
export function decodeVideoConfig(token: string): VideoConfig | null {
  try {
    if (!token) return null;
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    const obj = JSON.parse(jsonStr);
    if (obj && obj.id) {
      return obj as VideoConfig;
    }
    return null;
  } catch (err) {
    console.error('Failed to decode video config token', err);
    return null;
  }
}
