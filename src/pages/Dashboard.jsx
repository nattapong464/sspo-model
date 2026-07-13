import React from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle, Clock, AlertTriangle, FileText, ChevronRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</span>
      <div style={{ backgroundColor: `${color}15`, padding: '0.5rem', borderRadius: 'var(--radius-md)', color }}>
        <Icon size={20} />
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
      <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>{value}</span>
      {trend && <span style={{ fontSize: '0.875rem', color: trend > 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center' }}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </span>}
    </div>
  </div>
);

const Dashboard = () => {
  const { kpiData, courses: myCourses, announcements, assignments } = useData();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome back, Dr. Smith</h1>
        <p style={{ color: 'var(--text-muted)' }}>Here is what's happening with your courses today.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <StatCard title="Total Students" value={kpiData.totalStudents} icon={Users} color="var(--accent-color)" trend={5} />
        <StatCard title="Completed Sessions" value={kpiData.completedSessions} icon={CheckCircle} color="var(--success)" />
        <StatCard title="Pending Grading" value={kpiData.pendingGrading} icon={Clock} color="var(--warning)" trend={-12} />
        <StatCard title="At-Risk Students" value={kpiData.atRiskStudents} icon={AlertTriangle} color="var(--danger)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Active Courses</h2>
            <button onClick={() => navigate('/courses')} style={{ color: 'var(--accent-color)', background: 'none', border: 'none', fontWeight: 500, cursor: 'pointer' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myCourses.filter(c => c.status === 'Active').map(course => (
              <div key={course.id} style={{ padding: '1rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{course.code}: {course.title}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{course.time}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{course.room} • {course.students} students</span>
                  <button onClick={() => navigate('/lessons')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-color)', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                    Go to class <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="var(--accent-color)" /> Recent Announcements
              </h2>
              <button onClick={() => navigate('/announcements')} style={{ color: 'var(--accent-color)', background: 'none', border: 'none', fontWeight: 500, cursor: 'pointer' }}>View All</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {announcements.filter(a => a.status === 'Published').map(ann => (
                <div key={ann.id} style={{ borderLeft: '3px solid var(--accent-color)', paddingLeft: '1rem' }}>
                  <div style={{ fontWeight: 500 }}>{ann.title}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{new Date(ann.date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Needs Grading</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {assignments.filter(a => a.status === 'Grading').map(assn => (
                <div key={assn.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ backgroundColor: 'var(--warning-light)', padding: '0.5rem', borderRadius: '50%', color: 'var(--warning)' }}>
                    <FileText size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{assn.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{assn.course} • {assn.submissions} submissions</div>
                  </div>
                  <button onClick={() => navigate('/grades')} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer' }}>
                    Grade Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
