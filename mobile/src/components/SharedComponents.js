import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S, R } from '../theme/colors';

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style, accentColor, accentTop }) {
  const accent = accentColor || C.primary;
  return (
    <View style={[
      ss.card,
      accentTop  && { borderTopWidth: 3, borderTopColor: accent },
      !accentTop && { borderLeftWidth: 4, borderLeftColor: accent },
      style,
    ]}>
      {children}
    </View>
  );
}

export function CardHeader({ children, style }) {
  return <View style={[ss.cardHeader, style]}>{children}</View>;
}
export function CardBody({ children, style }) {
  return <View style={[ss.cardBody, style]}>{children}</View>;
}

// ─── Stat Card (matches .stat-card) ──────────────────────────────────────────
export function StatCard({ label, value, unit, sub, color, icon, sparkData }) {
  const accent = color || C.primary;
  const maxVal = sparkData?.length ? Math.max(...sparkData.map(v => v || 0), 0.01) : 1;
  return (
    <Card accentColor={accent} style={ss.statCard}>
      <View style={ss.statTop}>
        <View style={{ flex: 1 }}>
          <Text style={ss.statLabel}>{label}</Text>
          <Text style={[ss.statValue, { color: accent }]}>
            {value ?? '0.0'}
            {unit ? <Text style={ss.statUnit}> {unit}</Text> : null}
          </Text>
          {sub ? <Text style={ss.statSub}>{sub}</Text> : null}
        </View>
        {icon ? (
          <View style={[ss.iconBox, { backgroundColor: accent + '18' }]}>
            <Text style={ss.iconText}>{icon}</Text>
          </View>
        ) : null}
      </View>
      {sparkData?.length > 2 && (
        <View style={ss.sparkRow}>
          {sparkData.slice(-20).map((v, i) => (
            <View
              key={i}
              style={[ss.sparkBar, {
                height: Math.max(3, ((v || 0) / maxVal) * 28),
                backgroundColor: accent + (i === sparkData.slice(-20).length - 1 ? 'FF' : '55'),
              }]}
            />
          ))}
        </View>
      )}
    </Card>
  );
}

// ─── Section Header (matches .page-header) ────────────────────────────────────
export function SectionTitle({ title, sub, badge, badgeColor }) {
  return (
    <View style={ss.sectionHeader}>
      <View>
        <Text style={ss.sectionTitle}>{title}</Text>
        {sub ? <Text style={ss.sectionSub}>{sub}</Text> : null}
      </View>
      {badge ? (
        <Badge label={badge} color={badgeColor || C.primary} />
      ) : null}
    </View>
  );
}

// ─── Badge (matches .badge) ──────────────────────────────────────────────────
export function Badge({ label, color, dot }) {
  const c = color || C.primary;
  return (
    <View style={[ss.badge, { backgroundColor: c + '18', borderColor: c + '55' }]}>
      {dot && <View style={[ss.badgeDot, { backgroundColor: c }]} />}
      <Text style={[ss.badgeText, { color: c }]}>{label}</Text>
    </View>
  );
}

// ─── Status Badge (pill) ─────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const cfg = {
    Healthy:  { color: C.green,   label: 'Healthy' },
    Warning:  { color: C.amber,   label: 'Warning' },
    Critical: { color: C.red,     label: 'Critical' },
  }[status] || { color: C.text4, label: status || 'Unknown' };
  return <Badge label={`● ${cfg.label}`} color={cfg.color} />;
}

// ─── Safety Banner (matches .safety-banner) ───────────────────────────────────
export function SafetyBanner({ status, message }) {
  const cfg = {
    Healthy:  { color: C.green,  bg: C.greenBg,  border: C.greenBorder,  icon: 'checkmark-circle' },
    Warning:  { color: C.amber,  bg: C.amberBg,  border: C.amberBorder,  icon: 'warning' },
    Critical: { color: C.red,    bg: C.redBg,    border: C.redBorder,    icon: 'close-circle' },
  }[status] || { color: C.text4, bg: C.surface3, border: C.border, icon: 'help-circle' };
  return (
    <View style={[ss.safetyBanner, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <View style={[ss.safetyIcon, { backgroundColor: cfg.color + '22' }]}>
        <Ionicons name={cfg.icon} size={22} color={cfg.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ss.safetyTitle, { color: cfg.color }]}>
          {status ?? 'Unknown'} — System Status
        </Text>
        {message ? <Text style={[ss.safetySub, { color: cfg.color }]}>{message}</Text> : null}
      </View>
    </View>
  );
}

// ─── Connection Bar (Disabled) ────────────────────────────────────────────────
export function ConnectionBar({ connected }) {
  // Return null globally since connection status is already shown in the top header of all screens.
  return null;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, color, height = 6 }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  const c = color || C.primary;
  return (
    <View style={[ss.progressTrack, { height }]}>
      <View style={[ss.progressFill, { width: `${pct}%`, backgroundColor: c }]} />
    </View>
  );
}

// ─── Info Row (key/value pair) ────────────────────────────────────────────────
export function InfoRow({ label, value, mono, last }) {
  return (
    <View style={[ss.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={ss.infoLabel}>{label}</Text>
      <Text style={[ss.infoValue, mono && ss.mono]}>{value ?? '0'}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  // Card
  card: {
    backgroundColor: C.surface, borderRadius: R.lg,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width:0, height:1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 3,
    marginBottom: S.sm, overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  cardBody: { padding: S.base },

  // StatCard
  statCard: { flex: 1, padding: S.base, backgroundColor: C.surface },
  statTop:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  statLabel: { fontSize: 11, fontWeight: '700', color: C.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  statValue: { fontSize: 30, fontWeight: '800', lineHeight: 34 },
  statUnit:  { fontSize: 14, fontWeight: '700', color: C.text4 },
  statSub:   { fontSize: 11, color: C.text4, marginTop: 4, fontWeight: '600' },
  iconBox:   { padding: S.sm, borderRadius: R.md },
  iconText:  { fontSize: 22 },
  sparkRow:  { flexDirection: 'row', alignItems: 'flex-end', height: 28, gap: 2, marginTop: S.md },
  sparkBar:  { flex: 1, borderRadius: 2, minHeight: 3 },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: S.lg, marginBottom: S.sm },
  sectionTitle:  { fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: 0.2 },
  sectionSub:    { fontSize: 11, color: C.text4, marginTop: 2 },

  // Badge
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.full, borderWidth: 1 },
  badgeDot:  { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  // SafetyBanner
  safetyBanner: { flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.base, borderRadius: R.xl, borderWidth: 1, marginBottom: S.base },
  safetyIcon:   { width: 40, height: 40, borderRadius: R.full, alignItems: 'center', justifyContent: 'center' },
  safetyIconText: { fontSize: 18, fontWeight: '800' },
  safetyTitle:  { fontSize: 13, fontWeight: '800' },
  safetySub:    { fontSize: 12, marginTop: 2, lineHeight: 16 },

  // ConnectionBar
  connBar:  { flexDirection:'row', alignItems:'center', gap:S.sm, paddingHorizontal:S.base, paddingVertical:S.sm, borderRadius:R.md, borderWidth:1, marginBottom:S.base },
  connDot:  { width:8, height:8, borderRadius:4 },
  connText: { flex:1, fontSize:12, fontWeight:'600' },

  // Progress
  progressTrack: { width:'100%', backgroundColor:C.surface3, borderRadius:R.full, overflow:'hidden', borderWidth:1, borderColor:C.border },
  progressFill:  { height:'100%', borderRadius:R.full },

  // InfoRow
  infoRow:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:9, borderBottomWidth:1, borderBottomColor:C.border },
  infoLabel:  { fontSize:12, color:C.text4, flex:1 },
  infoValue:  { fontSize:12, color:C.text2, fontWeight:'700' },
  mono:       {  },
});
