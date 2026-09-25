function clean(v,max=240){return String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);}
function esc(v){return clean(v,1000).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function eur(v){return Number(v||0).toFixed(2).replace('.',',')+' €';}
function parseOrder(body){
  const b=body||{}, c=b.customer||{};
  const id=clean(b.id,80);
  if(!/^API-\d{8}-\d{5,8}$/.test(id)) throw new Error('Codice ordine non valido.');
  const order={
    id, createdAt:clean(b.createdAt,60), language:clean(b.language,5)||'it',
    customer:{
      name:clean(c.name,120),email:clean(c.email,180).toLowerCase(),phone:clean(c.phone,80),
      country:clean(c.country,4),city:clean(c.city,120),address:clean(c.address,180),cap:clean(c.cap,20),province:clean(c.province,40)
    },
    delivery:clean(b.delivery,30),notes:clean(b.notes,1000),
    items:Array.isArray(b.items)?b.items.slice(0,40).map(x=>({
      id:clean(x?.id,120),name:clean(x?.name,180),size:clean(x?.size,120),
      qty:Math.max(1,Math.min(50,Math.floor(Number(x?.qty||1)))),price:Number(x?.price||0)
    })):[],
    goodsTotal:Number(b.goodsTotal||0),shipping:Number(b.shipping||0),total:Number(b.total||0),points:Number(b.points||0),
    shippingReason:clean(b.shippingReason,300),paymentProvider:clean(b.paymentProvider,80),paymentId:clean(b.paymentId,100)
  };
  if(!order.customer.name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.customer.email)||!order.customer.phone) throw new Error('Dati cliente non validi.');
  if(!order.items.length||order.items.some(x=>!x.id||!x.name||!Number.isFinite(x.price)||x.price<0)) throw new Error('Prodotti ordine non validi.');
  if(!Number.isFinite(order.total)||order.total<0) throw new Error('Totale ordine non valido.');
  return order;
}
async function sendResend({subject,text,html,replyTo,idempotency}){
  const key=String(process.env.RESEND_API_KEY||'').trim();
  const to=String(process.env.ORDER_EMAIL_TO||'').trim();
  if(!key||!to) throw new Error('Servizio email non configurato.');
  const r=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':idempotency},
    body:JSON.stringify({from:'La Fabbrica delle Api <onboarding@resend.dev>',to:[to],reply_to:replyTo,subject,text,html})
  });
  const data=await r.json().catch(()=>null);
  if(!r.ok){console.error('[Ordini Vercel] Resend',r.status,data?.message||data?.error||'unknown');throw new Error('Email ordine non inviata.');}
}
module.exports=async(req,res)=>{
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'Metodo non consentito.'});
  try{
    const o=parseOrder(req.body);
    const subject='Nuovo ordine '+o.id+' · '+o.customer.name+' · '+eur(o.total);
    const productLines=o.items.map(x=>'- '+x.name+(x.size?' · '+x.size:'')+' | q.tà '+x.qty+' | '+eur(x.price*x.qty));
    const text=[
      'LA FABBRICA DELLE API','NUOVO ORDINE RICEVUTO','',
      'Codice: '+o.id,'',
      'DATI ACQUIRENTE',o.customer.name,o.customer.email,o.customer.phone,
      'Indirizzo: '+o.customer.address+', '+o.customer.cap+' '+o.customer.city+(o.customer.province?' ('+o.customer.province+')':''),
      'Paese: '+o.customer.country,'',
      'PRODOTTI',...productLines,'',
      'Consegna: '+(o.delivery||'—'),
      'Dettaglio spedizione: '+(o.shippingReason||'—'),
      'Note: '+(o.notes||'—'),
      'Prodotti: '+eur(o.goodsTotal),'Spedizione: '+eur(o.shipping),'Totale: '+eur(o.total),
      'Punti Ape: '+o.points,
      ...(o.paymentProvider?['Pagamento: '+o.paymentProvider+(o.paymentId?' · '+o.paymentId:'')]:[])
    ].join('\n');
    const rows=o.items.map(x=>'<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>'+esc(x.name)+'</strong><br><small>'+esc(x.size)+'</small></td><td style="padding:8px;text-align:center;border-bottom:1px solid #eee">'+x.qty+'</td><td style="padding:8px;text-align:right;border-bottom:1px solid #eee">'+eur(x.price*x.qty)+'</td></tr>').join('');
    const html='<div style="font-family:Arial;background:#f6f1e7;padding:28px;color:#17251f"><div style="max-width:760px;margin:auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #ded5c5"><div style="background:#10392c;color:#fff;padding:24px 28px"><div style="font-size:12px;font-weight:800;letter-spacing:.12em;color:#f0bd4d">LA FABBRICA DELLE API</div><h1 style="margin:8px 0 0">Nuovo ordine ricevuto</h1><p>Codice: <strong>'+esc(o.id)+'</strong></p></div><div style="padding:26px 28px"><h2>Dati acquirente</h2><p><strong>'+esc(o.customer.name)+'</strong><br>'+esc(o.customer.email)+'<br>'+esc(o.customer.phone)+'<br>'+esc(o.customer.address)+', '+esc(o.customer.cap)+' '+esc(o.customer.city)+(o.customer.province?' ('+esc(o.customer.province)+')':'')+'</p><h2>Prodotti</h2><table style="width:100%;border-collapse:collapse"><tbody>'+rows+'</tbody></table><p><strong>Totale: '+eur(o.total)+'</strong><br>Spedizione: '+eur(o.shipping)+'<br>Punti Ape: '+o.points+'</p></div></div></div>';
    await sendResend({subject,text,html,replyTo:o.customer.email,idempotency:'order-'+o.id});
    return res.json({ok:true,orderId:o.id,emailSent:true});
  }catch(e){
    console.error('[Ordini Vercel]',e?.message||e);
    return res.status(422).json({ok:false,error:e?.message||'Ordine non valido.'});
  }
};