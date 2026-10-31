'use strict';
const OLD='tecnologia8-p4-guia-interactiva-v1';
const KEY='tecnologia8-p4-guia-interactiva-v2';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let S={schemaVersion:2,subject:'tecnologia8',team:{},done:{},a:{},mx:{},ord:{},chk:{},notes:{},legacyDone:{}};
let storageOK=true;

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
 try{localStorage.setItem(KEY+'-t','1');localStorage.removeItem(KEY+'-t');}catch(e){storageOK=false;}
 try{const r=localStorage.getItem(KEY);if(r){rememberR2Backup(r);const o=JSON.parse(r);if(validBackup(o)){if(!Array.isArray(o.team.integrantes))rememberR2Backup(r);S=Object.assign(S,o);}else throw Error('Estado v2 no válido');}else{const old=localStorage.getItem(OLD);if(old){const o=JSON.parse(old);if(o&&typeof o==='object'){S=Object.assign(S,{schemaVersion:2,subject:'tecnologia8',team:{nombre:o.notes&&o.notes.nombre||'',curso:o.notes&&o.notes.curso||''},a:o.a||{},mx:o.mx||{},ord:o.ord||{},chk:o.chk||{},notes:o.notes||{},done:{},legacyDone:o.done||{}});Object.keys(S.mx).forEach(k=>{if(S.mx[k]&&!S.mx[k].source)S.mx[k].source='origen anterior no verificable';});save();}}}}catch(e){storageOK=false;}
 if(!storageOK)$('#warn').hidden=false;
}
function validBackup(o){if(!o||o.schemaVersion!==2||o.subject!=='tecnologia8')return false;const seen=new Set(['team','a','mx','ord','chk','notes','done','legacyDone']);for(const k of seen)if(!o[k]||typeof o[k]!=='object'||Array.isArray(o[k]))return false;function safe(x,d){if(d>12)return false;if(x===null||['string','number','boolean'].includes(typeof x))return typeof x!=='number'||Number.isFinite(x);if(Array.isArray(x))return x.length<2000&&x.every(v=>safe(v,d+1));if(typeof x!=='object')return false;return Object.keys(x).length<5000&&Object.keys(x).every(k=>!['__proto__','prototype','constructor'].includes(k)&&safe(x[k],d+1))}if(!safe(o,0)||!validIdentity(o.team))return false;for(const id of Object.keys(o.mx)){const m=o.mx[id];if(!m||typeof m!=='object'||!m.s||typeof m.s!=='object'||typeof m.w!=='boolean'||!Number.isInteger(m.pick)||m.pick < -1||m.pick>2)return false;for(const k of Object.keys(m.s))if(!/^\d+_\d+$/.test(k)||!Number.isInteger(m.s[k])||m.s[k]<0||m.s[k]>3)return false;}for(const k of Object.keys(o.notes))if(typeof o.notes[k]!=='string')return false;return true;}
function save(){try{S.schemaVersion=2;S.subject='tecnologia8';localStorage.setItem(KEY,JSON.stringify(S));return true;}catch(e){storageOK=false;$('#warn').hidden=false;return false;}}
load();
S.team=normalizeIdentity(S.team,S.notes.nombre,S.notes.curso);if(storageOK)save();

/* ---------- retos y avance ---------- */
const GUIDES=[{n:1,color:'#3B6BB5',check:'#fff',retos:['r1','r2']},{n:2,color:'#A83A3F',check:'#fff',retos:['r3','r4','r5']},{n:3,color:'#FFE23B',check:'#17243B',retos:['r6','r7','r8']},{n:4,color:'#17243B',check:'#fff',retos:['r9','r10']}];
const TOTAL=GUIDES.reduce((t,g)=>t+g.retos.length,0);
$('#total').textContent=TOTAL;
function updateAll(){
 const n=Object.keys(S.done).filter(k=>S.done[k]).length;
 $('#count').textContent=n;
 $$('[data-badge]').forEach(b=>{const d=!!S.done[b.dataset.badge];b.classList.toggle('done',d);b.textContent=d?'Completado ✓':'Pendiente';});
 GUIDES.forEach(g=>{
  const ok=g.retos.every(r=>S.done[r]),el=$('#sello-'+g.n);
  if(ok&&el.hidden){
   el.innerHTML='<svg viewBox="0 0 80 80" role="img" aria-label="Sello de guía '+g.n+' completa"><circle cx="40" cy="40" r="36" fill="'+g.color+'" stroke="#17243B" stroke-width="3"/><circle cx="40" cy="40" r="28" fill="none" stroke="'+g.check+'" stroke-width="2" stroke-dasharray="3 4" opacity=".7"/><path d="M26 41l10 10 19-22" fill="none" stroke="'+g.check+'" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Guía '+g.n+' completa</span>';
   el.hidden=false;
  }else if(!ok){el.hidden=true;el.innerHTML='';}
  const tl=$('#tabs a[data-tab="guia'+g.n+'"]');if(tl)tl.classList.toggle('done',ok);
 });
}
function markDone(id){if(!S.done[id]){S.done[id]=true;save();updateAll();}}
function clearDone(id){if(S.done[id]){delete S.done[id];save();updateAll();}}
function resetReto(id,answers){Object.keys(answers).forEach(k=>delete answers[k]);delete S.done[id];save();updateAll();}
function shell(id,title,instr){return '<header><h3>'+title+'</h3><span class="badge" data-badge="'+id+'">Pendiente</span></header><p class="instr">'+instr+'</p>';}

/* ---------- datos de materiales ---------- */
const MATS=[
 {k:'metal',n:'Metal',gol:85,hum:45,whyG:'',whyH:'se oxida con el agua y el aire',props:['Resistente y dura, soporta mucho peso.','Se puede doblar y moldear en caliente.','Conduce el calor y la electricidad; se oxida con el agua y el aire.']},
 {k:'ceramica',n:'Cerámica',gol:35,hum:90,whyG:'es frágil ante los golpes',whyH:'',props:['Se fabrica horneando arcilla a altas temperaturas.','Resiste muy bien el peso encima, pero es frágil ante golpes.','No se oxida ni se pudre; buen aislante térmico.']},
 {k:'polimero',n:'Polímero',gol:55,hum:95,whyG:'en esta escala resiste menos golpes que el metal o el compuesto',whyH:'',props:['Liviano y fácil de moldear.','No se oxida ni se pudre con el agua.','Se daña con el calor extremo o con años de sol (rayos UV).']},
 {k:'madera',n:'Madera',gol:55,hum:30,whyG:'en esta escala resiste menos golpes que el metal o el compuesto',whyH:'se puede pudrir con la humedad si no se trata',props:['Material natural y renovable (viene de los árboles).','Liviana y fácil de cortar y trabajar.','Se puede pudrir con la humedad si no se trata.']},
 {k:'vidrio',n:'Vidrio',gol:25,hum:95,whyG:'es frágil ante los golpes',whyH:'',props:['Deja pasar la luz (transparente o translúcido).','Resiste bien el peso, pero es frágil ante los golpes.','El vidrio templado se rompe en pedacitos pequeños, no en fragmentos filosos.']},
 {k:'compuesto',n:'Material compuesto',gol:75,hum:80,whyG:'',whyH:'en esta escala resiste la humedad en un nivel medio',props:['Une dos o más materiales distintos para combinar sus ventajas.','Suele quedar más resistente que cada material por separado.','Ejemplo: el concreto reforzado une concreto y varillas de acero.']}
];
const PLACES=[{n:'Ventana',g:20,h:50},{n:'Piso del pasillo',g:50,h:60},{n:'Viga',g:75,h:25},{n:'Cubierta',g:35,h:90}];

/* ---------- apoyos C05: fichas locales, sin datos de progreso ---------- */
const SUPPORT_CARDS={
 'fam-metal':{n:'Metal',img:'metal',alt:'Fotografía de perfiles de acero en una obra',q:'Material formado por metales, como hierro, aluminio o cobre; sus propiedades dependen de la composición y del tratamiento.',u:'Se usa en vigas, barras, marcos, cubiertas y tuberías. Las barras de acero en el concreto reforzado ayudan a resistir tracción y flexión.',v:'Puede soportar cargas altas, moldearse y unirse con otros elementos. Algunos metales se recuperan y reciclan si se separan correctamente.',l:'El hierro puede corroerse con agua y aire; el metal conduce calor y electricidad. Protegerlo exige mantenimiento y puede aumentar costo.'},
 'fam-ceramica':{n:'Cerámica',img:'ceramica',alt:'Fotografía de una pared de ladrillo',q:'Material fabricado al moldear arcilla u otras materias minerales y calentarlas en un horno hasta endurecerlas.',u:'Ladrillos, tejas y baldosas aprovechan su resistencia al peso, al calor o al desgaste según forma y fabricación.',v:'No se pudre ni se oxida y suele aislar el calor. Una pieza bien elegida puede durar muchos años con poco mantenimiento.',l:'Es frágil ante golpes: puede romperse con poca deformación. Hornearla consume energía y las piezas pesadas requieren transporte y soporte.'},
 'fam-polimero':{n:'Polímero',img:'polimero',alt:'Fotografía de tuberías de polímero',q:'Familia de materiales basada en moléculas largas; incluye plásticos y algunos productos naturales modificados.',u:'Se encuentra en tuberías, canaletas, aislantes, sellos y recubrimientos, donde importan el bajo peso o la resistencia al agua.',v:'Es liviano, fácil de moldear y no se oxida. En una tubería adecuada puede transportar agua con poco mantenimiento.',l:'El calor extremo y la radiación solar pueden degradarlo. Algunos plásticos persisten como residuos; reciclarlos depende del tipo y de la separación.'},
 'fam-madera':{n:'Madera',img:'madera',alt:'Fotografía de troncos de madera',q:'Material natural que se obtiene del tronco y las ramas de los árboles; su estructura contiene fibras orientadas.',u:'Se usa en tablas, marcos, muebles, formaletas y estructuras, con selección y diseño adecuados para la carga y el ambiente.',v:'Es relativamente liviana, se corta con facilidad y puede renovarse si el bosque se maneja responsablemente.',l:'La humedad puede causar hinchamiento, pudrición o ataque de organismos. La tala sin manejo daña ecosistemas; protegerla requiere cuidado.'},
 'fam-vidrio':{n:'Vidrio',img:'vidrio',alt:'Fotografía de una ventana de vidrio',q:'Sólido hecho principalmente de sílice fundida y enfriada sin formar cristales ordenados; puede ser transparente o translúcido.',u:'Ventanas y cerramientos dejan pasar luz. El tipo de vidrio se elige según el riesgo de impacto y la función de seguridad.',v:'Permite iluminar espacios, no se pudre y se limpia con facilidad. Algunos envases y vidrios pueden reciclarse si se clasifican.',l:'El vidrio común es frágil y puede dejar fragmentos peligrosos. No es apropiado para cualquier carga o piso; su fabricación usa mucha energía.'},
 'fam-compuesto':{n:'Material compuesto',img:'compuesto',alt:'Fotografía de malla de acero usada como refuerzo',q:'Material que combina componentes distintos para reunir funciones; una parte puede unir o proteger y otra aportar resistencia.',u:'Concreto reforzado, fibra de vidrio y contrachapado resuelven necesidades diferentes en vigas, paneles y productos.',v:'Al combinar materiales puede mejorar el desempeño para una tarea concreta, como resistir compresión y tracción en una pieza.',l:'No todo compuesto es más fuerte en cualquier condición. Unir componentes distintos puede dificultar reparación, separación y reciclaje.'},
 'obj-viga':{n:'Viga',img:'metal',alt:'Representación fotográfica de perfiles estructurales de acero',q:'Elemento alargado que recibe cargas y las transmite hacia columnas o muros; su forma y material cambian cómo se deforma.',u:'Se usa en techos, puentes y pisos. El diseño debe considerar la distancia entre apoyos y el peso que recibe.',v:'Un perfil metálico bien diseñado puede soportar cargas importantes y cubrir espacios con menos peso que una pieza maciza.',l:'La resistencia no se deduce solo del nombre del material. Uniones, corrosión, pandeo y cargas reales requieren cálculo profesional.'},
 'obj-ladrillo':{n:'Ladrillo',img:'ceramica',alt:'Fotografía de una pared de ladrillo',q:'Pieza de arcilla moldeada y horneada; los huecos y dimensiones varían de acuerdo con su uso.',u:'Se coloca en muros y divisiones. En algunas construcciones ayuda a soportar compresión, pero no reemplaza el diseño estructural.',v:'Es durable, resiste el calor y no se oxida. Su forma facilita ordenar piezas y construir superficies con mortero.',l:'Puede quebrarse con golpes y pesa más que muchos polímeros. Hornearlo consume energía; el mortero dificulta recuperar piezas intactas.'},
 'obj-tuberia':{n:'Tubería de agua',img:'polimero',alt:'Fotografía de tuberías de polímero',q:'Conducto que transporta agua entre puntos de una instalación. Se fabrica en distintos materiales y diámetros.',u:'La tubería polimérica es común en redes domésticas por su bajo peso y porque no se oxida con el agua.',v:'Es fácil de cortar y unir con herramientas apropiadas; un tramo correcto puede resistir humedad sin pudrirse.',l:'Debe soportar presión, temperatura y exposición previstas. Sol y calor pueden dañarla; una fuga o material incorrecto afecta el servicio.'},
 'obj-ventana':{n:'Ventana',img:'vidrio',alt:'Fotografía de una ventana que deja pasar la luz',q:'Abertura con marco y uno o varios paneles que regula entrada de luz, ventilación y vista al exterior.',u:'El vidrio permite ver y alumbrar. El marco, sellos y tipo de acristalamiento también influyen en el desempeño.',v:'Un panel transparente brinda luz y es sencillo de limpiar; un diseño correcto mejora iluminación y ventilación.',l:'El vidrio común puede romperse con impactos y no debe suponerse seguro ante cargas. La ventana también puede perder calor o filtrar agua.'},
 'obj-tronco':{n:'Tronco',img:'madera',alt:'Fotografía de troncos de madera apilados',q:'Parte leñosa del árbol recién cortado, antes de aserrarse o convertirse en tablas y otros productos.',u:'Se transforma en madera para construcción, muebles o papel. Su origen y manejo forestal afectan el impacto ambiental.',v:'Es un recurso renovable cuando el bosque puede regenerarse y se cuida la biodiversidad; la madera tiene poco peso.',l:'Talar más rápido de lo que crece el bosque no es sostenible. El tronco húmedo puede deformarse y requiere secado y selección.'},
 'obj-contrachapado':{n:'Madera contrachapada',img:'madera',alt:'Representación de láminas de madera embebidas en la guía',q:'Tablero hecho con láminas delgadas de madera pegadas; las fibras de capas vecinas suelen cruzarse.',u:'Se usa en muebles, divisiones y formaletas. El tipo de adhesivo y la protección determinan dónde puede instalarse.',v:'Las capas alternadas distribuyen esfuerzos en varias direcciones y ayudan a reducir deformaciones frente a una tabla simple.',l:'La humedad puede deteriorar capas o adhesivo. Cortarlo genera residuos y al final cuesta separar madera y pegante.'},
 'concept-propiedades':{n:'Dureza, fragilidad y cargas',q:'Dureza describe resistencia al rayado; fragilidad, tendencia a romperse con poca deformación; resistencia a cargas, capacidad ante fuerzas.',u:'Estas propiedades ayudan a comparar materiales para pisos, ventanas o elementos que sostienen peso.',v:'Separarlas permite explicar por qué un vidrio puede ser duro y aun así frágil, o por qué un ladrillo soporta peso.',l:'Una propiedad aislada no garantiza que un producto sea adecuado. También importan espesor, forma, uniones, impactos, humedad y uso.'},
 'cer-arcilla':{n:'Cerámica de arcilla',img:'ceramica',alt:'Fotografía de ladrillos de arcilla horneada',q:'La arcilla se moldea y se hornea; el calor transforma la pieza y la deja rígida y estable.',u:'Con ella se fabrican ladrillos para muros, baldosas para pisos y tejas que cubren techos.',v:'Resiste bien el peso encima, el sol y la lluvia; no se oxida y suele conservar su forma durante años.',l:'La pieza puede quebrarse ante golpes y es difícil de reparar sin reemplazarla. La cocción requiere energía y el peso aumenta transporte.'},
 'cer-teja':{n:'Teja de barro',img:'ceramica',alt:'Representación de una teja cerámica a partir de la fotografía de ladrillo',q:'Pieza cerámica con forma curva o acanalada que se coloca en filas para cubrir una cubierta inclinada.',u:'Su geometría dirige el agua hacia el borde y protege la construcción de lluvia y radiación solar.',v:'La cerámica soporta intemperie y la forma ayuda a evacuar agua cuando las piezas se instalan correctamente.',l:'Es pesada y frágil durante transporte o golpes. Requiere pendiente, soporte y traslapo adecuados; no es una cubierta impermeable por sí sola.'},
 'cer-baldosa':{n:'Baldosa cerámica',img:'ceramica',alt:'Representación de una baldosa cerámica a partir de la fotografía de ladrillo',q:'Pieza plana de arcilla y otros minerales cocidos, con superficie esmaltada o sin esmaltar.',u:'Se instala en pisos y paredes, sobre todo donde una superficie lavable ayuda a limpiar.',v:'Es dura, resiste desgaste moderado y facilita retirar manchas. Hay texturas que mejoran el agarre.',l:'Una baldosa lisa puede resbalar mojada y un golpe puede astillarla. Las juntas necesitan limpieza y una base firme evita desprendimientos.'},
 'glass-common':{n:'Vidrio común',img:'vidrio',alt:'Fotografía de una ventana de vidrio común',q:'Vidrio sin tratamiento especial de seguridad, usual en ventanas sencillas y algunos muebles.',u:'Sirve en cerramientos donde se busca luz y vista, con marco que lo mantiene sujeto.',v:'Es transparente, se limpia con facilidad y permite aprovechar luz natural en el día.',l:'Se fractura en fragmentos filosos ante ciertos impactos. No conviene confiarle una baranda, piso o puerta expuesta sin especificar un vidrio de seguridad.'},
 'glass-tempered':{n:'Vidrio templado',img:'vidrio',alt:'Fotografía de vidrio embebida en la guía de la prueba de rotura',q:'Vidrio sometido a calentamiento y enfriamiento controlados que dejan esfuerzos internos de compresión en su superficie.',u:'Se usa en puertas de ducha, divisiones y otros lugares donde se exige un vidrio de seguridad adecuado.',v:'Tolera mejor algunos impactos y cambios térmicos que el vidrio común; al romperse suele formar piezas pequeñas.',l:'El tratamiento no lo vuelve irrompible ni lo convierte en compuesto. Si se rompe, todo el panel puede desintegrarse; sus bordes requieren cuidado.'},
 'glass-laminated':{n:'Vidrio laminado',img:'vidrio',alt:'Fotografía de un vidrio agrietado que conserva fragmentos unidos',q:'Dos o más hojas de vidrio unidas por una película plástica intermedia, que ayuda a retener fragmentos.',u:'Se usa en parabrisas, barandas y cerramientos de seguridad cuando importa que el panel permanezca unido al romperse.',v:'La película mantiene adheridos muchos trozos y reduce la caída de fragmentos; conserva transparencia para ver a través.',l:'Puede agrietarse y requiere seleccionar espesor y soporte adecuados. Su fabricación cuesta más y separar película y vidrio complica reciclaje.'},
 'concept-treatment':{n:'Tratamiento no es compuesto',img:'vidrio',alt:'Fotografía de vidrio; representa un material tratado',q:'Un tratamiento cambia cómo se comporta un material; un compuesto une materiales distintos que conservan funciones identificables.',u:'El templado es vidrio tratado. En concreto reforzado, concreto y acero se combinan; no son la misma clase de cambio.',v:'Distinguir proceso y composición permite explicar con precisión qué se modificó y qué componentes trabajan juntos.',l:'El aspecto exterior puede confundir. Hay que consultar cómo se fabricó y qué piezas lo forman, no adivinar por su apariencia.'},
 'comp-concrete':{n:'Concreto reforzado',img:'compuesto',alt:'Fotografía de una malla metálica usada en concreto reforzado',q:'Compuesto de concreto y barras o mallas de acero, colocadas en posiciones definidas para trabajar en conjunto.',u:'Se emplea en vigas, columnas y losas diseñadas para recibir cargas en edificios y otras estructuras.',v:'El concreto soporta bien compresión y el acero ayuda ante tracción. Juntos pueden responder a distintos esfuerzos.',l:'La disposición del acero y el recubrimiento importan. Corrosión, fisuras y ejecución deficiente requieren evaluación técnica; no es una mezcla que siempre mejore.'},
 'comp-fiberglass':{n:'Fibra de vidrio',img:'compuesto',alt:'Fotografía de una malla de fibras de refuerzo',q:'Compuesto donde fibras de vidrio se alojan en una resina polimérica que forma la matriz.',u:'Se moldea en paneles, cascos, recipientes y piezas ligeras según la resina y el diseño.',v:'Las fibras refuerzan y la matriz las mantiene alineadas y distribuye esfuerzos; la pieza puede resistir corrosión.',l:'El desempeño cambia con dirección de fibras, resina y fabricación. El polvo al cortar irrita y reciclar resina y fibra es complejo.'},
 'comp-plywood':{n:'Contrachapado o triplex',img:'madera',alt:'Representación de capas de madera para un tablero contrachapado',q:'Compuesto de chapas de madera unidas con adhesivo, con la orientación de fibras alternada entre capas.',u:'Se fabrica como tablero para muebles, divisiones, moldes y otros usos de interior o exterior según su clasificación.',v:'Las capas pegadas actúan como panel; alternar fibras reduce la tendencia a abrirse o deformarse en una sola dirección.',l:'No todos los tableros toleran humedad. La calidad del pegante y del sellado importa y las capas dificultan separar materiales.'},
 'concept-matrix':{n:'Matriz en un compuesto',img:'compuesto',alt:'Fotografía de un material de refuerzo compuesto',q:'La matriz es el componente continuo que rodea, sostiene y mantiene colocados los refuerzos en muchos compuestos.',u:'En fibra de vidrio, la resina mantiene las fibras juntas. En otros compuestos, la matriz puede ser cemento o adhesivo.',v:'Distribuye esfuerzos entre piezas y puede protegerlas del ambiente, haciendo posible fabricar una forma útil.',l:'La matriz no cumple todas las funciones: cada producto depende de refuerzo, unión y diseño. Si se degrada, el compuesto pierde desempeño.'},
 'concept-reinforcement':{n:'Refuerzo',img:'compuesto',alt:'Fotografía de una malla metálica usada como refuerzo',q:'Componente que mejora una respuesta específica, por ejemplo resistencia o rigidez, dentro de un material compuesto.',u:'Barras de acero refuerzan concreto; fibras refuerzan resina; sus ubicaciones se eligen para las fuerzas esperadas.',v:'Permite que un componente aporte una propiedad que la matriz por sí sola no ofrece con igual eficacia.',l:'El refuerzo no sirve si se coloca mal o se separa de la matriz. Más refuerzo no garantiza mejor resultado en cada condición.'},
 'concept-adhesive':{n:'Adhesivo',img:'madera',alt:'Representación de láminas de madera unidas en un tablero',q:'Sustancia que une superficies. En un tablero contrachapado mantiene pegadas las chapas para que trabajen juntas.',u:'Se usa en tableros, revestimientos y uniones; el tipo se selecciona según humedad, carga y exposición.',v:'Hace posible que capas delgadas formen una pieza de mayor tamaño y distribuyan esfuerzos.',l:'Agua, calor o envejecimiento pueden debilitar algunas uniones. El adhesivo también complica separar y recuperar las capas al final.'},
 'concept-forces':{n:'Compresión y tracción',img:'compuesto',alt:'Esquema conceptual de fuerzas en materiales compuestos',q:'Compresión aprieta una pieza; tracción la estira. Flexión suele combinar compresión en un lado y tracción en otro.',u:'Estas fuerzas sirven para explicar el trabajo del concreto y el acero dentro de una viga.',v:'El concreto soporta bien compresión; barras de acero pueden ayudar en zonas donde aparecen fuerzas de tracción.',l:'El comportamiento depende de geometría y armado. Es una explicación escolar, no un cálculo para construir o certificar una estructura.'},
 'concept-layers':{n:'Capas alternadas',img:'madera',alt:'Esquema conceptual de capas cruzadas de un tablero',q:'En un contrachapado las chapas se pegan con fibras de una capa en dirección distinta a la vecina.',u:'La orientación cruzada se usa para fabricar paneles que necesitan estabilidad en más de una dirección.',v:'Alternar direcciones ayuda a reducir deformación y rajado a lo largo de una sola veta.',l:'El adhesivo, la humedad y la calidad del panel también influyen. El tablero no queda inmune al agua ni al daño.'},
 'life-extract':{n:'Etapa: extracción',q:'Se obtienen materias primas de bosques, minas, canteras o fuentes recicladas antes de fabricar un producto.',u:'Ejemplos son extraer arena para vidrio, arcilla para ladrillo, mineral para metal o madera de un bosque.',v:'Conocer el origen permite preguntar por restauración, consumo de agua, energía y manejo responsable del recurso.',l:'La extracción puede alterar suelo, hábitats y fuentes de agua. Recuperar materiales usados reduce parte de la necesidad de materia prima nueva.'},
 'life-make':{n:'Etapa: fabricación',q:'Las materias primas se transforman en piezas mediante procesos como triturar, mezclar, hornear, fundir, cortar o ensamblar.',u:'Hornear ladrillos, fundir vidrio y producir concreto ocurren antes de transportar el material a la obra.',v:'La fabricación da forma y propiedades requeridas; mejorar equipos puede reducir energía y desperdicio.',l:'Hornos y máquinas consumen energía y pueden emitir contaminantes. Material reciclado ayuda en algunos procesos, pero no elimina todos los impactos.'},
 'life-transport':{n:'Etapa: transporte',q:'Los materiales viajan desde su origen o fábrica hasta el lugar de uso, a veces en varias etapas.',u:'Distancia, peso, vehículo, cantidad y viajes influyen al mover tejas, madera, vidrio o concreto.',v:'Planear entregas y elegir proveedores cercanos puede evitar recorridos innecesarios y daños durante el traslado.',l:'Transportar materiales pesados o desde lejos suele usar combustible. Un material local no siempre es mejor si se desperdicia o dura poco.'},
 'life-install':{n:'Etapa: instalación',q:'Preparación e instalación incluyen mover, cortar, fijar y unir piezas para que entren en servicio.',u:'En una obra se prepara una base para baldosas, se montan marcos o se colocan tejas con traslapo.',v:'Una instalación correcta evita fallas tempranas, filtraciones y reemplazos; trabajar con medidas reduce sobrantes.',l:'La instalación consume materiales y energía y puede generar recortes. Una colocación deficiente reduce la vida útil aun con buen material.'},
 'life-use':{n:'Etapa: uso y mantenimiento',q:'El producto presta servicio durante años y puede necesitar limpieza, inspección, reparación o protección.',u:'Revisar una cubierta, sellar madera o sustituir un sello prolonga el funcionamiento de partes del edificio.',v:'Un material durable y reparable puede evitar reemplazos y parte del impacto de fabricar uno nuevo.',l:'Mantenimiento también usa agua, pinturas o repuestos. Comparar solo el impacto inicial ignora lo que ocurre durante el uso.'},
 'life-end':{n:'Etapa: fin de vida',q:'Cuando un producto deja de usarse, sus piezas pueden repararse, reutilizarse, reciclarse o terminar como residuo.',u:'Una demolición selectiva separa madera, metal, vidrio, concreto y residuos mezclados antes de disponerlos.',v:'Recuperar piezas útiles reduce escombros y puede ahorrar materias primas en otros productos.',l:'No todo material se recicla en cualquier lugar. Compuestos y adhesivos son difíciles de separar; también hay que verificar seguridad y contaminación.'},
 'eco-renewable':{n:'Recurso renovable',img:'madera',alt:'Fotografía de troncos como recurso que puede regenerarse',q:'Recurso que puede regenerarse en tiempos humanos si el uso no supera su recuperación y se protege el ecosistema.',u:'Madera de bosques manejados puede renovarse; su origen y velocidad de regeneración deben comprobarse.',v:'Puede reemplazar recursos finitos y almacenar carbono durante su vida útil como producto.',l:'Renovable no significa ilimitado ni sin impacto: tala excesiva, pérdida de biodiversidad y transporte pueden volverlo insostenible.'},
 'eco-nonrenewable':{n:'Recurso no renovable',img:'metal',alt:'Fotografía de acero como material proveniente de minerales',q:'Recurso que existe en cantidades limitadas o tarda escalas geológicas en formarse, como muchos minerales.',u:'Hierro, arcilla y arena se extraen para acero, ladrillos y vidrio; reciclar puede reducir material virgen.',v:'Estos recursos permiten productos durables y propiedades útiles para construcción.',l:'La extracción puede remover suelo y alterar agua o hábitats. Reciclar requiere separación, energía y sistemas disponibles.'},
 'eco-durability':{n:'Durabilidad',q:'Capacidad de conservar una función aceptable durante un periodo de uso bajo las condiciones previstas.',u:'Comparar durabilidad ayuda al elegir un piso con tránsito frecuente o una cubierta expuesta a sol y lluvia.',v:'Un producto que dura más puede requerir menos reemplazos y reducir residuos durante el ciclo de vida.',l:'La duración depende de instalación y cuidado. Una vida larga no compensa por sí sola impactos altos o una función inadecuada.'},
 'eco-repair':{n:'Reparación',q:'Acción para corregir un daño y devolver una pieza a su función, sin reemplazar todo el producto.',u:'Cambiar una teja rota, reparar una unión o sellar una tabla puede prolongar el uso.',v:'Mantiene materiales en servicio y evita fabricar y transportar una pieza completa nueva.',l:'Reparar no siempre es seguro o viable. Hay que identificar la causa del daño y usar repuestos compatibles.'},
 'eco-reuse':{n:'Reutilización',q:'Volver a usar una pieza o producto para una función adecuada, con poca transformación respecto a su uso anterior.',u:'Tejas, puertas o bloques recuperados pueden aprovecharse en otra obra tras revisar su estado.',v:'Evita parte del procesamiento de fabricar una pieza nueva y puede reducir residuos.',l:'La reutilización depende de dimensiones, limpieza, seguridad y logística. No se debe instalar una pieza dañada solo para evitar desecharla.'},
 'eco-recycle':{n:'Reciclaje y sus límites',q:'Proceso que recupera material de residuos para incorporarlo a un nuevo producto o materia prima.',u:'Metales, vidrio y ciertos polímeros pueden reciclarse cuando se separan y existe una ruta local.',v:'Puede reducir extracción de recursos nuevos y evitar que parte de los residuos llegue a vertederos.',l:'Mezclas, recubrimientos y adhesivos dificultan separar. Reciclable no garantiza que se recoja o transforme en cada municipio.'},
 'eco-scale':{n:'Escala didáctica de 1 a 3',q:'En la matriz, 1 representa cumplimiento bajo, 2 medio y 3 alto para comparar alternativas bajo un criterio.',u:'El estudiante asigna puntajes usando la información de las fichas y el contexto descrito en el reto.',v:'La escala hace visibles diferencias y permite combinar criterios con pesos, para explicar una elección.',l:'Los números no son mediciones de laboratorio, costos exactos ni certificaciones. No completan por sí solos una decisión real de obra.'},
 'floor-tile':{n:'Piso: baldosa cerámica',img:'ceramica',alt:'Fotografía de una pared de ladrillo como representación de cerámica',q:'Pieza cerámica plana que se instala sobre una base preparada; el acabado puede ser liso, áspero o esmaltado.',u:'Se usa en pasillos y espacios interiores por su superficie lavable y resistencia al desgaste cotidiano.',v:'Limpieza sencilla y buena durabilidad si se instala bien. La textura adecuada puede ayudar con el agarre.',l:'Golpes pueden agrietarla y juntas acumulan suciedad. Una superficie lisa mojada puede resbalar; acabado y mantenimiento importan.'},
 'floor-wood':{n:'Piso: madera sin tratar',img:'madera',alt:'Fotografía de troncos como material de madera',q:'Piso de tablas o piezas de madera sin una capa protectora que reduzca el efecto de humedad y desgaste.',u:'Puede usarse en espacios secos donde el tránsito y limpieza se ajustan a sus condiciones.',v:'Es cálido al tacto, puede repararse al lijar o reemplazar piezas y proviene de recurso renovable manejado responsablemente.',l:'La humedad puede hincharlo o pudrirlo; golpes y uso intenso dejan marcas. Sin tratar requiere más cuidado y no sirve en todo ambiente.'},
 'floor-glass':{n:'Piso: vidrio común',img:'vidrio',alt:'Fotografía de una ventana de vidrio común',q:'Panel de vidrio ordinario pensado para ventanas, sin especificación de uso como superficie transitable.',u:'En una ventana aporta luz, pero no se debe trasladar esa función automáticamente a un piso.',v:'Deja pasar luz y se limpia con facilidad, propiedades útiles en cerramientos verticales adecuados.',l:'Impactos y carga repetida pueden quebrarlo; roto puede cortar o causar caída. Un piso requiere vidrio estructural especial y diseño profesional.'},
 'floor-concrete':{n:'Piso: concreto pulido',img:'compuesto',alt:'Representación fotográfica de materiales de construcción',q:'Superficie de concreto cuya cara se alisa mecánicamente; el acabado expone y sella la superficie de manera variable.',u:'Puede funcionar en áreas de tránsito cuando la base, juntas y acabado se diseñan para ese entorno.',v:'Es resistente al desgaste y fácil de barrer; requiere menos piezas de recambio que un revestimiento modular.',l:'Puede ser duro, frío o resbaloso según acabado. Fabricar cemento genera emisiones y reparar una losa puede ser complejo.'},
 'decision-criterion':{n:'Criterio',q:'Característica que sirve para comparar qué tan bien responde cada alternativa a una necesidad del problema.',u:'Aislamiento, durabilidad o mantenimiento pueden ser criterios para el piso o cubierta.',v:'Definirlo permite puntuar alternativas con la misma pregunta y explicar qué evidencia respalda cada juicio.',l:'Un criterio debe ser claro y no repetirse con otro. Una preferencia personal sin evidencia no demuestra desempeño.'},
 'decision-restriction':{n:'Restricción',q:'Condición límite que una solución debe cumplir para poder considerarse, en vez de una cualidad que se puntúa libremente.',u:'Ejemplos nuevos: el material debe caber por una puerta de servicio o la obra no puede cerrar el acceso escolar.',v:'Las restricciones ayudan a descartar opciones inviables antes de comparar sus ventajas.',l:'No toda meta es restricción. Hay que distinguir un límite obligatorio de una preferencia que admite compromisos.'},
 'decision-weight':{n:'Ponderación',q:'Peso numérico asignado a un criterio para indicar que importa más o menos al decidir.',u:'En la matriz del reto, el peso ambiental puede duplicarse para comparar un escenario didáctico.',v:'Hace visible cómo las prioridades cambian los totales y permite discutir una decisión con transparencia.',l:'El peso es una decisión del ejercicio, no una verdad científica. Cambiarlo puede alterar el resultado sin cambiar propiedades del material.'},
 'decision-tradeoff':{n:'Compromiso entre criterios',q:'Compromiso o trade-off ocurre cuando mejorar un aspecto puede empeorar otro o aumentar costo y cuidado.',u:'Una cubierta liviana puede costar más; una opción barata puede pedir más mantenimiento.',v:'Nombrar el intercambio evita declarar que una alternativa es perfecta y aclara prioridades.',l:'La matriz simplifica una situación. Deben exponerse límites y consecuencias; el puntaje total no reemplaza una revisión técnica.'},
 'decision-evidence':{n:'Puntuación con evidencia',q:'Una puntuación representa una valoración razonada bajo el contexto, no una medición exacta de una propiedad.',u:'Relaciona cada número con una ficha, dato del reto o condición visible y explica por qué sustenta tu comparación.',v:'La evidencia hace revisable el razonamiento y permite que otro estudiante entienda una elección distinta.',l:'No copies un número sin justificarlo. La escala y los costos relativos de esta actividad son didácticos, no cotizaciones.'},
 'roof-clay':{n:'Cubierta: teja de barro',img:'ceramica',alt:'Representación de tejas a partir de la fotografía de ladrillo',q:'Pieza cerámica para techo, curvada o acanalada para que las filas conduzcan lluvia hacia el borde.',u:'Se usa en cubiertas inclinadas con soporte suficiente, traslapo y pendiente apropiados.',v:'Tolera sol y lluvia y su masa puede moderar cambios térmicos del interior.',l:'Pesa y puede romperse por golpes; la instalación necesita soporte. Producción en horno consume energía y reemplazar piezas exige acceso al techo.'},
 'roof-metal':{n:'Cubierta: lámina metálica',img:'metal',alt:'Fotografía de una estructura de acero',q:'Lámina delgada de metal conformada para cubrir techos; puede tener recubrimientos que reducen corrosión.',u:'Se fija sobre correas con traslapos, pendiente y tornillos apropiados para lluvia y viento.',v:'Es liviana y cubre superficies grandes con pocas piezas; puede recuperarse como metal al desmontarla.',l:'Sin protección puede corroerse; el sol la calienta y la lluvia produce ruido. Aislamiento, sellos y mantenimiento agregan costo.'},
 'roof-plastic':{n:'Cubierta: teja plástica',img:'polimero',alt:'Fotografía de tubería polimérica como representación de plástico',q:'Pieza de polímero moldeado para cubierta, disponible en diferentes espesores, colores y perfiles.',u:'Puede cubrir zonas livianas si se selecciona un producto para intemperie y se fija según indicaciones.',v:'Pesa poco y algunas piezas traslúcidas dejan pasar luz. Se corta y transporta con facilidad.',l:'Sol y calor pueden degradar o deformar el polímero. Impacto, expansión, UV y reciclaje dependen del tipo específico.'},
 'roof-sandwich':{n:'Cubierta: panel sándwich',img:'compuesto',alt:'Fotografía de malla de refuerzo como representación de componentes unidos',q:'Panel compuesto de dos láminas exteriores y un núcleo aislante, unidos para formar un elemento rígido.',u:'Se monta en cubiertas cuando se busca cubrir rápido y reducir el paso de calor o ruido.',v:'Bajo peso y aislamiento integrado pueden mejorar el confort; paneles largos reducen uniones.',l:'Puede tener costo inicial mayor y las capas dificultan reparación o reciclaje. Filtraciones en uniones y núcleo dañado requieren atención.'}
};
const SUPPORT_BY_RETO={
 r1:['fam-metal','fam-ceramica','fam-polimero','fam-madera','fam-vidrio','fam-compuesto','obj-tuberia','obj-viga','obj-ladrillo','obj-ventana','obj-contrachapado','obj-tronco','concept-propiedades'],
 r2:['fam-ceramica','cer-arcilla','cer-teja','cer-baldosa','glass-tempered','comp-concrete','fam-compuesto'],
 r3:['glass-common','glass-tempered','glass-laminated','concept-treatment','concept-propiedades'],
 r4:['comp-concrete','comp-fiberglass','comp-plywood','concept-matrix','concept-reinforcement','concept-adhesive','concept-forces','concept-layers'],
 r5:['glass-tempered','concept-treatment','comp-concrete','comp-fiberglass','comp-plywood','concept-matrix','concept-forces','concept-layers'],
 r6:['life-extract','life-make','life-transport','life-install','life-use','life-end','eco-renewable','eco-nonrenewable','eco-durability'],
 r7:['life-extract','life-make','life-end','eco-renewable','eco-nonrenewable','eco-durability','eco-repair','eco-reuse','eco-recycle'],
 r8:['floor-tile','floor-wood','floor-glass','floor-concrete','eco-scale','decision-evidence','decision-weight'],
 r9:['decision-criterion','decision-restriction','decision-weight','decision-tradeoff','decision-evidence'],
 r10:['roof-clay','roof-metal','roof-plastic','roof-sandwich','decision-criterion','decision-restriction','decision-weight','decision-tradeoff','decision-evidence']
};
function supportLabel(id){return SUPPORT_CARDS[id]?SUPPORT_CARDS[id].n:id}
function supportPanelHTML(id,instance){const c=SUPPORT_CARDS[id];if(!c)return '';const panelId='ficha-'+instance+'-'+id,buttonId='abrir-'+instance+'-'+id,glass={'glass-common':'comun','glass-tempered':'templado','glass-laminated':'laminado'}[id]||'',asset=(id==='cer-teja'||id==='roof-clay')?'teja':(id==='cer-baldosa'||id==='floor-tile')?'baldosa':'',visual=c.img&&IMG[c.img]?'<figure class="support-visual"><img src="'+IMG[c.img]+'" alt="'+esc(c.alt||('Imagen: '+c.n))+'"><figcaption>'+esc(c.alt||('Imagen: '+c.n))+'</figcaption></figure>':'<figure class="support-visual support-diagram" role="img" aria-label="Esquema conceptual identificado: '+esc(c.n)+'"><div aria-hidden="true"><span>material</span><b>→</b><span>función</span></div><figcaption>Esquema conceptual · '+esc(c.n)+'</figcaption></figure>';return '<button class="support-trigger" id="'+buttonId+'" type="button" data-support-toggle'+(glass?' data-support-glass="'+glass+'"':'')+(asset?' data-support-asset="'+asset+'"':'')+' aria-expanded="false" aria-controls="'+panelId+'">Explorar: '+esc(c.n)+'</button><section class="support-panel" id="'+panelId+'" role="region" aria-labelledby="'+buttonId+'" hidden>'+visual+'<div class="support-copy"><h4>'+esc(c.n)+'</h4><dl><dt>Qué es</dt><dd>'+esc(c.q)+'</dd><dt>Usos</dt><dd>'+esc(c.u)+'</dd><dt>Ventajas</dt><dd>'+esc(c.v)+'</dd><dt>Límites</dt><dd>'+esc(c.l)+'</dd></dl><p>Apoyo para pensar; consultar esta ficha no registra ni completa el reto.</p></div></section>'}
function supportHTML(id){const ids=SUPPORT_BY_RETO[id]||[];if(!ids.length)return '';return '<section class="explore-box" aria-label="Apoyos para '+id+'"><p><strong>Explora antes de responder.</strong> Abre una ficha y luego continúa aquí.</p><div class="explore-list">'+ids.map(card=>supportPanelHTML(card,id)).join('')+'</div></section>'}
document.addEventListener('click',e=>{const b=e.target.closest('[data-support-toggle]');if(!b)return;const panel=document.getElementById(b.getAttribute('aria-controls'));if(!panel)return;const open=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',String(open));panel.hidden=!open;if(!open)return;const figure=panel.querySelector('.support-visual');if(b.dataset.supportGlass){const tab=document.querySelector('#vtab-btns [data-v="'+b.dataset.supportGlass+'"]'),svg=document.querySelector('#vsvg');if(tab&&tab.getAttribute('aria-pressed')==='true'&&figure&&svg){const clone=svg.cloneNode(true);clone.removeAttribute('id');clone.setAttribute('role','img');clone.setAttribute('aria-label','Esquema de rotura: '+panel.querySelector('h4').textContent);figure.replaceChildren(clone);figure.insertAdjacentHTML('beforeend','<figcaption>Esquema de la guía «Tres vidrios, tres formas de romperse» · '+esc(panel.querySelector('h4').textContent)+'</figcaption>');}}else if(b.dataset.supportAsset&&figure){const alt=b.dataset.supportAsset==='teja'?'Tejas de barro acanaladas en un techo':'Baldosas cerámicas decorativas de un piso';const img=Array.from(document.images).find(x=>x.alt===alt);if(img){const clone=img.cloneNode();clone.alt='Fotografía: '+panel.querySelector('h4').textContent;figure.replaceChildren(clone);figure.insertAdjacentHTML('beforeend','<figcaption>'+clone.alt+'</figcaption>');}}});

/* mosaico de la guía 1 */
$('#mosaic').innerHTML=MATS.map((m,i)=>'<article class="mat" role="listitem"><img src="'+IMG[m.k]+'" alt="'+['Pilotes de acero en una obra','Pared de ladrillo','Tubos de polímero rojos apilados','Troncos de madera apilados','Ventana de vidrio con vista al paisaje','Malla de acero para concreto reforzado'][i]+'"><div><h3>'+(i+1)+'. '+m.n+'</h3><ul>'+m.props.map(p=>'<li>'+p+'</li>').join('')+'</ul>'+supportPanelHTML('fam-'+m.k,'mosaico')+'</div></article>').join('');

/* ---------- hero: banco de pruebas ---------- */
(function(){
 let mat=MATS.find(m=>m.k==='vidrio'),prev=null;
 const mc=$('#lab-mats'),pc=$('#lab-places'),sg=$('#sl-golpe'),sh=$('#sl-hum');
 mc.innerHTML=MATS.map(m=>'<button type="button" class="chip" data-m="'+m.k+'" aria-pressed="false"><img src="'+IMG[m.k]+'" alt="">'+m.n+'</button>').join('');
 pc.innerHTML=PLACES.map((p,i)=>'<button type="button" class="chip" data-p="'+i+'" aria-pressed="false">'+p.n+'</button>').join('');
 function fx(failG,failH,ok){
  let s='';
  if(failG)s+='<path d="M96 0L88 34L106 58L90 92L102 140" fill="none" stroke="#17243B" stroke-width="4" stroke-linejoin="round"/><path d="M106 58L140 70M90 92L58 104" fill="none" stroke="#17243B" stroke-width="3"/>';
  if(failH)s+='<rect width="190" height="140" fill="#3B6BB5" opacity=".28"/><g fill="#3B6BB5" stroke="#17243B" stroke-width="2"><path d="M30 20q8 14 0 20q-8-6 0-20z"/><path d="M70 60q8 14 0 20q-8-6 0-20z"/><path d="M150 30q8 14 0 20q-8-6 0-20z"/><path d="M120 95q8 14 0 20q-8-6 0-20z"/></g>';
  if(ok)s+='<circle cx="150" cy="104" r="28" fill="#1F7A4D" stroke="#fff" stroke-width="3"/><path d="M136 104l10 10 18-22" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>';
  $('#slab-fx').innerHTML=s;
 }
 function update(){
  const g=+sg.value,h=+sh.value;
  $('#o-golpe').textContent=g;$('#o-hum').textContent=h;
  $$('[data-m]',mc).forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===mat.k));
  $$('[data-p]',pc).forEach(b=>{const p=PLACES[+b.dataset.p];b.setAttribute('aria-pressed',p.g===g&&p.h===h);});
  const okG=mat.gol>=g,okH=mat.hum>=h,ok=okG&&okH;
  $('#n1').textContent='Exige resistir golpes de '+g+' y humedad de '+h+'.';
  $('#n2').textContent=mat.n+' resiste golpes '+mat.gol+' y humedad '+mat.hum+'.';
  $('#n3').textContent='Golpes: '+mat.gol+' ≥ '+g+(okG?' cumple. ':' no cumple. ')+'Humedad: '+mat.hum+' ≥ '+h+(okH?' cumple.':' no cumple.');
  $('#n4').textContent=ok?'Material adecuado para este lugar.':'Material no adecuado para este lugar.';
  const img=$('#slab-img');img.src=IMG[mat.k];img.alt='Fotografía de '+mat.n.toLowerCase();
  fx(!okG,!okH,ok);
  const say=$('#say');say.className='say '+(ok?'good':'bad');
  let t;
  if(ok)t='<b>Adecuado</b>'+mat.n+' cumple las dos condiciones: resiste golpes ('+mat.gol+' frente a '+g+') y humedad ('+mat.hum+' frente a '+h+').';
  else{const f=[];if(!okG)f.push('golpes: el material resiste '+mat.gol+' y el lugar exige '+g+(mat.whyG?', porque '+mat.whyG:''));if(!okH)f.push('humedad: el material resiste '+mat.hum+' y el lugar exige '+h+(mat.whyH?', porque '+mat.whyH:''));t='<b>No adecuado</b>Falla en '+f.join('; y en ')+'.';}
  say.innerHTML=t;
  const slab=$('#slab');
  if(prev===true&&!ok){slab.classList.remove('shake');void slab.offsetWidth;slab.classList.add('shake');}
  prev=ok;
 }
 mc.addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(!b)return;mat=MATS.find(m=>m.k===b.dataset.m);update();});
 pc.addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(!b)return;const p=PLACES[+b.dataset.p];sg.value=p.g;sh.value=p.h;update();});
 sg.addEventListener('input',update);sh.addEventListener('input',update);
 sg.value=20;sh.value=50;update();
})();

/* ---------- guía 2: tres vidrios ---------- */
(function(){
 const T=[
  {k:'comun',n:'Vidrio común (float)',txt:'Se forma como lámina plana sobre un baño de estaño fundido. Tiene buena transparencia, pero al romperse puede producir fragmentos grandes y cortantes. Se usa en ventanas cuando no se requieren condiciones especiales de seguridad.',alt:'Vidrio común roto en fragmentos grandes con bordes filosos'},
  {k:'templado',n:'Vidrio templado',txt:'Se calienta y se enfría rápidamente. Eso genera esfuerzos internos que aumentan su resistencia a impactos y cambios de temperatura. Si se rompe, se fragmenta en piezas pequeñas. Se usa en puertas de ducha, mobiliario y ventanas de vehículos.',alt:'Vidrio templado roto en muchos cuadritos pequeños'},
  {k:'laminado',n:'Vidrio laminado',txt:'Dos o más láminas de vidrio unidas con una película plástica, como PVB o EVA. Si se rompe, la película mantiene adheridos muchos fragmentos. Se usa en parabrisas, barandas y vidrios de seguridad.',alt:'Vidrio laminado agrietado pero con los pedazos todavía unidos por una película'}
 ];
 let cur='comun';
 const btns=$('#vtab-btns');
 btns.innerHTML=T.map(t=>'<button type="button" class="chip" data-v="'+t.k+'" aria-pressed="false">'+t.n+'</button>').join('');
 function draw(k){
  const cx=140,cy=90,B=[[20,15],[150,15],[260,15],[260,100],[260,165],[130,165],[20,165],[20,80]];
  let s='<rect x="20" y="15" width="240" height="150" fill="#CFE4F7" stroke="#17243B" stroke-width="3"/>';
  if(k==='comun'){
   const fills=['#DCEBFA','#C5DDF4','#E6F1FC','#BBD6F0'];
   for(let i=0;i<B.length;i++){const a=B[i],b=B[(i+1)%B.length],mx=(a[0]+b[0])/2-cx,my=(a[1]+b[1])/2-cy,l=Math.hypot(mx,my)||1,dx=mx/l*5,dy=my/l*5;
    s+='<polygon points="'+cx+','+cy+' '+a[0]+','+a[1]+' '+b[0]+','+b[1]+'" transform="translate('+dx.toFixed(1)+' '+dy.toFixed(1)+')" fill="'+fills[i%4]+'" stroke="#17243B" stroke-width="2.5" stroke-linejoin="miter"/>';}
  }else if(k==='templado'){
   for(let x=20;x<260;x+=16)for(let y=15;y<165;y+=16){const j=Math.sin(x*12.9+y*7.7)*1.6,r=Math.sin(x*3.1+y*5.3)*9;s+='<rect x="'+(x+1+j).toFixed(1)+'" y="'+(y+1-j).toFixed(1)+'" width="13" height="13" transform="rotate('+r.toFixed(1)+' '+(x+7)+' '+(y+7)+')" fill="'+(((x+y)/16)%2?'#DCEBFA':'#C5DDF4')+'" stroke="#17243B" stroke-width="1.2"/>';}
  }else{
   s+='<rect x="20" y="15" width="240" height="150" fill="#FFF3A8" opacity=".55"/>';
   const rad=[[20,15],[90,15],[150,15],[210,15],[260,15],[260,70],[260,120],[260,165],[200,165],[140,165],[80,165],[20,165],[20,110],[20,60]];
   rad.forEach(p=>{s+='<path d="M'+cx+' '+cy+'L'+p[0]+' '+p[1]+'" stroke="#17243B" stroke-width="1.8" fill="none"/>';});
   [28,52,80].forEach(r=>{let d='';for(let i=0;i<14;i++){const a=i/14*Math.PI*2,rr=r+Math.sin(i*2.3)*5;d+=(i?'L':'M')+(cx+Math.cos(a)*rr*1.5).toFixed(1)+' '+(cy+Math.sin(a)*rr).toFixed(1);}s+='<path d="'+d+'Z" stroke="#17243B" stroke-width="1.4" fill="none"/>';});
   s+='<rect x="30" y="140" width="220" height="20" rx="6" fill="#fff" stroke="#17243B" stroke-width="2"/><text x="140" y="154" text-anchor="middle" font-size="12" font-family="Atkinson Hyperlegible,Arial" fill="#17243B">la película plástica retiene los pedazos</text>';
  }
  return s;
 }
 function show(k){
  cur=k;const t=T.find(x=>x.k===k);
  $$('[data-v]',btns).forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===k));
  const sv=$('#vsvg');sv.innerHTML=draw(k);sv.setAttribute('aria-label',t.alt);
  $('#vtext').innerHTML='<h4>'+t.n+'</h4><p>'+t.txt+'</p>';
 }
 btns.addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(b)show(b.dataset.v);});
 show('comun');
})();

/* ---------- motor de filas (clasificar, relacionar, quiz) ---------- */
const LET='ABCDEFGH';
const RETO_REPORT_CATALOG={};
const LIFECYCLE=['Extracción de materias primas','Fabricación y transformación','Transporte del material o producto','Preparación o instalación para entrar en servicio','Uso y mantenimiento','Fin de vida: reutilización, reciclaje o disposición'];
const DOC_CHECKLIST=['Fase 1: criterios y restricciones del problema','Fase 2: comparación de alternativas con ventaja y limitación de cada una','Matriz de decisión completa','Bosquejo de la cubierta con el material y dos anotaciones técnicas','Control de coherencia de la decisión','Fase 3: justificación escrita (opción, tres razones, impacto ambiental y limitación)','Coevaluación con un compañero','Fase 4: presentación de la propuesta','Ticket de salida'];
function rowsReto(id,cfg){
 const el=$('#reto-'+id);
 const A=S.a[id]=S.a[id]||{};
 const N=cfg.rows.length;
 const choicesOf=(r,k)=>(r.ch&&r.ch[k])||cfg.steps[k].choices;
 const hintOf=(r,k)=>Array.isArray(r.hint)?r.hint[k]:r.hint;
 RETO_REPORT_CATALOG[id]={title:cfg.title,instr:cfg.instr,rows:cfg.rows.map(function(r,i){return{text:r.text,steps:r.ans.map(function(_,k){return{label:cfg.steps[k].label||'Respuesta',choices:choicesOf(r,k)}}),expected:r.ans.slice()}})};
 function ev(r,i){
  const p=A[i]||[];let shown=r.ans.length,st='pending',msg='';
  for(let k=0;k<r.ans.length;k++){
   if(p[k]===undefined){shown=k+1;break;}
   if(p[k]!==r.ans[k]){shown=k+1;st='bad';msg=hintOf(r,k);break;}
   if(k===r.ans.length-1){st='ok';msg=r.why;}
  }
  return {p,shown,st,msg};
 }
 function rowHTML(r,i){
  const e=ev(r,i);let h='<p class="rt">'+(i+1)+'. '+r.text+'</p>';
  for(let k=0;k<e.shown;k++){
   const ch=choicesOf(r,k),lab=cfg.steps[k].label;
   h+='<div class="stp">'+(lab?'<span class="sl2">'+lab+'</span>':'')+'<div class="chips" role="group" aria-label="'+esc(lab||'Opciones')+', fila '+(i+1)+'">'+ch.map((c,j)=>{const on=e.p[k]===j;const cls=on?(j===r.ans[k]?'ok':'bad'):'';return '<button type="button" class="chip '+cls+'" data-i="'+i+'" data-k="'+k+'" data-j="'+j+'" aria-pressed="'+on+'">'+(cfg.quiz?LET[j]+'. ':'')+c+'</button>';}).join('')+'</div></div>';
  }
  if(e.st==='ok')h+='<p class="fb ok">✓ '+e.msg+'</p>';
  else if(e.st==='bad')h+='<p class="fb bad">✗ '+e.msg+' Intenta de nuevo.</p>';
  return {html:h,st:e.st};
 }
 function count(){return cfg.rows.filter((r,i)=>ev(r,i).st==='ok').length;}
 function build(){
  el.innerHTML=shell(id,cfg.title,cfg.instr)+supportHTML(id)+(cfg.bank?'<div class="bank"><b>'+cfg.bank.title+'</b><ul>'+cfg.bank.items.map(x=>'<li>'+x+'</li>').join('')+'</ul></div>':'')+'<div class="progress" aria-hidden="true"><i></i></div><div class="rows"></div><p class="live" role="status"></p><div class="btnrow"><button type="button" class="btn sm" data-reset>Reiniciar este reto</button></div>';
  const box=$('.rows',el);
  box.innerHTML=cfg.rows.map((r,i)=>{const x=rowHTML(r,i);return '<div class="row '+x.st+'" data-row="'+i+'">'+x.html+'</div>';}).join('');
  prog();updateAll();
 }
 function prog(msg){
  const n=count();$('.progress i',el).style.width=(n/N*100)+'%';
  $('.live',el).textContent=msg||(n===N?'Reto completo: '+N+' de '+N+' correctas.':n+' de '+N+' correctas.');
 }
 el.addEventListener('click',ev2=>{
  if(ev2.target.closest('[data-reset]')){resetReto(id,A);build();return;}
  const b=ev2.target.closest('.chip[data-i]');if(!b)return;
  const i=+b.dataset.i,k=+b.dataset.k,j=+b.dataset.j,r=cfg.rows[i];
  const p=(A[i]||[]).slice(0,k);p[k]=j;A[i]=p;save();
  const x=rowHTML(r,i),row=$('[data-row="'+i+'"]',el);
  row.className='row '+x.st;row.innerHTML=x.html;
  const nb=$('.chip[data-i="'+i+'"][data-k="'+k+'"][data-j="'+j+'"]',row);if(nb)nb.focus();
  const e=ev(r,i);
  prog(e.st==='ok'?'Fila '+(i+1)+' correcta. '+count()+' de '+N+'.':e.st==='bad'?'Fila '+(i+1)+' incorrecta. '+e.msg:count()+' de '+N+' correctas.');
  if(count()===N)markDone(id);else clearDone(id);
 });
 build();
}

rowsReto('r1',{title:'Clasifica cada objeto',instr:'Para cada objeto, elige el grupo de materiales al que pertenece. Usa las propiedades de las tarjetas de arriba.',
 steps:[{label:'',choices:MATS.map(m=>m.n)}],
 rows:[
  {text:'Una tubería que lleva agua potable a una casa.',ans:[2],why:'Los polímeros son livianos y no se oxidan ni se pudren con el agua.',hint:'Busca un material que no se oxide con el agua.'},
  {text:'Una viga que sostiene la estructura de un edificio.',ans:[0],why:'El metal es resistente y soporta mucho peso.',hint:'Debe soportar mucho peso y no romperse con facilidad.'},
  {text:'Un ladrillo de una pared.',ans:[1],why:'Se fabrica horneando arcilla y resiste muy bien el peso encima.',hint:'Piensa en el material que se hornea a partir de arcilla.'},
  {text:'Una ventana de una casa.',ans:[4],why:'El vidrio deja pasar la luz.',hint:'La ventana debe dejar pasar la luz.'},
  {text:'Una tabla de madera contrachapada (varias láminas de madera pegadas entre sí).',ans:[5],why:'Une varios materiales (láminas y adhesivo) para combinar sus ventajas.',hint:'Pregúntate si es un solo material o varios unidos.'},
  {text:'Un tronco recién cortado, listo para convertirse en tablas.',ans:[3],why:'Es un material natural y renovable que viene de los árboles.',hint:'Todavía no se ha transformado: viene directo del árbol.'}
 ]});

rowsReto('r2',{title:'Quiz de la guía 1',instr:'Elige la respuesta. Si fallas, lee la pista y vuelve a intentar.',quiz:true,
 steps:[{label:'',choices:[]}],
 rows:[
  {text:'¿Qué material se fabrica horneando arcilla a altas temperaturas, resiste muy bien el peso y es frágil ante golpes?',ch:[['Polímero','Cerámica','Madera','Metal']],ans:[1],why:'Las cerámicas se hornean a altas temperaturas, no se oxidan ni se pudren y son buenas aislantes del calor.',hint:'Piensa de qué están hechos los ladrillos.'},
  {text:'¿Por qué la teja de barro se usa para cubrir techos?',ch:[['Porque es transparente','Porque es impermeable y resiste el sol y la lluvia','Porque conduce la electricidad','Porque se oxida con el tiempo']],ans:[1],why:'Su forma curva o acanalada evacúa el agua y la cerámica resiste el sol y la lluvia.',hint:'Piensa en lo que debe soportar un techo todos los días.'},
  {text:'¿Dónde se usa una baldosa o azulejo cerámico y por qué?',ch:[['En techos, porque es curva y acanalada','En muros, porque se apila en hiladas','En pisos y paredes de baños y cocinas, porque su superficie es dura y fácil de limpiar','En ventanas, porque es transparente']],ans:[2],why:'La baldosa es una pieza plana de superficie dura y fácil de limpiar.',hint:'Piensa en una pieza plana que debe limpiarse con facilidad.'},
  {text:'¿Qué dice la guía del vidrio templado?',ch:[['Es opaco y no deja pasar la luz','Se oxida con el agua','Se rompe en pedacitos pequeños, no en fragmentos filosos','Se pudre con la humedad']],ans:[2],why:'El vidrio deja pasar la luz y el templado se rompe en pedacitos pequeños.',hint:'Recuerda la fotografía del vidrio roto de la guía 2.'},
  {text:'El concreto reforzado es un material compuesto porque…',ch:[['está hecho de un solo material','une concreto y varillas de acero','se fabrica solo con madera','no tiene ningún refuerzo']],ans:[1],why:'Un compuesto une dos o más materiales distintos para combinar sus ventajas.',hint:'Compuesto significa que hay más de un material.'}
 ]});

const VT=['Transparencia','Fragilidad ante golpes','Seguridad al romperse','Conducción eléctrica'];
rowsReto('r3',{title:'¿Dónde sí y dónde no usar vidrio?',instr:'Decide si el vidrio indicado es adecuado y elige la propiedad que justifica tu decisión. Evita razones como «porque se usa mucho».',
 steps:[{label:'¿Es adecuado?',choices:['Adecuado','No adecuado']},{label:'Propiedad que lo justifica',choices:VT}],
 rows:[
  {text:'Ventana de una casa.',ans:[0,0],why:'El vidrio común es transparente y deja ver el exterior; en una ventana no recibe golpes fuertes.',hint:['Una ventana debe dejar pasar la luz.','Piensa en lo que se espera ver a través de una ventana.']},
  {text:'Piso de una cancha deportiva.',ans:[1,1],why:'El vidrio es frágil: los impactos y el peso repetido lo romperían.',hint:['En una cancha hay golpes y carga constantes.','Recuerda que el vidrio es duro, pero se rompe con poca deformación.']},
  {text:'Puerta de una ducha (vidrio templado).',ans:[0,2],why:'El templado resiste mejor impactos y cambios de temperatura y, si se rompe, lo hace en pedazos pequeños.',hint:['El tratamiento del templado lo hace apto para este uso.','Piensa en qué pasa cuando el templado se rompe.']},
  {text:'Columna que sostiene la estructura de un edificio.',ans:[1,1],why:'La fragilidad impide confiarle las cargas de la estructura.',hint:['Una columna debe soportar mucho peso sin romperse de forma repentina.','Piensa en cómo se rompe el vidrio.']},
  {text:'Parabrisas de un carro (vidrio laminado).',ans:[0,2],why:'La película plástica mantiene adheridos los fragmentos si el vidrio se rompe.',hint:['El conductor necesita ver a través de él.','Piensa en la película plástica entre las láminas.']},
  {text:'Piso de una cocina de alto tráfico.',ans:[1,1],why:'Los golpes y el tránsito constante lo harían fallar por su fragilidad.',hint:['Un piso recibe golpes y mucho tránsito.','Recuerda cómo reacciona el vidrio ante los golpes.']},
  {text:'Baranda de balcón (vidrio laminado de seguridad).',ans:[0,2],why:'Si se rompe, la película retiene los fragmentos y reduce el riesgo de desprendimiento.',hint:['El laminado fue pensado para aplicaciones de seguridad.','Piensa en el riesgo de que caigan pedazos.']}
 ]});

rowsReto('r4',{title:'Relaciona componente y función',instr:'Elige la letra de la función que cumple mejor cada componente.',
 bank:{title:'Banco de funciones',items:['A. Aporta resistencia a la tracción.','B. Mantiene las fibras unidas y distribuye esfuerzos.','C. Resiste principalmente la compresión.','D. Mantiene unidas las capas del tablero.','E. Actúan como refuerzo y aportan resistencia.']},
 steps:[{label:'',choices:['A','B','C','D','E']}],
 rows:[
  {text:'Fibras de vidrio',ans:[4],why:'Las fibras actúan como refuerzo y aportan resistencia.',hint:'Son el refuerzo de la fibra de vidrio.'},
  {text:'Concreto en el concreto reforzado',ans:[2],why:'El concreto resiste muy bien la compresión, pero es débil frente a la tracción.',hint:'Piensa en qué esfuerzo aguanta bien el concreto.'},
  {text:'Adhesivo en la madera contrachapada',ans:[3],why:'El adhesivo une las capas para que trabajen como un solo tablero.',hint:'Piensa en qué mantiene pegadas las láminas.'},
  {text:'Barras de acero del concreto reforzado',ans:[0],why:'El acero ayuda a soportar los esfuerzos que estiran o flexionan el elemento.',hint:'El concreto es débil frente a un esfuerzo; ¿cuál es?'},
  {text:'Resina en la fibra de vidrio',ans:[1],why:'La resina es la matriz: mantiene las fibras en posición, distribuye los esfuerzos y las protege.',hint:'La matriz mantiene unidos los demás componentes.'}
 ]});

rowsReto('r5',{title:'Detecta y corrige el error',instr:'Marca si la afirmación es correcta o incorrecta. Si es incorrecta, elige cómo se corrige.',
 steps:[{label:'La afirmación es…',choices:['Correcta','Incorrecta']},{label:'Elige la corrección',choices:[]}],
 rows:[
  {text:'El vidrio templado es un material compuesto porque recibió un tratamiento térmico.',ans:[1,1],ch:[null,['El vidrio templado es compuesto porque tiene aire en su interior.','El vidrio templado no es compuesto: es vidrio modificado por un tratamiento, sin combinar materiales distintos.','El vidrio templado es compuesto porque lleva resina.']],why:'Un tratamiento modifica un material; un compuesto combina materiales distintos.',hint:['Revisa si se combinaron materiales diferentes o se modificó el vidrio.','Piensa en la diferencia entre tratamiento y composición.']},
  {text:'En la fibra de vidrio, la resina cumple la función de matriz.',ans:[0],why:'La resina mantiene las fibras en posición, distribuye los esfuerzos y las protege.',hint:'Recuerda qué componente mantiene unidos a los demás.'},
  {text:'En el concreto reforzado, el acero ayuda a resistir esfuerzos de tracción.',ans:[0],why:'El concreto resiste la compresión y el acero ayuda con la tracción.',hint:'Recuerda para qué esfuerzo se agrega acero.'},
  {text:'En el triplex, las láminas se orientan todas en la misma dirección para reducir deformaciones.',ans:[1,0],ch:[null,['Las láminas se orientan con las fibras alternadas en direcciones distintas, lo que reduce la deformación.','Las láminas se pegan sin adhesivo para que respiren.','Las láminas son todas de metal.']],why:'La dirección alternada de las fibras reduce la tendencia a deformarse o rajarse en una sola dirección.',hint:['Observa la fotografía del triplex: las capas no van iguales.','Piensa en la dirección de las fibras.']}
 ]});

rowsReto('r7',{title:'Relaciona cada impacto con una solución',instr:'Elige la letra de la solución que responde mejor a cada impacto ambiental.',
 bank:{title:'Banco de soluciones',items:['A. Recuperar, reutilizar o reciclar materiales de demolición cuando sea posible.','B. Usar madera de manejo forestal responsable y promover la reforestación.','C. Incorporar material reciclado y elegir alternativas durables que reduzcan el consumo de recursos vírgenes.','D. Aplicar controles ambientales en minas y canteras, tratar el agua y restaurar las áreas intervenidas.','E. Mejorar la eficiencia energética de hornos y equipos y usar fuentes con menos emisiones.']},
 steps:[{label:'',choices:['A','B','C','D','E']}],
 rows:[
  {text:'Alto consumo de energía al hornear ladrillos, fundir metal o fabricar vidrio.',ans:[4],why:'Mejorar la eficiencia de hornos y equipos reduce la energía usada en la fabricación.',hint:'El problema está en la etapa de fabricación y en la energía.'},
  {text:'Deforestación por tala de árboles para obtener madera.',ans:[1],why:'El manejo forestal responsable y la reforestación recuperan lo que se extrae.',hint:'La solución debe actuar sobre los bosques.'},
  {text:'Acumulación de escombros y residuos de construcción en vertederos.',ans:[0],why:'Recuperar, reutilizar o reciclar reduce lo que llega al vertedero.',hint:'Piensa en el fin de vida del material.'},
  {text:'Contaminación de fuentes de agua por extracción de arcilla o arena en canteras.',ans:[3],why:'Los controles ambientales y el tratamiento del agua reducen la contaminación en la fuente.',hint:'El impacto ocurre en la cantera o la mina.'},
  {text:'Agotamiento de recursos naturales no renovables (minerales, arena).',ans:[2],why:'Usar material reciclado y materiales durables reduce el consumo de recursos vírgenes.',hint:'Hay que consumir menos recursos nuevos.'}
 ]});

rowsReto('r9',{title:'Criterio o restricción',instr:'Un criterio sirve para comparar alternativas. Una restricción es un límite que no puede ignorarse. Marca cuál es cada frase.',
 steps:[{label:'',choices:['Criterio (C)','Restricción (R)']}],
 rows:[
  {text:'Comparar qué alternativa reduce mejor el paso de calor.',ans:[0],why:'Permite comparar qué tan bien funciona cada alternativa.',hint:'Habla de comparar, no de un límite.'},
  {text:'La propuesta no puede superar el presupuesto aprobado.',ans:[1],why:'Es un límite que no puede ignorarse.',hint:'Hay un tope que no se puede pasar.'},
  {text:'Comparar la durabilidad esperada de cada material.',ans:[0],why:'Es una característica para comparar alternativas.',hint:'Habla de comparar materiales entre sí.'},
  {text:'La cubierta debe caber dentro del área disponible.',ans:[1],why:'El área disponible es un límite que no puede ignorarse.',hint:'Es una condición obligatoria.'},
  {text:'Comparar la facilidad de mantenimiento.',ans:[0],why:'Sirve para comparar alternativas.',hint:'Habla de comparar, no de un límite.'},
  {text:'La solución debe proteger el área frente a la lluvia.',ans:[1],why:'Es una necesidad que no puede ignorarse.',hint:'Si no se cumple, la cubierta no resuelve el problema.'}
 ]});

/* ---------- reto de orden: ciclo de vida ---------- */
(function(){
 const id='r6',el=$('#reto-'+id);
 const ST=LIFECYCLE;
 let ord=(S.ord[id]&&S.ord[id].length===6)?S.ord[id].slice():[3,0,5,1,4,2],res=null;
 el.innerHTML=shell(id,'Ordena el ciclo de vida','Usa las flechas para ordenar las seis etapas desde la obtención de las materias primas hasta el final del uso. Luego pulsa Comprobar.')+supportHTML(id)+'<ol class="ordl"></ol><div class="btnrow"><button type="button" class="btn main" data-check>Comprobar orden</button><button type="button" class="btn sm" data-shuf>Desordenar</button></div><p class="live" role="status"></p>';
 const ol=$('.ordl',el),live=$('.live',el);
 function draw(focus){
  ol.innerHTML=ord.map((s,i)=>'<li class="'+(res?(res[i]?'ok':'bad'):'')+'"><span class="pos">'+(i+1)+'</span><span class="tx">'+ST[s]+'</span><button type="button" data-up="'+i+'" aria-label="Subir: '+esc(ST[s])+'" '+(i===0?'disabled':'')+'>▲</button><button type="button" data-dn="'+i+'" aria-label="Bajar: '+esc(ST[s])+'" '+(i===5?'disabled':'')+'>▼</button></li>').join('');
  if(focus){const b=$(focus,ol);if(b&&!b.disabled)b.focus();else{const o=$('button:not(:disabled)',ol.children[+focus.match(/\d+/)[0]]);if(o)o.focus();}}
 }
 function mv(i,d){const j=i+d;if(j<0||j>5)return;[ord[i],ord[j]]=[ord[j],ord[i]];res=null;S.ord[id]=ord.slice();save();clearDone(id);draw(d<0?'[data-up="'+j+'"]':'[data-dn="'+j+'"]');live.textContent='Movida: '+ST[ord[j]]+' ahora es la etapa '+(j+1)+'.';}
 el.addEventListener('click',e=>{
  const u=e.target.closest('[data-up]'),d=e.target.closest('[data-dn]');
  if(u)mv(+u.dataset.up,-1);else if(d)mv(+d.dataset.dn,1);
  else if(e.target.closest('[data-shuf]')){ord=[3,0,5,1,4,2];res=null;S.ord[id]=ord.slice();save();clearDone(id);draw();live.textContent='Etapas desordenadas.';}
  else if(e.target.closest('[data-check]')){
   res=ord.map((s,i)=>s===i);const n=res.filter(Boolean).length;draw();
   if(n===6){live.textContent='Orden correcto: las seis etapas están en su lugar. La extracción va primero y el fin de vida cierra el ciclo.';markDone(id);}
   else live.textContent=n+' de 6 etapas en su lugar. Pista: primero se obtiene la materia prima y se transforma; después se transporta, se instala, se usa y al final se recupera o se desecha.';
  }
 });
 draw();
})();

/* ---------- matriz de decisión ---------- */
function matrix(id,cfg){
 const el=$('#reto-'+id),M=S.mx[id]=S.mx[id]||{s:{},w:false,pick:-1};
 M.meta={criteria:cfg.crit.map(x=>({name:x.n,amb:!!x.amb})),options:cfg.opts.map(x=>({short:x.s,name:x.n})),note:cfg.note};if(M.source!=='ejemplo')M.source=M.source||'estudiante';
 const O=cfg.opts.length,C=cfg.crit.length;
 const get=(o,c)=>M.s[o+'_'+c]||0,wt=c=>(M.w&&cfg.crit[c].amb)?2:1;
 const tot=()=>cfg.opts.map((_,o)=>cfg.crit.reduce((t,_c,c)=>t+get(o,c)*wt(c),0));
 el.innerHTML=shell(id,cfg.title,cfg.instr)+supportHTML(id)+
  '<div>'+cfg.opts.map(o=>'<details class="opt"><summary>'+o.n+': lo que dice la guía</summary><p>'+o.info+'</p></details>').join('')+'</div>'+
  '<p class="note-s">Pulsa cada casilla para cambiar el puntaje: 1 cumplimiento bajo, 2 medio, 3 alto.</p>'+
  '<div class="mxwrap" tabindex="0" role="region" aria-label="Matriz de decisión, desplázate horizontalmente en pantallas pequeñas"><table class="mx"><thead><tr><th scope="col">Criterio</th>'+cfg.opts.map(o=>'<th scope="col">'+o.s+'</th>').join('')+'</tr></thead><tbody>'+
  cfg.crit.map((cr,c)=>'<tr><th scope="row">'+cr.n+'</th>'+cfg.opts.map((o,oi)=>'<td><button type="button" class="cell" data-o="'+oi+'" data-c="'+c+'" data-v="0"></button></td>').join('')+'</tr>').join('')+
  '</tbody><tfoot><tr><th scope="row">Total</th>'+cfg.opts.map((o,oi)=>'<td data-tot="'+oi+'">0</td>').join('')+'</tr></tfoot></table></div>'+
  '<div class="meter" aria-label="Medidor de totales">'+cfg.opts.map((o,oi)=>'<div data-m="'+oi+'"><span>'+o.s+'</span><i><b style="width:0"></b></i><span class="mv">0</span></div>').join('')+'</div>'+
  '<h4>Control de coherencia</h4><ul class="rules">'+cfg.rules.map((r,ri)=>'<li data-r="'+ri+'"><span class="m">○</span><span>'+r.t+'</span></li>').join('')+'</ul>'+
  '<div class="stp"><span class="sl2">Mi elección</span><div class="chips" role="group" aria-label="Mi elección">'+cfg.opts.map((o,oi)=>'<button type="button" class="chip" data-pick="'+oi+'" aria-pressed="false">'+o.s+'</button>').join('')+'</div></div>'+
  '<div class="btnrow"><button type="button" class="btn sm" data-ex>Cargar ejemplo</button><button type="button" class="btn sm" data-clear>Limpiar</button><button type="button" class="btn sm" data-w aria-pressed="false"></button></div>'+
  '<p class="live" role="status"></p><p class="fb" data-msg></p>';
 const live=$('.live',el),msg=$('[data-msg]',el);
 function refresh(say){
  const t=tot(),max=Math.max(1,3*cfg.crit.reduce((a,_c,c)=>a+wt(c),0));
  $$('.cell',el).forEach(b=>{const v=get(+b.dataset.o,+b.dataset.c);b.dataset.v=v;b.textContent=v||'·';b.setAttribute('aria-label',cfg.opts[+b.dataset.o].n+', '+cfg.crit[+b.dataset.c].n+': '+(v?'puntaje '+v:'sin puntaje')+'. Pulsa para cambiar.');});
  const best=Math.max.apply(null,t);
  t.forEach((v,o)=>{$('[data-tot="'+o+'"]',el).textContent=v;const m=$('[data-m="'+o+'"]',el);$('b',m).style.width=(v/max*100)+'%';$('.mv',m).textContent=v;m.classList.toggle('top',v===best&&v>0);});
  const filled=Object.keys(M.s).filter(k=>M.s[k]>0).length===O*C;
  let allOk=true;
  cfg.rules.forEach((r,ri)=>{
   const vals=r.cells.map(x=>get(x[0],x[1])),pend=vals.some(v=>!v),ok=!pend&&r.ok(vals);
   const li=$('[data-r="'+ri+'"]',el);li.className=pend?'':(ok?'ok':'bad');$('.m',li).textContent=pend?'○':(ok?'✓':'✗');
   if(!ok)allOk=false;
  });
  $$('[data-pick]',el).forEach(b=>b.setAttribute('aria-pressed',+b.dataset.pick===M.pick));
  const wb=$('[data-w]',el);wb.setAttribute('aria-pressed',M.w);wb.textContent=M.w?'Volver al peso normal del impacto ambiental':'Duplicar el peso del impacto ambiental';
  let m='';
  if(filled){
   const order=t.map((v,o)=>[v,o]).sort((a,b)=>b[0]-a[0]).map(x=>cfg.opts[x[1]].s.split(' ')[0]+' ('+x[0]+')').join(', ');
   m='Orden por total: '+order+'.';
   if(M.pick>=0&&t[M.pick]<best)m+=' Tu opción no tiene el mayor total. Es válido si priorizaste otro criterio, pero debes explicar cuál y por qué.';
  }
  msg.textContent=m;
  if(say)live.textContent=say;
  if(filled&&allOk&&M.pick>=0){markDone(id);live.textContent=(say?say+' ':'')+'Matriz completa y coherente. Reto cumplido.';}else{clearDone(id);if(!say)live.textContent='';}
 }
 el.addEventListener('click',e=>{
  const c=e.target.closest('.cell');
  if(c){const k=c.dataset.o+'_'+c.dataset.c;M.s[k]=((M.s[k]||0)%3)+1;if(M.exampleCells)delete M.exampleCells[k];M.source=M.exampleCells&&Object.keys(M.exampleCells).length?'ejemplo':'estudiante';save();refresh('Puntaje '+M.s[k]+'.');return;}
  const p=e.target.closest('[data-pick]');if(p){M.pick=+p.dataset.pick;save();refresh('Elegiste la opción '+cfg.opts[M.pick].s+'.');return;}
  if(e.target.closest('[data-ex]')){M.exampleCells={};cfg.ex.forEach((row,o)=>row.forEach((v,c)=>{const k=o+'_'+c;M.s[k]=v;M.exampleCells[k]=true;}));M.source='ejemplo';save();refresh('Ejemplo cargado. Cámbialo si tu criterio es distinto y puedes justificarlo.');return;}
  if(e.target.closest('[data-clear]')){M.s={};M.exampleCells={};M.pick=-1;M.source='estudiante';save();refresh('Matriz limpia.');return;}
  if(e.target.closest('[data-w]')){M.w=!M.w;save();refresh(M.w?'El impacto ambiental ahora pesa el doble.':'El impacto ambiental vuelve a su peso normal.');return;}
 });
 refresh();
}
matrix('r8',{title:'Taller: el piso del pasillo',note:'g3_piso',
 instr:'El colegio reemplaza el piso de un pasillo cubierto con mucho tránsito y lluvia ocasional. Puntúa cada opción de 1 a 3 en cada criterio con la información de la guía.',
 opts:[
  {s:'A Baldosa',n:'A. Baldosa cerámica',info:'Superficie dura, durable y fácil de limpiar; resiste bien la humedad. Puede fracturarse por impactos fuertes y su fabricación requiere cocción a alta temperatura.'},
  {s:'B Madera',n:'B. Madera natural sin tratar',info:'Material renovable si proviene de manejo responsable, pero sin tratamiento puede absorber humedad, deformarse, pudrirse y requerir mantenimiento frecuente.'},
  {s:'C Vidrio común',n:'C. Vidrio común',info:'Es fácil de limpiar, pero el vidrio común de ventana no está diseñado para soportar cargas e impactos repetidos de un piso. También puede generar riesgo de deslizamiento y rotura.'},
  {s:'D Concreto',n:'D. Concreto pulido',info:'Muy resistente al desgaste y a la humedad; su vida útil puede ser larga. Requiere una ejecución adecuada y el cemento tiene un impacto ambiental importante durante su fabricación.'}],
 crit:[{n:'Resistencia al desgaste'},{n:'Comportamiento frente a la humedad'},{n:'Facilidad de limpieza'},{n:'Costo inicial (3 = más económico)'},{n:'Mantenimiento (3 = poco mantenimiento)'},{n:'Vida útil'},{n:'Impacto ambiental (3 = menor impacto)',amb:true}],
 rules:[
  {t:'Vidrio común: la resistencia al desgaste no puede ser alta (no está diseñado para cargas e impactos repetidos).',cells:[[2,0]],ok:v=>v[0]!==3},
  {t:'Vidrio común: la facilidad de limpieza es media o alta.',cells:[[2,2]],ok:v=>v[0]>=2},
  {t:'Madera sin tratar: ni la humedad ni el mantenimiento pueden ser altos (absorbe humedad y requiere mantenimiento frecuente).',cells:[[1,1],[1,4]],ok:v=>v[0]!==3&&v[1]!==3},
  {t:'Baldosa cerámica: humedad y limpieza son medias o altas.',cells:[[0,1],[0,2]],ok:v=>v[0]>=2&&v[1]>=2},
  {t:'Baldosa cerámica: el impacto ambiental no puede ser alto (su fabricación requiere cocción a alta temperatura).',cells:[[0,6]],ok:v=>v[0]!==3},
  {t:'Concreto pulido: desgaste y vida útil son medios o altos.',cells:[[3,0],[3,5]],ok:v=>v[0]>=2&&v[1]>=2},
  {t:'Concreto pulido: el impacto ambiental no puede ser alto (el cemento pesa en su fabricación).',cells:[[3,6]],ok:v=>v[0]!==3}],
 ex:[[3,3,3,2,3,3,2],[2,1,2,2,1,1,3],[1,3,3,2,2,1,2],[3,3,2,3,2,3,1]]});
matrix('r10',{title:'Matriz de decisión de la cubierta',note:'g4_elec',
 instr:'Valora cada alternativa de 1 a 3 en cada criterio. La matriz orienta la decisión, pero no la reemplaza: dos estudiantes pueden puntuar distinto si explican sus razones.',
 opts:[
  {s:'A Teja de barro',n:'A. Teja de barro (cerámica)',info:'Buen comportamiento térmico y tradición de uso; puede durar muchos años. Es pesada y frágil ante impactos puntuales, por lo que necesita una estructura de soporte adecuada. Su fabricación requiere cocción.'},
  {s:'B Lámina metálica',n:'B. Lámina metálica ondulada o galvanizada',info:'Liviana, resistente, de instalación relativamente sencilla y reciclable como metal. Puede calentarse mucho al sol, transmitir ruido de la lluvia y corroerse si pierde la protección superficial.'},
  {s:'C Teja plástica',n:'C. Teja plástica (polímero, tipo PVC)',info:'Liviana, resistente a la humedad y a la corrosión. Puede presentar expansión térmica, deformación o pérdida de color por exposición prolongada al sol; su fin de vida depende de las opciones locales de reciclaje.'},
  {s:'D Panel sándwich',n:'D. Panel compuesto tipo sándwich',info:'Lámina metálica con núcleo aislante. Ofrece buen aislamiento térmico y acústico y bajo peso, pero tiene mayor costo y su reciclaje puede ser más complejo porque deben separarse materiales distintos.'}],
 crit:[{n:'Resistencia a lluvia y durabilidad'},{n:'Confort térmico'},{n:'Costo y facilidad de instalación (3 = más fácil y económico)'},{n:'Mantenimiento (3 = poco mantenimiento)'},{n:'Impacto ambiental y recuperación (3 = mejor)',amb:true}],
 rules:[
  {t:'Panel sándwich: el confort térmico es alto (buen aislamiento).',cells:[[3,1]],ok:v=>v[0]===3},
  {t:'Panel sándwich: costo e instalación no pueden ser altos (mayor costo).',cells:[[3,2]],ok:v=>v[0]!==3},
  {t:'Panel sándwich: el impacto ambiental y la recuperación no pueden ser altos (reciclaje más complejo).',cells:[[3,4]],ok:v=>v[0]!==3},
  {t:'Lámina metálica: el confort térmico no puede ser alto (se calienta mucho al sol).',cells:[[1,1]],ok:v=>v[0]!==3},
  {t:'Lámina metálica: el mantenimiento no puede ser alto (puede corroerse si pierde su protección).',cells:[[1,3]],ok:v=>v[0]!==3},
  {t:'Teja plástica: la durabilidad no puede ser alta (expansión térmica y degradación por el sol).',cells:[[2,0]],ok:v=>v[0]!==3},
  {t:'Teja de barro: costo e instalación no pueden ser altos (pesada, necesita estructura de soporte).',cells:[[0,2]],ok:v=>v[0]!==3}],
 ex:[[3,2,1,2,2],[2,1,3,2,3],[2,2,3,3,2],[3,3,2,3,2]]});

/* ---------- lista del documento final ---------- */
(function(){
 const L=DOC_CHECKLIST;
 const ul=$('#doc-list');
 ul.innerHTML=L.map((t,i)=>'<li><label><input type="checkbox" data-d="'+i+'"'+(S.chk[i]?' checked':'')+'> '+t+'</label></li>').join('');
 function p(){const n=Object.keys(S.chk).filter(k=>S.chk[k]).length;$('#doc-bar').style.width=(n/L.length*100)+'%';$('#doc-txt').textContent=n+' de '+L.length+' secciones listas.';}
 ul.addEventListener('change',e=>{const c=e.target.closest('[data-d]');if(!c)return;if(c.checked)S.chk[c.dataset.d]=true;else delete S.chk[c.dataset.d];save();p();});
 p();
})();


/* Respuestas abiertas y explicaciones ubicadas en la actividad correspondiente. */
(function(){
 const map={g1_casa:['r1','Materiales que reconozco en mi casa o barrio y en qué objeto los vi'],g1_cer:['r2','Un tipo de cerámica, su propiedad clave y dónde se usa'],g2_vidrio:['r3','Un uso del vidrio y la propiedad que lo hace adecuado (o inadecuado)'],g2_comp:['r4','Un material compuesto: sus componentes y la función de cada uno'],g3_ciclo:['r6','Un material y dos etapas de su ciclo de vida en las que genera impacto'],g3_accion:['r7','Una acción concreta que reduzca un impacto ambiental'],g3_piso:['r8','Mi elección para el piso y tres razones con evidencias'],g4_crit:['r9','Cinco criterios o restricciones de la cubierta y por qué importan'],g4_elec:['r10','Opción elegida y tres razones con evidencias'],g4_lim:['r10','Una limitación, un impacto ambiental y una acción para manejarlos'],g4_mejora:['r10','Qué mejoraría con más tiempo, información o presupuesto']};
 Object.keys(map).forEach(k=>{const [rid,label]=map[k],host=$('#reto-'+rid);if(!host)return;const box=document.createElement('label');box.className='evidence';box.textContent=label;const area=document.createElement('textarea');area.dataset.note=k;area.value=S.notes[k]||'';area.addEventListener('input',()=>{S.notes[k]=area.value;$$('[data-note="'+k+'"]').forEach(x=>{if(x!==area)x.value=area.value});save()});box.appendChild(area);host.appendChild(box)});
 renderIdentity($('#team'),S.team,save);
})();


/* ---------- informes por guía (estado actual, matrices completas y pendientes) ---------- */
function reportHTML(g){
 const tasks=GUIDES[g-1].retos,pending=[];let sections='';
 if(!identityNames(S.team).length)pending.push('Falta el nombre del estudiante o equipo.');
 if(!String(S.team&&S.team.curso||'').trim())pending.push('Falta el curso.');
 function renderRowAnswer(id){const meta=RETO_REPORT_CATALOG[id]||{title:id,instr:'',rows:[]},answers=S.a[id]||{};let rows='';meta.rows.forEach(function(r,i){const values=Array.isArray(answers[i])?answers[i]:[];const answered=values.length>=r.steps.length&&r.steps.every(function(step,k){return values[k]!==undefined&&step.choices[values[k]]!==undefined}),correct=answered&&r.steps.every(function(step,k){return values[k]===r.expected[k]});rows+='<tr><th>'+esc(r.text)+'</th><td>'+r.steps.map(function(step,k){const ix=values[k],choice=ix==null?'Sin responder':step.choices[ix]===undefined?'Respuesta inválida':step.choices[ix];return '<p><b>'+esc(step.label)+':</b> '+esc(choice)+'</p>'}).join('')+'</td><td>'+(correct?'Correcta':answered?'Incorrecta; requiere corrección':'Pendiente')+'</td></tr>';if(!correct)pending.push(id+' · '+r.text+(answered?' respondida incorrectamente.':' sin respuesta completa.'));});if(!meta.rows.length)rows='<tr><td colspan="3">Esta actividad no usa selección por filas; revisa sus evidencias específicas.</td></tr>';return '<div class="report-choice-scroll" role="region" aria-label="Pregunta, respuesta y estado; desplázate horizontalmente en pantallas pequeñas" tabindex="0"><table class="report-choice-table"><colgroup><col style="width:44%"><col style="width:36%"><col style="width:20%"></colgroup><thead><tr><th>Pregunta o caso</th><th>Respuesta elegida</th><th>Estado</th></tr></thead><tbody>'+rows+'</tbody></table></div>'}
 tasks.forEach(function(id){const root=$('#reto-'+id),mx=S.mx[id],done=!!S.done[id],title=root&&root.querySelector('h3')?root.querySelector('h3').textContent:(RETO_REPORT_CATALOG[id]&&RETO_REPORT_CATALOG[id].title)||id;let body='<p><b>Enunciado:</b> '+esc(RETO_REPORT_CATALOG[id]&&RETO_REPORT_CATALOG[id].instr||'Consulta el enunciado completo de la actividad en la guía.')+'</p><p><b>Marca de progreso:</b> '+(done?'Completado':'Pendiente')+'.</p>';
 if(!done)pending.push(id+' · '+title+' pendiente o con respuestas que requieren corrección.');
 if(RETO_REPORT_CATALOG[id]&&RETO_REPORT_CATALOG[id].rows.length)body+=renderRowAnswer(id);
 if(id==='r6'){const order=S.ord.r6,ordered=Array.isArray(order)&&order.length===LIFECYCLE.length;body+='<h3>Orden del ciclo de vida</h3><table><thead><tr><th>Posición propuesta</th><th>Etapa elegida</th><th>Posición esperada</th></tr></thead><tbody>'+LIFECYCLE.map(function(_,i){const choice=ordered?order[i]:undefined;return '<tr><td>'+(i+1)+'</td><td>'+esc(choice===undefined?'Sin responder':LIFECYCLE[choice]||'Índice inválido')+'</td><td>'+esc(LIFECYCLE[i])+'</td></tr>'}).join('')+'</tbody></table>';if(!ordered||!done)pending.push('r6 · falta completar y comprobar el orden de las seis etapas.')}
 if(mx&&mx.meta){const m=mx.meta,score=(oi,ci)=>+(mx.s&&mx.s[oi+'_'+ci]||0),weight=ci=>mx.w&&m.criteria[ci].amb?2:1,totals=m.options.map(function(_,oi){return m.criteria.reduce(function(t,_,ci){return t+score(oi,ci)*weight(ci)},0)});body+='<h3>Matriz de decisión</h3><p>'+((mx.exampleCells&&Object.keys(mx.exampleCells).length)?'Cada celda marcada “ejemplo” es un dato de muestra.':'Los puntajes sin marca de ejemplo son los registrados por el estudiante.')+' Peso del impacto ambiental: '+(mx.w?'doble':'normal')+'.</p><table><thead><tr><th>Criterio y peso</th>'+m.options.map(o=>'<th>'+esc(o.name)+'</th>').join('')+'</tr></thead><tbody>'+m.criteria.map(function(c,ci){return '<tr><th>'+esc(c.name)+' · ×'+weight(ci)+'</th>'+m.options.map(function(_,oi){const cell=oi+'_'+ci;return '<td>'+score(oi,ci)+(mx.exampleCells&&mx.exampleCells[cell]?' <small>(ejemplo)</small>':'')+'</td>'}).join('')+'</tr>'}).join('')+'<tr><th>Total ponderado</th>'+totals.map(x=>'<td>'+x+'</td>').join('')+'</tr></tbody></table><p><b>Elección:</b> '+esc(mx.pick>=0&&m.options[mx.pick]?m.options[mx.pick].name:'Sin elegir')+'. '+(Math.max.apply(null,totals)>0&&totals.filter(x=>x===Math.max.apply(null,totals)).length>1?'Hay empate en el mayor total.':'')+'</p>';
 m.criteria.forEach(function(c,ci){m.options.forEach(function(o,oi){const value=mx.s&&mx.s[oi+'_'+ci];if(!(Number.isInteger(value)&&value>=1&&value<=3))pending.push(id+' · falta puntuar «'+c.name+'» para '+o.name+'.')})});if(mx.pick<0)pending.push(id+' · falta elegir una alternativa.');}
 const noteMap={r1:[['g1_casa','Materiales que reconozco en mi casa o barrio y en qué objeto los vi']],r2:[['g1_cer','Un tipo de cerámica, su propiedad clave y dónde se usa']],r3:[['g2_vidrio','Un uso del vidrio y la propiedad que lo hace adecuado o inadecuado']],r4:[['g2_comp','Material compuesto, componentes y función de cada uno']],r6:[['g3_ciclo','Material y dos etapas de su ciclo de vida con impacto']],r7:[['g3_accion','Acción concreta para reducir un impacto ambiental']],r8:[['g3_piso','Elección del piso y tres razones con evidencias']],r9:[['g4_crit','Cinco criterios o restricciones y por qué importan']],r10:[['g4_elec','Opción elegida y tres razones con evidencias'],['g4_lim','Limitación, impacto ambiental y acción para manejarlo'],['g4_mejora','Mejora con más tiempo, información o presupuesto']]}[id]||[];
 if(noteMap.length){body+='<h3>Respuestas y justificaciones</h3><table><tbody>'+noteMap.map(function(x){const value=(S.notes[x[0]]||'').trim();if(!value)pending.push(id+' · falta «'+x[1]+'».');return '<tr><th>'+esc(x[1])+'</th><td>'+esc(value||'Pendiente')+'</td></tr>'}).join('')+'</tbody></table>'}
 sections+= '<section><h2>'+esc(id+' · '+title)+'</h2>'+body+'</section>';
 });
 if(g===4){let checklistBody='<h2>Checklist de la propuesta final</h2><table><thead><tr><th>Ítem</th><th>Estado</th></tr></thead><tbody>'+DOC_CHECKLIST.map(function(label,i){const checked=!!S.chk[i];if(!checked)pending.push('Checklist de la propuesta · '+label+'.');return '<tr><th>'+esc(label)+'</th><td>'+(checked?'Listo':'Pendiente')+'</td></tr>'}).join('')+'</tbody></table>';sections+=checklistBody;}
 const pendingHTML=pending.length?'<ul>'+pending.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p>Sin pendientes registrados.</p>';
 return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Informe Tecnología 8 · Guía '+g+'</title><style>.report-choice-scroll{max-width:100%;overflow-x:auto}.report-choice-table{width:100%;min-width:560px;table-layout:fixed}.report-choice-table th,.report-choice-table td{overflow-wrap:normal!important;word-break:normal!important}.report-choice-table th:last-child,.report-choice-table td:last-child{min-width:7em}@media print{.report-choice-scroll{overflow:visible!important}.report-choice-table{min-width:0!important}}body{font:15px/1.5 system-ui,sans-serif;color:#17243b;margin:0}.page{max-width:900px;margin:24px auto;padding:28px}table{border-collapse:collapse;width:100%;margin:12px 0 20px}td,th{border:1px solid #9aa8b8;padding:7px;text-align:left;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}th{background:#edf2f8}.actions{margin-bottom:18px}.pending{background:#fff3d2;padding:12px}button{min-height:44px;padding:8px 14px;font:inherit}@page{size:A4;margin:16mm}@media print{.page{margin:0;padding:0}.actions{display:none}thead{display:table-header-group}tr{break-inside:avoid}}</style><main class="page"><div class="actions"><button onclick="window.print()">Imprimir / guardar PDF</button></div><p>Instituto Técnico Veintiséis de Marzo · Tecnología · Grado octavo · Periodo 4</p><h1>Informe de la Guía '+g+'</h1>'+identityReport(S.team,esc)+'<p>Generado: '+esc(new Date().toLocaleString('es-CO'))+'</p>'+sections+'<h2>Pendientes</h2><div class="pending">'+pendingHTML+'</div></main></html>';
}
let integratedReportReturn=null;
function closeIntegratedReport(){const view=$('#integratedReportView'),saved=integratedReportReturn;if(!view)return;window.removeEventListener('afterprint',closeIntegratedReport);view.remove();document.body.classList.remove('integrated-report-open');integratedReportReturn=null;if(saved){window.scrollTo({left:0,top:saved.scrollY,behavior:'instant'});if(saved.focus&&document.contains(saved.focus))saved.focus.focus({preventScroll:true})}}
function showIntegratedReport(html,download,status){const parsed=new DOMParser().parseFromString(html,'text/html'),source=parsed.querySelector('main.page')||parsed.querySelector('main')||parsed.body;if(!source)return false;const old=$('#integratedReportView');if(old)closeIntegratedReport();if(!$('#integratedReportStyles')){const style=document.createElement('style');style.id='integratedReportStyles';style.textContent='.report-choice-scroll{max-width:100%;overflow-x:auto}.report-choice-table{width:100%;min-width:560px;table-layout:fixed}.report-choice-table th,.report-choice-table td{overflow-wrap:normal!important;word-break:normal!important}.report-choice-table th:last-child,.report-choice-table td:last-child{min-width:7em}@media print{.report-choice-scroll{overflow:visible!important}.report-choice-table{min-width:0!important}}#integratedReportView{position:fixed;inset:0;z-index:10000;overflow:auto;background:#eef2f7;padding:12px 16px 32px;color:#17243b}#integratedReportView .report-toolbar{position:sticky;top:0;z-index:1;display:flex;flex-wrap:wrap;gap:8px;align-items:center;max-width:920px;margin:0 auto 14px;padding:10px;background:#fff;border:1px solid #cbd5e1;border-radius:12px;box-shadow:0 2px 8px #17243b22}#integratedReportView .report-toolbar button{min-height:44px;padding:8px 14px;border:2px solid #17243b;border-radius:9px;background:#fff;color:#17243b;font:700 15px system-ui,sans-serif;cursor:pointer}#integratedReportView .report-toolbar button:first-child{background:#3b6bb5;color:#fff}#integratedReportView .report-toolbar button:focus-visible{outline:3px solid #175ac1;outline-offset:3px}#integratedReportView .report-view-status{margin-left:auto;font:14px system-ui,sans-serif}#integratedReportView .page{box-sizing:border-box;max-width:920px;margin:0 auto;padding:28px;background:#fff;color:#17243b;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 2px 12px #17243b22}#integratedReportView .page h1,#integratedReportView .page h2,#integratedReportView .page h3{line-height:1.25;break-after:avoid}#integratedReportView .page p{overflow-wrap:anywhere}#integratedReportView .page table{width:100%;border-collapse:collapse;margin:12px 0 22px}#integratedReportView .page th,#integratedReportView .page td{border:1px solid #9ba8ba;padding:7px 9px;text-align:left;vertical-align:top;overflow-wrap:anywhere;white-space:pre-wrap}#integratedReportView .page th{background:#edf2f8}#integratedReportView .page .pending{background:#fff4d6;padding:10px 16px}#integratedReportView .page .static-circuit{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin:8px 0;padding:9px;border:1px solid #9ba8ba}#integratedReportView .page .static-circuit strong{padding:5px;border:1px solid #59677b;background:#edf2f8}#integratedReportView .page .static-scene{border:1px solid #9ba8ba;padding:10px;background:#f5f8fc}#integratedReportView .page svg{display:block;max-width:100%;height:auto;margin:8px 0}#integratedReportView .page pre{white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:620px){#integratedReportView{padding:8px}#integratedReportView .page{padding:16px}#integratedReportView .report-view-status{flex-basis:100%;margin-left:0}}@page{size:A4;margin:16mm}@media print{html,body{margin:0!important;padding:0!important;background:#fff!important}body.integrated-report-open>:not(#integratedReportView){display:none!important}#integratedReportView{display:block!important;position:static!important;inset:auto!important;overflow:visible!important;padding:0!important;background:#fff!important;color:#000!important}#integratedReportView .report-toolbar{display:none!important}#integratedReportView .page{max-width:none!important;margin:0!important;padding:0!important;box-shadow:none!important;border:0!important;color:#000!important}#integratedReportView .page table{break-inside:auto}#integratedReportView .page tr,#integratedReportView .page svg,#integratedReportView .page .static-scene,#integratedReportView .page .static-circuit{break-inside:avoid}#integratedReportView .page th{print-color-adjust:exact;-webkit-print-color-adjust:exact}}';document.head.appendChild(style)}const view=document.createElement('section');view.id='integratedReportView';view.tabIndex=-1;view.setAttribute('role','region');view.setAttribute('aria-label','Informe de la guía');const toolbar=document.createElement('div');toolbar.className='report-toolbar';const printButton=document.createElement('button');printButton.type='button';printButton.textContent='Imprimir / guardar PDF';const downloadButton=document.createElement('button');downloadButton.type='button';downloadButton.textContent='Descargar HTML';const backButton=document.createElement('button');backButton.type='button';backButton.textContent=location.hash==='#cuaderno'?'Volver a Mis reportes':'Volver a la guía';const live=document.createElement('span');live.className='report-view-status';live.setAttribute('role','status');live.setAttribute('aria-live','polite');const content=source.cloneNode(true);content.querySelectorAll('script,.actions').forEach(x=>x.remove());integratedReportReturn={scrollY:window.scrollY,focus:document.activeElement};printButton.addEventListener('click',()=>window.print());downloadButton.addEventListener('click',()=>{download();live.textContent='Descarga del informe HTML solicitada.'});backButton.addEventListener('click',closeIntegratedReport);view.addEventListener('keydown',e=>{if(e.key==='Escape')closeIntegratedReport()});toolbar.append(printButton,downloadButton,backButton,live);view.append(toolbar,content);document.body.appendChild(view);document.body.classList.add('integrated-report-open');live.textContent=status||'Informe listo.';window.addEventListener('afterprint',closeIntegratedReport);window.scrollTo({left:0,top:0,behavior:'instant'});view.focus();return true}
function downloadReportHtml(g,status){const html=reportHTML(g),url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='Informe_Tecnologia_G'+g+'_'+(S.team.curso||'equipo').replace(/[^a-z0-9_-]/gi,'_')+'.html';document.body.appendChild(a);a.click();a.remove();if(status)status.textContent='Informe HTML descargado.';setTimeout(()=>URL.revokeObjectURL(url),30000)}
function addReports(){for(let g=1;g<=4;g++){const sec=$('#guia'+g),box=document.createElement('section');box.className='deliver guide-report';box.innerHTML='<h3>Informe de la guía '+g+'</h3><p>Reúne tus respuestas actuales y los pendientes de esta guía.</p><div class="report-actions"><button class="btn blue" type="button" data-report-open="'+g+'">Ver informe</button> <button class="btn" type="button" data-report-print="'+g+'">Imprimir / guardar PDF</button> <button class="btn" type="button" data-report-dl="'+g+'">Descargar HTML</button><span role="status" id="report-status-'+g+'"></span></div>';sec.insertBefore(box,sec.querySelector('.pager'));box.addEventListener('click',e=>{const target=e.target.closest('button[data-report-open],button[data-report-print],button[data-report-dl]');if(!target)return;const guide=+(target.dataset.reportOpen||target.dataset.reportPrint||target.dataset.reportDl),st=$('#report-status-'+guide);save();if(target.dataset.reportPrint){openOctavoReport(guide,true)}else if(target.dataset.reportOpen){if(showIntegratedReport(reportHTML(guide),()=>downloadReportHtml(guide,st),'Informe de la Guía '+guide+'. Vuelve a la guía al terminar.'))st.textContent='Informe mostrado en esta página.';else st.textContent='No se pudo preparar la vista del informe.'}else downloadReportHtml(guide,st)})}}
function restoreOctavoBackup(o){if(!validBackup(o))throw Error('El archivo no es un respaldo v2 de Tecnología 8.');rememberR2Backup(JSON.stringify(o),'-importado-antes-r2');S=o;S.team=normalizeIdentity(S.team,S.notes.nombre,S.notes.curso);if(!save())throw Error('No se pudo guardar el respaldo en este dispositivo.');return true}
function bindBackup(){const out=$('#backup-out'),input=$('#backup-in'),file=$('#backup-file');out.addEventListener('click',()=>{save();const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));a.href=url;a.download='Respaldo_Tecnologia8.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)});input.addEventListener('click',()=>file.click());file.addEventListener('change',()=>{const f=file.files&&file.files[0];if(!f)return;if(f.size>5*1024*1024){$('#nb-status').textContent='El archivo supera el tamaño permitido (5 MB).';file.value='';return}const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);restoreOctavoBackup(o);location.reload()}catch(e){$('#nb-status').textContent=e.message}file.value=''};r.readAsText(f)})}
addReports();bindBackup();

function renderOctavoReports(){var titles=['Materiales de construcción y cerámicas','Vidrio y materiales compuestos','Impacto ambiental y selección de materiales','Propuesta con materiales de construcción'],labels={};GUIDES.forEach(function(g){g.retos.forEach(function(id){var heading=$('#reto-'+id+' h3');labels[id]=heading?heading.textContent:RETO_REPORT_CATALOG[id]&&RETO_REPORT_CATALOG[id].title||'Actividad'})});renderReportOverview($('#reportCards'),titles.map(function(title,i){return {n:i+1,title:title}}),reportHTML,labels,{view:function(g){openOctavoReport(g,false)},print:function(g){openOctavoReport(g,true)},download:function(g){downloadReportHtml(g,$('#nb-status'))}})}
function openOctavoReport(g,print){save();if(showIntegratedReport(reportHTML(g),function(){downloadReportHtml(g,$('#nb-status'))},'Informe de la Guía '+g+'. Usa Volver al terminar.')&&print)window.print()}

/* ---------- pie ---------- */
$('#get-copy').addEventListener('click',()=>{CopiaPagina.descargar('tecnologia8-guia-interactiva.html').catch(e=>alert(e.message));});
const dlg=$('#dlg');
$('#wipe').addEventListener('click',()=>dlg.showModal());
$('#dlg-no').addEventListener('click',()=>dlg.close());
$('#dlg-yes').addEventListener('click',()=>{try{localStorage.removeItem(KEY);}catch(e){}dlg.close();location.reload();});

/* ---------- pestañas ---------- */
const TABS=[
 {id:'inicio',n:'Inicio',t:'Inicio · Tecnología 8, guía interactiva',h:'#inicio h1'},
 {id:'guia1',n:'Guía 1',t:'Guía 1 · Materiales de construcción: clasificación y cerámicas',h:'#t1'},
 {id:'guia2',n:'Guía 2',t:'Guía 2 · El vidrio y los materiales compuestos',h:'#t2'},
 {id:'guia3',n:'Guía 3',t:'Guía 3 · Impacto ambiental y selección de materiales',h:'#t3'},
 {id:'guia4',n:'Guía 4',t:'Guía 4 · Cierre: proponiendo una solución con materiales de construcción',h:'#t4'},
 {id:'cuaderno',n:'Mis reportes',t:'Mis reportes · Tecnología 8',h:'#tn'}];
let curTab=null;
(function(){
 TABS.forEach((tb,i)=>{
  const sec=document.getElementById(tb.id),d=document.createElement('div');d.className='wrap';
  let h='<nav class="pager" aria-label="Cambiar de pestaña">';
  if(i>0)h+='<a class="btn prev" href="#'+TABS[i-1].id+'" aria-label="Anterior: '+TABS[i-1].n+'">← Anterior<small>'+TABS[i-1].n+'</small></a>';
  if(i<TABS.length-1)h+='<a class="btn next" href="#'+TABS[i+1].id+'" aria-label="Siguiente: '+TABS[i+1].n+'">Siguiente →<small>'+TABS[i+1].n+'</small></a>';
  d.innerHTML=h+'</nav>';sec.appendChild(d);
 });
})();
function route(){
 let tb=TABS.find(x=>x.id===location.hash.slice(1));
 if(!tb){if(curTab)return;tb=TABS[0];}
 TABS.forEach(x=>{document.getElementById(x.id).hidden=x.id!==tb.id;});
 $$('#tabs a').forEach(a=>{if(a.dataset.tab===tb.id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(tb.id==='cuaderno')renderOctavoReports();
 document.title=tb.t;
 const nav=$('#tabs'),act=$('#tabs a[aria-current]');if(act)nav.scrollLeft=act.offsetLeft-nav.clientWidth/2+act.offsetWidth/2;
 if(curTab!==tb.id){
  window.scrollTo({top:0,left:0,behavior:'instant'});
  if(curTab!==null){const h=$(tb.h);if(h)h.focus({preventScroll:true});}
 }
 curTab=tb.id;
}
window.addEventListener('hashchange',route);
$('#tabs').addEventListener('click',e=>{const l=e.target.closest('a[data-tab]');if(l&&l.dataset.tab===curTab){e.preventDefault();window.scrollTo({top:0,left:0,behavior:'instant'});const t=TABS.find(x=>x.id===curTab),h=$(t.h);if(h)h.focus({preventScroll:true});}});
route();

updateAll();
