export type VPNStatus = 'disconnected' | 'connecting' | 'connected';

export type VPNProtocol = 'WireGuard' | 'OpenVPN (UDP)' | 'OpenVPN (TCP)' | 'IPSec/IKEv2';

export interface VPNServer {
  id: string;
  name: string; // City name
  country: string; // Country name
  countryCode: string; // ISO 3166-1 alpha-2 code
  ipAddress: string;
  load: number; // 0-100 percentage
  latency: number; // in ms
  latitude: number; // Normalized coordinate for SVG map: 0 to 100
  longitude: number; // Normalized coordinate for SVG map: 0 to 100
  isPremium?: boolean;
}

export interface NetworkMetrics {
  downloadSpeed: number; // in Mbps
  uploadSpeed: number; // in Mbps
  bytesDownloaded: number; // in Bytes
  bytesUploaded: number; // in Bytes
  duration: number; // in seconds
}

export interface DiagnosticTest {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  result: string;
}
