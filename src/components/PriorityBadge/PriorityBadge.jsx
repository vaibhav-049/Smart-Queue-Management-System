const priorityConfig = {
  emergency: { label: 'Emergency', color: '#DC2626', bg: '#FEE2E2' },
  senior: { label: 'Senior Citizen', color: '#EA580C', bg: '#FFF7ED' },
  vip: { label: 'VIP', color: '#7C3AED', bg: '#F3E8FF' },
  normal: { label: 'Normal', color: '#16A34A', bg: '#F0FDF4' },
};

export default function PriorityBadge({ priority, size = 'sm' }) {
  const config = priorityConfig[priority] || priorityConfig.normal;

  return (
    <span
      className={`priority-badge priority-${size}`}
      style={{ background: config.bg, color: config.color, borderColor: `${config.color}30` }}
    >
      {config.label}
    </span>
  );
}
