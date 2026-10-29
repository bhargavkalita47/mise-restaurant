import { useState, type FormEvent } from 'react';
import { BookOpenText, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../components/context';
import { Button, Field, Modal, SelectField, TextArea } from '../components/ui';
import { restaurantService } from '../services';
import type { MenuCategory, MenuItem, RecipeLine } from '../models/types';
import { maxServings } from '../lib/logic';

const categories: MenuCategory[] = ['Mains', 'Small plates', 'Coffee & drinks', 'Bakery'];
export function DishModal({ dish, onClose, onSaved }: { dish?: MenuItem; onClose(): void; onSaved(): void }) {
  const { data, run, busy } = useApp();
  const ingredients = data?.ingredients ?? [];
  const [name, setName] = useState(dish?.name ?? '');
  const [description, setDescription] = useState(dish?.description ?? '');
  const [category, setCategory] = useState<MenuCategory>(dish?.category ?? 'Mains');
  const [price, setPrice] = useState(String(dish?.price ?? '350'));
  const [prepMinutes, setPrepMinutes] = useState(String(dish?.prepMinutes ?? '15'));
  const [recipe, setRecipe] = useState<RecipeLine[]>(dish?.recipe.map((l) => ({ ...l })) ?? []);
  const [active, setActive] = useState(dish?.active ?? true);
  const [formError, setFormError] = useState('');
  const used = new Set(recipe.map((item) => item.ingredientId));
  const unselected = ingredients.filter((item) => !used.has(item.id));
  function addRow() { if (unselected[0]) setRecipe((current) => [...current, { ingredientId: unselected[0]!.id, quantity: unselected[0]!.unit === 'pcs' ? 1 : 100 }]); }
  function updateRow(index: number, patch: Partial<RecipeLine>) { setRecipe((current) => current.map((row, i) => i === index ? { ...row, ...patch } : row)); }
  function removeRow(index: number) { setRecipe((current) => current.filter((_, i) => i !== index)); }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!recipe.length) { setFormError('Add at least one ingredient. That is how stock is tracked.'); return; }
    if (new Set(recipe.map((r) => r.ingredientId)).size !== recipe.length) { setFormError('Each ingredient can appear only once in a recipe.'); return; }
    setFormError('');
    const input = { name, description, category, price: Number(price), prepMinutes: Number(prepMinutes), recipe, active };
    const ok = await run(() => dish ? restaurantService.updateDish(dish.id, input) : restaurantService.addDish(input), dish ? 'Recipe updated. Future orders use the new amounts.' : `${name.trim()} is now on your menu`);
    if (ok) onSaved();
  }
  const capacity = maxServings({ id: '', name, description, category, price: Number(price), prepMinutes: Number(prepMinutes), recipe, active, createdAt: '' }, ingredients);
  return <Modal title={dish ? 'Edit dish & recipe' : 'Create a new dish'} eyebrow="MENU STUDIO" width="wide" onClose={onClose}><form onSubmit={(e) => void submit(e)}><div className="dish-modal-grid"><div className="dish-form-main"><div className="form-section-heading"><span>01</span><div><h3>Dish details</h3><p>What guests will see on your menu.</p></div></div><div className="form-stack"><Field label="Dish name" autoFocus required maxLength={80} placeholder="e.g. Roasted mushroom toast" value={name} onChange={(e) => setName(e.target.value)}/><TextArea label="Short description" required maxLength={180} rows={2} placeholder="What makes this dish special?" value={description} onChange={(e) => setDescription(e.target.value)}/><div className="form-two-cols"><SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value as MenuCategory)}>{categories.map((c) => <option key={c}>{c}</option>)}</SelectField><Field label="Price (₹)" type="number" min="1" step="any" value={price} onChange={(e) => setPrice(e.target.value)} required/></div><div className="form-two-cols"><Field label="Prep time (minutes)" type="number" min="1" step="1" value={prepMinutes} onChange={(e) => setPrepMinutes(e.target.value)} required/><label className="form-field"><span>Menu visibility</span><select value={active ? 'active' : 'hidden'} onChange={(e) => setActive(e.target.value === 'active')}><option value="active">Visible on menu</option><option value="hidden">Hidden for now</option></select></label></div></div></div><div className="dish-form-recipe"><div className="form-section-heading"><span>02</span><div><h3>Recipe & portions</h3><p>Ingredients needed for one serving.</p></div></div><div className="recipe-list">{recipe.map((line, i) => { const ing = ingredients.find((item) => item.id === line.ingredientId); return <div className="recipe-row" key={`${i}-${line.ingredientId}`}><label><span className="sr-only">Ingredient {i + 1}</span><select value={line.ingredientId} onChange={(e) => updateRow(i, { ingredientId: e.target.value })}>{ingredients.filter((item) => item.id === line.ingredientId || !used.has(item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="recipe-qty"><span className="sr-only">Quantity for {ing?.name}</span><input type="number" min="0.001" step="any" value={line.quantity} onChange={(e) => updateRow(i, { quantity: Number(e.target.value) })} required/><small>{ing?.unit ?? ''}</small></label><button type="button" className="remove-row" onClick={() => removeRow(i)} aria-label={`Remove ${ing?.name ?? 'ingredient'}`}><Trash2 size={17}/></button></div>; })}</div>{!recipe.length && <div className="recipe-empty"><BookOpenText size={22}/><p>Your recipe starts here.<br/>Add the ingredients for one serving.</p></div>}<Button variant="secondary" className="full-width add-recipe-button" disabled={!unselected.length} icon={<Plus size={17}/>} onClick={addRow}>Add ingredient to recipe</Button><div className="recipe-explainer"><strong>{recipe.length && active ? `${capacity} servings available now` : 'Automatic stock tracking'}</strong><p>{recipe.length && active ? 'Based on the quantities currently in inventory.' : 'Each order deducts these amounts from inventory automatically.'}</p></div></div></div>{formError && <p role="alert" className="form-error">{formError}</p>}<div className="modal-footer"><span className="modal-footer-hint">Changes to recipes only affect future orders.</span><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={busy} type="submit">{dish ? 'Save changes' : 'Create dish'}</Button></div></form></Modal>;
}
