import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { CheckCircle, Clock, Circle } from 'lucide-react';

const StatusChip = ({ status }) => {
  let color, bg, Icon;
  switch (status) {
    case 'Completed':
      color = 'var(--success)';
      bg = 'var(--success-light)';
      Icon = CheckCircle;
      break;
    case 'In Progress':
      color = 'var(--accent-color)';
      bg = 'var(--accent-light)';
      Icon = Clock;
      break;
    default:
      color = 'var(--text-muted)';
      bg = 'var(--background-color)';
      Icon = Circle;
  }
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.25rem 0.75rem',
      borderRadius: 'var(--radius-full)',
      backgroundColor: bg,
      color: color,
      fontSize: '0.75rem',
      fontWeight: 600
    }}>
      <Icon size={14} />
      <span>{status}</span>
    </div>
  );
};

const TeachingPlan = () => {
  const { teachingPlan, updateTeachingPlan } = useData();
  const [editMode, setEditMode] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Teaching Plan</h1>
          <p className="page-description">CS101 - Fall 2026</p>
        </div>
        <button onClick={() => setEditMode(!editMode)} style={{
          padding: '0.5rem 1rem',
          backgroundColor: editMode ? 'var(--success)' : 'var(--accent-color)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          {editMode ? 'Done Editing' : 'Edit Plan'}
        </button>
      </header>

      <div style={{
        backgroundColor: 'var(--surface-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Week</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Topic</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>CLO Mapping</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Teaching Method</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Assessment</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {teachingPlan.map((plan, index) => (
              <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>Week {plan.week}</td>
                <td style={{ padding: '1rem', color: 'var(--text-main)' }}>
                  {editMode ? <input value={plan.topic} onChange={e => updateTeachingPlan(index, {...plan, topic: e.target.value})} style={{ width: '100%', padding: '0.25rem' }} /> : plan.topic}
                </td>
                <td style={{ padding: '1rem' }}>
                  {editMode ? <input value={plan.clo} onChange={e => updateTeachingPlan(index, {...plan, clo: e.target.value})} style={{ width: '60px', padding: '0.25rem' }} /> : 
                    <span style={{ backgroundColor: 'var(--background-color)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem', border: '1px solid var(--border-color)' }}>
                      {plan.clo}
                    </span>
                  }
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  {editMode ? <input value={plan.method} onChange={e => updateTeachingPlan(index, {...plan, method: e.target.value})} style={{ width: '100%', padding: '0.25rem' }} /> : plan.method}
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  {editMode ? <input value={plan.assessment} onChange={e => updateTeachingPlan(index, {...plan, assessment: e.target.value})} style={{ width: '100%', padding: '0.25rem' }} /> : plan.assessment}
                </td>
                <td style={{ padding: '1rem' }}>
                  {editMode ? 
                    <select value={plan.status} onChange={e => updateTeachingPlan(index, {...plan, status: e.target.value})} style={{ padding: '0.25rem' }}>
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Pending">Pending</option>
                    </select>
                  : <StatusChip status={plan.status} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeachingPlan;
