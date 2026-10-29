import { Activity, BookOpenText, Boxes, ChefHat, CircleHelp, ClipboardList, LayoutDashboard, Menu as MenuIcon, Settings2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useApp } from './context';

export type Page = 'overview' | 'orders' | 'menu' | 'inventory' | 'activity' | 'settings';
const mainItems: { id: Page; label: string; icon: ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={19} strokeWidth={1.8}/> },
  { id: 'orders', label: 'Orders', icon: <ClipboardList size={19} strokeWidth={1.8}/> },
  { id: 'menu', label: 'Menu & recipes', icon: <BookOpenText size={19} strokeWidth={1.8}/> },
  { id: 'inventory', label: 'Inventory', icon: <Boxes size={19} strokeWidth={1.8}/> },
];
const secondaryItems: { id: Page; label: string; icon: ReactNode }[] = [
  { id: 'activity', label: 'Activity', icon: <Activity size={19} strokeWidth={1.8}/> },
  { id: 'settings', label: 'Settings', icon: <Settings2 size={19} strokeWidth={1.8}/> },
];
export function Sidebar({ page, navigate, mobileOpen, closeMobile, showHelp }: { page: Page; navigate(page: Page): void; mobileOpen: boolean; closeMobile(): void; showHelp(): void }) {
  const { data, demo } = useApp();
  const item = ({ id, label, icon }: { id: Page; label: string; icon: ReactNode }) => <button key={id} onClick={() => { navigate(id); closeMobile(); }} className={`nav-item ${page === id ? 'nav-active' : ''}`} aria-current={page === id ? 'page' : undefined}>{icon}<span>{label}</span>{id === 'orders' && data && data.orders.filter((o) => o.status === 'Preparing').length > 0 && <span className="nav-count">{data.orders.filter((o) => o.status === 'Preparing').length}</span>}</button>;
  return <><div className={`mobile-scrim ${mobileOpen ? 'show' : ''}`} onClick={closeMobile}/><aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
    <div className="sidebar-brand"><div className="brand-mark"><span>M</span><i/></div><div className="brand-name">MISE<span>/</span><small>RESTAURANT SERVICE DESK</small></div><button className="mobile-close" onClick={closeMobile} aria-label="Close navigation"><X size={20}/></button></div>
    <div className="workspace"><span className="workspace-icon"><ChefHat size={20}/></span><div className="workspace-copy"><strong>{data?.restaurant.name ?? 'Paloma Kitchen'}</strong><small>{data?.restaurant.location ?? 'Kitchen workspace'}</small></div></div>
    <div className="nav-section-title">WORKSPACE</div><nav className="nav-group" aria-label="Primary navigation">{mainItems.map(item)}</nav>
    <div className="nav-section-title tools-label">MANAGE</div><nav className="nav-group" aria-label="Secondary navigation">{secondaryItems.map(item)}</nav>
    <div className="sidebar-grow"/>
    <div className="sidebar-note"><span className="note-icon"><MenuIcon size={19}/></span><div><strong>Built for busy service.</strong><p>Orders and ingredient stock move together, every shift.</p></div></div>
    <button className="sidebar-help" onClick={showHelp}><CircleHelp size={18}/> How Mise works</button>
    <div className="sidebar-footer"><div className="tiny-avatar">PK</div><div><strong>{data?.restaurant.name ?? 'Paloma Kitchen'}</strong><small>{demo ? 'Sample workspace · Local data' : 'Connected workspace'}</small></div><span className="online-dot"/></div>
  </aside></>;
}
