import { createClient } from '@supabase/supabase-js'
import { useEffect } from 'react'
export const sb = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
export const bdt = (n: number) => '৳' + Number(n || 0).toLocaleString('en-BD')
export const unitPrice = (p: any) => p.sale_price ?? p.regular_price
export const img = (p: any) => [...(p.product_images || [])].sort((a: any, b: any) => a.sort_order - b.sort_order).map((i: any) => i.url)
export function useTitle(t: string, desc?: string) { useEffect(() => { document.title = t ? `${t} · INAYA` : 'INAYA'
  if (desc) document.querySelector('meta[name=description]')?.setAttribute('content', desc) }, [t, desc]) }
export async function setting(key: string) { return (await sb.from('store_settings').select('value').eq('key', key).maybeSingle()).data?.value }
