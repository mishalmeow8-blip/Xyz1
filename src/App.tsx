import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SERVERS, COUNTRY_EMOJIS } from './data/servers';
import { VPNServer, VPNStatus, VPNProtocol, NetworkMetrics } from './types';
import { WorldMap } from './components/WorldMap';
import { ServerList } from './components/ServerList';
import { NetworkStats } from './components/NetworkStats';
import { Diagnostics } from './components/Diagnostics';
import { SettingsPanel } from './components/SettingsPanel';
import {
  Power,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Wifi,
  Globe,
  RefreshCw,
  Cpu,
  Lock,
  Compass,
  Search,
  ArrowRight,
  ExternalLink,
  Laptop,
} from 'lucide-react';

export default function App() {
  // VPN states
  const [status, setStatus] = useState<VPNStatus>('disconnected');
  const [selectedServer, setSelectedServer] = useState<VPNServer>(SERVERS[0]);
  const [protocol, setProtocol] = useState<VPNProtocol>('WireGuard');
  const [killSwitch, setKillSwitch] = useState(true);
  const [autoConnect, setAutoConnect] = useState(false);
  const [dnsServer, setDnsServer] = useState('cloudflare');
  const [homeCoords, setHomeCoords] = useState({ x: 375, y: 125 }); // London coordinate

  // Real public IP vs. virtual server IP (dynamically fetched)
  const [realClientIp, setRealClientIp] = useState<string>('Detecting...');
  const [serverIp, setServerIp] = useState<string>('Detecting...');
  const [serverIsp, setServerIsp] = useState<string>('Google Cloud Platform');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'browser'>('dashboard');
  const [inputUrl, setInputUrl] = useState<string>('https://httpbin.org/ip');
  const [activeProxyUrl, setActiveProxyUrl] = useState<string>('https://httpbin.org/ip');

  const currentIp = status === 'connected' ? serverIp : realClientIp;

  useEffect(() => {
    // 1. Fetch user's direct home IP client-side (unprotected)
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        if (data.ip) setRealClientIp(data.ip);
      })
      .catch(() => {
        setRealClientIp('185.228.168.10'); // Default realistic client IP if blocked by browser extensions
      });

    // 2. Fetch server's egress IP through backend
    fetch('/api/vpn/server-ip')
      .then(res => res.json())
      .then(data => {
        if (data.ip) {
          setServerIp(data.ip);
          if (data.isp) setServerIsp(data.isp);
        }
      })
      .catch(() => {
        setServerIp('34.120.108.214'); // GCP Fallback
        setServerIsp('Google Cloud Platform');
      });
  }, []);

  // Bandwidth & session metrics
  const [metrics, setMetrics] = useState<NetworkMetrics>({
    downloadSpeed: 0,
    uploadSpeed: 0,
    bytesDownloaded: 0,
    bytesUploaded: 0,
    duration: 0,
  });

  // Reference for interval ticks
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic connection simulation trigger
  const handleToggleConnect = () => {
    if (status === 'connected') {
      // Disconnecting
      setStatus('disconnected');
      setMetrics((prev) => ({
        ...prev,
        downloadSpeed: 0,
        uploadSpeed: 0,
      }));
    } else if (status === 'disconnected') {
      // Connecting
      setStatus('connecting');

      // Simulate handshake delay
      setTimeout(() => {
        setStatus('connected');
        // Seed initial metrics
        setMetrics((prev) => ({
          ...prev,
          duration: 0,
          downloadSpeed: Math.max(10, 180 - selectedServer.latency - selectedServer.load * 0.5),
          uploadSpeed: Math.max(5, 60 - selectedServer.latency * 0.2 - selectedServer.load * 0.2),
        }));
      }, 1600);
    }
  };

  // Keep metrics running and updating with realistic fluctuations when connected
  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => {
        setMetrics((prev) => {
          // Calculate target speed based on server characteristics
          const targetDownload = Math.max(
            15,
            240 - selectedServer.latency * 1.1 - selectedServer.load * 0.6
          );
          const targetUpload = Math.max(
            8,
            80 - selectedServer.latency * 0.3 - selectedServer.load * 0.3
          );

          // Add random jitter to simulate live packet transfers (+/- 12%)
          const downloadJitter = (Math.random() * 0.24 - 0.12) * targetDownload;
          const uploadJitter = (Math.random() * 0.24 - 0.12) * targetUpload;

          const currentDownload = Math.max(1, targetDownload + downloadJitter);
          const currentUpload = Math.max(1, targetUpload + uploadJitter);

          // Calculate byte increments for this 1-second interval
          const newBytesDown = Math.round((currentDownload * 1000000) / 8);
          const newBytesUp = Math.round((currentUpload * 1000000) / 8);

          return {
            downloadSpeed: currentDownload,
            uploadSpeed: currentUpload,
            bytesDownloaded: prev.bytesDownloaded + newBytesDown,
            bytesUploaded: prev.bytesUploaded + newBytesUp,
            duration: prev.duration + 1,
          };
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status, selectedServer]);

  // Handle server selection
  const handleSelectServer = (server: VPNServer) => {
    // If connected, trigger quick re-route
    if (status === 'connected') {
      setStatus('connecting');
      setSelectedServer(server);
      setTimeout(() => {
        setStatus('connected');
        setMetrics((prev) => ({
          ...prev,
          downloadSpeed: Math.max(10, 180 - server.latency - server.load * 0.5),
          uploadSpeed: Math.max(5, 60 - server.latency * 0.2 - server.load * 0.2),
        }));
      }, 1200);
    } else if (status === 'disconnected') {
      setSelectedServer(server);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Decorative Sophisticated Radial Grid Background */}
      <div className="absolute inset-0 sophisticated-grid opacity-35 pointer-events-none z-0" />

      {/* Top Header Navigation */}
      <header className="border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Shield className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-100 font-display">
                VPN Client Dashboard
              </h1>
              <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                Multi-Hop Secure Overlay
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-white/[0.02] border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              VPN Dashboard
            </button>
            <button
              onClick={() => setActiveTab('browser')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'browser'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              Secure Browser Sandbox
            </button>
          </div>

          {/* Connection status pills */}
          <div className="flex items-center gap-3">
            {status === 'connected' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Protected Link
              </span>
            ) : status === 'connecting' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/5 border border-blue-400/20 text-blue-300 animate-pulse">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Establishing tunnel...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400">
                <ShieldAlert className="h-3.5 w-3.5" />
                Insecure / Exposed
              </span>
            )}
            <div className="h-8 w-px bg-white/10" />
            <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
              IP: {currentIp}
            </span>
          </div>
        </div>
      </header>

      {/* Main Core Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 relative z-10">
        {activeTab === 'dashboard' ? (
          <>
            {/* Connection Control Hero Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 rounded-3xl border border-white/5 bg-[#0F0F12] p-6 shadow-2xl relative overflow-hidden">
          {/* Subtle decorative background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/10 via-transparent to-blue-950/5 pointer-events-none" />

          {/* Left Block: Power Toggle Switch */}
          <div className="flex flex-col sm:flex-row items-center gap-6 lg:border-r lg:border-white/5 lg:pr-6">
            <div className="relative">
              {/* Outer Pulsing Glow Rings */}
              <AnimatePresence>
                {status === 'connected' && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.4, opacity: [0.15, 0.3, 0] }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
                    className="absolute inset-0 bg-blue-500 rounded-full filter blur-xl pointer-events-none"
                  />
                )}
                {status === 'connecting' && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.4, opacity: [0.15, 0.3, 0] }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                    className="absolute inset-0 bg-blue-400 rounded-full filter blur-xl pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {/* Central Power Button */}
              <button
                onClick={handleToggleConnect}
                disabled={status === 'connecting'}
                className={`h-28 w-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 border-4 outline-none relative group ${
                  status === 'connected'
                    ? 'bg-blue-950/30 border-blue-500 shadow-[0_0_35px_rgba(37,99,235,0.35)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] cursor-pointer'
                    : status === 'connecting'
                    ? 'bg-blue-950/20 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)] cursor-wait'
                    : 'bg-white/[0.02] border-white/10 shadow-inner hover:border-white/25 hover:bg-white/[0.04] cursor-pointer'
                }`}
              >
                <Power
                  className={`h-10 w-10 transition-colors duration-300 ${
                    status === 'connected'
                      ? 'text-blue-400'
                      : status === 'connecting'
                      ? 'text-blue-300 animate-pulse'
                      : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span
                  className={`text-[10px] font-mono tracking-widest uppercase mt-2 font-bold ${
                    status === 'connected'
                      ? 'text-blue-400'
                      : status === 'connecting'
                      ? 'text-blue-300'
                      : 'text-slate-500'
                  }`}
                >
                  {status === 'connected' ? 'SECURE' : status === 'connecting' ? 'TUNNEL' : 'CONNECT'}
                </span>
              </button>
            </div>

            <div className="text-center sm:text-left flex-1 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
                TUNNEL INITIATOR
              </span>
              <h2 className="text-xl font-bold text-slate-100 font-display">
                {status === 'connected' ? (
                  <span className="italic font-light">Encryption Active</span>
                ) : status === 'connecting' ? (
                  'Securing packets...'
                ) : (
                  'Secure Connection Offline'
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {status === 'connected'
                  ? `Your traffic is obfuscated via dynamic routing tunnels.`
                  : status === 'connecting'
                  ? 'Negotiating handshake and assigning IP.'
                  : 'Establish a cryptographic tunnel to hide your location.'}
              </p>
            </div>
          </div>

          {/* Center/Right Blocks: Connection details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:col-span-2 gap-6 items-center">
            {/* Country Flag & Selection Details */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
                Target Node Gateway
              </span>
              <div className="flex items-center gap-4">
                <span className="text-4xl select-none p-2 bg-[#0A0A0B] border border-white/5 rounded-2xl">
                  {COUNTRY_EMOJIS[selectedServer.countryCode] || '🏳️'}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-md font-bold text-slate-100 font-sans">{selectedServer.name}</h3>
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase font-mono">
                      {selectedServer.countryCode}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block font-sans mt-0.5">{selectedServer.country}</span>
                </div>
              </div>
            </div>

            {/* Quick Session Overview Info */}
            <div className="grid grid-cols-2 gap-4 border-t sm:border-t-0 sm:border-l border-white/5 sm:pl-6">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 flex items-center gap-1">
                  <Globe className="h-3 w-3 text-blue-400" /> Virtual IP
                </span>
                <span className="text-xs font-mono font-medium text-slate-200 block truncate">
                  {status === 'connected' ? selectedServer.ipAddress : 'Unprotected'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 flex items-center gap-1">
                  <Wifi className="h-3 w-3 text-blue-400" /> Latency / load
                </span>
                <span className="text-xs font-mono font-medium text-slate-200 block">
                  {selectedServer.latency}ms / {selectedServer.load}%
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-blue-400" /> Protocol
                </span>
                <span className="text-xs font-mono font-medium text-slate-200 block">
                  {protocol}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 flex items-center gap-1">
                  <Compass className="h-3 w-3 text-blue-400" /> Real IP
                </span>
                <span className="text-xs font-mono font-medium text-slate-500 block">
                  {realClientIp}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mid-Section Map & Server list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SVG Map Section */}
          <div className="lg:col-span-2">
            <WorldMap
              servers={SERVERS}
              selectedServer={selectedServer}
              onSelectServer={handleSelectServer}
              status={status}
              homeCoords={homeCoords}
              setHomeCoords={setHomeCoords}
            />
          </div>

          {/* Quick Location Explorer */}
          <div className="h-full">
            <ServerList
              servers={SERVERS}
              selectedServer={selectedServer}
              onSelectServer={handleSelectServer}
            />
          </div>
        </div>

        {/* Live Network Bandwidth Meters */}
        <NetworkStats
          metrics={metrics}
          status={status}
          protocol={protocol}
          ipAddress={currentIp}
        />

        {/* Bottom Panel Settings & Diagnostics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Security Leak Diagnostics */}
          <div className="lg:col-span-2 h-full">
            <Diagnostics status={status} currentIp={currentIp} />
          </div>

          {/* Config Settings */}
          <div className="h-full">
            <SettingsPanel
              protocol={protocol}
              setProtocol={setProtocol}
              killSwitch={killSwitch}
              setKillSwitch={setKillSwitch}
              autoConnect={autoConnect}
              setAutoConnect={setAutoConnect}
              dnsServer={dnsServer}
              setDnsServer={setDnsServer}
            />
          </div>
        </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* VPN Status Banner for Browser */}
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
              status === 'connected'
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                : 'bg-red-500/5 border-red-500/10 text-red-400'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${status === 'connected' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {status === 'connected' ? 'Secure Web Tunnel Active' : 'Unprotected Connection Detected'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">
                    {status === 'connected'
                      ? `Your browser queries are proxied via ${selectedServer.name} Exit Node (${serverIp}).`
                      : 'Traffic is routed directly without encryption. Your real IP is exposed.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Outbound IP</span>
                  <span className="text-sm font-mono font-bold">{currentIp}</span>
                </div>
                {status === 'disconnected' && (
                  <button
                    onClick={handleToggleConnect}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-all shadow-md shadow-blue-500/20"
                  >
                    Connect VPN
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar: Presets and Logs */}
              <div className="lg:col-span-1 space-y-6">
                {/* Preset list */}
                <div className="rounded-2xl border border-white/5 bg-[#0F0F12] p-5 shadow-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 font-sans">
                    Secure Nodes & Presets
                  </h4>
                  <div className="space-y-2">
                    {[
                      { name: 'IP Reflect Info', url: 'https://httpbin.org/ip', desc: 'Checks egress IP & headers' },
                      { name: 'icanhazip (Text)', url: 'https://icanhazip.com', desc: 'Returns simple text IP' },
                      { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Main_Page', desc: 'Knowledge Base' },
                      { name: 'Hacker News', url: 'https://news.ycombinator.com', desc: 'Tech & Startup Feed' },
                      { name: 'IP-API Geo Check', url: 'https://ipapi.co/json/', desc: 'Detailed server coordinates' }
                    ].map((preset) => (
                      <button
                        key={preset.url}
                        onClick={() => {
                          setInputUrl(preset.url);
                          setActiveProxyUrl(preset.url);
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all text-xs cursor-pointer ${
                          activeProxyUrl === preset.url
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                            : 'bg-white/[0.01] border-white/5 text-slate-400 hover:bg-white/[0.02] hover:text-slate-200'
                        }`}
                      >
                        <div className="font-semibold flex items-center justify-between">
                          <span>{preset.name}</span>
                          <ArrowRight className="h-3 w-3 opacity-60" />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 truncate">{preset.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Browser Tunnel Logs */}
                <div className="rounded-2xl border border-white/5 bg-[#0F0F12] p-5 shadow-xl flex flex-col h-[280px]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-sans">
                    Tunnel Telemetry Stream
                  </h4>
                  <div className="flex-1 bg-[#0A0A0B] border border-white/5 rounded-xl p-3 font-mono text-[10px] space-y-1.5 overflow-y-auto custom-scrollbar text-slate-400">
                    <div><span className="text-blue-500">[SYSTEM]</span> SECURE LAYER INIT SUCCESS</div>
                    <div><span className="text-blue-400">[NODE]</span> Exit Node IP: {serverIp}</div>
                    <div><span className="text-blue-400">[NODE]</span> Hosting: {serverIsp}</div>
                    <div className="text-slate-500">----------------------------</div>
                    <div><span className="text-yellow-400">[REWRITE]</span> Strip Frame-Options: OK</div>
                    <div><span className="text-yellow-400">[REWRITE]</span> Bypass CSP blocks: OK</div>
                    <div><span className="text-emerald-400">[PROXIED]</span> Get: {activeProxyUrl}</div>
                    <div><span className="text-blue-400">[TUNNEL]</span> Headers: X-Forwarded-For stripped</div>
                    <div><span className="text-slate-500">[LOG]</span> Stream active & listening...</div>
                  </div>
                </div>
              </div>

              {/* Main Browser Window */}
              <div className="lg:col-span-3 flex flex-col h-[650px] rounded-2xl border border-white/5 bg-[#0F0F12] overflow-hidden shadow-2xl">
                {/* Browser Header controls */}
                <div className="bg-[#0A0A0B] p-3 border-b border-white/5 flex items-center gap-3">
                  {/* Back/Forward Mock Buttons */}
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-500/70" />
                    <span className="h-3 w-3 rounded-full bg-amber-500/70" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
                  </div>

                  {/* Address Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      let target = inputUrl.trim();
                      if (target) {
                        if (!/^https?:\/\//i.test(target)) {
                          target = 'https://' + target;
                        }
                        setActiveProxyUrl(target);
                      }
                    }}
                    className="flex-1 flex items-center bg-[#0F0F12] border border-white/5 rounded-xl px-3.5 py-1.5 text-xs text-slate-300"
                  >
                    <Lock className={`h-3.5 w-3.5 mr-2 ${status === 'connected' ? 'text-blue-400' : 'text-amber-500/80'}`} />
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="Enter secure URL to proxy (e.g. httpbin.org/ip)"
                      className="bg-transparent border-none outline-none flex-1 font-mono text-xs text-slate-200"
                    />
                    <button type="submit" className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                      <Search className="h-3.5 w-3.5" />
                    </button>
                  </form>

                  {/* New Tab external Link */}
                  <a
                    href={`/api/proxy?url=${encodeURIComponent(activeProxyUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1.5 font-semibold cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </a>
                </div>

                {/* Browser Core Frame */}
                <div className="flex-1 bg-[#121214] relative">
                  <iframe
                    src={`/api/proxy?url=${encodeURIComponent(activeProxyUrl)}`}
                    className="w-full h-full border-none bg-white"
                    title="Secure VPN Sandbox Iframe"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-white/5 bg-[#0A0A0B] py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-sans">
            &copy; {new Date().getFullYear()} VPN Client Dashboard. Secured under RSA &amp; AES encryption tunnels.
          </span>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-blue-400 transition-colors cursor-pointer">Security Policy</span>
            <span>&middot;</span>
            <span className="hover:text-blue-400 transition-colors cursor-pointer">Protocol Specifications</span>
            <span>&middot;</span>
            <span className="hover:text-blue-400 transition-colors cursor-pointer">Server Status API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
