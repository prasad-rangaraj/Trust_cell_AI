// Edge Sense — Qualcomm Light Theme
// Kept in sync with client/src/index.css :root tokens

export const C = {
  // Surfaces
  bg:        '#F8FAFC',
  bgAlt:     '#F1F5F9',
  surface:   '#FFFFFF',
  surface2:  '#F8FAFC',
  surface3:  '#F1F5F9',

  // Borders
  border:    '#E2E8F0',
  border2:   '#CBD5E1',

  // Text
  text:      '#0F172A',
  text2:     '#1E293B',
  text3:     '#475569',
  text4:     '#64748B',

  // Brand — Qualcomm Blue
  primary:       '#3253DC',
  primaryBg:     'rgba(50,83,220,0.12)',
  primaryBorder: 'rgba(50,83,220,0.3)',

  // Status
  green:       '#10B981',
  greenBg:     'rgba(16,185,129,0.12)',
  greenBorder: 'rgba(16,185,129,0.3)',
  greenText:   '#059669',

  amber:       '#F59E0B',
  amberBg:     'rgba(245,158,11,0.12)',
  amberBorder: 'rgba(245,158,11,0.3)',
  amberText:   '#D97706',

  red:       '#EF4444',
  redBg:     'rgba(239,68,68,0.12)',
  redBorder: 'rgba(239,68,68,0.3)',
  redText:   '#DC2626',

  blue:       '#3253AC',
  blueBg:     'rgba(50,83,172,0.12)',
  blueBorder: 'rgba(50,83,172,0.3)',
  blueText:   '#254085',

  purple:       '#8B5CF6',
  purpleBg:     'rgba(139,92,246,0.12)',
  purpleBorder: 'rgba(139,92,246,0.3)',

  white: '#FFFFFF',
};

export const S = { xs:4, sm:8, md:12, base:16, lg:20, xl:24, xxl:32 };
export const R = { sm:4, md:8, lg:12, xl:16, xxl:20, full:999 };

// Legacy aliases so old imports don't break
export const colors = {
  primary: C.primary, primaryLight: C.primaryBg, primaryDark: '#1E3BB8',
  red: C.red, redLight: C.redBg, green: C.green, greenLight: C.greenBg,
  amber: C.amber, amberLight: C.amberBg,
  bg: C.bg, surface: C.surface, surface2: C.surface2, surface3: C.surface3,
  border: C.border, borderLight: C.primaryBg,
  text: C.text, textSecondary: C.text2, textMuted: C.text3, textFaint: C.text4,
  white: C.white,
};
export const spacing = S;
export const radius  = R;
export const typography = {
  h1: { fontSize:26, fontWeight:'800', color:C.text },
  h2: { fontSize:20, fontWeight:'700', color:C.text },
  h3: { fontSize:16, fontWeight:'700', color:C.text },
  body: { fontSize:14, color:C.text3 },
  caption: { fontSize:12, color:C.text3 },
  mono: { fontSize:13 },
};
