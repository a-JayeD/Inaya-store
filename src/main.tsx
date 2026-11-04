import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { setting } from './lib/supabase'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Product from './pages/Product'
import Checkout from './pages/Checkout'
import { Confirmation, Track, InfoPage } from './pages/Misc'
import './index.css'
function Layout({ children }: { children: React.ReactNode }) {
  const [st, setSt] = useState<any>({}), [soc, setSoc] = useState<any>({})
  useEffect(() => { setting('store').then(v => setSt(v || {})); setting('social').then(v => setSoc(v || {})) }, [])
  const pages = [['about', 'About'], ['faq', 'FAQ'], ['shipping', 'Delivery'], ['returns', 'Returns'], ['privacy', 'Privacy'], ['terms', 'Terms']]
  return <><header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-3 backdrop-blur md:px-8">
    <Link to="/" className="font-display text-2xl tracking-wide text-indigo">{st.name || 'INAYA'}</Link>
    <nav className="flex gap-5 text-sm"><Link to="/shop">Shop</Link><Link to="/track">Track order</Link></nav></header>
    <main className="min-h-[70vh]">{children}</main>
    <footer className="mt-16 bg-indigo px-4 py-10 text-sm text-white md:px-8"><div className="flex flex-wrap gap-x-6 gap-y-2">{pages.map(([k, l]) => <Link key={k} to={`/page/${k}`}>{l}</Link>)}</div>
      <div className="mt-4 flex flex-wrap gap-4">{['facebook', 'instagram', 'tiktok'].map(k => soc[k] && <a key={k} href={soc[k]} rel="noopener" className="underline">{k}</a>)}
        {soc.whatsapp && <a href={`https://wa.me/${String(soc.whatsapp).replace(/\D/g, '')}`} rel="noopener" className="underline">WhatsApp</a>}</div>
      <p className="mt-4 opacity-70">© {new Date().getFullYear()} {st.name || 'INAYA'}</p></footer></>
}
ReactDOM.createRoot(document.getElementById('root')!).render(<BrowserRouter><Layout><Routes>
  <Route index element={<Home />} /><Route path="shop" element={<Shop />} /><Route path="p/:slug" element={<Product />} />
  <Route path="checkout" element={<Checkout />} /><Route path="order/:no" element={<Confirmation />} />
  <Route path="track" element={<Track />} /><Route path="page/:key" element={<InfoPage />} /><Route path="*" element={<p className="p-8">Page not found.</p>} /></Routes></Layout></BrowserRouter>)
