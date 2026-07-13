// TODO: API Integration
// All exported data in this file currently uses mock structures.
// In the future, these exports will be replaced with asynchronous API calls 
// (e.g., fetch, axios, or TanStack Query hooks) to a real backend.

export const currentUser = {
  id: 1,
  name: 'Dr. Jane Smith',
  role: 'Instructor',
  department: 'Computer Science',
  email: 'jane.smith@university.edu'
};

export const myCourses = [
  {
    id: 1,
    code: 'CS101',
    title: 'Introduction to Computer Science',
    semester: 'Fall 2026',
    section: 'A',
    students: 120,
    status: 'Active',
    nextClass: '2026-07-13T09:00:00'
  },
  {
    id: 2,
    code: 'CS302',
    title: 'Data Structures and Algorithms',
    semester: 'Fall 2026',
    section: 'B',
    students: 85,
    status: 'Active',
    nextClass: '2026-07-13T13:00:00'
  },
  {
    id: 3,
    code: 'CS450',
    title: 'Advanced Web Development',
    semester: 'Fall 2026',
    section: 'A',
    students: 45,
    status: 'Upcoming',
    nextClass: '2026-07-15T10:00:00'
  }
];

export const students = [
  { id: 1, name: 'Alice Johnson', studentId: 'S1001', attendance: 95, averageScore: 88, riskStatus: 'Low', email: 'alice.j@student.edu' },
  { id: 2, name: 'Bob Williams', studentId: 'S1002', attendance: 75, averageScore: 65, riskStatus: 'Medium', email: 'bob.w@student.edu' },
  { id: 3, name: 'Charlie Brown', studentId: 'S1003', attendance: 60, averageScore: 50, riskStatus: 'High', email: 'charlie.b@student.edu' },
  { id: 4, name: 'Diana Prince', studentId: 'S1004', attendance: 100, averageScore: 95, riskStatus: 'Low', email: 'diana.p@student.edu' },
  { id: 5, name: 'Evan Davis', studentId: 'S1005', attendance: 85, averageScore: 78, riskStatus: 'Low', email: 'evan.d@student.edu' },
];

export const assignments = [
  { id: 1, title: 'Programming Assignment 1', course: 'CS101', dueDate: '2026-07-20', status: 'Active', submissions: 45, total: 120 },
  { id: 2, title: 'Midterm Project', course: 'CS302', dueDate: '2026-08-15', status: 'Upcoming', submissions: 0, total: 85 },
  { id: 3, title: 'React UI Clone', course: 'CS450', dueDate: '2026-07-10', status: 'Grading', submissions: 43, total: 45 },
];

export const teachingPlan = [
  { week: 1, topic: 'Introduction & Setup', clo: 'CLO1', method: 'Lecture', assessment: 'None', status: 'Completed' },
  { week: 2, topic: 'Variables & Data Types', clo: 'CLO1', method: 'Lecture & Lab', assessment: 'Quiz 1', status: 'In Progress' },
  { week: 3, topic: 'Control Structures', clo: 'CLO2', method: 'Lecture & Lab', assessment: 'Assignment 1', status: 'Upcoming' },
  { week: 4, topic: 'Functions & Modules', clo: 'CLO2', method: 'Lecture & Lab', assessment: 'Assignment 2', status: 'Upcoming' },
];

export const lessons = [
  { id: 1, title: 'Week 1: Introduction to Computer Science', module: 'Module 1', status: 'Published', date: '2026-07-01' },
  { id: 2, title: 'Week 2: Variables and Data Types', module: 'Module 1', status: 'Published', date: '2026-07-08' },
  { id: 3, title: 'Week 3: Control Structures', module: 'Module 2', status: 'Draft', date: '2026-07-15' },
];

export const announcements = [
  { id: 1, title: 'Welcome to CS101', date: '2026-07-01', status: 'Published', pinned: true, content: 'Welcome to the course! Please review the syllabus.' },
  { id: 2, title: 'Assignment 1 Extended', date: '2026-07-10', status: 'Published', pinned: false, content: 'The due date for Assignment 1 has been extended to July 20th.' },
  { id: 3, title: 'Midterm Prep', date: '2026-08-01', status: 'Scheduled', pinned: false, content: 'Midterm will cover weeks 1-6.' },
];

export const files = [
  { id: 1, name: 'Syllabus_CS101.pdf', category: 'Syllabus', size: '1.2 MB', uploadDate: '2026-06-25' },
  { id: 2, name: 'Lecture1_Slides.pdf', category: 'Slides', size: '5.4 MB', uploadDate: '2026-07-01' },
  { id: 3, name: 'Assignment1_Rubric.docx', category: 'References', size: '150 KB', uploadDate: '2026-07-05' },
];

export const kpiData = {
  totalStudents: 250,
  completedSessions: 12,
  pendingGrading: 43,
  atRiskStudents: 5,
  averageScore: 78.5,
  upcomingDeadlines: 3
};
