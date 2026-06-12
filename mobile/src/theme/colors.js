export const Colors = {
  primary:      '#1A6BFF',
  primaryLight: '#EBF2FF',
  primaryDark:  '#0050CC',

  success:    '#16A34A',
  successBg:  '#DCFCE7',
  warning:    '#D97706',
  warningBg:  '#FEF3C7',
  danger:     '#DC2626',
  dangerBg:   '#FEE2E2',
  purple:     '#7C3AED',
  purpleBg:   '#EDE9FE',

  bg:       '#F8F9FB',
  surface:  '#FFFFFF',
  border:   '#E2E8F0',
  divider:  '#F1F5F9',

  text:      '#0F172A',
  textSec:   '#64748B',
  textMuted: '#94A3B8',

  // Call type semantics
  incoming:    '#16A34A',
  incomingBg:  '#DCFCE7',
  outgoing:    '#D97706',
  outgoingBg:  '#FEF3C7',
  missed:      '#DC2626',
  missedBg:    '#FEE2E2',
  rejected:    '#DC2626',
  rejectedBg:  '#FEE2E2',

  shadow: 'rgba(15,23,42,0.06)',
};

export const CALL_TYPE = {
  incoming:      { fg: '#16A34A', bg: '#DCFCE7', label: 'Incoming',  icon: '↙' },
  outgoing:      { fg: '#D97706', bg: '#FEF3C7', label: 'Outgoing',  icon: '↗' },
  missed:        { fg: '#DC2626', bg: '#FEE2E2', label: 'Missed',    icon: '↙' },
  rejected:      { fg: '#DC2626', bg: '#FEE2E2', label: 'Rejected',  icon: '✕' },
  never_attended:{ fg: '#DC2626', bg: '#FEE2E2', label: 'Never Att.', icon: '⊗' },
  not_pickup:    { fg: '#7C3AED', bg: '#EDE9FE', label: 'Not Pickup', icon: '⊘' },
};

// Avatar background pool (seeded by name)
export const AVATAR_COLORS = [
  '#1A6BFF','#16A34A','#D97706','#7C3AED','#0891B2',
  '#DB2777','#EA580C','#65A30D','#2563EB','#9333EA',
];
