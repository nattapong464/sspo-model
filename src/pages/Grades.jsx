import React from 'react';
import { students } from '../mockData';
import { Download, Upload } from 'lucide-react';

const Grades = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Gradebook</h1>
          <p className="page-description">CS101 - Introduction to Computer Science</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => alert('Downloading grades.csv...')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'var(--surface-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}>
            <Download size={18} /> Export
          </button>
          <button onClick={() => alert('Grades have been published to students!')} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}>
            Publish Grades
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Class Average</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-color)' }}>78.5%</div>
        </div>
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Highest Score</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>98%</div>
        </div>
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Lowest Score</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>45%</div>
        </div>
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Missing Grades</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>12</div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', overflowX: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)', position: 'sticky', left: 0, backgroundColor: 'var(--background-color)' }}>Student</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Assign 1 (10%)</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Assign 2 (15%)</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Midterm (30%)</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Project (45%)</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>Total</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const a1 = Math.round(student.averageScore * 0.9);
              const a2 = Math.round(student.averageScore * 1.05);
              const mt = Math.round(student.averageScore * 0.95);
              const isMissing = student.id === 3;
              
              return (
                <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500, position: 'sticky', left: 0, backgroundColor: 'var(--surface-color)', borderRight: '1px solid var(--border-color)' }}>
                    <div>{student.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.studentId}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{a1} / 100</td>
                  <td style={{ padding: '1rem' }}>{a2} / 100</td>
                  <td style={{ padding: '1rem' }}>{mt} / 100</td>
                  <td style={{ padding: '1rem' }}>
                    {isMissing ? (
                      <span style={{ color: 'white', backgroundColor: 'var(--danger)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Missing</span>
                    ) : (
                      <span>{student.averageScore} / 100</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700, color: student.averageScore < 60 ? 'var(--danger)' : 'var(--text-main)' }}>
                    {isMissing ? 'N/A' : `${student.averageScore}%`}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: 'var(--radius-full)', 
                      backgroundColor: student.averageScore >= 80 ? 'var(--success-light)' : student.averageScore >= 60 ? 'var(--warning-light)' : 'var(--danger-light)', 
                      color: student.averageScore >= 80 ? 'var(--success)' : student.averageScore >= 60 ? 'var(--warning)' : 'var(--danger)', 
                      fontWeight: 700 
                    }}>
                      {student.averageScore >= 80 ? 'A' : student.averageScore >= 70 ? 'B' : student.averageScore >= 60 ? 'C' : 'F'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Grades;
