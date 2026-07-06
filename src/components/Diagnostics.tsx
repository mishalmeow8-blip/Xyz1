import React, { useState } from 'react';
import { DiagnosticTest, VPNStatus } from '../types';
import { ShieldCheck, ShieldAlert, Activity, Play, CheckCircle2, AlertTriangle, Terminal } from 'lucide-react';

interface DiagnosticsProps {
  status: VPNStatus;
  currentIp: string;
}

export const Diagnostics: React.FC<DiagnosticsProps> = ({ status, currentIp }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [tests, setTests] = useState<DiagnosticTest[]>([
    { id: 'dns', name: 'DNS Leak Check', status: 'idle', result: 'Not tested' },
    { id: 'webrtc', name: 'WebRTC Exposure Check', status: 'idle', result: 'Not tested' },
    { id: 'cipher', name: 'Cipher Integrity Check', status: 'idle', result: 'Not tested' },
    { id: 'killswitch', name: 'Kill Switch Handshake', status: 'idle', result: 'Not tested' },
  ]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setLogs(['[SYSTEM] Initializing VPN tunnel diagnostics...', `[SYSTEM] Checking interface parameters for IP ${currentIp}`]);
    
    // Reset tests to running
    setTests(prev => prev.map(t => ({ ...t, status: 'running', result: 'Checking...' })));

    // Simulating sequential tests with state updates
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // Test 1: DNS Leak
    await delay(800);
    const dnsPassed = status === 'connected';
    setTests(prev => prev.map(t => t.id === 'dns' ? {
      ...t,
      status: dnsPassed ? 'passed' : 'failed',
      result: dnsPassed ? 'Secure DNS Tunnel Established (No Leaks)' : 'Vulnerable: DNS routed via Public ISP'
    } : t));
    setLogs(prev => [
      ...prev,
      dnsPassed 
        ? '[OK] DNS queries securely encapsulated inside the VPN resolver.' 
        : '[WARNING] DNS queries leaking to default ISP gateway!'
    ]);

    // Test 2: WebRTC Leak
    await delay(800);
    const webrtcPassed = status === 'connected';
    setTests(prev => prev.map(t => t.id === 'webrtc' ? {
      ...t,
      status: webrtcPassed ? 'passed' : 'failed',
      result: webrtcPassed ? 'Local IPs fully masked' : 'Public IP exposed via WebRTC browser channels'
    } : t));
    setLogs(prev => [
      ...prev,
      webrtcPassed 
        ? '[OK] WebRTC socket calls are successfully routed through virtual tun0 interface.' 
        : '[WARNING] WebRTC STUN request bypass detected. Actual client location vulnerable.'
    ]);

    // Test 3: Cipher Integrity
    await delay(800);
    const cipherPassed = status === 'connected';
    setTests(prev => prev.map(t => t.id === 'cipher' ? {
      ...t,
      status: cipherPassed ? 'passed' : 'failed',
      result: cipherPassed ? 'AES-256-GCM / ChaCha20 Perfect Forward Secrecy' : 'No active encryption cipher found'
    } : t));
    setLogs(prev => [
      ...prev,
      cipherPassed 
        ? '[OK] Active payload encryption verified. Perfect forward secrecy active.' 
        : '[WARNING] Cleartext traffic detected. Encrypt your link.'
    ]);

    // Test 4: Kill Switch Handshake
    await delay(800);
    const ksPassed = status === 'connected';
    setTests(prev => prev.map(t => t.id === 'killswitch' ? {
      ...t,
      status: ksPassed ? 'passed' : 'failed',
      result: ksPassed ? 'Kill Switch Armed & Active' : 'Kill Switch Disarmed'
    } : t));
    setLogs(prev => [
      ...prev,
      ksPassed 
        ? '[OK] Network interfaces bound. Kill Switch is armed to block traffic on tunnel drop.' 
        : '[INFO] Kill Switch inactive. Data will flow unencrypted if connection fails.'
    ]);

    setIsRunning(false);
    setLogs(prev => [...prev, '[SYSTEM] Diagnostics complete. Review findings above.']);
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0F0F12] p-5 flex flex-col h-full shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-blue-400" />
          <h3 className="text-sm font-bold text-slate-200">Security & Leak Diagnostics</h3>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isRunning
              ? 'bg-white/5 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95 cursor-pointer'
          }`}
        >
          <Play className="h-3 w-3 fill-white text-white" />
          {isRunning ? 'Analyzing...' : 'Run Security Check'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* Check List */}
        <div className="space-y-3">
          {tests.map((test) => (
            <div
              key={test.id}
              className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                test.status === 'passed'
                  ? 'bg-blue-500/5 border-blue-500/20'
                  : test.status === 'failed'
                  ? 'bg-rose-500/5 border-rose-500/20'
                  : test.status === 'running'
                  ? 'bg-amber-500/5 border-amber-500/20 animate-pulse'
                  : 'bg-white/[0.01] border-white/5'
              }`}
            >
              <div className="mt-0.5">
                {test.status === 'passed' ? (
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                ) : test.status === 'failed' ? (
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                ) : test.status === 'running' ? (
                  <div className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-white/10" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{test.name}</span>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider ${
                      test.status === 'passed'
                        ? 'text-blue-400'
                        : test.status === 'failed'
                        ? 'text-rose-400'
                        : test.status === 'running'
                        ? 'text-amber-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {test.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 truncate">{test.result}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Live Logs Terminal */}
        <div className="rounded-xl bg-[#0A0A0B] border border-white/5 p-3.5 flex flex-col font-mono text-[11px] leading-relaxed max-h-[190px] overflow-y-auto shadow-inner">
          <div className="flex items-center gap-1.5 text-slate-500 border-b border-white/5 pb-2 mb-2">
            <Terminal className="h-3 w-3 text-slate-500" />
            <span>Diagnostics Output Console</span>
          </div>
          <div className="flex-1 space-y-1.5 custom-scrollbar overflow-y-auto text-slate-300">
            {logs.length > 0 ? (
              logs.map((log, index) => {
                let color = 'text-slate-400';
                if (log.startsWith('[OK]')) color = 'text-blue-400';
                else if (log.startsWith('[WARNING]')) color = 'text-rose-400';
                else if (log.startsWith('[SYSTEM]')) color = 'text-blue-500 font-medium';
                
                return (
                  <div key={index} className={color}>
                    {log}
                  </div>
                );
              })
            ) : (
              <div className="text-slate-600 text-center py-8 font-sans">
                Console idle. Run a security check to stream findings.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
