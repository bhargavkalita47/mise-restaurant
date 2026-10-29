import { ArrowDownRight, ArrowRight, ArrowUpRight, BookOpenText, Check, ChevronRight, ClipboardList, Clock3, Package, Plus, TrendingUp, TriangleAlert, UtensilsCrossed } from 'lucide-react';
import { useApp } from '../components/context';
import type { Page } from '../components/navigation';
import { Button, Status, TextLink } from '../components/ui';
import { inventoryValue, lowStock, maxServings, todayOrders } from '../lib/logic';
import { localTime, money, quantityLabel, relativeTime } from '../lib/format';

export function Overview({ navigate, openOrder, openIngredient, openDish, openRestock }: { navigate(page: Page): void; openOrder(): void; openIngredient(): void; openDish(): void; openRestock(id: string): void }) {
  const { data } = useApp();
  if (!data) return null;
  const todays = todayOrders(data);
  const sales = todays.filter((o) => o.status !== 'Cancelled').reduce((sum, o) => sum + o.total, 0);
  const lows = lowStock(data.ingredients);
  const unavailable = data.menu.filter((d) => d.active && maxServings(d, data.ingredients) === 0);
  const activeMenu = data.menu.filter((d) => d.active && maxServings(d, data.ingredients) > 0);
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
  return <div className="overview-page">
    <div className="overview-intro"><div><div className="eyebrow"><span className="eyebrow-line"/> SERVICE SNAPSHOT</div><h1>{greeting}, team<span className="heading-period">/</span></h1><p>Your orders, dishes and stock—all in one place.</p></div><button className="date-badge"><Clock3 size={16}/> Live kitchen overview</button></div>
    <section className="hero-feature">
      <div className="hero-content">
        <div className="hero-kicker"><span className="hero-pulse"/> YOUR SERVICE, SIMPLIFIED</div>
        <h2>Take an order.<br/><em>Stock follows.</em></h2>
        <p>Choose a dish, confirm the order, and Mise adjusts every ingredient automatically. That’s your daily loop.</p>
        <Button className="hero-button" onClick={openOrder} icon={<Plus size={18}/>}>Create an order <ArrowUpRight size={17}/></Button>
      </div>
      <div className="service-visual" aria-hidden="true">
        <div className="service-visual-grid"/>
        <div className="service-ticket">
          <div className="service-ticket-top"><span>MISE / LIVE TICKET</span><span className="service-ticket-dot"/></div>
          <div className="ticket-number">ORDER <strong>#{data.orders[0]?.number ?? 'NEW'}</strong></div>
          <div className="ticket-detail"><span>{data.orders[0]?.lines[0]?.name ?? 'House special'}</span><strong>{data.orders[0]?.lines[0] ? `${data.orders[0].lines[0].quantity}×` : '1×'}</strong></div>
          <div className="ticket-rule"/>
          <div className="ticket-confirm"><Check size={16}/> INGREDIENTS TRACKED</div>
        </div>
        <div className="service-flow-pill"><Package size={17}/><span>Stock updated with each order</span><ArrowDownRight size={15}/></div>
      </div>
    </section>
    <div className="metrics-grid">
      <div className="metric-card"><div className="metric-header"><span>Today's revenue</span><span className="metric-icon tint-green"><TrendingUp size={19}/></span></div><strong>{money(sales)}</strong><div className="metric-sub"><span className="metric-detail">{todays.length} orders placed</span><span className="metric-tag">Today</span></div></div>
      <div className="metric-card"><div className="metric-header"><span>Orders in progress</span><span className="metric-icon tint-peach"><ClipboardList size={19}/></span></div><strong>{data.orders.filter((o) => o.status === 'Preparing' || o.status === 'Ready').length.toString().padStart(2, '0')}</strong><div className="metric-sub"><span className="metric-detail">To prepare & serve</span><button className="inline-view" onClick={() => navigate('orders')}>View <ArrowRight size={13}/></button></div></div>
      <div className="metric-card"><div className="metric-header"><span>Ingredients running low</span><span className="metric-icon tint-amber"><TriangleAlert size={19}/></span></div><strong>{lows.length.toString().padStart(2, '0')}</strong><div className="metric-sub"><span className="metric-detail">Need your attention</span><button className="inline-view" onClick={() => navigate('inventory')}>View <ArrowRight size={13}/></button></div></div>
      <div className="metric-card"><div className="metric-header"><span>Inventory value</span><span className="metric-icon tint-lilac"><Package size={19}/></span></div><strong>{money(inventoryValue(data.ingredients))}</strong><div className="metric-sub"><span className="metric-detail">Across {data.ingredients.length} ingredients</span><span className="metric-tag">On hand</span></div></div>
    </div>
    <div className="overview-two-col">
      <section className="panel orders-panel"><div className="panel-title-row"><div><div className="small-eyebrow">SERVICE AT A GLANCE</div><h2>Recent orders</h2></div><TextLink onClick={() => navigate('orders')}>All orders</TextLink></div><div className="order-preview-list">
        {data.orders.slice(0, 4).map((order) => <button key={order.id} className="order-preview-row" onClick={() => navigate('orders')}><span className="order-preview-icon"><ClipboardList size={19}/></span><span className="preview-copy"><strong>Order #{order.number} <span>· {order.service === 'Dine in' ? order.tableLabel : 'Takeaway'}</span></strong><small>{order.lines.map((l) => `${l.quantity}× ${l.name}`).join(', ')}</small></span><span className="preview-end"><strong>{money(order.total)}</strong><Status status={order.status}/></span></button>)}
        {data.orders.length === 0 && <div className="preview-empty">No orders yet. Your first one is a click away.</div>}
      </div><button className="panel-bottom-link" onClick={openOrder}><Plus size={17}/> Place another order <ArrowRight size={16}/></button></section>
      <section className="panel lowstock-panel"><div className="panel-title-row"><div><div className="small-eyebrow">KEEP THINGS MOVING</div><h2>Stock to watch</h2></div><span className={`watch-count ${lows.length ? 'warn' : ''}`}>{lows.length} low</span></div><div className="stock-watch-list">
        {lows.slice(0, 4).map((ingredient) => <div className="stock-watch-item" key={ingredient.id}><div className="ingredient-monogram">{ingredient.name.slice(0, 2).toUpperCase()}</div><div className="stock-watch-copy"><strong>{ingredient.name}</strong><small>{quantityLabel(ingredient.quantity, ingredient.unit)} remaining · low at {quantityLabel(ingredient.reorderAt, ingredient.unit)}</small><div className="stock-progress"><i style={{ width: `${Math.min(100, ingredient.reorderAt > 0 ? (ingredient.quantity / ingredient.reorderAt) * 100 : 0)}%` }}/></div></div><button className="small-restock" onClick={() => openRestock(ingredient.id)}>Restock</button></div>)}
        {lows.length === 0 && <div className="good-stock"><Check size={22}/><h3>Everything's well stocked</h3><p>All ingredients are above their reorder points.</p></div>}
      </div><button className="panel-bottom-link" onClick={() => navigate('inventory')}><Package size={17}/> Open inventory <ArrowRight size={16}/></button></section>
    </div>
    <section className="how-it-works-section"><div className="section-title-split"><div><div className="small-eyebrow">BUILT AROUND YOUR WORKFLOW</div><h2>Your three-step workflow<span>/</span></h2><p>The essentials, in order. Start anywhere.</p></div><span className="workflow-count">01 — 03</span></div><div className="steps-grid">
      <button className="step-card" onClick={openIngredient}><div className="step-top"><span>01</span><Package size={24} strokeWidth={1.5}/></div><h3>Add your ingredients</h3><p>Tell Mise what you have on hand, right down to the gram.</p><div className="step-footer">Manage ingredients <ChevronRight size={17}/></div></button>
      <button className="step-card" onClick={openDish}><div className="step-top"><span>02</span><BookOpenText size={24} strokeWidth={1.5}/></div><h3>Build your recipes</h3><p>Connect each menu dish to the exact ingredients it uses.</p><div className="step-footer">Add a dish <ChevronRight size={17}/></div></button>
      <button className="step-card" onClick={openOrder}><div className="step-top"><span>03</span><ClipboardList size={24} strokeWidth={1.5}/></div><h3>Take an order</h3><p>Stock gets deducted for you. No spreadsheets, no guesswork.</p><div className="step-footer">Try an order <ChevronRight size={17}/></div></button>
    </div></section>
    <div className="overview-bottom"><div><span className="healthy-dot"/><strong>{activeMenu.length} dishes ready to serve</strong><span>· {unavailable.length} currently unavailable</span></div><span>Last order {data.orders[0] ? relativeTime(data.orders[0].createdAt) : 'not yet placed'} · {data.orders[0] ? localTime(data.orders[0].createdAt) : '—'}</span></div>
  </div>;
}
