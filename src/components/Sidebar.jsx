import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, Calendar, 
  ClipboardList, CheckCircle, Users, 
  Bell, FileText, BarChart, Settings, GraduationCap, X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Courses', path: '/courses', icon: BookOpen },
    { name: 'Teaching Plan', path: '/teaching-plan', icon: FileText },
    { name: 'Lessons', path: '/lessons', icon: BookOpen },
    { name: 'Assignments & Quizzes', path: '/assignments', icon: ClipboardList },
    { name: 'Attendance', path: '/attendance', icon: CheckCircle },
    { name: 'Grades', path: '/grades', icon: GraduationCap },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Announcements', path: '/announcements', icon: Bell },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Files', path: '/files', icon: FileText },
    { name: 'Reports', path: '/reports', icon: BarChart },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <GraduationCap size={24} />
            </div>
            <span>EduManage</span>
          </div>
          <button 
            className="mobile-close-btn" 
            onClick={onClose}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>
      
      <nav className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
      
      <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            JS
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Dr. Jane Smith</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Instructor</div>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
