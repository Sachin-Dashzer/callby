export function groupCallsByDate(calls) {
  const today     = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  const groups = {};
  calls.forEach((call) => {
    const d   = new Date(call.timestamp);
    let label = '';
    if (d.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(call);
  });

  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}
