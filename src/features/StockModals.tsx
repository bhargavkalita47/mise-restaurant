import { useState, type FormEvent } from 'react';
import { Check, PackagePlus, Plus } from 'lucide-react';
import { useApp } from '../components/context';
import { Button, Field, Modal, SelectField } from '../components/ui';
import { quantityLabel } from '../lib/format';
import { restaurantService } from '../services';
import type { IngredientCategory, IngredientUnit } from '../models/types';

const categories: IngredientCategory[] = ['Produce', 'Dairy', 'Pantry', 'Bakery', 'Beverages', 'Other'];
const units: { value: IngredientUnit; label: string }[] = [{ value: 'g', label: 'Grams (g)' }, { value: 'ml', label: 'Millilitres (ml)' }, { value: 'pcs', label: 'Pieces (pcs)' }];
export function IngredientModal({ onClose, onSaved }: { onClose(): void; onSaved(): void }) {
  const { run, busy } = useApp();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('Produce');
  const [unit, setUnit] = useState<IngredientUnit>('g');
  const [quantity, setQuantity] = useState('1000');
  const [reorderAt, setReorderAt] = useState('300');
  const [unitCost, setUnitCost] = useState('0.50');
  async function submit(e: FormEvent) {
    e.preventDefault();
    const ok = await run(() => restaurantService.addIngredient({ name, category, unit, quantity: Number(quantity), reorderAt: Number(reorderAt), unitCost: Number(unitCost) }), `${name.trim()} added to inventory`);
    if (ok) onSaved();
  }
  return <Modal title="Add an ingredient" eyebrow="GROW YOUR STOCKROOM" onClose={onClose}><div className="modal-intro"><PackagePlus size={20}/> Add what you keep in the kitchen. Recipes will use these exact units.</div><form onSubmit={(e) => void submit(e)} className="form-stack"><Field label="Ingredient name" placeholder="e.g. Fresh spinach" autoFocus required maxLength={70} value={name} onChange={(e) => setName(e.target.value)}/><div className="form-two-cols"><SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value as IngredientCategory)}>{categories.map((cat) => <option key={cat}>{cat}</option>)}</SelectField><SelectField label="Measurement" value={unit} onChange={(e) => setUnit(e.target.value as IngredientUnit)}>{units.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</SelectField></div><div className="form-two-cols"><Field label={`Stock on hand (${unit})`} type="number" min={0} step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} required/><Field label={`Alert me below (${unit})`} type="number" min={0} step="any" value={reorderAt} onChange={(e) => setReorderAt(e.target.value)} required/></div><Field label={`Unit cost (₹ per ${unit})`} hint="Used to calculate estimated inventory value" type="number" min={0} step="any" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} required/><div className="modal-footer"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={busy} type="submit" icon={<Plus size={17}/>}>Add ingredient</Button></div></form></Modal>;
}
export function RestockModal({ ingredientId, onClose, onSaved }: { ingredientId: string; onClose(): void; onSaved(): void }) {
  const { data, run, busy } = useApp();
  const ingredient = data?.ingredients.find((item) => item.id === ingredientId);
  const [amount, setAmount] = useState('500');
  if (!ingredient) return null;
  async function submit(e: FormEvent) {
    e.preventDefault();
    const ok = await run(() => restaurantService.restockIngredient(ingredientId, Number(amount)), 'Stock updated successfully');
    if (ok) onSaved();
  }
  return <Modal title={`Restock ${ingredient.name}`} eyebrow="RECEIVE A DELIVERY" onClose={onClose}><div className="restock-current"><span className="ingredient-monogram big">{ingredient.name.slice(0, 2).toUpperCase()}</span><div><small>CURRENTLY ON HAND</small><strong>{quantityLabel(ingredient.quantity, ingredient.unit)}</strong><p>Low-stock alert at {quantityLabel(ingredient.reorderAt, ingredient.unit)}</p></div></div><form onSubmit={(e) => void submit(e)} className="form-stack"><Field autoFocus label={`Add quantity (${ingredient.unit})`} type="number" min="0.001" step="any" required value={amount} onChange={(e) => setAmount(e.target.value)}/><div className="restock-preview"><Check size={16}/><span>New stock will be <strong>{quantityLabel(ingredient.quantity + Math.max(0, Number(amount) || 0), ingredient.unit)}</strong></span></div><div className="modal-footer"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={busy} type="submit" icon={<Plus size={17}/>}>Add to stock</Button></div></form></Modal>;
}
