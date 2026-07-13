import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

const events = [
  { id: 1, title: 'CS101 Lecture', type: 'Class', date: '2026-07-13', time: '09:00 AM - 10:30 AM', location: 'Room 301' },
  { id: 2, title: 'CS302 Lab', type: 'Class', date: '2026-07-13', time: '01:00 PM - 03:00 PM', location: 'Lab A' },
  { id: 3, title: 'Programming Assignment 1 Due', type: 'Deadline', date: '2026-07-20', time: '11:59 PM', location: 'Online' },
  { id: 4, title: 'Faculty Meeting', type: 'Event', date: '2026-07-15', time: '10:00 AM - 11:30 AM', location: 'Conference Room' },
  { id: 5, title: 'Midterm Exam CS302', type: 'Exam', date: '2026-08-15', time: '09:00 AM - 12:00 PM', location: 'Main Hall' }
];

const CalendarView = () => {
  const [view, setView] = useState('Week');
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getTypeStyle = (type) => {
    switch(type) {
      case 'Class': return { bg: 'var(--accent-light)', color: 'var(--accent-color)' };
      case 'Deadline': return { bg: 'var(--danger-light)', color: 'var(--danger)' };
      case 'Exam': return { bg: 'var(--warning-light)', color: 'var(--warning)' };
      default: return { bg: '#e2e8f0', color: 'var(--text-muted)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-description">Schedule, deadlines, and events.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button onClick={() => setView('Week')} style={{ padding: '0.5rem 1rem', border: 'none', background: view === 'Week' ? 'var(--accent-color)' : 'transparent', color: view === 'Week' ? 'white' : 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}>Week</button>
            <button onClick={() => setView('Month')} style={{ padding: '0.5rem 1rem', border: 'none', borderLeft: '1px solid var(--border-color)', background: view === 'Month' ? 'var(--accent-color)' : 'transparent', color: view === 'Month' ? 'white' : 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}>Month</button>
          </div>
        </div>
      </header>

      <div style={{
        backgroundColor: 'var(--surface-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>July 13 - July 19, 2026</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={{ padding: '0.5rem', background: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}><ChevronLeft size={18} /></button>
            <button style={{ padding: '0.5rem 1rem', background: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontWeight: 500, cursor: 'pointer' }}>Today</button>
            <button style={{ padding: '0.5rem', background: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}><ChevronRight size={18} /></button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--background-color)' }}>
          {days.map((day, i) => (
            <div key={day} style={{ padding: '1rem', textAlign: 'center', borderRight: i < 6 ? '1px solid var(--border-color)' : 'none' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>{day}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>{13 + i}</div>
            </div>
          ))}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: '400px' }}>
          {days.map((day, i) => {
            const dateStr = `2026-07-${13 + i}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            return (
              <div key={day} style={{ borderRight: i < 6 ? '1px solid var(--border-color)' : 'none', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {dayEvents.map(event => {
                  const style = getTypeStyle(event.type);
                  return (
                    <div key={event.id} style={{
                      backgroundColor: style.bg,
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `3px solid ${style.color}`,
                      fontSize: '0.75rem'
                    }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{event.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}><Clock size={12} /> {event.time}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}><MapPin size={12} /> {event.location}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
