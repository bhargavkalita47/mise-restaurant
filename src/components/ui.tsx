import { useEffect, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { AlertCircle, ArrowRight, Check, ChevronRight, LoaderCircle, X } from 'lucide-react';
import { useApp } from './context';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; loading?: boolean; icon?: ReactNode };
export function Button({ children, variant = 'primary', size = 'md', className = '', loading, icon, disabled, ...rest }: ButtonProps) {
  return <button type="button" className={`btn btn-${variant} btn-${size} ${className}`} disabled={disabled || loading} {...rest}>{loading ? <LoaderCircle className="spin" size={17} /> : icon}{children}</button>;
}
export function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <div className="page-heading-action">{action}</div>}</div>;
}
export function Modal({ title, eyebrow, children, onClose, width = 'normal' }: { title: string; eyebrow?: string; children: ReactNode; onClose: () => void; width?: 'normal' | 'wide' }) {
  useEffect(() => {
    function keydown(event: KeyboardEvent) { if (event.key === 'Escape') onClose(); }
    document.addEventListener('keydown', keydown);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', keydown); document.body.style.overflow = ''; };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" aria-label={title} className={`modal modal-${width}`}><div className="modal-header"><div><div className="eyebrow">{eyebrow || 'PALOMA KITCHEN'}</div><h2>{title}</h2></div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20}/></button></div><div className="modal-body">{children}</div></div></div>;
}
export function Field({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return <label className="form-field"><span>{label}</span><input {...props} />{hint && <small>{hint}</small>}</label>;
}
export function SelectField({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return <label className="form-field"><span>{label}</span><select {...props}>{children}</select></label>;
}
export function TextArea({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <label className="form-field"><span>{label}</span><textarea {...props}/></label>;
}
export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{description}</p>{action}</div>;
}
export function Status({ status }: { status: string }) {
  const key = status.toLowerCase().replaceAll(' ', '-');
  return <span className={`status status-${key}`}><span className="status-dot"/>{status}</span>;
}
export function TextLink({ children, onClick }: { children: ReactNode; onClick: () => void }) { return <button className="text-link" onClick={onClick}>{children}<ArrowRight size={15}/></button>; }
export function ArrowLink({ children, onClick }: { children: ReactNode; onClick: () => void }) { return <button className="arrow-link" onClick={onClick}>{children}<ChevronRight size={17}/></button>; }
export function ToastNotice() {
  const { toast, dismissToast } = useApp();
  useEffect(() => { if (!toast) return; const id = setTimeout(dismissToast, 4200); return () => clearTimeout(id); }, [toast, dismissToast]);
  if (!toast) return null;
  return <div className={`toast toast-${toast.kind}`} role="status">{toast.kind === 'success' ? <Check size={19}/> : <AlertCircle size={19}/>}<span>{toast.text}</span><button aria-label="Dismiss" onClick={dismissToast}><X size={16}/></button></div>;
}
