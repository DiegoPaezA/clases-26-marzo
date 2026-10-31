
(function(){
'use strict';
var KEY='circuitos10ele_p4_estacion_v2';
var LEGACY_KEY='circuitos10ele_p4_estacion_v1';
var TOTAL=0;
var state={schemaVersion:2,subject:'circuitos-1',retos:{},nb:{},extra:{},activities:{},team:{},historicalRetos:{}};
var canSave=true;

/* ---------- utilidades ---------- */
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function rich(s){var f=document.createDocumentFragment();String(s).split('`').forEach(function(p,i){if(!p)return;if(i%2){var c=document.createElement('code');c.textContent=p;f.appendChild(c)}else f.appendChild(document.createTextNode(p))});return f}
function add(e,c){if(c==null||c===false)return;if(Array.isArray(c)){c.forEach(function(x){add(e,x)});return}e.appendChild(typeof c==='string'||typeof c==='number'?rich(c):c)}
function el(tag,props){var e=document.createElement(tag);props=props||{};
 Object.keys(props).forEach(function(k){var v=props[k];if(v==null)return;
  if(k==='class')e.className=v;else if(k==='text')e.textContent=v;else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),v);else e.setAttribute(k,v)});
 for(var i=2;i<arguments.length;i++)add(e,arguments[i]);return e}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function num(s){var n=parseFloat(String(s).replace(',','.'));return isNaN(n)?null:n}
function fmt(n,d){return (Math.round(n*Math.pow(10,d))/Math.pow(10,d)).toString().replace('.',',')}

/* ---------- persistencia ---------- */

/* R2 identity */
function validIdentity(t){if(!t||typeof t!=='object'||Array.isArray(t))return false;if(!['curso','project','proyecto','nombre','integrantesOriginal'].every(function(k){return t[k]==null||typeof t[k]==='string'}))return false;return t.integrantes==null||typeof t.integrantes==='string'||Array.isArray(t.integrantes)&&t.integrantes.length<=100&&t.integrantes.every(function(m){return typeof m==='string'||m&&typeof m==='object'&&!Array.isArray(m)&&typeof m.nombre==='string'})}
function normalizeIdentity(t,oldName,oldCourse){t=t||{};if(!Array.isArray(t.integrantes)){var original=typeof t.integrantes==='string'?t.integrantes:String(oldName||'');if(original&&t.integrantesOriginal==null)t.integrantesOriginal=original;t.integrantes=[{nombre:original}]}else t.integrantes=t.integrantes.map(function(m){return typeof m==='string'?{nombre:m}:Object.assign({},m)});if(!t.integrantes.length)t.integrantes=[{nombre:''}];if(typeof t.curso!=='string')t.curso=String(oldCourse||'');if(typeof t.project!=='string')t.project=typeof t.proyecto==='string'?t.proyecto:'';return t}
function identityNames(t){var names=t&&t.integrantes;return(Array.isArray(names)?names.map(function(m){return typeof m==='string'?m:m.nombre}):typeof names==='string'?[names]:[]).filter(function(n){return String(n||'').trim()}).map(function(n){return String(n)})}
function identityReport(t,escape){t=t||{};var names=identityNames(t),project=typeof t.project==='string'?t.project:t.proyecto||'';return '<p><b>Curso:</b> '+escape(t.curso||'Sin registrar')+'</p><p><b>Integrantes:</b></p>'+(names.length?'<ul>'+names.map(function(n){return '<li>'+escape(n)+'</li>'}).join('')+'</ul>':'<p>Sin registrar</p>')+(String(project).trim()?'<p><b>Proyecto o equipo (opcional):</b> '+escape(project)+'</p>':'')}
function rememberR2Backup(raw,suffix){try{var key=KEY+(suffix||'-antes-r2');if(raw&&!localStorage.getItem(key))localStorage.setItem(key,raw)}catch(e){}}
function renderIdentity(root,team,save){root.replaceChildren();var title=document.createElement('h2');title.textContent='Identificación';root.appendChild(title);var intro=document.createElement('p');intro.textContent='Completa el curso y un campo por integrante. Una sola persona también puede trabajar. Estos datos aparecen en los cuatro informes.';root.appendChild(intro);function field(label,key){var box=document.createElement('label');box.className='identity-field';box.textContent=label;var input=document.createElement('input');input.type='text';input.dataset.team=key;input.value=team[key]||'';input.addEventListener('input',function(){team[key]=input.value;save()});box.appendChild(input);root.appendChild(box)}field('Curso / grupo','curso');field('Proyecto o equipo (opcional)','project');if(team.integrantesOriginal){var legacy=document.createElement('p');legacy.className='identity-help';legacy.textContent='Se recuperó el texto anterior como una sola entrada. Puedes editarla y agregar campos para organizar los nombres; no se separaron automáticamente.';root.appendChild(legacy)}var members=document.createElement('div');root.appendChild(members);function draw(focusIndex){members.replaceChildren();team.integrantes.forEach(function(member,i){var row=document.createElement('div');row.className='identity-member';var label=document.createElement('label');label.textContent='Nombre del integrante '+(i+1);var input=document.createElement('input');input.type='text';input.value=member.nombre;input.autocomplete='name';input.addEventListener('input',function(){member.nombre=input.value;save()});label.appendChild(input);var remove=document.createElement('button');remove.type='button';remove.className='btn';remove.textContent='Quitar';remove.setAttribute('aria-label','Quitar integrante '+(i+1));remove.disabled=team.integrantes.length===1;remove.addEventListener('click',function(){team.integrantes.splice(i,1);save();draw(Math.min(i,team.integrantes.length-1))});row.appendChild(label);row.appendChild(remove);members.appendChild(row);if(focusIndex===i)input.focus()});var add=document.createElement('button');add.type='button';add.className='btn';add.textContent='Agregar integrante';add.disabled=team.integrantes.length>=100;add.addEventListener('click',function(){team.integrantes.push({nombre:''});save();draw(team.integrantes.length-1)});members.appendChild(add)}draw()}
/* R2 identity end */
/* R2 reports */
function humanPendingName(text,labels){Object.keys(labels).sort(function(a,b){return b.length-a.length}).forEach(function(key){text=text.replace(new RegExp('\\b'+key+'\\b','g'),function(){return labels[key]})});var parts=text.split(' · ');if(parts.length>1&&parts[1].indexOf(parts[0])===0)text=parts.slice(1).join(' · ');return text}
function reportPendingNames(html,labels){var doc=new DOMParser().parseFromString(html,'text/html'),head=Array.from(doc.querySelectorAll('h2')).find(function(h){return h.textContent.trim()==='Pendientes'}),list=head&&head.nextElementSibling;return list?Array.from(new Set(Array.from(list.querySelectorAll('li')).map(function(li){return humanPendingName(li.textContent,labels)}))):[]}
function renderReportOverview(root,guides,report,labels,actions){root.replaceChildren();guides.forEach(function(g){var card=document.createElement('article');card.className='report-card';var h=document.createElement('h3');h.textContent='Guía '+g.n+' · '+g.title;card.appendChild(h);var pending=reportPendingNames(report(g.n),labels),details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=pending.length?pending.length+(pending.length===1?' pendiente por revisar':' pendientes por revisar'):'Sin pendientes registrados';details.appendChild(summary);var ul=document.createElement('ul');pending.forEach(function(text){var li=document.createElement('li');li.textContent=text;ul.appendChild(li)});details.appendChild(ul);card.appendChild(details);var row=document.createElement('div');row.className='report-actions';var link=document.createElement('a');link.className='btn';link.href='#guia'+g.n;link.textContent='Ir a la guía';row.appendChild(link);[['Ver informe','view'],['Imprimir / guardar PDF','print'],['Descargar HTML','download']].forEach(function(item){var b=document.createElement('button');b.type='button';b.className='btn';b.textContent=item[0];b.addEventListener('click',function(){actions[item[1]](g.n)});row.appendChild(b)});card.appendChild(row);root.appendChild(card)})}
/* R2 reports end */
function load(){
 try{var t='__t';localStorage.setItem(t,'1');localStorage.removeItem(t)}catch(e){canSave=false}
 if(canSave){try{
  var r=localStorage.getItem(KEY);
  if(r){rememberR2Backup(r);var o=JSON.parse(r);if(!o||o.schemaVersion!==2||o.subject!=='circuitos-1'||!validIdentity(o.team))throw new Error('Esquema Circuitos inválido');
   if(!Array.isArray(o.team.integrantes))rememberR2Backup(r);state=Object.assign(state,o);state.retos=state.retos||{};state.nb=state.nb||{};state.extra=state.extra||{};state.activities=state.activities||{};state.team=state.team||{};state.historicalRetos=state.historicalRetos||{};
  }else{
   var old=localStorage.getItem(LEGACY_KEY);
   if(old){var legacy=JSON.parse(old);if(!legacy||typeof legacy!=='object')throw new Error('Respaldo anterior inválido');
    state.nb=legacy.nb&&typeof legacy.nb==='object'?legacy.nb:{};state.extra=legacy.extra&&typeof legacy.extra==='object'?legacy.extra:{};
    state.historicalRetos=legacy.retos&&typeof legacy.retos==='object'?legacy.retos:{};
    persist();
   }
  }
 }catch(e){canSave=false}}
 state.team=normalizeIdentity(state.team,state.nb.grupo,state.nb.curso);if(canSave)persist();
 if(!canSave)$('#aviso').hidden=false;
 if(Object.keys(state.historicalRetos||{}).length)$('#avisoHistorico').hidden=false;
}
function persist(){
 try{state.schemaVersion=2;state.subject='circuitos-1';localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){canSave=false;$('#aviso').hidden=false;return false}
}
function ex(k,d){return state.extra[k]===undefined?d:state.extra[k]}
function setEx(k,v){state.extra[k]=v;persist()}
function htmEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function identityPanel(){var box=el('section',{class:'identity-box',id:'team'});renderIdentity(box,state.team,persist);return box;}

function reportActivityRows(id,required,pending){var a=state.activities[id]||{},answers=a.answers||{},catalog=REPORT_CATALOG[id]||{},keys=required||Object.keys(catalog);if(!keys.length)keys=Object.keys(answers);var rows=keys.map(function(key){var meta=catalog[key]||{prompt:key.replace(/([A-Z])/g,' $1').replace(/[-_]/g,' '),options:[]},saved=answers[key],answer=saved&&saved.answer,result=saved&&saved.result||'Pendiente',answered=answer!=null&&String(answer).trim()!=='';if(!answered)pending.push(id.toUpperCase()+' · falta responder: '+meta.prompt+'.');else if(result==='no coincide')pending.push(id.toUpperCase()+' · respuesta por corregir: '+meta.prompt+'.');return '<tr><th>'+htmEsc(meta.prompt)+'</th><td style="min-width:6em;overflow-wrap:normal">'+htmEsc(answered?answer:'Sin responder')+'</td><td style="min-width:7em;overflow-wrap:normal">'+htmEsc(!answered?'Pendiente':result==='coincide'?'Comprobada':result==='no coincide'?'Incorrecta; requiere corrección':'Respondida; revisión docente')+'</td><td style="min-width:6em;overflow-wrap:normal">'+htmEsc(!answered?'—':attemptsText(saved))+'</td></tr>'}).join('');return '<div class="report-answer-table" role="region" aria-label="Respuestas de la actividad; desplázate horizontalmente en pantallas pequeñas" tabindex="0" style="max-width:100%;overflow-x:auto"><table style="min-width:620px"><thead><tr><th>Pregunta o caso</th><th style="width:24%;min-width:6em;overflow-wrap:normal">Opción elegida</th><th style="width:20%;min-width:7em;overflow-wrap:normal">Resultado</th><th style="min-width:6em;overflow-wrap:normal">Intentos</th></tr></thead><tbody>'+(rows||'<tr><td colspan="4">No hay respuestas registradas.</td></tr>')+'</tbody></table></div>'}
function attemptsText(saved){var n=saved&&saved.attempts;if(!n)return 'Sin dato';return n+(n===1?' intento':' intentos')+(saved.result==='coincide'?(n===1&&saved.firstResult==='coincide'?' · acertó a la primera':' · acertó tras corregir'):'')}
function reportSummary(g){var rs=RETOS.filter(function(r){return r.g===g}),done=rs.filter(function(r){return state.retos[r.id]}).length;return '<h2>Resumen de la guía</h2><p><b>'+done+' de '+rs.length+'</b> retos completados.</p><table><thead><tr><th>Reto</th><th>Estado</th><th>Respuestas registradas</th><th>Acertadas a la primera</th><th>Intentos en total</th></tr></thead><tbody>'+rs.map(function(r){var a=state.activities[r.id]||{},ans=Object.keys(a.answers||{}).map(function(k){return a.answers[k]}),first=ans.filter(function(x){return x.firstResult==='coincide'&&x.attempts===1}).length,tries=ans.reduce(function(n,x){return n+(x.attempts||0)},0);var mh=a.matchHistory;if(r.id==='g1a'&&mh){var ms=Object.keys(mh).map(function(k){return mh[k]});return '<tr><td>'+htmEsc(r.id.toUpperCase()+' · '+r.t)+'</td><td>'+(state.retos[r.id]?'Completado':'Pendiente')+'</td><td>'+ms.filter(function(x){return x.solved}).length+' de 3 cadenas</td><td>—</td><td>—</td></tr>'}return '<tr><td>'+htmEsc(r.id.toUpperCase()+' · '+r.t)+'</td><td>'+(state.retos[r.id]?'Completado':'Pendiente')+'</td><td>'+ans.length+'</td><td>'+(ans.length?first+' de '+ans.length:'—')+'</td><td>'+(tries||'—')+'</td></tr>'}).join('')+'</tbody></table>'}
function reportDataRows(value){if(value==null||value==='')return '<tr><td colspan="2">Sin dato</td></tr>';var labels={mode:'Versión',intervalMs:'Intervalo (ms)',buttonPress:'Resultado de la pulsación',readings:'Lecturas',attended:'Pulsaciones atendidas',lost:'Pulsaciones perdidas',pwmValue:'Valor PWM',prediction:'Predicción',obtainedVoltage:'Voltaje calculado (V)',source:'Origen de la evidencia',inputs:'Entradas',output:'Salida',recordedAt:'Fecha de registro',heat:'Sensor de calor activo',schedule:'Horario activo',cancel:'Anulación activa',value:'Valor PWM actual',duty:'Ciclo útil (%)',averageVoltage:'Voltaje promedio (V)'};var rows='';function flat(obj,prefix){if(obj==null)return;if(Array.isArray(obj)){obj.forEach(function(v,i){flat(v,prefix+' '+(i+1))});return}if(typeof obj==='object'){Object.keys(obj).forEach(function(k){flat(obj[k],prefix?prefix+' · '+(labels[k]||k):labels[k]||k)});return}var v=typeof obj==='boolean'?(obj?'Sí':'No'):String(obj);rows+='<tr><th>'+htmEsc(prefix||'Dato')+'</th><td>'+htmEsc(v)+'</td></tr>'}flat(value,'');return '<table><tbody>'+rows+'</tbody></table>'}
function activityTrials(id){var a=state.activities[id]||{},trials=a.trials||[];if(!trials.length)return '<p>No se han registrado pruebas de simulación.</p>';return '<h3>Pruebas y resultados</h3>'+trials.map(function(x,i){return '<h4>Prueba '+(i+1)+'</h4>'+reportDataRows(x)}).join('')}
function requiredNotes(g,pending){return NB.filter(function(x){return x.g===g}).map(function(x){return x.f.map(function(f){var key=x.g+f[0],value=state.nb[key]||'';if(!String(value).trim())pending.push('Falta completar «'+f[1]+'».');return '<tr><th>'+htmEsc(f[1])+'</th><td>'+htmEsc(value||'Pendiente')+'</td></tr>'}).join('')}).join('')}
function reportHtmlGuide1(){var pending=[],a=state.activities.g1a||{},ev=a.evidence||{},matches=a.matches||{};if(!state.team||!String(state.team.curso||'').trim())pending.push('Falta completar el curso.');if(!state.team||!identityNames(state.team).length)pending.push('Falta completar los integrantes.');var fields=[['Problema del proyecto',ev.projectProblem],['Magnitud que debe medir',ev.projectMagnitude],['Sensor elegido',ev.projectSensor],['Rango, unidad y fuente',ev.projectRange],['Conclusión',ev.conclusion]];var fieldRows=fields.map(function(x){if(!String(x[1]||'').trim())pending.push('G1a · falta «'+x[0]+'».');return '<tr><th>'+htmEsc(x[0])+'</th><td>'+htmEsc(x[1]||'Pendiente')+'</td></tr>'}).join('');var sensors=[['luz','Luz'],['temp','Temperatura'],['dist','Distancia o nivel']];var matchRows=sensors.map(function(x){var m=a.matchHistory&&a.matchHistory[x[0]],ok=!!(a.done&&a.done[x[0]]&&m&&m.status==='Coincide');if(!ok)pending.push('G1a · falta completar una cadena correcta para '+x[1]+'.');return '<tr><th>'+x[1]+'</th><td>'+htmEsc(m&&m.problem||'Sin elegir')+'</td><td>'+htmEsc(m&&m.magnitude||'Sin elegir')+'</td><td>'+htmEsc(m&&m.sensor||'Sin elegir')+'</td><td>'+htmEsc(m&&m.status||'Pendiente')+'</td></tr>'}).join('');var obs=ev.observations||[],trialRows=obs.map(function(x,i){if(!String(x.observation||'').trim())pending.push('G1a · falta la observación '+(i+1)+' ('+(x.sensor||'sensor sin identificar')+').');return '<tr><td>'+htmEsc(x.sensor||'Sin identificar')+'</td><td>'+htmEsc(x.condition||'Sin especificar')+'</td><td>'+htmEsc(x.observation||'Pendiente')+'</td><td>'+htmEsc(x.source||'Observación declarada; no es una medición real de hardware')+'</td></tr>'}).join('');if(obs.length<6)pending.push('G1a · faltan observaciones declaradas: '+obs.length+' de 6.');var classification=reportActivityRows('g1b',['item0','item1','item2','item3','item4','item5'],pending),quiz=reportActivityRows('g1c',['q0','q1','q2','q3'],pending);var rows=pending.length?'<ul>'+pending.map(function(x){return '<li>'+htmEsc(x)+'</li>'}).join('')+'</ul>':'<p>Sin pendientes registrados.</p>';return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe Circuitos 1 · Guía 1</title>'+reportStyles()+'</head><body><main class="page"><div class="actions"><button onclick="window.print()">Imprimir / guardar PDF</button></div><p>Instituto Técnico Veintiséis de Marzo · Circuitos 1 · Décimo · Periodo 4</p><h1>Informe de la Guía 1: Sensores</h1>'+reportIdentity()+reportSummary(1)+'<h2>G1a · Sensores para el proyecto</h2><h3>Datos del proyecto</h3><table><tbody>'+fieldRows+'</tbody></table><h3>Cadenas de selección</h3><table><thead><tr><th>Magnitud</th><th>Problema elegido</th><th>Magnitud elegida</th><th>Sensor elegido</th><th>Resultado</th></tr></thead><tbody>'+matchRows+'</tbody></table><h3>Observaciones declaradas</h3><p>Estas observaciones son declaradas por el estudiante; no se presentan como mediciones reales de hardware.</p><table><thead><tr><th>Sensor</th><th>Condición</th><th>Observación</th><th>Origen</th></tr></thead><tbody>'+(trialRows||'<tr><td colspan="4">Sin observaciones registradas.</td></tr>')+'</tbody></table><h2>G1b · Clasificación de lecturas</h2>'+classification+activityTrials('g1b')+'<h2>G1c · Quiz de sensores</h2>'+quiz+'<h2>Pendientes</h2><div class="pending">'+rows+'</div></main></body></html>'}
function reportStyles(){return '<style>body{font:16px/1.5 system-ui,sans-serif;color:#17243b;margin:0}.page{max-width:900px;margin:24px auto;padding:32px}h1,h2{line-height:1.2}table{width:100%;border-collapse:collapse;margin:12px 0 24px}th,td{border:1px solid #9aa8b8;padding:8px;text-align:left;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}th{background:#eef3f8}.actions{display:flex;gap:10px;margin:0 0 24px}.pending{background:#fff4d6;padding:10px 16px}.meta{color:#526276}button{padding:10px 16px;min-height:44px;border:0;border-radius:8px;background:#174a83;color:white;font:inherit;cursor:pointer}@page{size:A4;margin:16mm}@media print{.report-answer-table{overflow:visible!important}.report-answer-table table{min-width:0!important}.page{margin:0;padding:0;max-width:none}.actions{display:none}thead{display:table-header-group}tr{break-inside:avoid}}</style>'}
function reportIdentity(){return identityReport(state.team,htmEsc)+'<p><b>Generado:</b> '+htmEsc(new Date().toLocaleString('es-CO'))+'</p>'}

function reportHtmlOther(g){var names={2:'Temporización real y control graduado',3:'Interrupciones y lógica de control real',4:'Proyecto integrador: Estación Escolar Inteligente'},activities=RETOS.filter(function(r){return r.g===g}),pending=[],parts='';if(!state.team||!String(state.team.curso||'').trim())pending.push('Falta completar el curso.');if(!state.team||!identityNames(state.team).length)pending.push('Falta completar los integrantes.');activities.forEach(function(r){var a=state.activities[r.id]||{},required={g2a:['q0','q1'],g2b:['pwm-51','pwm-153','pwm-204'],g3a:['moment0','moment1','moment2','moment3','q0'],g3b:['q0','q1','q2','q3'],g4a:['item0','item1','item2','item3','item4','piece-0','piece-1','piece-2','piece-3','piece-4'],g4b:['lesson0','lesson1','lesson2']}[r.id]||[],body='<p>'+htmEsc(a.prompt||'Respuestas capturadas dentro de la actividad.')+'</p><p><b>Estado actual:</b> '+(state.retos[r.id]?'Completada':'Pendiente o requiere corrección')+'</p>';if(!state.retos[r.id])pending.push(r.id.toUpperCase()+' · '+r.t+' pendiente o con evidencia incorrecta.');if(r.id==='g2a'){var sim=a.sim||{},tried=sim.tried||{};if(!tried.delay)pending.push('G2a · falta probar la versión con delay().');if(!tried.millis)pending.push('G2a · falta probar la versión con millis().')}if(r.id==='g3a'&&!(a.trials&&a.trials.length))pending.push('G3a · falta registrar pruebas de entradas y salida de la simulación.');body+=reportActivityRows(r.id,required,pending)+activityTrials(r.id);parts+='<section><h2>'+htmEsc(r.id.toUpperCase()+' · '+r.t)+'</h2>'+body+'</section>'});var notes=requiredNotes(g,pending),extra='';if(g===4){var calc=state.extra.calc||[],total=0,known=0;extra+='<h2>Evaluación del montaje por pieza</h2><table><thead><tr><th>Pieza</th><th>Evaluación</th><th>Aporte</th></tr></thead><tbody>'+PIEZAS.map(function(label,i){var v=calc[i],val=v==='si'?100:v==='parc'?50:v==='no'?0:null;if(val===null)pending.push('Evaluación del montaje · falta clasificar «'+label+'».');else{total+=val;known++}return '<tr><th>'+htmEsc(label)+'</th><td>'+htmEsc(v==='si'?'Sí':v==='parc'?'Parcialmente':v==='no'?'No':'Sin marcar')+'</td><td>'+ (val===null?'Pendiente':val+' %')+'</td></tr>'}).join('')+'</tbody></table><p><b>Promedio:</b> '+(known===PIEZAS.length?Math.round(total/PIEZAS.length)+' %':'Pendiente; '+known+' de '+PIEZAS.length+' piezas clasificadas')+'</p>';
 var cmp=state.extra.cmp||{},tol=parseFloat(String(cmp.tol==null?'5':cmp.tol).replace(',','.'));if(!Number.isFinite(tol))tol=5;var stages=['Sensor (Guía 1)','Salida PWM (Guía 2)','Botón de anulación (Guía 3)'];extra+='<h2>Comparación calculado / Monitor Serial / multímetro</h2><p>Tolerancia usada: '+htmEsc(cmp.tol==null?'5':cmp.tol)+' %; las mediciones se expresan en voltios (V).</p><table><thead><tr><th>Etapa</th><th>Calculado (V)</th><th>Monitor Serial (V)</th><th>Multímetro (V)</th><th>Diferencia y estado</th></tr></thead><tbody>'+stages.map(function(stage,i){var keys=['calc','ser','med'].map(function(x){return i+x}),vals=keys.map(function(k){var v=parseFloat(String(cmp[k]||'').replace(',','.'));return Number.isFinite(v)?v:null}),base=vals[0],differences=[vals[1],vals[2]].map(function(v,j){if(base===null||v===null)return 'Sin comparar';var d=base===0?Math.abs(v-base):Math.abs(v-base)/Math.abs(base)*100,units=base===0?' V (diferencia absoluta)':' %';return 'Δ '+(j===0?'Serial':'multímetro')+': '+d.toFixed(2)+units+(base===0?'':(d>tol?' · supera tolerancia':' · dentro de tolerancia'))});keys.forEach(function(k,j){if(vals[j]===null)pending.push(stage+' · falta '+['calculado','Monitor Serial','multímetro'][j]+' (V).')});function valCell(k,j){return vals[j]===null?'Pendiente':htmEsc(String(cmp[k]))+' V'+((cmp.exampleFields&&cmp.exampleFields[k])||(!cmp.exampleFields&&cmp.example)?' (ejemplo)':'')}return '<tr><th>'+htmEsc(stage)+'</th><td>'+valCell(keys[0],0)+'</td><td>'+valCell(keys[1],1)+'</td><td>'+valCell(keys[2],2)+'</td><td>'+differences.map(htmEsc).join('<br>')+'</td></tr>'}).join('')+'</tbody></table>';
 var checklist=['Montaje final integrado con las cinco piezas','Tabla calculado, simulado y medido','Respuestas escritas de la Fase 3','Evidencia de los tres puntos de la presentación'],sec=state.extra.sec||[];extra+='<h2>Checklist de la memoria técnica</h2><table><thead><tr><th>Sección</th><th>Estado</th></tr></thead><tbody>'+checklist.map(function(label,i){if(!sec[i])pending.push('Memoria técnica · falta «'+label+'».');return '<tr><th>'+htmEsc(label)+'</th><td>'+(sec[i]?'Lista':'Pendiente')+'</td></tr>'}).join('')+'</tbody></table>'}
 var ps=pending.length?'<ul>'+pending.map(function(x){return '<li>'+htmEsc(x)+'</li>'}).join('')+'</ul>':'<p>Sin pendientes registrados.</p>';return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe Circuitos 1 · Guía '+g+'</title>'+reportStyles()+'</head><body><main class="page"><div class="actions"><button onclick="window.print()">Imprimir / guardar PDF</button></div><p>Instituto Técnico Veintiséis de Marzo · Circuitos 1 · Décimo · Periodo 4</p><h1>Informe de la Guía '+g+': '+htmEsc(names[g])+'</h1>'+reportIdentity()+reportSummary(g)+parts+(g===4?extra:'')+'<h2>Respuestas y justificaciones de la guía</h2><table><tbody>'+notes+'</tbody></table><h2>Pendientes</h2><div class="pending">'+ps+'</div></main></body></html>'}
var integratedReportReturn=null;
function closeIntegratedReport(){var view=$('#integratedReportView'),saved=integratedReportReturn;if(!view)return;window.removeEventListener('afterprint',closeIntegratedReport);view.remove();document.body.classList.remove('integrated-report-open');integratedReportReturn=null;if(saved){window.scrollTo({left:0,top:saved.scrollY,behavior:'instant'});if(saved.focus&&document.contains(saved.focus))saved.focus.focus({preventScroll:true})}}
function showIntegratedReport(html,download,status){var parsed=new DOMParser().parseFromString(html,'text/html'),source=parsed.querySelector('main.page')||parsed.querySelector('main')||parsed.body;if(!source)return false;var old=$('#integratedReportView');if(old)closeIntegratedReport();if(!$('#integratedReportStyles')){var style=el('style',{id:'integratedReportStyles',text:'#integratedReportView{position:fixed;inset:0;z-index:10000;overflow:auto;background:#eef2f7;padding:12px 16px 32px;color:#17243b}#integratedReportView .report-toolbar{position:sticky;top:0;z-index:1;display:flex;flex-wrap:wrap;gap:8px;align-items:center;max-width:920px;margin:0 auto 14px;padding:10px;background:#fff;border:1px solid #cbd5e1;border-radius:12px;box-shadow:0 2px 8px #17243b22}#integratedReportView .report-toolbar button{min-height:44px;padding:8px 14px;border:2px solid #17243b;border-radius:9px;background:#fff;color:#17243b;font:700 15px system-ui,sans-serif;cursor:pointer}#integratedReportView .report-toolbar button:first-child{background:#3b6bb5;color:#fff}#integratedReportView .report-toolbar button:focus-visible{outline:3px solid #175ac1;outline-offset:3px}#integratedReportView .report-view-status{margin-left:auto;font:14px system-ui,sans-serif}#integratedReportView .page{box-sizing:border-box;max-width:920px;margin:0 auto;padding:28px;background:#fff;color:#17243b;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 2px 12px #17243b22}#integratedReportView .page h1,#integratedReportView .page h2,#integratedReportView .page h3{line-height:1.25;break-after:avoid}#integratedReportView .page p{overflow-wrap:anywhere}#integratedReportView .page table{width:100%;border-collapse:collapse;margin:12px 0 22px}#integratedReportView .page th,#integratedReportView .page td{border:1px solid #9ba8ba;padding:7px 9px;text-align:left;vertical-align:top;overflow-wrap:anywhere;white-space:pre-wrap}#integratedReportView .page th{background:#edf2f8}#integratedReportView .page .pending{background:#fff4d6;padding:10px 16px}#integratedReportView .page .static-circuit{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin:8px 0;padding:9px;border:1px solid #9ba8ba}#integratedReportView .page .static-circuit strong{padding:5px;border:1px solid #59677b;background:#edf2f8}#integratedReportView .page .static-scene{border:1px solid #9ba8ba;padding:10px;background:#f5f8fc}#integratedReportView .page svg{display:block;max-width:100%;height:auto;margin:8px 0}#integratedReportView .page pre{white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:620px){#integratedReportView{padding:8px}#integratedReportView .page{padding:16px}#integratedReportView .report-view-status{flex-basis:100%;margin-left:0}}@page{size:A4;margin:16mm}@media print{.report-answer-table{overflow:visible!important}.report-answer-table table{min-width:0!important}html,body{margin:0!important;padding:0!important;background:#fff!important}body.integrated-report-open>:not(#integratedReportView){display:none!important}#integratedReportView{display:block!important;position:static!important;inset:auto!important;overflow:visible!important;padding:0!important;background:#fff!important;color:#000!important}#integratedReportView .report-toolbar{display:none!important}#integratedReportView .page{max-width:none!important;margin:0!important;padding:0!important;box-shadow:none!important;border:0!important;color:#000!important}#integratedReportView .page table{break-inside:auto}#integratedReportView .page tr,#integratedReportView .page svg,#integratedReportView .page .static-scene,#integratedReportView .page .static-circuit{break-inside:avoid}#integratedReportView .page th{print-color-adjust:exact;-webkit-print-color-adjust:exact}}'});document.head.appendChild(style)}var view=el('section',{id:'integratedReportView',tabindex:'-1',role:'region','aria-label':'Informe de la guía'}),toolbar=el('div',{class:'report-toolbar'}),printButton=el('button',{type:'button',text:'Imprimir / guardar PDF'}),downloadButton=el('button',{type:'button',text:'Descargar HTML'}),backButton=el('button',{type:'button',text:(location.hash==='#cuaderno'?'Volver a Mis reportes':'Volver a la guía')}),live=el('span',{class:'report-view-status',role:'status','aria-live':'polite'}),content=source.cloneNode(true);content.querySelectorAll('script,.actions').forEach(function(x){x.remove()});integratedReportReturn={scrollY:window.scrollY,focus:document.activeElement};printButton.addEventListener('click',function(){window.print()});downloadButton.addEventListener('click',function(){download();live.textContent='Descarga del informe HTML solicitada.'});backButton.addEventListener('click',closeIntegratedReport);view.addEventListener('keydown',function(e){if(e.key==='Escape')closeIntegratedReport()});toolbar.appendChild(printButton);toolbar.appendChild(downloadButton);toolbar.appendChild(backButton);toolbar.appendChild(live);view.appendChild(toolbar);view.appendChild(content);document.body.appendChild(view);document.body.classList.add('integrated-report-open');live.textContent=status||'Informe listo.';window.addEventListener('afterprint',closeIntegratedReport);window.scrollTo({left:0,top:0,behavior:'instant'});view.focus();return true}
function deliverGuide1(open){
 persist();var html=reportHtmlGuide1(),status=$('#g1ReportStatus');
 if(open){if(showIntegratedReport(html,function(){deliverGuide1(false)},'Informe de la Guía 1. Vuelve a la guía al terminar.'))status.textContent='Informe mostrado en esta página.';else status.textContent='No se pudo preparar la vista del informe.';return}
 var url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),a=el('a',{href:url,download:'Informe_Circuitos_G1_10ELE_equipo.html'});document.body.appendChild(a);a.click();a.remove();status.textContent='Informe HTML descargado.';setTimeout(function(){URL.revokeObjectURL(url)},30000)
}
function deliverGuide(g,open){
 if(g===1)return deliverGuide1(open);
 persist();var html=reportHtmlOther(g),status=$('#g'+g+'ReportStatus');
 if(open){if(showIntegratedReport(html,function(){deliverGuide(g,false)},'Informe de la Guía '+g+'. Vuelve a la guía al terminar.')){if(status)status.textContent='Informe mostrado en esta página.'}else if(status)status.textContent='No se pudo preparar la vista del informe.';return}
 var url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),course=(state.team.curso||'equipo').replace(/[^a-z0-9_-]/gi,'_'),a=el('a',{href:url,download:'Informe_Circuitos_G'+g+'_'+course+'.html'});document.body.appendChild(a);a.click();a.remove();if(status)status.textContent='Informe HTML descargado.';setTimeout(function(){URL.revokeObjectURL(url)},30000)
}

/* ---------- retos y progreso ---------- */
var RETOS=[{id:'g1a',g:1,t:'Sensores para el proyecto'},{id:'g1b',g:1,t:'Clasificación de lecturas'},{id:'g1c',g:1,t:'Quiz de sensores'},{id:'g2a',g:2,t:'delay() y millis()'},{id:'g2b',g:2,t:'PWM y voltaje promedio'},{id:'g3a',g:3,t:'Botón de anulación y control'},{id:'g3b',g:3,t:'Quiz de interrupciones'},{id:'g4a',g:4,t:'Evaluación del montaje'},{id:'g4b',g:4,t:'Lecciones y memoria técnica'}];
TOTAL=RETOS.length;
$('#totalRetos').textContent=TOTAL;
var GN={1:'Guía 1',2:'Guía 2',3:'Guía 3',4:'Guía 4'};
var shownSello={};
function refresh(popGuide){
 var n=0;RETOS.forEach(function(r){if(state.retos[r.id])n++});
 $('#cnt').textContent=n;$('#cntbar').style.width=(n/TOTAL*100)+'%';
 $$('.estado[data-r]').forEach(function(s){var ok=!!state.retos[s.getAttribute('data-r')];s.textContent=ok?'Listo':'Pendiente';s.classList.toggle('ok',ok)});
 [1,2,3,4].forEach(function(g){
  var tot=RETOS.filter(function(r){return r.g===g}).length,d=RETOS.filter(function(r){return r.g===g&&state.retos[r.id]}).length;
  var s=$('#sello'+g);if(!s)return;var done=d===tot;
  s.className='sello'+(done?' done':'')+(done&&popGuide===g?' pop':'');
  s.replaceChildren();
  if(done){s.appendChild(el('span',{},el('b',{text:'Listo'}),GN[g]+' completa'))}
  else{s.appendChild(el('span',{},el('b',{text:d+' de '+tot}),'retos de la '+GN[g].toLowerCase()))}
  s.setAttribute('role','img');s.setAttribute('aria-label',done?GN[g]+' completa':d+' de '+tot+' retos de la '+GN[g].toLowerCase());
 });
}
function complete(id){
 if(state.retos[id])return;state.retos[id]=true;persist();
 var g=RETOS.filter(function(r){return r.id===id})[0].g;
 var tot=RETOS.filter(function(r){return r.g===g}).length,d=RETOS.filter(function(r){return r.g===g&&state.retos[r.id]}).length;
 refresh(d===tot?g:0);
}
function activityRecord(id){var a=state.activities[id];if(!a||typeof a!=='object')a=state.activities[id]={answers:{},trials:[],revision:0};a.answers=a.answers||{};a.trials=a.trials||[];return a}
function recordAnswer(id,key,answer,result){if(!id)return;var a=activityRecord(id),prev=a.answers[key],at=new Date().toISOString();var keep=prev&&prev.result==='coincide'&&result==='no coincide';a.answers[key]=keep?Object.assign({},prev,{attempts:(prev.attempts||1)+1,at:at}):{answer:answer,result:result||'respondido',attempts:((prev&&prev.attempts)||0)+1,firstResult:(prev&&prev.firstResult)||result||'respondido',at:at};a.revision=(a.revision||0)+1;a.validation={status:result==='coincide'?'coincide':result==='no coincide'?'no coincide':'respondido',checkedAt:at,checkedRevision:a.revision};persist();refresh(0)}
function recordTrial(id,trial){var a=activityRecord(id);a.trials.push(Object.assign({recordedAt:new Date().toISOString()},trial));if(a.trials.length>60)a.trials=a.trials.slice(-60);a.revision=(a.revision||0)+1;a.validation={status:'requiere revisión',checkedAt:new Date().toISOString(),checkedRevision:a.revision};persist();refresh(0)}
function reto(id,title,lead,body){
 return el('section',{class:'reto',id:'reto-'+id,'aria-labelledby':'h-'+id},
  el('div',{class:'reto-h'},el('h3',{id:'h-'+id,text:title}),el('span',{class:'estado','data-r':id,text:'Pendiente'})),
  lead?el('p',{class:'lead'},lead):null,body);
}
function tool(title,lead,body){
 return el('section',{class:'reto','aria-label':title},
  el('div',{class:'reto-h'},el('h3',{text:title}),el('span',{class:'estado libre',text:'Práctica libre'})),
  lead?el('p',{class:'lead'},lead):null,body);
}
function glos(items){
 var g=el('div',{class:'glos-g'});
 items.forEach(function(it){g.appendChild(el('details',{},el('summary',{text:it[0]}),el('p',{},it[1])))});
 return el('section',{class:'reto glos','aria-label':'Glosario'},el('div',{class:'reto-h'},el('h3',{text:'Glosario desplegable'}),el('span',{class:'estado libre',text:'Consulta'})),g);
}

/* ---------- quiz con pista y reintento ---------- */
var REPORT_CATALOG={};
function catalogReportItem(id,key,prompt,options){if(!id)return;REPORT_CATALOG[id]=REPORT_CATALOG[id]||{};REPORT_CATALOG[id][key]={prompt:prompt||'Pregunta',options:(options||[]).slice()};}
function makeQuiz(items,done,activityId){
 var root=el('div',{class:'quiz'}),qa=el('div'),fb=el('div',{class:'fb empty',role:'status','aria-live':'polite'});
 var saved=activityId?activityRecord(activityId).answers:{},i=0;if(activityId)items.forEach(function(q,k){catalogReportItem(activityId,'q'+k,q.q,q.opts)});while(i<items.length&&saved['q'+i]&&saved['q'+i].result==='coincide')i++;root.appendChild(qa);root.appendChild(fb);
 function setFb(kind,parts){fb.className='fb '+kind;fb.replaceChildren();add(fb,parts)}
 function show(){
  qa.replaceChildren();setFb('empty',[]);
  if(i>=items.length){qa.appendChild(el('p',{class:'q'},'Terminaste las '+items.length+' preguntas.'));
   qa.appendChild(el('button',{class:'btn',type:'button',onclick:function(){i=0;show()}},'Repetir el quiz'));if(done)done();return}
  var q=items[i];
  qa.appendChild(el('p',{class:'qn'},'Pregunta '+(i+1)+' de '+items.length));
  qa.appendChild(el('p',{class:'q'},q.q));
  var list=el('div',{class:'opts'+(q.two?' two':'')});
  q.opts.forEach(function(t,k){
   var b=el('button',{class:'opt',type:'button'},t);
   if(saved['q'+i]&&saved['q'+i].answer===t)b.classList.add(saved['q'+i].result==='coincide'?'right':'wrong');
   b.addEventListener('click',function(){
    if(activityId)recordAnswer(activityId,'q'+i,t,k===q.a?'coincide':'no coincide');
    if(k===q.a){
     b.classList.add('right');b.appendChild(el('span',{class:'sr',text:' (correcta)'}));
     $$('button',list).forEach(function(x){x.disabled=true});
     setFb('ok',[el('strong',{text:'Correcto. '}),q.why]);
     var last=i+1>=items.length;
     var nx=el('button',{class:'btn pri',type:'button',onclick:function(){i++;show()}},last?'Terminar':'Siguiente pregunta');
     fb.appendChild(el('div',{class:'row'},nx));
     if(last&&done)done();
    }else{
     b.classList.add('wrong');b.disabled=true;b.appendChild(el('span',{class:'sr',text:' (incorrecta)'}));
     setFb('no',[el('strong',{text:'Aún no. '}),'Pista: '+q.hint+' Intenta otra opción.']);
    }
   });
   list.appendChild(b);
  });
  qa.appendChild(list);
 }
 show();return root;
}

/* ---------- lista de juicios (clasificar, decidir, escoger) ---------- */
function judge(items,labels,done,unit,activityId,subId){
 var wrap=el('div'),n=0,saved=activityId?activityRecord(activityId).answers:{};subId=subId||'item';
 var cnt=el('span',{text:'0 de '+items.length}),mt=el('i');
 wrap.appendChild(el('div',{class:'prog'},el('span',{},unit+': '),cnt,el('span',{class:'meter','aria-hidden':'true'},mt)));
 var ul=el('ul',{class:'jl'});wrap.appendChild(ul);
 items.forEach(function(it,itemIndex){
  var labs=it.o||labels,solved=false;
  catalogReportItem(activityId,subId+itemIndex,(it.t||it.tag||'Caso '+(itemIndex+1))+(!it.t&&it.tag&&it.val?' · '+it.val:''),labs);
  var li=el('li',{class:'ji'});
  if(it.tag)li.appendChild(el('span',{class:'tag',text:it.tag}));
  if(it.t)li.appendChild(el('p',{style:'margin:0 0 6px'},it.t));
  if(it.val)li.appendChild(el('div',{class:'val',text:it.val}));
  var bs=el('div',{class:'jbs'+(it.o?' long':'')}),fb=el('p',{class:'jfb',role:'status','aria-live':'polite'});
  labs.forEach(function(l,k){
   var b=el('button',{class:'jb',type:'button'},l);
   var prior=saved[subId+itemIndex];if(prior&&prior.answer===l){b.classList.add(prior.result==='coincide'?'right':'wrong');if(prior.result==='coincide'){solved=true;li.classList.add('done');n++}}
   b.addEventListener('click',function(){
    if(solved)return;
    if(activityId)recordAnswer(activityId,subId+itemIndex,l,k===it.a?'coincide':'no coincide');
    if(k===it.a){solved=true;b.classList.add('right');b.appendChild(el('span',{class:'sr',text:' (correcta)'}));
     $$('button',bs).forEach(function(x){x.disabled=true});li.classList.add('done');
     fb.replaceChildren();add(fb,[el('strong',{text:'Correcto. '}),it.why]);
     n++;cnt.textContent=n+' de '+items.length;mt.style.width=(n/items.length*100)+'%';
     if(n===items.length&&done)done();
    }else{b.classList.add('wrong');b.disabled=true;b.appendChild(el('span',{class:'sr',text:' (incorrecta)'}));
     fb.replaceChildren();add(fb,[el('strong',{text:'Aún no. '}),it.hint]);}
   });
   bs.appendChild(b);
  });
  li.appendChild(bs);li.appendChild(fb);ul.appendChild(li);
 });
 cnt.textContent=n+' de '+items.length;mt.style.width=(n/items.length*100)+'%';
 if(n===items.length&&n>0&&done)done();
 return wrap;
}

/* ---------- hero ---------- */
function mixc(a,b,t){var pa=[1,3,5].map(function(i){return parseInt(a.substr(i,2),16)}),pb=[1,3,5].map(function(i){return parseInt(b.substr(i,2),16)});
 return '#'+pa.map(function(v,i){var x=Math.round(v+(pb[i]-v)*t).toString(16);return x.length<2?'0'+x:x}).join('')}
function initHero(){
 var luz=$('#luz'),umb=$('#umb'),timer=null;
 var MOM=[['Mediodía',95],['Tarde nublada',55],['Atardecer',22],['Noche',3]];
 var mom=$('#moments');
 MOM.forEach(function(m){mom.appendChild(el('button',{class:'btn pill',type:'button','aria-pressed':'false','data-l':m[1],onclick:function(){luz.value=m[1];upd(true)}},m[0]))});
 function upd(now){
  var L=+luz.value,U=+umb.value,lect=Math.round(L*1023/100),on=lect<U;
  $('#luzOut').textContent=L+' %';$('#umbOut').textContent=U;
  $('#nMag').textContent='Luz: '+L+' %';$('#nSen').textContent='LDR: '+lect;
  $('#nReg').textContent=lect+' < '+U;$('#nRegT').textContent=on?'Sí se cumple':'No se cumple';
  $('#nLam').textContent=on?'Encendida':'Apagada';$('#nLamT').textContent=on?'hay poca luz':'hay luz suficiente';
  $('#nodeReg').classList.toggle('on',on);$('#nodeLam').classList.toggle('on',on);
  $('#c3').classList.toggle('hot',on);$('#c4').classList.toggle('hot',on);
  var t=L/100;
  $('#sky').setAttribute('fill',mixc('#17243B','#7FA6DD',clamp(t*1.3,0,1)));
  $('#sun').setAttribute('opacity',clamp((L-18)/40,0,1));
  $('#moon').setAttribute('opacity',clamp((28-L)/20,0,1));
  $('#beam').setAttribute('opacity',(0.15+0.7*t).toFixed(2));
  $('#dark').setAttribute('opacity',((1-t)*(on?0.3:0.62)).toFixed(2));
  $('#bulb').setAttribute('fill',on?'#FFE23B':'#C9D6EA');
  $('#halo1').setAttribute('opacity',on?0.55:0);$('#halo2').setAttribute('opacity',on?0.28:0);
  $$('#moments button').forEach(function(b){b.setAttribute('aria-pressed',String(+b.getAttribute('data-l')===L))});
  var msg=on?'La lámpara está encendida: la lectura del LDR es '+lect+', menor que el umbral '+U+', así que Arduino concluye que hay poca luz.'
   :'La lámpara está apagada: la lectura del LDR es '+lect+', no es menor que el umbral '+U+', así que Arduino concluye que hay luz suficiente.';
  clearTimeout(timer);
  var go=function(){$('#explica').textContent=msg};
  if(now)go();else timer=setTimeout(go,300);
 }
 luz.addEventListener('input',function(){upd(false)});umb.addEventListener('input',function(){upd(false)});
 upd(true);
}

/* ---------- Guía 1 ---------- */
var MAGN={luz:'luz',temp:'temperatura',dist:'distancia o nivel'};
var MAGT={luz:'Luz',temp:'Temperatura',dist:'Distancia o nivel'};
function buildG1a(){
 var P=[
  {t:'Los pasillos de la biblioteca quedan oscuros en las tardes nubladas',m:'luz',k:'lo que cambia es la cantidad de luz que llega'},
  {t:'El cuarto de servidores se calienta y nadie lo nota hasta que falla algo',m:'temp',k:'lo que sube es el calor del cuarto'},
  {t:'El tanque de agua del patio se rebosa sin que nadie lo note',m:'dist',k:'cambia qué tan lleno está, es decir, la distancia hasta la superficie del agua'},
  {t:'En el corredor del laboratorio las lámparas siguen prendidas a pleno día',m:'luz',k:'sobra luz natural y nadie la mide'},
  {t:'La nevera de la tienda escolar sube de temperatura durante la noche',m:'temp',k:'lo que cambia es qué tan fría está la nevera'},
  {t:'El silo de alimento de la granja escolar se vacía sin aviso',m:'dist',k:'baja el nivel y crece la distancia hasta el alimento'}
 ];
 var S={ldr:{n:'LDR',m:'luz',lee:'El LDR forma un divisor de voltaje y Arduino lo lee con `analogRead(A0)`: un número de 0 a 1023.'},
        tmp:{n:'TMP36',m:'temp',lee:'El TMP36 entrega un voltaje; Arduino lo lee con `analogRead(A0)` y lo convierte a grados con la fórmula.'},
        hc:{n:'HC-SR04',m:'dist',lee:'El HC-SR04 envía un pulso por Trig y Arduino mide el eco con `pulseIn()`; con ese tiempo calcula centímetros.'}};
 var activity=state.activities.g1a||(state.activities.g1a={matches:{},evidence:{},done:{}});activity.matches=activity.matches||{};activity.done=activity.done||{};var done=activity.done;
 var sp=el('select',{id:'trP'},el('option',{value:'',text:'Elige un problema'}));
 P.forEach(function(p,i){sp.appendChild(el('option',{value:i,text:p.t}))});
 var sm=el('select',{id:'trM'},el('option',{value:'',text:'Elige la magnitud'}));
 Object.keys(MAGT).forEach(function(k){sm.appendChild(el('option',{value:k,text:MAGT[k]}))});
 var ss=el('select',{id:'trS'},el('option',{value:'',text:'Elige un sensor'}));
 Object.keys(S).forEach(function(k){ss.appendChild(el('option',{value:k,text:S[k].n}))});
 var selection=activity.selection||{};sp.value=selection.problem||'';sm.value=selection.magnitude||'';ss.value=selection.sensor||'';
 var nP=el('b',{text:'Sin elegir'}),nM=el('b',{text:'Sin elegir'}),nS=el('b',{text:'Sin elegir'}),nA=el('b',{text:'Sin lectura'});
 var node=function(l,b){return el('div',{class:'node'},el('small',{text:l}),b)};
 var n1=node('Problema',nP),n2=node('Magnitud',nM),n3=node('Sensor',nS),n4=node('Arduino lee',nA);
 var c1=el('div',{class:'conn'}),c2=el('div',{class:'conn'}),c3=el('div',{class:'conn'});
 var chain=el('div',{class:'chain'},n1,c1,n2,c2,n3,c3,n4);
 var fb=el('div',{class:'fb empty',role:'status','aria-live':'polite'});
 var chips=el('div',{class:'mags'});
 function drawChips(){chips.replaceChildren();chips.appendChild(el('span',{class:'hint',style:'align-self:center'},'Sensores traducidos:'));
  Object.keys(MAGT).forEach(function(k){chips.appendChild(el('span',{class:'chip'+(done[k]?' done':'')},(done[k]?'✓ ':'')+MAGT[k]))})}
 function ev(){
  activity.selection={problem:sp.value,magnitude:sm.value,sensor:ss.value};activity.revision=(activity.revision||0)+1;
  [n1,n2,n3,n4].forEach(function(n){n.classList.remove('bad')});[c1,c2,c3].forEach(function(c){c.classList.remove('bad')});
  var pi=sp.value,mv=sm.value,sv=ss.value;
  if(pi!==''&&mv&&sv){var matched=P[+pi].m===mv&&S[sv].m===mv;activity.matches['Selección actual']={problem:P[+pi].t,magnitude:MAGT[mv],sensor:S[sv].n,status:matched?'Coincide':'No coincide'};activity.matchHistory=activity.matchHistory||{};var prevM=activity.matchHistory[mv];activity.matchHistory[mv]={problem:P[+pi].t,magnitude:MAGT[mv],sensor:S[sv].n,status:matched?'Coincide':'No coincide',attempts:((prevM&&prevM.attempts)||0)+1,solved:!!(matched||(prevM&&prevM.solved))};if(!matched&&prevM&&prevM.solved){activity.matchHistory[mv].problem=prevM.problem;activity.matchHistory[mv].sensor=prevM.sensor;activity.matchHistory[mv].status='Coincide'}if(matched)done[mv]=true;activity.checked=!!(done.luz&&done.temp&&done.dist);activity.checkedRevision=activity.revision;drawChips()}
  else{delete activity.matches['Selección actual']}
  persist();
  nP.textContent=pi===''?'Sin elegir':P[+pi].t;nM.textContent=mv?MAGT[mv]:'Sin elegir';nS.textContent=sv?S[sv].n:'Sin elegir';nA.textContent='Sin lectura';
  if(pi===''||!mv||!sv){fb.className='fb tip';fb.replaceChildren();add(fb,'Elige el problema, la magnitud y el sensor para ver si la cadena funciona.');return}
  var p=P[+pi],l1=p.m===mv,l2=S[sv].m===mv;
  if(l1&&l2){
   fb.className='fb ok';fb.replaceChildren();add(fb,[el('strong',{text:'La cadena funciona. '}),S[sv].lee]);
   nA.textContent=sv==='ldr'?'0 a 1023':sv==='tmp'?'grados Celsius':'centímetros';
   if(done.luz&&done.temp&&done.dist){activity.checked=true;activity.checkedRevision=activity.revision;persist();complete('g1a')}
  }else{
   drawChips();persist();
   var msg=[];
   if(!l1){msg.push('El eslabón problema a magnitud se rompe: en este problema '+p.k+', y eso no es '+MAGN[mv]+'. Vuelve a leerlo.');c1.classList.add('bad');n2.classList.add('bad')}
   if(!l2){msg.push('El eslabón magnitud a sensor se rompe: el '+S[sv].n+' mide '+MAGN[S[sv].m]+' y la magnitud elegida es '+MAGN[mv]+'.');c2.classList.add('bad');n3.classList.add('bad')}
   c3.classList.add('bad');n4.classList.add('bad');
   fb.className='fb no';fb.replaceChildren();add(fb,[el('strong',{text:'Cadena rota. '}),msg.join(' ')]);
   chain.classList.remove('shake');void chain.offsetWidth;chain.classList.add('shake');
  }
 }
 [sp,sm,ss].forEach(function(s){s.addEventListener('change',ev)});
 drawChips();
 if(done.luz&&done.temp&&done.dist)complete('g1a');
 var grid=el('div',{class:'tr-grid'},
  el('div',{},el('label',{for:'trP',text:'1. Problema'}),sp),
  el('div',{},el('label',{for:'trM',text:'2. Magnitud que debes medir'}),sm),
  el('div',{},el('label',{for:'trS',text:'3. Sensor'}),ss));
 var evidence=activity.evidence||(activity.evidence={}),obs=evidence.observations||(evidence.observations=[]),legacyFields={projectProblem:'1p',projectMagnitude:'1m',projectSensor:'1s',projectRange:'1r'};
 Object.keys(legacyFields).forEach(function(k){if(!evidence[k]&&state.nb[legacyFields[k]])evidence[k]=state.nb[legacyFields[k]]});
 function bindEvidence(key,label,placeholder){var id='g1ev_'+key,ta=el('textarea',{id:id,rows:'2',placeholder:placeholder||''});ta.value=evidence[key]||'';ta.addEventListener('input',function(){evidence[key]=ta.value;if(legacyFields[key])state.nb[legacyFields[key]]=ta.value;activity.revision=(activity.revision||0)+1;persist();refresh(0)});return el('div',{class:'nb-f'},el('label',{for:id,text:label}),ta)}
 var observationBox=el('div',{});
 [['LDR','Más luz'],['LDR','Menos luz'],['TMP36','Temperatura ambiente'],['TMP36','Condición distinta'],['HC-SR04','Objeto cercano'],['HC-SR04','Objeto más lejano']].forEach(function(x,i){var id='g1obs_'+i,ta=el('textarea',{id:id,rows:'2',placeholder:'Describe la lectura y la unidad observada'});ta.value=obs[i]&&obs[i].observation||'';ta.addEventListener('input',function(){obs[i]={sensor:x[0],condition:x[1],observation:ta.value,source:'Observación declarada por el estudiante'};activity.revision=(activity.revision||0)+1;persist();refresh(0)});observationBox.appendChild(el('div',{class:'nb-f'},el('label',{for:id,text:x[0]+' · '+x[1]}),ta))});
 var projectBox=el('div',{},el('h4',{class:'fre',text:'Problema de tu proyecto'}),bindEvidence('projectProblem','¿Qué problema quieres resolver?','Describe la situación concreta.'),bindEvidence('projectMagnitude','¿Qué magnitud debe medir?'),bindEvidence('projectSensor','¿Qué sensor propones y por qué?'),bindEvidence('projectRange','Rango típico del sensor: mínimo, máximo, unidad y fuente.'),el('h4',{class:'fre',text:'Pruebas de sensores'}),el('p',{class:'hint'},'Registra dos condiciones por sensor. Describe lo observado en la simulación o en tu práctica; el informe identifica estas notas como declaraciones del equipo.'),observationBox,bindEvidence('conclusion','Conclusión de la actividad','¿Qué aprendiste sobre elegir y leer sensores?'));
 var body=el('div',{},grid,chain,fb,chips,projectBox);
 return reto('g1a','Traductor de problemas','Traduce cada problema a una magnitud física y elige el sensor que la mide. Si un eslabón no encaja, la cadena se rompe. Logra una cadena completa para cada magnitud.',body);
}
function buildG1b(){
 var items=[
  {tag:'LDR tapado con un objeto',val:'Monitor Serial: 38',a:0,why:'Con poca luz la resistencia del LDR sube y el valor leído baja. Un valor bajo es lo esperado.',hint:'Piensa si tapado significa mucha o poca luz. Con más luz sube el valor.'},
  {tag:'LDR tapado con un objeto',val:'Monitor Serial: 1012',a:1,why:'1012 está casi al máximo, que corresponde a mucha luz. Tapado debería dar un valor bajo.',hint:'Un valor cercano a 1023 significa mucha luz. Compáralo con la condición.'},
  {tag:'TMP36 a temperatura ambiente',val:'Monitor Serial: 25,0 °C',a:0,why:'Está dentro del rango típico del TMP36 (de -40 a 125 °C) y es una temperatura ambiente razonable.',hint:'Compara el valor con el rango típico del sensor y con la condición.'},
  {tag:'TMP36 en el aula',val:'Monitor Serial: 512 °C',a:1,why:'El TMP36 solo llega a unos 125 °C. 512 se parece al valor crudo de `analogRead()` sin convertir a grados.',hint:'Busca el rango máximo del TMP36 en su datasheet.'},
  {tag:'HC-SR04 con un objeto a 40 cm',val:'Monitor Serial: 39,7 cm',a:0,why:'La diferencia es de menos de 1 cm con respecto a lo esperado. Es una lectura razonable.',hint:'Compara el valor mostrado con la distancia real del objeto.'},
  {tag:'HC-SR04 con un objeto a 2 m',val:'Monitor Serial: 650 cm',a:1,why:'2 m son 200 cm, y el HC-SR04 mide hasta unos 400 cm. 650 cm no tiene sentido.',hint:'Convierte 2 m a centímetros y compara con el alcance del sensor.'}
 ];
 return reto('g1b','¿Tiene sentido esta lectura?','Antes de confiar en un número, compáralo con la condición y con el rango típico del sensor. Clasifica cada lectura.',
  judge(items,['Tiene sentido','No tiene sentido'],function(){complete('g1b')},'Lecturas clasificadas','g1b'));
}
function buildG1c(){
 var q=[
  {q:'El LDR cambia su resistencia con la luz, pero Arduino solo lee voltajes. ¿Qué papel cumple el divisor de voltaje?',opts:['Convierte el cambio de resistencia en un cambio de voltaje que `analogRead()` sí puede leer','Protege al LDR para que no se queme con 5 V','Hace que el LDR entregue solo HIGH o LOW','Aumenta la sensibilidad del LDR a la luz'],a:0,hint:'Piensa en qué magnitud eléctrica mide una entrada análoga.',why:'El punto entre el LDR y la resistencia entrega un voltaje que cambia con la luz. Esa es la señal que entra a la entrada análoga.'},
  {q:'En un Arduino Uno, ¿entre qué valores devuelve `analogRead()`?',opts:['0 y 255','0 y 5','0 y 1023','0 y 1000'],a:2,hint:'La entrada análoga convierte de 0 a 5 V en un número de 10 bits.',why:'10 bits dan 1024 valores, de 0 a 1023. Por eso el voltaje se calcula con `lectura * (5.0 / 1023.0)`.'},
  {q:'El TMP36 entrega 0,75 V. Con la fórmula `(voltaje - 0.5) * 100`, ¿qué temperatura es?',opts:['75 °C','25 °C','0,25 °C','250 °C'],a:1,hint:'Primero resta 0,5 V y luego multiplica por 100.',why:'(0,75 - 0,5) × 100 = 25 °C. El TMP36 marca 0,5 V a 0 °C y sube 10 mV por cada grado.'},
  {q:'El eco del HC-SR04 tarda 1166 µs en volver. Con `duracion * 0.0343 / 2.0`, ¿qué distancia hay al objeto?',opts:['40 cm','1166 cm','20 cm','2,3 cm'],a:2,hint:'El sonido hace el viaje de ida y vuelta, por eso se divide entre 2.',why:'1166 × 0,0343 ≈ 40 cm de recorrido total. La mitad, 20 cm, es la distancia al objeto.'}
 ];
 return reto('g1c','Quiz de sensores','Cuatro preguntas. Si fallas, recibes una pista y puedes intentar de nuevo.',makeQuiz(q,function(){complete('g1c')},'g1c'));
}

/* ---------- Guía 2 ---------- */
function buildG2a(){
 var rec=activityRecord('g2a'),sim=rec.sim||(rec.sim={}),mode=sim.mode||'delay',t=0,lect=sim.lect||0,ok=sim.attended||0,lost=sim.lost||0,tried=sim.tried||{delay:false,millis:false},running=true,visible=true,quizShown=!!(rec.answers.q0&&rec.answers.q1&&rec.answers.q0.result==='coincide'&&rec.answers.q1.result==='coincide');
 var INT=el('input',{type:'range',id:'intv',min:'500',max:'4000',step:'500',value:sim.interval||'2000'});
 var intOut=el('output',{for:'intv',text:INT.value+' ms'});
 var track=el('div',{class:'track sleep'},el('i'));
 var status=el('p',{class:'q',style:'margin:8px 0 0'},'Arduino está dentro de `delay()`.');
 var sL=el('b',{text:'0'}),sA=el('b',{text:'0'}),sP=el('b',{text:'0'});
 var stats=el('div',{class:'stats'},el('span',{},'Lecturas: ',sL),el('span',{},'Pulsaciones atendidas: ',sA),el('span',{},'Pulsaciones perdidas: ',sP));
 var fb=el('div',{class:'fb empty',role:'status','aria-live':'polite'});
 var mBtns={};
 function setMode(m){mode=m;t=0;sim.mode=mode;Object.keys(mBtns).forEach(function(k){mBtns[k].setAttribute('aria-pressed',String(k===m))});persist();
  track.className='track'+(m==='delay'?' sleep':'');
  status.replaceChildren();add(status,m==='delay'?'Arduino está dentro de `delay()` y no revisa nada.':'Arduino sigue girando el `loop()` y compara `millis()` en cada vuelta.');
  fb.className='fb empty';tried[m]=tried[m];}
 mBtns.delay=el('button',{class:'btn',type:'button','aria-pressed':'true',onclick:function(){setMode('delay')}},'Versión con delay()');
 mBtns.millis=el('button',{class:'btn',type:'button','aria-pressed':'false',onclick:function(){setMode('millis')}},'Versión con millis()');
 setMode(mode);
 var press=el('button',{class:'btn pri',type:'button',onclick:function(){
  tried[mode]=true;
  if(mode==='delay'){lost++;sP.textContent=lost;fb.className='fb no';fb.replaceChildren();add(fb,[el('strong',{text:'Pulsación perdida. '}),'Arduino estaba dormido dentro de `delay()` y no pudo revisar el botón.'])}
  else{ok++;sA.textContent=ok;fb.className='fb ok';fb.replaceChildren();add(fb,[el('strong',{text:'Pulsación atendida. '}),'El `loop()` no se detuvo, así que vio el botón en la siguiente vuelta.'])}
  sim.mode=mode;sim.interval=INT.value;sim.attended=ok;sim.lost=lost;sim.lect=lect;sim.tried=tried;recordTrial('g2a',{mode:mode,intervalMs:+INT.value,buttonPress:mode==='delay'?'perdida':'atendida',readings:lect,attended:ok,lost:lost,source:'Simulación local'});
  if(tried.delay&&tried.millis&&!quizShown){quizShown=true;qwrap.hidden=false}
 }},'Presionar el botón');
 var qwrap=el('div',{hidden:!quizShown},el('hr',{class:'sep'}),el('p',{class:'lead'},'Ya probaste las dos versiones. Responde:'),
  makeQuiz([
   {q:'Mientras Arduino está dentro de `delay(2000)`, ¿qué pasa con un botón que alguien presiona?',opts:['Se atiende al instante','Casi siempre se pierde, porque el programa no revisa nada durante la espera','Arduino lo guarda y lo atiende después','Arduino se reinicia'],a:1,hint:'Mira el contador de pulsaciones perdidas en la versión con delay().',why:'`delay()` detiene todo el programa. Mientras espera, Arduino no puede revisar botones ni otros sensores.'},
   {q:'En el patrón con `millis()`, ¿qué guarda la variable `ultimaRevision`?',opts:['El valor leído del sensor','El momento en que se revisó el sensor por última vez','El tiempo total que lleva encendido Arduino','La cantidad de lecturas hechas'],a:1,hint:'La condición compara `ahora - ultimaRevision` con el intervalo.',why:'Guarda el momento de la última revisión. Restarlo de `ahora` dice cuánto tiempo ha pasado sin detener el programa.'}
  ],function(){complete('g2a')},'g2a'));
 INT.addEventListener('input',function(){intOut.textContent=INT.value+' ms';t=0;sim.interval=INT.value;persist()});
 sL.textContent=lect;sA.textContent=ok;sP.textContent=lost;
 var STEP=50;
 setInterval(function(){
  if(!running||!visible||document.hidden)return;
  var iv=+INT.value;t+=STEP;
  if(t>=iv){t=0;lect++;sL.textContent=lect}
  track.firstChild.style.width=(t/iv*100)+'%';
 },STEP);
 if('IntersectionObserver' in window){var o=new IntersectionObserver(function(e){visible=e[0].isIntersecting});o.observe(track)}
 var code=el('details',{class:'glos'},el('summary',{text:'Ver el patrón con millis()'}),
  el('pre',{},el('code',{text:'unsigned long ultimaRevision = 0;\nconst unsigned long INTERVALO = 2000;\n\nvoid loop() {\n  unsigned long ahora = millis();\n  if (ahora - ultimaRevision >= INTERVALO) {\n    ultimaRevision = ahora;\n    // aqui va la revision del sensor\n  }\n  // el resto del loop() sigue corriendo\n}'})));
 var body=el('div',{},
  el('div',{class:'row',style:'margin-bottom:12px'},mBtns.delay,mBtns.millis,press),
  el('div',{style:'max-width:420px;margin-bottom:12px'},el('div',{class:'ctrl-h'},el('label',{for:'intv',text:'👆 Mueve el deslizador: intervalo de revisión del sensor'}),intOut),INT),
  el('div',{class:'lane'},el('h4',{text:'Tiempo hasta la próxima lectura'}),track,status,stats),fb,code,qwrap);
 return reto('g2a','Delay contra millis','Presiona el botón en las dos versiones y observa qué pasa mientras Arduino espera. Luego responde dos preguntas.',body);
}
function buildG2b(){
 var rec=activityRecord('g2b'),sim=rec.sim||(rec.sim={}),sl=el('input',{type:'range',id:'pwmv',min:'0',max:'255',value:sim.value||'128'});
 var call=el('output',{for:'pwmv',text:'analogWrite(6, '+sl.value+')'});
 var info=el('p',{class:'q',style:'margin:8px 0'});
 var svg=el('div');svg.innerHTML='<svg id="pwmSvg" viewBox="0 0 320 100" role="img" aria-label="Señal PWM: pulsos de 5 V cuyo ancho cambia con el valor de analogWrite"><path id="pwmPath" fill="none" stroke="#A83A3F" stroke-width="3.5" stroke-linejoin="round"/><line id="pwmAvg" x1="0" x2="320" stroke="#17243B" stroke-width="2" stroke-dasharray="6 5"/><text x="6" y="12" font-size="12" font-weight="700" fill="#17243B" font-family="Atkinson Hyperlegible,sans-serif">5 V</text><text x="6" y="96" font-size="12" font-weight="700" fill="#17243B" font-family="Atkinson Hyperlegible,sans-serif">0 V</text><text id="pwmAvgT" x="314" text-anchor="end" font-size="12" font-weight="700" fill="#17243B" font-family="Atkinson Hyperlegible,sans-serif"></text></svg>';
 var led=el('div',{'aria-hidden':'true',style:'width:44px;height:44px;border-radius:50%;border:3px solid #17243B;background:#FFE23B;flex:none'});
 function upd(){
  var v=+sl.value,d=v/255,V=5*d;
  call.textContent='analogWrite(6, '+v+')';
  info.replaceChildren();add(info,'Ciclo útil: '+fmt(d*100,0)+' %. Voltaje promedio en la carga: '+fmt(V,2)+' V.');
  led.style.opacity=(0.12+0.88*d).toFixed(2);
  var p;
  if(v===0)p='M0 85H320';else if(v===255)p='M0 20H320';
  else{p='M0 85';for(var i=0;i<4;i++){var x0=i*80,x1=x0+d*80;p+=' L'+x0+' 85 L'+x0+' 20 L'+x1.toFixed(1)+' 20 L'+x1.toFixed(1)+' 85 L'+(x0+80)+' 85'}}
  $('#pwmPath',svg).setAttribute('d',p);
  var y=85-65*d;$('#pwmAvg',svg).setAttribute('y1',y);$('#pwmAvg',svg).setAttribute('y2',y);
  var at=$('#pwmAvgT',svg);at.setAttribute('y',y<40?y+16:y-5);at.textContent='promedio '+fmt(V,2)+' V';
 }
 sl.addEventListener('input',function(){sim.value=sl.value;sim.duty=fmt(+sl.value/255*100,1);sim.averageVoltage=fmt(+sl.value/255*5,2);rec.revision=(rec.revision||0)+1;persist();refresh(0);upd()});
 var tests=[[51,1.0],[153,3.0],[204,4.0]],okn=0;tests.forEach(function(tc){catalogReportItem('g2b','pwm-'+tc[0],'analogWrite(6, '+tc[0]+'): voltaje promedio esperado',[])});
 var pred=el('div',{class:'pred'}),pwmDone=function(){if(okn===tests.length)complete('g2b')};
 var pfb=el('p',{class:'hint'},'Voltaje promedio = 5 V × valor / 255. Acepto un error de 0,1 V.');
 tests.forEach(function(tc){
  var key='pwm-'+tc[0],prior=rec.answers[key],inp=el('input',{type:'text',inputmode:'decimal',autocomplete:'off','aria-label':'Voltaje para analogWrite '+tc[0]+', en voltios'});if(prior)inp.value=prior.answer;
  var out=el('p',{class:'jfb',role:'status','aria-live':'polite',style:'margin:0'});if(prior)out.textContent=prior.result==='coincide'?'Respuesta guardada y comprobada.':prior.result==='no coincide'?'Respuesta guardada; puedes corregirla.':'';
  var box=el('div',{class:'pred-i'});var solved=!!(prior&&prior.result==='coincide');if(solved){okn++;inp.disabled=true;box.classList.add('done')}
  var btn=el('button',{class:'btn',type:'button',onclick:function(){
   if(solved)return;var n=num(inp.value);
   if(n===null){out.textContent='Escribe un número, por ejemplo 2,5.';return}
   var right=Math.abs(n-tc[1])<=0.1;recordAnswer('g2b',key,inp.value,right?'coincide':'no coincide');if(right){recordTrial('g2b',{pwmValue:tc[0],prediction:inp.value+' V',obtainedVoltage:fmt(tc[1],2)+' V',source:'Cálculo de la simulación'});solved=true;box.classList.add('done');inp.disabled=true;btn.disabled=true;out.replaceChildren();add(out,[el('strong',{text:'Correcto. '}),'5 × '+tc[0]+' / 255 = '+fmt(tc[1],2)+' V.']);okn++;if(okn===tests.length)complete('g2b')}
   else{out.replaceChildren();add(out,[el('strong',{text:'Aún no. '}),n>tc[1]?'Quedaste por encima. ':'Quedaste por debajo. ','Calcula primero el ciclo útil: '+tc[0]+' / 255.'])}
  }},'Comprobar');
  if(solved)btn.disabled=true;
  box.appendChild(el('div',{},el('p',{style:'margin:0 0 4px;font-weight:700'},'`analogWrite(6, '+tc[0]+')`: ¿cuántos voltios en promedio?'),el('div',{class:'row'},inp,el('span',{},'V'),btn),out));
  pred.appendChild(box);
 });
 pwmDone();
 var body=el('div',{},
  el('div',{class:'sim two'},
   el('div',{},el('div',{class:'ctrl-h'},el('label',{for:'pwmv',text:'👆 Mueve el deslizador: valor de analogWrite (0 a 255)'}),call),sl,info,el('div',{class:'row'},led,el('span',{class:'hint'},'LED en el pin 6 (pin con ~)'))),
   svg),
  el('hr',{class:'sep'}),el('h4',{class:'fre',text:'Predice antes de medir'}),pfb,pred);
 upd();
 return reto('g2b','Controla la potencia con PWM','Mueve el control y observa que el pin sigue entregando solo 0 V o 5 V. Lo que cambia es el porcentaje de tiempo en 5 V. Después predice el voltaje promedio.',body);
}

/* ---------- Guía 3 ---------- */
function buildG3a(){
 var rec=activityRecord('g3a'),sim=rec.sim||(rec.sim={}),c=!!sim.heat,h=!!sim.schedule,a=!!sim.cancel,presses=sim.presses||0;
 var fan=el('div');fan.innerHTML='<svg viewBox="0 0 80 80" width="84" height="84" aria-hidden="true"><g class="fan" id="fanG"><circle cx="40" cy="40" r="34" fill="#fff" stroke="#17243B" stroke-width="3"/><path d="M40 40C40 18 56 14 60 24 54 30 46 34 40 40Z M40 40C62 40 66 56 56 60 50 54 46 46 40 40Z M40 40C40 62 24 66 20 56 26 50 34 46 40 40Z M40 40C18 40 14 24 24 20 30 26 34 34 40 40Z" fill="#3B6BB5" stroke="#17243B" stroke-width="2"/><circle cx="40" cy="40" r="5" fill="#FFE23B" stroke="#17243B" stroke-width="2"/></g></svg>';
 var fanTxt=el('b',{class:'fre',style:'font-size:1.3rem'});
 var cb1=el('input',{type:'checkbox',id:'swC',role:'switch',checked:c}),cb2=el('input',{type:'checkbox',id:'swH',role:'switch',checked:h});
 var pbtn=el('button',{class:'btn pri',type:'button',onclick:function(){a=!a;presses++;sim.cancel=a;sim.presses=presses;upd();recordTrial('g3a',{inputs:{heat:c,schedule:h,cancel:a},output:c&&h&&!a?'ventilador encendido':'ventilador detenido',source:'Simulación local'})}},'Presionar el botón de anulación');
 var aOut=el('p',{class:'hint',style:'margin:6px 0 0'});
 var expr=el('div',{class:'expr'});
 var tbody=el('tbody');
 var table=el('table',{class:'tt'},el('caption',{class:'sr',text:'Tabla de verdad del ventilador'}),el('thead',{},el('tr',{},el('th',{text:'calor'}),el('th',{text:'horario'}),el('th',{text:'anulado'}),el('th',{text:'ventilador'}))),tbody);
 var rows=[];
 for(var i=0;i<8;i++){var rc=!!(i&4),rh=!!(i&2),ra=!!(i&1);var tr=el('tr',{},el('td',{text:rc?'sí':'no'}),el('td',{text:rh?'sí':'no'}),el('td',{text:ra?'sí':'no'}),el('td',{text:(rc&&rh&&!ra)?'gira':'detenido'}));rows.push(tr);tbody.appendChild(tr)}
 var live=el('p',{class:'sr',role:'status','aria-live':'polite'});
 function upd(){
  var on=c&&h&&!a;
  $('#fanG',fan).setAttribute('class','fan'+(on?' on':''));
  fanTxt.textContent=on?'Ventilador girando':'Ventilador detenido';
  expr.replaceChildren();
  var term=function(n,v){return el('span',{class:'t'+(v?' v1':'')},n+' = '+(v?'sí':'no'))};
  add(expr,[term('calor',c),'Y',term('horario',h),'Y',term('no anulado',!a),'=',el('span',{class:'t'+(on?' v1':'')},on?'gira':'detenido')]);
  aOut.textContent='anulado = '+(a?'sí':'no')+'. Presionaste el botón '+presses+(presses===1?' vez.':' veces.')+' Cada pulsación invierte el estado, como la ISR de la guía.';
  rows.forEach(function(r,i){var m=(!!(i&4)===c&&!!(i&2)===h&&!!(i&1)===a);r.classList.toggle('cur',m);if(m)r.setAttribute('aria-current','true');else r.removeAttribute('aria-current')});
  live.textContent=fanTxt.textContent+'.';
 }
 cb1.addEventListener('change',function(){c=cb1.checked;sim.heat=c;upd();recordTrial('g3a',{inputs:{heat:c,schedule:h,cancel:a},output:c&&h&&!a?'ventilador encendido':'ventilador detenido',source:'Simulación local'})});cb2.addEventListener('change',function(){h=cb2.checked;sim.schedule=h;upd();recordTrial('g3a',{inputs:{heat:c,schedule:h,cancel:a},output:c&&h&&!a?'ventilador encendido':'ventilador detenido',source:'Simulación local'})});
 var final=el('div',{hidden:'hidden'});
 var items=[
  {tag:'Momento 1',t:'Hace calor, es horario de oficina y nadie ha presionado el botón.',a:0,why:'Las tres partes de la condición se cumplen.',hint:'Revisa si calor, horario y no anulado son verdaderos a la vez.'},
  {tag:'Momento 2',t:'Mismas condiciones, pero después de presionar el botón.',a:1,why:'`anulado` ahora es verdadero, entonces `!anulado` es falso y la condición completa falla.',hint:'Después de presionar, `anulado` cambia. ¿Qué pasa con `!anulado`?'},
  {tag:'Momento 3',t:'No hace calor, es horario de oficina y nadie ha presionado el botón.',a:1,why:'Falta `calor`, así que la condición no se cumple.',hint:'Con una sola parte falsa, la condición con Y no se cumple.'},
  {tag:'Momento 4',t:'No hace calor, es horario de oficina y se presionó el botón.',a:1,why:'Ya estaba detenido y sigue detenido: anular no cambia nada cuando la condición no se cumplía.',hint:'Hay dos partes falsas. ¿Puede cumplirse la condición?'}
 ];
 var j=judge(items,['Gira','Detenido'],function(){final.hidden=false},'Momentos predichos','g3a','moment');
 final.appendChild(el('hr',{class:'sep'}));
 final.appendChild(makeQuiz([{q:'¿Qué momento demuestra que el botón de anulación gana sobre el sensor?',opts:['Momento 1','Momento 2','Momento 3','Momento 4'],two:true,a:1,hint:'Busca el momento donde las otras condiciones piden girar y aun así el ventilador se detiene.',why:'En el momento 2 el sensor y el horario piden girar, pero la anulación lo detiene.'}],function(){complete('g3a')},'g3a'));
 var left=el('div',{},
  el('div',{class:'row'},fan,fanTxt),
  el('p',{class:'hint',style:'margin:8px 0 0'},'👆 Marca o desmarca cada casilla para cambiar la situación y mira si el ventilador gira.'),
  el('div',{class:'sw',style:'margin-top:8px'},cb1,el('label',{for:'swC',text:'El sensor dice: hace calor'})),
  el('div',{class:'sw'},cb2,el('label',{for:'swH',text:'Horario: es de oficina'})),
  el('div',{style:'margin-top:6px'},pbtn,aOut));
 var body=el('div',{},
  el('div',{class:'sim two'},left,el('div',{},el('p',{style:'margin:0;font-weight:700'},'Condición en el sketch:'),expr,table)),live,
  el('hr',{class:'sep'}),el('h4',{class:'fre',text:'Predice cada momento'}),j,final);
 upd();
 return reto('g3a','Combina sensor, horario y anulación','Un ventilador de un cuarto de servidores gira solo si hace calor, es horario de oficina y nadie lo anuló. Prueba los controles y luego predice cuatro momentos.',body);
}
function buildG3b(){
 var q=[
  {q:'¿Cuál de estas funciones es una ISR bien escrita? La variable `pulsos` es `volatile int`.',opts:['`void contarISR() { delay(500); pulsos++; }`','`void contarISR() { Serial.println(pulsos); }`','`void contarISR() { pulsos++; }`','`void contarISR(int n) { pulsos += n; }`'],a:2,hint:'Una ISR debe ser lo más corta posible, sin `delay()` ni `Serial.println()`. Tampoco recibe parámetros.',why:'Solo suma y termina. Una ISR larga bloquea al resto del programa y rompe el propósito de usar interrupciones.'},
  {q:'¿Por qué una variable compartida con la ISR se declara `volatile`?',opts:['Para que ocupe menos memoria','Para que el compilador no la optimice mal y siempre lea su valor actual','Para que cambie sola cada segundo','Para poder usarla en `Serial.println()`'],a:1,hint:'La ISR cambia la variable sin que el `loop()` lo sepa.',why:'`volatile` avisa al compilador que el valor puede cambiar en cualquier momento, así que no lo optimiza de forma incorrecta.'},
  {q:'En un Arduino Uno, ¿qué pines sirven para `attachInterrupt()`?',opts:['Cualquier pin digital','Los pines 2 y 3','Los pines A0 y A1','Solo los pines con ~'],a:1,hint:'La guía los menciona al declarar `PIN_BOTON`.',why:'En el Uno las interrupciones externas están en los pines 2 y 3. Por eso no puede ser cualquier pin digital.'},
  {q:'El botón se conecta con `INPUT_PULLUP`. ¿Qué modo detecta la pulsación?',opts:['`RISING`','`CHANGE`','`LOW` con `delay()`','`FALLING`'],a:3,hint:'Con `INPUT_PULLUP`, el pin está en HIGH y al presionar pasa a LOW.',why:'Al presionar, la señal pasa de HIGH a LOW. `FALLING` dispara la interrupción justo en ese cambio.'}
 ];
 return reto('g3b','Quiz de interrupciones','Cuatro preguntas sobre ISR, `volatile` y pines. Con pista y reintento.',makeQuiz(q,function(){complete('g3b')},'g3b'));
}

/* ---------- Guía 4 ---------- */
var PIEZAS=['Sensor propio, leído con una función propia (Guía 1)','Revisión del sensor con millis(), sin bloquear el programa (Guía 2)','Salida controlada por PWM con analogWrite() (Guía 2)','Botón de anulación con attachInterrupt() (Guía 3)','Lógica combinada: sensor + horario simulado + anulación (Guía 3)'];
function buildG4a(){
 var items=[
  {tag:'Pieza: revisión con millis()',t:'El sensor se lee en una función `leerTemperatura()` que devuelve grados, pero el sketch espera con `delay(1000)` entre lecturas.',a:2,why:'La función propia cumple la Guía 1, pero `delay()` bloquea el programa: la pieza de `millis()` no está.',hint:'Fíjate si el programa se detiene mientras espera.'},
  {tag:'Pieza: botón con interrupción',t:'El botón se lee con `digitalRead()` dentro del `loop()`, en cada vuelta.',a:2,why:'Eso es polling. La pieza pide `attachInterrupt()` con una ISR corta.',hint:'Compara polling con interrupción.'},
  {tag:'Pieza: salida graduada',t:'Un LED está en el pin 6 y el sketch solo usa `analogWrite(6, 0)` y `analogWrite(6, 255)`.',a:1,why:'Usa el pin PWM y `analogWrite()`, pero nunca muestra niveles intermedios. La salida funciona, el control graduado queda a medias.',hint:'Revisa si hay valores entre 0 y 255.'},
  {tag:'Pieza: lógica combinada',t:'La condición usa el sensor y la anulación, pero el horario simulado no aparece en el `if`.',a:1,why:'Están 2 de las 3 partes. La lógica funciona a medias.',hint:'La pieza pide las tres: sensor, horario y anulación.'},
  {tag:'Pieza: sensor con función propia',t:'La función tiene comentario, devuelve el valor y el Monitor Serial lo muestra cada 2 s usando `millis()`.',a:0,why:'La función propia está completa y además se llama sin bloquear.',hint:'Revisa si la función tiene comentario, retorno y se llama bien.'}
 ];
 var cal=ex('calc',{});
 PIEZAS.forEach(function(label,i){catalogReportItem('g4a','piece-'+i,label,['Sí','Parcialmente','No'])});
 var pcs=el('div',{class:'pcs'}),total=el('b',{class:'fre',style:'font-size:1.4rem'}),tmeter=el('i');
 var bars=[];
 PIEZAS.forEach(function(p,i){
  var bar=el('i'),dbar=el('div',{class:'dbar','aria-hidden':'true'},bar),pct=el('span',{class:'hint'});
  var fs=el('fieldset',{},el('legend',{},p));
  [['si','Sí',100],['parc','Parcialmente',50],['no','No',0]].forEach(function(o){
   var id='cal'+i+o[0],r=el('input',{type:'radio',name:'cal'+i,id:id,value:o[0]});
   if(cal[i]===o[0])r.checked=true;
   r.addEventListener('change',function(){cal[i]=o[0];recordAnswer('g4a','piece-'+i,o[1],'respondido');setEx('calc',cal);calc()});
   fs.appendChild(el('div',{class:'opt-r'},r,el('label',{for:id,text:o[1]})));
  });
  pcs.appendChild(el('div',{class:'pc'},fs,dbar,pct));bars.push([bar,pct]);
 });
 function calc(){
  var s=0,n=0;PIEZAS.forEach(function(p,i){var v=cal[i],val=v==='si'?100:v==='parc'?50:v==='no'?0:null;
   bars[i][0].style.width=(val||0)+'%';bars[i][1].textContent=val===null?'Sin marcar':'Cumplimiento de la pieza: '+val+' %';if(val!==null){s+=val;n++}});
  var t=Math.round(s/PIEZAS.length);total.textContent='Cumplimiento del montaje: '+t+' %';tmeter.style.width=t+'%';
 }
 calc();
 var calcBox=el('div',{},el('h4',{class:'fre',text:'Calculadora de cumplimiento'}),el('p',{class:'hint'},'Marca cómo está cada pieza de tu montaje final. Sí vale 100 %, Parcialmente 50 % y No 0 %.'),pcs,
  el('div',{class:'prog',style:'margin-top:12px'},total,el('span',{class:'meter','aria-hidden':'true'},tmeter)));
 var body=el('div',{},judge(items,['Sí','Parcialmente','No'],function(){complete('g4a')},'Escenarios decididos','g4a'),el('hr',{class:'sep'}),calcBox);
 return reto('g4a','¿Cumple la pieza?','Decide si cada escenario cumple la pieza del montaje: Sí, Parcialmente o No. Abajo puedes calcular el cumplimiento de tu propio montaje.',body);
}
function buildG4b(){
 var L=[
  {tag:'Lección sobre millis()',o:['Aprendí mucho sobre Arduino y fue muy interesante.','Pasar de `delay()` a `millis()` me obligó a guardar el momento de la última lectura. Ahora mi sketch atiende el botón mientras espera.'],a:1,why:'Nombra una técnica, un cambio concreto y su efecto.',hint:'La lección útil dice qué cambió y qué se logró.'},
  {tag:'Lección sobre medición',o:['El valor medido difería 8 % del calculado porque la resistencia real del simulador no era exactamente 220 Ω. Ahora anoto la tolerancia en la memoria.','Tuvimos problemas con el simulador pero los resolvimos.'],a:0,why:'Cuantifica la diferencia, da la causa y dice qué se hará distinto.',hint:'Busca la que tiene datos y una causa.'},
  {tag:'Lección sobre el trabajo en grupo',o:['Debemos trabajar mejor en equipo.','Acordamos con Digitales 1 que la expresión booleana llegara simplificada antes de la Clase 6. Así el sketch no se retrasó.'],a:1,why:'Describe un acuerdo concreto y su resultado.',hint:'Una lección útil se puede repetir mañana. ¿Cuál dice cómo?'}
 ];
 var cmp=ex('cmp',{tol:'5'});
 var ETAPAS=['Sensor (Guía 1)','Salida PWM (Guía 2)','Botón de anulación (Guía 3)'];
 var box=el('div',{class:'cmp'}),outs=[];
 var tol=el('input',{type:'number',id:'tol',min:'0',step:'0.5',value:cmp.tol||'5',style:'max-width:120px'});
 var inputs=[],ref={};
 ETAPAS.forEach(function(e,i){
  var r=el('div',{class:'cmp-r'},el('h4',{text:e}));var gr=el('div',{class:'cmp-in'});
  ['calc','ser','med'].forEach(function(k,j){
   var id='cmp'+i+k,inp=el('input',{type:'text',inputmode:'decimal',autocomplete:'off',id:id,value:cmp[i+k]||''});
   inp.addEventListener('input',function(){cmp[i+k]=inp.value;if(cmp.exampleFields)cmp.exampleFields[i+k]=false;cmp.example=false;setEx('cmp',cmp);calc()});inputs.push([id,inp]);ref[id]=inp;
   gr.appendChild(el('div',{},el('label',{for:id,text:['Calculado','Monitor Serial','Multímetro'][j]}),inp));
  });
  var o1=el('div'),o2=el('div');outs.push([o1,o2]);r.appendChild(gr);r.appendChild(o1);r.appendChild(o2);box.appendChild(r);
 });
 function line(name,base,val,tl,hostEl){
  hostEl.replaceChildren();
  if(base===null||val===null){hostEl.appendChild(el('p',{class:'hint',style:'margin:6px 0 0'},name+': falta un dato.'));return}
  if(base===0){hostEl.appendChild(el('p',{class:'hint',style:'margin:6px 0 0'},name+': el valor calculado es 0, usa la diferencia absoluta: '+fmt(Math.abs(val),3)+'.'));return}
  var d=Math.abs(val-base)/Math.abs(base)*100,bad=d>tl;
  hostEl.appendChild(el('p',{style:'margin:6px 0 0'},name+': diferencia de '+fmt(d,1)+' %. '+(bad?'Supera tu tolerancia de '+fmt(tl,1)+' %: busca la causa.':'Coincide dentro de tu tolerancia de '+fmt(tl,1)+' %.')));
  hostEl.appendChild(el('div',{class:'dbar'+(bad?' bad':''),'aria-hidden':'true'},el('i',{style:'width:'+clamp(d*4,2,100)+'%'})));
 }
 function calc(){
  var tl=num(tol.value);if(tl===null)tl=5;
  ETAPAS.forEach(function(e,i){var c=num(ref['cmp'+i+'calc'].value),s=num(ref['cmp'+i+'ser'].value),m=num(ref['cmp'+i+'med'].value);
   line('Monitor Serial contra calculado',c,s,tl,outs[i][0]);line('Multímetro contra calculado',c,m,tl,outs[i][1])});
 }
 tol.addEventListener('input',function(){cmp.tol=tol.value;setEx('cmp',cmp);calc()});
 var ejemplo=el('button',{class:'btn',type:'button',onclick:function(){
  var v={'0calc':'2.50','0ser':'2.46','0med':'2.52','1calc':'3.00','1ser':'2.94','1med':'3.07','2calc':'5.00','2ser':'5.00','2med':'4.62'};
  cmp.exampleFields={};Object.keys(v).forEach(function(k){cmp[k]=v[k];cmp.exampleFields[k]=true;ref['cmp'+k].value=v[k]});cmp.example=true;setEx('cmp',cmp);calc()}},'Cargar valores de ejemplo');
 var limpiar=el('button',{class:'btn ghost',type:'button',onclick:function(){Object.keys(cmp).forEach(function(k){if(k!=='tol')delete cmp[k]});cmp.example=false;cmp.exampleFields={};inputs.forEach(function(p){p[1].value=''});setEx('cmp',cmp);calc()}},'Limpiar');
 var cmpBox=el('div',{},el('h4',{class:'fre',text:'Comparador calculado, simulado y medido'}),
  el('p',{class:'hint'},'Escribe los tres valores de cada etapa con la misma unidad. Los valores de ejemplo son inventados y no son los de tu proyecto.'),
  el('div',{class:'row',style:'margin:8px 0'},el('label',{for:'tol',text:'Tu tolerancia (%)'}),tol,ejemplo,limpiar),box);
 calc();
 var SEC=['Montaje final integrado con las cinco piezas','Tabla calculado, simulado y medido','Respuestas escritas de la Fase 3','Evidencia de los tres puntos de la presentación'];
 var sec=ex('sec',{}),sbar=el('i'),stxt=el('b',{text:''});
 var sl=el('div');
 SEC.forEach(function(s,i){var id='sec'+i,c=el('input',{type:'checkbox',id:id});c.checked=!!sec[i];
  c.addEventListener('change',function(){sec[i]=c.checked;setEx('sec',sec);sp()});sl.appendChild(el('div',{class:'chk'},c,el('label',{for:id,text:s})))});
 function sp(){var n=SEC.filter(function(s,i){return sec[i]}).length;stxt.textContent=n+' de '+SEC.length+' secciones listas';sbar.style.width=(n/SEC.length*100)+'%'}
 sp();
 var secBox=el('div',{},el('h4',{class:'fre',text:'Secciones de la memoria técnica'}),sl,el('div',{class:'prog'},stxt,el('span',{class:'meter','aria-hidden':'true'},sbar)));
 var body=el('div',{},el('h4',{class:'fre',text:'Lecciones aprendidas: elige la útil'}),judge(L,[],function(){complete('g4b')},'Pares resueltos','g4b','lesson'),el('hr',{class:'sep'}),cmpBox,el('hr',{class:'sep'}),secBox);
 return reto('g4b','Lecciones útiles y memoria técnica','Escoge la lección aprendida que sirve de verdad. Abajo tienes un comparador de valores y la lista de secciones de tu documento final.',body);
}

/* ---------- ensamblar guías ---------- */
function build(){
 var g1=$('#retos1'),g2=$('#retos2'),g3=$('#retos3'),g4=$('#retos4');
 $('#inicio').appendChild(identityPanel());
 g1.append(glos([
  ['LDR (fotorresistencia)','Sensor cuya resistencia baja cuando recibe más luz.'],
  ['TMP36','Sensor de temperatura con 3 pines (VCC, OUT y GND). Su voltaje sube con la temperatura.'],
  ['HC-SR04','Sensor ultrasónico que mide distancia con el tiempo que tarda en volver un eco de sonido.'],
  ['Divisor de voltaje','Dos resistencias en serie. El punto intermedio entrega un voltaje que depende de ambas. Con un LDR convierte luz en voltaje.'],
  ['Entrada análoga','Pin que mide un voltaje de 0 a 5 V y lo entrega como un número de 0 a 1023 con `analogRead()`.'],
  ['Trig y Echo','Los dos pines digitales del HC-SR04: Trig envía el pulso y Echo recibe el eco.'],
  ['Datasheet','Hoja de datos del fabricante. Ahí está el rango típico de funcionamiento del sensor.'],
  ['Función de lectura','Función propia con nombre, comentario y valor de retorno, como `leerLuz()`, que reemplaza la lectura suelta dentro del `loop()`.']
 ]));
 g1.append(buildG1a(),buildG1b(),buildG1c());
 g2.append(glos([
  ['delay()','Detiene todo el programa durante el tiempo indicado. Arduino no revisa nada mientras espera.'],
  ['millis()','Devuelve cuántos milisegundos han pasado desde que arrancó el programa. No detiene nada.'],
  ['INTERVALO','Cada cuántos milisegundos se revisa el sensor. Es una decisión de diseño de tu grupo.'],
  ['PWM','Modulación por ancho de pulso: el pin se enciende y se apaga muy rápido y se controla el porcentaje de tiempo encendido.'],
  ['Ciclo útil (duty cycle)','Porcentaje del tiempo que la señal PWM está en 5 V.'],
  ['analogWrite()','Escribe un valor de 0 (siempre apagado) a 255 (siempre encendido). Solo funciona en pines con ~.']
 ]));
 g2.append(buildG2a(),buildG2b());
 g3.append(glos([
  ['Interrupción externa','Aviso inmediato del microcontrolador cuando un pin cambia, sin que el programa tenga que preguntar todo el tiempo.'],
  ['Polling','Preguntar una y otra vez, en cada vuelta del `loop()`, si algo cambió.'],
  ['ISR','Interrupt Service Routine: la función que atiende la interrupción. Debe ser lo más corta posible.'],
  ['volatile','Palabra que se pone a las variables compartidas con la ISR para que el compilador no las optimice mal.'],
  ['FALLING','Modo que dispara la interrupción cuando la señal pasa de HIGH a LOW.'],
  ['INPUT_PULLUP','Modo de pin con resistencia interna a 5 V. El botón conectado a GND lo lleva a LOW al presionarlo.']
 ]));
 g3.append(buildG3a(),buildG3b());
 g4.append(buildG4a(),buildG4b());
 integrateNotes(2,[['2i','g2a'],['2ms','g2a'],['2pw','g2b']]);
 integrateNotes(3,[['3b','g3a'],['3pi','g3b'],['3ex','g3b']]);
 integrateNotes(4,[['4cs','g4b'],['4df','g4b'],['4tc','g4b']]);
}

/* ---------- cuaderno ---------- */
var NB=[
 {g:1,c:'#3B6BB5',t:'Guía 1: sensores',f:[['p','Problema real de tu grupo, en una frase'],['m','Magnitud que debe medir tu sistema'],['s','Sensor de tu grupo y por qué es el correcto'],['r','Rango típico del sensor (mínimo, máximo, unidad y fuente)']]},
 {g:2,c:'#A83A3F',t:'Guía 2: millis y PWM',f:[['i','INTERVALO que elegiste (ms) y por qué'],['ms','Qué muestras en el Monitor Serial en cada intervalo'],['pw','Tu medición con PWM: ¿el voltaje subió de forma proporcional?']]},
 {g:3,c:'#FFE23B',t:'Guía 3: interrupciones y lógica',f:[['b','Qué hace el botón de anulación en tu sistema'],['pi','Pin de interrupción que usarás y por qué'],['ex','Expresión booleana simplificada que trajiste de Digitales 1']]},
 {g:4,c:'#17243B',t:'Guía 4: integrador',f:[['cs','Resumen calculado, simulado y medido por etapa'],['df','Mayor diferencia y a qué la atribuyes'],['tc','Técnica que cambió tu forma de pensar el código']]}
];
var noteMirrors={};
function integrateNotes(guide,placements){
 var group=NB.filter(function(g){return g.g===guide})[0];if(!group)return;
 var targets={};placements.forEach(function(p){targets[p[0]]=p[1]});
 group.f.forEach(function(f){var key=guide+f[0],activityId=targets[key],host=$('#reto-'+activityId);if(!host)return;var id='activity_note_'+key,ta=el('textarea',{id:id,rows:'2',placeholder:'Registra tu respuesta aquí'});ta.value=state.nb[key]||'';ta.addEventListener('input',function(){state.nb[key]=ta.value;var mirror=noteMirrors[key];if(mirror)mirror.value=ta.value;var a=activityRecord(activityId);a.revision=(a.revision||0)+1;a.validation={status:'respondido, pendiente de revisión',checkedAt:new Date().toISOString(),checkedRevision:a.revision};persist();refresh(0)});host.appendChild(el('div',{class:'panel note-capture',style:'--acc:var(--blue);margin-top:12px'},el('label',{for:id,text:f[1]}),ta))});
}
function autosize(t){t.style.height='auto';t.style.height=Math.max(84,t.scrollHeight+4)+'px'}
function buildNB(){var labels={};RETOS.forEach(function(r){labels[r.id.toUpperCase()]=r.t;labels[r.id[0].toUpperCase()+r.id.slice(1)]=r.t;labels[r.id]=r.t});renderReportOverview($('#reportCards'),[{n:1,title:'Sensores para el proyecto'},{n:2,title:'Temporización y control graduado'},{n:3,title:'Interrupciones y lógica de control'},{n:4,title:'Proyecto integrador'}],function(g){return g===1?reportHtmlGuide1():reportHtmlOther(g)},labels,{view:function(g){deliverGuide(g,true)},print:printCircuitReport,download:function(g){deliverGuide(g,false)}})}


function restoreCircuitBackup(incoming){var keys=['retos','nb','extra','activities','team','historicalRetos'];if(!incoming||incoming.schemaVersion!==2||incoming.subject!=='circuitos-1'||!validIdentity(incoming.team)||keys.some(function(k){return !incoming[k]||typeof incoming[k]!=='object'||Array.isArray(incoming[k])}))throw new Error('El archivo no corresponde a un respaldo válido de Circuitos 1, esquema 2.');rememberR2Backup(JSON.stringify(incoming),'-importado-antes-r2');state=Object.assign({schemaVersion:2,subject:'circuitos-1'},incoming);state.team=normalizeIdentity(state.team,state.nb.grupo,state.nb.curso);if(!persist())throw new Error('No fue posible guardar el respaldo en este navegador.');return true}
function printCircuitReport(g){deliverGuide(g,true);if($('#integratedReportView'))window.print()}
function initFooter(){
 $('#g1Print').addEventListener('click',function(){printCircuitReport(1)});
 $$('[data-report-print]').forEach(function(b){b.addEventListener('click',function(){printCircuitReport(+b.getAttribute('data-report-print'))})});
 $('#g1Ver').addEventListener('click',function(){deliverGuide1(true)});
 $('#g1Html').addEventListener('click',function(){deliverGuide1(false)});
 $$('[data-report-open]').forEach(function(b){b.addEventListener('click',function(){deliverGuide(+b.getAttribute('data-report-open'),true)})});
 $$('[data-report-download]').forEach(function(b){b.addEventListener('click',function(){deliverGuide(+b.getAttribute('data-report-download'),false)})});
 $('#bBackup').addEventListener('click',function(){persist();var url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json;charset=utf-8'})),a=el('a',{href:url,download:'Respaldo_Circuitos_10ELE.json'});document.body.appendChild(a);a.click();a.remove();$('#fEstado').textContent='Respaldo JSON descargado.';setTimeout(function(){URL.revokeObjectURL(url)},30000)});
 var file=$('#backupFile');$('#bRestore').addEventListener('click',function(){file.click()});
 file.addEventListener('change',function(){var f=file.files&&file.files[0];if(!f)return;var reader=new FileReader();reader.onload=function(){try{var incoming=JSON.parse(String(reader.result));restoreCircuitBackup(incoming);$('#fEstado').textContent='Respaldo importado. Actualizando la página…';location.reload()}catch(e){$('#fEstado').textContent=e.message||'No se pudo leer el archivo.'}finally{file.value=''}};reader.onerror=function(){$('#fEstado').textContent='No se pudo leer el archivo.';file.value=''};reader.readAsText(f)});
 $('#bCopia').addEventListener('click',function(){
  CopiaPagina.descargar('circuitos_10ELE_P4_guia_interactiva.html').then(function(){$('#fEstado').textContent='Descarga lista.'},function(e){$('#fEstado').textContent=e.message});
 });
 var arm=false,tm=null,bb=$('#bBorrar');
 bb.addEventListener('click',function(){
  if(!arm){arm=true;bb.textContent='Toca otra vez para confirmar';$('#fEstado').textContent='Se borrarán tu avance de este dispositivo.';tm=setTimeout(function(){arm=false;bb.textContent='Borrar mis datos';$('#fEstado').textContent=''},5000);return}
  clearTimeout(tm);state={schemaVersion:2,subject:'circuitos-1',retos:{},nb:{},extra:{},activities:{},team:{},historicalRetos:{}};persist();location.reload();
 });
}

/* ---------- pestañas ---------- */
var TABS=['inicio','guia1','guia2','guia3','guia4','cuaderno'];
var TABN={inicio:'Inicio',guia1:'Guía 1',guia2:'Guía 2',guia3:'Guía 3',guia4:'Guía 4',cuaderno:'Mis reportes'};
function showTab(id,focus){
 if(TABS.indexOf(id)<0)id='inicio';if(id==='cuaderno')buildNB();
 TABS.forEach(function(t){var s=document.getElementById(t);if(s)s.hidden=(t!==id)});
 $$('.top nav a').forEach(function(a){if(a.getAttribute('href')==='#'+id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 window.scrollTo(0,0);
 document.title=(id==='inicio'?'':TABN[id]+' · ')+'Circuitos 1 · Guía interactiva P4';
 if(focus){var h=$('#'+id+' h1, #'+id+' h2');if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true})}}
}
function initTabs(){
 TABS.forEach(function(id,i){
  var s=document.getElementById(id);if(!s)return;
  var p=i>0?TABS[i-1]:null,n=i<TABS.length-1?TABS[i+1]:null;
  var nav=el('nav',{class:'pager','aria-label':'Cambiar de pestaña'});
  if(p)nav.appendChild(el('a',{class:'btn',href:'#'+p},'← '+TABN[p]));
  if(n)nav.appendChild(el('a',{class:'btn pri',href:'#'+n},TABN[n]+' →'));
  (s.classList.contains('hero')?s:s).appendChild(nav);
 });
 window.addEventListener('hashchange',function(){showTab(location.hash.slice(1),true)});
 showTab(location.hash.slice(1),false);
}

load();
initHero();
build();
buildNB();
initFooter();
initTabs();
refresh(0);
})();

