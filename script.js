const KEY = 'lisa-dashboard-v1';
const areas = {uni:['Uni','ZEIT ZUM LERNEN'],personal:['Persönliches','ZEIT FÜR DICH'],family:['Familie','ZEIT FÜREINANDER']};
const blank = () => Object.fromEntries(Object.keys(areas).map(key => [key,{tasks:[],notes:'',links:[]}]));
let data = blank();
let current = 'uni';
const $ = id => document.getElementById(id);
const status = message => { $('status').textContent = message; };
function safeUrl(value){try{const url=new URL(value);return ['https:','http:'].includes(url.protocol);}catch{return false;}}
function valid(value){return value && validPlanner(value.planner) && Object.keys(areas).every(key=>{const a=value[key];return a && typeof a.notes==='string' && a.notes.length<=20000 && Array.isArray(a.tasks) && a.tasks.length<=10000 && a.tasks.every(t=>t && typeof t.text==='string' && t.text.length<=180 && typeof t.done==='boolean') && Array.isArray(a.links) && a.links.length<=10000 && a.links.every(l=>l && typeof l.name==='string' && l.name.length<=100 && typeof l.url==='string' && safeUrl(l.url));});}
try{const stored=localStorage.getItem(KEY);if(stored){const parsed=JSON.parse(stored);if(valid(parsed))data=parsed;else status('Gespeicherte Daten konnten nicht gelesen werden.');}}catch{status('Speicher nicht verfügbar. Nutze die Sicherung zum Aufbewahren deiner Einträge.');}
ensurePlanner();
function save(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch{status('Speichern im Browser fehlgeschlagen. Bitte lade eine Sicherung herunter.');}}
function removeButton(label,action){const button=document.createElement('button');button.type='button';button.className='delete';button.textContent='Entfernen';button.setAttribute('aria-label',label);button.onclick=action;return button;}
function render(){
  const area=data[current];$('area-title').textContent=areas[current][0];$('area-label').textContent=areas[current][1];$('notes').value=area.notes;
  document.querySelectorAll('.tab').forEach(button=>{const active=button.dataset.area===current;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  $('tasks').replaceChildren();
  area.tasks.forEach((task,index)=>{const li=document.createElement('li');li.classList.toggle('done',task.done);const label=document.createElement('label');const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=task.done;checkbox.onchange=()=>{task.done=checkbox.checked;save();render();};const span=document.createElement('span');span.textContent=task.text;label.append(checkbox,span);li.append(label,removeButton('Aufgabe entfernen: '+task.text,()=>{area.tasks.splice(index,1);save();render();}));$('tasks').append(li);});
  $('empty').hidden=area.tasks.length>0;$('progress').textContent=area.tasks.length ? `${area.tasks.filter(t=>t.done).length} von ${area.tasks.length} Aufgaben erledigt` : 'Dein Bereich, dein Tempo.';
  $('links').replaceChildren();area.links.forEach((link,index)=>{const li=document.createElement('li');const a=document.createElement('a');a.textContent=link.name;a.href=link.url;a.target='_blank';a.rel='noopener noreferrer';li.append(a,removeButton('Link entfernen: '+link.name,()=>{area.links.splice(index,1);save();render();}));$('links').append(li);});
  renderPlanner();
}
document.querySelectorAll('.tab').forEach(button=>button.onclick=()=>{current=button.dataset.area;$('task-form').reset();$('link-form').reset();render();});
$('task-form').onsubmit=event=>{event.preventDefault();const text=$('task-input').value.trim();if(!text)return;data[current].tasks.push({text,done:false});save();$('task-form').reset();render();$('task-input').focus();};
$('notes').oninput=()=>{data[current].notes=$('notes').value;save();};
$('link-form').onsubmit=event=>{event.preventDefault();const name=$('link-name').value.trim();const url=$('link-url').value.trim();if(!name || !safeUrl(url)){status('Bitte gib einen Namen und eine Webadresse mit https:// oder http:// ein.');return;}data[current].links.push({name,url});save();$('link-form').reset();render();};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='lisas-dashboard-sicherung.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Sicherung erstellt. Bewahre sie an einem sicheren Ort auf.');};
$('import').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>5000000)throw new Error();const parsed=JSON.parse(await file.text());if(!valid(parsed))throw new Error();if(!confirm('Die Sicherung ersetzt alle aktuellen Einträge, einschließlich Kalender, Stundenplan und Personen. Fortfahren?'))return;data=parsed;ensurePlanner();save();render();status('Sicherung geladen.');}catch{status('Diese Datei ist keine gültige Dashboard-Sicherung.');}finally{event.target.value='';}};
$('date').textContent=new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
// Kalenderdaten ergänzen; ältere Aufgaben und Sicherungen bleiben lesbar.
function ensurePlanner(){if(!data.planner)data.planner={events:[],schedule:[],people:[]};}
function isDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00');return !Number.isNaN(d.getTime())&&dateKey(d)===value;}
function isTime(value){return typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value);}
function bounded(value,max){return typeof value==='string'&&value.length<=max;}
function knownArea(value){return Object.prototype.hasOwnProperty.call(areas,value);}
function validPlanner(p){if(p===undefined)return true;return p&&['events','schedule','people'].every(k=>Array.isArray(p[k])&&p[k].length<=10000)&&p.people.every(x=>x&&bounded(x.id,100)&&bounded(x.name,100)&&knownArea(x.area)&&(x.birthday===''||isDate(x.birthday))&&bounded(x.email,180)&&bounded(x.phone,80)&&bounded(x.note,500))&&p.events.every(x=>x&&bounded(x.id,100)&&bounded(x.title,180)&&isDate(x.date)&&(x.time===''||isTime(x.time))&&knownArea(x.area)&&bounded(x.place,180)&&bounded(x.person,100))&&p.schedule.every(x=>x&&bounded(x.id,100)&&bounded(x.title,180)&&Number.isInteger(x.day)&&x.day>=0&&x.day<=6&&isTime(x.start)&&isTime(x.end)&&x.end>x.start&&bounded(x.room,180)&&isDate(x.from)&&isDate(x.until)&&x.until>=x.from);}
function dateKey(date){return `${String(date.getFullYear()).padStart(4,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function monday(date){const d=new Date(date);d.setHours(12,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);return d;}
function uid(){return globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;}
let week=monday(new Date());
const weekdays=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
function shortDate(value){return new Intl.DateTimeFormat('de-DE',{day:'numeric',month:'short'}).format(new Date(value+'T12:00:00'));}
function record(title,details,remove){const li=document.createElement('li');const body=document.createElement('div');body.className='record';const strong=document.createElement('strong');strong.textContent=title;body.append(strong);details.filter(Boolean).forEach(text=>{const span=document.createElement('span');span.textContent=text;body.append(span);});li.append(body,removeButton(title+' entfernen',remove));return li;}
function renderPlanner(){
  const p=data.planner;
  $('schedule-section').hidden=current!=='uni';
  $('schedule-list').replaceChildren();
  [...p.schedule].sort((a,b)=>((a.day+6)%7)-((b.day+6)%7)||a.start.localeCompare(b.start)).forEach(item=>$('schedule-list').append(record(item.title,[`${weekdays[item.day]} · ${item.start}–${item.end}`,item.room,`${shortDate(item.from)} ${item.from.slice(0,4)} bis ${shortDate(item.until)} ${item.until.slice(0,4)}`],()=>{p.schedule=p.schedule.filter(x=>x.id!==item.id);save();render();})));
  if(!p.schedule.length)$('schedule-list').append(recordEmpty('Noch keine Veranstaltungen eingetragen.'));
  $('people-list').replaceChildren();
  const people=p.people.filter(person=>person.area===current);
  people.forEach(person=>$('people-list').append(record(person.name,[person.birthday?'Geburtstag: '+shortDate(person.birthday):'',person.email,person.phone,person.note],()=>{if(!confirm('Person entfernen? Zugeordnete Termine bleiben erhalten.'))return;p.people=p.people.filter(x=>x.id!==person.id);p.events.forEach(x=>{if(x.person===person.id)x.person='';});save();render();})));
  if(!people.length)$('people-list').append(recordEmpty('Noch keine Personen in diesem Bereich.'));
  const selected=$('event-person').value;$('event-person').replaceChildren(new Option('Ohne Person',''));p.people.forEach(person=>$('event-person').append(new Option(`${person.name} · ${areas[person.area][0]}`,person.id)));if(p.people.some(x=>x.id===selected))$('event-person').value=selected;
  renderCalendar();
}
function recordEmpty(text){const li=document.createElement('li');li.className='small';li.textContent=text;return li;}
function renderCalendar(){
  const end=new Date(week);end.setDate(end.getDate()+6);
  $('week-label').textContent=`${shortDate(dateKey(week))} – ${shortDate(dateKey(end))} ${end.getFullYear()}`;
  $('week-grid').replaceChildren();const filter=$('calendar-filter').value;const p=data.planner;
  for(let offset=0;offset<7;offset++){
    const date=new Date(week);date.setDate(date.getDate()+offset);const key=dateKey(date);
    const day=document.createElement('section');day.className='day';day.classList.toggle('today',key===dateKey(new Date()));const heading=document.createElement('h3');heading.textContent=`${weekdays[date.getDay()]} · ${date.getDate()}.${date.getMonth()+1}.`;day.append(heading);
    const entries=p.events.filter(x=>x.date===key).map(x=>({title:x.title,area:x.area,time:x.time,details:[x.place,p.people.find(person=>person.id===x.person)?.name].filter(Boolean).join(' · '),remove:()=>{p.events=p.events.filter(e=>e.id!==x.id);save();render();}}));
    p.schedule.filter(x=>x.day===date.getDay()&&x.from<=key&&key<=x.until).forEach(x=>entries.push({title:x.title,area:'uni',time:x.start,details:`${x.start}–${x.end}${x.room?' · '+x.room:''}`}));
    p.people.filter(x=>x.birthday&&x.birthday.slice(5)===key.slice(5)).forEach(x=>entries.push({title:'Geburtstag: '+x.name,area:x.area,time:'',details:'Ganztägig'}));
    const visible=entries.filter(x=>filter==='all'||x.area===filter).sort((a,b)=>a.time.localeCompare(b.time));
    visible.forEach(entry=>{const card=document.createElement('div');card.className='calendar-item '+entry.area;const title=document.createElement('strong');title.textContent=entry.title;const meta=document.createElement('span');meta.textContent=[areas[entry.area][0],entry.time].filter(Boolean).join(' · ');card.append(title,meta);if(entry.details){const detail=document.createElement('span');detail.textContent=entry.details;card.append(detail);}if(entry.remove)card.append(removeButton('Termin entfernen: '+entry.title,entry.remove));day.append(card);});
    if(!visible.length){const empty=document.createElement('p');empty.className='day-empty';empty.textContent='Keine Termine';day.append(empty);}$('week-grid').append(day);
  }
}
$('previous-week').onclick=()=>{week.setDate(week.getDate()-7);renderCalendar();};
$('next-week').onclick=()=>{week.setDate(week.getDate()+7);renderCalendar();};
$('this-week').onclick=()=>{week=monday(new Date());renderCalendar();};
$('calendar-filter').onchange=renderCalendar;
$('event-form').onsubmit=event=>{event.preventDefault();const title=$('event-title').value.trim();const date=$('event-date').value;if(!title||!isDate(date))return;data.planner.events.push({id:uid(),title,date,time:$('event-time').value,area:$('event-area').value,place:$('event-place').value.trim(),person:$('event-person').value});week=monday(new Date(date+'T12:00:00'));$('calendar-filter').value='all';save();$('event-form').reset();$('event-date').value=dateKey(new Date());render();status('Termin gespeichert.');};
$('schedule-form').onsubmit=event=>{event.preventDefault();const title=$('schedule-title').value.trim();const from=$('schedule-from').value;const until=$('schedule-until').value;const start=$('schedule-start').value;const end=$('schedule-end').value;if(!title)return;if(!isDate(from)||!isDate(until)||until<from){status('Das Semesterende muss am oder nach dem Semesterbeginn liegen.');return;}if(!isTime(start)||!isTime(end)||end<=start){status('Das Ende muss nach dem Beginn liegen.');return;}data.planner.schedule.push({id:uid(),title,day:Number($('schedule-day').value),start,end,room:$('schedule-room').value.trim(),from,until});save();$('schedule-form').reset();$('schedule-from').value=from;$('schedule-until').value=until;render();status('Veranstaltung gespeichert.');};
$('person-form').onsubmit=event=>{event.preventDefault();const name=$('person-name').value.trim();if(!name)return;data.planner.people.push({id:uid(),name,area:current,birthday:$('person-birthday').value,email:$('person-email').value.trim(),phone:$('person-phone').value.trim(),note:$('person-note').value.trim()});save();$('person-form').reset();render();status('Person gespeichert.');};
$('event-date').value=dateKey(new Date());
render();
