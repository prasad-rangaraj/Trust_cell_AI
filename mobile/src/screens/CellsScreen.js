import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S, R } from '../theme/colors';
import { ConnectionBar } from '../components/SharedComponents';

// ─── Cell Telemetry Row (Interactive) ─────────────────────────────────────────
function CellRow({ index, v, active, setActive, temp, ir, risk, history = [] }) {
  const isDanger = risk > 75;
  const isSelected = active === index;

  return (
    <View style={{ marginBottom: isSelected ? S.md : 1 }}>
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => setActive(isSelected ? null : index)}
        style={[ss.cellRow, isSelected && ss.cellRowActive, isDanger && { backgroundColor: C.red + '05' }]}
      >
        <View style={ss.cellIdentity}>
          <View style={[ss.cellIconBox, { backgroundColor: isDanger ? C.red + '15' : isSelected ? C.blue + '15' : C.surface3 }]}>
            <Ionicons name="battery-half" size={14} color={isDanger ? C.red : isSelected ? C.blue : C.text3} />
          </View>
          <View>
            <Text style={[ss.cellTitle, isSelected && { color: C.blue }]}>CELL 0{index + 1}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={[ss.cellDot, { backgroundColor: isDanger ? C.red : C.green }]} />
              <Text style={[ss.cellSub, { color: isDanger ? C.red : C.green }]}>{isDanger ? 'RISK' : 'HEALTHY'}</Text>
            </View>
          </View>
        </View>

        <View style={ss.cellValueBlock}>
          <Text style={ss.cellValue}>{v.toFixed(3)}<Text style={ss.cellUnit}> V</Text></Text>
          <Ionicons name={isSelected ? "chevron-up" : "chevron-down"} size={16} color={C.text4} style={{ marginLeft: 8 }} />
        </View>
      </TouchableOpacity>

      {/* Drill-Down Expandable Area (Ported from Web) */}
      {isSelected && (
        <View style={ss.drillDownArea}>
          <View style={ss.drillDownHeader}>
             <Text style={ss.drillDownTitle}>Active Cell Profile</Text>
             <Ionicons name="chevron-up" size={16} color={C.text3} />
          </View>

          {/* Cell Profile Matrix (Native Radar Replacement) */}
          <View style={ss.profileMatrix}>
             <View style={ss.matrixRow}>
               <Text style={ss.matrixLabel}>HEALTH (SOH)</Text>
               <View style={ss.matrixTrack}><View style={[ss.matrixFill, { width: '92%', backgroundColor: C.green }]} /></View>
               <Text style={ss.matrixVal}>92%</Text>
             </View>
             <View style={ss.matrixRow}>
               <Text style={ss.matrixLabel}>THERMAL RISK</Text>
               <View style={ss.matrixTrack}><View style={[ss.matrixFill, { width: `${risk}%`, backgroundColor: isDanger ? C.red : C.amber }]} /></View>
               <Text style={ss.matrixVal}>{risk.toFixed(0)}%</Text>
             </View>
             <View style={ss.matrixRow}>
               <Text style={ss.matrixLabel}>EFFICIENCY (IR)</Text>
               <View style={ss.matrixTrack}><View style={[ss.matrixFill, { width: `${Math.max(10, 100 - ir)}%`, backgroundColor: C.blue }]} /></View>
               <Text style={ss.matrixVal}>{ir} mΩ</Text>
             </View>
             <View style={ss.matrixRow}>
               <Text style={ss.matrixLabel}>STABILITY (dV)</Text>
               <View style={ss.matrixTrack}><View style={[ss.matrixFill, { width: '98%', backgroundColor: C.purple }]} /></View>
               <Text style={ss.matrixVal}>98%</Text>
             </View>
          </View>

          {/* High-Resolution Telemetry Sparkline */}
          <View style={ss.telemetryBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
               <Text style={ss.telemetryTitle}>Live Voltage Telemetry</Text>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                 <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.blue }} />
                 <Text style={{ fontSize: 9, fontWeight: '800', color: C.blue }}>STREAMING</Text>
               </View>
            </View>
            <View style={ss.sparkContainer}>
               <View style={[ss.sparkRef, { bottom: '20%', borderColor: C.red }]} />
               <View style={[ss.sparkRef, { bottom: '80%', borderColor: C.red }]} />
               <View style={[ss.sparkRef, { bottom: '50%', borderColor: C.text3, borderStyle: 'dotted' }]} />
               <View style={ss.sparkBars}>
                 {history.slice(-30).map((h, i) => {
                   const cellV = h[`cell${index+1}`] || 3.0;
                   const hPct = Math.min(100, Math.max(0, ((cellV - 3.5) / 0.7) * 100));
                   return <View key={i} style={[ss.sparkBar, { height: `${Math.max(2, hPct)}%`, backgroundColor: C.blue }]} />;
                 })}
               </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
               <Text style={ss.sparkLabel}>Cutoff 3.6V</Text>
               <Text style={ss.sparkLabel}>Max 4.2V</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CellsScreen({ data, connected, history }) {
  const [activeCell, setActiveCell] = useState(0); // Open the first cell by default

  const v1 = data?.cell1 ?? 0;
  const v2 = data?.cell2 ?? 0;
  const v3 = data?.cell3 ?? 0;
  const v4 = data?.cell4 ?? 0;
  
  const voltages = [v1, v2, v3, v4];
  const avgV = voltages.reduce((a, b) => a + b, 0) / 4 || 0;
  const packV = voltages.reduce((a, b) => a + b, 0) || 0;
  
  const packCurrent = data?.current ?? 0;
  const packPower = packV ? (packV * packCurrent) / 1000 : 0;
  const isCharging = packCurrent > 0;

  const t1 = data?.temp1 ?? 25;
  const t2 = data?.temp2 ?? 25;
  const cellTemps = [t1, t1, t2, t2];

  const cells = voltages.map((v, i) => {
    const ir = (15 + (4.2 - v) * 20 + (cellTemps[i] > 40 ? 5 : 0)).toFixed(1);
    const risk = Math.max(0, Math.min(100, (cellTemps[i] - 20) * 8));
    return { v, ir, risk, temp: cellTemps[i] };
  });

  return (
    <ScrollView style={ss.screen} contentContainerStyle={ss.content}>
      <ConnectionBar connected={connected} />
      
      <View style={ss.pageHeader}>
        <Text style={ss.pageTitle}>Cell Analytics</Text>
        <Text style={ss.pageSub}>High-fidelity isolated telemetry</Text>
      </View>

      {/* Hero KPI Dashboard */}
      <View style={ss.heroCard}>
         <View style={ss.heroRow}>
            <View>
               <Text style={ss.heroLabel}>SYSTEM VOLTAGE</Text>
               <Text style={ss.heroValMain}>{packV.toFixed(2)}<Text style={ss.heroValUnit}> V</Text></Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
               <Text style={ss.heroLabel}>ACTIVE POWER</Text>
               <Text style={[ss.heroValMain, { color: isCharging ? C.green : C.amber }]}>
                 {Math.abs(packPower).toFixed(2)}<Text style={ss.heroValUnit}> kW</Text>
               </Text>
            </View>
         </View>
         <View style={[ss.heroBadge, { backgroundColor: isCharging ? C.green + '20' : C.amber + '20' }]}>
            <Ionicons name={isCharging ? "flash" : "battery-dead"} size={14} color={isCharging ? C.green : C.amber} />
            <Text style={[ss.heroBadgeText, { color: isCharging ? C.green : C.amber }]}>
              {isCharging ? 'PACK IS CHARGING' : 'PACK IS DISCHARGING'}
            </Text>
         </View>
      </View>

      <View style={ss.miniKpiRow}>
         <View style={ss.miniKpiBox}>
           <Text style={ss.miniKpiLabel}>AVG CELL</Text>
           <Text style={ss.miniKpiVal}>{avgV.toFixed(3)}v</Text>
         </View>
         <View style={ss.miniKpiBox}>
           <Text style={ss.miniKpiLabel}>MAX DELTA</Text>
           <Text style={[ss.miniKpiVal, { color: C.amber }]}>{(Math.max(...voltages) - Math.min(...voltages)).toFixed(3)}v</Text>
         </View>
      </View>

      {/* Interactive Cell List */}
      <View style={ss.listCard}>
        {cells.map((c, i) => (
          <CellRow 
            key={i} 
            index={i} 
            v={c.v} 
            active={activeCell} 
            setActive={setActiveCell} 
            temp={c.temp} 
            ir={c.ir} 
            risk={c.risk}
            history={history}
          />
        ))}
      </View>

      {/* RUL Prediction AI Card */}
      <View style={ss.rulCard}>
        <View style={ss.rulHeader}>
          <Ionicons name="analytics" size={16} color={C.blue} />
          <Text style={ss.rulTitle}>Remaining Useful Life (RUL)</Text>
        </View>
        <Text style={ss.rulSub}>AI degradation trajectory prediction.</Text>
        
        <View style={ss.rulMetricRow}>
           <Text style={ss.rulMainVal}>14</Text>
           <View>
             <Text style={ss.rulMetricLabel}>MONTHS TO</Text>
             <Text style={ss.rulMetricLabel}>REPLACEMENT</Text>
           </View>
        </View>

        <View style={ss.rulBarContainer}>
           <View style={[ss.rulBarSegment, { flex: 0.15, backgroundColor: C.green, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]} />
           <View style={[ss.rulBarSegment, { flex: 0.40, backgroundColor: C.amber }]} />
           <View style={[ss.rulBarSegment, { flex: 0.45, backgroundColor: C.red, borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />
           
           {/* Current Position Marker */}
           <View style={ss.rulMarker}>
             <View style={ss.rulMarkerBadge}><Text style={ss.rulMarkerText}>NOW</Text></View>
             <View style={ss.rulMarkerLine} />
           </View>
        </View>
        
        <View style={ss.rulFooter}>
           <Text style={ss.rulFooterText}>Cycles: <Text style={ss.rulFooterBold}>125</Text></Text>
           <Text style={ss.rulFooterText}>Limit: <Text style={ss.rulFooterBold}>840</Text></Text>
        </View>
      </View>
      
    </ScrollView>
  );
}

const ss = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#F4F6F9' },
  content: { padding: S.base, paddingBottom: 100 },
  pageHeader: { marginBottom: S.md },
  pageTitle: { fontSize: 20, fontWeight: '900', color: C.text2, letterSpacing: -0.5 },
  pageSub: { fontSize: 12, color: C.text4, fontWeight: '500', marginTop: 2 },

  // Hero Card
  heroCard: { backgroundColor: C.surface, borderRadius: R.xl, padding: S.xl, borderWidth: 1, borderColor: C.border, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, marginBottom: S.md },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: S.xl },
  heroLabel: { fontSize: 10, fontWeight: '800', color: C.text4, letterSpacing: 0.5, marginBottom: 4 },
  heroValMain: { fontSize: 32, fontWeight: '900', color: C.text, fontFamily: 'monospace', lineHeight: 32 },
  heroValUnit: { fontSize: 16, color: C.text3 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: R.md },
  heroBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  miniKpiRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.xl },
  miniKpiBox: { flex: 1, backgroundColor: C.surface2, padding: S.md, borderRadius: R.md, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  miniKpiLabel: { fontSize: 9, fontWeight: '800', color: C.text4, letterSpacing: 0.5, marginBottom: 2 },
  miniKpiVal: { fontSize: 16, fontWeight: '900', color: C.text2, fontFamily: 'monospace' },

  // Interactive Cell List
  listCard: { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, marginBottom: S.xl, overflow: 'hidden' },
  
  cellRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: S.md, paddingVertical: 14, backgroundColor: C.surface },
  cellRowActive: { backgroundColor: C.surface2 },
  cellIdentity: { flexDirection: 'row', alignItems: 'center', gap: S.sm, flex: 2 },
  cellIconBox: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  cellTitle: { fontSize: 13, fontWeight: '800', color: C.text2, letterSpacing: 0.2 },
  cellDot: { width: 4, height: 4, borderRadius: 2 },
  cellSub: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cellValueBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingRight: S.sm },
  cellValue: { fontSize: 18, fontWeight: '900', color: C.text, fontFamily: 'monospace' },
  cellUnit: { fontSize: 12, color: C.text4 },

  // Drill-Down Area
  drillDownArea: { backgroundColor: C.surface2, padding: S.md, borderTopWidth: 1, borderTopColor: C.border, paddingBottom: S.lg },
  drillDownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.md },
  drillDownTitle: { fontSize: 11, fontWeight: '800', color: C.text3, textTransform: 'uppercase' },
  
  profileMatrix: { backgroundColor: C.surface, borderRadius: R.md, padding: S.md, borderWidth: 1, borderColor: C.border, gap: 10, marginBottom: S.md },
  matrixRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  matrixLabel: { width: 90, fontSize: 9, fontWeight: '800', color: C.text3 },
  matrixTrack: { flex: 1, height: 6, backgroundColor: C.surface3, borderRadius: 3, overflow: 'hidden' },
  matrixFill: { height: '100%', borderRadius: 3 },
  matrixVal: { width: 35, fontSize: 10, fontWeight: '800', color: C.text2, textAlign: 'right' },

  telemetryBox: { backgroundColor: C.surface, borderRadius: R.md, padding: S.md, borderWidth: 1, borderColor: C.border },
  telemetryTitle: { fontSize: 10, fontWeight: '800', color: C.text3 },
  sparkContainer: { height: 60, backgroundColor: C.surface3, borderRadius: 4, marginTop: 4, position: 'relative', overflow: 'hidden' },
  sparkRef: { position: 'absolute', width: '100%', borderBottomWidth: 1, borderStyle: 'dashed', zIndex: 0, opacity: 0.3 },
  sparkBars: { flexDirection: 'row', alignItems: 'flex-end', height: '100%', width: '100%', gap: 1, zIndex: 1 },
  sparkBar: { flex: 1, borderTopLeftRadius: 1, borderTopRightRadius: 1 },
  sparkLabel: { fontSize: 8, fontWeight: '800', color: C.text4 },

  // RUL Card
  rulCard: { backgroundColor: C.surface, borderRadius: R.xl, padding: S.lg, borderWidth: 1, borderColor: C.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, marginBottom: S.xl },
  rulHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  rulTitle: { fontSize: 14, fontWeight: '800', color: C.text2 },
  rulSub: { fontSize: 11, color: C.text4, marginBottom: S.lg },
  rulMetricRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: S.xl },
  rulMainVal: { fontSize: 36, fontWeight: '900', color: C.blue, lineHeight: 36 },
  rulMetricLabel: { fontSize: 10, fontWeight: '800', color: C.text3, letterSpacing: 0.5 },
  rulBarContainer: { height: 12, flexDirection: 'row', borderRadius: 4, backgroundColor: C.surface3, position: 'relative', marginBottom: S.md },
  rulBarSegment: { height: '100%' },
  rulMarker: { position: 'absolute', left: '15%', top: -20, alignItems: 'center', marginLeft: -15 },
  rulMarkerBadge: { backgroundColor: C.surface2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: C.border },
  rulMarkerText: { fontSize: 9, fontWeight: '800', color: C.text2 },
  rulMarkerLine: { width: 2, height: 14, backgroundColor: C.text2, marginTop: 2 },
  rulFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  rulFooterText: { fontSize: 10, fontWeight: '600', color: C.text4 },
  rulFooterBold: { color: C.text, fontWeight: '800' }
});
