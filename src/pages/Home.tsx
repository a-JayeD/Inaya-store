import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { sb, setting, useTitle } from '../lib/supabase'
import { Card } from './Shop'
export default function Home() {
  useTitle('')
  const [ban, setB] = useState<any[]>([]), [cats, setC] = useState<any[]>([]), [feat, setF] = useState<any[]>([]), [latest, setL] = useState<any[]>([]), [st, setSt] = useState<any>({})
  useEffect(() => { const sel = '*, product_images(url,sort_order)'
    sb.from('banners').select('*').eq('is_active', true).order('sort_order').then(r => setB(r.data || []))
    sb.from('categories').select('*').eq('is_active', true).is('parent_id', null).order('sort_order').then(r => setC(r.data || []))
    sb.from('products').select(sel).eq('status', 'active').eq('featured', true).limit(8).then(r => setF(r.data || []))
    sb.from('products').select(sel).eq('status', 'active').order('created_at', { ascending: false }).limit(8).then(r => setL(r.data || []))
    setting('store').then(v => setSt(v || {})) }, [])
  return <div>
    {ban[0] ? <Link to={ban[0].link_url || '/shop'}><img src={ban[0].image_url} alt={ban[0].title || 'INAYA'} className="max-h-[70vh] w-full object-cover" /></Link>
      : <section className="bg-indigo px-6 py-20 text-center text-white"><h1 className="font-display text-5xl">{st.name || 'INAYA'}</h1><p className="mx-auto mt-3 max-w-md">{st.tagline || 'Handmade, made with care.'}</p></section>}
    <div className="space-y-12 px-4 py-10 md:px-8">
      {!!cats.length && <section><h2 className="mb-4 font-display text-2xl">Shop by category</h2><div className="grid grid-cols-2 gap-3 md:grid-cols-5">{cats.map(c => <Link key={c.id} to={`/shop?cat=${c.slug}`} className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-line text-center">{c.image_url && <img src={c.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}<span className="relative bg-paper/90 px-3 py-1">{c.name}</span></Link>)}</div></section>}
      {!!feat.length && <section><h2 className="mb-4 font-display text-2xl">Featured</h2><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{feat.map(p => <Card key={p.id} p={p} />)}</div></section>}
      <section><h2 className="mb-4 font-display text-2xl">Latest</h2>{latest.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{latest.map(p => <Card key={p.id} p={p} />)}</div> : <p>New products are coming soon.</p>}</section>
      {st.about && <section className="max-w-2xl"><h2 className="mb-2 font-display text-2xl">About us</h2><p>{st.about}</p></section>}</div></div>
}
