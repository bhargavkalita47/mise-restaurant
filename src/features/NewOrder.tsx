import { useMemo, useState } from 'react';
import { AlertTriangle, Check, ClipboardList, Coffee, Leaf, Minus, Plus, ShoppingBasket, UtensilsCrossed } from 'lucide-react';
import { useApp } from '../components/context';
import { Button, Modal } from '../components/ui';
import { money, quantityLabel } from '../lib/format';
import { maxServings, requiredStock, stockRequirements } from '../lib/logic';
import { restaurantService } from '../services';
import type { MenuCategory, ServiceType } from '../models/types';

const categories: ('All' | MenuCategory)[] = ['All', 'Mains', 'Small plates', 'Coffee & drinks', 'Bakery'];
export function NewOrderModal({ onClose, onPlaced }: { onClose(): void; onPlaced(): void }) {
  const { data, run, busy } = useApp();
  const [category, setCategory] = useState<(typeof categories)[number]>('All');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [service, setService] = useState<ServiceType>('Dine in');
  const [table, setTable] = useState('Table 01');
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState('');
  const menu = data?.menu ?? [];
  const inventory = data?.ingredients ?? [];
  const selected = useMemo(() => Object.entries(cart).filter(([, qty]) => qty > 0).map(([menuItemId, quantity]) => ({ menuItemId, quantity })), [cart]);
  const stockPreview = useMemo(() => { try { return stockRequirements(inventory, requiredStock(menu, selected)); } catch { return []; } }, [inventory, menu, selected]);
  const insufficient = stockPreview.filter((item) => !item.sufficient);
  const total = selected.reduce((sum, item) => sum + (menu.find((dish) => dish.id === item.menuItemId)?.price ?? 0) * item.quantity, 0);
  const items = selected.reduce((count, item) => count + item.quantity, 0);
  function changeCart(id: string, delta: number) { setCart((old) => ({ ...old, [id]: Math.max(0, (old[id] ?? 0) + delta) })); setLocalError(''); }
  async function submit() {
    if (!selected.length) { setLocalError('Add at least one dish to the order.'); return; }
    if (insufficient.length) { setLocalError('Not enough ingredients. Remove a dish or restock before confirming.'); return; }
    if (service === 'Dine in' && !table.trim()) { setLocalError('Add a table number.'); return; }
    setLocalError('');
    const success = await run(() => restaurantService.placeOrder({ service, tableLabel: table, note, lines: selected }), 'Order confirmed! Every ingredient was deducted automatically.');
    if (success) onPlaced();
  }
  return <Modal eyebrow="A NEW SERVICE TICKET" title="Place an order" width="wide" onClose={onClose}><div className="order-modal-intro">Pick dishes, confirm your ticket, and Mise will take care of the stock deduction.</div><div className="new-order-layout"><div className="new-order-catalog"><div className="order-modal-section-title"><strong>Choose dishes</strong><span>{menu.filter((item) => item.active).length} on your menu</span></div><div className="catalog-categories">{categories.map((cat) => <button key={cat} className={category === cat ? 'selected' : ''} onClick={() => setCategory(cat)}>{cat}</button>)}</div><div className="catalog-list">{menu.filter((item) => item.active && (category === 'All' || item.category === category)).map((dish) => { const capacity = maxServings(dish, inventory); const qty = cart[dish.id] ?? 0; const unavailable = capacity === 0; return <div className={`catalog-row ${unavailable ? 'catalog-unavailable' : ''}`} key={dish.id}><span className={`catalog-icon catalog-${dish.category.replaceAll(' ', '-').replaceAll('&', 'and')}`}>{dish.category === 'Coffee & drinks' ? <Coffee size={22}/> : dish.category === 'Small plates' ? <Leaf size={22}/> : <UtensilsCrossed size={22}/>}</span><div className="catalog-copy"><strong>{dish.name}</strong><small>{unavailable ? 'Out of stock' : `${capacity} servings available`}</small></div><div className="catalog-amount"><strong>{money(dish.price)}</strong><div className="qty-control">{qty > 0 && <><button onClick={() => changeCart(dish.id, -1)} aria-label={`Remove one ${dish.name}`}><Minus size={15}/></button><span>{qty}</span></>}<button disabled={unavailable} onClick={() => changeCart(dish.id, 1)} aria-label={`Add one ${dish.name}`}><Plus size={16}/></button></div></div></div>; })}{menu.filter((item) => item.active && (category === 'All' || item.category === category)).length === 0 && <p className="catalog-no-items">No dishes in this category.</p>}</div></div><div className="new-order-ticket"><div className="ticket-title"><ClipboardList size={20}/><strong>Order ticket</strong><span>{items} {items === 1 ? 'item' : 'items'}</span></div><div className="ticket-service"><label><span>ORDER TYPE</span><select value={service} onChange={(e) => setService(e.target.value as ServiceType)}><option>Dine in</option><option>Takeaway</option></select></label>{service === 'Dine in' && <label><span>TABLE</span><input value={table} onChange={(e) => setTable(e.target.value)} placeholder="Table 01" maxLength={40}/></label>}</div><div className="ticket-lines">{selected.length === 0 ? <div className="ticket-empty"><ShoppingBasket size={28}/><strong>Your ticket is empty</strong><p>Choose dishes from the menu to get started.</p></div> : selected.map((item) => { const dish = menu.find((d) => d.id === item.menuItemId); if (!dish) return null; return <div className="ticket-line" key={item.menuItemId}><span>{item.quantity}×</span><strong>{dish.name}</strong><span>{money(dish.price * item.quantity)}</span></div>; })}</div><label className="ticket-note-label">SPECIAL INSTRUCTIONS<textarea rows={2} maxLength={250} placeholder="Allergies, special requests..." value={note} onChange={(e) => setNote(e.target.value)}/></label>{selected.length > 0 && <div className={`stock-impact ${insufficient.length ? 'stock-impact-warning' : ''}`}><div><span>{insufficient.length ? <AlertTriangle size={17}/> : <Check size={17}/>}</span><strong>{insufficient.length ? 'Not enough ingredients' : 'Stock ready to deduct'}</strong></div><p>{insufficient.length ? insufficient.map((entry) => `${entry.ingredient.name}: need ${quantityLabel(entry.required, entry.ingredient.unit)}, have ${quantityLabel(entry.available, entry.ingredient.unit)}`).join(' · ') : `${stockPreview.length} ingredients will be adjusted when you confirm.`}</p></div>}{localError && <p className="form-error" role="alert">{localError}</p>}<div className="ticket-total"><span>Total</span><strong>{money(total)}</strong></div><Button className="full-width" size="lg" loading={busy} disabled={!items || !!insufficient.length} onClick={() => void submit()} icon={<Check size={18}/>}>Confirm & deduct stock</Button><p className="ticket-disclaimer">Stock is deducted once, when this order is confirmed.</p></div></div></Modal>;
}
