import React, { useState, useEffect } from 'react';
import { 
  Users, CalendarPlus, ClipboardList, Activity, Search, MapPin, Star, Phone, AlertTriangle, X, 
  Stethoscope, LayoutDashboard, LogOut, Upload, Download, FileSpreadsheet, Plus, CheckCircle, 
  Database, Trash2, ShoppingCart, Clock, Bell, Link as LinkIcon, FileText, UserCog
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import * as XLSX from 'xlsx';
import { 
  initializeFirebaseData, subscribeToPatients, subscribeToRequests, subscribeToUsers, subscribeToNotifications,
  addPatient, updatePatient, deletePatient, importPatients,
  addRequest, updateRequest, addUser, updateUser, addNotification, updateNotification, markAllNotificationsRead
} from './data';
import './index.css';

const COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#64748b'];

const DEVICE_TYPES_LIST = [
  'FO', 'AFO', 'KO', 'KAFO', 'HO', 'HKAFO', 'CO', 'SO', 'ULO', 'shoes', 
  'Seating', 'PFP', 'ADP', 'TTP', 'KDP', 'TFP', 'HDP', 'ULP'
];

const getAvatarUrl = (gender = '', ageStr = '') => {
  const g = String(gender || '').toLowerCase().trim();
  const ageMatch = String(ageStr).match(/\d+/);
  const age = ageMatch ? parseInt(ageMatch[0]) : 30;
  
  const isMale = g === 'm' || g === 'male' || g === 'ชาย' || g === 'ช' || g.includes('ชาย') || g.includes('นาย') || g.includes('ด.ช.');
  const isFemale = g === 'f' || g === 'female' || g === 'หญิง' || g === 'ญ' || g.includes('หญิง') || g.includes('นาง') || g.includes('ด.ญ.');
  
  const resolvedMale = isMale || (!isMale && !isFemale);
  
  if (age < 18) {
    return resolvedMale ? "/avatars/child_boy.jpg" : "/avatars/child_girl.jpg";
  } else if (age >= 60) {
    return resolvedMale ? "/avatars/elder_male.jpg" : "/avatars/elder_female.jpg";
  } else {
    return resolvedMale ? "/avatars/adult_male.jpg" : "/avatars/adult_female.jpg";
  }
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  
  // Auth Forms
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', password: '', name: '' });
  const [authError, setAuthError] = useState('');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
  const [editForm, setEditForm] = useState(null);
  const [newPatientForm, setNewPatientForm] = useState({
    name: '', deviceType: '', disease: '', province: '', phone: '', limitations: '', problems: ''
  });
  
  // Links
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

  useEffect(() => {
    initializeFirebaseData();
    const unsubPatients = subscribeToPatients(setPatients);
    const unsubRequests = subscribeToRequests(setRequests);
    const unsubUsers = subscribeToUsers(setUsers);
    const unsubNotifs = subscribeToNotifications(setNotifications);

    return () => {
      unsubPatients();
      unsubRequests();
      unsubUsers();
      unsubNotifs();
    };
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (isRegistering) {
      if (!authForm.username || !authForm.password || !authForm.name) {
        setAuthError('Please fill in all fields.');
        return;
      }
      if (users.find(u => u.username === authForm.username)) {
        setAuthError('Username already exists. Please choose another.');
        return;
      }
      
      const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        username: authForm.username,
        password: authForm.password,
        name: authForm.name,
        role: (users.length === 0 || authForm.username.toLowerCase() === 'admin') ? 'Admin' : 'User'
      };
      
      try {
        await addUser(newUser);
        setCurrentUser(newUser);
        setActiveTab('directory');
      } catch (err) {
        setAuthError('Failed to register. Please try again.');
      }
    } else {
      const user = users.find(u => u.username === authForm.username && u.password === authForm.password);
      if (user) {
        setCurrentUser(user);
        setActiveTab(user.role === 'Admin' ? 'dashboard' : 'directory');
      } else {
        setAuthError("Invalid username or password.");
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthForm({ username: '', password: '', name: '' });
    setRequestCart([]);
    setShowNotificationsPanel(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUser(userId, { role: newRole });
    } catch (err) {
      alert("Failed to update user role.");
    }
  };

  const toggleCart = (patient) => {
    if (requestCart.find(p => p.id === patient.id)) {
      setRequestCart(requestCart.filter(p => p.id !== patient.id));
    } else {
      setRequestCart([...requestCart, patient]);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (requestCart.length === 0) {
      alert("Please select at least one patient from the directory first.");
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
    await addRequest(newRequest);
    setRequestForm({ dateNeeded: '', timeStart: '', timeEnd: '', courseName: '', requesterName: '' });
    setRequestCart([]);
    setActiveTab('requests');
  };

  const handleDeletePatient = async (id) => {
    if(window.confirm("Are you sure you want to delete this patient?")) {
      await deletePatient(id);
    }
  };

  const handleAddPatientSubmit = async (e) => {
    e.preventDefault();
    const newPatient = {
      id: patients.length > 0 ? Math.max(...patients.map(p => p.id)) + 1 : 1,
      ...newPatientForm,
      photo: getAvatarUrl('', ''),
      suitabilityLevel: 'Good',
      suitabilityScore: 3,
      inviteCount: 0,
      documentLinks: []
    };
    await addPatient(newPatient);
    setNewPatientForm({ name: '', deviceType: '', disease: '', province: '', phone: '', limitations: '', problems: '' });
    setShowAddPatientModal(false);
  };

  const handleEditPatientClick = (patient) => {
    setEditForm({...patient});
    setShowEditModal(true);
  };

  const handleEditPatientSubmit = async (e) => {
    e.preventDefault();
    await updatePatient(editForm.id, editForm);
    if (selectedPatient && selectedPatient.id === editForm.id) {
      setSelectedPatient(editForm);
    }
    setShowEditModal(false);
  };

  const handleAddLinkToPatient = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !newLinkUrl || !newLinkName) return;

    const newLink = { url: newLinkUrl, name: newLinkName };
    const updatedLinks = [...(selectedPatient.documentLinks || []), newLink];
    const updatedPatient = { ...selectedPatient, documentLinks: updatedLinks };
    
    await updatePatient(selectedPatient.id, updatedPatient);
    setSelectedPatient(updatedPatient);
    setNewLinkUrl('');
    setNewLinkName('');
  };

  const handleUpdateStatus = async (reqId, newStatus, e) => {
    e.stopPropagation(); // prevent card click
    
    // Update the request status
    await updateRequest(reqId, { status: newStatus });

    // Create Notification for the user who made the request
    const request = requests.find(r => r.id === reqId);
    if (request && request.requesterId) {
      const newNotif = {
        id: notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
        userId: request.requesterId,
        message: `Your request for ${request.courseName} has been ${newStatus}.`,
        date: new Date().toISOString(),
        read: false
      };
      await addNotification(newNotif);
    }
  };

  const markAllAsRead = async () => {
    await markAllNotificationsRead(currentUser.id, notifications);
  };

  const toggleNotifications = () => {
    setShowNotificationsPanel(!showNotificationsPanel);
    if (!showNotificationsPanel && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleFileUpload = async (e) => {
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
        await importPatients(newPatients);
        alert(`Successfully imported ${newPatients.length} patients.`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const exportRequestsToExcel = () => {
    const flatData = (currentUser.role === 'Admin' ? requests : requests.filter(req => req.requesterId === currentUser.id)).map(r => ({
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
    XLSX.utils.book_append_sheet(wb, ws, "Requests");
    XLSX.writeFile(wb, "Patient_Requests.xlsx");
  };

  // --- Auth View ---
  if (!currentUser) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background-color)' }}>
        <div className="card" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="sidebar-logo-icon" style={{ display: 'inline-flex', marginBottom: '1rem', width: '48px', height: '48px', backgroundColor: 'var(--accent-color)', borderRadius: '12px', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={28} color="white" />
            </div>
            <h2 className="page-title" style={{ fontSize: '1.5rem' }}>SSPO Patient model request</h2>
            <p className="page-description">{isRegistering ? 'Create a new account' : 'Sign in to continue'}</p>
          </div>
          
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {authError && (
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                <AlertTriangle size={16} style={{display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom'}}/> {authError}
              </div>
            )}
            
            {isRegistering && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={authForm.name}
                  onChange={e => setAuthForm({...authForm, name: e.target.value})}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-input" 
                value={authForm.username}
                onChange={e => setAuthForm({...authForm, username: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={authForm.password}
                onChange={e => setAuthForm({...authForm, password: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.75rem', fontSize: '1rem' }}>
              {isRegistering ? 'Register' : 'Sign In'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(!isRegistering); setAuthError(''); }} style={{ color: 'var(--accent-color)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>
                {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
              </a>
            </div>

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
    (filterSearch === '' || patient.name.toLowerCase().includes(filterSearch.toLowerCase())) &&
    (filterRating === '' || patient.suitabilityLevel === filterRating)
  );

  const userNotifications = notifications.filter(n => n.userId === currentUser.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  return (
    <div className="app-container">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999}}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><Activity size={24} /></div>
          <span style={{fontSize: '1.25rem', fontWeight: 'bold'}}>SSPO Models</span>
          <button className="mobile-close-btn" style={{display: 'none', background: 'none', border: 'none', color: 'white', marginLeft: 'auto'}} onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="nav-links" style={{ flex: 1 }}>
          <a className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => {setActiveTab('dashboard'); setIsMobileMenuOpen(false);}}><LayoutDashboard size={20} /><span>Dashboard</span></a>
          {currentUser.role === 'Admin' && (
            <>
              <a className={`nav-item ${activeTab === 'manage_data' ? 'active' : ''}`} onClick={() => {setActiveTab('manage_data'); setIsMobileMenuOpen(false);}}><Database size={20} /><span>Manage Data</span></a>
              <a className={`nav-item ${activeTab === 'manage_users' ? 'active' : ''}`} onClick={() => {setActiveTab('manage_users'); setIsMobileMenuOpen(false);}}><UserCog size={20} /><span>Manage Users</span></a>
            </>
          )}
          <a className={`nav-item ${activeTab === 'directory' ? 'active' : ''}`} onClick={() => {setActiveTab('directory'); setIsMobileMenuOpen(false);}}><Users size={20} /><span>Patient Directory</span></a>
          <a className={`nav-item ${activeTab === 'request_form' ? 'active' : ''}`} onClick={() => {setActiveTab('request_form'); setIsMobileMenuOpen(false);}}>
            <ShoppingCart size={20} />
            <span>Request Cart {requestCart.length > 0 && <span style={{ background: 'white', color: 'var(--accent-color)', borderRadius: '10px', padding: '2px 8px', fontSize: '0.75rem', marginLeft: 'auto', fontWeight: 'bold' }}>{requestCart.length}</span>}</span>
          </a>
          <a className={`nav-item ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => {setActiveTab('requests'); setIsMobileMenuOpen(false);}}><ClipboardList size={20} /><span>All Requests</span></a>
        </nav>

        <div style={{ padding: '1rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>{currentUser.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)' }}>{currentUser.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: '500' }}>{currentUser.role}</div>
              </div>
            </div>
            
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button className="btn btn-outline" style={{ padding: '0.5rem', border: 'none', background: 'transparent' }} onClick={toggleNotifications}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '2px', right: '4px', width: '10px', height: '10px', backgroundColor: 'var(--danger)', borderRadius: '50%', border: '2px solid white' }}></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotificationsPanel && (
                <div className="card" style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '0.5rem', width: '280px', zIndex: 100, padding: '0', boxShadow: 'var(--shadow-lg)' }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Notifications
                    <button style={{background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'}} onClick={() => setShowNotificationsPanel(false)}><X size={16}/></button>
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {userNotifications.length === 0 ? (
                      <div style={{ padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No notifications</div>
                    ) : (
                      userNotifications.map(n => (
                        <div key={n.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem', backgroundColor: n.read ? 'transparent' : 'var(--accent-light)' }}>
                          <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', lineHeight: '1.4' }}>{n.message}</p>
                          <small style={{ color: 'var(--text-muted)' }}>{new Date(n.date).toLocaleString()}</small>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <button className="btn btn-outline" style={{ width: '100%', borderColor: 'var(--danger-light)', color: 'var(--danger)' }} onClick={handleLogout}><LogOut size={16} /> Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}} className="mobile-header">
           <button className="mobile-menu-btn" style={{display: 'none', background: 'none', border: 'none', cursor: 'pointer'}} onClick={() => setIsMobileMenuOpen(true)}>
             <LayoutDashboard size={24} color="var(--primary-color)"/>
           </button>
        </div>
        
        {/* --- DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="page-header">
              <div><h1 className="page-title">Dashboard Overview</h1><p className="page-description">SSPO Patient model request statistics</p></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ padding: '1.25rem', backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)', borderRadius: 'var(--radius-lg)' }}><Users size={28} /></div>
                <div><div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{patients.length}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Total Patients</div></div>
              </div>
              <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ padding: '1.25rem', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: 'var(--radius-lg)' }}><ClipboardList size={28} /></div>
                <div><div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{requests.filter(r => r.status === 'Pending').length}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Pending Requests</div></div>
              </div>
              <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ padding: '1.25rem', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: 'var(--radius-lg)' }}><CheckCircle size={28} /></div>
                <div><div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{requests.filter(r => r.status === 'Approved').length}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Approved Requests</div></div>
              </div>
              <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ padding: '1.25rem', backgroundColor: '#f3e8ff', color: '#a855f7', borderRadius: 'var(--radius-lg)' }}><UserCog size={28} /></div>
                <div><div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{users.length}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Registered Users</div></div>
              </div>
            </div>

            <div className="card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
              <h3 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Patients by Device Type</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginTop: '1rem', alignItems: 'center' }}>
                <div style={{ flex: '1 1 300px', height: '400px', minWidth: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={Object.entries(patients.reduce((acc, p) => ({...acc, [p.deviceType]: (acc[p.deviceType]||0)+1}), {})).sort((a,b)=>b[1]-a[1]).map(([n,v])=>({name:n,value:v}))}
                        cx="50%" cy="50%" innerRadius={80} outerRadius={140} paddingAngle={5} dataKey="value"
                        label={({name}) => `${name}`}>
                        {Object.entries(patients.reduce((acc, p) => ({...acc, [p.deviceType]: (acc[p.deviceType]||0)+1}), {})).sort((a,b)=>b[1]-a[1]).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie><Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: '1 1 400px', overflowY: 'auto', maxHeight: '400px', paddingRight: '1rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '1.1rem' }}>
                    <thead style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <tr>
                        <th style={{ padding: '1rem' }}>Device Type</th>
                        <th style={{ padding: '1rem' }}>Count</th>
                        <th style={{ padding: '1rem' }}>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const counts = patients.reduce((acc, p) => ({...acc, [p.deviceType]: (acc[p.deviceType]||0)+1}), {});
                        const total = patients.length || 1;
                        return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([name, count], index) => (
                          <tr key={name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '500' }}>
                              <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '4px', backgroundColor: COLORS[index % COLORS.length] }}></span>
                              {name}
                            </td>
                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{count}</td>
                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{((count / total) * 100).toFixed(1)}%</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MANAGE USERS (ADMIN) --- */}
        {activeTab === 'manage_users' && currentUser.role === 'Admin' && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="page-header">
              <div><h1 className="page-title">Manage Users</h1><p className="page-description">Assign roles and manage access.</p></div>
            </div>
            
            <div className="card" style={{ padding: '1rem', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--background-color)' }}>
                  <tr>
                    <th style={{ padding: '1rem' }}>ID</th>
                    <th style={{ padding: '1rem' }}>Name</th>
                    <th style={{ padding: '1rem' }}>Username</th>
                    <th style={{ padding: '1rem' }}>Current Role</th>
                    <th style={{ padding: '1rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{u.id}</td>
                      <td style={{ padding: '1rem', fontWeight: '600' }}>{u.name}</td>
                      <td style={{ padding: '1rem' }}>@{u.username}</td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${u.role === 'Admin' ? 'badge-blue' : 'badge-gray'}`} style={{fontSize: '0.85rem'}}>{u.role}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {u.id !== currentUser.id ? (
                          <select 
                            className="form-select" 
                            style={{width: 'auto', padding: '0.25rem 2rem 0.25rem 0.5rem'}}
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          >
                            <option value="User">User</option>
                            <option value="Admin">Admin</option>
                          </select>
                        ) : (
                          <span style={{color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic'}}>You</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- DATA MANAGEMENT --- */}
        {activeTab === 'manage_data' && currentUser.role === 'Admin' && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="page-header">
              <div><h1 className="page-title">Manage Data</h1><p className="page-description">Database administration tools</p></div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => setShowAddPatientModal(true)}>
                  <Plus size={18} /> Add New Patient
                </button>
                <label className="btn btn-outline" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={18} /> Import Excel
                  <input type="file" accept=".xlsx, .xls, .csv" hidden onChange={handleFileUpload} />
                </label>
              </div>
            </div>
            
            <div className="card" style={{ padding: '1rem', overflowX: 'auto' }}>
              <h3 className="section-title" style={{ padding: '1rem' }}>Patient Database</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--background-color)' }}>
                  <tr>
                    <th style={{ padding: '1rem' }}>ID</th>
                    <th style={{ padding: '1rem' }}>Name</th>
                    <th style={{ padding: '1rem' }}>Device Type</th>
                    <th style={{ padding: '1rem' }}>Province</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.id}</td>
                      <td style={{ padding: '1rem', fontWeight: '600' }}>{p.name}</td>
                      <td style={{ padding: '1rem' }}><span className="badge badge-gray">{p.deviceType}</span></td>
                      <td style={{ padding: '1rem' }}>{p.province}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', marginRight: '0.5rem' }} onClick={() => {setEditForm(p); setShowEditModal(true);}}>
                          Edit
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', color: 'var(--danger)', borderColor: 'var(--danger-light)', backgroundColor: 'var(--danger-light)' }} onClick={() => handleDeletePatient(p.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {patients.length === 0 && (
                    <tr><td colSpan="5" style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>No patients found. Import or add new patients to get started.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- DIRECTORY (CART SELECTION) --- */}
        {activeTab === 'directory' && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="page-header">
              <div><h1 className="page-title">Patient Directory</h1><p className="page-description">Select patients to add to your request cart.</p></div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {requestCart.length > 0 && (
                  <button className="btn btn-primary" onClick={() => setActiveTab('request_form')} style={{ animation: 'scaleIn 0.3s ease' }}>
                    <ShoppingCart size={18} /> View Cart ({requestCart.length})
                  </button>
                )}
              </div>
            </div>

            <div className="filters-bar" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem' }}>
              <div className="filter-group">
                <label className="filter-label">Search by Name</label>
                <div style={{ position: 'relative' }}>
                   <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
                   <input type="text" className="form-input" style={{ paddingLeft: '36px' }} placeholder="Type name..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} />
                </div>
              </div>
              <div className="filter-group">
                <label className="filter-label">Device Type</label>
                <select className="form-select" value={filterDevice} onChange={e => setFilterDevice(e.target.value)}><option value="">All Types</option>{deviceTypes.map(type => <option key={type} value={type}>{type}</option>)}</select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Province</label>
                <select className="form-select" value={filterProvince} onChange={e => setFilterProvince(e.target.value)}><option value="">All Provinces</option>{provinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}</select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Rating</label>
                <select className="form-select" value={filterRating} onChange={e => setFilterRating(e.target.value)}>
                  <option value="">All Ratings</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            </div>

            <div className="patient-grid">
              {filteredPatients.map(patient => {
                const isSelected = requestCart.some(p => p.id === patient.id);
                const age = patient.rawExcelData?.['Current Age'] || patient.rawExcelData?.Age;
                const hn = patient.rawExcelData?.HN;

                return (
                <div key={patient.id} className="card" style={{ borderColor: isSelected ? 'var(--accent-color)' : '', borderWidth: isSelected ? '2px' : '1px', transition: 'all 0.2s ease', transform: isSelected ? 'translateY(-4px)' : 'none', boxShadow: isSelected ? 'var(--shadow-lg)' : 'var(--shadow-sm)' }}>
                  <div className="card-image-wrapper" onClick={() => setSelectedPatient(patient)} style={{cursor: 'pointer'}}>
                    <img src={patient.photo} alt={patient.name} className="card-image" />
                    <div style={{position: 'absolute', top: '10px', right: '10px'}}><span className="badge badge-blue" style={{backdropFilter: 'blur(4px)', backgroundColor: 'rgba(59, 130, 246, 0.9)'}}>Invited {patient.inviteCount}x</span></div>
                  </div>
                  <div className="card-body">
                    <h3 className="card-title" onClick={() => setSelectedPatient(patient)} style={{cursor: 'pointer'}}>{patient.name}</h3>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                       {hn && <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><FileText size={12}/> HN: {hn}</span>}
                       {age && <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><Users size={12}/> Age: {age}</span>}
                    </div>
                    <p className="card-subtitle"><Stethoscope size={14}/> {patient.disease}</p>
                    <div className="card-tags"><span className="badge badge-gray">{patient.deviceType}</span></div>
                    
                    <button 
                      className={`btn ${isSelected ? 'btn-outline' : 'btn-primary'}`} 
                      style={{ width: '100%', marginTop: 'auto', backgroundColor: isSelected ? 'var(--accent-light)' : '', color: isSelected ? 'var(--accent-color)' : '', borderColor: isSelected ? 'var(--accent-color)' : '' }}
                      onClick={() => toggleCart(patient)}
                    >
                      {isSelected ? <><CheckCircle size={16}/> Added to Request</> : <><Plus size={16}/> Select Patient</>}
                    </button>
                  </div>
                </div>
              )})}
              {filteredPatients.length === 0 && (
                <div style={{gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', backgroundColor: 'white', borderRadius: 'var(--radius-lg)'}}>
                   <Users size={48} color="var(--text-muted)" style={{marginBottom: '1rem'}} />
                   <h3 style={{color: 'var(--text-main)', marginBottom: '0.5rem'}}>No patients found</h3>
                   <p style={{color: 'var(--text-muted)'}}>Try adjusting your filters or search term.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- REQUEST FORM --- */}
        {activeTab === 'request_form' && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="page-header">
              <div><h1 className="page-title">Finalize Request</h1><p className="page-description">Review selected patients and fill out the details.</p></div>
              <button className="btn btn-outline" onClick={() => setActiveTab('directory')}>Back to Directory</button>
            </div>

            <div className="form-container" style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 350px' }}>
              <form className="card" style={{ padding: '2rem' }} onSubmit={handleRequestSubmit}>
                <h3 className="section-title" style={{marginBottom: '1.5rem', fontSize: '1.25rem'}}>Request Details</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Date Needed</label>
                    <input type="date" className="form-input" required value={requestForm.dateNeeded} onChange={e => setRequestForm({...requestForm, dateNeeded: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input type="time" className="form-input" required value={requestForm.timeStart} onChange={e => setRequestForm({...requestForm, timeStart: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input type="time" className="form-input" required value={requestForm.timeEnd} onChange={e => setRequestForm({...requestForm, timeEnd: e.target.value})} />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Course ID & Name</label>
                    <input type="text" className="form-input" placeholder="e.g. PO301: Lower Limb" required value={requestForm.courseName} onChange={e => setRequestForm({...requestForm, courseName: e.target.value})} />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Requester Name</label>
                    <input type="text" className="form-input" placeholder="Your Name" required value={requestForm.requesterName} onChange={e => setRequestForm({...requestForm, requesterName: e.target.value})} />
                  </div>
                </div>
                <div style={{marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)'}}>
                  <button type="submit" className="btn btn-primary" style={{width: '100%', padding: '1rem', fontSize: '1.1rem'}} disabled={requestCart.length === 0}>
                    Submit Request
                  </button>
                </div>
              </form>

              <div>
                <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '2rem' }}>
                  <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <ShoppingCart size={20}/> Selected Patients ({requestCart.length})
                  </h3>
                  {requestCart.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--danger)', backgroundColor: 'var(--danger-light)', borderRadius: 'var(--radius-md)' }}>
                      No patients selected. Go back to directory.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {requestCart.map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--radius-md)', alignItems: 'center' }}>
                          <div>
                             <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{p.name}</div>
                             <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.deviceType}</div>
                          </div>
                          <button style={{background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem'}} onClick={() => toggleCart(p)}>
                             <X size={16}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- REQUESTS LIST --- */}
        {activeTab === 'requests' && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">{currentUser.role === 'Admin' ? 'All Patient Requests' : 'My Requests'}</h1>
                <p className="page-description">Track and manage submitted requests.</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-outline" onClick={exportRequestsToExcel}><Download size={18} /> Export Excel</button>
              </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
              {(currentUser.role === 'Admin' ? requests : requests.filter(req => req.requesterId === currentUser.id)).length === 0 ? (
                <div className="card" style={{padding: '4rem', textAlign: 'center'}}>
                  <ClipboardList size={48} color="var(--text-muted)" style={{marginBottom: '1rem'}} />
                  <h3 style={{color: 'var(--text-main)'}}>No requests found</h3>
                  <p style={{color: 'var(--text-muted)'}}>When requests are made, they will appear here.</p>
                </div>
              ) : (currentUser.role === 'Admin' ? requests : requests.filter(req => req.requesterId === currentUser.id)).map(req => (
                <div key={req.id} className="card" style={{flexDirection: 'row', padding: '1.5rem', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s ease', borderLeft: `4px solid ${req.status === 'Pending' ? '#f59e0b' : '#10b981'}`}} onClick={() => setSelectedRequest(req)}>
                  <div style={{flex: 1}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <h3 className="card-title" style={{ margin: 0, fontSize: '1.25rem' }}>{req.courseName}</h3>
                      <span className={`badge ${req.status === 'Pending' ? 'badge-orange' : 'badge-green'}`}>{req.status}</span>
                    </div>
                    
                    <div style={{ margin: '0.75rem 0', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                      <strong style={{color: 'var(--text-muted)'}}>Patients:</strong> {req.patients ? req.patients.map(p => p.name).join(', ') : req.requiredDeviceType}
                    </div>
                    
                    <div style={{display: 'flex', gap: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem'}}>
                      <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CalendarPlus size={16}/> {new Date(req.dateNeeded).toLocaleDateString()}</span>
                      <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Clock size={16}/> {req.timeStart} - {req.timeEnd}</span>
                      <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Users size={16}/> {req.requesterName}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', minWidth: '120px' }}>
                    {currentUser.role === 'Admin' && req.status === 'Pending' && (
                      <button className="btn btn-primary" style={{ width: '100%', backgroundColor: '#10b981', borderColor: '#10b981' }} onClick={(e) => handleUpdateStatus(req.id, 'Approved', e)}>Approve</button>
                    )}
                    <button className="btn btn-outline" style={{ width: '100%' }}>View Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- ADD PATIENT MODAL --- */}
      {showAddPatientModal && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setShowAddPatientModal(false) }}>
          <div className="modal-content" style={{ maxWidth: '600px', padding: '2.5rem' }}>
             <button className="modal-close" onClick={() => setShowAddPatientModal(false)}><X size={24} /></button>
             <h2 className="section-title" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Add New Patient</h2>
             <form onSubmit={handleAddPatientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" required value={newPatientForm.name} onChange={e => setNewPatientForm({...newPatientForm, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Device Type</label>
                  <select className="form-select" required value={newPatientForm.deviceType} onChange={e => setNewPatientForm({...newPatientForm, deviceType: e.target.value})}>
                    <option value="" disabled>Select Device Type</option>
                    {DEVICE_TYPES_LIST.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Disease / Condition</label>
                  <input type="text" className="form-input" required value={newPatientForm.disease} onChange={e => setNewPatientForm({...newPatientForm, disease: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Province</label>
                    <input type="text" className="form-input" required value={newPatientForm.province} onChange={e => setNewPatientForm({...newPatientForm, province: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input type="text" className="form-input" required value={newPatientForm.phone} onChange={e => setNewPatientForm({...newPatientForm, phone: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Limitations (Optional)</label>
                  <input type="text" className="form-input" value={newPatientForm.limitations} onChange={e => setNewPatientForm({...newPatientForm, limitations: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Problems (Optional)</label>
                  <input type="text" className="form-input" value={newPatientForm.problems} onChange={e => setNewPatientForm({...newPatientForm, problems: e.target.value})} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddPatientModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Patient</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* --- EDIT PATIENT MODAL --- */}
      {showEditModal && editForm && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setShowEditModal(false) }}>
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem' }}>
             <button className="modal-close" onClick={() => setShowEditModal(false)}><X size={24} /></button>
             <h2 className="section-title" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Edit Patient: {editForm.name}</h2>
              <form onSubmit={handleEditPatientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-input" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Device Type</label>
                    <select className="form-select" required value={editForm.deviceType} onChange={e => setEditForm({...editForm, deviceType: e.target.value})}>
                      {DEVICE_TYPES_LIST.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Disease / Condition</label>
                    <input type="text" className="form-input" value={editForm.disease || ''} onChange={e => setEditForm({...editForm, disease: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Province</label>
                    <input type="text" className="form-input" value={editForm.province || ''} onChange={e => setEditForm({...editForm, province: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input type="text" className="form-input" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Invite Count</label>
                    <input type="number" className="form-input" required value={editForm.inviteCount} onChange={e => setEditForm({...editForm, inviteCount: parseInt(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <select className="form-select" required value={editForm.suitabilityLevel} onChange={e => setEditForm({...editForm, suitabilityLevel: e.target.value})}>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Limitations</label>
                  <input type="text" className="form-input" value={editForm.limitations || ''} onChange={e => setEditForm({...editForm, limitations: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Problems</label>
                  <input type="text" className="form-input" value={editForm.problems || ''} onChange={e => setEditForm({...editForm, problems: e.target.value})} />
                </div>
                
                {editForm.rawExcelData && Object.keys(editForm.rawExcelData).length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Other Information (Excel Data)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {Object.entries(editForm.rawExcelData).map(([key, value]) => {
                         if (['Full Name', 'Name', 'ชื่อ-สกุล', 'ชื่อ', 'Device type', 'Type of Orthoses', 'DeviceType', 'ชนิดอุปกรณ์', 'Underlying Disease', 'Disease', 'โรค', 'โรคประจำตัว', 'Province', 'จังหวัด', 'Phone', 'Phone2', 'เบอร์โทร', 'เบอร์โทรศัพท์', 'PhotoURL', 'SuitabilityLevel', 'ระดับ', 'SuitabilityScore', 'InviteCount', 'Gender', 'เพศ', 'Current Age', 'Age', 'อายุ', 'HN'].includes(key)) return null;
                         return (
                           <div className="form-group" key={key}>
                             <label className="form-label" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>{key}</label>
                             <input type="text" className="form-input" value={value || ''} onChange={e => setEditForm({...editForm, rawExcelData: {...editForm.rawExcelData, [key]: e.target.value}})} />
                           </div>
                         )
                      })}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* --- REQUEST DETAIL MODAL --- */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setSelectedRequest(null) }}>
          <div className="modal-content" style={{ maxWidth: '700px', padding: '2.5rem' }}>
            <button className="modal-close" onClick={() => setSelectedRequest(null)}><X size={24} /></button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>{selectedRequest.courseName}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Requested by <strong>{selectedRequest.requesterName}</strong></p>
              </div>
              <span className={`badge ${selectedRequest.status === 'Pending' ? 'badge-orange' : 'badge-green'}`} style={{fontSize: '1rem', padding: '0.5rem 1rem'}}>{selectedRequest.status}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
               <div className="card" style={{padding: '1.5rem', backgroundColor: 'var(--background-color)'}}>
                  <div style={{color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.9rem'}}>Date Needed</div>
                  <div style={{fontWeight: '600', fontSize: '1.1rem'}}>{new Date(selectedRequest.dateNeeded).toLocaleDateString()}</div>
               </div>
               <div className="card" style={{padding: '1.5rem', backgroundColor: 'var(--background-color)'}}>
                  <div style={{color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.9rem'}}>Time Slot</div>
                  <div style={{fontWeight: '600', fontSize: '1.1rem'}}>{selectedRequest.timeStart} - {selectedRequest.timeEnd}</div>
               </div>
            </div>

            <h3 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Requested Patients ({selectedRequest.patients?.length || 0})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedRequest.patients ? selectedRequest.patients.map(p => (
                 <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem', alignItems: 'center' }}>
                   <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                      <img src={p.photo} alt={p.name} style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{p.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{p.deviceType}</div>
                      </div>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', backgroundColor: 'var(--background-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
                      <Phone size={16} color="var(--accent-color)" /> {p.phone}
                   </div>
                 </div>
              )) : (
                <div style={{ padding: '1.5rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>Legacy request format: {selectedRequest.requiredDeviceType}</div>
              )}
            </div>
            
            {currentUser.role === 'Admin' && selectedRequest.status === 'Pending' && (
              <div style={{marginTop: '2rem', display: 'flex', justifyContent: 'flex-end'}}>
                 <button className="btn btn-primary" style={{backgroundColor: '#10b981', borderColor: '#10b981', padding: '0.75rem 2rem', fontSize: '1.1rem'}} onClick={(e) => { handleUpdateStatus(selectedRequest.id, 'Approved', e); setSelectedRequest({...selectedRequest, status: 'Approved'}) }}>
                   Approve Request
                 </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- PATIENT DETAIL MODAL --- */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setSelectedPatient(null) }}>
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '0' }}>
            <button className="modal-close" style={{position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'rgba(255,255,255,0.8)', padding: '0.5rem', borderRadius: '50%'}} onClick={() => setSelectedPatient(null)}><X size={20} /></button>
            
            <div style={{ display: 'flex', flexDirection: 'row', '@media (maxWidth: 768px)': { flexDirection: 'column' } }}>
              <div style={{ flex: '0 0 300px', backgroundColor: 'var(--primary-color)', color: 'white', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <img src={selectedPatient.photo} alt={selectedPatient.name} style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.2)', marginBottom: '1.5rem' }} />
                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>{selectedPatient.name}</h2>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.9rem', marginBottom: '2rem' }}>{selectedPatient.deviceType}</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', textAlign: 'left', marginTop: 'auto' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><MapPin size={20} opacity={0.7}/> <span>{selectedPatient.province}</span></div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><Phone size={20} opacity={0.7}/> <span>{selectedPatient.phone}</span></div>
                </div>
              </div>
              
              <div style={{ flex: 1, padding: '3rem 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Medical Profile</h3>
                  <span className={`badge ${selectedPatient.suitabilityLevel === 'Excellent' ? 'badge-green' : selectedPatient.suitabilityLevel === 'Good' ? 'badge-blue' : 'badge-orange'}`} style={{fontSize: '1rem', padding: '0.5rem 1rem'}}>{selectedPatient.suitabilityLevel} Level</span>
                </div>
                
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Underlying Disease</h4>
                    <p style={{ fontSize: '1.1rem', backgroundColor: 'var(--background-color)', padding: '1rem', borderRadius: 'var(--radius-md)', margin: 0 }}>{selectedPatient.disease || 'None reported'}</p>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Limitations</h4>
                    <p style={{ fontSize: '1.1rem', backgroundColor: 'var(--background-color)', padding: '1rem', borderRadius: 'var(--radius-md)', margin: 0 }}>{selectedPatient.limitations || 'None reported'}</p>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Problems</h4>
                    <p style={{ fontSize: '1.1rem', backgroundColor: 'var(--background-color)', padding: '1rem', borderRadius: 'var(--radius-md)', margin: 0 }}>{selectedPatient.problems || 'None reported'}</p>
                  </div>
                  
                  {selectedPatient.rawExcelData && Object.keys(selectedPatient.rawExcelData).length > 0 && (
                    <div>
                      <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Other Information</h4>
                      <div style={{ backgroundColor: 'var(--background-color)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {Object.entries(selectedPatient.rawExcelData).map(([key, value]) => {
                           if (['Full Name', 'Name', 'ชื่อ-สกุล', 'ชื่อ', 'Device type', 'Type of Orthoses', 'DeviceType', 'ชนิดอุปกรณ์', 'Underlying Disease', 'Disease', 'โรค', 'โรคประจำตัว', 'Province', 'จังหวัด', 'Phone', 'Phone2', 'เบอร์โทร', 'เบอร์โทรศัพท์', 'PhotoURL', 'SuitabilityLevel', 'ระดับ', 'SuitabilityScore', 'InviteCount', 'Gender', 'เพศ', 'Current Age', 'Age', 'อายุ', 'HN'].includes(key)) return null;
                           if (!value || String(value).trim() === '') return null; // Do not show empty fields
                           return (
                             <div key={key}>
                               <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{key}</div>
                               <div style={{ fontWeight: '500', fontSize: '0.95rem', wordBreak: 'break-word' }}>{value}</div>
                             </div>
                           )
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Attached Documents</h4>
                    {selectedPatient.documentLinks && selectedPatient.documentLinks.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        {selectedPatient.documentLinks.map((link, index) => (
                          <a key={index} href={link.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)', borderRadius: 'var(--radius-md)', textDecoration: 'none', fontWeight: '500' }}>
                             <LinkIcon size={16} /> {link.name}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', fontStyle: 'italic', backgroundColor: 'var(--background-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>No documents attached</p>
                    )}
                    
                    {currentUser.role === 'Admin' && (
                      <form onSubmit={handleAddLinkToPatient} style={{ display: 'flex', gap: '0.5rem' }}>
                         <input type="text" className="form-input" placeholder="Document Name" style={{ flex: 1 }} required value={newLinkName} onChange={e => setNewLinkName(e.target.value)} />
                         <input type="url" className="form-input" placeholder="URL (Google Drive, etc.)" style={{ flex: 2 }} required value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} />
                         <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}><Plus size={16}/></button>
                      </form>
                    )}
                  </div>
                </div>
                
                <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    Invited: <strong>{selectedPatient.inviteCount} times</strong>
                  </div>
                  <button 
                    className={`btn ${requestCart.some(p => p.id === selectedPatient.id) ? 'btn-outline' : 'btn-primary'}`}
                    onClick={() => { toggleCart(selectedPatient); setSelectedPatient(null); }}
                  >
                    {requestCart.some(p => p.id === selectedPatient.id) ? 'Remove from Cart' : 'Add to Request Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
