import React, { createContext, useState, useContext } from 'react';
import { 
  currentUser as initialUser, 
  myCourses as initialCourses, 
  students as initialStudents,
  assignments as initialAssignments,
  teachingPlan as initialTeachingPlan,
  lessons as initialLessons,
  announcements as initialAnnouncements,
  files as initialFiles,
  kpiData as initialKpi
} from '../mockData';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [courses, setCourses] = useState(initialCourses);
  const [students, setStudents] = useState(initialStudents);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [teachingPlan, setTeachingPlan] = useState(initialTeachingPlan);
  const [lessons, setLessons] = useState(initialLessons);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [files, setFiles] = useState(initialFiles);
  const [kpiData, setKpiData] = useState(initialKpi);

  // --- Announcements Actions ---
  const addAnnouncement = (newAnnouncement) => {
    setAnnouncements([{ id: Date.now(), ...newAnnouncement, date: new Date().toISOString() }, ...announcements]);
  };
  const deleteAnnouncement = (id) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
  };
  const togglePinAnnouncement = (id) => {
    setAnnouncements(announcements.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a));
  };

  // --- Teaching Plan Actions ---
  const updateTeachingPlan = (index, updatedPlan) => {
    const newPlan = [...teachingPlan];
    newPlan[index] = updatedPlan;
    setTeachingPlan(newPlan);
  };

  // --- Lessons Actions ---
  const addLesson = (newLesson) => {
    setLessons([...lessons, { id: Date.now(), ...newLesson, date: new Date().toISOString() }]);
  };
  const updateLessonStatus = (id, status) => {
    setLessons(lessons.map(l => l.id === id ? { ...l, status } : l));
  };

  // --- Assignments Actions ---
  const addAssignment = (newAssignment) => {
    setAssignments([...assignments, { id: Date.now(), submissions: 0, total: students.length, status: 'Active', ...newAssignment }]);
  };

  // --- Attendance Actions ---
  const updateAllAttendance = (status) => {
    setStudents(students.map(s => ({ ...s, attendanceStatus: status })));
  };
  const updateStudentAttendance = (id, status) => {
    setStudents(students.map(s => s.id === id ? { ...s, attendanceStatus: status } : s));
  };

  return (
    <DataContext.Provider value={{
      currentUser, courses, students, assignments, teachingPlan, lessons, announcements, files, kpiData,
      addAnnouncement, deleteAnnouncement, togglePinAnnouncement,
      updateTeachingPlan,
      addLesson, updateLessonStatus,
      addAssignment,
      updateAllAttendance, updateStudentAttendance
    }}>
      {children}
    </DataContext.Provider>
  );
};
