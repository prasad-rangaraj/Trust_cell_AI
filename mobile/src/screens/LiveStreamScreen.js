import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../theme/colors';

export default function LiveStreamScreen() {
  return (
    <View style={ss.screen}>
      <Ionicons name="radio-outline" size={64} color={C.text4} />
      <Text style={ss.title}>Live Stream</Text>
      <Text style={ss.sub}>Real-time video feed integration coming soon.</Text>
    </View>
  );
}

const ss = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: S.xxl },
  title: { fontSize: 22, fontWeight: '800', color: C.text2, marginTop: S.lg, textAlign: 'center' },
  sub: { fontSize: 14, color: C.text4, textAlign: 'center', marginTop: S.sm }
});
