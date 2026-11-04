import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { sb, bdt, img, useTitle } from '../lib/supabase'
import { Card } from './Shop'
export default function Product() {
  const { slug } = useParams(), nav = useNavigate()
  const [p, setP] = useState<any>(undefined), [rel, setRel] = useState<any[]>([]), [vid, setV] = useState(''), [qty, setQty] = useState(1), [big, setBig] = useState(0)
  useEffect(() => { setP(undefined); sb.from('products').select('*, product_images(url,sort_order), product_variants(*)').eq('slug', slug).eq('status', 'active').maybeSingle().then(async ({ data }) => {
    setP(data || null); if (data?.category_id) setRel((await sb.from('products').select('*, product_images(url,sort_order)').eq('status', 'active').eq('category_id', data.category_id).neq('id', data.id).limit(4)).data || []) }) }, [slug])
  useTitle(p?.seo_title || p?.name || 'Product', p?.seo_description || p?.description?.slice(0, 155))
  if (p === undefined) return <p className="p-8">Loading…</p>
  if (!p) return <p className="p-8">This product isn't available.</p>
  const vs: any[] = p.product_variants || [], v = vs.find(x => x.id === vid), ims = img(p)
  const base = v?.price_override ?? p.sale_price ?? p.regular_price
  const stock = vs.length ? v?.stock_qty : p.track_stock ? p.stock_qty : 999, ok = vs.length ? !!v && v.stock_qty > 0 : stock > 0
  return <div className="px-4 py-6 md:px-8"><div className="grid gap-8 md:grid-cols-2">
    <div><div className="aspect-[4/5] bg-line">{ims[big] ? <img src={ims[big]} alt={p.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-ink/40">No photo yet</div>}</div>
      <div className="mt-2 flex gap-2">{ims.map((u, i) => <button key={u} onClick={() => setBig(i)} aria-label={`Photo ${i + 1}`}><img src={u} alt="" loading="lazy" className={`h-16 w-14 object-cover ${i === big ? 'ring-2 ring-indigo' : ''}`} /></button>)}</div></div>
    <div className="space-y-4"><h1 className="font-display text-3xl">{p.name}</h1>
      <p className="text-xl">{base < p.regular_price ? <><span className="text-madder">{bdt(base)}</span> <s className="text-base text-ink/50">{bdt(p.regular_price)}</s></> : bdt(base)}</p>
      {!!vs.length && <div><p className="mb-1 text-sm">Choose an option</p><div className="flex flex-wrap gap-2">{vs.map(x => <button key={x.id} disabled={x.stock_qty <= 0} onClick={() => { setV(x.id); setQty(1) }} className={`border px-3 py-1.5 text-sm disabled:line-through disabled:opacity-40 ${vid === x.id ? 'bg-indigo text-white' : 'border-line'}`}>{Object.values(x.attributes).join(' / ') || x.sku}</button>)}</div></div>}
      <p className="text-sm">{vs.length && !v ? 'Select an option to see availability' : ok ? (stock < 6 ? `Only ${stock} left` : 'In stock') : 'Sold out'}</p>
      <div className="flex items-center gap-3"><label htmlFor="q" className="text-sm">Quantity</label><input id="q" type="number" min={1} max={Math.min(stock || 1, 20)} value={qty} onChange={e => setQty(Math.max(1, +e.target.value))} className="inp w-20" /></div>
      <button className="btn w-full md:w-auto" disabled={!ok} onClick={() => nav('/checkout', { state: { product_id: p.id, variant_id: vid || null, qty } })}>Buy now</button>
      <p className="whitespace-pre-line text-sm leading-relaxed">{p.description}</p></div></div>
    {!!rel.length && <section className="mt-12"><h2 className="mb-4 font-display text-2xl">You may also like</h2><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{rel.map(r => <Card key={r.id} p={r} />)}</div></section>}</div>
}
