
(function(){
'use strict';
var KEY='fp10ele-p4-v1';
var state={done:{},picks:{},notes:{},gantt:null,docl:{}};
var canStore=true;
try{var raw=localStorage.getItem(KEY);if(raw){var o=JSON.parse(raw);for(var k in o)state[k]=o[k];}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));canStore=true;}catch(e){canStore=false;document.getElementById('warnbar').style.display='block';}}
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function h(tag,attrs,kids){var e=document.createElement(tag);for(var k in (attrs||{})){if(k==='class')e.className=attrs[k];else if(k==='text')e.textContent=attrs[k];else e.setAttribute(k,attrs[k]);}(kids||[]).forEach(function(c){e.appendChild(typeof c==='string'?document.createTextNode(c):c)});return e}
var toastT;function toast(t){var el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('show')},2600)}

/* ---- retos y progreso ---- */
var RETOS=[
 {id:'traductor',g:1,t:'Traduce tu problema'},{id:'alcance',g:1,t:'Alcance del prototipo'},{id:'quiz1',g:1,t:'Verificación de la Guía 1'},
 {id:'quiz2',g:2,t:'Mejora la redacción'},{id:'objetivo',g:2,t:'Arma un objetivo específico'},
 {id:'gantt',g:3,t:'Cronograma de 7 semanas'},{id:'quiz3',g:3,t:'Riesgos'},
 {id:'quiz4',g:4,t:'Sí, parcialmente o no'},{id:'doc',g:4,t:'Documento final'}];
function renderProgress(announce){
  var n=RETOS.filter(function(r){return state.done[r.id]}).length;
  $('#pill').textContent=n+' de '+RETOS.length+' retos';
  [1,2,3,4].forEach(function(g){
    var all=RETOS.filter(function(r){return r.g===g}),ok=all.every(function(r){return state.done[r.id]});
    var st=$('#st'+g),was=st.classList.contains('done');
    st.classList.toggle('done',ok);
    st.textContent=ok?'Guía '+g+' lista':'sello de la guía';
    st.setAttribute('aria-label',ok?'Guía '+g+' completada':'Guía sin completar');
    var na=document.querySelector('.top nav a[href="#guia'+g+'"]');if(na){if(ok)na.setAttribute('data-done','1');else na.removeAttribute('data-done');}
    if(ok&&!was&&announce)toast('Guía '+g+' completada');
  });
}
function complete(id){
  if(state.done[id])return;state.done[id]=true;save();
  var r=RETOS.filter(function(x){return x.id===id})[0];renderProgress(true);if(r)toast('Reto completado: '+r.t);
}

/* ---- simulador del hero ---- */
(function(){
  var light=$('#light'),thr=$('#thr');
  function upd(){
    var L=+light.value,T=+thr.value,R=Math.round(L*10.23),on=R<T;
    $('#lightv').textContent=L+' %';$('#thrv').textContent=T;
    $('#v1').textContent='Luz '+L+' %';$('#v2').textContent=R;
    $('#v3').textContent=R+' < '+T;$('#s3').textContent=on?'verdadero':'falso';
    $('#v4').textContent=on?'Encendida':'Apagada';
    $('#n3').classList.toggle('hot',on);$('#n4').classList.toggle('hot',on);$('#n1').classList.toggle('cold',L<35);
    $('#sunb').setAttribute('opacity',(0.12+L/100*0.88).toFixed(2));
    $('#dark').setAttribute('opacity',((1-L/100)*0.55).toFixed(2));
    $('#glow').setAttribute('opacity',on?1:0);
    $('#bulb').setAttribute('fill',on?'#FFE23B':'#C9CBD0');
    $('#gfill').style.width=(R/1023*100)+'%';
    var gp=T/1023*100;$('#gthr').style.left=gp+'%';$('#gthrl').style.left=gp+'%';
    $('#say').textContent=on?'La lámpara se enciende porque la lectura ('+R+') es menor que el umbral ('+T+').':'La lámpara sigue apagada porque la lectura ('+R+') no es menor que el umbral ('+T+'). Baja la luz.';
    $$('.presets .chip').forEach(function(b){b.setAttribute('aria-pressed',String(+b.dataset.l===L))});
  }
  light.addEventListener('input',upd);thr.addEventListener('input',upd);
  $$('.presets .chip').forEach(function(b){b.addEventListener('click',function(){light.value=b.dataset.l;upd()})});
  upd();
})();

/* ---- quiz reutilizable ---- */
function quiz(root,id,items){
  var score=h('div',{class:'score'}),solved=0;
  items.forEach(function(it,qi){
    var key=id+':'+qi,fb=h('p',{class:'fb','aria-live':'polite'});
    var fs=h('fieldset',{class:'q'},[h('legend',{text:(qi+1)+'. '+it.q})]);
    if(it.ctx)fs.insertBefore(h('p',{text:it.ctx,style:'margin:0 0 8px;color:#44536B'}),fs.firstChild.nextSibling);
    var box=h('div',{class:'opts'});
    it.o.forEach(function(txt,oi){
      var b=h('button',{class:'opt',type:'button',text:txt});
      b.addEventListener('click',function(){
        if(oi===it.c){
          $$('.opt',box).forEach(function(x){x.disabled=true});b.classList.add('ok');
          fb.className='fb ok';fb.textContent='Correcto. '+it.why;
          if(!state.picks[key]){state.picks[key]=1;save();}
          solved=$$('.fb.ok',root).length;upd();
        }else{b.classList.add('bad');b.disabled=true;fb.className='fb bad';fb.textContent=it.hint||'Esa no es. Lee de nuevo y prueba otra.';}
      });
      box.appendChild(b);
    });
    fs.appendChild(box);fs.appendChild(fb);root.appendChild(fs);
    if(state.picks[key]){$$('.opt',box)[it.c].classList.add('ok');$$('.opt',box).forEach(function(x){x.disabled=true});fb.className='fb ok';fb.textContent='Correcto. '+it.why;}
  });
  root.appendChild(score);
  function upd(){var n=$$('.fb.ok',root).length;score.textContent=n+' de '+items.length+' correctas';if(n===items.length)complete(id);}
  upd();
}

/* ---- Guia 1: traductor ---- */
(function(){
  var PROB={
   ilum:{l:'Iluminación',g:'El salón queda con poca luz en algunos momentos del día.',t:'Detectar cuándo la luz es insuficiente y activar una salida que apoye la iluminación.',m:'luz',r:'SI la lectura de luz < umbral, ENTONCES encender la salida.',s:'LED o lámpara piloto'},
   refr:{l:'Refrigeración',g:'El salón se calienta demasiado en las horas de más sol.',t:'Detectar cuándo la temperatura supera un valor aceptable y activar una ventilación o una alerta.',m:'temperatura',r:'SI la temperatura > umbral, ENTONCES activar el ventilador o la alerta.',s:'Ventilador pequeño o zumbador'},
   resi:{l:'Residuos',g:'Las canecas se llenan y nadie lo nota a tiempo.',t:'Estimar el nivel de llenado de la caneca y avisar cuando esté casi llena.',m:'distancia',r:'SI la distancia al residuo < umbral, ENTONCES encender el aviso de caneca llena.',s:'LED rojo o zumbador'}};
  var MAG=[['luz','Luz'],['temperatura','Temperatura'],['distancia','Distancia']];
  var SEN=[['ldr','LDR','luz'],['tmp36','TMP36','temperatura'],['ultra','Ultrasónico','distancia']];
  var sel={p:null,m:null,s:null},prevBad={};
  function chips(root,list,key){
    list.forEach(function(it){var b=h('button',{class:'chip',type:'button','aria-pressed':'false',text:it[1]||it[0]});b.dataset.v=it[0];
      b.addEventListener('click',function(){sel[key]=it[0];$$('.chip',root).forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});render()});root.appendChild(b)});
  }
  chips($('#c-p'),Object.keys(PROB).map(function(k){return [k,PROB[k].l]}),'p');
  chips($('#c-m'),MAG,'m');chips($('#c-s'),SEN.map(function(s){return [s[0],s[1]]}),'s');
  function node(title,val,miss){return h('div',{class:'node'+(miss?' miss':'')},[h('h4',{text:title}),h('div',{class:'val',text:val})])}
  function link(st,key){var d=h('div',{class:'link '+st,'aria-hidden':'true'});if(st==='bad'&&!prevBad[key])d.classList.add('shake');prevBad[key]=st==='bad';return d}
  function render(){
    var P=PROB[sel.p],chain=$('#chain');chain.innerHTML='';
    var tw=$('#twin');
    if(P){tw.hidden=false;tw.innerHTML='';tw.appendChild(h('div',{},[h('b',{text:'Problema general'}),P.g]));tw.appendChild(h('div',{},[h('b',{text:'Problema técnico'}),P.t]));}
    var sen=SEN.filter(function(s){return s[0]===sel.s})[0];
    var l1=!P||!sel.m?'pend':(sel.m===P.m?'':'bad');
    var l2=!sel.m||!sen?'pend':(sen[2]===sel.m?'':'bad');
    var good=P&&sel.m&&sen&&l1===''&&l2==='';
    var l3=good?'':'pend';
    chain.appendChild(node('Problema',P?P.l:'Elige uno',!P));
    chain.appendChild(link(l1,'1'));
    chain.appendChild(node('Magnitud',sel.m||'Elige una',!sel.m));
    chain.appendChild(link(l2,'2'));
    chain.appendChild(node('Sensor',sen?sen[1]:'Elige uno',!sen));
    chain.appendChild(link(l3,'3'));
    chain.appendChild(node('Regla de decisión',good?P.r:'Falta una cadena coherente',!good));
    chain.appendChild(link(l3,'4'));
    chain.appendChild(node('Salida',good?P.s:'...',!good));
    var v=$('#trv');
    if(!P){v.className='verdict info';v.textContent='Elige un problema para empezar.';}
    else if(l1==='bad'){v.className='verdict bad';v.textContent='Tu problema es de '+P.l.toLowerCase()+', pero elegiste observar '+sel.m+'. La magnitud tiene que estar relacionada con el problema.';}
    else if(l2==='bad'){v.className='verdict bad';v.textContent='El sensor '+sen[1]+' mide '+sen[2]+', no '+sel.m+'. Elige un sensor que responda a la magnitud.';}
    else if(good){v.className='verdict ok';v.textContent='Cadena coherente: el sensor '+sen[1]+' mide '+sel.m+' y eso responde al problema de '+P.l.toLowerCase()+'. Copia esta regla a tu cuaderno y ajústala a tu grupo.';complete('traductor');}
    else{v.className='verdict info';v.textContent='Sigue eligiendo: falta '+(!sel.m?'la magnitud':'el sensor')+'.';}
  }
  render();
})();

/* ---- Guia 1: alcance ---- */
(function(){
  var items=[['Detectar iluminación insuficiente en el área de prueba',1],['Activar una señal de salida cuando la luz sea baja',1],['Rediseñar la red eléctrica del colegio',0],['Registrar lecturas para elegir el umbral',1],['Resolver la iluminación de todo el edificio',0]];
  var root=$('#alc'),got={};
  items.forEach(function(it,i){
    var fb=h('p',{class:'fb','aria-live':'polite'});
    var yes=h('button',{class:'chip',type:'button',text:'Sí lo hará'}),no=h('button',{class:'chip',type:'button',text:'No lo hará'});
    var row=h('div',{class:'rowq'},[h('span',{text:it[0]}),h('div',{class:'sel'},[yes,no]),fb]);
    function pick(ans,btn){
      var ok=(ans===it[1]);btn.classList.add(ok?'ok':'bad');
      fb.className='fb '+(ok?'ok':'bad');
      fb.textContent=ok?(it[1]?'Correcto: cabe en un prototipo escolar.':'Correcto: eso queda fuera del alcance.'):(it[1]?'Piensa de nuevo: esto sí se puede demostrar a pequeña escala.':'Piensa de nuevo: un prototipo no promete tanto.');
      if(ok){got[i]=1;yes.disabled=no.disabled=true;if(Object.keys(got).length===items.length)complete('alcance');}else{btn.disabled=true;}
    }
    yes.addEventListener('click',function(){pick(1,yes)});no.addEventListener('click',function(){pick(0,no)});
    root.appendChild(row);
  });
  if(state.done.alcance){$$('.rowq',root).forEach(function(r,i){var b=$$('.chip',r);b[items[i][1]?0:1].classList.add('ok');b.forEach(function(x){x.disabled=true});$('.fb',r).className='fb ok';$('.fb',r).textContent='Correcto.'});}
})();

quiz($('#quiz1'),'quiz1',[
 {q:'¿Por qué “usar un Arduino” no es suficiente para formular un problema técnico?',o:['Porque Arduino es muy costoso','Porque falta definir qué ocurre y qué debe detectar o controlar el sistema','Porque Arduino no sirve con sensores'],c:1,why:'Primero se define el problema y la magnitud; después se eligen los componentes.',hint:'Piensa en qué viene primero: la herramienta o el problema.'},
 {q:'¿Cuál es la diferencia entre sensor y actuador?',o:['El sensor ejecuta la respuesta y el actuador mide','Son el mismo elemento con dos nombres','El sensor mide o detecta; el actuador ejecuta la respuesta'],c:2,why:'El sensor no decide: la decisión sale de comparar la lectura con una condición.',hint:'Uno entra información al sistema y el otro saca una acción.'},
 {q:'¿Para qué sirve un umbral dentro de la regla de decisión?',o:['Para separar dos condiciones y poder decidir','Para alimentar el sensor con energía','Para borrar las lecturas viejas'],c:0,why:'Sin umbral no hay forma de decir cuándo “poca luz” empieza a ser un problema.',hint:'Es un valor de referencia.'},
 {q:'Si el problema es el llenado de una caneca, ¿qué magnitud se relaciona con el nivel?',o:['Temperatura del residuo','Luz dentro de la caneca','Distancia entre el sensor y la superficie de los residuos'],c:2,why:'Cuanto más llena está, menor es la distancia que mide un sensor ultrasónico.',hint:'Piensa en qué cambia cuando la caneca se llena.'}
]);

/* ---- Guia 2 ---- */
quiz($('#quiz2'),'quiz2',[
 {q:'“Entender cómo funciona el LDR”',ctx:'¿Cuál versión se puede comprobar?',o:['Entender muy bien el LDR','Caracterizar el LDR con lecturas en dos condiciones de iluminación','Estudiar el LDR en casa'],c:1,why:'“Entender” no deja evidencia; las lecturas en dos condiciones sí.',hint:'Busca la opción que deja una tabla o un dato como prueba.'},
 {q:'“Hacer un sistema muy bueno de temperatura”',ctx:'¿Cuál versión se puede comprobar?',o:['Implementar un sistema que active una salida cuando la temperatura supere un umbral definido','Hacer un sistema excelente de temperatura','Comprar un sensor TMP36 de buena calidad'],c:0,why:'“Muy bueno” no tiene un criterio observable; el umbral y la salida sí.',hint:'¿Quién decide qué significa “bueno”?'},
 {q:'“Conectar el sensor y luego programar todo”',ctx:'¿Cuál versión se puede comprobar?',o:['Conectar y programar todo rápido','Programar todo y luego conectar','Separar en objetivos: medir con el sensor, implementar la lógica y validar el funcionamiento'],c:2,why:'Agrupar muchas acciones en un objetivo impide comprobar cada una; mejor etapas separadas.',hint:'Un objetivo no debería mezclar varias etapas.'},
 {q:'“Validar el prototipo”',ctx:'¿Cuál versión se puede comprobar?',o:['Validar el prototipo bien','Validar el prototipo con al menos cinco pruebas controladas y registrar cada resultado','Validar el prototipo cuando haya tiempo'],c:1,why:'Una cantidad de pruebas y un registro convierten “validar” en algo medible.',hint:'Busca una cantidad y un registro.'}
]);
(function(){
  var T={ind:['Indicador','Número de pruebas con respuesta correcta.'],meta:['Meta','Al menos 5 pruebas registradas; el grupo define con el docente el criterio de aceptación.'],evi:['Evidencia','Tabla de pruebas con resultado esperado y obtenido y, si se permite, una foto del montaje.']};
  $$('#tri .chip').forEach(function(b){b.addEventListener('click',function(){
    $$('#tri .chip').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
    var t=T[b.dataset.k];$('#triv').innerHTML='';$('#triv').appendChild(h('b',{text:t[0]+': '}));$('#triv').appendChild(document.createTextNode(t[1]));
  })});
})();
(function(){
  var good=['Identificar','Medir','Determinar','Diseñar','Implementar','Programar','Comparar','Validar','Comprobar','Documentar'];
  var F=['ob-v','ob-o','ob-m','ob-p','ob-e'].map(function(i){return $('#'+i)});
  function words(s){return s.trim().split(/\s+/).filter(Boolean).length}
  function upd(){
    var v=F[0].value,o=F[1].value.trim(),m=F[2].value.trim(),p=F[3].value.trim(),e=F[4].value.trim();
    var b=$('#built');b.innerHTML='';
    function part(t,ph){b.appendChild(t?document.createTextNode(t):h('span',{class:'ph',text:ph}))}
    part(v,'Verbo');b.appendChild(document.createTextNode(' '));part(o,'resultado');b.appendChild(document.createTextNode(' mediante '));part(m,'medio');b.appendChild(document.createTextNode(' para '));part(p,'propósito');b.appendChild(document.createTextNode('.'));
    var vague=v&&good.indexOf(v)<0;
    var cs=[['Empieza con un verbo preciso',good.indexOf(v)>=0],['Dice sobre qué se actúa',words(o)>=3],['Indica con qué medio o criterio',words(m)>=3],['Explica para qué sirve',words(p)>=3],['Dice cómo se comprobará',words(e)>=3]];
    var ul=$('#obcl');ul.innerHTML='';cs.forEach(function(c){ul.appendChild(h('li',{class:c[1]?'ok':'',text:c[0]}))});
    var ok=cs.every(function(c){return c[1]}),vd=$('#obv');
    if(ok){vd.className='verdict ok';vd.textContent='Este objetivo se puede comprobar. Guárdalo en tu cuaderno y compáralo con el de tu grupo.';complete('objetivo');}
    else if(vague){vd.className='verdict bad';vd.textContent='“'+v+'” no deja evidencia por sí solo. Cámbialo por un verbo como medir, implementar o validar.';}
    else{vd.className='verdict info';vd.textContent='Faltan '+cs.filter(function(c){return !c[1]}).length+' puntos de la lista.';}
  }
  F.forEach(function(f){f.addEventListener('input',upd);f.addEventListener('change',upd)});upd();
  $('#ob-send').addEventListener('click',function(){
    var v=F[0].value,txt=(v+' '+F[1].value.trim()+' mediante '+F[2].value.trim()+' para '+F[3].value.trim()+'. Evidencia: '+F[4].value.trim()+'.').trim();
    if(!v||!F[1].value.trim()){toast('Completa al menos el verbo y el resultado');return}
    var id=$('#ob-to').value;state.notes[id]=txt;save();$('#'+id).value=txt;toast('Guardado en tu cuaderno');
  });
})();

/* ---- Guia 3: gantt ---- */
(function(){
  var ROWS=['Formulación: problema y objetivos','Circuitos 1: sensor y mediciones','Digitales 1: lógica validada','Programación 1: algoritmo o ensayo','Integración del sistema','Pruebas y registro de evidencia','Formulación: evaluación y cierre'];
  var EX=[[1,2],[2,3],[3,4],[3,4,5],[5,6],[6,7],[7]];
  var g=state.gantt&&state.gantt.length===7?state.gantt:ROWS.map(function(){return [0,0,0,0,0,0,0]});
  var tb=$('#gantt'),cells=[];
  var thead=h('thead',{},[h('tr',{},[h('th',{class:'r',text:'Etapa'})].concat([1,2,3,4,5,6,7].map(function(w){return h('th',{text:'S'+w})})))]);tb.appendChild(thead);
  var body=h('tbody');
  ROWS.forEach(function(r,ri){
    var tr=h('tr',{},[h('th',{class:'r',scope:'row',text:r})]);cells[ri]=[];
    for(var w=0;w<7;w++)(function(w){
      var b=h('button',{class:'gc',type:'button','aria-pressed':'false','aria-label':r+', semana '+(w+1)});
      b.addEventListener('click',function(){g[ri][w]=g[ri][w]?0:1;b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');persist();paint()});
      cells[ri][w]=b;tr.appendChild(h('td',{},[b]));
    })(w);
    body.appendChild(tr);
  });
  tb.appendChild(body);
  var lr=h('tr',{class:'load'},[h('th',{class:'r',text:'Carga de la semana'})]),bars=[];
  for(var w=0;w<7;w++){var i=h('i'),bar=h('div',{class:'bar'},[i]),sm=h('small',{text:'0'});bars.push([bar,i,sm]);lr.appendChild(h('td',{},[bar,sm]))}
  tb.appendChild(h('tfoot',{},[lr]));
  function persist(){state.gantt=g;save()}
  function first(r){for(var i=0;i<7;i++)if(g[r][i])return i+1;return null}
  function last(r){for(var i=6;i>=0;i--)if(g[r][i])return i+1;return null}
  function paint(){
    cells.forEach(function(row,ri){row.forEach(function(b,w){b.setAttribute('aria-pressed',String(!!g[ri][w]))})});
    var cnt=[0,0,0,0,0,0,0];g.forEach(function(r){r.forEach(function(v,w){if(v)cnt[w]++})});
    var mx=Math.max.apply(null,cnt);
    bars.forEach(function(b,w){b[1].style.width=(cnt[w]/7*100)+'%';b[2].textContent=cnt[w];b[0].classList.toggle('crit',mx>=3&&cnt[w]===mx)});
    var F=[0,1,2,3,4,5,6].map(first),L=[0,1,2,3,4,5,6].map(last);
    function all(a){return a.every(function(x){return x!==null})}
    var R=[
     ['Cada etapa tiene al menos una semana marcada',all(F)],
     ['Problema y objetivos empiezan antes o a la vez que el sensor, la lógica y el algoritmo',all(F)&&F[0]<=Math.min(F[1],F[2],F[3])],
     ['La integración empieza después de terminar el montaje del sensor y la lógica',all(F)&&F[4]>L[1]&&F[4]>L[2]],
     ['La integración empieza cuando el algoritmo ya estaba en marcha',all(F)&&F[4]>F[3]],
     ['Las pruebas no empiezan antes que la integración',all(F)&&F[5]>=F[4]],
     ['La evaluación y el cierre no empiezan antes que las pruebas',all(F)&&F[6]>=F[5]]];
    var ul=$('#grules');ul.innerHTML='';R.forEach(function(r){ul.appendChild(h('li',{class:r[1]?'ok':'',text:r[0]}))});
    var ok=R.every(function(r){return r[1]}),v=$('#gv'),any=g.some(function(r){return r.some(Boolean)});
    var crit=cnt.map(function(c,i){return c===mx?'S'+(i+1):null}).filter(Boolean);
    if(!any){v.className='verdict info';v.textContent='Marca semanas para empezar o carga un ejemplo.';}
    else if(ok){v.className='verdict ok';v.textContent='El orden tiene sentido. La semana con más carga es '+crit.join(' y ')+' ('+mx+' actividades a la vez). Pregúntate qué entregable necesita cada etapa antes de empezar.';complete('gantt');}
    else{v.className='verdict info';v.textContent='Revisa las reglas que faltan. Cada una describe una dependencia entre etapas.';}
  }
  $('#g-ex').addEventListener('click',function(){g=ROWS.map(function(_,r){var a=[0,0,0,0,0,0,0];EX[r].forEach(function(w){a[w-1]=1});return a});persist();paint()});
  $('#g-clr').addEventListener('click',function(){g=ROWS.map(function(){return [0,0,0,0,0,0,0]});persist();paint()});
  $('#g-delay').addEventListener('click',function(){
    var r=g[1];if(!r.some(Boolean)){toast('Primero marca semanas en Circuitos 1');return}
    if(r[6]){toast('Ya no se puede retrasar más: se saldría del periodo');return}
    g[1]=[0].concat(r.slice(0,6));persist();paint();toast('Circuitos 1 se movió una semana');
  });
  paint();
})();
quiz($('#quiz3'),'quiz3',[
 {q:'El sensor se daña a mitad del periodo.',o:['Esperar a la semana de pruebas para ver si funciona','Guardar las lecturas desde el inicio y tener un repuesto o una simulación alterna','Cambiar el problema del proyecto'],c:1,why:'Con lecturas guardadas y una alternativa, el plan sigue aunque falle un componente.',hint:'Una acción preventiva se hace antes de que el riesgo ocurra.'},
 {q:'Programación necesita la regla de decisión, pero Digitales todavía no la valida.',o:['Programar sin regla de decisión','Dejar toda la programación para la última semana','Acordar una versión provisional de la regla y ajustarla cuando llegue la validada'],c:2,why:'Una versión provisional permite avanzar y se corrige con la información nueva.',hint:'Busca una forma de seguir avanzando sin esperar.'},
 {q:'En una semana coinciden demasiadas actividades.',o:['Mover una actividad que no dependa de otra a una semana con menos carga','Marcar todo como terminado','Borrar el cronograma'],c:0,why:'Repartir la carga sin romper dependencias evita cuellos de botella.',hint:'Piensa en qué actividad se puede mover sin afectar a las demás.'}
]);

/* ---- Guia 4 ---- */
quiz($('#quiz4'),'quiz4',[
 {q:'Objetivo: validar el sistema con al menos 5 pruebas. Resultado: 5 pruebas registradas en una tabla, las 5 con la respuesta prevista.',o:['Sí','Parcialmente','No'],c:0,why:'La evidencia demuestra el resultado y el criterio que exigía el objetivo.'},
 {q:'Mismo objetivo. Resultado: se hicieron 4 pruebas y las 4 salieron bien.',o:['Sí','Parcialmente','No'],c:1,why:'Se logró una parte: 4 de 5 pruebas previstas equivalen al 80 % de lo planeado.',hint:'Compara la cantidad realizada con la que exigía el objetivo.'},
 {q:'Objetivo: registrar lecturas del sensor en dos condiciones y fijar un umbral. Resultado: hay lecturas con luz, pero ninguna a oscuras; el umbral se estimó.',o:['Sí','Parcialmente','No'],c:1,why:'Falta una de las dos condiciones que pedía el objetivo.',hint:'El objetivo pedía dos condiciones.'},
 {q:'Objetivo: implementar la lógica que activa la salida. Resultado: “el LED encendió en clase”, pero el grupo no guardó código, tabla ni video.',o:['Sí','Parcialmente','No'],c:2,why:'Funcionar no es lo mismo que cumplir: sin evidencia, el resultado no se puede demostrar.',hint:'¿Qué puede mostrar el grupo hoy para demostrarlo?'}
]);
(function(){
  var a=$('#k-prev'),b=$('#k-real'),c=$('#k-ok');
  function n(e){var v=parseInt(e.value,10);return isNaN(v)||v<0?0:v}
  function upd(){
    var P=n(a),R=n(b),K=Math.min(n(c),R);
    var p1=P?Math.min(100,Math.round(R/P*100)):0,p2=R?Math.round(K/R*100):0;
    $('#k-p1').textContent=p1+' %';$('#k-p2').textContent=p2+' %';$('#k-m1').style.width=p1+'%';$('#k-m2').style.width=p2+'%';
    var st=$('#k-st'),tx=$('#k-tx');
    if(R===0){st.className='state no';st.textContent='No';tx.textContent='No hay pruebas ni evidencia.';}
    else if(R>=P&&K===R&&P>0){st.className='state si';st.textContent='Sí';tx.textContent='Se hizo lo previsto y todo salió bien. Falta confirmar que las pruebas fueron pertinentes.';}
    else{st.className='state par';st.textContent='Parcialmente';tx.textContent=R<P?'Se hicieron menos pruebas de las previstas.':'Hubo pruebas con una respuesta distinta de la esperada: explica por qué.';}
  }
  [a,b,c].forEach(function(e){e.addEventListener('input',upd)});upd();
})();
(function(){
  var S=['Identificación: nombre del proyecto, integrantes, curso y periodo','Problema técnico: problema, magnitud, sensor, regla, alcance y límites (Guía 1)','Objetivos: general y específicos (Guía 2)','Planeación: cronograma final y nota sobre cambios importantes (Guía 3)','Evaluación: matriz de cumplimiento con evidencias','Lecciones aprendidas: causas, dificultades y recomendaciones'];
  var ul=$('#docl');
  function upd(){var n=S.filter(function(_,i){return state.docl[i]}).length;$('#doc-m').style.width=(n/S.length*100)+'%';$('#doc-t').textContent=n+' de '+S.length+' secciones listas';if(n===S.length)complete('doc');}
  S.forEach(function(t,i){
    var id='doc'+i,cb=h('input',{type:'checkbox',id:id,style:'width:22px;height:22px;flex:none;margin-top:3px;accent-color:#17243B'}),lb=h('label',{for:id,text:t,style:'cursor:pointer'});
    cb.checked=!!state.docl[i];cb.addEventListener('change',function(){state.docl[i]=cb.checked?1:0;save();upd()});
    ul.appendChild(h('li',{style:'display:flex;gap:10px;align-items:flex-start'},[cb,lb]));
  });
  upd();
})();

/* ---- cuaderno ---- */
(function(){
  var ids=$$('#nb input,#nb textarea').map(function(e){return e.id}),t;
  ids.forEach(function(id){var e=$('#'+id);if(state.notes[id])e.value=state.notes[id];
    e.addEventListener('input',function(){state.notes[id]=e.value;clearTimeout(t);t=setTimeout(function(){save();$('#nb-save').textContent=canStore?'Guardado en este dispositivo.':'No se pudo guardar en este navegador. Descarga tu cuaderno.'},400)})});
  function text(){
    var out='Cuaderno del proyecto - Formulación de Proyectos 10 ELE\n\n';
    $$('#nb .field').forEach(function(f){var l=$('label',f),e=$('input,textarea',f);out+=l.textContent+'\n'+(e.value||'(sin completar)')+'\n\n'});return out;
  }
  $('#nb-dl').addEventListener('click',function(){var a=h('a',{href:URL.createObjectURL(new Blob([text()],{type:'text/plain;charset=utf-8'})),download:'mi-cuaderno-proyecto.txt'});document.body.appendChild(a);a.click();a.remove();toast('Descargado')});
  $('#nb-cp').addEventListener('click',function(){var t2=text();if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t2).then(function(){toast('Texto copiado')},function(){toast('No se pudo copiar; usa Descargar')})}else toast('No se pudo copiar; usa Descargar')});
  $('#nb-pr').addEventListener('click',function(){window.print()});
})();

/* ---- copia local y borrado ---- */
$('#dl-page').addEventListener('click',function(){
  var msg=$('#dl-msg');
  CopiaPagina.descargar('guia-formulacion-proyectos-10ELE.html').then(function(){
    msg.textContent='Listo. Abre el archivo descargado con tu navegador; funciona sin internet.';
  }).catch(function(){msg.textContent='Esta página ya está abierta desde un archivo en tu dispositivo, así que ya tienes tu copia. Para pasarla a otro aparato, comparte ese archivo.'});
});
$('#wipe').addEventListener('click',function(){
  if(!confirm('Se borrarán tus respuestas, tu cronograma y tu cuaderno de este dispositivo. ¿Continuar?'))return;
  try{localStorage.removeItem(KEY)}catch(e){}location.reload();
});

/* ---- pestañas ---- */
(function(){
  var TABS=[
   {id:'inicio',t:'Estación Escolar Inteligente: guía de Formulación de Proyectos'},
   {id:'guia1',t:'Guía 1 · Del problema real al problema técnico'},
   {id:'guia2',t:'Guía 2 · Objetivos que se pueden comprobar'},
   {id:'guia3',t:'Guía 3 · Plan de ejecución'},
   {id:'guia4',t:'Guía 4 · Cierre del proyecto'},
   {id:'cuaderno',t:'Mi cuaderno · Formulación de Proyectos'}];
  var labels=['Inicio','Guía 1','Guía 2','Guía 3','Guía 4','Mi cuaderno'];
  TABS.forEach(function(tab,i){
    var sec=document.getElementById(tab.id),wrap=$('.wrap',sec),p=h('div',{class:'pager'});
    if(i>0)p.appendChild(h('a',{class:'btn alt prev',href:'#'+TABS[i-1].id,'aria-label':'Anterior: '+labels[i-1],text:'← Anterior'}));
    if(i<TABS.length-1)p.appendChild(h('a',{class:'btn next',href:'#'+TABS[i+1].id,'aria-label':'Siguiente: '+labels[i+1],text:'Siguiente →'}));
    wrap.appendChild(p);
  });
  var links=$$('.top nav a');
  function route(first){
    var id=(location.hash||'').slice(1),cur=TABS.filter(function(x){return x.id===id})[0]||TABS[0];
    TABS.forEach(function(x){document.getElementById(x.id).hidden=(x.id!==cur.id)});
    links.forEach(function(a){if(a.getAttribute('href')==='#'+cur.id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
    var act=$('.top nav a[aria-current=page]');if(act&&act.scrollIntoView)act.scrollIntoView({block:'nearest',inline:'nearest'});
    document.title=cur.t;
    window.scrollTo({top:0,left:0,behavior:'instant'});
    if(!first){var hd=$('h1,h2',document.getElementById(cur.id));if(hd){hd.setAttribute('tabindex','-1');hd.focus({preventScroll:true});}}
  }
  window.addEventListener('hashchange',function(){route(false)});
  route(true);
})();
try{localStorage.setItem(KEY+':t','1');localStorage.removeItem(KEY+':t')}catch(e){canStore=false;$('#warnbar').style.display='block'}
renderProgress(false);
})();
