import { useEffect, useState } from 'react';
import { ArrowUpRight, CircleHelp, Menu as MenuIcon, Plus, Sparkles } from 'lucide-react';
import { AppProvider, useApp } from './components/context';
import { Button, Modal, ToastNotice } from './components/ui';
import { Sidebar, type Page } from './components/navigation';
import { Overview } from './features/Overview';
import { Inventory } from './features/Inventory';
import { MenuPage } from './features/Menu';
import { Orders } from './features/Orders';
import { ActivityPage } from './features/Activity';
import { SettingsPage } from './features/Settings';
import { NewOrderModal } from './features/NewOrder';
import { IngredientModal, RestockModal } from './features/StockModals';
import { DishModal } from './features/DishModal';
import type { MenuItem } from './models/types';
import './styles/main.css';
import './styles/service-desk.css';

type Dialog = { type: 'order' } | { type: 'ingredient' } | { type: 'restock'; ingredientId: string } | { type: 'dish'; dish?: MenuItem } | { type: 'help' } | null;
const pageIds: Page[] = ['overview', 'orders', 'menu', 'inventory', 'activity', 'settings'];
function initialPage(): Page { const name = window.location.hash.slice(1) as Page; return pageIds.includes(name) ? name : 'overview'; }

function MainApp() {
  const { data, loading, error, reload, demo } = useApp();
  const [page, setPage] = useState<Page>(initialPage);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  function navigate(next: Page) { setPage(next); window.location.hash = next; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  useEffect(() => { const listener = () => setPage(initialPage()); window.addEventListener('hashchange', listener); return () => window.removeEventListener('hashchange', listener); }, []);
  const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  if (loading) return <div className="app-loading"><div className="brand-loading">m<span>.</span></div><p>Starting your service desk...</p><div className="loading-bar"/></div>;
  if (error && !data) return <div className="app-loading"><h2>We couldn't open your workspace.</h2><p>{error}</p><Button onClick={() => void reload()}>Try again</Button></div>;
  return <div className="app-shell">
    <Sidebar page={page} navigate={navigate} mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} showHelp={() => setDialog({ type: 'help' })}/>
    <div className="main-column">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><MenuIcon size={22}/></button><span className="topbar-path">{data?.restaurant.name ?? 'Paloma Kitchen'}</span><span className="topbar-separator">/</span><strong>{page === 'menu' ? 'Menu & recipes' : page.charAt(0).toUpperCase() + page.slice(1)}</strong></div><div className="topbar-right"><span className="topbar-date">{today}</span>{demo && <span className="demo-chip"><span/> SAMPLE WORKSPACE</span>}<button className="topbar-circle" title="Learn how Mise works" aria-label="How Mise works" onClick={() => setDialog({ type: 'help' })}><CircleHelp size={18}/></button><div className="avatar">PK</div></div></header>
      <main className="main-content">
        {page === 'overview' && <Overview navigate={navigate} openOrder={() => setDialog({ type: 'order' })} openIngredient={() => setDialog({ type: 'ingredient' })} openDish={() => setDialog({ type: 'dish' })} openRestock={(ingredientId) => setDialog({ type: 'restock', ingredientId })}/>}
        {page === 'orders' && <Orders openOrder={() => setDialog({ type: 'order' })}/>}
        {page === 'menu' && <MenuPage openDish={(dish) => setDialog({ type: 'dish', dish })} openOrder={() => setDialog({ type: 'order' })}/>}
        {page === 'inventory' && <Inventory openIngredient={() => setDialog({ type: 'ingredient' })} openRestock={(ingredientId) => setDialog({ type: 'restock', ingredientId })}/>}
        {page === 'activity' && <ActivityPage/>}
        {page === 'settings' && <SettingsPage/>}
      </main>
      <footer className="main-footer"><span>Your kitchen operations, in one view.</span><span>Mise © 2026 · {demo ? 'Frontend preview' : 'Connected'}</span></footer>
    </div>
    {dialog?.type === 'order' && <NewOrderModal onClose={() => setDialog(null)} onPlaced={() => { setDialog(null); navigate('orders'); }}/>}
    {dialog?.type === 'ingredient' && <IngredientModal onClose={() => setDialog(null)} onSaved={() => setDialog(null)}/>}
    {dialog?.type === 'restock' && <RestockModal ingredientId={dialog.ingredientId} onClose={() => setDialog(null)} onSaved={() => setDialog(null)}/>}
    {dialog?.type === 'dish' && <DishModal dish={dialog.dish} onClose={() => setDialog(null)} onSaved={() => setDialog(null)}/>}
    {dialog?.type === 'help' && <Modal title="A simpler way to run service." eyebrow="THE THREE-STEP LOOP" onClose={() => setDialog(null)}><div className="help-steps">{[{ n: '01', title: 'Keep your ingredients up to date.', body: 'Start with the stock you have. Add new ingredients or record deliveries any time.' }, { n: '02', title: 'Connect each dish to a recipe.', body: 'Tell Mise exactly how much of each ingredient one serving uses.' }, { n: '03', title: 'Take an order. Watch stock update.', body: 'Place an order and every ingredient is deducted automatically. Not enough stock? Mise lets you know before confirming.' }].map((step) => <div className="help-step" key={step.n}><span>{step.n}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></div>)}</div><div className="info-note"><Sparkles size={18}/> This preview saves to your browser. A real backend will be connected later.</div><Button className="full-width" onClick={() => { setDialog({ type: 'order' }); }} icon={<Plus size={17}/>}>Try placing an order <ArrowUpRight size={17}/></Button></Modal>}
    <ToastNotice/>
  </div>;
}
export default function App() { return <AppProvider><MainApp/></AppProvider>; }
