export const TAGS = [
  { label: 'Interested',         fg: '#16A34A', bg: '#DCFCE7' },
  { label: 'Not Interested',     fg: '#DC2626', bg: '#FEE2E2' },
  { label: 'Callback Requested', fg: '#1A6BFF', bg: '#EBF2FF' },
  { label: 'Price Enquiry',      fg: '#D97706', bg: '#FEF3C7' },
  { label: 'Converted',          fg: '#16A34A', bg: '#DCFCE7' },
  { label: 'Wrong Number',       fg: '#94A3B8', bg: '#F1F5F9' },
  { label: 'Follow Up',          fg: '#7C3AED', bg: '#EDE9FE' },
  { label: 'Important',          fg: '#DC2626', bg: '#FEE2E2' },
];

export function getTagStyle(label) {
  return TAGS.find((t) => t.label === label) || { fg: '#64748B', bg: '#F1F5F9' };
}
