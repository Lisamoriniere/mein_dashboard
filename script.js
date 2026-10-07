const KEY = 'lisa-dashboard-v1';
const areas = {uni:['Uni','ZEIT ZUM LERNEN'],personal:['Persönliches','ZEIT FÜR DICH'],family:['Familie','ZEIT FÜREINANDER']};
const blank = () => Object.fromEntries(Object.keys(areas).map(key => [key,{tasks:[],notes:'',links:[]}]));
let data = blank();
let current = 'uni';
const $ = id => document.getElementById(id);
const status = message => { $('status').textContent = message; };
function safeUrl(value){try{const url=new URL(value);return ['https:','http:'].includes(url.protocol);}catch{return false;}}
function valid(value){return value && Object.keys(areas).every(key=>{const a=value[key];return a && typeof a.notes==='string' && a.notes.length<=20000 && Array.isArray(a.tasks) && a.tasks.length<=10000 && a.tasks.every(t=>t && typeof t.text==='string' && t.text.length<=180 && typeof t.done==='boolean') && Array.isArray(a.links) && a.links.length<=10000 && a.links.every(l=>l && typeof l.name==='string' && l.name.length<=100 && typeof l.url==='string' && safeUrl(l.url));});}
try{const stored=localStorage.getItem(KEY);if(stored){const parsed=JSON.parse(stored);if(valid(parsed))data=parsed;else status('Gespeicherte Daten konnten nicht gelesen werden.');}}catch{status('Speicher nicht verfügbar. Nutze die Sicherung zum Aufbewahren deiner Einträge.');}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch{status('Speichern im Browser fehlgeschlagen. Bitte lade eine Sicherung herunter.');}}
function removeButton(label,action){const button=document.createElement('button');button.type='button';button.className='delete';button.textContent='Entfernen';button.setAttribute('aria-label',label);button.onclick=action;return button;}
function render(){
  const area=data[current];$('area-title').textContent=areas[current][0];$('area-label').textContent=areas[current][1];$('notes').value=area.notes;
  document.querySelectorAll('.tab').forEach(button=>{const active=button.dataset.area===current;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  $('tasks').replaceChildren();
  area.tasks.forEach((task,index)=>{const li=document.createElement('li');li.classList.toggle('done',task.done);const label=document.createElement('label');const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=task.done;checkbox.onchange=()=>{task.done=checkbox.checked;save();render();};const span=document.createElement('span');span.textContent=task.text;label.append(checkbox,span);li.append(label,removeButton('Aufgabe entfernen: '+task.text,()=>{area.tasks.splice(index,1);save();render();}));$('tasks').append(li);});
  $('empty').hidden=area.tasks.length>0;$('progress').textContent=area.tasks.length ? `${area.tasks.filter(t=>t.done).length} von ${area.tasks.length} Aufgaben erledigt` : 'Dein Bereich, dein Tempo.';
  $('links').replaceChildren();area.links.forEach((link,index)=>{const li=document.createElement('li');const a=document.createElement('a');a.textContent=link.name;a.href=link.url;a.target='_blank';a.rel='noopener noreferrer';li.append(a,removeButton('Link entfernen: '+link.name,()=>{area.links.splice(index,1);save();render();}));$('links').append(li);});
}
document.querySelectorAll('.tab').forEach(button=>button.onclick=()=>{current=button.dataset.area;$('task-form').reset();$('link-form').reset();render();});
$('task-form').onsubmit=event=>{event.preventDefault();const text=$('task-input').value.trim();if(!text)return;data[current].tasks.push({text,done:false});save();$('task-form').reset();render();$('task-input').focus();};
$('notes').oninput=()=>{data[current].notes=$('notes').value;save();};
$('link-form').onsubmit=event=>{event.preventDefault();const name=$('link-name').value.trim();const url=$('link-url').value.trim();if(!name || !safeUrl(url)){status('Bitte gib einen Namen und eine Webadresse mit https:// oder http:// ein.');return;}data[current].links.push({name,url});save();$('link-form').reset();render();};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='lisas-dashboard-sicherung.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Sicherung erstellt. Bewahre sie an einem sicheren Ort auf.');};
$('import').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>5000000)throw new Error();const parsed=JSON.parse(await file.text());if(!valid(parsed))throw new Error();if(!confirm('Die Sicherung ersetzt alle aktuellen Einträge in Uni, Persönliches und Familie. Fortfahren?'))return;data=parsed;save();render();status('Sicherung geladen.');}catch{status('Diese Datei ist keine gültige Dashboard-Sicherung.');}finally{event.target.value='';}};
$('date').textContent=new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
render();
