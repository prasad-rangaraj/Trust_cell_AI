import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S, R } from '../theme/colors';
import {
  SafetyBanner, SectionTitle,
  StatCard, Card, CardHeader, CardBody, Badge, ProgressBar,
} from '../components/SharedComponents';

// Operations summary stacked bar
function OpsBar({ history }) {
  const counts = history.reduce((a, h) => {
    const s = h.status ?? 'Healthy';
    a[s] = (a[s] ?? 0) + 1;
    return a;
  }, {});
  const total = history.length || 1;
  const states = [
    { label: 'Healthy', color: C.green,  pct: Math.round(((counts.Healthy ?? 0) / total) * 100) },
    { label: 'Warning', color: C.amber,  pct: Math.round(((counts.Warning  ?? 0) / total) * 100) },
    { label: 'Critical', color: C.red,   pct: Math.round(((counts.Critical ?? 0) / total) * 100) },
  ];
  return (
    <View style={{ gap: S.sm }}>
      <Text style={ss.opsTitle}>Session State Distribution</Text>
      <View style={ss.opsBar}>
        {states.map(s => s.pct > 0 && (
          <View key={s.label} style={{ flex: s.pct, backgroundColor: s.color }} />
        ))}
      </View>
      <View style={ss.opsLegend}>
        {states.map(s => (
          <View key={s.label} style={ss.opsLegendItem}>
            <View style={[ss.opsDot, { backgroundColor: s.color }]} />
            <Text style={ss.opsLegendText}>
              {s.label} <Text style={{ color: s.color, fontWeight: '800' }}>{s.pct}%</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Alert Feed row
function AlertRow({ fault }) {
  const color = { Critical: C.red, Warning: C.amber, Healthy: C.green }[fault.severity] || C.text4;
  const icon  = { Critical: 'alert-circle', Warning: 'flash', Healthy: 'checkmark-circle' }[fault.severity] || 'information-circle';
  return (
    <View style={[ss.alertRow, { borderLeftColor: color }]}>
      <View style={{ marginTop: 2 }}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ss.alertType}>{fault.faultType}</Text>
        <Text style={ss.alertAction}>{fault.actionTaken}</Text>
      </View>
      <Text style={ss.alertTime}>
        {fault.timestamp
          ? new Date(fault.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          : '—'}
      </Text>
    </View>
  );
}

// New: Battery Cell visualization component
function BatteryCell({ index, voltage, active }) {
  // Assume a nominal range of 2.8V to 4.2V for lithium-ion
  const MIN_V = 2.8;
  const MAX_V = 4.2;
  const fillPct = active && voltage ? Math.max(0, Math.min(100, ((voltage - MIN_V) / (MAX_V - MIN_V)) * 100)) : 0;
  
  const healthColor = !active ? C.border2 : (voltage < 3.0 || voltage > 4.15) ? C.red : (voltage < 3.2 || voltage > 4.1) ? C.amber : C.green;

  return (
    <View style={ss.battWrapper}>
      {/* Battery Top Terminal */}
      <View style={[ss.battTerminal, { backgroundColor: active ? C.border : C.surface3 }]} />
      {/* Battery Body */}
      <View style={[ss.battBody, { borderColor: active ? C.border : C.surface3 }]}>
        {/* Fill level */}
        <View style={[ss.battFill, { height: `${fillPct}%`, backgroundColor: healthColor }]} />
        {/* Label Overlay */}
        <View style={ss.battLabelBox}>
          <Text style={[ss.battNum, { color: active ? C.white : C.text4 }]}>C{index}</Text>
          <Text style={[ss.battVolts, { color: active ? C.white : C.text4 }]}>
            {active && voltage ? voltage.toFixed(2) : '0.00'}<Text style={{ fontSize: 9 }}>V</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

// Historical Trend Card (Ported from Web)
function HistoryTrendCard({ title, subtitle, data, color, icon, unit = '' }) {
  const latest = data.length ? data[data.length - 1] : 0;
  const max = Math.max(...data, 0.1);
  return (
    <Card accentColor={color} style={{ marginBottom: S.md }}>
      <CardHeader>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={icon} size={16} color={color} />
          <Text style={{ fontSize: 14, fontWeight: '800', color: C.text2 }}>{title}</Text>
        </View>
        <Text style={{ fontSize: 16, fontWeight: '900', color, fontFamily: 'monospace' }}>{latest.toFixed(1)}{unit}</Text>
      </CardHeader>
      <CardBody>
        <Text style={{ fontSize: 11, color: C.text4, marginBottom: S.md }}>{subtitle}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 40, gap: 2 }}>
          {data.map((v, i) => (
             <View key={i} style={{ flex: 1, backgroundColor: color + (i === data.length - 1 ? 'FF' : '60'), height: `${Math.max(5, (v/max)*100)}%`, borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
          ))}
        </View>
      </CardBody>
    </Card>
  );
}

export default function DashboardScreen({ data, connected, history }) {
  const packV   = data ? (data.cell1 + data.cell2 + data.cell3 + data.cell4).toFixed(2) : null;
  const maxTemp = data ? Math.max(data.temp1 ?? 0, data.temp2 ?? 0) : null;
  const soc     = data ? (data.soc ?? 0) : null;
  const soh     = data ? (data.soh ?? data.batteryHealth) : null;
  const score   = data ? data.anomalyScore : null;

  const statusColor = {
    Healthy: C.green, Warning: C.amber, Critical: C.red,
  }[data?.status] || C.text4;

  const sparkV = history.slice(-20).map(h => h.cell1 + h.cell2 + h.cell3 + h.cell4);
  const sparkT = history.slice(-20).map(h => Math.max(h.temp1 ?? 0, h.temp2 ?? 0));
  const sparkS = history.slice(-20).map(h => h.anomalyScore ?? 0);
  const sparkH = history.slice(-20).map(h => h.batteryHealth ?? 100);

  // Predictive Analytics
  const currentLoad = data?.current ?? 0;
  const currentSoc = data?.soc ?? 100;
  let tteText = '--';
  let tteLabel = 'Predictive TTE';
  
  if (Math.abs(currentLoad) < 0.1) {
    tteText = 'N/A (Idle)';
    tteLabel = 'Time Remaining';
  } else if (currentLoad < 0) {
    const hoursToEmpty = (currentSoc / 100) * (100 / Math.abs(currentLoad));
    tteText = `${hoursToEmpty.toFixed(1)} hrs`;
    tteLabel = 'Time to Empty (TTE)';
  } else {
    const hoursToFull = ((100 - currentSoc) / 100) * (100 / currentLoad);
    tteText = `${hoursToFull.toFixed(1)} hrs`;
    tteLabel = 'Time to Full (TTF)';
  }

  const peakTempSession = history.reduce((max, h) => Math.max(max, h.temp1 ?? 0, h.temp2 ?? 0), 0);
  const peakLoadSession = history.reduce((max, h) => Math.max(max, Math.abs(h.current ?? 0)), 0);

  // Recent faults from history
  const recentFaults = history.filter(h => h.status && h.status !== 'Healthy').slice(-5).map(h => ({
    faultType: `${h.status} Event`,
    actionTaken: h.mlOp || 'Monitoring',
    severity: h.status,
    timestamp: h.ts,
  }));

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <ScrollView
      style={ss.screen}
      contentContainerStyle={ss.content}
      refreshControl={<RefreshControl refreshing={false} colors={[C.primary]} tintColor={C.primary} />}
    >
      {/* Command Center Header */}
      <View style={ss.headerBar}>
        <View style={ss.headerLeft}>
          <Ionicons name="shield-checkmark" size={24} color={C.primary} />
          <View>
            <Text style={ss.headerSys}>EDGE-BMS-01</Text>
            <Text style={ss.headerDate}>{today}</Text>
          </View>
        </View>
      </View>

      {/* Safety Banner */}
      <SafetyBanner
        status={data?.status ?? 'Healthy'}
        message={data?.mlOp ? `ML Op: ${data.mlOp}${data?.spn ? ` · J1939 SPN ${data.spn} FMI ${data.fmi}` : ''}` : 'All systems nominal'}
      />

      {/* KPI Grid — 2×2 */}
      <SectionTitle title="Pack Telemetry" sub="Live sensor readings" />
      <View style={ss.kpiGrid}>
        <View style={ss.kpiCol}>
          <StatCard
            label="State of Charge"
            value={soc != null ? soc.toFixed(1) : '0.0'}
            unit="%"
            sub={`Status: ${data?.chargeStatus ?? 'Idle'}`}
            color={C.primary}
            sparkData={sparkV}
          />
          <StatCard
            label="Battery Health"
            value={soh != null ? soh.toFixed(1) : '0.0'}
            unit="%"
            sub={`Active Cells: ${data?.activeCells ?? 4}/4`}
            color={statusColor}
            sparkData={sparkH}
          />
        </View>
        <View style={ss.kpiCol}>
          <StatCard
            label="Pack Voltage"
            value={packV ?? '0.0'}
            unit="V"
            color={C.blue}
            sparkData={sparkV}
          />
          <StatCard
            label="Max Temperature"
            value={maxTemp != null ? maxTemp.toFixed(1) : '0.0'}
            unit="°C"
            color={maxTemp > 50 ? C.red : maxTemp > 40 ? C.amber : C.green}
            sparkData={sparkT}
          />
        </View>
      </View>

      {/* Predictive Insights */}
      <SectionTitle title="Predictive Insights" sub="Estimations & Session Watermarks" />
      <Card>
        <CardBody style={{ gap: S.sm }}>
          <View style={ss.predRow}>
            <Text style={ss.predLabel}>{tteLabel}</Text>
            <Text style={[ss.predValue, { color: currentLoad > 0.1 ? C.green : currentLoad < -0.1 ? C.amber : C.text3 }]}>{tteText}</Text>
          </View>
          <View style={ss.predRow}>
            <Text style={ss.predLabel}>Peak Session Temp</Text>
            <Text style={[ss.predValue, { color: peakTempSession > 45 ? C.red : peakTempSession > 35 ? C.amber : C.green }]}>{peakTempSession.toFixed(1)} °C</Text>
          </View>
          <View style={ss.predRow}>
            <Text style={ss.predLabel}>Peak Session Load</Text>
            <Text style={[ss.predValue, { color: peakLoadSession > 50 ? C.amber : C.text2 }]}>{peakLoadSession.toFixed(1)} A</Text>
          </View>
        </CardBody>
      </Card>

      {/* Historical Trend Charts (Ported from Web) */}
      <SectionTitle title="Telemetry History" sub="System degradation & load trends" />
      <HistoryTrendCard 
        title="Battery Health Trend" 
        subtitle="Tracking State of Health (SoH) degradation over the current cycle life." 
        data={sparkH} 
        color={C.green} 
        icon="battery-half" 
        unit="%" 
      />
      <HistoryTrendCard 
        title="AI Anomaly Status" 
        subtitle="Historical ML confidence scoring for predictive maintenance." 
        data={sparkS} 
        color={C.purple} 
        icon="brain" 
        unit="%" 
      />
      <HistoryTrendCard 
        title="Protection Status" 
        subtitle="Thermal load tracking against critical operating limits." 
        data={sparkT} 
        color={maxTemp > 45 ? C.red : C.amber} 
        icon="shield-checkmark" 
        unit="°C" 
      />

      {/* AI Health Score */}
      <SectionTitle title="AI Health Score" sub="TinyML anomaly detection" badge="ML ACTIVE" badgeColor={C.purple} />
      <Card accentColor={score > 50 ? C.red : score > 15 ? C.amber : C.green}>
        <CardBody style={ss.aiCardBody}>
          <View style={ss.aiRow}>
            <View style={{ flex: 1 }}>
              <Text style={ss.aiLabel}>Anomaly Score</Text>
              <Text style={[ss.aiScore, { color: score > 50 ? C.red : score > 15 ? C.amber : C.green }]}>
                {score != null ? score.toFixed(1) : '0.0'}
                <Text style={ss.aiUnit}>%</Text>
              </Text>
              <View style={ss.aiStatusRow}>
                <Ionicons name="pulse" size={12} color={C.text3} />
                <Text style={ss.aiStatus}>{data?.status || 'Waiting for data'}</Text>
              </View>
            </View>
            <View style={ss.aiMeta}>
              <Text style={[ss.aiMetaVal, { color: C.purple }]}>{data?.mlOp || 'NORMAL'}</Text>
              <Text style={ss.aiMetaLabel}>ML Operation</Text>
              {data?.spn && (
                <>
                  <Text style={[ss.aiMetaVal, { color: C.red, marginTop: 12 }]}>
                    SPN {data.spn}
                  </Text>
                  <Text style={ss.aiMetaLabel}>J1939 Code</Text>
                </>
              )}
            </View>
          </View>
          
          <View style={{ marginTop: S.lg }}>
            <ProgressBar
              value={Math.min(score ?? 0, 100)}
              color={score > 50 ? C.red : score > 15 ? C.amber : C.green}
              height={10}
            />
          </View>
          
          {/* Score spark */}
          <View style={ss.scoreSparkRow}>
            {sparkS.map((v, i) => (
              <View
                key={i}
                style={[ss.scoreSpark, {
                  height: Math.max(3, (v / Math.max(...sparkS, 0.01)) * 32),
                  backgroundColor: (v > 50 ? C.red : v > 15 ? C.amber : C.green) + (i === sparkS.length - 1 ? 'FF' : '44'),
                }]}
              />
            ))}
          </View>
        </CardBody>
      </Card>

      {/* Active Cells visualization */}
      <SectionTitle title="Cell Diagnostics" sub="Real-time voltage levels" />
      <Card accentColor={C.blue}>
        <CardBody style={{ paddingVertical: S.lg }}>
          <View style={ss.battGrid}>
            {[1, 2, 3, 4].map(i => (
              <BatteryCell 
                key={i} 
                index={i} 
                voltage={data?.[`cell${i}`]} 
                active={(data?.activeCells ?? 4) >= i} 
              />
            ))}
          </View>
        </CardBody>
      </Card>

      {/* Operations Summary */}
      <SectionTitle title="Operations Summary" sub="Session state distribution" badge="LIVE SESSION" badgeColor={C.primary} />
      <Card accentColor={C.primary}>
        <CardBody>
          <OpsBar history={history} />
          <View style={ss.opsGrid}>
            {[
              { label: 'Packets', val: String(history.length), color: C.blue },
              { label: 'Relay',   val: data?.relay === 'CONNECTED' ? 'CLOSED' : (data?.relay || 'OPEN'), color: data?.relay === 'CONNECTED' ? C.green : C.red },
              { label: 'Current', val: data ? `${data.current.toFixed(2)} A` : '0.0 A', color: C.text2 },
              { label: 'Battery Score', val: data ? `${data.batteryScore?.toFixed(1) ?? data.batteryHealth?.toFixed(1) ?? '0.0'}%` : '0.0%', color: statusColor },
            ].map(({ label, val, color }) => (
              <View key={label} style={ss.opsCell}>
                <Text style={ss.opsCellLabel}>{label}</Text>
                <Text style={[ss.opsCellVal, { color }]}>{val}</Text>
              </View>
            ))}
          </View>
        </CardBody>
      </Card>

      {/* Alert Feed */}
      <SectionTitle title="Live Alert Feed" sub="Recent fault events" />
      <Card accentColor={C.amber}>
        <CardHeader>
          <Text style={ss.cardHeaderTitle}>⚠ Fault Events</Text>
          <Badge label={`${recentFaults.length} events`} color={C.text4} />
        </CardHeader>
        <CardBody>
          {recentFaults.length === 0 ? (
            <View style={ss.emptyRow}>
              <Ionicons name="checkmark-circle" size={18} color={C.green} />
              <Text style={ss.emptyText}>No recent fault events — system nominal.</Text>
            </View>
          ) : recentFaults.map((f, i) => <AlertRow key={i} fault={f} />)}
        </CardBody>
      </Card>
    </ScrollView>
  );
}

const ss = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: 'transparent' },
  content: { padding: S.base, paddingBottom: 100 },

  // Command Center Header
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surface,
    padding: S.md, borderRadius: R.lg,
    borderWidth: 1, borderColor: C.border,
    marginBottom: S.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  headerSys:  { fontSize: 16, fontWeight: '900', color: C.text, letterSpacing: 0.5 },
  headerDate: { fontSize: 11, color: C.text4, fontWeight: '600', marginTop: 2 },

  kpiGrid: { flexDirection: 'row', gap: S.sm },
  kpiCol:  { flex: 1, gap: S.sm },

  // AI Card
  aiCardBody:{ padding: S.lg },
  aiRow:    { flexDirection: 'row', gap: S.base },
  aiLabel:  { fontSize: 12, fontWeight: '800', color: C.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  aiScore:  { fontSize: 46, fontWeight: '900', lineHeight: 50 },
  aiUnit:   { fontSize: 24, fontWeight: '800' },
  aiStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  aiStatus: { fontSize: 12, color: C.text3, fontWeight: '700', textTransform: 'uppercase' },
  aiMeta:   { alignItems: 'flex-end', justifyContent: 'center' },
  aiMetaVal:    { fontSize: 16, fontWeight: '900' },
  aiMetaLabel:  { fontSize: 10, color: C.text4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreSparkRow: { flexDirection: 'row', alignItems: 'flex-end', height: 40, gap: 3, marginTop: S.base },
  scoreSpark:    { flex: 1, borderRadius: 2 },

  // Batteries visualization
  battGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: S.sm },
  battWrapper: { alignItems: 'center', width: '22%' },
  battTerminal: { width: 24, height: 6, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  battBody: { 
    width: '100%', height: 110, borderRadius: 6, borderWidth: 2, 
    justifyContent: 'flex-end', overflow: 'hidden', backgroundColor: C.surface2 
  },
  battFill: { width: '100%' },
  battLabelBox: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  battNum:  { fontSize: 14, fontWeight: '900' },
  battVolts:{ fontSize: 11, fontWeight: '700' },

  // Ops Summary
  opsTitle:      { fontSize: 11, fontWeight: '700', color: C.text3, textTransform: 'uppercase', letterSpacing: 1 },
  opsBar:        { flexDirection: 'row', height: 14, borderRadius: R.full, overflow: 'hidden', gap: 2 },
  opsLegend:     { flexDirection: 'row', gap: S.base, marginTop: 4 },
  opsLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  opsDot:        { width: 8, height: 8, borderRadius: 4 },
  opsLegendText: { fontSize: 11, color: C.text3, fontWeight: '600' },
  opsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.base },
  opsCell:       { flex: 1, minWidth: '45%', minHeight: 64, backgroundColor: C.surface2, padding: S.md, borderRadius: R.md, borderWidth: 1, borderColor: C.border, justifyContent: 'center' },
  opsCellLabel:  { fontSize: 10, color: C.text4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  opsCellVal:    { fontSize: 16, fontWeight: '800', marginTop: 4 },

  // Alert Feed
  cardHeaderTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  alertRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, padding: S.md, backgroundColor: C.surface2, borderRadius: R.md, borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, marginBottom: S.sm },
  alertType:   { fontSize: 12, fontWeight: '700', color: C.text },
  alertAction: { fontSize: 12, color: C.text4, marginTop: 2 },
  alertTime: { fontSize: 10, color: C.text4, alignSelf: 'flex-start' },

  // Predictive Insights
  predRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  predLabel: { fontSize: 13, color: C.text3, fontWeight: '600' },
  predValue: { fontSize: 15, fontWeight: '800' },
  emptyRow:    { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.sm },
  emptyText:   { fontSize: 13, color: C.text3, fontWeight: '600' },
});
