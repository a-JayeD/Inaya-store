import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { sb, bdt, setting, useTitle } from '../lib/supabase'
export default function Checkout() {
  useTitle('Checkout'); const { state } = useLocation() as any, nav = useNavigate(), key = useRef(crypto.randomUUID())
  const [p, setP] = useState<any>(null), [zones, setZ] = useState<any[]>([]), [pay, setPay] = useState<any>({}), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const [f, setF] = useState({ name: '', phone: '', district: '', area: '', address: '', note: '', method: 'cod', ref: '', coupon: '' })
  useEffect(() => { if (!state) return
    sb.from('products').select('*, product_variants(*)').eq('id', state.product_id).single().then(r => setP(r.data))
    sb.from('delivery_zones').select('*').eq('is_active', true).then(r => setZ(r.data || [])); setting('payment').then(v => setPay(v || {})) }, [])
  if (!state) return <Navigate to="/shop" />
  if (!p) return <p className="p-8">Loading…</p>
  const v = p.product_variants.find((x: any) => x.id === state.variant_id), unit = v?.price_override ?? p.sale_price ?? p.regular_price, sub = unit * state.qty
  const zone = zones.find(z => z.districts.map((d: string) => d.toLowerCase()).includes(f.district.trim().toLowerCase())) || zones.find(z => !z.districts.length)
  const fee = zone?.charge, set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  const submit = async (e: React.FormEvent) => { e.preventDefault(); if (busy) return; setBusy(true); setErr('')
    if (!/^(\+?88)?01[3-9]\d{8}$/.test(f.phone.replace(/[\s-]/g, ''))) { setErr('Enter a valid mobile number, like 01712345678'); setBusy(false); return }
    const { data, error } = await sb.rpc('place_order', { p_name: f.name, p_phone: f.phone, p_district: f.district.trim(), p_area: f.area, p_address: f.address, p_note: f.note || null,
      p_items: [{ product_id: p.id, variant_id: state.variant_id, qty: state.qty }], p_method: f.method, p_ref: f.ref || null, p_coupon: f.coupon || null, p_key: key.current })
    if (error) { setErr(error.message); setBusy(false); return }
    nav(`/order/${data.order_no}`, { replace: true, state: data }) }
  return <form onSubmit={submit} className="mx-auto grid max-w-4xl gap-8 px-4 py-8 md:grid-cols-2">
    <div className="space-y-3"><h1 className="font-display text-3xl">Delivery details</h1>
      <input className="inp" placeholder="Full name" value={f.name} onChange={set('name')} required autoComplete="name" />
      <input className="inp" placeholder="Mobile number (01XXXXXXXXX)" inputMode="tel" value={f.phone} onChange={set('phone')} required autoComplete="tel" />
      <input className="inp" placeholder="District" list="d" value={f.district} onChange={set('district')} required /><datalist id="d">{zones.flatMap(z => z.districts).map((d: string) => <option key={d} value={d} />)}</datalist>
      <input className="inp" placeholder="Area / city" value={f.area} onChange={set('area')} required />
      <textarea className="inp" placeholder="Full address (house, road, landmark)" value={f.address} onChange={set('address')} required minLength={8} />
      <textarea className="inp" placeholder="Order note (optional)" value={f.note} onChange={set('note')} />
      <fieldset className="space-y-2"><legend className="mb-1 font-semibold">Payment</legend>
        {[['cod', 'Cash on delivery'], ['bkash', 'bKash'], ['nagad', 'Nagad']].map(([k, l]) => <label key={k} className="flex items-center gap-2"><input type="radio" name="m" checked={f.method === k} onChange={() => setF({ ...f, method: k })} />{l}</label>)}
        {f.method !== 'cod' && <div className="rounded-sm border border-line bg-white p-3 text-sm">
          {pay[f.method] ? <p>1. Send <b>{bdt(sub + (fee || 0))}</b> to {f.method === 'bkash' ? 'bKash' : 'Nagad'} number <b>{pay[f.method]}</b>.<br />2. Enter the transaction ID below.<br />3. We verify it manually before processing your order. Your payment is not confirmed until then.</p> : <p>Payment number isn't set up yet. Please choose cash on delivery or contact us.</p>}
          <input className="inp mt-2" placeholder="Transaction ID" value={f.ref} onChange={set('ref')} required /></div>}</fieldset></div>
    <div className="h-fit space-y-2 border border-line bg-white p-4"><h2 className="font-display text-xl">Order summary</h2>
      <p>{p.name}{v ? ` (${Object.values(v.attributes).join(', ')})` : ''} × {state.qty}</p>
      <input className="inp" placeholder="Coupon code (optional)" value={f.coupon} onChange={set('coupon')} />
      <p className="flex justify-between"><span>Subtotal</span>{bdt(sub)}</p><p className="flex justify-between"><span>Delivery</span>{fee != null ? bdt(fee) : 'Enter district'}</p>
      <p className="flex justify-between border-t border-line pt-2 font-semibold"><span>Total (coupon applied at confirmation)</span>{bdt(sub + (fee || 0))}</p>
      {err && <p role="alert" className="text-sm text-madder">{err}</p>}
      <button className="btn w-full" disabled={busy || fee == null}>{busy ? 'Placing order…' : 'Place order'}</button></div></form>
}
