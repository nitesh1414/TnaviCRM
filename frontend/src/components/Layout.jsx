import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Store, GitCompareArrows, UserPlus, CalendarDays, MessagesSquare, FileText, KeyRound, FolderOpen, CheckSquare, BarChart3, Users, Bell, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { get } from '../api';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/properties', icon: Building2, label: 'Properties' },
  { to: '/brands', icon: Store, label: 'Brands & Clients' },
  { to: '/matching', icon: GitCompareArrows, label: 'Property Matching' },
  { to: '/leads', icon: UserPlus, label: 'Leads & Enquiries' },
  { to: '/meetings', icon: CalendarDays, label: 'Meetings & Visits' },
  { to: '/communications', icon: MessagesSquare, label: 'Communications' },
  { to: '/proposals', icon: FileText, label: 'Proposals' },
  { to: '/leases', icon: KeyRound, label: 'Leases & Agreements' },
  { to: '/documents', icon: FolderOpen, label: 'Documents' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks & Follow-ups' },
  { to: '/reports', icon: BarChart3, label: 'Reports & Analytics' },
  { to: '/users', icon: Users, label: 'Users & Employees' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    get('/notifications?unread=true').then(r => setUnread((r.data || []).length)).catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-logo">T</div>
          <div><div className="brand-name">TnaviCRM</div><div className="brand-sub">Property Leasing CRM</div></div>
          <button className="icon-btn sidebar-close" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
        <nav className="nav">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>
              <item.icon size={18} /><span>{item.label}</span>
              {item.to === '/notifications' && unread > 0 && <span className="nav-badge">{unread}</span>}
              <ChevronRight size={14} className="nav-arrow" />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user-chip">
            <div className="avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</div>
            <div className="user-meta"><div className="user-name">{user?.name}</div><div className="user-role">{user?.role}</div></div>
          </div>
          <button className="btn-ghost" onClick={handleLogout}><LogOut size={16} /> Logout</button>
        </div>
      </aside>
      {open && <div className="sidebar-scrim" onClick={() => setOpen(false)} />}
      <main className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <div className="topbar-title">{NAV.find(n => n.to === location.pathname)?.label || 'TnaviCRM'}</div>
          <div className="topbar-right">
            <NavLink to="/notifications" className="icon-btn bell"><Bell size={18} />{unread > 0 && <span className="bell-dot">{unread}</span>}</NavLink>
            <div className="avatar sm">{(user?.name || 'U').charAt(0).toUpperCase()}</div>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
