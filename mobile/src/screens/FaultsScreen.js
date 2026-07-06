import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { C, S, R } from '../theme/colors';
import { ConnectionBar, SectionTitle, Card, CardHeader, CardBody, Badge } from '../components/SharedComponents';

const SERVER_URL = 'http://10.70.249.48:3001';

const SEV_COLOR = { Critical: C.red,   Warning: C.amber, Healthy: C.green  };
const SEV_BG    = { Critical: C.redBg, Warning: C.amberBg, Healthy: C.greenBg };
const SEV_ICON  = { Critical: '✕',     Warning: '⚠',      Healthy: '✓'    };

function FaultCard({ fault }) {
  const color = SEV_COLOR[fault.severity] || C.text4;
  const icon  = SEV_ICON[fault.severity]  || '○';
  return (
    <View style={[ss.faultCard, { borderLeftColor: color }]}>
      <View style={ss.faultTop}>
        <View style={[ss.sevBadge, { backgroundColor: SEV_BG[fault.severity] || C.surface3, borderColor: color + '55' }]}>
          <Text style={[ss.sevText, { color }]}>{icon} {fault.severity}</Text>
        </View>
        <Text style={ss.faultTime}>
          {fault.timestamp ? new Date(fault.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
        </Text>
      </View>
      <Text style={ss.faultType}>{fault.faultType}</Text>
      <Text style={ss.faultAction}>{fault.actionTaken}</Text>
      {fault.value != null && (
        <Text style={[ss.faultValue, { color: C.primary }]}>📊 {fault.value}</Text>
      )}
    </View>
  );
}

export default function FaultsScreen({ connected }) {
  const [faults,  setFaults]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState('All');

  const fetchFaults = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${SERVER_URL}/api/faults`);
      const json = await res.json();
      if (json.success) setFaults(json.data || []);
    } catch { setFaults([]); }
    finally   { setLoading(false); }
  };

  useEffect(() => { fetchFaults(); }, []);

  const clearFaults = () => Alert.alert(
    'Clear All Faults',
    'This will permanently delete all fault records from the database.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All', style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${SERVER_URL}/api/faults`, { method: 'DELETE' });
            setFaults([]);
          } catch { Alert.alert('Error', 'Failed to clear faults'); }
        },
      },
    ]
  );

  const filters  = ['All', 'Critical', 'Warning', 'Healthy'];
  const filtered = filter === 'All' ? faults : faults.filter(f => f.severity === filter);

  const counts = { Critical: 0, Warning: 0, Healthy: 0 };
  faults.forEach(f => { if (counts[f.severity] !== undefined) counts[f.severity]++; });

  return (
    <ScrollView style={ss.screen} contentContainerStyle={ss.content}>
      <ConnectionBar connected={connected} />

      {/* Stats */}
      <SectionTitle title="Fault Reports" sub="From PostgreSQL database" />
      <View style={ss.statsRow}>
        {Object.entries(counts).map(([sev, cnt]) => (
          <View key={sev} style={[ss.statBox, { borderColor: SEV_COLOR[sev] }]}>
            <Text style={[ss.statNum, { color: SEV_COLOR[sev] }]}>{cnt}</Text>
            <Text style={ss.statLabel}>{sev}</Text>
          </View>
        ))}
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ss.filterScroll}>
        <View style={ss.filterRow}>
          {filters.map(f => (
            <TouchableOpacity
              key={f}
              style={[ss.filterTab, filter === f && { backgroundColor: C.primary, borderColor: C.primary }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[ss.filterText, filter === f && { color: C.white }]}>{f}</Text>
              {f !== 'All' && (
                <View style={[ss.filterCount, { backgroundColor: filter === f ? 'rgba(255,255,255,0.25)' : SEV_COLOR[f] + '22' }]}>
                  <Text style={[ss.filterCountText, { color: filter === f ? C.white : SEV_COLOR[f] }]}>
                    {counts[f] ?? 0}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* List header */}
      <View style={ss.listHeader}>
        <Text style={ss.listTitle}>{filtered.length} Records</Text>
        <TouchableOpacity style={ss.clearBtn} onPress={clearFaults}>
          <Text style={ss.clearText}>🗑 Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* State */}
      {loading && (
        <View style={ss.centerRow}>
          <ActivityIndicator color={C.primary} />
          <Text style={ss.loadingText}>Loading fault records…</Text>
        </View>
      )}

      {!loading && filtered.length === 0 && (
        <Card accentColor={C.green}>
          <CardBody>
            <View style={ss.emptyState}>
              <Text style={ss.emptyIcon}>✅</Text>
              <Text style={ss.emptyTitle}>No fault events found</Text>
              <Text style={ss.emptySub}>The battery pack is operating normally.</Text>
            </View>
          </CardBody>
        </Card>
      )}

      {!loading && filtered.map((fault, i) => (
        <FaultCard key={fault.id || i} fault={fault} />
      ))}
    </ScrollView>
  );
}

const ss = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: 'transparent' },
  content: { padding: S.base, paddingBottom: 100, gap: S.md },

  // Stats row
  statsRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.base },
  statBox:  { flex: 1, backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, alignItems: 'center', borderWidth: 1.5, elevation: 2, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:4 },
  statNum:  { fontSize: 30, fontWeight: '900' },
  statLabel:{ fontSize: 10, color: C.text4, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },

  // Filters
  filterScroll: { flexGrow: 0, marginBottom: S.base },
  filterRow:    { flexDirection: 'row', gap: S.sm, paddingRight: S.base },
  filterTab:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.full, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  filterText:   { fontSize: 13, color: C.text3, fontWeight: '700' },
  filterCount:  { paddingHorizontal: 6, paddingVertical: 1, borderRadius: R.full },
  filterCountText: { fontSize: 11, fontWeight: '800' },

  // List
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.sm },
  listTitle:  { fontSize: 14, fontWeight: '800', color: C.text },
  clearBtn:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.md, backgroundColor: C.redBg, borderWidth: 1, borderColor: C.redBorder },
  clearText:  { fontSize: 12, color: C.red, fontWeight: '700' },

  // Loading / empty
  centerRow:   { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.xl, justifyContent: 'center' },
  loadingText: { color: C.text4, fontSize: 13 },
  emptyState:  { alignItems: 'center', paddingVertical: S.xl, gap: S.sm },
  emptyIcon:   { fontSize: 40 },
  emptyTitle:  { fontSize: 16, fontWeight: '800', color: C.text },
  emptySub:    { fontSize: 13, color: C.text4, textAlign: 'center' },

  // Fault card
  faultCard:  { backgroundColor: C.surface, borderRadius: R.lg, padding: S.base, marginBottom: S.sm, borderLeftWidth: 4, borderWidth: 1, borderColor: C.border, elevation: 2, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:4 },
  faultTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.sm },
  sevBadge:   { paddingHorizontal: 9, paddingVertical: 3, borderRadius: R.full, borderWidth: 1 },
  sevText:    { fontSize: 11, fontWeight: '800' },
  faultTime:  { fontSize: 11, color: C.text4 },
  faultType:  { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 4 },
  faultAction:{ fontSize: 12, color: C.text4, lineHeight: 18 },
  faultValue: { fontSize: 12, fontWeight: '700', marginTop: 4 },
});
