import { useState } from 'react';
import { ANDROID_PROJECT_FILES, AndroidFile } from '../data/androidProjectFiles';
import { Smartphone, Download, Code, FileCode, Copy, Check, Info, FolderOpen, ChevronRight } from 'lucide-react';

export function AndroidProjectViewer() {
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(ANDROID_PROJECT_FILES[4]); // Default to MainActivity.kt
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header / Info Board */}
      <div className="bg-gradient-to-r from-blue-950/20 via-[#0F0F12] to-blue-950/10 border border-white/5 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                Kotlin &amp; Compose
              </span>
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                Multi-Protocol Support
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
              Enterprise Android VPN Codebase
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl font-sans leading-relaxed">
              Fully complete, modular Android Studio Kotlin project. Pre-integrated with official <strong className="text-blue-300">WireGuard VPN SDK</strong>, <strong className="text-blue-300">OpenVPN raw sockets</strong>, and high-performance <strong className="text-blue-300">V2Ray VMess/VLESS routing</strong> configuration engines.
            </p>
          </div>

          <a
            href="/api/android/download"
            download
            className="w-full md:w-auto px-6 py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2.5 cursor-pointer text-sm"
          >
            <Download className="h-5 w-5" />
            Download Source Code (ZIP)
          </a>
        </div>
      </div>

      {/* Main split viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Directory explorer */}
        <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-[#0F0F12] p-5 shadow-xl space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 font-sans">
              Android Source Explorer
            </h4>
            <p className="text-[10px] text-slate-500 font-sans">
              Click any source file to inspect target code
            </p>
          </div>

          {/* Fake project structure tree */}
          <div className="bg-[#070709] border border-white/5 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <FolderOpen className="h-4 w-4 text-amber-500" />
              <span>AetherVPN /</span>
            </div>

            <div className="pl-4 space-y-2">
              {/* Top-level build files */}
              <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider pt-1 border-b border-white/5 pb-1 flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3" /> Gradle System
              </div>
              <div className="space-y-1 pl-2">
                {ANDROID_PROJECT_FILES.slice(0, 2).map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      selectedFile.path === file.path
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]'
                    }`}
                  >
                    <Code className="h-3.5 w-3.5 opacity-70" />
                    <span className="truncate">{file.name}</span>
                  </button>
                ))}
              </div>

              {/* Source Files block */}
              <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider pt-2 border-b border-white/5 pb-1 flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3" /> App Module Source
              </div>
              <div className="space-y-1 pl-2">
                {ANDROID_PROJECT_FILES.slice(2).map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      selectedFile.path === file.path
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]'
                    }`}
                  >
                    <FileCode className="h-3.5 w-3.5 opacity-70" />
                    <span className="truncate">{file.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Technical Summary */}
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-blue-400">
              <Info className="h-4.5 w-4.5" />
              <span className="text-xs font-bold">Android Studio Target</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              Designed as an compile-ready Android project. Gradle build target: <strong>API Level 34 (Android 14)</strong>, written in modern declarative <strong>Jetpack Compose</strong> and <strong>Kotlin DSL</strong>.
            </p>
          </div>
        </div>

        {/* Right column: Code Inspector */}
        <div className="lg:col-span-2 flex flex-col h-[650px] rounded-2xl border border-white/5 bg-[#0F0F12] overflow-hidden shadow-2xl">
          {/* Code Viewer Tab header */}
          <div className="bg-[#0A0A0B] px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/5 border border-white/5 rounded-lg text-slate-400">
                <FileCode className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-slate-200 block">
                  {selectedFile.name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Path: /android/{selectedFile.path}
                </span>
              </div>
            </div>

            {/* Interactive Clipboard Copy button */}
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Source</span>
                </>
              )}
            </button>
          </div>

          {/* Editor content block */}
          <div className="flex-1 bg-[#070709] p-5 overflow-y-auto custom-scrollbar">
            <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre select-all">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
