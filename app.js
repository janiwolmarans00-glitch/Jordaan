
import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const cfg=window.APP_CONFIG||{},ok=cfg.SUPABASE_URL&&!cfg.SUPABASE_URL.includes('YOUR-PROJECT')&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_ANON_KEY.includes('YOUR_'),sb=ok?createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
const $=s=>document.querySelector(s),all=async t=>{if(!sb)return[];let{data,error}=await sb.from(t).select('*');if(error){console.error(error);return[]}return data||[]},esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let profile=null,farms=[];
const DB='jordaan-offline',openDB=()=>new Promise((res,rej)=>{let r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('queue',{keyPath:'id',autoIncrement:true});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function queue(table,data){let d=await openDB();d.transaction('queue','readwrite').objectStore('queue').add({table,data});}
async function save(t,d){if(!sb||!navigator.onLine){await queue(t,d);alert('Vanlyn gestoor; sal sinkroniseer wanneer internet terugkeer.');return}let{error}=await sb.from(t).insert(d);if(error)throw error}
window.syncNow=async()=>{if(!sb||!navigator.onLine)return alert('Geen verbinding nie.');let d=await openDB(),tx=d.transaction('queue','readonly'),req=tx.objectStore('queue').getAll();req.onsuccess=async()=>{for(let x of req.result){let{error}=await sb.from(x.table).insert(x.data);if(!error)d.transaction('queue','readwrite').objectStore('queue').delete(x.id)}alert('Sinkronisering voltooi.');}};
async function upload(file,path){if(!sb||!navigator.onLine)throw Error('Dokumente moet aanlyn opgelaai word.');let name=path+'/'+Date.now()+'_'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_');let{error}=await sb.storage.from('private-documents').upload(name,file);if(error)throw error;return name}
function opts(id,arr,label='name'){let e=$('#'+id);if(e)e.innerHTML=arr.map(x=>`<option value="${x.id}">${esc(x[label])}</option>`).join('')}
function bind(id,t,fn=x=>x){let f=$('#'+id);if(f)f.onsubmit=async e=>{e.preventDefault();try{let d=Object.fromEntries(new FormData(f));await save(t,fn(d));f.reset();await render()}catch(x){alert(x.message)};}}
async function init(){
 if(!sb){let c=$('#connection');if(c)c.textContent='Stel Supabase in config.js op';return}
 let{data:{session}}=await sb.auth.getSession();if(session){let{data}=await sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle();profile=data}
 farms=await all('farms');
 ['farmSelect','campFarm','workerFarm','vehicleFarm','stockFarm','purchaseFarm','financeFarm','taskFarm'].forEach(id=>opts(id,farms));
 bind('farmForm','farms',d=>({...d,hectares:+d.hectares||0}));
 bind('workerForm','workers',d=>({...d,salary:+d.salary||null,leave_balance:+d.leave_balance||0}));
 bind('campForm','camps',d=>({...d,hectares:+d.hectares||0,notes:[]}));
 bind('livestockForm','livestock',d=>Object.fromEntries(Object.entries(d).map(([k,v])=>[k,k==='camp_id'?v:+v||0])));
 bind('vehicleForm','vehicles',d=>({...d,mileage:+d.mileage||0}));
 bind('stockForm','stock_items',d=>({...d,quantity:+d.quantity||0}));
 bind('purchaseForm','purchase_requests',d=>({...d,quantity:+d.quantity||null,estimated_cost:+d.estimated_cost||null,requested_by:session?.user?.id||null}));
 bind('taskForm','tasks',d=>({...d,created_by:session?.user?.id||null}));
 const form=$('#financeForm');if(form)form.onsubmit=async e=>{e.preventDefault();try{let d=Object.fromEntries(new FormData(form)),file=form.elements.file.files[0],path=file?await upload(file,d.farm_id+'/finance'):null;await save('finance_transactions',{...d,amount:+d.amount,storage_path:path,created_by:session?.user?.id});form.reset();await render()}catch(x){alert(x.message)}};
 const docs=$('#workerDocForm');if(docs)docs.onsubmit=async e=>{e.preventDefault();try{let d=Object.fromEntries(new FormData(docs)),wfile=docs.elements.file.files[0],w=await all('workers'),worker=w.find(x=>x.id===d.worker_id);let path=await upload(wfile,worker.farm_id+'/workers/'+worker.id);await save('worker_documents',{worker_id:worker.id,farm_id:worker.farm_id,document_type:d.document_type,document_month:d.document_month,amount:+d.amount||null,description:d.description,storage_path:path});docs.reset()}catch(x){alert(x.message)}};
 const campdoc=$('#campDocForm');if(campdoc)campdoc.onsubmit=async e=>{e.preventDefault();try{let d=Object.fromEntries(new FormData(campdoc)),cs=await all('camps'),c=cs.find(x=>x.id===d.camp_id),path=await upload(campdoc.elements.file.files[0],c.farm_id+'/camps');await save('camp_documents',{camp_id:c.id,farm_id:c.farm_id,description:d.description,storage_path:path});}catch(x){alert(x.message)}};
 const job=$('#jobCardForm');if(job)job.onsubmit=async e=>{e.preventDefault();try{let d=Object.fromEntries(new FormData(job)),v=(await all('vehicles')).find(x=>x.id===d.vehicle_id),path=job.elements.file.files[0]?await upload(job.elements.file.files[0],v.farm_id+'/vehicles'):null;await save('job_cards',{vehicle_id:v.id,farm_id:v.farm_id,job_date:d.job_date,mileage:+d.mileage||null,description:d.description,cost:+d.cost||null,storage_path:path});}catch(x){alert(x.message)}};
 const note=$('#campNoteForm');if(note)note.onsubmit=async e=>{e.preventDefault();let d=Object.fromEntries(new FormData(note)),c=(await all('camps')).find(x=>x.id===d.camp_id);let{error}=await sb.from('camps').update({notes:[...(c.notes||[]),d.note]}).eq('id',c.id);if(error)alert(error.message);else render()};
 const leave=$('#leaveForm');if(leave)leave.onsubmit=async e=>{e.preventDefault();let d=Object.fromEntries(new FormData(leave)),w=(await all('workers')).find(x=>x.id===d.worker_id);await save('leave_requests',{...d,farm_id:w.farm_id})};
 const login=$('#loginForm');if(login)login.onsubmit=async e=>{e.preventDefault();let d=Object.fromEntries(new FormData(login)),{error}=await sb.auth.signInWithPassword({email:d.email,password:d.password});if(error)alert(error.message);else location.reload()};
 const logout=$('#logoutBtn');if(logout)logout.onclick=async()=>{await sb.auth.signOut();location.reload()};
 await render();
}
async function render(){
 farms=await all('farms');let cards=$('#farmCards');if(cards)cards.innerHTML=farms.map(f=>`<div class="card"><h2>${esc(f.name)}</h2><div class="stat">${f.hectares} ha</div><p>${esc(f.animal_types)}</p></div>`).join('');
 let farmList=$('#farmList');if(farmList)farmList.innerHTML=farms.map(f=>`<p class="card">${esc(f.name)} – ${f.hectares} ha – ${esc(f.animal_types)}</p>`).join('');
 let workers=await all('workers');opts('workerSelect',workers,'full_name');opts('docWorker',workers,'full_name');let wl=$('#workersList');if(wl)wl.innerHTML=workers.map(w=>`<p class="card">${esc(w.full_name)} | ${esc(farms.find(f=>f.id===w.farm_id)?.name)} | ${esc(w.mobile)} | verlof: ${w.leave_balance}</p>`).join('');
 let camps=await all('camps');['campSelect','campSelect2','campSelect3'].forEach(id=>opts(id,camps));let cl=$('#campList');if(cl)cl.innerHTML=camps.map(c=>`<p class="card"><b>${esc(c.name)}</b> – ${c.hectares} ha – ${esc(farms.find(f=>f.id===c.farm_id)?.name)}<br>${(c.notes||[]).map(esc).join('<br>')}</p>`).join('');
 let vehicles=await all('vehicles');opts('vehicleSelect',vehicles,'description');let vl=$('#vehicleList');if(vl)vl.innerHTML=vehicles.map(v=>`<p class="card">${esc(v.description)} | ${esc(v.registration)} | Engine: ${esc(v.engine_number)} | ${v.mileage} km</p>`).join('');
 let stock=await all('stock_items');for(let [id,cat] of [['toolsList','tools'],['feedList','feed']]){let el=$('#'+id);if(el)el.innerHTML=stock.filter(x=>x.category===cat).map(s=>`<p class="card">${esc(s.item_name)} – ${s.quantity} ${esc(s.unit)}</p>`).join('')}
 let purchases=await all('purchase_requests'),pl=$('#purchaseList');if(pl)pl.innerHTML=purchases.map(p=>`<p class="card">${esc(p.description)} | ${p.status} ${profile?.role==='admin'&&p.status==='pending'?`<button data-ok="${p.id}">Approve</button><button class="danger" data-no="${p.id}">Decline</button>`:''}</p>`).join('');
 document.querySelectorAll('[data-ok]').forEach(b=>b.onclick=()=>review(b.dataset.ok,'approved'));document.querySelectorAll('[data-no]').forEach(b=>b.onclick=()=>review(b.dataset.no,'declined'));
 let finance=await all('finance_transactions'),fl=$('#financeList');if(fl)fl.innerHTML=finance.map(x=>`<p class="card">${x.transaction_date} | ${x.transaction_type} | ${esc(x.description)} | R${x.amount}</p>`).join('');
 let tasks=await all('tasks'),tl=$('#taskList');if(tl)tl.innerHTML=tasks.map(t=>`<p class="card">${esc(t.title)} – ${t.status} <button data-task="${t.id}">Merk klaar</button></p>`).join('');
 document.querySelectorAll('[data-task]').forEach(b=>b.onclick=async()=>{let{error}=await sb.from('tasks').update({status:'completed',completed_at:new Date().toISOString()}).eq('id',b.dataset.task);if(error)alert(error.message);render()});
 let sum=$('#summary');if(sum)sum.textContent=`${farms.length} plase | ${workers.length} werkers | ${camps.length} kampe | ${vehicles.length} voertuie`;
}
async function review(id,status){let{error}=await sb.from('purchase_requests').update({status,reviewed_by:(await sb.auth.getUser()).data.user.id,reviewed_at:new Date().toISOString()}).eq('id',id);if(error)alert(error.message);render()}
window.addEventListener('online',()=>{let c=$('#connection');if(c)c.textContent='Aanlyn';syncNow()});window.addEventListener('offline',()=>{let c=$('#connection');if(c)c.textContent='Vanlyn'});if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js');await init();
