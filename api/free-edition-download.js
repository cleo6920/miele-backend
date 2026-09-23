const crypto = require('crypto');
const { callBeeDataApi } = require('../bee-wallet-client');
const { ensureWalletCodeForOrder, lookupWallet } = require('../bee-wallet-public');

const EDITION_ID='api-oggi-01';
const PRODUCT_ID='alveo-digitale-api-oggi-01';
const LANGS=new Set(['it','en','de','fr','es']);

function clean(v,max=220){return String(v||'').trim().slice(0,max);}
function validEmail(v){return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
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
    if(!validEmail(contact.email)) return res.status(422).json({ok:false,error:'Email non valida.'});

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
        await fetch('https://miele-shop-experience-v2.onrender.com/api/free-edition-notification',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({editionId:EDITION_ID,language,customer:contact,orderId})
        });
      }catch(_){}
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
      walletCardUrl:walletCode?('/api/bee-wallet-card?code='+encodeURIComponent(walletCode)):''
      
    });
  }catch(error){
    console.error('[Edizioni Aperte] download error',error);
    return res.status(500).json({ok:false,error:'Non è stato possibile preparare il download. Riprova tra poco.'});
  }
};
