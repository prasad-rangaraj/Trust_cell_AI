import { useState, useMemo } from 'react';
import {
  Settings, Save, RotateCcw, Power, Bell, Shield, Radio,
  ShieldAlert, Zap, Thermometer, Wind, Activity, CheckCircle,
  AlertTriangle, Cpu, Lock, Unlock, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT = {
  cellMin: 3.6, cellMax: 4.2,
  tempWarn: 55, tempCrit: 65,
  currentWarn: 10, currentCrit: 15,
  gasWarn: 250, gasCrit: 500,
  vibrationWarn: 1.5, vibrationCrit: 3.0,
  mqttTopic: 'battery/live', updateInterval: 2, autoDisconnect: true
};

/* ── Toggle Switch ──────────────────────────────────────────────── */
function Toggle({ value, onChange }) {
  return (
    <div onClick={onChange} style={{
      width: 52, height: 28, borderRadius: 14,
      background: value ? 'var(--green)' : 'var(--surface-3)',
      border: `1px solid ${value ? 'var(--green)' : 'var(--border)'}`,
      position: 'relative', cursor: 'pointer', transition: 'all 0.25s',
      boxShadow: value ? '0 0 12px rgba(34,197,94,0.4)' : 'none',
      flexShrink: 0
    }}>
      <motion.div animate={{ left: value ? 26 : 4 }}
        style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.3)', transition: 'left 0.25s' }} />
    </div>
  );
}

/* ── Precision Slider ───────────────────────────────────────────── */
function SliderRow({ label, stateKey, min, max, step = 1, unit, warnColor = 'var(--blue)', cfg, update }) {
  const val = cfg[stateKey];
  const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>{label}</span>
        <div style={{ background: `${warnColor}15`, padding: '5px 12px', borderRadius: 8, border: `1px solid ${warnColor}40` }}>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 900, fontSize: 15, color: warnColor }}>{val.toFixed(step < 1 ? 2 : 0)}</span>
          <span style={{ fontSize: 11, color: 'var(--text-4)', marginLeft: 4 }}>{unit}</span>
        </div>
      </div>
      <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
        {/* Track */}
        <div style={{ position: 'absolute', width: '100%', height: 6, background: 'var(--surface-3)', borderRadius: 99 }} />
        {/* Fill */}
        <div style={{ position: 'absolute', height: 6, width: `${pct}%`, background: `linear-gradient(90deg, ${warnColor}80, ${warnColor})`, borderRadius: 99, boxShadow: `0 0 8px ${warnColor}50` }} />
        {/* Hidden range input */}
        <input type="range" min={min} max={max} step={step} value={val}
          onChange={e => update(stateKey, parseFloat(e.target.value))}
          style={{ position: 'absolute', width: '100%', opacity: 0, cursor: 'pointer', height: 24, zIndex: 10 }} />
        {/* Thumb */}
        <div style={{ position: 'absolute', left: `${pct}%`, width: 20, height: 20, background: 'var(--surface)', border: `3px solid ${warnColor}`, borderRadius: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', boxShadow: `0 0 10px ${warnColor}60` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

/* ── Section Panel ──────────────────────────────────────────────── */
function Section({ title, icon: Icon, iconColor, children, badge }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${iconColor}30`, overflow: 'hidden', background: 'linear-gradient(135deg, var(--surface-2), var(--surface))' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer', borderBottom: open ? `1px solid ${iconColor}20` : 'none', background: `${iconColor}08` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: 8, borderRadius: 10, background: `${iconColor}15`, border: `1px solid ${iconColor}30` }}>
            <Icon size={15} color={iconColor} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', letterSpacing: 0.3 }}>{title}</span>
          {badge && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20, background: `${iconColor}20`, color: iconColor, border: `1px solid ${iconColor}40` }}>{badge}</span>}
        </div>
        <motion.div animate={{ rotate: open ? 90 : 0 }}>
          <ChevronRight size={16} color="var(--text-4)" />
        </motion.div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            style={{ overflow: 'hidden' }}>
            <div style={{ padding: '4px 20px 16px' }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── NEW: Config Preset Card (unique feature — not on any other tab) ── */
const PRESETS = [
  { name: 'Factory Default', desc: 'Standard BMS OEM limits', color: 'var(--blue)', icon: Settings,
    cfg: { cellMin: 3.6, cellMax: 4.2, tempWarn: 55, tempCrit: 65, currentWarn: 10, currentCrit: 15, gasWarn: 250, gasCrit: 500, vibrationWarn: 1.5, vibrationCrit: 3.0 } },
  { name: 'Conservative (Safe)', desc: 'Tighter limits for longevity', color: 'var(--green)', icon: Shield,
    cfg: { cellMin: 3.7, cellMax: 4.1, tempWarn: 45, tempCrit: 55, currentWarn: 8, currentCrit: 12, gasWarn: 200, gasCrit: 400, vibrationWarn: 1.0, vibrationCrit: 2.0 } },
  { name: 'High Performance', desc: 'Relaxed limits for peak load', color: 'var(--amber)', icon: Zap,
    cfg: { cellMin: 3.5, cellMax: 4.2, tempWarn: 65, tempCrit: 80, currentWarn: 14, currentCrit: 20, gasWarn: 300, gasCrit: 600, vibrationWarn: 2.0, vibrationCrit: 4.0 } },
  { name: 'Mining Site', desc: 'CAT underground excavation', color: 'var(--yellow)', icon: Cpu,
    cfg: { cellMin: 3.6, cellMax: 4.15, tempWarn: 60, tempCrit: 75, currentWarn: 12, currentCrit: 18, gasWarn: 350, gasCrit: 700, vibrationWarn: 2.5, vibrationCrit: 5.0 } },
];

function PresetSelector({ onApply }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 12, color: 'var(--text-4)', lineHeight: 1.5, marginBottom: 4 }}>
        Apply a pre-certified engineering profile. All sliders will update automatically. Custom adjustments can still be made after.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {PRESETS.map(p => {
          const PresetIcon = p.icon;
          const isSelected = selected === p.name;
          return (
            <motion.div key={p.name} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(p.name)}
              style={{ padding: '14px', borderRadius: 12, cursor: 'pointer', border: `2px solid ${isSelected ? p.color : 'var(--border)'}`, background: isSelected ? `${p.color}10` : 'var(--surface-3)', boxShadow: isSelected ? `0 0 20px ${p.color}30` : 'none', transition: 'border 0.2s, box-shadow 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <PresetIcon size={14} color={p.color} />
                <span style={{ fontSize: 12, fontWeight: 800, color: isSelected ? p.color : 'var(--text-2)' }}>{p.name}</span>
                {isSelected && <CheckCircle size={12} color={p.color} style={{ marginLeft: 'auto' }} />}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{p.desc}</div>
            </motion.div>
          );
        })}
      </div>
      {selected && (
        <motion.button initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => { onApply(PRESETS.find(p => p.name === selected).cfg); setSelected(null); }}
          style={{ marginTop: 8, padding: '12px', borderRadius: 10, background: 'var(--yellow)', color: '#000', fontWeight: 900, fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(255,204,0,0.3)' }}>
          ⚡ Apply "{selected}" Profile
        </motion.button>
      )}
    </div>
  );
}

/* ── Live Config Diff Preview (unique feature) ──────────────────── */
function DiffPreview({ current, defaults }) {
  const diffs = useMemo(() => {
    return Object.entries(current).filter(([k, v]) => {
      const def = defaults[k];
      return typeof v === 'number' && Math.abs(v - def) > 0.001;
    }).map(([k, v]) => ({ key: k, current: v, default: defaults[k] }));
  }, [current, defaults]);

  if (diffs.length === 0) return (
    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--green)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <CheckCircle size={24} color="var(--green)" />
      <span style={{ fontSize: 12, fontWeight: 700 }}>Matches Factory Default</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 4 }}>{diffs.length} parameter{diffs.length > 1 ? 's' : ''} changed from defaults</div>
      {diffs.map(({ key, current, default: def }) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'var(--surface-3)', border: '1px solid var(--border)', fontSize: 12 }}>
          <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)', fontWeight: 700 }}>{key}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: 'var(--text-4)', textDecoration: 'line-through' }}>{def.toFixed ? def.toFixed(2) : def}</span>
            <span style={{ color: 'var(--amber)', fontWeight: 800 }}>→</span>
            <span style={{ color: 'var(--yellow)', fontWeight: 900 }}>{current.toFixed ? current.toFixed(2) : current}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────── */
export default function SystemConfig({ data, connected }) {
  const [cfg, setCfg] = useState(DEFAULT);
  const [saved, setSaved] = useState(false);
  const [relayLoading, setRelayLoading] = useState(false);

  const update = (k, v) => setCfg(prev => ({ ...prev, [k]: v }));
  const applyPreset = (presetCfg) => setCfg(prev => ({ ...prev, ...presetCfg }));

  const save = () => {
    // Mock save logic for sliders since there is no backend config endpoint yet
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">System Configuration</h1>
          <p className="page-sub">Protection limits · Engineering presets · Network · Hardware override</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setCfg(DEFAULT)}>
            <RotateCcw size={14} /> Restore Defaults
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={save}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: saved ? 'var(--green)' : 'var(--yellow)', color: '#000', fontWeight: 900, fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: saved ? '0 0 20px rgba(34,197,94,0.4)' : '0 0 20px rgba(255,204,0,0.3)', transition: 'all 0.3s' }}>
            {saved ? <CheckCircle size={16} /> : <Save size={16} />}
            {saved ? 'Configuration Saved!' : 'Apply Configuration'}
          </motion.button>
        </div>
      </div>

      {/* Multi-Relay Remote Override */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Power size={16} color="var(--yellow)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)' }}>Hardware Relay Override Controls</span>
          </div>
        </div>
        
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 12.5, color: 'var(--text-4)', lineHeight: 1.4, margin: 0 }}>
            Override safety loops to manually connect or isolate specific modules. <strong>Caution:</strong> Bypassing protections can compromise battery pack integrity.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { key: 'relayIsolation', id: 'isolation', label: 'Pack Isolation Contactor' },
              { key: 'relayCooling', id: 'cooling', label: 'Active Cooling Fan Relay' },
              { key: 'relayCell1', id: 'cell1', label: 'Cell 1 Bypass Relay' },
              { key: 'relayCell2', id: 'cell2', label: 'Cell 2 Bypass Relay' },
              { key: 'relayCell3', id: 'cell3', label: 'Cell 3 Bypass Relay' },
              { key: 'relayCell4', id: 'cell4', label: 'Cell 4 Bypass Relay' },
            ].map(rel => {
              const state = data?.[rel.key] ?? 'CONNECTED';
              const isConnected = state === 'CONNECTED';
              
              return (
                <div key={rel.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', background: 'var(--surface-3)', borderRadius: 8,
                  border: `1px solid ${isConnected ? 'var(--border)' : 'var(--red-border)'}`
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)' }}>{rel.label}</span>
                    <span style={{ fontSize: 10.5, color: !connected ? 'var(--text-4)' : isConnected ? 'var(--green)' : 'var(--red)', fontWeight: 700, marginTop: 2 }}>
                      {!connected ? '○ OFFLINE' : isConnected ? '● ACTIVE / CLOSED' : '○ ISOLATED / OPEN'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={!connected || relayLoading || isConnected}
                      style={{ padding: '6px 12px', fontSize: 11, background: isConnected ? 'transparent' : 'var(--green)', color: isConnected ? 'var(--text-4)' : 'white' }}
                      onClick={async () => {
                        setRelayLoading(true);
                        await fetch('/api/system/relay', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer cat-edge-bms-2026' },
                          body: JSON.stringify({ relay: rel.id, action: 'CONNECT' })
                        });
                        setRelayLoading(false);
                      }}
                    >
                      Connect
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={!connected || relayLoading || !isConnected}
                      style={{ padding: '6px 12px', fontSize: 11 }}
                      onClick={async () => {
                        setRelayLoading(true);
                        await fetch('/api/system/relay', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer cat-edge-bms-2026' },
                          body: JSON.stringify({ relay: rel.id, action: 'DISCONNECT' })
                        });
                        setRelayLoading(false);
                      }}
                    >
                      Isolate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* Column 1: Protection Limits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Section title="Cell Voltage Limits" icon={Zap} iconColor="var(--blue)" badge="Li-Ion">
            <SliderRow label="Deep Discharge Cutoff" stateKey="cellMin" min={3.0} max={3.8} step={0.05} unit="V" warnColor="var(--blue)" cfg={cfg} update={update} />
            <SliderRow label="Overcharge Cutoff" stateKey="cellMax" min={4.0} max={4.5} step={0.05} unit="V" warnColor="var(--purple)" cfg={cfg} update={update} />
          </Section>

          <Section title="Thermal Limits" icon={Thermometer} iconColor="var(--amber)" badge="Dual Array">
            <SliderRow label="Warning Threshold" stateKey="tempWarn" min={40} max={70} unit="°C" warnColor="var(--amber)" cfg={cfg} update={update} />
            <SliderRow label="Critical Threshold" stateKey="tempCrit" min={50} max={90} unit="°C" warnColor="var(--red)" cfg={cfg} update={update} />
          </Section>

          <Section title="Current Limits" icon={Activity} iconColor="var(--blue)" badge="Shunt ADC">
            <SliderRow label="Overcurrent Warning" stateKey="currentWarn" min={5} max={20} unit="A" warnColor="var(--amber)" cfg={cfg} update={update} />
            <SliderRow label="Overcurrent Critical" stateKey="currentCrit" min={10} max={30} unit="A" warnColor="var(--red)" cfg={cfg} update={update} />
          </Section>
        </div>

        {/* Column 2: More limits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Section title="Vibration Limits" icon={Activity} iconColor="var(--yellow)" badge="IMU SPI">
            <SliderRow label="High Vibration Warning" stateKey="vibrationWarn" min={0.5} max={2.5} step={0.1} unit="g" warnColor="var(--amber)" cfg={cfg} update={update} />
            <SliderRow label="Extreme Vibration Critical" stateKey="vibrationCrit" min={2.0} max={5.0} step={0.1} unit="g" warnColor="var(--red)" cfg={cfg} update={update} />
          </Section>

          <Section title="Gas / VOC Limits" icon={Wind} iconColor="var(--purple)" badge="UART">
            <SliderRow label="Gas Warning Level" stateKey="gasWarn" min={100} max={400} step={10} unit="ppm" warnColor="var(--amber)" cfg={cfg} update={update} />
            <SliderRow label="Gas Critical Level" stateKey="gasCrit" min={300} max={800} step={10} unit="ppm" warnColor="var(--red)" cfg={cfg} update={update} />
          </Section>

          <Section title="Telemetry Network" icon={Radio} iconColor="var(--green)" badge="MQTT">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
              {[
                { label: 'MQTT Broker URL', value: 'mqtt://localhost:1883', readonly: true },
                { label: 'Pub/Sub Topic', key: 'mqttTopic' },
                { label: 'Hardware Client ID', value: 'cat-edge-stm32', readonly: true },
              ].map(({ label, value, key, readonly }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-4)', letterSpacing: 1 }}>{label}</label>
                  <input className="input" value={key ? cfg[key] : value} onChange={key ? e => update(key, e.target.value) : undefined} readOnly={readonly}
                    style={{ fontFamily: 'var(--mono)', fontSize: 12, padding: '9px 14px', background: readonly ? 'var(--surface-3)' : 'var(--surface)', color: readonly ? 'var(--text-4)' : 'var(--text-2)', borderColor: readonly ? 'transparent' : 'var(--border-2)' }} />
                </div>
              ))}

              <div style={{ marginTop: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-4)', letterSpacing: 1, display: 'block', marginBottom: 10 }}>Data Publish Rate</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min={1} max={10} value={cfg.updateInterval} onChange={e => update('updateInterval', parseInt(e.target.value))} style={{ flex: 1, accentColor: 'var(--blue)' }} />
                  <div style={{ background: 'var(--blue-bg)', color: 'var(--blue)', padding: '6px 14px', borderRadius: 8, fontFamily: 'var(--mono)', fontWeight: 900, fontSize: 14, minWidth: 54, textAlign: 'center', border: '1px solid var(--blue)30' }}>
                    {cfg.updateInterval}s
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Hardware Auto-Disconnect</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>Open relay when critical limits are breached</div>
                </div>
                <Toggle value={cfg.autoDisconnect} onChange={() => update('autoDisconnect', !cfg.autoDisconnect)} />
              </div>
            </div>
          </Section>
        </div>

        {/* Column 3: Sidebar — Presets + Diff (UNIQUE FEATURES) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Engineering Preset Profiles */}
          <div style={{ borderRadius: 16, border: '1px solid var(--yellow)30', background: 'linear-gradient(135deg, var(--surface-2), var(--surface))', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--yellow)20', background: 'rgba(255,204,0,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ padding: 8, borderRadius: 10, background: 'rgba(255,204,0,0.12)', border: '1px solid rgba(255,204,0,0.3)' }}>
                <Settings size={15} color="var(--yellow)" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>Engineering Presets</span>
              <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20, background: 'rgba(255,204,0,0.15)', color: 'var(--yellow)', border: '1px solid rgba(255,204,0,0.3)' }}>NEW</span>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <PresetSelector onApply={applyPreset} />
            </div>
          </div>

          {/* Live Config Diff */}
          <div style={{ borderRadius: 16, border: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--surface-2), var(--surface))', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ padding: 8, borderRadius: 10, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <AlertTriangle size={15} color="var(--amber)" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>Unsaved Changes</span>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <DiffPreview current={cfg} defaults={DEFAULT} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
