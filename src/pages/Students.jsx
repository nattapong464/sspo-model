import React, { useState } from 'react';
import { students } from '../mockData';
import { Search, Filter, Mail, AlertTriangle, ShieldCheck } from 'lucide-react';

const Students = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Student Directory</h1>
          <p className="page-description">Manage and monitor your students' progress.</p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', flex: 1 }}>
          <Search size={20} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1rem' }} 
          />
        </div>
        <button onClick={() => alert('Downloading students_directory.csv...')} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'var(--surface-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer'
        }}>
          <Download size={18} /> Export Directory
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {filteredStudents.map(student => (
          <div key={student.id} style={{
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
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700
                }}>
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{student.name}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{student.studentId}</div>
                </div>
              </div>
              
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <Mail size={20} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--background-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Attendance</div>
                <div style={{ fontWeight: 600, color: student.attendance < 75 ? 'var(--danger)' : 'var(--text-main)' }}>{student.attendance}%</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Avg Score</div>
                <div style={{ fontWeight: 600, color: student.averageScore < 60 ? 'var(--danger)' : 'var(--text-main)' }}>{student.averageScore}%</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Risk Status</div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.875rem', fontWeight: 600,
                backgroundColor: student.riskStatus === 'High' ? 'var(--danger-light)' : student.riskStatus === 'Medium' ? 'var(--warning-light)' : 'var(--success-light)',
                color: student.riskStatus === 'High' ? 'var(--danger)' : student.riskStatus === 'Medium' ? 'var(--warning)' : 'var(--success)'
              }}>
                {student.riskStatus === 'High' ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
                {student.riskStatus}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Students;
