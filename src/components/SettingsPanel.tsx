import React from 'react';
import { VPNProtocol } from '../types';
import { Settings, ShieldAlert, ToggleLeft, ToggleRight, Radio, Compass } from 'lucide-react';

interface SettingsPanelProps {
  protocol: VPNProtocol;
  setProtocol: (proto: VPNProtocol) => void;
  killSwitch: boolean;
  setKillSwitch: (val: boolean) => void;
  autoConnect: boolean;
  setAutoConnect: (val: boolean) => void;
  dnsServer: string;
  setDnsServer: (val: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  protocol,
  setProtocol,
  killSwitch,
  setKillSwitch,
  autoConnect,
  setAutoConnect,
  dnsServer,
  setDnsServer,
}) => {
  const protocols: VPNProtocol[] = [
    'WireGuard',
    'OpenVPN (UDP)',
    'OpenVPN (TCP)',
    'IPSec/IKEv2',
  ];

  const dnsServers = [
    { value: 'cloudflare', label: 'Cloudflare Secure (1.1.1.1)' },
    { value: 'google', label: 'Google Public DNS (8.8.8.8)' },
    { value: 'quad9', label: 'Quad9 Security (9.9.9.9)' },
    { value: 'adguard', label: 'AdGuard Ad-Blocking' },
  ];

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0F0F12] p-5 flex flex-col h-full justify-between shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-4.5 w-4.5 text-blue-400" />
        <h3 className="text-sm font-bold text-slate-200 font-sans">Quick Tunnel Settings</h3>
      </div>

      <div className="space-y-4">
        {/* Protocol Selector */}
        <div>
          <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block mb-2">
            VPN Protocol Suite
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-white/[0.02] p-1 rounded-xl border border-white/5">
            {protocols.map((p) => (
              <button
                key={p}
                onClick={() => setProtocol(p)}
                className={`py-1.5 px-2 text-xs font-medium rounded-lg text-center transition-all cursor-pointer ${
                  protocol === p
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* DNS Server Selector */}
        <div>
          <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block mb-1.5">
            Encrypted DNS Resolver
          </label>
          <select
            value={dnsServer}
            onChange={(e) => setDnsServer(e.target.value)}
            className="w-full bg-[#0A0A0B] border border-white/5 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {dnsServers.map((srv) => (
              <option key={srv.value} value={srv.value}>
                {srv.label}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Switches */}
        <div className="space-y-2.5">
          {/* Kill Switch Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] border border-white/5">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                Network Kill Switch
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                Block traffic if VPN fails
              </span>
            </div>
            <button
              onClick={() => setKillSwitch(!killSwitch)}
              className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              {killSwitch ? (
                <ToggleRight className="h-7 w-7 text-blue-500" />
              ) : (
                <ToggleLeft className="h-7 w-7 text-slate-600" />
              )}
            </button>
          </div>

          {/* Auto Connect Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] border border-white/5">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-blue-400" />
                Auto-Connect on Startup
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                Connect automatically on boot
              </span>
            </div>
            <button
              onClick={() => setAutoConnect(!autoConnect)}
              className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              {autoConnect ? (
                <ToggleRight className="h-7 w-7 text-blue-500" />
              ) : (
                <ToggleLeft className="h-7 w-7 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
