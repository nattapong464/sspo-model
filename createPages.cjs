const fs = require('fs');

const pages = ['MyCourses', 'TeachingPlan', 'Lessons', 'Assignments', 'Attendance', 'Grades', 'Students', 'Announcements', 'CalendarView', 'Files', 'Reports', 'Settings'];

pages.forEach(page => {
  const content = `import React from 'react';

const ${page} = () => {
  return (
    <div className="page-container" style={{ padding: '20px', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)' }}>
      <h2>${page}</h2>
      <p>This is the ${page} module. Development in progress.</p>
    </div>
  );
};

export default ${page};
`;
  fs.writeFileSync(`src/pages/${page}.jsx`, content);
});
console.log('Pages created.');
