
const CODES={"m10_prueba": "// Misión 10: probar el motor (prende 3 s, apaga 2 s)\nconst int pinMotor = 9;         // D9 manda la orden al transistor\n\nvoid setup() {\n  pinMode(pinMotor, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(pinMotor, HIGH); // motor encendido\n  delay(3000);\n  digitalWrite(pinMotor, LOW);  // motor apagado\n  delay(2000);\n}\n", "m11_pwm": "// Misión 11: velocidad con PWM\nconst int pinMotor = 9;         // D9 tiene el símbolo ~ : sí puede hacer PWM\nint valor = 128;                // CAMBIA ESTE NÚMERO: de 0 (quieto) a 255 (máximo)\n\nvoid setup() {\n  pinMode(pinMotor, OUTPUT);\n}\n\nvoid loop() {\n  analogWrite(pinMotor, valor); // prende y apaga D9 muy rápido\n}\n", "m12_rampa": "// Misión 12: rampa de velocidad (acelera y frena suave)\nconst int pinMotor = 9;\n\nvoid setup() {\n  pinMode(pinMotor, OUTPUT);\n}\n\nvoid loop() {\n  // Acelerar: v va de 0 a 255 de 5 en 5\n  for (int v = 0; v <= 255; v = v + 5) {\n    analogWrite(pinMotor, v);\n    delay(100);\n  }\n  delay(2000);                  // un momento a máxima velocidad\n\n  // Frenar: v va de 255 a 0 de 5 en 5\n  // COMPLETA AQUÍ con otro for (pista: empieza en 255 y resta 5)\n\n  delay(2000);                  // un momento quieto antes de repetir\n}\n", "m15_ventilador": "// Misión 15: ventilador inteligente\n#include <Adafruit_LiquidCrystal.h>\n\nAdafruit_LiquidCrystal lcd(0);\n\nconst int pinSensor = A0;\nconst int pinMotor = 9;\nconst int T_MIN = 30;           // desde esta temperatura empieza a girar\nconst int T_MAX = 40;           // a esta temperatura gira al máximo\n\nvoid setup() {\n  lcd.begin(16, 2);\n  lcd.setBacklight(1);\n  pinMode(pinMotor, OUTPUT);\n}\n\nvoid loop() {\n  // 1. Leer la temperatura\n  int lectura = analogRead(pinSensor);\n  float temp = (lectura * (5.0 / 1023.0) - 0.5) * 100.0;\n  int t = round(temp);          // temperatura sin decimales\n\n  // 2. Convertir temperatura en porcentaje de velocidad\n  int porcentaje = map(t, T_MIN, T_MAX, 0, 100);\n  // COMPLETA: limita el porcentaje entre 0 y 100 con constrain\n\n  // 3. Convertir el porcentaje en valor PWM (0 a 255) y mover el motor\n  int pwm = map(porcentaje, 0, 100, 0, 255);\n  // COMPLETA: envía pwm al motor con analogWrite\n\n  // 4. Mostrar en la pantalla\n  lcd.setCursor(0, 0);\n  lcd.print(\"Temp: \");\n  lcd.print(temp, 1);\n  lcd.print(\" C   \");\n  lcd.setCursor(0, 1);\n  lcd.print(\"Vent: \");\n  lcd.print(porcentaje);\n  lcd.print(\" %      \");\n\n  delay(500);\n}\n", "reto_g2": "// Reto extra: ventilador con promedio (no reacciona a saltos breves)\n#include <Adafruit_LiquidCrystal.h>\n\nAdafruit_LiquidCrystal lcd(0);\n\nconst int pinSensor = A0;\nconst int pinMotor = 9;\nconst int T_MIN = 30;\nconst int T_MAX = 40;\nconst int N = ;                 // TU DECISIÓN: cuántas lecturas promediar (de 3 a 10)\n\nfloat lecturas[N];\nint pos = 0;\nint cantidad = 0;\n\nvoid setup() {\n  lcd.begin(16, 2);\n  lcd.setBacklight(1);\n  pinMode(pinMotor, OUTPUT);\n}\n\nvoid loop() {\n  float temp = (analogRead(pinSensor) * (5.0 / 1023.0) - 0.5) * 100.0;\n\n  lecturas[pos] = temp;\n  pos = (pos + 1) % N;\n  if (cantidad < N) cantidad++;\n\n  float suma = 0;\n  for (int i = 0; i < cantidad; i++) {\n    suma += lecturas[i];\n  }\n  float promedio = suma / cantidad;\n\n  int porcentaje = map(round(promedio), T_MIN, T_MAX, 0, 100);\n  porcentaje = constrain(porcentaje, 0, 100);\n  analogWrite(pinMotor, map(porcentaje, 0, 100, 0, 255));\n\n  lcd.setCursor(0, 0);\n  lcd.print(\"Prom: \");\n  lcd.print(promedio, 1);\n  lcd.print(\" C   \");\n  lcd.setCursor(0, 1);\n  lcd.print(\"Vent: \");\n  lcd.print(porcentaje);\n  lcd.print(\" %      \");\n\n  delay(1000);\n}\n"};
const $=id=>document.getElementById(id);
const KEY='g2v2-11elec';
let S={};try{S=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const num=id=>{const v=String(($(id)||{}).value||'').trim().replace(',','.').replace('%','');return v===''?NaN:Number(v)};
const f2=(x,d=2)=>Number(x).toFixed(d).replace('.',',');
const fb=(id,msg,k)=>{$(id).innerHTML='<div class="note '+(k||'')+'">'+msg+'</div>'};
const OPT3=['Funciona normal','Funciona distinto (más lento, o solo prende y apaga)','No funciona'];
document.querySelectorAll('select.opt3').forEach(s=>{s.innerHTML='<option value="">Elige</option>'+OPT3.map(o=>'<option>'+o+'</option>').join('')});
const OPTK=[['a','Limita la corriente que entra a la base'],['b','Protege al transistor cuando el motor se apaga'],['c','Funciona como interruptor controlado: prende y apaga el motor'],['d','Convierte la temperatura en voltaje'],['e','Muestra la temperatura y la velocidad']];
const ANSK={k_rb:'a',k_d:'b',k_q:'c',k_tmp:'d',k_lcd:'e'};
const OPTP=[['a','Lee el voltaje del sensor (0 a 1023)'],['b','Convierte la temperatura en un porcentaje'],['c','Evita que el porcentaje baje de 0 o pase de 100'],['d','Manda la velocidad al motor con PWM'],['e','Escribe el porcentaje en la pantalla']];
const ANSP={p_read:'a',p_map:'b',p_con:'c',p_aw:'d',p_lcd:'e'};
const fillOpt=(cls,arr)=>document.querySelectorAll('select.'+cls).forEach(s=>{s.innerHTML='<option value="">Elige</option>'+arr.map(([v,t])=>'<option value="'+v+'">'+t+'</option>').join('')});
fillOpt('optk',OPTK);fillOpt('optp',OPTP);

function goName(){go('inicio');const n=$('nombre');if(n){n.focus();n.scrollIntoView({block:'center'});}let m=$('nombreMsg');if(!m&&n){m=document.createElement('p');m.id='nombreMsg';m.className='fb bad';m.setAttribute('role','alert');n.parentNode.appendChild(m)}if(m){m.textContent='👆 Escribe aquí tu nombre (o el del equipo) para poder descargar el reporte.';n.addEventListener('input',()=>{m.textContent=''},{once:true})}}
function go(t){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id===t));
  document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===t?'true':'false'));S._tab=t;save();if(t==='reporte')summary();window.scrollTo(0,0)}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>go(b.dataset.tab)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
document.querySelectorAll('.map a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();document.querySelector(a.getAttribute('href')).scrollIntoView({behavior:'smooth'})}));
document.querySelectorAll('[data-save]').forEach(e=>{
  if(S[e.id]!==undefined){if(e.type==='checkbox')e.checked=!!S[e.id];else e.value=S[e.id]}
  const ev=(e.type==='checkbox'||e.tagName==='SELECT')?'change':'input';
  e.addEventListener(ev,()=>{S[e.id]=e.type==='checkbox'?e.checked:e.value;save();if(e.dataset.ans!==undefined)quiz(e)})});
const QFB={m10_q1:['fbq10a','Correcto: con 1 kΩ entra más corriente a la base y el transistor se satura aunque el motor pida más.','Recuerda la llave de agua: un motor necesita que la llave se abra del todo.'],
 m10_q2:['fbq10b','Correcto: es el camino seguro para la corriente que empuja el motor al apagarse.','Piensa en la rueda pesada que sigue girando cuando la apagas.'],
 m11_onda:['fbq11a','Correcto: la altura siempre es 5 V; lo que cambia es cuánto tiempo está arriba.','Mira bien: ¿la onda sube más o se queda más tiempo arriba?'],
 m12_q1:['fbq12a','Correcto: 52 pasos × 100 ms ≈ 5,2 s.','Cuenta: de 0 a 255 de 5 en 5 son unos 52 pasos, y cada paso espera 100 ms.'],
 m12_q2:['fbq12b','Correcto: la velocidad máxima es la misma; solo llega antes.','La velocidad máxima depende de 255, no del delay.'],
 m13_q:['fbq13','Correcto: un simulador no muestra todo. En un circuito real, el diodo protege al transistor.','En la vida real el pico de corriente del motor puede dañar el transistor con el tiempo.']};
function quiz(e){const q=QFB[e.id];if(!q||!e.value)return;const ok=e.value===e.dataset.ans;fb(q[0],ok?q[1]:q[2],ok?'ok':'bad')}
document.querySelectorAll('[data-ans]').forEach(e=>{if(e.value)quiz(e)});

function hl(src){const h=src.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const re=/(\/\/ ?(?:COMPLETA|TU DECISIÓN|CAMBIA)[^\n]*)|(\/\/[^\n]*)|("[^"\n]*")|(#include\s*&lt;[^&\n]*&gt;)|\b(const|int|float|void|for|if|else)\b|\b(pinMode|digitalWrite|analogWrite|analogRead|delay|setup|loop|begin|setBacklight|setCursor|print|map|constrain|round)\b|\b(HIGH|LOW|OUTPUT|A0|\d+(?:\.\d+)?)\b/g;
  return h.replace(re,(m,todo,c,st,inc,kw,fn,nu)=>'<span class="'+(todo?'todo':c?'cm':st?'st':inc||kw?'kw':fn?'fn':'nu')+'">'+m+'</span>')}
document.querySelectorAll('div.code').forEach(c=>{const src=CODES[c.dataset.code];c.querySelector('pre').innerHTML=hl(src);
  c.querySelector('.copy').addEventListener('click',ev=>{const b=ev.currentTarget,done=()=>{b.textContent='Copiado ✓';setTimeout(()=>b.textContent='Copiar código',1600)};
    const fall=()=>{const t=document.createElement('textarea');t.value=src;document.body.appendChild(t);t.select();try{document.execCommand('copy');done()}catch(e){}t.remove()};
    if(navigator.clipboard)navigator.clipboard.writeText(src).then(done).catch(fall);else fall()})});

const MIS={10:'Del LED al motor',11:'Prender y apagar muy rápido',12:'Rampa de velocidad',13:'¿Qué pasa si...?',14:'Todo junto, ahora con motor',15:'Ventilador inteligente',16:'Ficha técnica de mi ventilador',17:'Mi código explicado',18:'Reto extra'};
const reqOf=m=>document.querySelector('[data-m="'+m+'"]').dataset.req.split(',');
const filled=id=>S[id]!==undefined&&String(S[id]).trim()!=='';
function paint(){let n=0;for(let m=10;m<=18;m++){const el=document.querySelector('[data-m="'+m+'"]');const d=!!S['done'+m];el.classList.toggle('done',d);if(d&&m<=17)n++;
  const a=document.querySelector('.map a[href="#m'+m+'"]');if(a)a.classList.toggle('done',d)}
  $('gcount').textContent=n+' de 8';$('gbar').style.width=(n/8*100)+'%'}
document.querySelectorAll('[data-finish]').forEach(b=>b.addEventListener('click',()=>{const m=b.dataset.finish;const miss=reqOf(m).filter(i=>!filled(i));
  if(miss.length){const lb=document.querySelector('label[for="'+miss[0]+'"]');fb('ff'+m,'Te falta completar '+miss.length+' dato(s)'+(lb?'. Empieza por: <b>'+lb.textContent.replace(/[<>&]/g,'').trim().slice(0,70)+'</b> (👆 ya te llevé a ese campo)':'')+'.','bad');const el=$(miss[0]);el.focus();el.scrollIntoView({block:'center'});return}
  if(!filled('nombre')){fb('ff'+m,'Escribe tu nombre en la pestaña Inicio.','bad');return}
  S['done'+m]=true;save();paint();fb('ff'+m,'¡Misión '+(m==18?'extra':m)+' completa!','ok')}));
paint();

/* fan helper */
function fan(id,frac){const g=$(id);if(frac<=0.01){g.style.animationPlayState='paused'}else{g.style.animationDuration=(0.15+ (1-frac)*1.6).toFixed(2)+'s';g.style.animationPlayState='running'}}
/* M11 PWM visual */
function pwm(){const v=+$('pwmS').value,p=v/255;$('pwmV').textContent=v;$('pwmP').textContent=Math.round(p*100)+' %';$('pwmB').style.width=(p*100)+'%';
  const per=80,hi=8,lo=110;let d='M10 '+lo;for(let k=0;k<4.8;k++){const x=10+k*per,w=per*p;
    if(p<=0){d+=' H'+(x+per)}else if(p>=1){d+=' V'+hi+' H'+(x+per)}else{d+=' V'+hi+' H'+(x+w)+' V'+lo+' H'+(x+per)}}
  $('wave').innerHTML='<line x1="10" y1="'+lo+'" x2="390" y2="'+lo+'" stroke="#2c4a36"/><line x1="10" y1="'+hi+'" x2="390" y2="'+hi+'" stroke="#2c4a36" stroke-dasharray="3 4"/><text x="392" y="'+(hi+4)+'" fill="#7fd3a3" font-size="10" text-anchor="end">5 V</text><text x="392" y="'+(lo-4)+'" fill="#7fd3a3" font-size="10" text-anchor="end">0 V</text><path d="'+d+'" fill="none" stroke="#7CFC8a" stroke-width="3"/><text x="12" y="132" fill="#9fb8a8" font-size="11">un ciclo ≈ 2 ms (490 veces por segundo)</text>';
  fan('fanB',p)}
$('pwmS').addEventListener('input',pwm);pwm();
$('m11_regla').addEventListener('input',()=>{const v=num('m11_regla');if(isNaN(v))return;const ok=Math.abs(v-102)<=3;fb('fbq11b',ok?'Correcto: 255 × 0,40 = 102.':'Pista: multiplica 255 por 0,40.',ok?'ok':'warn')});
/* M15 sim */
const adcT=T=>{const a=Math.floor((0.5+T/100)*1023/5);return (a*5/1023-0.5)*100};
const amap=(x,a,b,c,d)=>Math.trunc((x-a)*(d-c)/(b-a)+c);
function lcd(id,l1,l2){const p=s=>(s+' '.repeat(16)).slice(0,16);$(id).innerHTML=(p(l1)+p(l2)).split('').map(c=>'<span>'+(c===' '?'&nbsp;':c)+'</span>').join('')}
function sim15(){const T=+$('sim15').value;$('sim15l').textContent=String(T).replace('.',',')+' °C';const t=adcT(T),tr=Math.round(t);let pc=amap(tr,30,40,0,100);const con=$('sim15c').checked;
  if(con)pc=Math.max(0,Math.min(100,pc));lcd('lcd15','Temp: '+t.toFixed(1)+' C','Vent: '+pc+' %');const bad=pc<0||pc>100;$('sim15w').style.display=bad?'block':'none';fan('fan15',bad?0.5:pc/100)}
$('sim15').addEventListener('input',sim15);$('sim15c').addEventListener('change',sim15);sim15();
$('chk15').addEventListener('click',()=>{const ex={m15_25:0,m15_35:50,m15_40:100,m15_45:100};const bad=Object.keys(ex).filter(k=>isNaN(num(k))||Math.abs(num(k)-ex[k])>10);
  fb('fb15',bad.length?'Revisa: '+bad.map(k=>k.replace('m15_','')+' °C').join(', ')+'. Con constrain deberías ver 0 %, 50 %, 100 % y 100 %.':'¡Bien! 0 % (quieto), 50 % (medio), 100 % (máximo) y 100 % (constrain no deja pasar de 100).',bad.length?'warn':'ok')});
/* M16 */
$('chk16').addEventListener('click',()=>{const v0=num('m16_v0'),v255=num('m16_v255');if(isNaN(v0)||isNaN(v255)){fb('fb16','Escribe al menos V_CE con 0 y con 255.','bad');return}
  const ok=v0>3.5&&v255<0.6;fb('fb16',ok?'Sí: con 0 el transistor está en corte (V<sub>CE</sub> alto) y con 255 en saturación (V<sub>CE</sub> casi 0). Con 128 alterna entre los dos muy rápido.':'Con 0 deberías ver V<sub>CE</sub> cerca de 5 V (corte) y con 255 cerca de 0 V (saturación). Revisa las puntas del multímetro.',ok?'ok':'warn')});
const chkMatch=(ans,fbid)=>{const ks=Object.keys(ans);const bad=ks.filter(k=>$(k).value!==ans[k]);fb(fbid,bad.length?bad.length+' relación(es) por revisar.':'¡Todas correctas!',bad.length?'warn':'ok')};
$('chkK').addEventListener('click',()=>chkMatch(ANSK,'fbK'));$('chkP').addEventListener('click',()=>chkMatch(ANSP,'fbP'));

/* report */
const FIELDS={3:[[10,[['m10_gira','¿Gira 3 s y se detiene 2 s?'],['m10_ma','Corriente del motor (mA)'],['m10_q1','Por qué 1 kΩ'],['m10_q2','Para qué el diodo']]],
 [11,[['m11_r0','valor 0'],['m11_r64','valor 64'],['m11_r128','valor 128'],['m11_r191','valor 191'],['m11_r255','valor 255'],['m11_onda','Qué cambia en el osciloscopio'],['m11_regla','Valor para 40 %']]],
 [12,[['m12_ok','¿Acelera y frena?'],['m12_code','for para frenar'],['m12_q1','Tiempo de 0 a 255'],['m12_q2','Con delay(20)']]]],
 4:[[13,[['m13a_p','A. D8: predicción'],['m13a_o','A. D8: observación'],['m13b_p','B. 47 kΩ: predicción'],['m13b_o','B. 47 kΩ: observación'],['m13c_p','C. Sin diodo: predicción'],['m13c_o','C. Sin diodo: observación'],['m13_q','¿El diodo sobra?']]],
 [14,[['m14_med','Con valor 128 el motor'],['m14_lcd','¿La pantalla funciona?'],['m14_link','Enlace Tinkercad']]],
 [15,[['m15_25','25 °C'],['m15_35','35 °C'],['m15_40','40 °C'],['m15_45','45 °C'],['m15_code','Líneas agregadas'],['m15_sin','Sin constrain a 45 °C']]],
 [18,[['r_n','Reto: N elegido'],['r_t','Reto: segundos hasta 100 %'],['r_why','Reto: por qué sube poco a poco']]]],
 5:[[16,[['m16_v0','VCE con 0 (V)'],['m16_i0','Corriente con 0 (mA)'],['m16_v128','VCE con 128 (V)'],['m16_i128','Corriente con 128 (mA)'],['m16_v255','VCE con 255 (V)'],['m16_i255','Corriente con 255 (mA)'],['k_rb','Resistencia de base'],['k_d','Diodo D1'],['k_q','Transistor'],['k_tmp','Sensor TMP36'],['k_lcd','Pantalla LCD'],['m16_clave','Palabra clave del docente'],['m16_link','Enlace Tinkercad'],['m16_r1','Reflexión']]],
 [17,[['p_read','analogRead'],['p_map','map'],['p_con','constrain'],['p_aw','analogWrite'],['p_lcd','lcd.print'],['m17_code','Código final comentado'],['m17_t25','Prueba 25 °C'],['m17_t35','Prueba 35 °C'],['m17_t40','Prueba 40 °C'],['m17_r1','Reflexión']]]]};
function summary(){[3,4,5].forEach(k=>{$('sum'+k).innerHTML=FIELDS[k].map(([m,fs])=>{const done=!!S['done'+m];const miss=reqOf(m).filter(i=>!filled(i)).length;
  return '<li>'+(done?'✅':'⬜')+' '+(m===18?'Reto extra':'Misión '+m+' · '+MIS[m])+(done?'':(m===18?' (opcional)':(miss?' · faltan '+miss:' · pulsa Terminé')))+'</li>'}).join('')})}
const disp=id=>{const e=$(id);if(e&&e.tagName==='SELECT'){const o=e.options[e.selectedIndex];return o?o.text:S[id]}return S[id]};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function reportHTML(k){const rows=FIELDS[k].map(([m,fs])=>'<h2>'+(S['done'+m]?'✅':'⬜')+' '+(m===18?'Reto extra':'Misión '+m+' · '+esc(MIS[m]))+'</h2><table>'+fs.map(([i,l])=>'<tr><th>'+esc(l)+'</th><td>'+(filled(i)?esc(disp(i)):'<i>sin respuesta</i>')+'</td></tr>').join('')+'</table>').join('');
  return '<!doctype html><html lang="es"><meta charset="utf-8"><title>Reporte Sesión '+k+'</title><style>body{font:14px/1.45 Arial,sans-serif;max-width:800px;margin:24px auto;color:#17222d;padding:0 14px}h1{color:#1F4E79;font-size:20px;border-bottom:2px solid #1F4E79;padding-bottom:6px}h2{font-size:15px;margin:16px 0 4px;color:#1F4E79}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cdd6df;padding:6px 8px;text-align:left;vertical-align:top}th{width:38%;background:#eef3f8}td{white-space:pre-wrap}p.s{font-size:12px;color:#566472}</style>'+
  '<h1>Reporte Sesión '+k+' · Guía 2 · Electrónica 1 + Programación 2</h1><p><b>Progreso:</b> '+FIELDS[k].filter(([m])=>m<18&&S['done'+m]).length+' de '+FIELDS[k].filter(([m])=>m<18).length+' misiones terminadas'+(k===5&&S['done18']?' · reto extra terminado':'')+'.</p><p><b>Estudiantes:</b> '+esc(S.nombre||'')+' · <b>Curso:</b> '+esc(S.curso||'11 ELEC')+' · <b>Fecha:</b> '+new Date().toLocaleString('es-CO')+'</p>'+rows+'<p class="s">Instituto Técnico Veintiséis de Marzo · Reporte generado desde el laboratorio de misiones.</p></html>'}
document.querySelectorAll('[data-rep]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.rep;if(!filled('nombre')){goName();return}
  const blob=new Blob([reportHTML(k)],{type:'text/html;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;
  a.download='Reporte_G2_S'+k+'_'+String(S.nombre).replace(/[^\wáéíóúñÁÉÍÓÚÑ]+/g,'_').slice(0,40)+'.html';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}));
document.querySelectorAll('[data-pdf]').forEach(b=>b.addEventListener('click',()=>{const w=window.open('','_blank');if(!w){alert('Permite ventanas emergentes para guardar como PDF.');return}w.document.write(reportHTML(b.dataset.pdf));w.document.close();setTimeout(()=>w.print(),400)}));
if(S._tab&&$(S._tab))go(S._tab);
