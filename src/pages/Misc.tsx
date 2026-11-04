import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { sb, bdt, setting, useTitle } from '../lib/supabase'
export function Confirmation() {
  useTitle('Order received'); const { no } = useParams(), { state } = useLocation() as any, [pay, setPay] = useState<any>({})
  useEffect(() => { setting('payment').then(v => setPay(v || {})) }, [])
  const m = state?.payment_method
  return <div className="mx-auto max-w-xl px-4 py-10 space-y-3"><h1 className="font-display text-3xl">Thank you. We've received your order.</h1>
    <p>Order reference: <b className="text-xl">{no}</b>. Save it, you'll need it with your phone number to track the order.</p>
    {state && <p>Total: <b>{bdt(state.total)}</b></p>}
    <p>{m === 'cod' ? 'Pay in cash when your order arrives.' : m ? `Your ${m} transaction ID is awaiting manual verification. Your payment is not confirmed yet. Payment number: ${pay[m] || 'see our contact page'}.` : ''}</p>
    <p>Next: we confirm your order, pack it and send it with a courier. You can check progress any time.</p>
    <Link to="/track" className="btn inline-block">Track order</Link></div>
}
export function Track() {
  useTitle('Track order'); const [no, setNo] = useState(''), [ph, setPh] = useState(''), [r, setR] = useState<any>(undefined), [busy, setBusy] = useState(false)
  const go = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); const { data } = await sb.rpc('track_order', { p_order_no: no, p_phone: ph }); setR(data || null); setBusy(false) }
  return <div className="mx-auto max-w-md px-4 py-10"><h1 className="mb-4 font-display text-3xl">Track your order</h1>
    <form onSubmit={go} className="space-y-3"><input className="inp" placeholder="Order reference (IN-XXXXXXXX)" value={no} onChange={e => setNo(e.target.value)} required />
      <input className="inp" placeholder="Phone number used on the order" value={ph} onChange={e => setPh(e.target.value)} required /><button className="btn" disabled={busy}>Check status</button></form>
    {r === null && <p className="mt-4 text-madder">No order found. Check the reference and phone number.</p>}
    {r && <div className="mt-6 space-y-1 border border-line bg-white p-4"><p>Order <b>{r.order_no}</b></p><p>Status: <b>{r.status}</b></p><p>Payment: {r.payment_method}, {r.payment_status}</p>
      {r.items.map((i: any, k: number) => <p key={k}>{i.name} × {i.qty}</p>)}<p>Total: {bdt(r.total)}</p>
      {r.shipment && <p>Courier: {r.shipment.courier || 'pending'} {r.shipment.tracking_url && <a className="underline" href={r.shipment.tracking_url} rel="noopener">Track shipment</a>}</p>}</div>}</div>
}
export function InfoPage() {
  const { key } = useParams(), [c, setC] = useState<any>(undefined); useTitle(key || 'Page')
  useEffect(() => { setC(undefined); setting('page_' + key).then(v => setC(v ?? null)) }, [key])
  if (c === undefined) return <p className="p-8">Loading…</p>
  return <div className="mx-auto max-w-2xl px-4 py-10"><h1 className="mb-4 font-display text-3xl capitalize">{c?.title || key}</h1>
    <p className="whitespace-pre-line leading-relaxed">{c?.body || 'This page has not been written yet. Add it in the admin under store content.'}</p></div>
}
