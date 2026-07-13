import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Download, Calendar as CalendarIcon, Filter } from 'lucide-react';

const AttendanceChip = ({ status }) => {
  let color, bg;
  switch (status) {
    case 'Present': color = 'var(--success)'; bg = 'var(--success-light)'; break;
    case 'Late': color = 'var(--warning)'; bg = 'var(--warning-light)'; break;
    case 'Absent': color = 'var(--danger)'; bg = 'var(--danger-light)'; break;
    case 'Leave': color = 'var(--text-muted)'; bg = '#e2e8f0'; break;
    default: color = 'var(--text-muted)'; bg = 'var(--background-color)';
  }
  
  return (
    <div style={{
      display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', backgroundColor: bg, color: color, fontSize: '0.75rem', fontWeight: 600
    }}>
      {status}
    </div>
  );
};

const Attendance = () => {
  const { students, updateAllAttendance, updateStudentAttendance } = useData();
  const [date, setDate] = useState('2026-07-13');
  
  // Simulate random attendance state for mock data
  const getMockStatus = (id) => {
    if (id % 5 === 0) return 'Absent';
    if (id % 3 === 0) return 'Late';
    return 'Present';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Attendance Register</h1>
          <p className="page-description">CS101 - Introduction to Computer Science</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => updateAllAttendance('Present')} style={{
            padding: '0.5rem 1rem', backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer'
          }}>
            Mark All Present
          </button>
          <button onClick={() => alert("Attendance saved for " + date)} style={{
            padding: '0.5rem 1rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer'
          }}>
            Save Attendance
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'var(--surface-color)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <CalendarIcon size={20} color="var(--text-muted)" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none' }} />
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>105</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Present</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--warning)' }}>10</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Late</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>5</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Absent</span>
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Student ID</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Name</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Overall %</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Today's Status</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{student.studentId}</td>
                <td style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>{student.name}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ color: student.attendance < 75 ? 'var(--danger)' : 'var(--success)' }}>
                    {student.attendance}%
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <AttendanceChip status={student.attendanceStatus || 'Present'} />
                </td>
                <td style={{ padding: '1rem' }}>
                  <select 
                    defaultValue={student.attendanceStatus || 'Present'}
                    onChange={(e) => updateStudentAttendance(student.id, e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                    <option value="Excused">Excused</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendance;
