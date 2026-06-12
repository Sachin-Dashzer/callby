export const C = {
  bg:           '#F4F6FB',
  surface:      '#FFFFFF',
  surfaceAlt:   '#F0F4FF',

  primary:      '#4F46E5',
  primaryLight: '#EEF2FF',
  primaryDark:  '#3730A3',

  incoming:     '#16A34A',
  incomingBg:   '#DCFCE7',
  outgoing:     '#2563EB',
  outgoingBg:   '#DBEAFE',
  missed:       '#DC2626',
  missedBg:     '#FEE2E2',
  rejected:     '#D97706',
  rejectedBg:   '#FEF3C7',

  text:         '#111827',
  textSec:      '#6B7280',
  textMuted:    '#9CA3AF',

  border:       '#E5E7EB',
  shadow:       'rgba(0,0,0,0.06)',
};

export const TYPE = {
  incoming: { fg: C.incoming, bg: C.incomingBg, label: 'Incoming' },
  outgoing: { fg: C.outgoing, bg: C.outgoingBg, label: 'Outgoing' },
  missed:   { fg: C.missed,   bg: C.missedBg,   label: 'Missed'   },
  rejected: { fg: C.rejected, bg: C.rejectedBg, label: 'Rejected' },
};
