import React from 'react';
import { useData } from '../context/DataContext';
import { FileText, MoreVertical, Plus, CheckCircle, Edit3 } from 'lucide-react';

const Lessons = () => {
  const { lessons, addLesson, updateLessonStatus } = useData();

  const handleCreateLesson = () => {
    const title = window.prompt("Enter new lesson title:");
    if (title) {
      addLesson({ title, module: 'Module 1', status: 'Draft' });
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Lessons & Materials</h1>
          <p className="page-description">Manage course content and weekly modules.</p>
        </div>
        <button onClick={handleCreateLesson} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--accent-color)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          <Plus size={18} />
          <span>Create Lesson</span>
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {['Module 1', 'Module 2'].map(module => (
          <div key={module} style={{
            backgroundColor: 'var(--surface-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1rem 1.5rem',
              backgroundColor: 'var(--background-color)',
              borderBottom: '1px solid var(--border-color)',
              fontWeight: 600,
              fontSize: '1.125rem'
            }}>
              {module}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {lessons.filter(l => l.module === module).map(lesson => (
                <div key={lesson.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: lesson.status === 'Published' ? 'transparent' : 'var(--background-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      backgroundColor: lesson.status === 'Published' ? 'var(--accent-light)' : '#e2e8f0',
                      color: lesson.status === 'Published' ? 'var(--accent-color)' : 'var(--text-muted)',
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{lesson.title}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {lesson.status === 'Published' ? `Published on ${new Date(lesson.date).toLocaleDateString()}` : 'Draft'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {lesson.status === 'Published' ? (
                      <span onClick={() => updateLessonStatus(lesson.id, 'Draft')} style={{ cursor: 'pointer', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
                        <CheckCircle size={16} /> Published
                      </span>
                    ) : (
                      <span onClick={() => updateLessonStatus(lesson.id, 'Published')} style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
                        Draft (Click to Publish)
                      </span>
                    )}
                    
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Edit3 size={18} />
                    </button>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Lessons;
