const crypto = require('crypto');
const { callBeeDataApi } = require('../bee-wallet-client');
const { ensureWalletCodeForOrder, attachContactToOrder, lookupWallet } = require('../bee-wallet-public');

const EDITION_ID='api-oggi-01';
const PRODUCT_ID='alveo-digitale-api-oggi-01';
const LANGS=new Set(['it','en','de','fr','es']);

function clean(v,max=220){return String(v||'').trim().slice(0,max);}
function validEmail(v){return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
function validName(v){
  if(!v)return true;
  const s=String(v).trim();
  return s.length>=2 && s.length<=120 && /[A-Za-zÀ-ÿ]/.test(s) && !/^\d+$/.test(s);
}
async function normalizeOptionalPhone(v){
  const raw=String(v||'').trim();
  if(!raw)return '';
  let compact=raw.replace(/[\s().-]/g,'');
  if(compact.startsWith('00')) compact='+'+compact.slice(2);
  const candidates=[];
  if(compact.startsWith('+')){
    const digits=compact.slice(1).replace(/\D/g,'');
    for(let n=1;n<=4;n++){
      if(digits.length>n+3)candidates.push({prefix:'+'+digits.slice(0,n),phone:digits.slice(n)});
    }
  }else{
    const digits=compact.replace(/\D/g,'');
    candidates.push({prefix:'+39',phone:digits});
  }
  for(const candidate of candidates){
    try{
      const response=await fetch('https://miele-shop-experience-v2.onrender.com/api/phone-normalize?'+new URLSearchParams(candidate).toString(),{cache:'no-store'});
      const data=await response.json().catch(()=>null);
      if(response.ok&&data?.ok&&data?.e164)return data.e164;
    }catch(_){}
  }
  throw new Error('Telefono non valido.');
}
function hash(v){return crypto.createHash('sha256').update(String(v||'')).digest('hex').slice(0,20);}

module.exports=async(req,res)=>{
  res.setHeader('Allow','POST');
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Metodo non consentito.'});
  try{
    const body=req.body||{};
    if(clean(body.editionId,80)!==EDITION_ID) return res.status(400).json({ok:false,error:'Edizione non riconosciuta.'});
    const language=LANGS.has(clean(body.language,5).toLowerCase())?clean(body.language,5).toLowerCase():'it';
    const customer=body.customer||{};
    const contact={
      name:clean(customer.name,120),
      email:clean(customer.email,180).toLowerCase(),
      phone:clean(customer.phone,80)
    };
    if(!validName(contact.name)) return res.status(422).json({ok:false,field:'name',error:'Nome e cognome non validi. Correggili oppure lascia il campo vuoto.'});
    if(!validEmail(contact.email)) return res.status(422).json({ok:false,field:'email',error:'Email non valida. Correggila oppure lascia il campo vuoto.'});
    if(contact.phone){
      try{contact.phone=await normalizeOptionalPhone(contact.phone);}
      catch(_){return res.status(422).json({ok:false,field:'phone',error:'Numero di telefono non valido. Correggilo oppure lascia il campo vuoto.'});}
    }
    if(body.validationOnly===true){
      return res.json({ok:true,validated:true,customer:contact});
    }

    const claimId=clean(body.claimId,180)||crypto.randomUUID();
    const orderId='FREE-'+EDITION_ID.toUpperCase()+'-'+hash(claimId).toUpperCase();
    let pointsAwarded=false;
    let pointsPending=false;
    let pointsError='';
    let walletCode='';
    let walletBalance=null;

    try{
      const existing=await callBeeDataApi('get_purchase',{orderId});
      if(existing && existing.ok!==false && (existing.order||existing.purchase||existing.data)){
        pointsAwarded=true;
      }else{
        const pointItem={
          productId:PRODUCT_ID,
          productName:'Il mondo delle api oggi · Numero 01',
          price:0,
          quantity:1,
          pointsPerUnit:1,
          bonusPerUnit:1,
          totalPoints:1,
          calculation:'Edizione Aperta · 1 Punto Ape al download'
        };
        const result=await callBeeDataApi('create_purchase',{
          orderId,
          couponCode:'',
          mode:'FREE_DOWNLOAD',
          customer:contact,
          items:[pointItem],
          goodsTotal:0,
          shipping:0,
          total:0,
          beePoints:1,
          notes:'Download gratuito '+EDITION_ID+' · lingua '+language
        });
        if(result && result.ok!==false) pointsAwarded=true;
        else {pointsPending=true;pointsError=clean(result&&result.error,250);}
      }
    }catch(error){
      pointsPending=true;
      pointsError=clean(error&&error.message,250);
    }

    if(pointsAwarded){
      try{
        if(contact.email||contact.phone){
          await attachContactToOrder(orderId,{email:contact.email,phone:contact.phone});
          const wallet=await lookupWallet({email:contact.email,phone:contact.phone});
          if(wallet?.found) walletBalance=wallet.balance;
        }else{
          walletCode=await ensureWalletCodeForOrder(orderId);
          const wallet=walletCode?await lookupWallet({code:walletCode}):null;
          if(wallet?.found) walletBalance=wallet.balance;
        }
      }catch(error){
        console.warn('[Edizioni Aperte] wallet helper',error?.message||error);
      }
    }

    if(contact.name||contact.email||contact.phone){
      try{
        const resendKey=String(process.env.RESEND_API_KEY||'').trim();
        const notifyTo=String(process.env.ORDER_EMAIL_TO||'').trim();
        if(resendKey&&notifyTo){
          const subject='Download gratuito · Il mondo delle api oggi · Numero 01';
          const text=[
            'LA FABBRICA DELLE API - EDIZIONI APERTE',
            '',
            'Download: Il mondo delle api oggi · Numero 01',
            'Codice: '+orderId,
            'Lingua: '+language.toUpperCase(),
            '',
            'CONTATTI LASCIATI VOLONTARIAMENTE',
            'Nome: '+(contact.name||'—'),
            'Email: '+(contact.email||'—'),
            'Telefono: '+(contact.phone||'—'),
            '',
            'Punto Ape: '+(pointsAwarded?'registrato':'da sincronizzare')
          ].join('\n');
          const payload={
            from:'La Fabbrica delle Api <onboarding@resend.dev>',
            to:[notifyTo],
            subject,
            text
          };
          if(contact.email) payload.reply_to=contact.email;
          const mailResponse=await fetch('https://api.resend.com/emails',{
            method:'POST',
            headers:{
              'Authorization':'Bearer '+resendKey,
              'Content-Type':'application/json',
              'Idempotency-Key':'free-edition-'+orderId
            },
            body:JSON.stringify(payload)
          });
          const mailData=await mailResponse.json().catch(()=>null);
          if(!mailResponse.ok){
            console.error('[Edizioni Aperte] Resend',mailResponse.status,mailData?.message||mailData?.error||'unknown');
          }
        }else{
          console.warn('[Edizioni Aperte] Email non configurata su Vercel.');
        }
      }catch(error){
        console.warn('[Edizioni Aperte] Notifica email',error?.message||error);
      }
    }

    return res.json({
      ok:true,
      editionId:EDITION_ID,
      language,
      downloadUrl:'/downloads/il-mondo-delle-api-oggi-01-'+language+'.pdf',
      fileName:'Il_mondo_delle_api_oggi_Numero_01_'+language.toUpperCase()+'.pdf',
      points:1,
      pointsAwarded,
      pointsPending,
      pointsError:pointsPending?'Il punto è stato registrato come da sincronizzare.':'',
      orderId,
      walletCode,
      walletBalance,
      walletLookupUrl:'/punti-ape',
      walletCardUrl:walletCode?('/api/bee-balance?card=1&code='+encodeURIComponent(walletCode)):''
      
    });
  }catch(error){
    console.error('[Edizioni Aperte] download error',error);
    return res.status(500).json({ok:false,error:'Non è stato possibile preparare il download. Riprova tra poco.'});
  }
};
