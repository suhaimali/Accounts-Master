import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', border: '1px solid #bfdbfe',
        }}>
          <Settings size={28} color="#2563eb" />
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#fef9c3', border: '1px solid #fde047',
          borderRadius: 999, padding: '4px 14px',
          fontSize: 12, fontWeight: 700, color: '#854d0e',
          marginBottom: 16, letterSpacing: 0.5,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#eab308', display: 'inline-block' }} />
          COMING SOON
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
          Configure business preferences and accounting parameters.<br />
          This section is being upgraded and will be available soon.
        </p>

        <div style={{
          marginTop: 28, padding: '16px 20px', background: '#f8fafc',
          border: '1px solid #e2e8f0', borderRadius: 12, textAlign: 'left',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10 }}>What's coming</div>
          {[
            'Business name & branding',
            'Currency & date format',
            'Expense categories',
            'Balance tolerance settings',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', marginBottom: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
