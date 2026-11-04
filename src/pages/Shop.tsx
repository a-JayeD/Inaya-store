import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { sb, bdt, unitPrice, img, useTitle } from '../lib/supabase'
const PAGE = 12
export function Card({ p }: { p: any }) {
  const out = p.track_stock && p.stock_qty <= 0, im = img(p)[0]
  return <Link to={`/p/${p.slug}`} className="group block">
    <div className="relative aspect-[4/5] overflow-hidden bg-line">{im ? <img src={im} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center text-sm text-ink/40">No photo yet</div>}
      {p.sale_price != null && <span className="absolute left-2 top-2 bg-madder px-2 py-0.5 text-xs text-white">Sale</span>}
      {out && <span className="absolute right-2 top-2 bg-ink px-2 py-0.5 text-xs text-white">Sold out</span>}</div>
    <p className="mt-2 text-sm">{p.name}</p>
    <p className="text-sm">{p.sale_price != null ? <><span className="text-madder">{bdt(p.sale_price)}</span> <s className="text-ink/50">{bdt(p.regular_price)}</s></> : bdt(p.regular_price)}</p></Link>
}
export default function Shop() {
  useTitle('Shop', 'Browse INAYA handmade products, gifts, clothing, crafts and food.')
  const [sp, setSp] = useSearchParams(), cat = sp.get('cat') || '', q = sp.get('q') || '', sort = sp.get('sort') || 'new'
  const [cats, setC] = useState<any[]>([]), [rows, setR] = useState<any[]>([]), [n, setN] = useState(PAGE), [loading, setL] = useState(true), [more, setMore] = useState(false)
  useEffect(() => { sb.from('categories').select('id,name,slug,parent_id').eq('is_active', true).order('sort_order').then(r => setC(r.data || [])) }, [])
  useEffect(() => { (async () => { setL(true)
    let ids: string[] = []; const c = cats.find(x => x.slug === cat)
    if (c) ids = [c.id, ...cats.filter(x => x.parent_id === c.id).map(x => x.id)]
    let r = sb.from('products').select('*, product_images(url,sort_order)').eq('status', 'active').range(0, n)
    if (ids.length) r = r.in('category_id', ids); if (q) r = r.ilike('name', `%${q.replace(/[%,]/g, '')}%`)
    r = sort === 'low' ? r.order('regular_price') : sort === 'high' ? r.order('regular_price', { ascending: false }) : r.order('created_at', { ascending: false })
    const { data } = await r; setMore((data || []).length > n); setR((data || []).slice(0, n)); setL(false) })() }, [cat, q, sort, n, cats.length])
  const set = (k: string, v: string) => { const x = new URLSearchParams(sp); v ? x.set(k, v) : x.delete(k); setSp(x); setN(PAGE) }
  return <div className="px-4 py-6 md:px-8"><h1 className="font-display text-3xl">Shop</h1>
    <div className="my-4 flex flex-wrap gap-2"><input className="inp max-w-xs" placeholder="Search products" defaultValue={q} onKeyDown={e => e.key === 'Enter' && set('q', (e.target as HTMLInputElement).value)} />
      <select className="inp w-auto" value={sort} onChange={e => set('sort', e.target.value)}><option value="new">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div>
    <div className="mb-6 flex flex-wrap gap-2 text-sm"><button onClick={() => set('cat', '')} className={`border px-3 py-1 ${!cat ? 'bg-indigo text-white' : 'border-line'}`}>All</button>
      {cats.filter(c => !c.parent_id).map(c => <button key={c.id} onClick={() => set('cat', c.slug)} className={`border px-3 py-1 ${cat === c.slug ? 'bg-indigo text-white' : 'border-line'}`}>{c.name}</button>)}</div>
    {loading && !rows.length ? <p>Loading…</p> : rows.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{rows.map(p => <Card key={p.id} p={p} />)}</div> : <p>No products match. Try another category or search.</p>}
    {more && <button className="btn mx-auto mt-8 block" onClick={() => setN(n + PAGE)}>Load more</button>}</div>
}
