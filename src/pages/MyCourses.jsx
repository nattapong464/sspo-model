import React, { useState } from 'react';
import { BookOpen, Users, Calendar as CalendarIcon, ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const isActive = course.status === 'Active';
  return (
    <div style={{
      backgroundColor: 'var(--surface-color)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border-color)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        height: '100px',
        backgroundColor: isActive ? 'var(--accent-color)' : 'var(--text-muted)',
        padding: '1.5rem',
        color: 'white',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          backgroundColor: 'rgba(255,255,255,0.2)',
          padding: '0.25rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          {course.status}
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{course.code}</h3>
        <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9 }}>Section {course.section}</p>
      </div>
      
      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
          {course.title}
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon size={16} />
            <span>{course.semester}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} />
            <span>{course.students} Students Enrolled</span>
          </div>
          {course.nextClass && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: 'var(--accent-color)', fontWeight: 500 }}>
              <BookOpen size={16} />
              <span>Next Class: {new Date(course.nextClass).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--background-color)' }}>
        <button onClick={() => navigate(`/courses/${course.id}`)} style={{
          width: '100%',
          padding: '0.75rem',
          backgroundColor: isActive ? 'var(--accent-color)' : 'transparent',
          color: isActive ? 'white' : 'var(--text-main)',
          border: isActive ? 'none' : '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all var(--transition-fast)'
        }}>
          <span>Open Course</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

const MyCourses = () => {
  const { courses: myCourses } = useData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">My Courses</h1>
          <p className="page-description">Manage your active and upcoming courses.</p>
        </div>
        <button onClick={() => {
          const code = window.prompt("Enter Course Code:");
          if (code) alert("Course added successfully!");
        }} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer'
        }}>
          <Plus size={18} /> Add Course
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {myCourses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};

export default MyCourses;
