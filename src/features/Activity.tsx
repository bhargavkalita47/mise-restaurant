import { Activity, BookOpenText, ClipboardList, Package, Settings2 } from 'lucide-react';
import { useApp } from '../components/context';
import { EmptyState, PageTitle } from '../components/ui';
import { relativeTime, shortDate, localTime } from '../lib/format';
import type { ActivityKind } from '../models/types';

function ActivityIcon({ kind }: { kind: ActivityKind }) { if (kind === 'stock') return <Package size={20}/>; if (kind === 'menu') return <BookOpenText size={20}/>; if (kind === 'setting') return <Settings2 size={20}/>; return <ClipboardList size={20}/>; }
export function ActivityPage() {
  const { data } = useApp();
  return <><PageTitle eyebrow="THE KITCHEN JOURNAL" title="Every change, accounted for." description="A simple history of orders, ingredients and menu changes in this workspace."/>
    <section className="panel activity-panel"><div className="panel-title-row"><div><div className="small-eyebrow">RECENT EVENTS</div><h2>Kitchen activity</h2></div><span className="activity-count">{data?.activity.length || 0} events</span></div><div className="activity-list">{data?.activity.map((item) => <div className="activity-entry" key={item.id}><span className={`activity-icon activity-${item.kind}`}><ActivityIcon kind={item.kind}/></span><div className="activity-entry-text"><strong>{item.title}</strong><p>{item.description}</p></div><div className="activity-time"><strong>{relativeTime(item.createdAt)}</strong><span>{shortDate(item.createdAt)} · {localTime(item.createdAt)}</span></div></div>)}</div>{!data?.activity.length && <EmptyState icon={<Activity size={22}/>} title="A fresh start" description="Order and inventory activity will appear here."/>}</section>
  </>;
}
