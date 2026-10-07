// Der Browser führt nur geprüfte Aktionen aus. KI-Schlüssel gehören auf den Server.
const assistant = {history:[],pending:null,busy:false,url:'',token:'',consent:false,controller:null};
const actionLabels = {navigate:'Bereich öffnen',calendar_show:'Kalender anzeigen',task_add:'Aufgabe hinzufügen',task_toggle:'Aufgabenstatus ändern',task_delete:'Aufgabe entfernen',note_append:'Notiz ergänzen',note_replace:'Notiz ersetzen',link_add:'Link hinzufügen',link_delete:'Link entfernen',event_add:'Termin hinzufügen',event_update:'Termin ändern',event_delete:'Termin entfernen',schedule_add:'Veranstaltung hinzufügen',schedule_update:'Veranstaltung ändern',schedule_delete:'Veranstaltung entfernen',person_add:'Person hinzufügen',person_update:'Person ändern',person_delete:'Person entfernen',backup:'Sicherung herunterladen'};
const fieldLabels={area:'Bereich',title:'Titel',text:'Text',name:'Name',date:'Datum',time:'Uhrzeit',place:'Ort',person:'Person',day:'Wochentag',start:'Beginn',end:'Ende',room:'Raum',from:'Semesterbeginn',until:'Semesterende',birthday:'Geburtstag',email:'E-Mail',phone:'Telefon',note:'Notiz',url:'Adresse',target:'Ansicht',done:'Erledigt'};
function assistantMessage(text,role='assistant'){
  const message=document.createElement('div');message.className='chat-message '+role;const label=document.createElement('strong');label.textContent=role==='user'?'Du':'Assistent';const body=document.createElement('p');body.textContent=text;message.append(label,body);$('assistant-messages').append(message);message.scrollIntoView({block:'nearest'});
}
function clearProposal(){assistant.pending=null;$('assistant-preview').hidden=true;$('assistant-changes').replaceChildren();}
function assistantNavigate(area,target){
  if(area){if(!knownArea(area))throw new Error('Unbekannter Bereich.');current=area;render();}
  const targets={calendar:'week-label',tasks:'task-input',notes:'notes',links:'link-name',schedule:'schedule-section',people:'people-list'};
  if(target==='schedule'&&current!=='uni'){current='uni';render();}
  if(target&&!targets[target])throw new Error('Unbekannte Ansicht.');
  if(target)$(targets[target]).scrollIntoView({behavior:'smooth',block:'center'});
}
function checkedText(value,max=180,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new Error('Ein Textfeld ist ungültig.');return value.trim();}
function checkedIndex(value,list){if(!Number.isInteger(value)||value<0||value>=list.length)throw new Error('Der Eintrag wurde nicht gefunden.');return value;}
function checkedRecord(list,id){const index=list.findIndex(x=>x.id===id);if(index<0)throw new Error('Der Eintrag wurde nicht gefunden.');return index;}
function applyAssistantAction(copy,action){
  if(!action||!Object.hasOwn(actionLabels,action.type)||!action.fields||typeof action.fields!=='object')throw new Error('Unbekannte Aktion.');
  const f=action.fields, type=action.type;
  if(['navigate','calendar_show','backup'].includes(type)){
    if(type==='navigate'&&((f.area&&!knownArea(f.area))||(f.target&&!['calendar','tasks','notes','links','schedule','people'].includes(f.target))))throw new Error('Unbekannte Ansicht.');
    if(type==='calendar_show'&&((f.area&&f.area!=='all'&&!knownArea(f.area))||(f.date&&!isDate(f.date))))throw new Error('Ungültige Kalenderansicht.');return;
  }
  const scoped=/^(task|note|link)_/.test(type);if(scoped&&!knownArea(f.area))throw new Error('Bitte einen Bereich angeben.');const section=scoped?copy[f.area]:null;
  if(type==='task_add')section.tasks.push({text:checkedText(f.text,180,true),done:false});
  else if(type==='task_toggle'){if(typeof f.done!=='boolean')throw new Error('Ungültiger Aufgabenstatus.');section.tasks[checkedIndex(f.index,section.tasks)].done=f.done;}
  else if(type==='task_delete')section.tasks.splice(checkedIndex(f.index,section.tasks),1);
  else if(type==='note_append')section.notes+=(section.notes?'\n':'')+checkedText(f.text,20000,true);
  else if(type==='note_replace')section.notes=checkedText(f.text,20000);
  else if(type==='link_add'){if(!safeUrl(f.url))throw new Error('Ungültige Webadresse.');section.links.push({name:checkedText(f.name,100,true),url:f.url});}
  else if(type==='link_delete')section.links.splice(checkedIndex(f.index,section.links),1);
  else {
    const group=type.split('_')[0], operation=type.split('_')[1];
    const collections={event:'events',schedule:'schedule',person:'people'};const list=copy.planner[collections[group]];
    if(!list)throw new Error('Unbekannte Aktion.');
    if(operation==='delete'){const i=checkedRecord(list,f.id);list.splice(i,1);if(group==='person')copy.planner.events.forEach(event=>{if(event.person===f.id)event.person='';});return;}
    const keys={event:['title','date','time','area','place','person'],schedule:['title','day','start','end','room','from','until'],person:['name','area','birthday','email','phone','note']}[group];
    let item,index;
    if(operation==='update'){index=checkedRecord(list,f.id);item={...list[index]};}
    else if(operation==='add'){item={id:uid()};keys.forEach(key=>item[key]=key==='day'?null:'');}
    else throw new Error('Unbekannte Aktion.');
    keys.forEach(key=>{if(f[key]!==null&&f[key]!==undefined)item[key]=f[key];});
    if(group==='event'){checkedText(item.title,180,true);if(!knownArea(item.area)||!isDate(item.date)||(item.time&&!isTime(item.time))||(item.person&&!copy.planner.people.some(x=>x.id===item.person)))throw new Error('Terminangaben fehlen oder sind ungültig.');}
    if(group==='schedule')checkedText(item.title,180,true);
    if(group==='person'){checkedText(item.name,100,true);if(!knownArea(item.area))throw new Error('Bereich der Person fehlt.');}
    if(operation==='update')list[index]=item;else list.push(item);
  }
  if(!valid(copy))throw new Error('Die vorgeschlagenen Daten sind ungültig oder zu lang.');
}
function validateActions(actions){if(!Array.isArray(actions)||actions.length>12)throw new Error('Zu viele oder ungültige Aktionen.');const copy=structuredClone(data);actions.forEach(action=>applyAssistantAction(copy,action));return copy;}
function changeDescription(action){
  const f=action.fields;const lines=[actionLabels[action.type]];
  if(f.index!==null&&f.index!==undefined&&knownArea(f.area)){const list=action.type.startsWith('link_')?data[f.area].links:data[f.area].tasks;const item=list[f.index];if(item)lines.push(item.text||item.name);}
  if(f.id){const item=[...data.planner.events,...data.planner.schedule,...data.planner.people].find(x=>x.id===f.id);if(item)lines.push(item.title||item.name);}
  Object.entries(fieldLabels).forEach(([key,label])=>{const value=f[key];if(value===null||value===undefined)return;let shown=String(value);if(key==='area')shown=areas[value]?.[0]||value;if(key==='day')shown=weekdays[value]||shown;if(key==='person')shown=data.planner.people.find(x=>x.id===value)?.name||'Ohne Person';if(key==='done')shown=value?'Ja':'Nein';lines.push(`${label}: ${shown||'(leer)'}`);});return lines.join('\n');
}
function prepareProposal(actions){
  validateActions(actions);clearProposal();if(!actions.length)return;
  assistant.pending={actions,snapshot:JSON.stringify(data)};
  actions.forEach(action=>{const preview=document.createElement('p');preview.textContent=changeDescription(action);$('assistant-changes').append(preview);});$('assistant-preview').hidden=false;
}
function executeNonMutating(action){const f=action.fields;if(action.type==='navigate')assistantNavigate(f.area,f.target);if(action.type==='calendar_show'){if(f.date)week=monday(new Date(f.date+'T12:00:00'));$('calendar-filter').value=f.area||'all';renderCalendar();assistantNavigate(null,'calendar');}if(action.type==='backup')$('export').click();}
$('assistant-confirm').onclick=()=>{
  const pending=assistant.pending;if(!pending)return;
  try{if(JSON.stringify(data)!==pending.snapshot)throw new Error('Deine Einträge haben sich inzwischen geändert. Bitte beschreibe den Wunsch erneut.');const copy=validateActions(pending.actions);const mutates=pending.actions.some(a=>!['navigate','calendar_show','backup'].includes(a.type));if(mutates){try{localStorage.setItem(KEY,JSON.stringify(copy));}catch{throw new Error('Speichern ist nicht möglich. Es wurde nichts geändert.');}data=copy;render();}pending.actions.forEach(executeNonMutating);clearProposal();assistantMessage('Die bestätigten Aktionen wurden ausgeführt.');assistant.history.push({role:'user',content:'Ich habe die vorgeschlagenen Aktionen bestätigt. Sie wurden erfolgreich ausgeführt.'});}
  catch(error){clearProposal();assistantMessage(error.message);}
};
$('assistant-cancel').onclick=()=>{clearProposal();assistantMessage('Vorschlag verworfen.');assistant.history.push({role:'user',content:'Ich habe den Vorschlag verworfen. Es wurde nichts geändert.'});};
const help={calendar:['calendar','Termine trägst du im Kalender unter „Termin hinzufügen“ ein. Mit Vorherige, Heute und Nächste wechselst du die Woche. Der Bereichsfilter grenzt die Anzeige ein.'],schedule:['schedule','Unter Uni findest du den Stundenplan. Öffne „Veranstaltung hinzufügen“ und trage Wochentag, Zeiten und Semesterzeitraum ein. Die Veranstaltung erscheint wöchentlich im Kalender.'],people:['people','Wähle Uni, Persönliches oder Familie und öffne „Person hinzufügen“. Ein Geburtstag erscheint jährlich im Kalender. Kontakte erhalten keinen eigenen Zugang.'],backup:[null,'Mit „Sicherung herunterladen“ sicherst du alle Einträge. Zum Wiederherstellen nutzt du „Sicherung laden“. Dabei werden nach Bestätigung die aktuellen Daten ersetzt.']};
document.querySelectorAll('[data-help]').forEach(button=>button.onclick=()=>{const entry=help[button.dataset.help];if(entry[0])assistantNavigate(null,entry[0]);assistantMessage(entry[1]+' Diese Bedienhilfe funktioniert ohne KI-Verbindung.');});
function connectionState(){ $('assistant-state').textContent=assistant.url&&assistant.token&&assistant.consent?'KI-Dienst eingerichtet · Verbindung wird beim Senden geprüft':'KI noch nicht verbunden · Bedienhilfe verfügbar';}
try{assistant.url=localStorage.getItem('lisa-assistant-url')||'';assistant.token=sessionStorage.getItem('lisa-assistant-token')||'';assistant.consent=sessionStorage.getItem('lisa-assistant-consent')==='yes';}catch{}
$('assistant-url').value=assistant.url;$('assistant-token').value=assistant.token;$('assistant-consent').checked=assistant.consent;connectionState();
$('assistant-connect').onsubmit=event=>{event.preventDefault();try{const url=new URL($('assistant-url').value);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw new Error('Bitte eine HTTPS-Dienstadresse ohne Zugangsdaten oder Zusatzparameter verwenden.');const token=$('assistant-token').value.trim();if(token.length<32||!$('assistant-consent').checked)throw new Error('Bitte Zugangscode und Einwilligung ergänzen.');assistant.url=url.origin+url.pathname.replace(/\/$/,'');assistant.token=token;assistant.consent=true;try{localStorage.setItem('lisa-assistant-url',assistant.url);sessionStorage.setItem('lisa-assistant-token',token);sessionStorage.setItem('lisa-assistant-consent','yes');}catch{}clearProposal();assistant.history=[];connectionState();assistantMessage('Verbindung eingerichtet. Beim Senden werden dein Chat und deine Dashboard-Einträge an diesen Dienst übertragen.');$('assistant-settings').open=false;}catch(error){assistantMessage(error.message);}};
$('assistant-disconnect').onclick=()=>{assistant.controller?.abort();assistant.url='';assistant.token='';assistant.consent=false;assistant.history=[];clearProposal();$('assistant-url').value='';$('assistant-token').value='';$('assistant-consent').checked=false;try{localStorage.removeItem('lisa-assistant-url');sessionStorage.removeItem('lisa-assistant-token');sessionStorage.removeItem('lisa-assistant-consent');}catch{}connectionState();assistantMessage('Verbindung entfernt.');};
$('assistant-clear').onclick=()=>{if(assistant.busy)return;assistant.history=[];clearProposal();$('assistant-messages').replaceChildren();assistantMessage('Neues Gespräch. Was möchtest du erledigen?');};
$('assistant-form').onsubmit=async event=>{
  event.preventDefault();if(assistant.busy)return;const text=$('assistant-input').value.trim();if(!text)return;
  if(!assistant.url||!assistant.token||!assistant.consent){assistantMessage('Die KI ist noch nicht verbunden. Die Schaltflächen oben helfen dir bereits bei der Bedienung. Für freie Fragen und Einträge richte zuerst die KI-Verbindung ein.');$('assistant-settings').open=true;return;}
  clearProposal();assistantMessage(text,'user');$('assistant-input').value='';assistant.busy=true;$('assistant-send').disabled=true;$('assistant-clear').disabled=true;$('assistant-state').textContent='Assistent prüft deine Anfrage …';
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),60000);assistant.controller=controller;const snapshot=JSON.stringify(data),connection=assistant.url;
  try{
    const history=[...assistant.history,{role:'user',content:text}].slice(-10);
    const response=await fetch(assistant.url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+assistant.token},body:JSON.stringify({messages:history,state:data,currentArea:current,today:dateKey(new Date()),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone}),signal:controller.signal});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'Der Assistentendienst antwortet nicht.');if(typeof result.message!=='string'||result.message.length>12000)throw new Error('Ungültige Antwort des Dienstes.');
    if(JSON.stringify(data)!==snapshot)throw new Error('Deine Einträge haben sich während der Anfrage geändert. Bitte sende die Nachricht erneut.');if(!assistant.consent||assistant.url!==connection)throw new Error('Die Verbindung wurde geändert. Bitte sende die Nachricht erneut.');prepareProposal(result.actions);assistantMessage(result.message);assistant.history=[...history,{role:'assistant',content:JSON.stringify({message:result.message,actions:result.actions})}].slice(-10);
  }catch(error){assistantMessage(error.name==='AbortError'?'Die Anfrage dauert zu lange. Bitte versuche es erneut.':error.message==='Failed to fetch'?'Der Dienst ist nicht erreichbar. Bitte prüfe die Adresse und die Freigabe für deine Website.':error.message);}
  finally{clearTimeout(timeout);assistant.controller=null;assistant.busy=false;$('assistant-send').disabled=false;$('assistant-clear').disabled=false;connectionState();}
};
assistantMessage('Ich helfe dir bei Aufgaben, Notizen, Links, Kalender, Stundenplan und Personen. Die Bedienhilfe oben kannst du sofort nutzen. Für Gespräche und Änderungsvorschläge muss die KI-Verbindung noch eingerichtet werden.');
