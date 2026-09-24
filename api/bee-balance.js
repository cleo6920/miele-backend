const {lookupWallet,normalizeEmail,normalizePhone,normalizeCode}=require('../bee-wallet-public');
const {Pool}=require('pg');
const TEST_DB_URL=String(process.env.BEE_DATABASE_URL||process.env.DATABASE_URL||'').trim();
let testPool;
function getTestPool(){if(!TEST_DB_URL)throw new Error('Database Saldo Api non configurato.');if(!testPool)testPool=new Pool({connectionString:TEST_DB_URL,max:1,idleTimeoutMillis:30000,connectionTimeoutMillis:10000});return testPool;}
const TEST_ONCE='TESTAPI-ONCE-12830';
const TEST_ALWAYS='TESTAPI-ALWAYS-12830';
async function getOnceUsed(){const p=getTestPool();const r=await p.query("select payload from bee_test_state where id='wallet-test-once-12830' limit 1");return Boolean(r.rows[0]?.payload?.used);}
async function useOnce(){const p=getTestPool();await p.query("insert into bee_test_state(id,payload,updated_at) values('wallet-test-once-12830',$1::jsonb,now()) on conflict(id) do update set payload=excluded.payload,updated_at=excluded.updated_at",[JSON.stringify({used:true,usedAt:new Date().toISOString()})]);}

function escPdf(s){return String(s||'').replace(/[()\\]/g,m=>'\\'+m);}
function walletCardPdf(code){
  const lines=[
    'LA FABBRICA DELLE API',
    'PROMEMORIA PUNTI APE',
    '',
    'Conserva questo codice personale:',
    code,
    '',
    'Usalo su lafabbricadelleapi.it per controllare il tuo saldo.',
    'Il codice non contiene dati personali.'
  ];
  const content=['BT','/F1 18 Tf','72 750 Td'];
  lines.forEach((line,i)=>{
    if(i===0)content.push('/F1 20 Tf');
    else if(i===1)content.push('/F1 15 Tf');
    else if(i===4)content.push('/F1 22 Tf');
    else content.push('/F1 12 Tf');
    content.push('('+escPdf(line)+') Tj');
    content.push('0 -30 Td');
  });
  content.push('ET');
  const stream=content.join('\n');
  const objs=[];
  objs[1]='<< /Type /Catalog /Pages 2 0 R >>';
  objs[2]='<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  objs[3]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>';
  objs[4]='<< /Length '+Buffer.byteLength(stream,'latin1')+' >>\nstream\n'+stream+'\nendstream';
  objs[5]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  let out='%PDF-1.4\n', offsets=[0];
  for(let i=1;i<=5;i++){offsets[i]=Buffer.byteLength(out,'latin1');out+=i+' 0 obj\n'+objs[i]+'\nendobj\n';}
  const xref=Buffer.byteLength(out,'latin1');
  out+='xref\n0 6\n0000000000 65535 f \n';
  for(let i=1;i<=5;i++)out+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
  out+='trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
  return Buffer.from(out,'latin1');
}

module.exports=async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.method==='GET' && String(req.query?.card||'')==='1'){
    const code=normalizeCode(req.query?.code);
    if(!/^APE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{2}$/.test(code)) return res.status(400).send('Codice non valido.');
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','attachment; filename="Promemoria_Punti_Ape_'+code+'.pdf"');
    res.setHeader('Cache-Control','private, no-store');
    return res.status(200).send(walletCardPdf(code));
  }
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Metodo non consentito.'});
  try{
    const body=req.body||{};
    const email=normalizeEmail(body.email);
    const phone=normalizePhone(body.phone);
    const code=normalizeCode(body.code);
    if(code===TEST_ONCE||code===TEST_ALWAYS){
      const permanent=code===TEST_ALWAYS;
      if(String(body.action||'')==='claim_test_reward'){
        if(!permanent) await useOnce();
        const balance=permanent?100:0;
        return res.json({
          ok:true,found:true,testMode:true,testKind:permanent?'always':'once',balance,earned:100,spent:permanent?0:100,
          goal:100,remainingToReward:Math.max(0,100-balance),
          testClaimed:true,
          message:permanent
            ? 'TEST completato: il codice permanente resta a 100 Punti Ape.'
            : 'TEST completato: il cesto omaggio è stato simulato e il saldo TEST è tornato a 0.'
        });
      }
      const used=permanent?false:await getOnceUsed();
      const balance=permanent?100:(used?0:100);
      return res.json({
        ok:true,found:true,testMode:true,testKind:permanent?'always':'once',balance,earned:100,spent:used?100:0,
        goal:100,remainingToReward:Math.max(0,100-balance),
        canTestClaim:balance>=100,
        message:permanent
          ? 'Modalità TEST permanente: questo saldo resterà sempre a 100 Punti Ape.'
          : (used?'Modalità TEST una tantum già utilizzata: saldo TEST = 0.':'Modalità TEST una tantum: puoi simulare il riscatto del cesto.')
      });
    }
    if(!email&&!phone&&!code) return res.status(422).json({ok:false,error:'Inserisci email, telefono oppure Codice Punti Ape.'});
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(422).json({ok:false,error:'Email non valida.'});
    if(phone&&phone.length<6) return res.status(422).json({ok:false,error:'Numero di telefono non valido.'});
    if(code&&!/^APE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{2}$/.test(code)) return res.status(422).json({ok:false,error:'Codice Punti Ape non valido.'});
    const result=await lookupWallet({email,phone,code});
    if(!result.found) return res.status(404).json({ok:false,found:false,error:'Nessun Saldo Punti Ape trovato con questi dati.'});
    return res.json({
      ok:true,found:true,balance:result.balance,earned:result.earned,spent:result.spent,
      goal:100,remainingToReward:Math.max(0,100-result.balance)
    });
  }catch(error){
    console.error('[Saldo Api] lookup error',error);
    return res.status(500).json({ok:false,error:'Non è stato possibile controllare il saldo. Riprova tra poco.'});
  }
};