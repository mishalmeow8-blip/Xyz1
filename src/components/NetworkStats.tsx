import React from 'react';
import { NetworkMetrics, VPNStatus, VPNProtocol } from '../types';
import { ArrowDownCircle, ArrowUpCircle, Clock, ShieldCheck, Cpu, HardDrive } from 'lucide-react';

interface NetworkStatsProps {
  metrics: NetworkMetrics;
  status: VPNStatus;
  protocol: VPNProtocol;
  ipAddress: string;
}

export const NetworkStats: React.FC<NetworkStatsProps> = ({
  metrics,
  status,
  protocol,
  ipAddress,
}) => {
  // Utility to format bytes into readable scale
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0.00 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Utility to format connection duration (seconds -> HH:MM:SS)
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0'),
    ].join(':');
  };

  const isConnected = status === 'connected';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {/* Downlink Meter */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0F0F12] p-5 flex flex-col justify-between shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ArrowDownCircle className={`h-4 w-4 ${isConnected ? 'text-blue-400' : 'text-slate-600'}`} />
            Download Speed
          </span>
          <span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono uppercase tracking-widest ${
            isConnected ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-slate-500 border-white/5'
          }`}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold font-mono tracking-tight text-slate-100">
            {isConnected ? metrics.downloadSpeed.toFixed(1) : '0.0'}
          </span>
          <span className="text-xs text-slate-500 font-sans">Mbps</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <HardDrive className="h-3 w-3" /> Total Payload:
          </span>
          <span className="font-mono text-slate-300 font-medium">
            {formatBytes(metrics.bytesDownloaded)}
          </span>
        </div>
      </div>

      {/* Uplink Meter */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0F0F12] p-5 flex flex-col justify-between shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ArrowUpCircle className={`h-4 w-4 ${isConnected ? 'text-blue-400' : 'text-slate-600'}`} />
            Upload Speed
          </span>
          <span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono uppercase tracking-widest ${
            isConnected ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-slate-500 border-white/5'
          }`}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold font-mono tracking-tight text-slate-100">
            {isConnected ? metrics.uploadSpeed.toFixed(1) : '0.0'}
          </span>
          <span className="text-xs text-slate-500 font-sans">Mbps</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <HardDrive className="h-3 w-3" /> Total Payload:
          </span>
          <span className="font-mono text-slate-300 font-medium">
            {formatBytes(metrics.bytesUploaded)}
          </span>
        </div>
      </div>

      {/* Connection Metadata / Session Status */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0F0F12] p-5 flex flex-col justify-between shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className={`h-4 w-4 ${isConnected ? 'text-blue-400' : 'text-slate-600'}`} />
            Tunnel Session
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {protocol}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold font-mono tracking-tight text-slate-100">
            {isConnected ? formatDuration(metrics.duration) : '00:00:00'}
          </span>
          <span className="text-xs text-slate-500 font-sans">Uptime</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> Virtual IP:
          </span>
          <span className="font-mono text-slate-300 font-medium">
            {isConnected ? ipAddress : 'None'}
          </span>
        </div>
      </div>
    </div>
  );
};
