import { useState } from 'react';
import { Settings, Save, RotateCcw, Power, Bell, Shield, Radio, ShieldAlert } from 'lucide-react';

const DEFAULT = {
  cellMin: 3.6, cellMax: 4.2, tempWarn: 55, tempCrit: 65,
  currentWarn: 10, currentCrit: 15, gasWarn: 250, gasCrit: 500,
  vibrationWarn: 1.5, vibrationCrit: 3.0,
  mqttTopic: 'battery/live', updateInterval: 2, autoDisconnect: true
};

export default function SystemConfig({ data }) {
  const [cfg, setCfg] = useState(DEFAULT);
  const [saved, setSaved] = useState(false);
  const [relayLoading, setRelayLoading] = useState(false);

  const update = (k, v) => setCfg(prev => ({ ...prev, [k]: v }));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const manualRelay = async (action) => {
    setRelayLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setRelayLoading(false);
    alert(`Relay ${action} command sent`);
  };

  const SliderRow = ({ label, stateKey, min, max, step = 1, unit, color = 'var(--blue)' }) => {
    const val = cfg[stateKey];
    const pct = ((val - min) / (max - min)) * 100;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
          <div style={{ background: 'var(--surface-3)', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 14, color }}>{val.toFixed(step < 1 ? 2 : 0)}</span>
            <span style={{ fontSize: 11, color: 'var(--text-4)', marginLeft: 4 }}>{unit}</span>
          </div>
        </div>
        <div style={{ position: 'relative', padding: '10px 0' }}>
          {/* Custom slider track to show fill */}
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 4, background: 'var(--surface-3)', borderRadius: 2, transform: 'translateY(-50%)' }} />
          <div style={{ position: 'absolute', top: '50%', left: 0, width: `${pct}%`, height: 4, background: color, borderRadius: 2, transform: 'translateY(-50%)' }} />
          <input
            type="range" min={min} max={max} step={step} value={val}
            onChange={e => update(stateKey, parseFloat(e.target.value))}
            style={{ width: '100%', position: 'relative', zIndex: 10, opacity: 0, cursor: 'pointer', height: 20 }}
          />
          {/* Thumb visual */}
          <div style={{ position: 'absolute', top: '50%', left: `${pct}%`, width: 16, height: 16, background: 'white', border: `4px solid ${color}`, borderRadius: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>
          <span>{min}{unit}</span><span>{max}{unit}</span>
        </div>
      </div>
    );
  }

  const relayOn = data?.relay === 'CONNECTED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header" style={{ alignItems: 'flex-end' }}>
        <div><h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Settings color="var(--text-3)"/> System Parameters</h1><p className="page-sub">Protection limits, network settings & overrides</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setCfg(DEFAULT)}><RotateCcw size={14} /> Restore Defaults</button>
          <button className="btn btn-primary" onClick={save} style={{ background: saved ? 'var(--green)' : 'var(--blue)', color: 'white', borderColor: saved ? 'var(--green)' : 'var(--blue)' }}>
            <Save size={14} />{saved ? 'Saved Successfully' : 'Apply Configuration'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        
        {/* Protection Limits Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div className="card">
            <div className="card-header" style={{ background: 'var(--surface-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShieldAlert size={16} color="var(--text-2)"/> <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)' }}>Protection Envelopes</span></div>
            </div>
            
            <div style={{ padding: '16px 20px', background: 'var(--surface-3)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Hardware Auto-Disconnect</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>Automatically open relay when critical limits are reached.</div>
                </div>
                {/* Toggle Switch */}
                <div 
                  onClick={() => update('autoDisconnect', !cfg.autoDisconnect)}
                  style={{ width: 44, height: 24, borderRadius: 12, background: cfg.autoDisconnect ? 'var(--green)' : 'var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: cfg.autoDisconnect ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface-2)' }}>Cell Voltage Limits</div>
              <SliderRow label="Deep Discharge Cutoff" stateKey="cellMin" min={3.0} max={3.8} step={0.05} unit="V" />
              <SliderRow label="Overcharge Cutoff" stateKey="cellMax" min={4.0} max={4.5} step={0.05} unit="V" />
              
              <div style={{ padding: '12px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface-2)' }}>Thermal Limits</div>
              <SliderRow label="Warning Threshold" stateKey="tempWarn" min={40} max={70} unit="°C" color="var(--amber)" />
              <SliderRow label="Critical Threshold" stateKey="tempCrit" min={50} max={90} unit="°C" color="var(--red)" />
              
              <div style={{ padding: '12px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface-2)' }}>Current Limits</div>
              <SliderRow label="Overcurrent Warning" stateKey="currentWarn" min={5} max={20} unit="A" color="var(--amber)" />
              <SliderRow label="Overcurrent Critical" stateKey="currentCrit" min={10} max={30} unit="A" color="var(--red)" />

              <div style={{ padding: '12px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface-2)' }}>Vibration Limits</div>
              <SliderRow label="High Vibration Warning" stateKey="vibrationWarn" min={0.5} max={2.5} step={0.1} unit="g" color="var(--amber)" />
              <SliderRow label="Extreme Vibration Critical" stateKey="vibrationCrit" min={2.0} max={5.0} step={0.1} unit="g" color="var(--red)" />
            </div>
          </div>
          
        </div>

        {/* Network & Hardware Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Manual Relay Override */}
          <div className="card" style={{ border: relayOn ? '1px solid var(--green-border)' : '1px solid var(--red-border)' }}>
            <div className="card-header" style={{ background: relayOn ? 'var(--green-bg)' : 'var(--red-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Power size={16} color={relayOn ? 'var(--green)' : 'var(--red)'} />
                <span style={{ fontSize: 14, fontWeight: 700, color: relayOn ? 'var(--green-text)' : 'var(--red-text)' }}>Master Contactor Override</span>
              </div>
              <span className={`badge ${relayOn ? 'badge-green' : 'badge-red'}`} style={{ border: 'none', background: 'white' }}>{data?.relay ?? 'UNKNOWN'}</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
                Manually force the main solid-state relay to open or close. <strong style={{ color: 'var(--text-2)' }}>Warning:</strong> Overriding the contactor ignores current safety envelopes.
              </p>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  className="btn" 
                  style={{ flex: 1, padding: 16, background: relayOn ? 'var(--surface-3)' : 'var(--green)', color: relayOn ? 'var(--text-4)' : 'white', cursor: relayOn ? 'not-allowed' : 'pointer' }} 
                  disabled={relayLoading || relayOn} 
                  onClick={() => manualRelay('CONNECT')}
                >
                  <Shield size={18} /> CLOSE CONTACTOR (CONNECT)
                </button>
                <button 
                  className="btn" 
                  style={{ flex: 1, padding: 16, background: !relayOn ? 'var(--surface-3)' : 'var(--red)', color: !relayOn ? 'var(--text-4)' : 'white', cursor: !relayOn ? 'not-allowed' : 'pointer' }} 
                  disabled={relayLoading || !relayOn} 
                  onClick={() => manualRelay('DISCONNECT')}
                >
                  <ShieldAlert size={18} /> OPEN CONTACTOR (DISCONNECT)
                </button>
              </div>
            </div>
          </div>

          {/* Network Settings */}
          <div className="card">
            <div className="card-header" style={{ background: 'var(--surface-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Radio size={16} color="var(--text-2)"/> <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)' }}>Telemetry Network</span></div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'MQTT Broker URL', value: 'mqtt://localhost:1883', readonly: true },
                { label: 'Pub/Sub Topic', key: 'mqttTopic' },
                { label: 'Hardware Client ID', value: 'think360-edge-stm32', readonly: true },
              ].map(({ label, value, key, readonly }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                  <input
                    className="input"
                    value={key ? cfg[key] : value}
                    onChange={key ? e => update(key, e.target.value) : undefined}
                    readOnly={readonly}
                    style={{ 
                      fontFamily: 'var(--mono)', fontSize: 13, padding: '10px 14px',
                      background: readonly ? 'var(--surface-3)' : 'var(--surface)',
                      color: readonly ? 'var(--text-4)' : 'var(--text-2)',
                      borderColor: readonly ? 'transparent' : 'var(--border-2)'
                    }}
                  />
                </div>
              ))}
              
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>Data Publish Rate</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <input type="range" min={1} max={10} value={cfg.updateInterval} onChange={e => update('updateInterval', parseInt(e.target.value))} style={{ flex: 1, accentColor: 'var(--blue)' }} />
                  <div style={{ background: 'var(--blue-bg)', color: 'var(--blue)', padding: '6px 12px', borderRadius: 8, fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 14, minWidth: 60, textAlign: 'center' }}>
                    {cfg.updateInterval}s
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
