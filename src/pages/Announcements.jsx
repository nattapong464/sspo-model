import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Bell, Pin, Edit3, Send, Trash2 } from 'lucide-react';

const Announcements = () => {
  const { announcements, addAnnouncement, deleteAnnouncement, togglePinAnnouncement } = useData();
  const [activeTab, setActiveTab] = useState('Published');
  const [form, setForm] = useState({ title: '', content: '', pinned: false });

  const handlePublish = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    addAnnouncement({ title: form.title, content: form.content, status: 'Published', pinned: form.pinned });
    setForm({ title: '', content: '', pinned: false });
  };

  const filteredAnnouncements = announcements.filter(a => 
    activeTab === 'All' ? true : a.status === activeTab
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-description">Communicate updates to your students.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            {['All', 'Published', 'Scheduled', 'Draft'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  fontSize: '1rem',
                  fontWeight: activeTab === tab ? 600 : 500,
                  color: activeTab === tab ? 'var(--accent-color)' : 'var(--text-muted)',
                  borderBottom: activeTab === tab ? '2px solid var(--accent-color)' : '2px solid transparent',
                  cursor: 'pointer',
                  marginBottom: '-0.6rem'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredAnnouncements.sort((a, b) => b.pinned - a.pinned).map(ann => (
              <div key={ann.id} style={{
                backgroundColor: 'var(--surface-color)',
                borderRadius: 'var(--radius-lg)',
                border: ann.pinned ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                padding: '1.5rem',
                position: 'relative'
              }}>
                {ann.pinned && (
                  <div style={{ position: 'absolute', top: '-10px', right: '20px', backgroundColor: 'var(--accent-color)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>
                    <Pin size={12} /> Pinned
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>{ann.title}</h3>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      <span>{new Date(ann.date).toLocaleDateString()}</span>
                      <span style={{ 
                        color: ann.status === 'Published' ? 'var(--success)' : ann.status === 'Scheduled' ? 'var(--warning)' : 'var(--text-muted)',
                        fontWeight: 500
                      }}>
                        • {ann.status}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit3 size={18} /></button>
                    <button onClick={() => deleteAnnouncement(ann.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                  </div>
                </div>
                
                <p style={{ color: 'var(--text-main)', margin: 0, lineHeight: 1.6 }}>
                  {ann.content}
                </p>
              </div>
            ))}
            
            {filteredAnnouncements.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                No announcements found in this category.
              </div>
            )}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--surface-color)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          height: 'fit-content',
          position: 'sticky',
          top: '2rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={20} color="var(--accent-color)" /> New Announcement
          </h2>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Title</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} type="text" placeholder="Announcement Title" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Content</label>
              <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Write your message here..." rows={6} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', resize: 'vertical' }}></textarea>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="pin" checked={form.pinned} onChange={e => setForm({...form, pinned: e.target.checked})} />
              <label htmlFor="pin" style={{ fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>Pin to top</label>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" style={{
                flex: 1, padding: '0.75rem', backgroundColor: 'var(--background-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer'
              }}>
                Save Draft
              </button>
              <button onClick={handlePublish} type="button" style={{
                flex: 1, padding: '0.75rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}>
                <Send size={16} /> Publish
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Announcements;
