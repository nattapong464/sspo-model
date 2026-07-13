import React from 'react';
import { useData } from '../context/DataContext';
import { ClipboardList, Clock, CheckCircle, FileText } from 'lucide-react';

const Assignments = () => {
  const { assignments, addAssignment } = useData();

  const handleCreateAssignment = () => {
    const title = window.prompt("Enter new assignment title:");
    if (title) {
      addAssignment({ title, course: 'CS101', dueDate: new Date().toISOString().split('T')[0] });
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Assignments & Quizzes</h1>
          <p className="page-description">Track student submissions and grading progress.</p>
        </div>
        <button onClick={handleCreateAssignment} style={{
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--accent-color)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          Create Assignment
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {assignments.map(assn => {
          const progress = assn.total > 0 ? Math.round((assn.submissions / assn.total) * 100) : 0;
          
          let statusColor;
          if (assn.status === 'Active') statusColor = 'var(--success)';
          else if (assn.status === 'Grading') statusColor = 'var(--warning)';
          else statusColor = 'var(--text-muted)';
          
          return (
            <div key={assn.id} style={{
              backgroundColor: 'var(--surface-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ backgroundColor: 'var(--accent-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--accent-color)' }}>
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>{assn.title}</h3>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FileText size={14} /> Course: {assn.course}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={14} /> Due: {new Date(assn.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: `${statusColor}15`,
                  color: statusColor,
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}>
                  {assn.status}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                  <span>Submission Progress</span>
                  <span>{assn.submissions} / {assn.total} Submitted ({progress}%)</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--background-color)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--accent-color)' }}></div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button style={{
                  flex: 1, padding: '0.5rem', backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer'
                }}>
                  View Submissions
                </button>
                <button style={{
                  flex: 1, padding: '0.5rem', backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer'
                }}>
                  Edit Rubric
                </button>
                {assn.status === 'Grading' && (
                  <button style={{
                    flex: 1, padding: '0.5rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer'
                  }}>
                    Start Grading
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Assignments;
