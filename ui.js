import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';

export const LIGHT = { bg: '#F3F5F7', surface: '#FFFFFF', ink: '#18202B', muted: '#5E6B7A', line: '#DDE3EA', accent: '#2563EB', good: '#2F8F4E', warn: '#A8620A', bad: '#C0392B', onAccent: '#FFFFFF' };
export const DARK = { bg: '#11161C', surface: '#1A222B', ink: '#E8EEF4', muted: '#93A1B1', line: '#2A3541', accent: '#5B8DEF', good: '#5CC794', warn: '#E0B04F', bad: '#EF7C7C', onAccent: '#0B1220' };
export const useC = () => (useColorScheme() === 'dark' ? DARK : LIGHT);

export function Card({ c, children, style }) { return <View style={[{ backgroundColor: c.surface, borderRadius: 16, padding: 14, gap: 10, borderWidth: 1, borderColor: c.line }, style]}>{children}</View>; }
export function H({ c, children, size = 17 }) { return <Text style={{ color: c.ink, fontSize: size, fontWeight: '700' }}>{children}</Text>; }
export function T({ c, children, muted, small, bold, color, style, numberOfLines }) { return <Text numberOfLines={numberOfLines} style={[{ color: color || (muted ? c.muted : c.ink), fontSize: small ? 13 : 15, fontWeight: bold ? '700' : '400' }, style]}>{children}</Text>; }
export function Row({ children, wrap, style }) { return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>; }
export function Btn({ c, label, onPress, ghost, small, danger, on, disabled, style }) {
  const bg = ghost ? 'transparent' : on ? c.good : danger ? c.bad : c.accent;
  const fg = ghost ? (danger ? c.bad : c.accent) : c.onAccent;
  return <TouchableOpacity disabled={disabled} onPress={onPress} activeOpacity={0.7} style={[{ backgroundColor: bg, borderColor: ghost ? (danger ? c.bad : c.line) : bg, borderWidth: 1, borderRadius: 12, paddingVertical: small ? 8 : 12, paddingHorizontal: small ? 12 : 16, alignItems: 'center', opacity: disabled ? 0.45 : 1 }, style]}><Text style={{ color: fg, fontWeight: '700', fontSize: small ? 13 : 15 }}>{label}</Text></TouchableOpacity>;
}
export function Inp({ c, label, value, onChangeText, placeholder, kb, multiline, secure, maxLength, autoCapitalize, style }) {
  return (
    <View style={{ gap: 4, flex: style && style.flex ? style.flex : undefined }}>
      {label ? <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600' }}>{label}</Text> : null}
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={c.muted} keyboardType={kb} multiline={multiline} secureTextEntry={secure} maxLength={maxLength} autoCapitalize={autoCapitalize || 'sentences'}
        style={[{ backgroundColor: c.bg, color: c.ink, borderColor: c.line, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: multiline ? 10 : 10, fontSize: 15, minHeight: multiline ? 70 : 44, textAlignVertical: multiline ? 'top' : 'center' }, style]} />
    </View>
  );
}
export function Pill({ c, label, color }) { return <View style={{ borderRadius: 99, borderWidth: 1, borderColor: color || c.line, paddingHorizontal: 9, paddingVertical: 2 }}><Text style={{ color: color || c.muted, fontSize: 12, fontWeight: '600' }}>{label}</Text></View>; }
export function Bar({ c, pct, over }) { return <View style={{ height: 8, borderRadius: 4, backgroundColor: c.line, overflow: 'hidden' }}><View style={{ width: Math.max(0, Math.min(100, pct)) + '%', height: 8, backgroundColor: over ? c.bad : c.accent }} /></View>; }
export function KV({ c, k, v, color }) { return <Row style={{ justifyContent: 'space-between' }}><Text style={{ color: c.muted, fontSize: 14, flex: 1 }}>{k}</Text><Text style={{ color: color || c.ink, fontWeight: '700', fontSize: 14 }}>{v}</Text></Row>; }
export function Empty({ c, children }) { return <Text style={{ color: c.muted, fontSize: 14, textAlign: 'center', paddingVertical: 10 }}>{children}</Text>; }
// seletor por botões (substitui o <select>)
export function Pick({ c, label, value, onChange, options }) {
  return (
    <View style={{ gap: 4 }}>
      {label ? <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600' }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {options.map(([k, l]) => { const on = k === value; return <TouchableOpacity key={String(k)} onPress={() => onChange(k)} style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accent : 'transparent' }}><Text style={{ color: on ? c.onAccent : c.ink, fontSize: 13, fontWeight: '600' }}>{l}</Text></TouchableOpacity>; })}
      </View>
    </View>
  );
}
export const sx = StyleSheet.create({ flex1: { flex: 1 } });
