function esc(s){return String(s||'').replace(/[()\\]/g,m=>'\\'+m);}
function pdf(code){
  const lines=[
    'LA FABBRICA DELLE API',
    'PROMEMORIA PUNTI APE',
    '',
    'Conserva questo codice personale:',
    code,
    '',
    'Usalo su lafabbricadelleapi.it per controllare il tuo saldo.',
    'Il codice non cambia la lingua del sito e non contiene dati personali.'
  ];
  const content=['BT','/F1 18 Tf','72 750 Td'];
  lines.forEach((line,i)=>{if(i===0)content.push('/F1 20 Tf'); else if(i===1)content.push('/F1 15 Tf'); else if(i===4)content.push('/F1 22 Tf'); else content.push('/F1 12 Tf');content.push('('+esc(line)+') Tj');content.push('0 -30 Td');});
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
  if(req.method!=='GET') return res.status(405).end();
  const code=String(req.query?.code||'').trim().toUpperCase();
  if(!/^APE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{2}$/.test(code)) return res.status(400).send('Codice non valido.');
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition','attachment; filename="Promemoria_Punti_Ape_'+code+'.pdf"');
  res.setHeader('Cache-Control','private, no-store');
  return res.status(200).send(pdf(code));
};