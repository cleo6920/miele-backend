function clean(v,max=240){return String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);}
function eur(v){return Number(v||0).toFixed(2).replace('.',',')+' €';}
module.exports=async(req,res)=>{
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'Metodo non consentito.'});
  try{
    const b=req.body||{}, c=b.customer||{};
    const id=clean(b.id,80);
    if(!/^API-\d{8}-\d{5,8}$/.test(id))return res.status(422).json({ok:false,error:'Codice ordine non valido.'});
    const name=clean(c.name,120), email=clean(c.email,180).toLowerCase(), phone=clean(c.phone,80);
    const items=Array.isArray(b.items)?b.items.slice(0,40):[];
    const total=Number(b.total||0);
    const reason=clean(b.cancelReason||b.reason||'Pagamento annullato o non completato',160);
    if(!name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(422).json({ok:false,error:'Dati cliente non validi.'});
    const key=String(process.env.RESEND_API_KEY||'').trim(),to=String(process.env.ORDER_EMAIL_TO||'').trim();
    if(!key||!to)return res.status(503).json({ok:false,error:'Servizio email non configurato.'});
    const productLines=items.map(x=>'- '+clean(x?.name,180)+' · q.tà '+Math.max(1,Number(x?.qty||1))).join('\n');
    const subject='ACQUISTO ANNULLATO · '+id+' · '+name;
    const text=['LA FABBRICA DELLE API','ACQUISTO ANNULLATO / NON COMPLETATO','',
      'Codice ordine: '+id,'Cliente: '+name,'Email: '+email,'Telefono: '+phone,
      'Totale previsto: '+eur(total),'Motivo: '+reason,'','Prodotti:',productLines||'—',
      '','Nessun pagamento completato da questa notifica.'].join('\n');
    const r=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':'cancel-'+id},
      body:JSON.stringify({from:'La Fabbrica delle Api <onboarding@resend.dev>',to:[to],reply_to:email,subject,text})
    });
    const data=await r.json().catch(()=>null);
    if(!r.ok){console.error('[Ordine annullato] Resend',r.status,data?.message||data?.error||'unknown');return res.status(502).json({ok:false,error:'Email annullamento non inviata.'});}
    return res.json({ok:true,orderId:id,emailSent:true});
  }catch(e){
    console.error('[Ordine annullato]',e?.message||e);
    return res.status(500).json({ok:false,error:'Notifica annullamento non inviata.'});
  }
};