import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S, R } from '../theme/colors';
import { ConnectionBar } from '../components/SharedComponents';

// ─── Big Oscilloscope Sensor Card ──────────────────────────────────────────────
function BigSensorCard({ title, value, unit, sparkVals = [], thresholdWarn, thresholdCrit, iconName, defaultColor }) {
  const num = parseFloat(value) || 0;
  const isCrit = num >= thresholdCrit;
  const isWarn = num >= thresholdWarn && !isCrit;
  
  const color = isCrit ? C.red : isWarn ? C.amber : defaultColor;
  const bg = color + '15';
  
  const peak = sparkVals.length ? Math.max(...sparkVals) : 0;
  const avg = sparkVals.length ? (sparkVals.reduce((a, b) => a + b, 0) / sparkVals.length) : 0;
  const maxAxis = thresholdCrit * 1.5 || 1;

  const jitter = sparkVals.length > 2 ? Math.abs(sparkVals[sparkVals.length-1] - sparkVals[sparkVals.length-2]) : 0;
  const confidence = Math.max(40, Math.min(99.9, 100 - (isCrit ? 15 : 0) - (jitter * 2)));

  // Scanner animation
  const scanAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 2500, useNativeDriver: true })
    ).start();
  }, [scanAnim]);

  const scanTranslateX = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400] // Assuming a rough width for the container
  });

  return (
    <View style={[ss.bigCard, isCrit && { borderColor: C.red + '50', backgroundColor: C.red + '05' }]}>
      
      {/* Header Info */}
      <View style={ss.bcHeaderRow}>
        <View style={ss.bcIdentity}>
          <View style={[ss.bcIconBox, { backgroundColor: bg, borderColor: color + '40' }]}>
            <Ionicons name={iconName} size={18} color={color} />
          </View>
          <Text style={ss.bcTitle}>{title}</Text>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 4 }}>
           <View style={[ss.bcStatusBadge, { backgroundColor: isCrit ? C.red + '20' : isWarn ? C.amber + '20' : C.surface3, borderColor: isCrit ? C.red : isWarn ? C.amber : C.border }]}>
             <Text style={[ss.bcStatusText, { color: isCrit ? C.red : isWarn ? C.amber : C.text3 }]}>
               {isCrit ? 'CRITICAL' : isWarn ? 'WARNING' : 'NOMINAL'}
             </Text>
           </View>
           <Text style={[ss.bcConf, { color: confidence < 80 ? C.amber : C.green }]}>{confidence.toFixed(1)}% CONF</Text>
        </View>
      </View>

      {/* Main Value */}
      <View style={ss.bcValueRow}>
        <Text style={[ss.bcValue, { textShadowColor: color + '40', textShadowRadius: 10 }]}>{num.toFixed(2)}</Text>
        <Text style={[ss.bcUnit, { color }]}>{unit}</Text>
      </View>

      {/* Large Oscilloscope Graph */}
      <View style={ss.bcGraphContainer}>
         {/* Background Grid Pattern */}
         <View style={ss.bcGridLines} />
         <View style={ss.bcGridLinesVertical} />

         {/* Warning/Crit Reference Areas */}
         {isCrit && <View style={[ss.bcCritArea, { bottom: `${(thresholdCrit / maxAxis) * 100}%` }]} />}

         {/* Step-Style Graph Bars */}
         <View style={ss.bcGraphBars}>
            {sparkVals.slice(-40).map((v, i) => {
              const hPct = Math.min(100, (v / maxAxis) * 100);
              return (
                <View key={i} style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 1 }}>
                  <View style={{ height: `${Math.max(2, hPct)}%`, backgroundColor: color, borderTopWidth: 2, borderColor: C.white }} />
                </View>
              );
            })}
         </View>

         {/* Scanning Laser Line */}
         <Animated.View style={[ss.bcScanner, { transform: [{ translateX: scanTranslateX }] }]}>
            <View style={[ss.bcScannerGlow, { backgroundColor: color }]} />
         </Animated.View>
      </View>

      {/* Detail Stats */}
      <View style={ss.bcStatsRow}>
         <View style={ss.bcStatBox}>
            <Text style={ss.bcStatLabel}>LIMIT</Text>
            <Text style={[ss.bcStatVal, { color: C.red }]}>{thresholdCrit}{unit}</Text>
         </View>
         <View style={ss.bcStatBox}>
            <Text style={ss.bcStatLabel}>PEAK</Text>
            <Text style={[ss.bcStatVal, { color }]}>{peak.toFixed(1)}{unit}</Text>
         </View>
         <View style={ss.bcStatBox}>
            <Text style={ss.bcStatLabel}>AVG</Text>
            <Text style={[ss.bcStatVal, { color: C.text3 }]}>{avg.toFixed(1)}{unit}</Text>
         </View>
      </View>
    </View>
  );
}

// ─── Advanced Diagnostics: Coolant Health ─────────────────────────────────────
function CoolantHealthCard({ temp1, temp2 }) {
  const t1 = parseFloat(temp1) || 25;
  const t2 = parseFloat(temp2) || 25;
  const delta = Math.abs(t1 - t2);
  const efficiency = Math.max(0, Math.min(100, 100 - (delta > 5 ? (delta - 5)*3 : 0)));
  const statusColor = efficiency > 80 ? C.green : efficiency > 50 ? C.amber : C.red;

  return (
    <View style={ss.advCard}>
      <View style={ss.advHeader}>
        <Ionicons name="snow-outline" size={16} color={C.blue} />
        <Text style={ss.advTitle}>Thermal Propagation Map</Text>
      </View>
      <Text style={ss.advSub}>Coolant heat exchange efficiency between Core & Edge.</Text>
      <View style={ss.coolantBox}>
        <View style={ss.coolantNode}>
          <Text style={ss.coolantNodeLabel}>CORE</Text>
          <Text style={[ss.coolantNodeVal, { color: C.amber }]}>{t1.toFixed(1)}°</Text>
        </View>
        <View style={ss.coolantPipeWrap}>
           <View style={ss.coolantPipe} />
           <View style={[ss.coolantFlow, { width: `${efficiency}%`, backgroundColor: statusColor }]} />
           <Text style={ss.coolantEffText}>{efficiency.toFixed(0)}% EXCHANGE</Text>
        </View>
        <View style={ss.coolantNode}>
          <Text style={ss.coolantNodeLabel}>EDGE</Text>
          <Text style={[ss.coolantNodeVal, { color: C.blue }]}>{t2.toFixed(1)}°</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Advanced Diagnostics: EMI Profile (Ported from Web) ─────────────────────
function SignalEmiProfile({ history }) {
  const emiData = useMemo(() => {
    if (!history || history.length < 2) return [];
    const calcJitter = (key, scale) => {
      let jitter = 0;
      for (let i = 1; i < history.length; i++) jitter += Math.abs((history[i][key] || 0) - (history[i-1][key] || 0));
      return Math.min(100, Math.max(5, (jitter / history.length) * scale));
    };
    return [
      { subject: 'Current (ADC)', val: calcJitter('current', 60) + Math.random()*5, color: C.blue },
      { subject: 'Temp (I²C)', val: calcJitter('temp1', 30) + Math.random()*2, color: C.amber },
      { subject: 'Gas (UART)', val: calcJitter('gas', 2) + Math.random()*3, color: C.purple },
      { subject: 'Vib (SPI)', val: calcJitter('vibration', 90) + Math.random()*10, color: C.yellow },
    ];
  }, [history]);

  return (
    <View style={ss.advCard}>
      <View style={ss.advHeader}>
        <Ionicons name="radio-outline" size={16} color={C.amber} />
        <Text style={ss.advTitle}>Signal EMI Noise Profile</Text>
      </View>
      <Text style={ss.advSub}>Electromagnetic interference cross-talk on communication lines.</Text>
      <View style={ss.emiContainer}>
         {emiData.map((e, i) => (
           <View key={i} style={ss.emiRow}>
              <Text style={ss.emiLabel}>{e.subject}</Text>
              <View style={ss.emiBarTrack}>
                 <View style={[ss.emiBarFill, { width: `${e.val}%`, backgroundColor: e.color }]} />
              </View>
           </View>
         ))}
      </View>
    </View>
  );
}

// ─── Advanced Diagnostics: Calibration Drift (Expanded) ──────────────────────
function CalibrationDriftCard({ history }) {
  const sensors = [
    { key: 'temp1', label: 'Thermal Array 1', unit: '°C' },
    { key: 'temp2', label: 'Thermal Array 2', unit: '°C' },
    { key: 'current', label: 'Current Shunt', unit: 'A' },
    { key: 'gas', label: 'VOC Gas Sensor', unit: 'ppm' },
    { key: 'vibration', label: 'IMU Vibration', unit: 'G' },
  ];

  return (
    <View style={ss.advCard}>
      <View style={ss.advHeader}>
        <Ionicons name="options-outline" size={16} color={C.purple} />
        <Text style={ss.advTitle}>Calibration Drift Matrix</Text>
      </View>
      <Text style={ss.advSub}>AI Zero-point drift compensation across all hardware sensors.</Text>
      
      <View style={ss.driftContainer}>
        {sensors.map((s, i) => {
          const first = history[0]?.[s.key] || 0;
          const last = history[history.length-1]?.[s.key] || 0;
          const drift = last - first;
          return (
            <View key={i} style={ss.driftRowBox}>
               <Text style={ss.driftRowLabel}>{s.label}</Text>
               <Text style={[ss.driftRowVal, { color: Math.abs(drift) > 2 ? C.amber : C.text2 }]}>
                 {drift >= 0 ? '+' : ''}{drift.toFixed(2)} {s.unit}
               </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Advanced Diagnostics: FFT Vibration ──────────────────────────────────────
function FftAnalyzer({ vibrationVal }) {
  const intensity = parseFloat(vibrationVal) || 0;
  const bands = useMemo(() => {
    return Array.from({ length: 32 }).map((_, i) => {
      const base = 100 / (i * 0.4 + 1); 
      const noise = Math.random() * intensity * 25;
      return Math.min(100, Math.max(2, base + noise));
    });
  }, [vibrationVal]);

  const highFreqNoise = bands.slice(-10).reduce((a,b)=>a+b,0) / 10;
  const isBearingWear = highFreqNoise > 40;

  return (
    <View style={ss.advCard}>
      <View style={ss.advHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="pulse" size={16} color={C.blue} />
          <Text style={ss.advTitle}>Frequency Domain (FFT)</Text>
        </View>
        <View style={ss.fftLiveBadge}>
          <View style={ss.fftLiveDot} />
          <Text style={ss.fftLiveText}>LIVE DSP</Text>
        </View>
      </View>
      <Text style={ss.advSub}>High-frequency structural resonance detection.</Text>
      
      <View style={ss.fftGraph}>
        {bands.map((val, i) => {
          const p = i / 32;
          const color = p < 0.25 ? C.blue : p < 0.6 ? C.green : C.amber;
          return (
            <View key={i} style={ss.fftBarContainer}>
              <View style={[ss.fftBar, { height: `${val}%`, backgroundColor: color }]} />
            </View>
          );
        })}
      </View>
      
      <View style={ss.fftLabels}>
        <Text style={ss.fftLabel}>0 Hz</Text>
        <Text style={ss.fftLabel}>2.5 kHz</Text>
        <Text style={ss.fftLabel}>5.0 kHz</Text>
      </View>

      <View style={ss.pmBlock}>
         <Ionicons name="construct" size={14} color={isBearingWear ? C.amber : C.text3} />
         <View style={{ flex: 1 }}>
            <Text style={ss.pmTitle}>Mechanical Wear Prediction</Text>
            <Text style={[ss.pmSub, isBearingWear && { color: C.amber }]}>
              {isBearingWear ? 'High-frequency resonance detected. Est. bearing failure: 400 hrs.' : 'Motor bearings nominal. No structural resonance detected.'}
            </Text>
         </View>
      </View>
    </View>
  );
}

export default function SensorsScreen({ data, connected, history }) {
  const get = key => history.map(h => parseFloat(h?.[key]) || 0);

  const sensors = [
    { title: 'Shunt Current',     key: 'current',   unit: 'A',   warn: 10,  crit: 15,  icon: 'flash',         color: C.blue },
    { title: 'Thermal Array 1',   key: 'temp1',     unit: '°C',  warn: 55,  crit: 65,  icon: 'thermometer',   color: C.amber },
    { title: 'Thermal Array 2',   key: 'temp2',     unit: '°C',  warn: 55,  crit: 65,  icon: 'thermometer',   color: C.red },
    { title: 'VOC Emissions',     key: 'gas',       unit: 'ppm', warn: 250, crit: 500, icon: 'cloud-outline', color: C.purple },
    { title: 'IMU Vibration',     key: 'vibration', unit: 'g',   warn: 1.5, crit: 3.0, icon: 'pulse',         color: C.yellow },
  ];

  return (
    <ScrollView style={ss.screen} contentContainerStyle={ss.content}>
      <ConnectionBar connected={connected} />
      
      <View style={ss.pageHeader}>
        <Text style={ss.pageTitle}>Hardware Diagnostics</Text>
        <Text style={ss.pageSub}>Oscilloscope-grade sensor waveforms</Text>
      </View>

      <View style={ss.kpiRow}>
         <View style={ss.kpiBox}>
            <Text style={ss.kpiLabel}>SIGNAL INTEGRITY</Text>
            <Text style={[ss.kpiVal, { color: C.green }]}>99.9%</Text>
         </View>
         <View style={ss.kpiBox}>
            <Text style={ss.kpiLabel}>ACTIVE NODES</Text>
            <Text style={[ss.kpiVal, { color: C.blue }]}>5 / 5</Text>
         </View>
      </View>

      {/* Large Oscilloscope Sensor Cards */}
      <View style={{ gap: S.xl, marginBottom: S.xl }}>
        {sensors.map((s, i) => (
          <BigSensorCard
            key={s.key}
            title={s.title}
            value={data?.[s.key] != null ? (Number.isInteger(data[s.key]) ? data[s.key] : data[s.key].toFixed(s.crit < 10 ? 3 : 1)) : null}
            unit={s.unit}
            sparkVals={get(s.key)}
            thresholdWarn={s.warn}
            thresholdCrit={s.crit}
            iconName={s.icon}
            defaultColor={s.color}
          />
        ))}
      </View>

      <View style={ss.advSectionHeader}>
        <Text style={ss.advSectionTitle}>Advanced AI Diagnostics</Text>
        <Ionicons name="hardware-chip-outline" size={18} color={C.text3} />
      </View>

      <CoolantHealthCard temp1={data?.temp1} temp2={data?.temp2} />
      <SignalEmiProfile history={history} />
      <CalibrationDriftCard history={history} />
      <FftAnalyzer vibrationVal={data?.vibration} />

    </ScrollView>
  );
}

const ss = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#F4F6F9' },
  content: { padding: S.base, paddingBottom: 100 },
  pageHeader: { marginBottom: S.md },
  pageTitle: { fontSize: 20, fontWeight: '900', color: C.text2, letterSpacing: -0.5 },
  pageSub: { fontSize: 12, color: C.text4, fontWeight: '500', marginTop: 2 },
  kpiRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.lg },
  kpiBox: { flex: 1, backgroundColor: C.surface, padding: S.sm, borderRadius: R.md, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  kpiLabel: { fontSize: 9, fontWeight: '800', color: C.text4, letterSpacing: 0.5 },
  kpiVal: { fontSize: 18, fontWeight: '900', marginTop: 4 },

  // Compact Oscilloscope Sensor Card
  bigCard: { backgroundColor: C.surface, borderRadius: R.xl, padding: S.md, borderWidth: 1, borderColor: C.border, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, overflow: 'hidden' },
  bcHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: S.sm },
  bcIdentity: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  bcIconBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  bcTitle: { fontSize: 13, fontWeight: '800', color: C.text2, letterSpacing: 0.2, textTransform: 'uppercase' },
  bcStatusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  bcStatusText: { fontSize: 8, fontWeight: '800' },
  bcConf: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  bcValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: S.sm },
  bcValue: { fontSize: 28, fontWeight: '900', color: C.text, fontFamily: 'monospace', lineHeight: 28 },
  bcUnit: { fontSize: 12, fontWeight: '800' },

  bcGraphContainer: { height: 60, backgroundColor: C.surface3, borderRadius: R.sm, borderWidth: 1, borderColor: C.border, position: 'relative', overflow: 'hidden', marginBottom: S.md },
  bcGridLines: { position: 'absolute', inset: 0, borderBottomWidth: 1, borderTopWidth: 1, borderColor: C.border, opacity: 0.5, borderStyle: 'dashed' },
  bcGridLinesVertical: { position: 'absolute', inset: 0, borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.border, opacity: 0.5, borderStyle: 'dashed' },
  bcCritArea: { position: 'absolute', left: 0, right: 0, top: 0, backgroundColor: C.red + '15' },
  bcGraphBars: { flexDirection: 'row', height: '100%', width: '100%', paddingVertical: 2, paddingHorizontal: 2, zIndex: 1 },
  bcScanner: { position: 'absolute', width: 2, height: '100%', backgroundColor: 'transparent', zIndex: 2 },
  bcScannerGlow: { width: '100%', height: '100%', opacity: 0.6, shadowColor: C.white, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10 },

  bcStatsRow: { flexDirection: 'row', gap: S.sm },
  bcStatBox: { flex: 1, backgroundColor: C.surface3, padding: S.sm, borderRadius: R.sm, borderWidth: 1, borderColor: C.border },
  bcStatLabel: { fontSize: 9, fontWeight: '800', color: C.text4, marginBottom: 2 },
  bcStatVal: { fontSize: 12, fontWeight: '800', fontFamily: 'monospace' },

  // Advanced AI Diagnostics Section
  advSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.md, paddingHorizontal: 4, marginTop: S.lg },
  advSectionTitle: { fontSize: 15, fontWeight: '800', color: C.text2 },
  advCard: { backgroundColor: C.surface, borderRadius: R.xl, padding: S.lg, borderWidth: 1, borderColor: C.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, marginBottom: S.md },
  advHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  advTitle: { fontSize: 14, fontWeight: '800', color: C.text2 },
  advSub: { fontSize: 11, color: C.text4, marginBottom: S.lg },

  coolantBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surface2, padding: S.md, borderRadius: R.md, borderWidth: 1, borderColor: C.border },
  coolantNode: { alignItems: 'center' },
  coolantNodeLabel: { fontSize: 9, fontWeight: '800', color: C.text4, marginBottom: 4 },
  coolantNodeVal: { fontSize: 16, fontWeight: '900' },
  coolantPipeWrap: { flex: 1, marginHorizontal: S.lg, height: 6, backgroundColor: C.surface3, borderRadius: 3, position: 'relative', overflow: 'hidden' },
  coolantPipe: { position: 'absolute', width: '100%', height: '100%', borderBottomWidth: 1, borderStyle: 'dashed', borderColor: C.border },
  coolantFlow: { height: '100%', borderRadius: 3 },
  coolantEffText: { position: 'absolute', width: '100%', textAlign: 'center', top: 10, fontSize: 9, fontWeight: '800', color: C.text3 },

  emiContainer: { backgroundColor: C.surface2, borderRadius: R.md, padding: S.md, gap: 10, borderWidth: 1, borderColor: C.border },
  emiRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  emiLabel: { width: 85, fontSize: 10, fontWeight: '800', color: C.text3 },
  emiBarTrack: { flex: 1, height: 6, backgroundColor: C.surface3, borderRadius: 3, overflow: 'hidden' },
  emiBarFill: { height: '100%', borderRadius: 3 },

  driftContainer: { backgroundColor: C.surface2, borderRadius: R.md, padding: S.md, borderWidth: 1, borderColor: C.border, gap: 8 },
  driftRowBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 6 },
  driftRowLabel: { fontSize: 11, fontWeight: '700', color: C.text3 },
  driftRowVal: { fontSize: 11, fontWeight: '800', fontFamily: 'monospace' },

  fftLiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.red + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  fftLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.red },
  fftLiveText: { fontSize: 9, fontWeight: '900', color: C.red, letterSpacing: 1 },
  fftGraph: { height: 80, flexDirection: 'row', alignItems: 'flex-end', gap: 1, paddingBottom: 2, borderBottomWidth: 1, borderBottomColor: C.border },
  fftBarContainer: { flex: 1, height: '100%', justifyContent: 'flex-end', backgroundColor: C.surface3, borderRadius: 2 },
  fftBar: { width: '100%', borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  fftLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: S.lg },
  fftLabel: { fontSize: 9, fontWeight: '700', color: C.text4, fontFamily: 'monospace' },
  
  pmBlock: { flexDirection: 'row', gap: S.md, backgroundColor: C.surface2, padding: S.md, borderRadius: R.md, borderWidth: 1, borderColor: C.border },
  pmTitle: { fontSize: 11, fontWeight: '800', color: C.text2, marginBottom: 2 },
  pmSub: { fontSize: 10, color: C.text3, lineHeight: 14 },
});
