import { useState, useEffect } from 'react';
import { Cpu, Wifi, WifiOff } from 'lucide-react';

export default function Header({ connected, status }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <header
      className="flex items-center justify-between py-5 px-1"
      style={{ borderBottom: '1px solid rgba(245,200,66,0.1)' }}
    >
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #f5c842, #e07b00)', boxShadow: '0 0 18px rgba(245,200,66,0.4)' }}
        >
          <Cpu size={20} color="#000" strokeWidth={2.5} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold gradient-text tracking-tight">Edge Sense</span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(245,200,66,0.12)', color: '#f5c842', border: '1px solid rgba(245,200,66,0.25)' }}
            >
              v2.0
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Battery Safety Intelligence Platform
          </p>
        </div>
      </div>

      {/* Center: Caterpillar Tag */}
      <div className="hidden md:flex flex-col items-center gap-1">
        <span className="text-[11px] tracking-widest uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>
          Powered for
        </span>
        <span
          className="text-sm font-bold tracking-wide uppercase px-3 py-1 rounded-lg"
          style={{ background: 'rgba(245,200,66,0.08)', color: '#f5c842', border: '1px solid rgba(245,200,66,0.2)' }}
        >
           
        </span>
      </div>

      {/* Right: Clock + Connection */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="font-mono text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{timeStr}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{dateStr}</div>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: connected ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${connected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          <div className="relative">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: connected ? 'var(--green)' : 'var(--red)' }}
            />
            {connected && (
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: 'var(--green)', opacity: 0.4 }}
              />
            )}
          </div>
          {connected
            ? <Wifi size={14} color="var(--green)" />
            : <WifiOff size={14} color="var(--red)" />
          }
          <span className="text-xs font-semibold" style={{ color: connected ? 'var(--green)' : 'var(--red)' }}>
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </header>
  );
}
