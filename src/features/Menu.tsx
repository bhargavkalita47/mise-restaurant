import { BookOpenText, Clock3, Coffee, Leaf, Plus, Search, UtensilsCrossed } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApp } from '../components/context';
import { Button, EmptyState, PageTitle } from '../components/ui';
import { maxServings } from '../lib/logic';
import { money } from '../lib/format';
import type { MenuItem, MenuCategory } from '../models/types';
import { restaurantService } from '../services';

const categories: ('All dishes' | MenuCategory)[] = ['All dishes', 'Mains', 'Small plates', 'Coffee & drinks', 'Bakery'];
function DishIcon({ category }: { category: MenuCategory }) { return category === 'Coffee & drinks' ? <Coffee size={42} strokeWidth={1.3}/> : category === 'Small plates' ? <Leaf size={42} strokeWidth={1.3}/> : <UtensilsCrossed size={42} strokeWidth={1.3}/>; }
export function MenuPage({ openDish, openOrder }: { openDish(dish?: MenuItem): void; openOrder(): void }) {
  const { data, run, busy } = useApp();
  const [category, setCategory] = useState<(typeof categories)[number]>('All dishes');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => (data?.menu ?? []).filter((dish) => (category === 'All dishes' || dish.category === category) && (dish.name.toLowerCase().includes(query.toLowerCase()) || dish.description.toLowerCase().includes(query.toLowerCase()))), [data, category, query]);
  if (!data) return null;
  return <><PageTitle eyebrow="YOUR SIGNATURE DISHES" title="Menu & recipes." description="The dishes your guests love, connected to everything your kitchen uses." action={<Button icon={<Plus size={18}/>} onClick={() => openDish()}>Add a dish</Button>}/>
    <div className="menu-summary"><div className="menu-summary-symbol"><BookOpenText size={27}/></div><div><strong>Your menu is connected to stock.</strong><p>Each dish has a recipe. When someone orders it, we deduct every ingredient automatically.</p></div><Button variant="secondary" onClick={openOrder}>Try an order <span>→</span></Button></div>
    <div className="menu-toolbar"><div className="menu-tabs" role="tablist" aria-label="Menu categories">{categories.map((cat) => <button key={cat} role="tab" aria-selected={category === cat} className={cat === category ? 'selected' : ''} onClick={() => setCategory(cat)}>{cat}</button>)}</div><label className="search-field"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a dish..." aria-label="Find a dish"/></label></div>
    <div className="dish-grid">{filtered.map((dish, index) => { const capacity = maxServings(dish, data.ingredients); const available = dish.active && capacity > 0; return <article className="dish-card" key={dish.id}><button className={`dish-visual dish-visual-${index % 5}`} aria-label={`Edit ${dish.name}`} onClick={() => openDish(dish)}><div className="dish-ring"><DishIcon category={dish.category}/></div><span className="dish-visual-category">{dish.category.toUpperCase()}</span></button><div className="dish-content"><div className="dish-status-line"><span className={`availability-dot ${available ? '' : 'not-available'}`}/><span>{!dish.active ? 'Hidden from orders' : available ? `${capacity} servings available` : 'Out of stock'}</span><span className="dish-price">{money(dish.price)}</span></div><h3>{dish.name}</h3><p>{dish.description}</p><div className="dish-meta"><span><BookOpenText size={15}/> {dish.recipe.length} ingredients</span><span><Clock3 size={15}/> {dish.prepMinutes} min</span></div><div className="dish-actions"><button onClick={() => openDish(dish)}>Edit recipe <span>→</span></button><button disabled={busy} className="dish-visibility" onClick={() => void run(() => restaurantService.toggleDish(dish.id), `${dish.name} ${dish.active ? 'hidden from' : 'added to'} orders`)}>{dish.active ? 'Hide dish' : 'Publish'}</button></div></div></article>; })}</div>
    {filtered.length === 0 && <EmptyState icon={<BookOpenText size={25}/>} title="No dishes found" description={query ? 'Try a different search.' : 'Create your first dish and choose the ingredients it uses.'} action={<Button onClick={() => openDish()} icon={<Plus size={17}/>}>Add dish</Button>}/>}
  </>;
}
