-- Storefront: server-side order placement and verified tracking. Run after 001.
alter table orders add column if not exists area text, add column if not exists customer_note text, add column if not exists idempotency_key uuid unique;
create or replace function norm_phone(p text) returns text language sql immutable as $$
  select regexp_replace(regexp_replace(coalesce(p,''),'[\s-]','','g'),'^(\+?88)','') $$;

create or replace function place_order(p_name text,p_phone text,p_district text,p_area text,p_address text,p_note text,p_items jsonb,p_method text,p_ref text,p_coupon text,p_key uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare ph text:=norm_phone(p_phone); it jsonb; pr products; v product_variants; unit numeric; qty int; sub numeric:=0; fee numeric; disc numeric:=0; c coupons; oid uuid:=gen_random_uuid(); ono text; ex orders; vid uuid;
begin
  select * into ex from orders where idempotency_key=p_key;   -- duplicate submit returns the same order
  if found then return jsonb_build_object('order_no',ex.order_no,'total',ex.total,'payment_method',ex.payment_method); end if;
  if ph !~ '^01[3-9][0-9]{8}$' then raise exception 'Enter a valid Bangladeshi mobile number'; end if;
  if length(trim(coalesce(p_name,'')))<2 or length(trim(coalesce(p_address,'')))<8 then raise exception 'Name and full delivery address are required'; end if;
  if p_method not in('cod','bkash','nagad') then raise exception 'Choose a payment method'; end if;
  if p_method<>'cod' and length(trim(coalesce(p_ref,'')))<6 then raise exception 'Enter the payment transaction ID'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)<1 then raise exception 'No items in order'; end if;
  select charge into fee from delivery_zones where is_active and p_district=any(districts) limit 1;
  if fee is null then select charge into fee from delivery_zones where is_active and cardinality(districts)=0 limit 1; end if;
  if fee is null then raise exception 'Delivery is not set up for this district yet'; end if;
  ono:='IN-'||upper(substr(md5(random()::text||clock_timestamp()::text),1,8));
  insert into orders(id,order_no,customer_name,phone,address,district,area,customer_note,subtotal,delivery_charge,discount,total,payment_method,idempotency_key)
    values(oid,ono,trim(p_name),ph,trim(p_address),p_district,p_area,p_note,0,fee,0,0,p_method,p_key);
  for it in select * from jsonb_array_elements(p_items) loop
    qty:=(it->>'qty')::int; if qty<1 or qty>20 then raise exception 'Invalid quantity'; end if;
    select * into pr from products where id=(it->>'product_id')::uuid and status='active' for update;
    if not found then raise exception 'This product is no longer available'; end if;
    unit:=coalesce(pr.sale_price,pr.regular_price); vid:=nullif(it->>'variant_id','')::uuid;
    if vid is not null then
      select * into v from product_variants where id=vid and product_id=pr.id for update;
      if not found then raise exception 'This option is no longer available'; end if;
      if v.stock_qty<qty then raise exception '% is out of stock in this option',pr.name; end if;
      unit:=coalesce(v.price_override,unit); update product_variants set stock_qty=stock_qty-qty where id=vid;
    else
      if exists(select 1 from product_variants where product_id=pr.id) then raise exception 'Please choose an option'; end if;
      if pr.track_stock then if pr.stock_qty<qty then raise exception '% is out of stock',pr.name; end if; update products set stock_qty=stock_qty-qty where id=pr.id; end if;
    end if;
    insert into stock_movements(product_id,variant_id,delta,reason,note) values(pr.id,vid,-qty,'order',ono);
    insert into order_items(order_id,product_id,variant_id,name_snapshot,unit_price,quantity) values(oid,pr.id,vid,pr.name||coalesce(' ('||(select string_agg(value,', ') from jsonb_each_text(v.attributes) where vid is not null)||')',''),unit,qty);
    sub:=sub+unit*qty;
  end loop;
  if coalesce(trim(p_coupon),'')<>'' then
    select * into c from coupons where upper(code)=upper(trim(p_coupon)) and is_active and (starts_at is null or starts_at<=now()) and (expires_at is null or expires_at>now()) and (usage_limit is null or used_count<usage_limit) for update;
    if not found then raise exception 'Coupon is invalid or expired'; end if;
    if sub<c.min_subtotal then raise exception 'Coupon needs a minimum order of ৳%',c.min_subtotal; end if;
    disc:=least(sub,case when c.kind='percent' then round(sub*c.value/100,2) else c.value end);
    update coupons set used_count=used_count+1 where id=c.id;
  end if;
  update orders set subtotal=sub,discount=disc,total=sub-disc+fee,coupon_id=c.id where id=oid;
  insert into payments(order_id,method,reference,amount) values(oid,p_method,nullif(trim(p_ref),''),sub-disc+fee);
  return jsonb_build_object('order_no',ono,'total',sub-disc+fee,'payment_method',p_method);
end $$;

-- Returns only safe fields, and only when order reference AND phone both match.
create or replace function track_order(p_order_no text,p_phone text) returns jsonb language sql stable security definer set search_path=public as $$
  select jsonb_build_object('order_no',o.order_no,'status',o.status,'payment_status',o.payment_status,'payment_method',o.payment_method,'total',o.total,'created_at',o.created_at,
    'items',(select coalesce(jsonb_agg(jsonb_build_object('name',i.name_snapshot,'qty',i.quantity)),'[]'::jsonb) from order_items i where i.order_id=o.id),
    'shipment',(select jsonb_build_object('courier',s.courier,'tracking_url',s.tracking_url,'status',s.status) from shipments s where s.order_id=o.id order by s.created_at desc limit 1))
  from orders o where o.order_no=upper(trim(p_order_no)) and o.phone=norm_phone(p_phone) $$;
revoke all on function place_order,track_order from public;
grant execute on function place_order,track_order to anon,authenticated;
