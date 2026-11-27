// Verifica se todas as fases têm solução com as lanças disponíveis (usa a mesma física do jogo).
// Uso: npm test        (opcional: node tests/levels.cjs index.html 8  -> só a fase 8)
const fs=require('fs');const sim=fs.readFileSync(process.argv[2]||'index.html','utf8').split('/*SIM-START*/')[1].split('/*SIM-END*/')[0];
const {LEVELS,advance,newSpear,stickPoint}=new Function(sim+';return {LEVELS,advance,newSpear,stickPoint};')();
const only=process.argv[3]?+process.argv[3]:null;
function shoot(L,state,ang){
  const lv={blocks:state.blocks,pads:L.pads||[],portals:L.portals||[],maxB:L.maxB||6};
  const sp=newSpear(state.launch.x,state.launch.y,ang,0);const hits=[];let end=null,glass=null;
  const live=state.ch.filter(c=>c.hp>0);
  while(!sp.done) advance(sp,60,lv,live,(t,d)=>{ if(t==='hit'&&d.target) hits.push(d.j); if(t==='stick'){ end=stickPoint(d); if(d.block&&d.block.kind==='glass') glass=d.block; } });
  return {hits,end,glass};
}
function apply(state,r){
  const ch=state.ch.map(c=>({...c})); for(const j of r.hits){const c=ch.find(c=>c.j===j); if(c.hp>0)c.hp--; if(c.hp<=0)c.hit=true;}
  const blocks=state.blocks.map(b=>b===r.glass?{...b,broken:true}:b);
  return {ch,blocks,launch:r.end||state.launch};
}
const left=s=>s.ch.filter(c=>c.target&&c.hp>0).length;
let falhas=0;
LEVELS.forEach((L,i)=>{ if(only&&only!==i+1) return;
  const isT=c=>L.type==='color'?c.color===L.goal:L.type==='shape'?c.shape===L.goal:true;
  let st={launch:{...L.launcher},blocks:(L.blocks||[]).map(b=>({...b})),ch:L.chickens.map((c,j)=>({...c,j,target:isT(c),hp:c.kind==='helmet'?2:c.kind==='queen'?3:1,sz:c.kind==='queen'?1.5:1,hit:false}))};
  const warn=[];st.ch.forEach((a,x)=>{ if(a.x<40||a.x>360||a.y<70||a.y>600) warn.push('fora'+x); st.ch.forEach((b,y)=>{ if(y>x&&Math.abs(a.x-b.x)<55&&Math.abs(a.y-b.y)<85) warn.push('perto'+x+'-'+y);});});
  let shots=0;const log=[];
  while(left(st)>0&&shots<12){
    let best=null,bs=-1;
    for(let a=0;a<360;a+=.5){const r=shoot(L,st,a*Math.PI/180);const sc=new Set(r.hits).size*10+r.hits.length; if(sc>bs){bs=sc;best={r,a};}}
    if(bs<=0){ // reposicionar: olha um tiro à frente
      for(let a=0;a<360;a+=2){const r=shoot(L,st,a*Math.PI/180); if(!r.end)continue; const s2=apply(st,r);
        let m=0; for(let b=0;b<360;b+=2){const r2=shoot(L,s2,b*Math.PI/180); m=Math.max(m,r2.hits.length);} const sc=m-.01; if(sc>bs){bs=sc;best={r,a};}}
      if(bs<=0){ // dois tiros de reposicionamento
        for(let a=0;a<360;a+=4){const r=shoot(L,st,a*Math.PI/180); if(!r.end)continue; const s2=apply(st,r);
          for(let b=0;b<360;b+=4){const r2=shoot(L,s2,b*Math.PI/180); if(!r2.end)continue; const s3=apply(s2,r2);
            let m=0; for(let c=0;c<360;c+=3){m=Math.max(m,shoot(L,s3,c*Math.PI/180).hits.length); if(m)break;} if(m>0&&m-.02>bs){bs=m-.02;best={r,a};}}
          if(bs>0)break;}
      }
      if(bs<=0){break;}
    }
    log.push(Math.round(best.a)+'°:'+best.r.hits.length); st=apply(st,best.r); shots++;
  }
  if(left(st)||shots>L.spears) falhas++;
  console.log(String(i+1).padStart(2),L.name.padEnd(22),left(st)?'INSOLÚVEL (faltam '+left(st)+')':'tiros '+shots,'| par',L.par,'lanças',L.spears,'|',log.join(' '),warn.join(' '));
});
if(falhas){console.error(falhas+' fase(s) sem solução com as lanças disponíveis');process.exit(1);}
console.log('OK: todas as fases têm solução');
