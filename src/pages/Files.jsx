import React, { useState } from 'react';
import { files } from '../mockData';
import { FileText, Folder, Upload, Download, MoreVertical, Search, Filter } from 'lucide-react';

const Files = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  
  const categories = ['All', 'Syllabus', 'Slides', 'Worksheets', 'Exams', 'Forms', 'References'];
  
  const filteredFiles = files.filter(f => activeCategory === 'All' ? true : f.category === activeCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Course Files</h1>
          <p className="page-description">Manage and share teaching materials.</p>
        </div>
        <button onClick={() => {
          const f = window.prompt("Enter file name to upload:");
          if (f) alert(f + " uploaded successfully!");
        }} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer'
        }}>
          <Upload size={18} /> Upload File
        </button>
      </header>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', flex: 1 }}>
          <Search size={20} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
          <input 
            type="text" 
            placeholder="Search files..." 
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1rem' }} 
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Categories</h3>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: 'none',
              backgroundColor: activeCategory === cat ? 'var(--accent-light)' : 'transparent',
              color: activeCategory === cat ? 'var(--accent-color)' : 'var(--text-main)',
              fontWeight: activeCategory === cat ? 600 : 500,
              cursor: 'pointer', textAlign: 'left'
            }}>
              <Folder size={18} color={activeCategory === cat ? 'var(--accent-color)' : 'var(--text-muted)'} />
              {cat}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Name</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Size</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Uploaded</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--radius-md)', color: 'var(--accent-color)' }}>
                          <FileText size={20} />
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{file.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.875rem' }}>
                        {file.category}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{file.size}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{new Date(file.uploadDate).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => alert('Downloading file...')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Download size={18} /></button>
                        <button onClick={() => alert('Opening file options...')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><MoreVertical size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredFiles.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Folder size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No files found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Files;
