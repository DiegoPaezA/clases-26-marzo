
const CODES={"m4_parpadeo": "// Misión 4: Arduino toma el control\nconst int pinLED = 9;           // D9 manda la orden al transistor\n\nvoid setup() {\n  pinMode(pinLED, OUTPUT);      // D9 será una salida\n}\n\nvoid loop() {\n  digitalWrite(pinLED, HIGH);   // orden: encender\n  delay(2000);                  // espera 2 segundos\n  digitalWrite(pinLED, LOW);    // orden: apagar\n  delay(2000);                  // espera 2 segundos\n}\n", "m5_morse": "// Misión 5: SOS en código Morse\nconst int pinLED = 9;\n\nvoid setup() {\n  pinMode(pinLED, OUTPUT);\n}\n\nvoid loop() {\n  // Letra S: tres puntos (destellos cortos)\n  for (int i = 0; i < 3; i++) {\n    digitalWrite(pinLED, HIGH);\n    delay(200);\n    digitalWrite(pinLED, LOW);\n    delay(200);\n  }\n  delay(400);                   // pausa entre letras\n\n  // Letra O: tres rayas (destellos largos de 600 ms)\n  // COMPLETA AQUÍ con otro for\n\n  delay(400);\n\n  // Letra S otra vez\n  // COMPLETA AQUÍ\n\n  delay(2000);                  // pausa antes de repetir el mensaje\n}\n", "m7_nombre": "// Misión 7: Mi nombre en pantalla (LCD 16x2 I2C en Tinkercad)\n#include <Adafruit_LiquidCrystal.h>\n\nAdafruit_LiquidCrystal lcd(0);  // pantalla I2C de Tinkercad\n\nvoid setup() {\n  lcd.begin(16, 2);             // 16 columnas y 2 filas\n  lcd.setBacklight(1);          // enciende la luz\n  lcd.setCursor(0, 0);          // columna 0, fila de arriba\n  lcd.print(\"Hola, soy\");\n  lcd.setCursor(0, 1);          // columna 0, fila de abajo\n  lcd.print(\"TU NOMBRE\");       // cambia esto (máximo 16 letras)\n}\n\nvoid loop() {\n}\n", "m9_alarma": "// Misión 9: Alarma de calor\n#include <Adafruit_LiquidCrystal.h>\n\nAdafruit_LiquidCrystal lcd(0);\n\nconst int pinSensor = A0;       // TMP36\nconst int pinLED = 9;           // transistor + LED\nconst float UMBRAL = 30.0;      // grados a partir de los cuales hay alarma\n\nvoid setup() {\n  lcd.begin(16, 2);\n  lcd.setBacklight(1);\n  pinMode(pinLED, OUTPUT);\n}\n\nvoid loop() {\n  // 1. Leer el sensor y convertir a grados\n  int lectura = analogRead(pinSensor);\n  float voltaje = lectura * (5.0 / 1023.0);\n  float temp = (voltaje - 0.5) * 100.0;\n\n  // 2. Mostrar la temperatura\n  lcd.setCursor(0, 0);\n  lcd.print(\"Temp: \");\n  lcd.print(temp, 1);\n  lcd.print(\" C   \");\n\n  // 3. Decidir\n  lcd.setCursor(0, 1);\n  if (temp > UMBRAL) {\n    lcd.print(\"ALERTA: CALOR!  \");\n    // COMPLETA: enciende el LED\n  } else {\n    lcd.print(\"Todo normal     \");\n    // COMPLETA: apaga el LED\n  }\n\n  delay(500);\n}\n", "reto_promedio": "// Reto extra: alarma con promedio (usa lo que aprendiste en el registrador del Periodo 3)\n#include <Adafruit_LiquidCrystal.h>\n\nAdafruit_LiquidCrystal lcd(0);\n\nconst int pinSensor = A0;\nconst int pinLED = 9;\nconst float UMBRAL = 30.0;\nconst int N = ;                 // TU DECISIÓN: cuántas lecturas promediar (de 3 a 10)\n\nfloat lecturas[N];              // aquí se guardan las últimas N temperaturas\nint pos = 0;                    // dónde se guarda la próxima\nint cantidad = 0;               // cuántas hay guardadas\n\nvoid setup() {\n  lcd.begin(16, 2);\n  lcd.setBacklight(1);\n  pinMode(pinLED, OUTPUT);\n}\n\nvoid loop() {\n  int lectura = analogRead(pinSensor);\n  float temp = (lectura * (5.0 / 1023.0) - 0.5) * 100.0;\n\n  lecturas[pos] = temp;         // guardar\n  pos = (pos + 1) % N;          // avanzar y volver a 0 al llegar a N\n  if (cantidad < N) cantidad++;\n\n  float suma = 0;\n  for (int i = 0; i < cantidad; i++) {\n    suma += lecturas[i];\n  }\n  float promedio = suma / cantidad;\n\n  lcd.setCursor(0, 0);\n  lcd.print(\"Prom: \");\n  lcd.print(promedio, 1);\n  lcd.print(\" C   \");\n\n  lcd.setCursor(0, 1);\n  if (promedio > UMBRAL) {\n    lcd.print(\"ALERTA: CALOR!  \");\n    digitalWrite(pinLED, HIGH);\n  } else {\n    lcd.print(\"Todo normal     \");\n    digitalWrite(pinLED, LOW);\n  }\n\n  delay(1000);                  // una lectura por segundo\n}\n"};
const $=id=>document.getElementById(id);
const KEY='g1v2-11elec';
let S={};try{S=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const num=id=>{const v=String(($(id)||{}).value||'').trim().replace(',','.');return v===''?NaN:Number(v)};
const f2=(x,d=2)=>Number(x).toFixed(d).replace('.',',');
const fb=(id,msg,k)=>{$(id).innerHTML='<div class="note '+(k||'')+'">'+msg+'</div>'};
const OPT3=['Enciende normal','Enciende débil','No enciende'];
document.querySelectorAll('select.opt3').forEach(s=>{s.innerHTML='<option value="">Elige</option>'+OPT3.map(o=>'<option>'+o+'</option>').join('')});

/* tabs */
function goName(){go('inicio');const n=$('nombre');if(n){n.focus();n.scrollIntoView({block:'center'});}let m=$('nombreMsg');if(!m&&n){m=document.createElement('p');m.id='nombreMsg';m.className='fb bad';m.setAttribute('role','alert');n.parentNode.appendChild(m)}if(m){m.textContent='👆 Escribe aquí tu nombre (o el del equipo) para poder descargar el reporte.';n.addEventListener('input',()=>{m.textContent=''},{once:true})}}
function go(t){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id===t));
  document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===t?'true':'false'));S._tab=t;save();if(t==='reporte')summary();window.scrollTo(0,0)}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>go(b.dataset.tab)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
document.querySelectorAll('.map a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();document.querySelector(a.getAttribute('href')).scrollIntoView({behavior:'smooth'})}));

/* persistence */
document.querySelectorAll('[data-save]').forEach(e=>{
  if(S[e.id]!==undefined){if(e.type==='checkbox')e.checked=!!S[e.id];else e.value=S[e.id]}
  const ev=(e.type==='checkbox'||e.tagName==='SELECT')?'change':'input';
  e.addEventListener(ev,()=>{S[e.id]=e.type==='checkbox'?e.checked:e.value;save();if(e.dataset.ans!==undefined)quiz(e)})});

/* quizzes with data-ans */
const QFB={m2_q:['fbq2','Correcto: con señal en la base el transistor se satura y el LED enciende.','No: en corte el LED estaría apagado.'],
 m3_q:['fbq3','Correcto: sin corriente suficiente en la base (A) o sin camino al GND (B), no hay saturación.','Revisa los experimentos A y B: ¿qué hizo que el LED se apagara?'],
 m4_q:['fbq4','Correcto: HIGH pone 5 V en D9 y la base recibe su señal.','pinMode solo prepara el pin; delay solo espera.'],
 m5_q:['fbq5','Correcto: i vale 0, 1 y 2; al llegar a 3 el ciclo termina.','Cuenta los valores de i: empieza en 0 y se detiene antes de 3.'],
 m7_q1:['fbq7a','Correcto: VCC, GND, SDA y SCL.','Cuenta los cables de la figura.'],
 m7_q2:['fbq7b','Correcto: en el Arduino Uno, SDA es A4 y SCL es A5.','Mira la figura de la Misión 7.'],
 m9_q:['fbq9','Correcto: 30,0 > 30,0 es falso, así que muestra "Todo normal".','La condición es temp > UMBRAL: ¿30 es mayor que 30?']};
function quiz(e){const q=QFB[e.id];if(!q||!e.value)return;const ok=e.value===e.dataset.ans;fb(q[0],ok?q[1]:q[2],ok?'ok':'bad')}
document.querySelectorAll('[data-ans]').forEach(e=>{if(e.value)quiz(e)});

/* code blocks */
function hl(src){const h=src.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const re=/(\/\/ ?(?:COMPLETA|TU DECISIÓN)[^\n]*)|(\/\/[^\n]*)|("[^"\n]*")|(#include\s*&lt;[^&\n]*&gt;)|\b(const|int|float|void|for|if|else)\b|\b(pinMode|digitalWrite|analogRead|delay|setup|loop|begin|setBacklight|setCursor|print)\b|\b(HIGH|LOW|OUTPUT|A0|\d+(?:\.\d+)?)\b/g;
  return h.replace(re,(m,todo,c,st,inc,kw,fn,nu)=>'<span class="'+(todo?'todo':c?'cm':st?'st':inc||kw?'kw':fn?'fn':'nu')+'">'+m+'</span>')}
document.querySelectorAll('div.code').forEach(c=>{const src=CODES[c.dataset.code];c.querySelector('pre').innerHTML=hl(src);
  c.querySelector('.copy').addEventListener('click',ev=>{const b=ev.currentTarget,done=()=>{b.textContent='Copiado ✓';setTimeout(()=>b.textContent='Copiar código',1600)};
    const fall=()=>{const t=document.createElement('textarea');t.value=src;document.body.appendChild(t);t.select();try{document.execCommand('copy');done()}catch(e){}t.remove()};
    if(navigator.clipboard)navigator.clipboard.writeText(src).then(done).catch(fall);else fall()})});

/* missions */
const MIS={1:'Prende el LED',2:'El interruptor invisible',3:'¿Qué pasa si...?',4:'Arduino toma el control',5:'Mensaje en Morse',6:'El sensor habla',7:'Mi nombre en pantalla',8:'Todo junto',9:'Alarma de calor',10:'Reto extra'};
const reqOf=m=>document.querySelector('[data-m="'+m+'"]').dataset.req.split(',');
const filled=id=>S[id]!==undefined&&String(S[id]).trim()!=='';
function paint(){let n=0;for(let m=1;m<=10;m++){const el=document.querySelector('[data-m="'+m+'"]');const d=!!S['done'+m];el.classList.toggle('done',d);if(d&&m<=9)n++;
  const a=document.querySelector('.map a[href="#m'+m+'"]');if(a)a.classList.toggle('done',d)}
  $('gcount').textContent=n+' de 9';$('gbar').style.width=(n/9*100)+'%'}
document.querySelectorAll('[data-finish]').forEach(b=>b.addEventListener('click',()=>{const m=b.dataset.finish;const miss=reqOf(m).filter(i=>!filled(i));
  if(miss.length){const lb=document.querySelector('label[for="'+miss[0]+'"]');fb('ff'+m,'Te falta completar '+miss.length+' dato(s) del registro'+(lb?'. Empieza por: <b>'+lb.textContent.replace(/[<>&]/g,'').trim().slice(0,70)+'</b> (👆 ya te llevé a ese campo)':'')+'.','bad');const el=$(miss[0]);el.focus();el.scrollIntoView({block:'center'});return}
  if(!filled('nombre')){fb('ff'+m,'Escribe tu nombre en la pestaña Inicio.','bad');return}
  S['done'+m]=true;save();paint();fb('ff'+m,'¡Misión '+m+' completa!','ok')}));
paint();

/* M1 */
$('chk1').addEventListener('click',()=>{const a=num('m1_vled'),b=num('m1_vr');if(isNaN(a)||isNaN(b)){fb('fb1','Escribe los dos voltajes.','bad');return}
  const s=a+b;fb('fb1','Suman '+f2(s)+' V. '+(Math.abs(s-5)<=0.3?'¡Casi los 5 V de la fuente! El voltaje se reparte entre el LED y la resistencia.':'Deberían sumar cerca de 5 V. Revisa dónde pusiste las puntas del multímetro.'),Math.abs(s-5)<=0.3?'ok':'warn')});
/* M2 */
$('chk2').addEventListener('click',()=>{const off=num('m2_offv'),on=num('m2_onv');if(isNaN(off)||isNaN(on)){fb('fb2','Escribe los dos voltajes.','bad');return}
  const ok=off>3.5&&on<0.4;fb('fb2',ok?'¡Bien! Abierto ≈ 5 V (corte) y cerrado ≈ 0 V (saturación).':'Abierto debería dar cerca de 5 V y cerrado cerca de 0 V. Revisa las patas C, B y E y las puntas del multímetro.',ok?'ok':'warn')});
let agua=false;
function drawAgua(){$('wMain').setAttribute('opacity',agua?1:0);$('wBase').setAttribute('opacity',agua?1:0);$('wGate').setAttribute('height',agua?6:32);
  $('wLed').setAttribute('fill',agua?'#ff6b73':'#fff');$('aguaLed').classList.toggle('on',agua);$('aguaState').textContent=agua?'SATURACIÓN':'CORTE';$('aguaState').className='state '+(agua?'sat':'corte');
  $('aguaV').textContent=agua?'0,04 V':'4,99 V';$('aguaBtn').textContent=agua?'Abrir S1 (quitar la señal)':'Cerrar S1 (mandar señal a la base)'}
$('aguaBtn').addEventListener('click',()=>{agua=!agua;drawAgua()});drawAgua();
/* M6 chart */
function chart(){const svg=$('tchart');const pts=[[0,num('m6_v0')],[25,num('m6_v25')],[50,num('m6_v50')]].filter(p=>!isNaN(p[1]));
  const X=t=>45+t*5.8,Y=v=>215-v*170;let g='<line x1="45" y1="215" x2="345" y2="215" stroke="#8a96a3"/><line x1="45" y1="15" x2="45" y2="215" stroke="#8a96a3"/>';
  [0,25,50].forEach(t=>g+='<text x="'+X(t)+'" y="232" font-size="12" text-anchor="middle" fill="#566472">'+t+' °C</text>');
  [0,0.5,1].forEach(v=>g+='<text x="38" y="'+(Y(v)+4)+'" font-size="12" text-anchor="end" fill="#566472">'+String(v).replace('.',',')+' V</text><line x1="45" x2="345" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="#eef2f6"/>');
  if(pts.length>1)g+='<polyline fill="none" stroke="#1F4E79" stroke-width="2.5" points="'+pts.map(p=>X(p[0])+','+Y(Math.min(1.15,p[1]))).join(' ')+'"/>';
  pts.forEach(p=>g+='<circle cx="'+X(p[0])+'" cy="'+Y(Math.min(1.15,p[1]))+'" r="6" fill="#c0392b"/><text x="'+(X(p[0])+8)+'" y="'+(Y(Math.min(1.15,p[1]))-8)+'" font-size="12" fill="#17222d">'+f2(p[1])+' V</text>');
  g+='<text x="195" y="248" font-size="11" text-anchor="middle" fill="#566472">temperatura</text>';svg.innerHTML=g}
['m6_v0','m6_v25','m6_v50'].forEach(i=>$(i).addEventListener('input',chart));chart();
$('chk6').addEventListener('click',()=>{const r=num('m6_regla');if(isNaN(r)){fb('fb6','Escribe tu regla en mV.','bad');return}
  const ok=Math.abs(r-10)<=1.5;fb('fb6',ok?'¡Exacto! El TMP36 sube 10 mV (0,01 V) por cada grado. Y a 0 °C ya marca 0,5 V.':'Mira: de 0 a 25 °C el voltaje sube unos 0,25 V = 250 mV. Divide 250 entre 25.',ok?'ok':'warn')});
$('m6_q').addEventListener('input',()=>{const v=num('m6_q');if(isNaN(v))return;fb('fbq6',Math.abs(v-30)<=1?'Correcto: 0,80 V − 0,50 V = 0,30 V = 300 mV → 300 ÷ 10 = 30 °C.':'Pista: a 0 °C marca 0,50 V. ¿Cuántos mV hay de 0,50 a 0,80 V? Divide entre 10.',Math.abs(v-30)<=1?'ok':'warn')});
/* LCD helper */
function lcd(id,l1,l2){const p=s=>(s+' '.repeat(16)).slice(0,16);$(id).innerHTML=(p(l1)+p(l2)).split('').map(c=>'<span>'+(c===' '?'&nbsp;':c.replace('<','&lt;'))+'</span>').join('')}
function lcd7(){lcd('lcd7','Hola, soy',($('m7_txt').value||'TU NOMBRE'))}$('m7_txt').addEventListener('input',lcd7);lcd7();
/* M8 */
$('chk8').addEventListener('click',()=>{const on=num('m8_on'),off=num('m8_off');if(isNaN(on)||isNaN(off)){fb('fb8','Escribe los dos voltajes.','bad');return}
  const ok=on<0.4&&off>3.5;fb('fb8',ok?'Sí: encendido ≈ 0 V (saturación) y apagado ≈ 5 V (corte), igual que en la Sesión 1.':'Encendido debería dar cerca de 0 V y apagado cerca de 5 V. Revisa el GND común.',ok?'ok':'warn')});
/* M9 sim */
const adcT=T=>{const a=Math.floor((0.5+T/100)*1023/5);return (a*5/1023-0.5)*100};
function sim9(){const T=+$('sim9').value;$('sim9l').textContent=String(T).replace('.',',')+' °C';const t=adcT(T),al=t>30;
  lcd('lcd9','Temp: '+t.toFixed(1)+' C',al?'ALERTA: CALOR!':'Todo normal');$('sim9led').classList.toggle('on',al);$('sim9d').textContent='D9: '+(al?'HIGH':'LOW')}
$('sim9').addEventListener('input',sim9);sim9();
/* reto sim */
let R={buf:[],pos:0,cant:0,timer:null};
function rReset(){R.buf=new Array(+$('rxN').value).fill(null);R.pos=0;R.cant=0;rDraw()}
function rRead(){const N=R.buf.length;R.buf[R.pos]=adcT(+$('rxT').value);R.pos=(R.pos+1)%N;if(R.cant<N)R.cant++;rDraw()}
function rDraw(){let p=null;if(R.cant){let s=0;for(let i=0;i<R.cant;i++)s+=R.buf[i];p=s/R.cant}const al=p!==null&&p>30;
  lcd('lcdx',p===null?'Prom: --.- C':'Prom: '+p.toFixed(1)+' C',p===null?'':(al?'ALERTA: CALOR!':'Todo normal'));$('rxLed').classList.toggle('on',al);$('rxD').textContent='D9: '+(al?'HIGH':'LOW');
  $('rxBuf').innerHTML=R.buf.map((v,i)=>'<div class="'+(i===R.pos?'next':'')+'"><small>lecturas['+i+']</small>'+(v===null?'vacío':v.toFixed(1))+'</div>').join('')}
$('rxT').addEventListener('input',()=>$('rxTl').textContent=String($('rxT').value).replace('.',',')+' °C');
$('rxRead').addEventListener('click',rRead);$('rxClr').addEventListener('click',rReset);$('rxN').addEventListener('change',rReset);
$('rxAuto').addEventListener('click',()=>{if(R.timer){clearInterval(R.timer);R.timer=null;$('rxAuto').textContent='▶ Automático'}else{R.timer=setInterval(rRead,1000);$('rxAuto').textContent='❚❚ Pausa'}});rReset();

/* report */
const FIELDS={1:[[1,[['m1_enc','¿Encendió el LED?'],['m1_vled','Voltaje en el LED (V)'],['m1_vr','Voltaje en la resistencia (V)'],['m1_sinr','Sin resistencia, ¿qué mostró Tinkercad?']]],
 [2,[['m2_offled','S1 abierto: LED'],['m2_offv','S1 abierto: VCE (V)'],['m2_onled','S1 cerrado: LED'],['m2_onv','S1 cerrado: VCE (V)'],['m2_q','Con S1 cerrado el transistor está en'],['m2_link','Enlace Tinkercad']]],
 [3,[['m3a_p','A. RB = 1 MΩ: predicción'],['m3a_o','A. RB = 1 MΩ: observación'],['m3b_p','B. Emisor desconectado: predicción'],['m3b_o','B. Emisor desconectado: observación'],['m3c_p','C. Transistor volteado: predicción'],['m3c_o','C. Transistor volteado: observación'],['m3_q','Conclusión'],['m3_extra','Lo que más sorprendió']]],
 [4,[['m4_ok','¿Parpadea cada 2 s?'],['m4_code','loop() con 1 s / 3 s'],['m4_q','Instrucción que satura']]],
 [5,[['m5_ok','¿SOS completo?'],['m5_code','loop() del SOS'],['m5_q','Repeticiones del for']]]],
 2:[[6,[['m6_v0','Vout a 0 °C (V)'],['m6_v25','Vout a 25 °C (V)'],['m6_v50','Vout a 50 °C (V)'],['m6_regla','Regla (mV por grado)'],['m6_q','Temperatura con 0,80 V (°C)']]],
 [7,[['m7_txt','Texto en la pantalla'],['m7_ok','¿Apareció?'],['m7_q1','Cables de la LCD I2C'],['m7_q2','Pines SDA y SCL']]],
 [8,[['m8_on','VCE con LED encendido (V)'],['m8_off','VCE con LED apagado (V)'],['m8_link','Enlace Tinkercad']]],
 [9,[['m9_a','Prueba a 25 °C'],['m9_b','Prueba a 35 °C'],['m9_code','Líneas agregadas'],['m9_q','Con 30,0 °C aparece']]],
 [10,[['r_n','N elegido'],['r_t','Tiempo hasta la ALERTA (s)'],['r_why','Justificación de N']]]]};
function summary(){[1,2].forEach(k=>{$('sum'+k).innerHTML=FIELDS[k].map(([m,fs])=>{const done=!!S['done'+m];const miss=fs.filter(([i])=>!filled(i)&&reqOf(m).includes(i)).length;
  return '<li>'+(done?'✅':'⬜')+' Misión '+(m===10?'extra':m)+' · '+MIS[m]+(done?'':(m===10?' (opcional)':(miss?' · faltan '+miss+' dato(s)':' · pulsa Terminé esta misión')))+'</li>'}).join('')})}
const disp=id=>{const e=$(id);if(e&&e.tagName==='SELECT'){const o=e.options[e.selectedIndex];return o?o.text:S[id]}return S[id]};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function reportHTML(k){const rows=FIELDS[k].map(([m,fs])=>'<h2>'+(S['done'+m]?'✅':'⬜')+' Misión '+(m===10?'extra':m)+' · '+esc(MIS[m])+'</h2><table>'+fs.map(([i,l])=>'<tr><th>'+esc(l)+'</th><td>'+(filled(i)?esc(disp(i)):'<i>sin respuesta</i>')+'</td></tr>').join('')+'</table>').join('');
  return '<!doctype html><html lang="es"><meta charset="utf-8"><title>Reporte Sesión '+k+'</title><style>body{font:14px/1.45 Arial,sans-serif;max-width:800px;margin:24px auto;color:#17222d;padding:0 14px}h1{color:#1F4E79;font-size:20px;border-bottom:2px solid #1F4E79;padding-bottom:6px}h2{font-size:15px;margin:16px 0 4px;color:#1F4E79}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cdd6df;padding:6px 8px;text-align:left;vertical-align:top}th{width:38%;background:#eef3f8}td{white-space:pre-wrap;font-family:inherit}p.s{font-size:12px;color:#566472}</style>'+
  '<h1>Reporte Sesión '+k+' · Guía 1 · Electrónica 1 + Programación 2</h1><p><b>Progreso:</b> '+FIELDS[k].filter(([m])=>m<10&&S['done'+m]).length+' de '+FIELDS[k].filter(([m])=>m<10).length+' misiones terminadas'+(k===2&&S['done10']?' · reto extra terminado':'')+'.</p><p><b>Estudiantes:</b> '+esc(S.nombre||'')+' · <b>Curso:</b> '+esc(S.curso||'11 ELEC')+' · <b>Fecha:</b> '+new Date().toLocaleString('es-CO')+'</p>'+rows+'<p class="s">Instituto Técnico Veintiséis de Marzo · Reporte generado desde el laboratorio de misiones.</p></html>'}
document.querySelectorAll('[data-rep]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.rep;if(!filled('nombre')){goName();return}
  const blob=new Blob([reportHTML(k)],{type:'text/html;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;
  a.download='Reporte_S'+k+'_'+String(S.nombre).replace(/[^\wáéíóúñÁÉÍÓÚÑ]+/g,'_').slice(0,40)+'.html';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}));
document.querySelectorAll('[data-pdf]').forEach(b=>b.addEventListener('click',()=>{const w=window.open('','_blank');if(!w){alert('Permite ventanas emergentes para guardar como PDF.');return}w.document.write(reportHTML(b.dataset.pdf));w.document.close();setTimeout(()=>w.print(),400)}));
if(S._tab&&$(S._tab))go(S._tab);
