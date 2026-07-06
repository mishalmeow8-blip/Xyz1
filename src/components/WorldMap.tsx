import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VPNServer, VPNStatus } from '../types';
import { COUNTRY_EMOJIS } from '../data/servers';
import { Shield, ShieldCheck, MapPin, Radio, Zap } from 'lucide-react';

interface WorldMapProps {
  servers: VPNServer[];
  selectedServer: VPNServer;
  onSelectServer: (server: VPNServer) => void;
  status: VPNStatus;
  homeCoords: { x: number; y: number };
  setHomeCoords: (coords: { x: number; y: number }) => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  servers,
  selectedServer,
  onSelectServer,
  status,
  homeCoords,
  setHomeCoords,
}) => {
  const [hoveredServer, setHoveredServer] = useState<VPNServer | null>(null);

  // Simplified continent outlines for a stylized high-tech map look (800x400 viewbox)
  const continents = [
    // North America
    'M 80,80 L 160,80 L 220,100 L 250,150 L 180,210 L 160,190 L 110,230 L 100,160 Z',
    // Greenland
    'M 260,40 L 310,45 L 290,75 L 250,60 Z',
    // South America
    'M 180,220 L 240,240 L 240,280 L 210,360 L 190,380 L 180,310 Z',
    // Africa
    'M 360,180 L 410,170 L 460,200 L 480,260 L 460,330 L 410,310 L 370,220 Z',
    // Madagascar
    'M 485,300 L 495,310 L 485,330 L 475,320 Z',
    // Eurasia (Europe + Asia)
    'M 320,110 L 380,80 L 480,80 L 580,70 L 700,90 L 740,140 L 700,210 L 610,270 L 540,210 L 420,180 L 350,140 Z',
    // India
    'M 530,210 L 560,210 L 545,245 Z',
    // Indochina / SE Asia
    'M 600,220 L 635,240 L 615,265 Z',
    // Australia
    'M 660,310 L 730,300 L 750,340 L 700,370 L 660,330 Z',
    // New Zealand
    'M 760,370 L 775,385 L 755,400 Z',
  ];

  // Calculate bezier curve for the VPN tunnel line
  const getTunnelPath = () => {
    const x1 = homeCoords.x;
    const y1 = homeCoords.y;
    const x2 = selectedServer.longitude;
    const y2 = selectedServer.latitude;

    // Control point is pushed upwards to create a nice arc
    const cx = (x1 + x2) / 2;
    const cy = Math.min(y1, y2) - 50; // Arc height

    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only allow setting home coordinate if we are disconnected
    if (status !== 'disconnected') return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 400;

    // Avoid setting home directly on top of a server to avoid visual overlap
    const onServer = servers.some(
      (s) => Math.hypot(s.longitude - x, s.latitude - y) < 15
    );

    if (!onServer) {
      setHomeCoords({ x, y });
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/5 bg-[#0F0F12] p-5 shadow-2xl transition-all duration-300">
      {/* Map Header Overlay */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
          <Radio className={`h-3 w-3 ${status === 'connected' ? 'text-blue-500 animate-pulse' : 'text-slate-600'}`} />
          Visual Tunnel Interface
        </div>
        <div className="text-sm font-medium text-slate-200 font-sans">
          {status === 'connected' ? (
            <span className="flex items-center gap-1.5 text-blue-400">
              <ShieldCheck className="h-4 w-4 text-blue-500" /> Secure Tunnel Active
            </span>
          ) : status === 'connecting' ? (
            <span className="flex items-center gap-1.5 text-blue-400/80 animate-pulse">
              <Shield className="h-4 w-4 text-blue-400" /> Establishing Encryption...
            </span>
          ) : (
            <span className="text-slate-500">Click map to set your physical origin</span>
          )}
        </div>
      </div>

      {/* Map SVG Canvas */}
      <div className="w-full h-auto aspect-[2/1] relative">
        <svg
          viewBox="0 0 800 400"
          className="w-full h-full cursor-crosshair select-none"
          onClick={handleMapClick}
        >
          {/* Subtle grid background */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="800" height="400" fill="url(#grid)" rx="12" />

          {/* Continents */}
          <g fill="rgba(255, 255, 255, 0.03)" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1.2">
            {continents.map((path, index) => (
              <path key={index} d={path} className="transition-colors duration-500 hover:fill-white/[0.06]" />
            ))}
          </g>

          {/* VPN Tunnel Connection Line */}
          {status !== 'disconnected' && (
            <g>
              {/* Glow backing path */}
              <motion.path
                d={getTunnelPath()}
                fill="none"
                stroke={status === 'connected' ? '#2563eb' : '#3b82f6'}
                strokeWidth="5"
                strokeOpacity="0.15"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />

              {/* Core animated tunnel path */}
              <motion.path
                id="tunnel-wire"
                d={getTunnelPath()}
                fill="none"
                stroke={status === 'connected' ? '#3b82f6' : '#60a5fa'}
                strokeWidth="1.5"
                strokeDasharray="6 4"
                initial={{ pathLength: 0 }}
                animate={{
                  pathLength: 1,
                  strokeDashoffset: [0, -100],
                }}
                transition={{
                  pathLength: { duration: 0.8, ease: 'easeOut' },
                  strokeDashoffset: { repeat: Infinity, duration: 4, ease: 'linear' },
                }}
              />

              {/* Data packet pulses traveling the tunnel */}
              {status === 'connected' && (
                <motion.circle r="3.5" fill="#60a5fa" filter="drop-shadow(0 0 4px #2563eb)">
                  <animateMotion dur="2s" repeatCount="indefinite" path={getTunnelPath()} />
                </motion.circle>
              )}
            </g>
          )}

          {/* User / Origin Location Pin */}
          <g transform={`translate(${homeCoords.x}, ${homeCoords.y})`}>
            {/* Animated sonar ring */}
            <circle r="14" fill="none" stroke="#2563eb" strokeWidth="1" className="animate-ping opacity-25" />
            <circle r="6" fill="#2563eb" className="shadow-lg" />
            <circle r="2.5" fill="#ffffff" />
          </g>

          {/* VPN Server Pins */}
          {servers.map((server) => {
            const isSelected = server.id === selectedServer.id;
            return (
              <g
                key={server.id}
                transform={`translate(${server.longitude}, ${server.latitude})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectServer(server);
                }}
                onMouseEnter={() => setHoveredServer(server)}
                onMouseLeave={() => setHoveredServer(null)}
                className="cursor-pointer group"
              >
                {/* Sonar alert on selected server when connected */}
                {isSelected && status === 'connected' && (
                  <circle r="16" fill="none" stroke="#3b82f6" strokeWidth="1.5" className="animate-ping opacity-35" />
                )}

                {/* Outer ring */}
                <circle
                  r={isSelected ? '8' : '5'}
                  fill={isSelected ? '#0A0A0B' : 'rgba(255, 255, 255, 0.05)'}
                  stroke={
                    isSelected
                      ? '#3b82f6'
                      : server.load > 75
                      ? 'rgba(239, 68, 68, 0.5)'
                      : 'rgba(255, 255, 255, 0.2)'
                  }
                  strokeWidth="1.5"
                  className="transition-all duration-300 group-hover:scale-125"
                />

                {/* Server status center dot */}
                <circle
                  r="2.5"
                  fill={
                    isSelected
                      ? '#3b82f6'
                      : server.load > 75
                      ? '#ef4444'
                      : '#3b82f6'
                  }
                  className="transition-all duration-300"
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltips & Legends */}
        <AnimatePresence>
          {hoveredServer && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="absolute pointer-events-none p-3 rounded-xl border border-white/10 bg-[#0F0F12]/95 backdrop-blur-md shadow-2xl text-xs flex flex-col gap-1.5 min-w-[150px]"
              style={{
                left: `${(hoveredServer.longitude / 800) * 100}%`,
                top: `${(hoveredServer.latitude / 400) * 100}%`,
                transform: 'translate(-50%, -115%)',
              }}
            >
              <div className="flex items-center justify-between font-medium text-slate-100">
                <span className="flex items-center gap-1">
                  <span>{COUNTRY_EMOJIS[hoveredServer.countryCode]}</span>
                  <span>{hoveredServer.name}</span>
                </span>
                {hoveredServer.isPremium && (
                  <Zap className="h-3 w-3 text-blue-400 fill-blue-500" />
                )}
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Latency</span>
                <span className="font-mono text-blue-400">{hoveredServer.latency}ms</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Server Load</span>
                <span className={`font-mono font-medium ${hoveredServer.load > 75 ? 'text-red-400' : 'text-slate-300'}`}>
                  {hoveredServer.load}%
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1 mt-0.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${hoveredServer.load > 75 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${hoveredServer.load}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Origin Location Indicator Overlay */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/[0.03] backdrop-blur-sm border border-white/5 px-2.5 py-1.5 rounded-lg text-xs pointer-events-none">
          <MapPin className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-slate-400">Origin:</span>
          <span className="text-slate-200 font-mono">
            X:{Math.round(homeCoords.x)}, Y:{Math.round(homeCoords.y)}
          </span>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 right-4 flex items-center gap-4 bg-white/[0.03] backdrop-blur-sm border border-white/5 px-3 py-1.5 rounded-lg text-[10px] text-slate-400 pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            <span>Origin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span>Active/Low Load</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span>High Load (&gt;75%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
