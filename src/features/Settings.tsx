import { Info, RotateCcw, ShieldAlert, Store } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '../components/context';
import { Button, Field, PageTitle } from '../components/ui';
import { restaurantService } from '../services';

export function SettingsPage() {
  const { data, busy, run, demo } = useApp();
  const [name, setName] = useState(data?.restaurant.name ?? '');
  const [location, setLocation] = useState(data?.restaurant.location ?? '');
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => { setName(data?.restaurant.name ?? ''); setLocation(data?.restaurant.location ?? ''); }, [data?.restaurant.name, data?.restaurant.location]);
  return <><PageTitle eyebrow="YOUR WORKSPACE" title="Restaurant settings." description="The little details that make this workspace yours."/>
    <div className="settings-layout"><section className="panel settings-panel"><div className="settings-section-heading"><span><Store size={22}/></span><div><h2>Restaurant details</h2><p>How your restaurant appears across Mise.</p></div></div><form onSubmit={(e) => { e.preventDefault(); void run(() => restaurantService.updateRestaurant({ name, location }), 'Restaurant details saved'); }}><Field label="Restaurant name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80}/><Field label="Location" value={location} onChange={(e) => setLocation(e.target.value)} required maxLength={120}/><div className="settings-form-footer"><span>Currency: Indian rupees (INR)</span><Button type="submit" loading={busy}>Save changes</Button></div></form></section>
    <section className="panel settings-panel"><div className="settings-section-heading"><span className="orange-icon"><Info size={22}/></span><div><h2>About this workspace</h2><p>What’s real and what comes next.</p></div></div><div className="setting-description"><p>This is a <strong>frontend-first preview</strong> with realistic sample data. Changes are saved in this browser only, not to a shared server.</p><p>When the backend is connected, the same screens will use real APIs, authentication, database transactions and user permissions.</p></div>{demo && <div className="reset-block"><div><strong>Start fresh with sample data</strong><p>Reset ingredients, menu, orders and activity to the original sample workspace.</p></div><Button variant="secondary" icon={<RotateCcw size={16}/>} onClick={() => setConfirmReset(true)}>Reset sample data</Button></div>}</section></div>
    {confirmReset && <div className="confirm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmReset(false); }}><div className="confirm-box" role="alertdialog" aria-modal="true" aria-label="Reset sample data"><ShieldAlert size={25} className="amber-text"/><h3>Reset your sample workspace?</h3><p>All changes you've made in this browser will be replaced with the original sample ingredients, dishes and orders.</p><div><Button variant="secondary" onClick={() => setConfirmReset(false)}>Keep my changes</Button><Button variant="danger" loading={busy} onClick={async () => { if (await run(() => restaurantService.resetDemo(), 'Sample workspace restored')) setConfirmReset(false); }}>Reset workspace</Button></div></div></div>}
  </>;
}
