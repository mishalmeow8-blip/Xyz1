import React, { useState, useMemo } from 'react';
import { VPNServer } from '../types';
import { COUNTRY_EMOJIS } from '../data/servers';
import { Search, SlidersHorizontal, ShieldCheck, Zap, Signal, Compass } from 'lucide-react';

interface ServerListProps {
  servers: VPNServer[];
  selectedServer: VPNServer;
  onSelectServer: (server: VPNServer) => void;
}

type SortOption = 'latency' | 'load' | 'country';
type FilterOption = 'all' | 'recommended' | 'premium';

export const ServerList: React.FC<ServerListProps> = ({
  servers,
  selectedServer,
  onSelectServer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('latency');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Filter & sort logic
  const filteredAndSortedServers = useMemo(() => {
    let result = [...servers];

    // Search query matching city or country
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.country.toLowerCase().includes(q)
      );
    }

    // Filter by options
    if (filterBy === 'recommended') {
      // Recommend servers with load < 60% and latency < 60ms
      result = result.filter((s) => s.load < 60 && s.latency < 60);
    } else if (filterBy === 'premium') {
      result = result.filter((s) => s.isPremium);
    }

    // Sort by options
    result.sort((a, b) => {
      if (sortBy === 'latency') {
        return a.latency - b.latency;
      } else if (sortBy === 'load') {
        return a.load - b.load;
      } else {
        return a.country.localeCompare(b.country);
      }
    });

    return result;
  }, [servers, searchQuery, sortBy, filterBy]);

  const getLatencyColor = (latency: number) => {
    if (latency < 30) return 'text-blue-400';
    if (latency < 80) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getLoadColor = (load: number) => {
    if (load < 40) return 'bg-blue-500';
    if (load < 75) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/5 bg-[#0F0F12] p-5 flex-1 shadow-2xl">
      {/* Search Header */}
      <div className="relative mb-3.5">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-slate-500" />
        </span>
        <input
          type="text"
          placeholder="Search locations or countries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-white/[0.03] border border-white/5 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans"
        />
      </div>

      {/* Filter and Sort bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-white/5">
        <div className="flex items-center gap-1.5 bg-white/[0.02] p-0.5 rounded-lg border border-white/5">
          <button
            onClick={() => setFilterBy('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              filterBy === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterBy('recommended')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              filterBy === 'recommended'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Recommended
          </button>
          <button
            onClick={() => setFilterBy('premium')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
              filterBy === 'premium'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="h-3 w-3" /> Premium
          </button>
        </div>

        {/* Sort select */}
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-[#0A0A0B] border border-white/5 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="latency">Ping (Lowest)</option>
            <option value="load">Load (Lowest)</option>
            <option value="country">Country (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Server List Items */}
      <div className="flex-1 overflow-y-auto pr-1 max-h-[300px] lg:max-h-[380px] custom-scrollbar space-y-1.5">
        {filteredAndSortedServers.length > 0 ? (
          filteredAndSortedServers.map((server) => {
            const isSelected = server.id === selectedServer.id;
            return (
              <button
                key={server.id}
                onClick={() => onSelectServer(server)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all border ${
                  isSelected
                    ? 'bg-blue-600/10 border-blue-500/30 hover:bg-blue-600/15'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl select-none" role="img" aria-label={server.country}>
                    {COUNTRY_EMOJIS[server.countryCode] || '🏳️'}
                  </span>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-semibold ${isSelected ? 'text-blue-400' : 'text-slate-200'}`}>{server.name}</span>
                      {server.isPremium && (
                        <span className="flex items-center text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono">
                          <Zap className="h-2.5 w-2.5 mr-0.5 fill-blue-400" />
                          PREMIUM
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 block font-sans">{server.country}</span>
                  </div>
                </div>

                {/* Right side connection info */}
                <div className="flex items-center gap-4 text-right">
                  {/* Ping */}
                  <div className="flex flex-col items-end">
                    <span className={`text-xs font-mono font-medium ${getLatencyColor(server.latency)}`}>
                      {server.latency}ms
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans uppercase tracking-wider">Ping</span>
                  </div>

                  {/* Load bar */}
                  <div className="flex flex-col items-end w-14">
                    <div className="flex items-center justify-between w-full text-[10px] text-slate-500 font-mono mb-1">
                      <span>Load</span>
                      <span>{server.load}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getLoadColor(server.load)}`}
                        style={{ width: `${server.load}%` }}
                      />
                    </div>
                  </div>

                  {/* Selection dot */}
                  <div className="pl-1">
                    {isSelected ? (
                      <div className="h-5 w-5 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center">
                        <ShieldCheck className="h-3 w-3 text-blue-400" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-white/10 hover:border-white/20" />
                    )}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Compass className="h-8 w-8 text-slate-600 mb-2.5 animate-pulse" />
            <span className="text-sm font-semibold text-slate-400">No servers found</span>
            <span className="text-xs text-slate-500 mt-1">Try searching for a different country or city.</span>
          </div>
        )}
      </div>
    </div>
  );
};
