import React from 'react';
import { Save, Book, Award, CheckCircle, Bell, Shield } from 'lucide-react';

const SettingsSection = ({ title, icon: Icon, children }) => (
  <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden', marginBottom: '2rem' }}>
    <div style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--background-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <Icon size={20} color="var(--accent-color)" />
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{title}</h2>
    </div>
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {children}
    </div>
  </div>
);

const Settings = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">Configure your course and platform preferences.</p>
        </div>
        <button onClick={() => alert('Settings successfully updated!')} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer'
        }}>
          <Save size={18} /> Save Changes
        </button>
      </header>

      <div>
        <SettingsSection title="Course Information" icon={Book}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Course Code</label>
              <input type="text" defaultValue="CS101" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Semester</label>
              <input type="text" defaultValue="Fall 2026" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Course Title</label>
              <input type="text" defaultValue="Introduction to Computer Science" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Grading Rules" icon={Award}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 500 }}>A Grade Threshold</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Minimum percentage required for an A</div>
              </div>
              <input type="number" defaultValue="80" style={{ width: '80px', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 500 }}>Passing Grade Threshold</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Minimum percentage required to pass</div>
              </div>
              <input type="number" defaultValue="60" style={{ width: '80px', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="curve" />
              <label htmlFor="curve" style={{ fontWeight: 500 }}>Enable automatic grading curve based on highest score</label>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Attendance Policy" icon={CheckCircle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 500 }}>Minimum Attendance</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Required percentage to sit for final exam</div>
              </div>
              <input type="number" defaultValue="80" style={{ width: '80px', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="late" defaultChecked />
              <label htmlFor="late" style={{ fontWeight: 500 }}>Three 'Late' marks equal one 'Absent' mark</label>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Notification Preferences" icon={Bell}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="notif1" defaultChecked />
              <label htmlFor="notif1" style={{ fontWeight: 500 }}>Email me when assignments are submitted late</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="notif2" defaultChecked />
              <label htmlFor="notif2" style={{ fontWeight: 500 }}>Notify me when a student's attendance drops below threshold</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="notif3" />
              <label htmlFor="notif3" style={{ fontWeight: 500 }}>Weekly summary reports</label>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Permissions & Access" icon={Shield}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 500 }}>Teaching Assistants</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>2 TAs assigned to this course</div>
              </div>
              <button onClick={() => alert('Opening TA management modal...')} style={{ padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer' }}>Manage TAs</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="perm1" defaultChecked />
              <label htmlFor="perm1" style={{ fontWeight: 500 }}>Allow TAs to publish grades</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="perm2" />
              <label htmlFor="perm2" style={{ fontWeight: 500 }}>Allow students to view class averages</label>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
};

export default Settings;
