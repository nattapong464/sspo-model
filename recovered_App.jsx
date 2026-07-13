import React, { useState, useEffect } from 'react';
import { 
  Users, CalendarPlus, ClipboardList, Activity, Search, MapPin, Star, Phone, AlertTriangle, X, 
  Stethoscope, LayoutDashboard, LogOut, Upload, Download, FileSpreadsheet, Plus, CheckCircle, 
  Database, Trash2, ShoppingCart, Clock, Bell, Link as LinkIcon, FileText
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import * as XLSX from 'xlsx';
import { 
  initializeData, getPatients, savePatients, getRequests, saveRequests, getUsers, saveUsers,
  getNotifications, saveNotifications
} from './data';
import './index.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

const DEVICE_TYPES_LIST = [
  'FO', 'AFO', 'KO', 'KAFO', 'HO', 'HKAFO', 'CO', 'SO', 'ULO', 'shoes', 
  'Seating', 'PFP', 'ADP', 'TTP', 'KDP', 'TFP', 'HDP', 'ULP'
];

const getAvatarUrl = (gender = '', ageStr = '') => {
  const g = String(gender || '').toLowerCase().trim();
  // Ensure we extract numbers if the age string contains text (e.g. \"59 ปี\")
  const ageMatch = String(ageStr).match(/\\d+/);
  const age = ageMatch ? parseInt(ageMatch[0]) : 30; // Default to 30 if missing
  
  // Strict matching
  const isMale = g === 'm' || g === 'male' || g === 'ชาย' || g === 'ช' || g.includes('ชาย') || g.includes('นาย') || g.includes('ด.ช.');
  const isFemale = g === 'f' || g === 'female' || g === 'หญิง' || g === 'ญ' || g.includes('หญิง') || g.includes('นาง') || g.includes('ด.ญ.');
  
  const resolvedMale = isMale || (!isMale && !isFemale); // Fallback to male for neutral
  
  if (age < 18) {
    return resolvedMale ? \"/avatars/child_boy.jpg\" : \"/avatars/child_girl.jpg\";
  } else if (age >= 60) {
    return resolvedMale ? \"/avatars/elder_male.jpg\" : \"/avatars/elder_female.jpg\";
  } else {
    // Adult
    return resolvedMale ? \"/avatars/adult_male.jpg\" : \"/avatars/adult_female.jpg\";
  }
};

function App() {
  useEffect(() => {
    initializeData();
    let loadedPatients = getPatients();
    
    // Auto-fix avatars for existing patients
    let needsSave = false;
    loadedPatients = loadedPatients.map(p => {
      if (p.rawExcelData) {
        const rowKeys = Object.keys(p.rawExcelData);
        let gender = ''; let age = '';
        for (let k of rowKeys) {
          const cleanK = k.trim().toLowerCase();
          if (cleanK === 'gender' || cleanK === 'เพศ') gender = p.rawExcelData[k];
          if (cleanK === 'current age' || cleanK === 'age' || cleanK === 'อายุ') age = p.rawExcelData[k];
        }
        const correctAvatar = getAvatarUrl(gender, age);
        if (p.photo !== correctAvatar) {
          needsSave = true;
          return { ...p, photo: correctAvatar };
        }
      }
      return p;
    });

    if (needsSave) {
      savePatients(loadedPatients);
    }
    
    setPatients(loadedPatients);
    setRequests(getRequests());
    setUsers(getUsers());
    setNotifications(getNotifications());
  }, []);

  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  
  // Auth Forms
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', password: '', name: '' });
  
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [patients, setPatients] = useState([]);
  const [filterDevice, setFilterDevice] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterRating, setFilterRating] = useState('');
  
  // Modals
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    name: '', deviceType: '', disease: '', province: '', phone: '', limitations: '', problems: ''
  });
  
  // Admin Links
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkName, setNewLinkName] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);

  // Cart System for Requests
  const [requestCart, setRequestCart] = useState([]);

  // Request Form state
  const [requests, setRequests] = useState([]);
  const [requestForm, setRequestForm] = useState({
    dateNeeded: '',
    timeStart: '',
    timeEnd: '',
    courseName: '',
    requesterName: ''
  });

  const handleAuth = (e) => {
    e.preventDefault();
    if (isRegistering) {
      const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        username: authForm.username,
        password: authForm.password,
        name: authForm.name,
        role: 'User'
      };
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      saveUsers(updatedUsers);
      setCurrentUser(newUser);
      setActiveTab('directory');
    } else {
      const user = users.find(u => u.username === authForm.username && u.password === authForm.password);
      if (user) {
        setCurrentUser(user);
        setActiveTab(user.role === 'Admin' ? 'dashboard' : 'directory');
      } else {
        alert(\"Invalid username or password.\");
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthForm({ username: '', password: '', name: '' });
    setRequestCart([]);
    setShowNotificationsPanel(false);
  };

  const toggleCart = (patient) => {
    if (requestCart.find(p => p.id === patient.id)) {
      setRequestCart(requestCart.filter(p => p.id !== patient.id));
    } else {
      setRequestCart([...requestCart, patient]);
    }
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (requestCart.length === 0) {
      alert(\"Please select at least one patient from the directory first.\");
      setActiveTab('directory');
      return;
    }

    const newRequest = {
      id: requests.length > 0 ? Math.max(...requests.map(r => r.id)) + 1 : 1,
      ...requestForm,
      requesterId: currentUser.id, // Store who made it
      patients: requestCart,
      status: 'Pending'
    };
    const updatedRequests = [newRequest, ...requests];
    setRequests(updatedRequests);
    saveRequests(updatedRequests);
    setRequestForm({ dateNeeded: '', timeStart: '', timeEnd: '', courseName: '', requesterName: '' });
    setRequestCart([]);
    setActiveTab('requests');
  };

  const handleDeletePatient = (id) => {
    if(window.confirm(\"Are you sure you want to delete this patient?\")) {
      const updated = patients.filter(p => p.id !== id);
      setPatients(updated);
      savePatients(updated);
    }
  };

  const handleAddPatientSubmit = (e) => {
    e.preventDefault();
    const newPatient = {
// MISSING LINE 201
// MISSING LINE 202
// MISSING LINE 203
// MISSING LINE 204
// MISSING LINE 205
// MISSING LINE 206
// MISSING LINE 207
// MISSING LINE 208
// MISSING LINE 209
// MISSING LINE 210
// MISSING LINE 211
// MISSING LINE 212
// MISSING LINE 213
// MISSING LINE 214
// MISSING LINE 215
// MISSING LINE 216
// MISSING LINE 217
// MISSING LINE 218
// MISSING LINE 219
// MISSING LINE 220
// MISSING LINE 221
// MISSING LINE 222
// MISSING LINE 223
// MISSING LINE 224
// MISSING LINE 225
// MISSING LINE 226
// MISSING LINE 227
// MISSING LINE 228
// MISSING LINE 229
// MISSING LINE 230
// MISSING LINE 231
// MISSING LINE 232
// MISSING LINE 233
// MISSING LINE 234
// MISSING LINE 235
// MISSING LINE 236
// MISSING LINE 237
// MISSING LINE 238
// MISSING LINE 239
  const toggleNotifications = () => {
    setShowNotificationsPanel(!showNotificationsPanel);
    if (!showNotificationsPanel && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const importExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      if(data.length > 0) {
        
        // Helper to find value ignoring case and spaces in header names
// MISSING LINE 261
// MISSING LINE 262
// MISSING LINE 263
// MISSING LINE 264
// MISSING LINE 265
// MISSING LINE 266
// MISSING LINE 267
// MISSING LINE 268
// MISSING LINE 269
// MISSING LINE 270
// MISSING LINE 271
// MISSING LINE 272
// MISSING LINE 273
// MISSING LINE 274
// MISSING LINE 275
// MISSING LINE 276
// MISSING LINE 277
// MISSING LINE 278
// MISSING LINE 279
// MISSING LINE 280
// MISSING LINE 281
// MISSING LINE 282
// MISSING LINE 283
// MISSING LINE 284
// MISSING LINE 285
// MISSING LINE 286
// MISSING LINE 287
// MISSING LINE 288
// MISSING LINE 289
// MISSING LINE 290
// MISSING LINE 291
// MISSING LINE 292
// MISSING LINE 293
// MISSING LINE 294
// MISSING LINE 295
// MISSING LINE 296
// MISSING LINE 297
// MISSING LINE 298
// MISSING LINE 299
        
        // Helper to find value ignoring case and spaces in header names
        const getVal = (row, possibleKeys) => {
          const rowKeys = Object.keys(row);
          for (let key of rowKeys) {
            const cleanKey = key.trim().toLowerCase();
            if (possibleKeys.some(pk => pk.toLowerCase() === cleanKey)) {
              return row[key];
            }
          }
          return null;
        };

        const newPatients = data.map((row, index) => {
          const gender = getVal(row, ['Gender', 'เพศ']) || '';
          const age = getVal(row, ['Current Age', 'Age', 'อายุ']) || '';
          return {
            id: patients.length > 0 ? Math.max(...patients.map(p=>p.id)) + index + 1 : index + 1,
            name: getVal(row, ['Full Name', 'Name', 'ชื่อ-สกุล', 'ชื่อ']) || 'Unknown',
            deviceType: getVal(row, ['Device type', 'Type of Orthoses', 'DeviceType', 'ชนิดอุปกรณ์']) || 'Unknown',
            disease: getVal(row, ['Underlying Disease', 'Disease', 'โรค', 'โรคประจำตัว']) || 'Unknown',
            province: getVal(row, ['Province', 'จังหวัด']) || 'Unknown',
            phone: getVal(row, ['Phone', 'Phone2', 'เบอร์โทร', 'เบอร์โทรศัพท์']) || 'Unknown',
            photo: getVal(row, ['PhotoURL']) || getAvatarUrl(gender, age),
            suitabilityLevel: getVal(row, ['SuitabilityLevel', 'ระดับ']) || 'Good',
            suitabilityScore: parseInt(getVal(row, ['SuitabilityScore']) || 3),
            inviteCount: parseInt(getVal(row, ['InviteCount']) || 0),
            documentLinks: [],
            rawExcelData: { ...row }
          };
        });
        const updatedPatients = [...patients, ...newPatients];
        setPatients(updatedPatients);
        savePatients(updatedPatients);
        alert(`Successfully imported ${newPatients.length} patients.`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const exportRequestsToExcel = () => {
    const flatData = requests.map(r => ({
      ID: r.id,
      DateNeeded: r.dateNeeded,
      TimeStart: r.timeStart,
      TimeEnd: r.timeEnd,
      Course: r.courseName,
      Requester: r.requesterName,
      Status: r.status,
      PatientsRequested: r.patients ? r.patients.map(p => p.name).join(', ') : 'N/A'
    }));
    const ws = XLSX.utils.json_to_sheet(flatData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, \"Requests\");
    XLSX.writeFile(wb, \"Patient_Requests.xlsx\");
  };

  // --- Auth View ---
  if (!currentUser) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background-color)' }}>
        <div className=\"card\" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className=\"sidebar-logo-icon\" style={{ display: 'inline-flex', marginBottom: '1rem', width: '48px', height: '48px' }}>
              <Activity size={28} />
            </div>
            <h2 className=\"page-title\" style={{ fontSize: '1.2rem' }}>SSPO Patient model request</h2>
            <p className=\"page-description\">{isRegistering ? 'Create a new account' : 'Sign in to continue'}</p>
          </div>
          
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {isRegistering && (
              <div className=\"form-group\">
                <label className=\"form-label\">Full Name</label>
                <input 
                  type=\"text\" 
                  className=\"form-input\" 
                  value={authForm.name}
                  onChange={e => setAuthForm({...authForm, name: e.target.value})}
                  required
                />
              </div>
            )}
            <div className=\"form-group\">
              <label className=\"form-label\">Username</label>
              <input 
                type=\"text\" 
                className=\"form-input\" 
                value={authForm.username}
                onChange={e => setAuthForm({...authForm, username: e.target.value})}
                required
              />
            </div>
            <div className=\"form-group\">
              <label className=\"form-label\">Password</label>
              <input 
                type=\"password\" 
                className=\"form-input\" 
                value={authForm.password}
                onChange={e => setAuthForm({...authForm, password: e.target.value})}
                required
              />
            </div>
            <button type=\"submit\" className=\"btn btn-primary\" style={{ marginTop: '1rem' }}>
              {isRegistering ? 'Register' : 'Sign In'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <a href=\"#\" onClick={(e) => { e.preventDefault(); setIsRegistering(!isRegistering); setAuthForm({ username: '', password: '', name: '' }); }} style={{ color: 'var(--accent-color)', textDecoration: 'none', fontSize: '0.9rem' }}>
                {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
              </a>
            </div>
            {!isRegistering && (
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                <p>Demo Admin: admin / password</p>
                <p>Demo User: user / password</p>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // --- Main App ---
  const deviceTypes = [...new Set(patients.map(p => p.deviceType))];
  const provinces = [...new Set(patients.map(p => p.province))];
  const filteredPatients = patients.filter(patient => 
    (filterDevice === '' || patient.deviceType === filterDevice) &&
    (filterProvince === '' || patient.province === filterProvince) &&
    (filterSearch === '' || patient.name.toLowerCase().includes(filterSearch.toLowerCase()))
  );

  const userNotifications = notifications.filter(n => n.userId === currentUser.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  return (
    <div className=\"app-container\">
      <aside className=\"sidebar\">
        <div className=\"sidebar-logo\">
          <div className=\"sidebar-logo-icon\"><Activity size={24} /></div>
          <span style={{fontSize: '1.1rem'}}>SSPO Models</span>
        </div>
        
        <nav className=\"nav-links\" style={{ flex: 1 }}>
          {currentUser.role === 'Admin' && (
            <>
              <a className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><LayoutDashboard size={20} /><span>Dashboard</span></a>
              <a className={`nav-link ${activeTab === 'manage_data' ? 'active' : ''}`} onClick={() => setActiveTab('manage_data')}><Database size={20} /><span>Manage Data</span></a>
            </>
          )}
          <a className={`nav-link ${activeTab === 'directory' ? 'active' : ''}`} onClick={() => setActiveTab('directory')}><Users size={20} /><span>Patient Directory</span></a>
// MISSING LINE 451
// MISSING LINE 452
// MISSING LINE 453
// MISSING LINE 454
// MISSING LINE 455
// MISSING LINE 456
// MISSING LINE 457
// MISSING LINE 458
// MISSING LINE 459
// MISSING LINE 460
// MISSING LINE 461
// MISSING LINE 462
// MISSING LINE 463
// MISSING LINE 464
// MISSING LINE 465
// MISSING LINE 466
// MISSING LINE 467
// MISSING LINE 468
// MISSING LINE 469
// MISSING LINE 470
// MISSING LINE 471
// MISSING LINE 472
// MISSING LINE 473
// MISSING LINE 474
// MISSING LINE 475
// MISSING LINE 476
// MISSING LINE 477
// MISSING LINE 478
// MISSING LINE 479
// MISSING LINE 480
// MISSING LINE 481
// MISSING LINE 482
// MISSING LINE 483
// MISSING LINE 484
// MISSING LINE 485
// MISSING LINE 486
// MISSING LINE 487
// MISSING LINE 488
// MISSING LINE 489
// MISSING LINE 490
// MISSING LINE 491
// MISSING LINE 492
// MISSING LINE 493
// MISSING LINE 494
// MISSING LINE 495
// MISSING LINE 496
// MISSING LINE 497
// MISSING LINE 498
// MISSING LINE 499

      <main className=\"main-content\">
        
        {/* --- DASHBOARD --- */}
        {activeTab === 'dashboard' && currentUser.role === 'Admin' && (
          <div>
            <div className=\"page-header\">
              <div><h1 className=\"page-title\">Dashboard Overview</h1><p className=\"page-description\">SSPO Patient model request statistics</p></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className=\"card\" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)', borderRadius: 'var(--radius-md)' }}><Users size={24} /></div>
                <div><div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{patients.length}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Patients</div></div>
              </div>
              <div className=\"card\" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--warning-light)', color: 'var(--warning)', borderRadius: 'var(--radius-md)' }}><ClipboardList size={24} /></div>
                <div><div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{requests.filter(r => r.status === 'Pending').length}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pending Requests</div></div>
              </div>
              <div className=\"card\" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-md)' }}><CheckCircle size={24} /></div>
                <div><div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{requests.filter(r => r.status === 'Approved').length}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Approved Requests</div></div>
              </div>
              <div className=\"card\" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#f3e8ff', color: '#a855f7', borderRadius: 'var(--radius-md)' }}><Users size={24} /></div>
                <div><div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{users.length}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Registered Users</div></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className=\"card\" style={{ padding: '2rem' }}>
                <h3 className=\"section-title\">Patients by Device Type</h3>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
                  <div style={{ flex: 1, height: '250px' }}>
                    <ResponsiveContainer width=\"100%\" height=\"100%\">
                      <PieChart>
                        <Pie data={Object.entries(patients.reduce((acc, p) => ({...acc, [p.deviceType]: (acc[p.deviceType]||0)+1}), {})).sort((a,b)=>b[1]-a[1]).map(([n,v])=>({name:n,value:v}))}
                          cx=\"50%\" cy=\"50%\" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey=\"value\"
                          label={({name}) => `${name}`}>
                          {Object.entries(patients.reduce((acc, p) => ({...acc, [p.deviceType]: (acc[p.deviceType]||0)+1}), {})).sort((a,b)=>b[1]-a[1]).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie><Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: '250px', paddingRight: '0.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead style={{ borderBottom: '2px solid var(--border-color)' }}>
                        <tr>
                          <th style={{ padding: '0.5rem' }}>Device Type</th>
                          <th style={{ padding: '0.5rem' }}>Count</th>
                          <th style={{ padding: '0.5rem' }}>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const counts = patients.reduce((acc, p) => ({...acc, [p.deviceType]: (acc[p.deviceType]||0)+1}), {});
                          const total = patients.length || 1;
                          return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([name, count], index) => (
                            <tr key={name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></span>
                                {name}
                              </td>
                              <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{count}</td>
                              <td style={{ padding: '0.5rem' }}>{((count / total) * 100).toFixed(1)}%</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className=\"card\" style={{ padding: '2rem' }}>
                <h3 className=\"section-title\">Patients by Suitability Level</h3>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width=\"100%\" height=\"100%\">
                     <BarChart data={Object.entries(patients.reduce((acc, p) => ({...acc, [p.suitabilityLevel]: (acc[p.suitabilityLevel]||0)+1}), {})).map(([n,v])=>({name:n,count:v}))}>
                      <XAxis dataKey=\"name\" />
                      <YAxis />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey=\"count\" fill=\"var(--success)\" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- DATA MANAGEMENT --- */}
        {activeTab === 'manage_data' && currentUser.role === 'Admin' && (
          <div>
            <div className=\"page-header\">
              <div><h1 className=\"page-title\">Manage Data</h1><p className=\"page-description\">Database administration tools</p></div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <a href=\"https://drive.google.com/\" target=\"_blank\" rel=\"noreferrer\" className=\"btn btn-outline\" style={{ textDecoration: 'none', color: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   Open Master Google Drive
                </a>
                <button className=\"btn btn-outline\" onClick={() => setShowAddPatientModal(true)}>
                  <Plus size={18} /> Add New Patient
// MISSING LINE 601
// MISSING LINE 602
// MISSING LINE 603
// MISSING LINE 604
// MISSING LINE 605
// MISSING LINE 606
// MISSING LINE 607
// MISSING LINE 608
// MISSING LINE 609
// MISSING LINE 610
// MISSING LINE 611
// MISSING LINE 612
// MISSING LINE 613
// MISSING LINE 614
// MISSING LINE 615
// MISSING LINE 616
// MISSING LINE 617
// MISSING LINE 618
// MISSING LINE 619
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- DIRECTORY (CART SELECTION) --- */}
        {activeTab === 'directory' && (
          <div>
            <div className=\"page-header\">
              <div><h1 className=\"page-title\">Patient Directory</h1><p className=\"page-description\">Select patients to add to your request cart.</p></div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {requestCart.length > 0 && (
                  <button className=\"btn btn-primary\" onClick={() => setActiveTab('request_form')} style={{ animation: 'scaleIn 0.3s ease' }}>
                    <ShoppingCart size={18} /> Proceed ({requestCart.length})
                  </button>
                )}
              </div>
            </div>

            <div className=\"filters-bar\">
              <div className=\"filter-group\"><label className=\"filter-label\">Search by Name</label><input type=\"text\" className=\"form-input\" placeholder=\"Type name...\" value={filterSearch} onChange={e => setFilterSearch(e.target.value)} /></div>
              <div className=\"filter-group\"><label className=\"filter-label\">Device Type</label><select className=\"form-select\" value={filterDevice} onChange={e => setFilterDevice(e.target.value)}><option value=\"\">All Types</option>{deviceTypes.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
              <div className=\"filter-group\"><label className=\"filter-label\">Province</label><select className=\"form-select\" value={filterProvince} onChange={e => setFilterProvince(e.target.value)}><option value=\"\">All Provinces</option>{provinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}</select></div>
            </div>

            <div className=\"patient-grid\">
              {filteredPatients.map(patient => {
                const isSelected = requestCart.some(p => p.id === patient.id);
                // Try to get Age and HN for quick view if available
                const age = patient.rawExcelData?.['Current Age'] || patient.rawExcelData?.Age;
                const hn = patient.rawExcelData?.HN;

                return (
                <div key={patient.id} className=\"card\" style={{ borderColor: isSelected ? 'var(--accent-color)' : '', borderWidth: isSelected ? '2px' : '1px' }}>
                  <div className=\"card-image-wrapper\" onClick={() => setSelectedPatient(patient)} style={{cursor: 'pointer'}}>
                    <img src={patient.photo} alt={patient.name} className=\"card-image\" />
                    <div style={{position: 'absolute', top: '10px', right: '10px'}}><span className=\"badge badge-blue\">Invited {patient.inviteCount}x</span></div>
// MISSING LINE 661
// MISSING LINE 662
// MISSING LINE 663
// MISSING LINE 664
// MISSING LINE 665
// MISSING LINE 666
// MISSING LINE 667
// MISSING LINE 668
// MISSING LINE 669
// MISSING LINE 670
// MISSING LINE 671
// MISSING LINE 672
// MISSING LINE 673
// MISSING LINE 674
// MISSING LINE 675
// MISSING LINE 676
// MISSING LINE 677
// MISSING LINE 678
// MISSING LINE 679
// MISSING LINE 680
// MISSING LINE 681
// MISSING LINE 682
// MISSING LINE 683
// MISSING LINE 684
// MISSING LINE 685
// MISSING LINE 686
// MISSING LINE 687
// MISSING LINE 688
// MISSING LINE 689
// MISSING LINE 690
// MISSING LINE 691
// MISSING LINE 692
// MISSING LINE 693
// MISSING LINE 694
// MISSING LINE 695
// MISSING LINE 696
// MISSING LINE 697
// MISSING LINE 698
// MISSING LINE 699
              <div><h1 className=\"page-title\">Finalize Request</h1><p className=\"page-description\">Review selected patients and fill out the details.</p></div>
            </div>

            <div className=\"form-container\" style={{ maxWidth: '900px' }}>
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--radius-lg)' }}>
                <h3 className=\"section-title\"><ShoppingCart size={20}/> Selected Patients ({requestCart.length})</h3>
                {requestCart.length === 0 ? (
                  <p style={{color: 'var(--danger)', marginTop: '0.5rem'}}>No patients selected. Go back to directory.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    {requestCart.map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                        <div>
                           <div style={{ fontWeight: '600' }}>{p.name}</div>
                           <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.deviceType}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)' }}>
                           <Phone size={14} /> {p.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form className=\"form-grid\" onSubmit={handleRequestSubmit}>
                <div className=\"form-group full-width\">
                  <label className=\"form-label\">Date Needed</label>
                  <input type=\"date\" className=\"form-input\" required value={requestForm.dateNeeded} onChange={e => setRequestForm({...requestForm, dateNeeded: e.target.value})} />
                </div>
                <div className=\"form-group\">
                  <label className=\"form-label\">Start Time</label>
                  <input type=\"time\" className=\"form-input\" required value={requestForm.timeStart} onChange={e => setRequestForm({...requestForm, timeStart: e.target.value})} />
                </div>
                <div className=\"form-group\">
                  <label className=\"form-label\">End Time</label>
                  <input type=\"time\" className=\"form-input\" required value={requestForm.timeEnd} onChange={e => setRequestForm({...requestForm, timeEnd: e.target.value})} />
                </div>
                <div className=\"form-group\">
                  <label className=\"form-label\">Course ID & Name</label>
                  <input type=\"text\" className=\"form-input\" placeholder=\"e.g. PO301: Lower Limb\" required value={requestForm.courseName} onChange={e => setRequestForm({...requestForm, courseName: e.target.value})} />
                </div>
                <div className=\"form-group\">
                  <label className=\"form-label\">Requester Name</label>
                  <input type=\"text\" className=\"form-input\" placeholder=\"Your Name\" required value={requestForm.requesterName} onChange={e => setRequestForm({...requestForm, requesterName: e.target.value})} />
                </div>
                <div className=\"form-group full-width\" style={{marginTop: '1rem'}}>
                  <button type=\"submit\" className=\"btn btn-primary\" style={{width: '100%'}} disabled={requestCart.length === 0}>
                    Submit Final Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- REQUESTS LIST --- */}
        {activeTab === 'requests' && (
          <div>
            <div className=\"page-header\">
              <div><h1 className=\"page-title\">All Patient Requests</h1><p className=\"page-description\">Track and manage submitted requests.</p></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <a href=\"https://docs.google.com/spreadsheets/\" target=\"_blank\" rel=\"noreferrer\" className=\"btn btn-outline\" style={{ textDecoration: 'none' }}>
                   Open in Google Drive
                </a>
                <button className=\"btn btn-outline\" onClick={exportRequestsToExcel}><Download size={18} /> Export Excel</button>
              </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {requests.map(req => (
                <div key={req.id} className=\"card\" style={{flexDirection: 'row', padding: '1.5rem', alignItems: 'center', cursor: 'pointer'}} onClick={() => setSelectedRequest(req)}>
                  <div style={{flex: 1}}>
                    <h3 className=\"card-title\">Course: {req.courseName}</h3>
                    <div style={{ margin: '0.5rem 0', color: 'var(--text-main)' }}>
                      <strong>Patients:</strong> {req.patients ? req.patients.map(p => p.name).join(', ') : req.requiredDeviceType}
                    </div>
                    <div style={{display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem'}}>
                      <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CalendarPlus size={16}/> {req.dateNeeded}</span>
                      <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Clock size={16}/> {req.timeStart} - {req.timeEnd}</span>
                      <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Users size={16}/> {req.requesterName}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <span className={`badge ${req.status === 'Pending' ? 'badge-orange' : 'badge-green'}`}>{req.status}</span>
                    {currentUser.role === 'Admin' && req.status === 'Pending' && (
                      <button className=\"btn btn-outline\" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={(e) => handleUpdateStatus(req.id, 'Approved', e)}>Approve</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- ADD PATIENT MODAL --- */}
      {showAddPatientModal && (
        <div className=\"modal-overlay\" onClick={(e) => { if(e.target === e.currentTarget) setShowAddPatientModal(false) }}>
          <div className=\"modal-content\" style={{ maxWidth: '600px', padding: '2rem' }}>
             <button className=\"modal-close\" onClick={() => setShowAddPatientModal(false)}><X size={20} /></button>
      {showAddPatientModal && (
        <div className=\"modal-overlay\" onClick={(e) => { if(e.target === e.currentTarget) setShowAddPatientModal(false) }}>
          <div className=\"modal-content\" style={{ maxWidth: '600px', padding: '2rem' }}>
             <button className=\"modal-close\" onClick={() => setShowAddPatientModal(false)}><X size={20} /></button>
             <h2 className=\"section-title\" style={{ marginBottom: '1.5rem' }}>Add New Patient</h2>
             <form onSubmit={handleAddPatientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className=\"form-group\">
                  <label className=\"form-label\">Full Name</label>
                  <input type=\"text\" className=\"form-input\" required value={newPatientForm.name} onChange={e => setNewPatientForm({...newPatientForm, name: e.target.value})} />
                </div>
                <div className=\"form-group\">
                  <label className=\"form-label\">Device Type</label>
                  <select className=\"form-select\" required value={newPatientForm.deviceType} onChange={e => setNewPatientForm({...newPatientForm, deviceType: e.target.value})}>
                    <option value=\"\" disabled>Select Device Type</option>
                    {DEVICE_TYPES_LIST.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className=\"form-group\">
                  <label className=\"form-label\">Disease / Condition</label>
                  <input type=\"text\" className=\"form-input\" required value={newPatientForm.disease} onChange={e => setNewPatientForm({...newPatientForm, disease: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className=\"form-group\">
                    <label className=\"form-label\">Province</label>
                    <input type=\"text\" className=\"form-input\" required value={newPatientForm.province} onChange={e => setNewPatientForm({...newPatientForm, province: e.target.value})} />
                  </div>
                  <div className=\"form-group\">
                    <label className=\"form-label\">Phone</label>
                    <input type=\"text\" className=\"form-input\" required value={newPatientForm.phone} onChange={e => setNewPatientForm({...newPatientForm, phone: e.target.value})} />
                  </div>
                </div>
                <div className=\"form-group\">
                  <label className=\"form-label\">Limitations (Optional)</label>
                  <input type=\"text\" className=\"form-input\" value={newPatientForm.limitations} onChange={e => setNewPatientForm({...newPatientForm, limitations: e.target.value})} />
                </div>
                <div className=\"form-group\">
                  <label className=\"form-label\">Problems (Optional)</label>
                  <input type=\"text\" className=\"form-input\" value={newPatientForm.problems} onChange={e => setNewPatientForm({...newPatientForm, problems: e.target.value})} />
                </div>
                <button type=\"submit\" className=\"btn btn-primary\" style={{ marginTop: '1rem' }}>Save Patient</button>
             </form>
          </div>
        </div>
      )}

      {/* --- REQUEST DETAIL MODAL --- */}
      {selectedRequest && (
        <div className=\"modal-overlay\" onClick={(e) => { if(e.target === e.currentTarget) setSelectedRequest(null) }}>
          <div className=\"modal-content\" style={{ maxWidth: '600px', padding: '2rem' }}>
            <button className=\"modal-close\" onClick={() => setSelectedRequest(null)}><X size={20} /></button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 className=\"section-title\" style={{ marginBottom: '0.25rem' }}>{selectedRequest.courseName}</h2>
                <p style={{ color: 'var(--text-muted)' }}>Requested by {selectedRequest.requesterName}</p>
              </div>
              <span className={`badge ${selectedRequest.status === 'Pending' ? 'badge-orange' : 'badge-green'}`}>{selectedRequest.status}</span>
            </div>

            <div className=\"info-section\" style={{ marginBottom: '1.5rem' }}>
              <ul className=\"info-list\">
                <li><span className=\"info-label\">Date Needed</span><span className=\"info-value\">{selectedRequest.dateNeeded}</span></li>
                <li><span className=\"info-label\">Time Needed</span><span className=\"info-value\">{selectedRequest.timeStart} - {selectedRequest.timeEnd}</span></li>
              </ul>
            </div>

            <h3 className=\"section-title\" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Requested Patients ({selectedRequest.patients?.length || 0})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {selectedRequest.patients ? selectedRequest.patients.map(p => (
                 <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--radius-md)' }}>
                   <div>
                      <div style={{ fontWeight: '600' }}>{p.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.deviceType}</div>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)' }}>
                      <Phone size={14} /> {p.phone}
                   </div>
                 </div>
              )) : (
                <div style={{ padding: '1rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--radius-md)' }}>Legacy request format: {selectedRequest.requiredDeviceType}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- PATIENT DETAIL MODAL (DYNAMIC) --- */}
      {selectedPatient && (
        <div className=\"modal-overlay\" onClick={(e) => { if(e.target === e.currentTarget) setSelectedPatient(null) }}>
          <div className=\"modal-content\" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className=\"modal-close\" onClick={() => setSelectedPatient(null)}><X size={20} /></button>
            <div className=\"detail-header\" style={{ alignItems: 'flex-start' }}>
              <img src={selectedPatient.photo} alt={selectedPatient.name} className=\"detail-image\" style={{ width: '120px', height: '120px' }} />
              <div className=\"detail-info\">
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem'}}>
                  <h2 className=\"detail-title\" style={{ fontSize: '1.75rem' }}>{selectedPatient.name}</h2>
                  <span className=\"badge badge-green\">{selectedPatient.suitabilityLevel} Level</span>
                </div>
                <p style={{color: 'var(--accent-color)', fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem'}}>{selectedPatient.deviceType}</p>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)' }}>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Stethoscope size={16}/> {selectedPatient.disease}</span>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={16}/> {selectedPatient.province}</span>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={16}/> {selectedPatient.phone}</span>
                </div>
              </div>
            </div>
            
            <div className=\"detail-body\" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Detailed Medical Info (Dynamic) */}
              <div className=\"info-section\">
                <h3 className=\"section-title\"><Activity size={20}/> Detailed Medical & Functional Info</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {selectedPatient.rawExcelData && Object.entries(selectedPatient.rawExcelData).map(([key, value]) => {
                    // Skip core keys that are already displayed at the top or are internal
                    const skipKeys = ['Full Name', 'Name', 'ชื่อ-สกุล', 'ชื่อ', 'Device type', 'Type of Orthoses', 'DeviceType', 'Underlying Disease', 'Disease', 'โรค', 'Province', 'จังหวัด', 'Phone', 'เบอร์โทร', 'PhotoURL', 'SuitabilityLevel', 'SuitabilityScore', 'InviteCount'];
                    if (skipKeys.includes(key)) return null;
                    // Skip empty values
                    if (value === null || value === undefined || value === '') return null;
                    
                    return (
                      <div key={key} style={{ padding: '0.75rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{key}</div>
                        <div style={{ fontWeight: '500', color: 'var(--text-main)', wordBreak: 'break-word' }}>{value}</div>
                      </div>
                    );
                  })}
                  {(!selectedPatient.rawExcelData || Object.keys(selectedPatient.rawExcelData).length === 0) && (
                    <div style={{ color: 'var(--text-muted)' }}>No additional detailed data available.</div>
                  )}
                </div>
              </div>

              {/* Attachments & Links Section */}
              <div className=\"info-section\" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                <h3 className=\"section-title\"><LinkIcon size={20}/> External Documents & Links</h3>
                
                {/* List existing links */}
                {selectedPatient.documentLinks && selectedPatient.documentLinks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {selectedPatient.documentLinks.map((link, idx) => (
                      <a key={idx} href={link.url} target=\"_blank\" rel=\"noreferrer\" className=\"btn btn-outline\" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.5rem', background: 'white' }}>
                        <FileText size={16} className=\"text-blue-500\" />
                        <span>{link.name}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Open Link ↗</span>
                      </a>
                    ))}
                  </div>
                      </div>
                      <button type=\"submit\" className=\"btn btn-primary\" style={{ padding: '0.5rem 1rem', height: 'auto' }}>Add</button>
                    </form>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
      {/* --- EDIT PATIENT MODAL --- */}
      {showEditModal && editForm && (
        <div className=\"modal-overlay\" onClick={(e) => { if(e.target === e.currentTarget) setShowEditModal(false) }}>
          <div className=\"modal-content\" style={{ maxWidth: '600px', padding: '2rem' }}>
             <button className=\"modal-close\" onClick={() => setShowEditModal(false)}><X size={20} /></button>
             <h2 className=\"section-title\" style={{ marginBottom: '1.5rem' }}>Edit Patient</h2>
             <form onSubmit={handleEditPatientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className=\"form-group\">
                  <label className=\"form-label\">Full Name</label>
                  <input type=\"text\" className=\"form-input\" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                </div>
                <div className=\"form-group\">
                  <label className=\"form-label\">Device Type</label>
                  <select className=\"form-select\" required value={editForm.deviceType} onChange={e => setEditForm({...editForm, deviceType: e.target.value})}>
                    <option value={editForm.deviceType}>{editForm.deviceType}</option>
                    {DEVICE_TYPES_LIST.filter(t => t !== editForm.deviceType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className=\"form-group\">
                  <label className=\"form-label\">Disease / Condition</label>
                  <input type=\"text\" className=\"form-input\" required value={editForm.disease} onChange={e => setEditForm({...editForm, disease: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className=\"form-group\">
                    <label className=\"form-label\">Province</label>
                    <input type=\"text\" className=\"form-input\" required value={editForm.province} onChange={e => setEditForm({...editForm, province: e.target.value})} />
                  </div>
                  <div className=\"form-group\">
                    <label className=\"form-label\">Phone</label>
                    <input type=\"text\" className=\"form-input\" required value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                  </div>
                </div>
                <button type=\"submit\" className=\"btn btn-primary\" style={{ marginTop: '1rem' }}>Save Changes</button>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

