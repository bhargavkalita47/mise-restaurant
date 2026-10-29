import { Boxes, Filter, PackagePlus, Plus, Search, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApp } from '../components/context';
import { Button, EmptyState, PageTitle } from '../components/ui';
import { inventoryValue, lowStock } from '../lib/logic';
import { money, quantityLabel } from '../lib/format';
import type { IngredientCategory } from '../models/types';

const filters = ['All ingredients', 'Low stock', 'Produce', 'Dairy', 'Pantry', 'Bakery', 'Beverages', 'Other'] as const;
export function Inventory({ openIngredient, openRestock }: { openIngredient(): void; openRestock(id: string): void }) {
  const { data } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof filters)[number]>('All ingredients');
  const ingredients = data?.ingredients ?? [];
  const rows = useMemo(() => ingredients.filter((item) => {
    const matches = item.name.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase());
    return matches && (filter === 'All ingredients' || (filter === 'Low stock' ? item.quantity <= item.reorderAt : item.category === filter as IngredientCategory));
  }), [ingredients, query, filter]);
  const low = lowStock(ingredients);
  return <><PageTitle eyebrow="STOCK CONTROL" title="Your inventory." description="Know what’s on your shelves, what’s running low, and what to order next." action={<Button icon={<Plus size={18}/>} onClick={openIngredient}>Add ingredient</Button>}/>
    <div className="inventory-stats"><div><span>Ingredients tracked</span><strong>{ingredients.length}</strong><small>Across your kitchen</small></div><div><span>Running low</span><strong className="amber-text">{low.length}</strong><small>At or below minimum</small></div><div><span>Inventory value</span><strong>{money(inventoryValue(ingredients))}</strong><small>Estimated from unit costs</small></div></div>
    {low.length > 0 && <div className="inventory-alert"><span className="inventory-alert-icon"><TriangleAlert size={19}/></span><div><strong>{low.length} {low.length === 1 ? 'ingredient needs' : 'ingredients need'} a top-up</strong><p>Keep your menu running smoothly. Restock now to avoid unavailable dishes.</p></div><button onClick={() => setFilter('Low stock')}>Review low stock <span>→</span></button></div>}
    <section className="panel table-panel"><div className="table-toolbar"><div><div className="small-eyebrow">YOUR STOCKROOM</div><h2>All ingredients <span className="title-count">{rows.length}</span></h2></div><div className="table-filters"><label className="search-field"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ingredients..." aria-label="Search ingredients"/></label><label className="filter-field"><Filter size={16}/><select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filter ingredients">{filters.map((item) => <option key={item}>{item}</option>)}</select></label></div></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>INGREDIENT</th><th>CATEGORY</th><th>ON HAND</th><th>LOW AT</th><th>STATUS</th><th>VALUE</th><th/></tr></thead><tbody>{rows.map((item) => { const low = item.quantity <= item.reorderAt; return <tr key={item.id}><td><div className="table-name"><span className="ingredient-monogram">{item.name.substring(0, 2).toUpperCase()}</span><span><strong>{item.name}</strong><small>Per {item.unit}</small></span></div></td><td className="muted-cell">{item.category}</td><td className="stock-amount">{quantityLabel(item.quantity, item.unit)}</td><td className="muted-cell">{quantityLabel(item.reorderAt, item.unit)}</td><td><span className={`stock-badge ${low ? 'stock-low' : 'stock-okay'}`}><i/>{low ? 'Low stock' : 'Healthy'}</span></td><td>{money(item.quantity * item.unitCost)}</td><td><button className="table-action" onClick={() => openRestock(item.id)}><Plus size={15}/> Add stock</button></td></tr>; })}</tbody></table></div>
      {rows.length === 0 && <EmptyState icon={<Boxes size={24}/>} title="No matching ingredients" description={query || filter !== 'All ingredients' ? 'Try a different search or filter.' : 'Add your first ingredient to get started.'} action={<Button variant="secondary" onClick={() => { setQuery(''); setFilter('All ingredients'); }}>Clear filters</Button>}/>}
      <div className="table-footer"><span>Showing {rows.length} of {ingredients.length} ingredients</span><span>Quantities update automatically with each order.</span></div>
    </section>
    <div className="subtle-tip"><PackagePlus size={18}/><p><strong>Good to know:</strong> Ingredients are measured in grams, millilitres or pieces. Recipes use the same units, so every order deducts the right amount.</p></div>
  </>;
}
