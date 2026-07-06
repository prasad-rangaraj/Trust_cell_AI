import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { C, S, R } from '../theme/colors';
import { ConnectionBar, SectionTitle, Card, CardHeader, CardBody, Badge, InfoRow } from '../components/SharedComponents';

const RELAY_LIST = [
  { id: 'isolation', key: 'relayIsolation', label: 'Pack Isolation Contactor', sub: 'Main pack disconnect relay', icon: '🔌' },
  { id: 'cooling',   key: 'relayCooling',   label: 'Active Cooling Fan Relay', sub: 'Thermal management relay',  icon: '🌀' },
  { id: 'cell1',     key: 'relayCell1',     label: 'Cell 1 Bypass Relay',      sub: 'Module A · Cell 1',        icon: '🔋' },
  { id: 'cell2',     key: 'relayCell2',     label: 'Cell 2 Bypass Relay',      sub: 'Module A · Cell 2',        icon: '🔋' },
  { id: 'cell3',     key: 'relayCell3',     label: 'Cell 3 Bypass Relay',      sub: 'Module B · Cell 3',        icon: '🔋' },
  { id: 'cell4',     key: 'relayCell4',     label: 'Cell 4 Bypass Relay',      sub: 'Module B · Cell 4',        icon: '🔋' },
];

const SERVER_URL = 'http://10.70.249.48:3001';

function RelayCard({ relay, state, isLoading, onConnect, onDisconnect, disabled }) {
  const connected = state === 'CONNECTED';
  const stateColor = connected ? C.green : C.red;

  return (
    <Card accentColor={stateColor} style={{ marginBottom: S.sm }}>
      <CardBody>
        {/* Relay identity */}
        <View style={ss.relayTop}>
          <View style={[ss.relayIconBox, { backgroundColor: stateColor + '18' }]}>
            <Text style={ss.relayIcon}>{relay.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ss.relayLabel}>{relay.label}</Text>
            <Text style={ss.relaySub}>{relay.sub}</Text>
          </View>
          {isLoading
            ? <ActivityIndicator color={C.primary} size="small" />
            : (
              <View style={[ss.statePill, { backgroundColor: stateColor + '18', borderColor: stateColor + '55' }]}>
                <View style={[ss.stateDot, { backgroundColor: stateColor }]} />
                <Text style={[ss.stateText, { color: stateColor }]}>
                  {connected ? 'CLOSED' : 'OPEN'}
                </Text>
              </View>
            )}
        </View>

        {/* Action buttons */}
        <View style={ss.relayBtns}>
          <TouchableOpacity
            style={[
              ss.relayBtn,
              { backgroundColor: connected ? C.surface3 : C.primary, borderColor: connected ? C.border : C.primary },
              (connected || disabled || isLoading) && ss.btnDisabled,
            ]}
            disabled={connected || disabled || isLoading}
            onPress={onConnect}
          >
            <Text style={[ss.relayBtnText, { color: connected ? C.text4 : C.white }]}>
              ⊕ Connect
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              ss.relayBtn,
              { backgroundColor: !connected ? C.surface3 : C.redBg, borderColor: !connected ? C.border : C.redBorder },
              (!connected || disabled || isLoading) && ss.btnDisabled,
            ]}
            disabled={!connected || disabled || isLoading}
            onPress={onDisconnect}
          >
            <Text style={[ss.relayBtnText, { color: !connected ? C.text4 : C.red }]}>
              ⊗ Isolate
            </Text>
          </TouchableOpacity>
        </View>
      </CardBody>
    </Card>
  );
}

export default function SettingsScreen({ data, connected }) {
  const [loadingRelay, setLoadingRelay] = useState(null);

  const controlRelay = (relayId, action) => {
    const relay = RELAY_LIST.find(r => r.id === relayId);
    Alert.alert(
      `Confirm ${action}`,
      `Send "${action}" to "${relay?.label}"?\n\nThis controls physical hardware immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: action === 'DISCONNECT' ? 'destructive' : 'default',
          onPress: async () => {
            setLoadingRelay(relayId);
            try {
              await fetch(`${SERVER_URL}/api/system/relay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer cat-edge-bms-2026' },
                body: JSON.stringify({ relay: relayId, action }),
              });
            } catch {
              Alert.alert('Error', 'Failed to reach server. Check your network connection.');
            } finally {
              setLoadingRelay(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={ss.screen} contentContainerStyle={ss.content}>
      <ConnectionBar connected={connected} />

      {/* Warning Banner */}
      <View style={ss.warnBanner}>
        <View style={ss.warnIconRow}>
          <Text style={ss.warnIcon}>⚠️</Text>
          <Text style={ss.warnTitle}>Hardware Override Controls</Text>
        </View>
        <Text style={ss.warnBody}>
          These commands are sent directly to the STM32 Edge Node via MQTT.
          Physical contactors open/close immediately. Use with extreme caution.
        </Text>
      </View>

      {/* Relay Cards */}
      <SectionTitle
        title="Relay Override"
        sub="Manual contactor control · 6-relay system"
        badge={connected ? 'ARMED' : 'OFFLINE'}
        badgeColor={connected ? C.green : C.text4}
      />

      {RELAY_LIST.map(relay => (
        <RelayCard
          key={relay.id}
          relay={relay}
          state={data?.[relay.key] ?? 'CONNECTED'}
          isLoading={loadingRelay === relay.id}
          disabled={!connected}
          onConnect={()    => controlRelay(relay.id, 'CONNECT')}
          onDisconnect={()  => controlRelay(relay.id, 'DISCONNECT')}
        />
      ))}

      {/* System Info */}
      <SectionTitle title="System Information" sub="Build metadata & configuration" />
      <Card accentColor={C.primary}>
        <CardHeader>
          <Text style={ss.infoCardTitle}>⚙️ Edge Node Config</Text>
          <Badge label="v1.0.0" color={C.blue} />
        </CardHeader>
        <CardBody>
          {[
            { label: 'Backend',        val: 'Node.js + Express + Socket.io', mono: false },
            { label: 'Protocol',       val: 'MQTT · HiveMQ Cloud',           mono: false },
            { label: 'Hardware',       val: 'STM32 Edge Node',               mono: false },
            { label: 'Battery Pack',   val: '4S Li-Ion · 16.8V max',         mono: true  },
            { label: 'AI Engine',      val: 'Gemini 2.5 Flash',              mono: false },
            { label: 'Mobile',         val: 'Expo React Native · SDK 54',    mono: false },
            { label: 'Design System',  val: 'Qualcomm Light Theme',          mono: false },
          ].map((r, i, arr) => (
            <InfoRow key={i} label={r.label} value={r.val} mono={r.mono} last={i === arr.length - 1} />
          ))}
        </CardBody>
      </Card>

      {/* Live Telemetry Snapshot */}
      {data && (
        <>
          <SectionTitle title="Live Snapshot" sub="Current telemetry values" />
          <Card accentColor={C.blue}>
            <CardBody>
              {[
                { label: 'Pack Voltage',  val: `${(data.cell1 + data.cell2 + data.cell3 + data.cell4).toFixed(2)} V`, mono: true },
                { label: 'Current',       val: `${data.current?.toFixed(2)} A`,    mono: true },
                { label: 'SoC',           val: `${data.soc?.toFixed(1)} %`,        mono: true },
                { label: 'SoH',           val: `${(data.soh ?? data.batteryHealth)?.toFixed(1)} %`, mono: true },
                { label: 'Temp (Core)',   val: `${data.temp1?.toFixed(1)} °C`,      mono: true },
                { label: 'Temp (Ambient)', val: `${data.temp2?.toFixed(1)} °C`,    mono: true },
                { label: 'ML Operation', val: data.mlOp || 'NORMAL',              mono: false },
                { label: 'System Status', val: data.status || 'Healthy',          mono: false },
              ].map((r, i, arr) => (
                <InfoRow key={i} label={r.label} value={r.val} mono={r.mono} last={i === arr.length - 1} />
              ))}
            </CardBody>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const ss = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: 'transparent' },
  content: { padding: S.base, paddingBottom: 100 },

  // Warning banner
  warnBanner:  { backgroundColor: C.amberBg, borderRadius: R.xl, padding: S.base, marginBottom: S.base, borderWidth: 1, borderColor: C.amberBorder, borderLeftWidth: 4, borderLeftColor: C.amber },
  warnIconRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: 6 },
  warnIcon:    { fontSize: 16 },
  warnTitle:   { fontSize: 13, fontWeight: '800', color: C.amberText },
  warnBody:    { fontSize: 12, color: C.amberText, lineHeight: 18 },

  // Relay card
  relayTop:    { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.md },
  relayIconBox:{ width: 44, height: 44, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center' },
  relayIcon:   { fontSize: 20 },
  relayLabel:  { fontSize: 13, fontWeight: '700', color: C.text },
  relaySub:    { fontSize: 11, color: C.text4, marginTop: 2 },
  statePill:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: R.full, borderWidth: 1 },
  stateDot:    { width: 7, height: 7, borderRadius: 4 },
  stateText:   { fontSize: 11, fontWeight: '800' },

  relayBtns:   { flexDirection: 'row', gap: S.sm },
  relayBtn:    { flex: 1, paddingVertical: S.sm + 1, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  relayBtnText:{ fontSize: 13, fontWeight: '700' },
  btnDisabled: { opacity: 0.45 },

  // Info card
  infoCardTitle: { fontSize: 13, fontWeight: '700', color: C.text },
});
