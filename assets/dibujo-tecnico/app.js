
(function(){
"use strict";
const NS="http://www.w3.org/2000/svg";
const $=s=>document.querySelector(s);
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);if(attrs)for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function line(p,a,b,cls){return el("line",{x1:a[0],y1:a[1],x2:b[0],y2:b[1],class:cls},p);}
function poly(p,pts,cls){return el("polygon",{points:pts.map(q=>q[0].toFixed(1)+","+q[1].toFixed(1)).join(" "),class:cls},p);}
function txt(p,x,y,s,cls,anchor){const t=el("text",{x:x,y:y,class:cls||"lbl"},p);if(anchor)t.setAttribute("text-anchor",anchor);t.textContent=s;return t;}
function lerp(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}
function atX(a,b,x){const t=(x-a[0])/(b[0]-a[0]);return [x,a[1]+t*(b[1]-a[1])];}
function inter(p1,p2,p3,p4){const d=(p1[0]-p2[0])*(p3[1]-p4[1])-(p1[1]-p2[1])*(p3[0]-p4[0]);if(Math.abs(d)<1e-9)return null;const t=((p1[0]-p3[0])*(p3[1]-p4[1])-(p1[1]-p3[1])*(p3[0]-p4[0]))/d;return [p1[0]+t*(p2[0]-p1[0]),p1[1]+t*(p2[1]-p1[1])];}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function fmt(v,d){return v.toFixed(d===undefined?1:d).replace(".",",");}
function store(){try{return window.localStorage;}catch(e){return null;}}

/* ---------- arrastre ---------- */
function svgPoint(svg,evt){const r=svg.getBoundingClientRect();const vb=svg.viewBox.baseVal;return [(evt.clientX-r.left)*vb.width/r.width+vb.x,(evt.clientY-r.top)*vb.height/r.height+vb.y];}
function makeHandle(parent,color,kind){
  const g=el("g",{class:"handle"},parent);
  el("circle",{r:28,class:"hitc"},g);
  if(kind==="pf"){el("circle",{r:12,class:"halo",stroke:color},g);el("circle",{r:11,fill:color,class:"ring"},g);}
  else if(kind==="move"){el("circle",{r:12,fill:"#fff",stroke:color,"stroke-width":3},g);line(g,[-6,0],[6,0],"edge thin");line(g,[0,-6],[0,6],"edge thin");}
  else {el("rect",{x:-9,y:-9,width:18,height:18,rx:3,fill:color,class:"ring"},g);}
  return g;
}
function place(h,p){h.setAttribute("transform","translate("+p[0].toFixed(1)+","+p[1].toFixed(1)+")");}
function drag(svg,h,onMove){
  h.addEventListener("pointerdown",function(e){
    e.preventDefault();h.setPointerCapture(e.pointerId);h.classList.add("grab");
    const mv=function(ev){onMove(svgPoint(svg,ev));};
    const up=function(){h.removeEventListener("pointermove",mv);h.removeEventListener("pointerup",up);h.removeEventListener("pointercancel",up);h.classList.remove("grab");};
    h.addEventListener("pointermove",mv);h.addEventListener("pointerup",up);h.addEventListener("pointercancel",up);
  });
}

/* ---------- 1.1 carretera ---------- */
(function(){
  const svg=$("#road"),L=svg.querySelector(".layer"),s=$("#eye");
  const W=800,H=420,cx=400,cy=175,f=560;
  function render(){
    const E=+s.value;L.innerHTML="";
    const P=(x,y,z)=>[cx+f*x/z,cy-f*(y-E)/z];
    el("rect",{x:0,y:0,width:W,height:cy,class:"sky"},L);
    el("rect",{x:0,y:cy,width:W,height:H-cy,class:"ground"},L);
    const zn=2.5,zf=4000;
    poly(L,[P(-3,0,zn),P(3,0,zn),P(3,0,zf),P(-3,0,zf)],"road");
    for(let z=3;z<400;z+=5)poly(L,[P(-.09,0,z),P(.09,0,z),P(.09,0,z+2.2),P(-.09,0,z+2.2)],"dash");
    line(L,P(-3,0,zn),[cx,cy],"edge1 thin");line(L,P(3,0,zn),[cx,cy],"edge1 thin");
    const posts=[];for(let z=5;z<=150;z+=8)posts.push(z);
    [-4.6,4.6].forEach(function(x){
      line(L,P(x,3,4),[cx,cy],"aux1");
      posts.slice().reverse().forEach(function(z){
        const b=P(x,0,z),t=P(x,3,z);
        el("line",{x1:b[0],y1:b[1],x2:t[0],y2:t[1],class:"post","stroke-width":Math.max(1.3,0.22*f/z)},L);
        if(E<3&&z<90)el("circle",{cx:cx+f*x/z,cy:cy,r:clamp(0.14*f/z,2.2,6),class:"hit"},L);
      });
    });
    line(L,[0,cy],[W,cy],"lh");txt(L,12,cy-10,"LH","lbl lhl");
    el("circle",{cx:cx,cy:cy,r:7,class:"pfdot"},L);txt(L,cx+12,cy-12,"PF","lbl pf1");
    /* vista lateral */
    const bx=W-200,by=H-148,bw=186,bh=136;
    el("rect",{x:bx,y:by,width:bw,height:bh,rx:8,fill:"#fff",stroke:"#cfc8b8"},L);
    txt(L,bx+10,by+20,"Vista lateral","lbl xs");
    const gy=by+bh-16,sc=11;
    line(L,[bx+8,gy],[bx+bw-8,gy],"edge thin");
    const px=bx+40,base=Math.max(0,E-1.6);
    if(base>0)el("rect",{x:px-12,y:gy-base*sc,width:24,height:base*sc,fill:"#d9d2c2",stroke:"#8a8270"},L);
    const ft=gy-base*sc;
    line(L,[px,ft],[px,ft-1.1*sc],"edge thin");el("circle",{cx:px,cy:ft-1.35*sc,r:3.5,class:"inkdot"},L);
    const ey=gy-E*sc;
    el("circle",{cx:px+5,cy:ey,r:2.6,class:"pfdot"},L);
    line(L,[px+5,ey],[bx+bw-8,ey],"lh");
    const qx=bx+bw-36;line(L,[qx,gy],[qx,gy-3*sc],"post");
    L.lastChild.setAttribute("stroke-width",4);
    txt(L,qx-6,gy-3*sc-6,"3 m","lbl xs","end");
    $("#eyeV").textContent=fmt(E)+" m";
    $("#eyeOut").innerHTML=E<3
      ?"Tus ojos están a <b>"+fmt(E)+" m</b>. La LH corta todos los postes (de 3 m) exactamente a "+fmt(E)+" m del suelo, estén cerca o lejos. Las líneas rojas son paralelas en la realidad y en el dibujo convergen al PF."
      :"Tus ojos están a <b>"+fmt(E)+" m</b>, por encima de los postes (3 m). Ahora la LH pasa sobre todos ellos: los ves desde arriba y el piso ocupa más espacio en el dibujo.";
  }
  s.addEventListener("input",render);render();
})();

/* ---------- 1.2 elementos ---------- */
(function(){
  const data=[
    {t:"Línea de horizonte (LH)",d:"Representa la altura de los ojos del observador. Es horizontal y atraviesa el PF.",draw:function(g){line(g,[10,60],[190,60],"lh");txt(g,14,50,"LH","lbl s lhl");}},
    {t:"Punto de fuga (PF)",d:"Lugar de la LH hacia donde parecen juntarse las aristas que se alejan del observador.",draw:function(g){line(g,[10,60],[190,60],"lh");el("circle",{cx:100,cy:60,r:8,class:"pfdot"},g);txt(g,112,48,"PF","lbl s pf1");}},
    {t:"Líneas de fuga",d:"Aristas de profundidad. Al prolongarlas, todas pasan por el PF.",draw:function(g){line(g,[10,60],[190,60],"lh");[[20,110],[60,112],[140,112],[180,110],[30,10],[170,12]].forEach(function(p){line(g,p,[100,60],"edge1 thin");});el("circle",{cx:100,cy:60,r:6,class:"pfdot"},g);}},
    {t:"Líneas frontales",d:"Aristas paralelas a la hoja. Quedan horizontales o verticales y no van al PF.",draw:function(g){el("rect",{x:55,y:25,width:90,height:70,class:"edge",fill:"#e6ecf5"},g);}}
  ];
  const host=$("#elements");
  data.forEach(function(it){
    const c=document.createElement("div");c.className="card";c.style.margin="0";c.style.padding="12px";
    const s=el("svg",{viewBox:"0 0 200 120"});s.style.width="100%";s.style.display="block";
    it.draw(s);c.appendChild(s);
    const h=document.createElement("h4");h.textContent=it.t;h.style.fontSize="1rem";h.style.margin="8px 0 4px";c.appendChild(h);
    const p=document.createElement("p");p.textContent=it.d;p.style.fontSize=".9rem";p.style.margin="0";c.appendChild(p);
    host.appendChild(c);
  });
})();

/* ---------- 1.3 laboratorio un punto ---------- */
(function(){
  const svg=$("#lab1"),L=svg.querySelector(".layer"),H=svg.querySelector(".handles");
  const W=800;
  const st={pf:[580,150],x:150,y:225,w:220,h:135};
  const k=$("#k1"),cA=$("#aux1"),cH=$("#hid1");
  const hPF=makeHandle(H,"#c0392b","pf"),hMv=makeHandle(H,"#1d2533","move"),hSz=makeHandle(H,"#1d2533","size");
  function render(){
    L.innerHTML="";const pf=st.pf,x=st.x,y=st.y,w=st.w,h=st.h,kk=+k.value;
    line(L,[0,pf[1]],[W,pf[1]],"lh");txt(L,10,pf[1]-10,"LH","lbl lhl");
    const F=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],B=F.map(function(p){return lerp(p,pf,kk);});
    if(cA.checked)F.forEach(function(p){line(L,p,pf,"aux1");});
    const top=pf[1]<y,bot=pf[1]>y+h,left=pf[0]<x,right=pf[0]>x+w;
    if(top)poly(L,[F[0],F[1],B[1],B[0]],"facet");if(bot)poly(L,[F[3],F[2],B[2],B[3]],"facet");
    if(left)poly(L,[F[0],F[3],B[3],B[0]],"face1");if(right)poly(L,[F[1],F[2],B[2],B[1]],"face1");
    poly(L,F,"facef");
    const ed=[[B[0],B[1],top,"edge"],[B[1],B[2],right,"edge"],[B[2],B[3],bot,"edge"],[B[3],B[0],left,"edge"],
      [F[0],B[0],top||left,"edge1"],[F[1],B[1],top||right,"edge1"],[F[2],B[2],bot||right,"edge1"],[F[3],B[3],bot||left,"edge1"]];
    if(cH.checked)ed.forEach(function(e){if(!e[2])line(L,e[0],e[1],"hid");});
    ed.forEach(function(e){if(e[2])line(L,e[0],e[1],e[3]);});
    for(let i=0;i<4;i++)line(L,F[i],F[(i+1)%4],"edge");
    txt(L,pf[0]+16,pf[1]-14,"PF","lbl pf1");
    place(hPF,pf);place(hMv,[x+w/2,y+h/2]);place(hSz,[x+w,y+h]);
    $("#k1V").textContent=Math.round((1-kk)*100)+" %";
    const seen=["frontal"];if(top)seen.push("superior");if(bot)seen.push("inferior");if(left)seen.push("lateral izquierda");if(right)seen.push("lateral derecha");
    let msg="Caras visibles: <b>"+seen.join(", ")+"</b>. La cara posterior mide el "+Math.round((1-kk)*100)+" % de la frontal.";
    if(!top&&!bot&&!left&&!right)msg+=" El PF está dentro de la cara frontal: la caja se lee como un pasillo o un túnel visto de frente.";
    else if(!top&&!bot)msg+=" La LH atraviesa la caja: no se ve ni la cara superior ni la inferior.";
    $("#lab1Out").innerHTML=msg;
  }
  drag(svg,hPF,function(p){st.pf=[clamp(p[0],20,780),clamp(p[1],30,430)];render();});
  drag(svg,hMv,function(p){st.x=clamp(p[0]-st.w/2,10,790-st.w);st.y=clamp(p[1]-st.h/2,10,440-st.h);render();});
  drag(svg,hSz,function(p){st.w=clamp(p[0]-st.x,70,780-st.x);st.h=clamp(p[1]-st.y,60,440-st.y);render();});
  [k,cA,cH].forEach(function(c){c.addEventListener("input",render);});
  render();
})();

/* ---------- paso a paso (genérico) ---------- */
function stepper(root,steps){
  const svg=root.querySelector("svg"),L=svg.querySelector(".layer"),dots=root.querySelector(".dots");
  const h4=root.querySelector(".steptext h4"),pp=root.querySelector(".steptext p");
  const groups=steps.map(function(s){
    const g=el("g",{class:"stg"},L);
    s.items.forEach(function(it,i){
      let e;const d=(i*0.18).toFixed(2)+"s";
      if(it.k==="l"){const fade=/lh|hid/.test(it.c);e=el("path",{d:"M"+it.a[0]+" "+it.a[1]+" L"+it.b[0]+" "+it.b[1],class:it.c+(fade?" fade":" draw")},g);if(!fade)e.setAttribute("pathLength",1);}
      else if(it.k==="p"){e=poly(g,it.pts,it.c+" fade");}
      else if(it.k==="d"){e=el("g",{class:"fade"},g);el("circle",{cx:it.p[0],cy:it.p[1],r:it.r||8,class:it.c},e);if(it.t)txt(e,it.p[0]+(it.o?it.o[0]:12),it.p[1]+(it.o?it.o[1]:-12),it.t,it.lc||"lbl");}
      else if(it.k==="t"){e=txt(g,it.p[0],it.p[1],it.s,(it.c||"lbl s")+" fade",it.a);}
      if(e)e.style.setProperty("--d",d);
    });
    const dot=document.createElement("i");dots.appendChild(dot);
    return g;
  });
  let cur=0,timer=null;
  const bP=root.querySelector('[data-a="prev"]'),bN=root.querySelector('[data-a="next"]'),bA=root.querySelector('[data-a="play"]');
  function show(n){
    cur=n;
    groups.forEach(function(g,i){g.setAttribute("class","stg"+(i<=n?" on":"")+(i===n?" cur":""));});
    void svg.getBoundingClientRect();
    svg.classList.toggle("dimmed",!!steps[n].dim);
    dots.querySelectorAll("i").forEach(function(d,i){d.className=i<=n?"on":"";});
    h4.textContent="Paso "+(n+1)+" de "+steps.length+" · "+steps[n].t;pp.innerHTML=steps[n].d;
    bP.disabled=n===0;bN.disabled=n===steps.length-1;
  }
  function stop(){if(timer){clearInterval(timer);timer=null;bA.textContent="Ver todo";}}
  bP.addEventListener("click",function(){stop();if(cur>0)show(cur-1);});
  bN.addEventListener("click",function(){stop();if(cur<steps.length-1)show(cur+1);});
  bA.addEventListener("click",function(){
    if(timer){stop();return;}
    show(0);bA.textContent="Pausa";
    timer=setInterval(function(){if(cur<steps.length-1)show(cur+1);else stop();},2600);
  });
  show(0);
}

/* 1.4 pasos un punto */
(function(){
  const PF=[560,150],F=[[170,205],[390,205],[390,340],[170,340]],kk=.38,B=F.map(function(p){return lerp(p,PF,kk);});
  stepper($("#st1"),[
    {t:"Línea de horizonte y PF",d:"Traza la LH con trazo suave de lado a lado de la hoja. Marca el PF sobre ella. Aquí está a la derecha y por encima de la caja: por eso veremos la cara superior y la lateral derecha.",
     items:[{k:"l",a:[0,150],b:[800,150],c:"lh"},{k:"t",p:[10,140],s:"LH",c:"lbl lhl"},{k:"d",p:PF,c:"pfdot",t:"PF",lc:"lbl pf1"}]},
    {t:"Cara frontal",d:"Dibuja un rectángulo con escuadra. Sus lados son <b>horizontales y verticales</b> porque esta cara está de frente al observador.",
     items:[{k:"l",a:F[0],b:F[1],c:"edge"},{k:"l",a:F[1],b:F[2],c:"edge"},{k:"l",a:F[2],b:F[3],c:"edge"},{k:"l",a:F[3],b:F[0],c:"edge"},{k:"t",p:[280,372],s:"cara frontal",a:"middle",c:"lbl s"}]},
    {t:"Lleva cada esquina al PF",d:"Apoya la regla en cada esquina y en el PF. Traza cuatro líneas auxiliares <b>suaves</b>. Estas líneas contienen las aristas de profundidad.",
     items:F.map(function(p){return {k:"l",a:p,b:PF,c:"aux1"};})},
    {t:"Decide la profundidad",d:"Marca un punto sobre una auxiliar (aquí, la superior izquierda). Desde ese punto cierra la cara posterior con una horizontal y una vertical, hasta tocar las otras auxiliares.",
     items:[{k:"d",p:B[0],c:"inkdot",r:6},{k:"l",a:B[0],b:B[1],c:"cons"},{k:"l",a:B[1],b:B[2],c:"cons"},{k:"l",a:B[2],b:B[3],c:"cons"},{k:"l",a:B[3],b:B[0],c:"cons"}]},
    {t:"Repasa las aristas visibles",d:"Con trazo firme repasa solo lo que se ve: cara frontal, cara superior y cara derecha. Las aristas ocultas quedan punteadas o sin repasar. Conserva visibles algunas auxiliares como evidencia.",dim:true,
     items:[{k:"p",pts:[F[0],F[1],B[1],B[0]],c:"facet"},{k:"p",pts:[F[1],F[2],B[2],B[1]],c:"face1"},
       {k:"l",a:F[0],b:B[0],c:"edge1"},{k:"l",a:F[1],b:B[1],c:"edge1"},{k:"l",a:F[2],b:B[2],c:"edge1"},{k:"l",a:B[0],b:B[1],c:"edge"},{k:"l",a:B[1],b:B[2],c:"edge"},
       {k:"l",a:F[3],b:B[3],c:"hid"},{k:"l",a:B[2],b:B[3],c:"hid"},{k:"l",a:B[3],b:B[0],c:"hid"}]}
  ]);
})();

/* ---------- quiz genérico ---------- */
function quiz(host,scoreEl,qs){
  let ok=0,done=0;
  qs.forEach(function(q,qi){
    const box=document.createElement("div");box.className="q";
    box.innerHTML='<div class="qt">'+(qi+1)+". "+q.q+'</div><div class="opts"></div><div class="fb"></div>';
    const opts=box.querySelector(".opts");
    q.o.forEach(function(o,i){
      const b=document.createElement("button");b.type="button";b.className="opt";b.textContent=o;
      b.addEventListener("click",function(){
        if(box.classList.contains("done"))return;
        box.classList.add("done");done++;
        if(i===q.a){b.classList.add("right");ok++;box.querySelector(".fb").innerHTML="<b>Correcto.</b> "+q.e;}
        else{b.classList.add("wrong");opts.children[q.a].classList.add("right");box.querySelector(".fb").innerHTML="<b>Revisa.</b> "+q.e;}
        scoreEl.textContent="Resultado: "+ok+" de "+done+" respondidas ("+qs.length+" en total).";
      });
      opts.appendChild(b);
    });
    host.appendChild(box);
  });
}
quiz($("#quiz1"),$("#quiz1s"),[
  {q:"¿Qué representa la línea de horizonte?",o:["El borde del piso o de la mesa","La altura de los ojos del observador","La línea donde termina el dibujo"],a:1,e:"La LH está siempre a la altura de los ojos. En la carretera viste que corta los postes justo a esa altura."},
  {q:"En perspectiva de un punto, las aristas verticales de la cara frontal…",o:["convergen al PF","se mantienen verticales","se inclinan hacia la LH"],a:1,e:"La cara frontal es paralela a la hoja: sus lados quedan horizontales y verticales."},
  {q:"Si una caja está completamente por debajo de la LH, ¿qué cara adicional se ve?",o:["La superior","La inferior","Ninguna"],a:0,e:"El observador la mira desde arriba, así que ve la cara superior."},
  {q:"El PF está a la izquierda de la caja. ¿Qué cara lateral se ve?",o:["La izquierda","La derecha","Las dos"],a:0,e:"Se ve la cara que mira hacia el PF, es decir, hacia el observador. Compruébalo en el laboratorio 1.3."},
  {q:"¿Por qué la cara posterior se dibuja más pequeña?",o:["Porque en la realidad es más pequeña","Porque está más lejos del observador","Porque se dibuja encima del PF"],a:1,e:"Las dos caras miden lo mismo en la realidad; la posterior se ve menor por estar más lejos."}
]);

/* ---------- esquemas de plancha ---------- */
function sheet(svg,draw){
  el("rect",{x:0,y:0,width:297,height:210,fill:"#fffefb"},svg);
  el("rect",{x:10,y:10,width:277,height:190,fill:"none",stroke:"#1d2533","stroke-width":1.2},svg);
  el("rect",{x:187,y:170,width:100,height:30,fill:"#efe9dc",stroke:"#1d2533","stroke-width":.8},svg);
  const t=el("text",{x:237,y:188,"text-anchor":"middle","font-size":7,fill:"#5b6474"},svg);t.textContent="Rótulo estándar";
  draw(svg);
}
function zone(svg,x,y,w,h,label){el("rect",{x:x,y:y,width:w,height:h,fill:"rgba(31,95,168,.05)",stroke:"#1f5fa8","stroke-width":.8,"stroke-dasharray":"3 2",rx:2},svg);const t=el("text",{x:x+w/2,y:y+h/2+2.5,"text-anchor":"middle","font-size":7,"font-weight":600,fill:"#1f5fa8"},svg);t.textContent=label;}
sheet($("#sheet1"),function(s){
  el("line",{x1:10,y1:95,x2:287,y2:95,stroke:"#7a8494","stroke-width":.8,"stroke-dasharray":"4 3"},s);
  let t=el("text",{x:14,y:91,"font-size":7,fill:"#7a8494","font-weight":600},s);t.textContent="LH";
  zone(s,22,28,70,48,"A · sobre la LH");zone(s,108,70,78,52,"B · cruza la LH");zone(s,200,112,72,48,"C · bajo la LH");
  t=el("text",{x:148,y:22,"text-anchor":"middle","font-size":6.5,fill:"#c0392b","font-weight":600},s);t.textContent="El PF va sobre la LH; tú decides dónde";
});
sheet($("#sheet2"),function(s){
  el("line",{x1:10,y1:82,x2:287,y2:82,stroke:"#7a8494","stroke-width":.8,"stroke-dasharray":"4 3"},s);
  el("circle",{cx:16,cy:82,r:2.6,fill:"#c0392b"},s);el("circle",{cx:281,cy:82,r:2.6,fill:"#1f5fa8"},s);
  let t=el("text",{x:20,y:76,"font-size":7,fill:"#c0392b","font-weight":700},s);t.textContent="PF I";
  t=el("text",{x:277,y:76,"font-size":7,fill:"#1f5fa8","font-weight":700,"text-anchor":"end"},s);t.textContent="PF D";
  zone(s,92,92,110,72,"Volumen principal");
  el("line",{x1:140,y1:96,x2:140,y2:160,stroke:"#1d2533","stroke-width":1.4},s);
  t=el("text",{x:143,y:104,"font-size":6,fill:"#1d2533"},s);t.textContent="arista cercana";
  zone(s,100,40,70,30,"Reto: 2.º volumen");
});

/* ---------- 2.1 giro 3D ---------- */
(function(){
  const svg=$("#rot"),L=svg.querySelector(".layer"),sl=$("#th"),ca=$("#auxR");
  const W=800,cx=400,cy=150,f=470,E=2.6,D=8,C=[-1.9,0,0],w=2.6,d=1.8,h=1.5;
  function proj(p){const Z=p[2]+D;return [cx+f*p[0]/Z,cy-f*(p[1]-E)/Z];}
  function render(){
    const deg=+sl.value,th=deg*Math.PI/180;L.innerHTML="";
    const u=[Math.cos(th),0,Math.sin(th)],v=[-Math.sin(th),0,Math.cos(th)];
    const P3=[];for(let i=0;i<8;i++){const su=(i&1)?1:-1,sv=(i&2)?1:-1,yy=(i&4)?h:0;P3.push([C[0]+su*w/2*u[0]+sv*d/2*v[0],yy,C[2]+su*w/2*u[2]+sv*d/2*v[2]]);}
    const P2=P3.map(proj);
    line(L,[0,cy],[W,cy],"lh");txt(L,10,cy-10,"LH","lbl lhl");
    const vpV=[cx-f*Math.tan(th),cy],vpU=deg>0?[cx+f/Math.tan(th),cy]:null;
    const edges=[];for(let i=0;i<8;i++)for(let b=0;b<3;b++){const j=i|(1<<b);if(j!==i)edges.push([i,j,b]);}
    const cam=[0,E,-D];
    const faces=[];
    [[0,1,u],[0,-1,u],[1,1,v],[1,-1,v],[2,1,[0,1,0]],[2,-1,[0,1,0]]].forEach(function(fc){
      const b=fc[0],sgn=fc[1],n=fc[2].map(function(c){return c*sgn;});
      const ids=[];for(let i=0;i<8;i++)if(((i>>b)&1)===(sgn>0?1:0))ids.push(i);
      const o=[ids[0],ids[1],ids[3],ids[2]];
      const c=[0,0,0];o.forEach(function(i){for(let a=0;a<3;a++)c[a]+=P3[i][a]/4;});
      const vis=n[0]*(cam[0]-c[0])+n[1]*(cam[1]-c[1])+n[2]*(cam[2]-c[2])>0;
      faces.push({b:b,o:o,vis:vis,ids:ids});
    });
    function famCls(b){return b===2?"edge":(b===1?"edge1":(deg>0?"edge2":"edge"));}
    if(ca.checked){
      edges.forEach(function(e){
        if(e[2]===1){const a=P2[e[0]],c=P2[e[1]];const far=Math.hypot(a[0]-vpV[0],a[1]-vpV[1])>Math.hypot(c[0]-vpV[0],c[1]-vpV[1])?a:c;line(L,far,vpV,"aux1");}
        if(e[2]===0&&vpU){const a=P2[e[0]],c=P2[e[1]];const far=Math.hypot(a[0]-vpU[0],a[1]-vpU[1])>Math.hypot(c[0]-vpU[0],c[1]-vpU[1])?a:c;line(L,far,vpU,"aux2");}
      });
    }
    faces.forEach(function(fc){if(fc.vis)poly(L,fc.o.map(function(i){return P2[i];}),fc.b===2?"facet":(fc.b===0?"face1":"face2"));});
    function edgeVis(e){return faces.some(function(fc){return fc.vis&&fc.ids.indexOf(e[0])>=0&&fc.ids.indexOf(e[1])>=0;});}
    edges.forEach(function(e){if(!edgeVis(e))line(L,P2[e[0]],P2[e[1]],"hid");});
    edges.forEach(function(e){if(edgeVis(e))line(L,P2[e[0]],P2[e[1]],famCls(e[2]));});
    function vp(p,cls,lc,name,side){
      if(p[0]>=8&&p[0]<=792){el("circle",{cx:p[0],cy:p[1],r:8,class:cls},L);txt(L,p[0],p[1]+32,name,lc,"middle");}
      else{const x=side<0?14:786;el("path",{d:side<0?"M"+(x+16)+" "+(cy-10)+" L"+x+" "+cy+" L"+(x+16)+" "+(cy+10)+"Z":"M"+(x-16)+" "+(cy-10)+" L"+x+" "+cy+" L"+(x-16)+" "+(cy+10)+"Z",class:cls},L);txt(L,side<0?x+20:x-20,cy+30,name+" (fuera de la hoja)",lc+" s",side<0?"start":"end");}
    }
    vp(vpV,"pfdot","lbl pf1",deg>0?"PF I":"PF",-1);
    if(vpU)vp(vpU,"pfdot2","lbl pf2","PF D",1);
    $("#thV").textContent=deg+"°";
    let m;
    if(deg===0)m="<b>Vista frontal: un punto de fuga.</b> Las aristas de profundidad (rojas) van al único PF. Las aristas de ancho son paralelas a la hoja: quedan horizontales y no tienen punto de fuga.";
    else if(vpU&&vpU[0]>792)m="<b>Empieza el giro.</b> El PF rojo se desplaza a la izquierda y las aristas de ancho (azules) ya se inclinan: convergen a un PF D que todavía está muy lejos, fuera de la hoja.";
    else m="<b>Vista de esquina: dos puntos de fuga.</b> Cada familia horizontal tiene su propio PF sobre la misma LH. Las verticales siguen verticales.";
    $("#rotOut").innerHTML=m;
  }
  sl.addEventListener("input",render);ca.addEventListener("input",render);render();
})();

/* ---------- 2.2 familias ---------- */
(function(){
  const host=$("#families");
  const items=[
    {t:"Horizontales hacia la izquierda",d:"Convergen al PF izquierdo (PF I).",c:"edge1",draw:function(g){line(g,[10,50],[190,50],"lh");el("circle",{cx:14,cy:50,r:6,class:"pfdot"},g);[[150,70],[150,100],[175,80]].forEach(function(p){line(g,p,[14,50],"aux1");});line(g,[150,70],[95,62],"edge1");line(g,[150,100],[95,79],"edge1");}},
    {t:"Horizontales hacia la derecha",d:"Convergen al PF derecho (PF D).",draw:function(g){line(g,[10,50],[190,50],"lh");el("circle",{cx:186,cy:50,r:6,class:"pfdot2"},g);[[50,70],[50,100]].forEach(function(p){line(g,p,[186,50],"aux2");});line(g,[50,70],[110,62],"edge2");line(g,[50,100],[110,79],"edge2");}},
    {t:"Verticales",d:"Siguen verticales y paralelas entre sí. No tienen punto de fuga (mientras no inclines la mirada).",draw:function(g){[60,100,140].forEach(function(x,i){line(g,[x,20+i*6],[x,100-i*4],"edge");});}},
    {t:"¿Por qué empezar por una arista?",d:"En dos puntos ninguna cara queda de frente: lo único que conserva su forma real es la arista vertical más cercana. Desde ella se construye todo.",draw:function(g){line(g,[10,40],[190,40],"lh");line(g,[100,55],[100,105],"edge");line(g,[100,55],[14,40],"aux1");line(g,[100,105],[14,40],"aux1");line(g,[100,55],[186,40],"aux2");line(g,[100,105],[186,40],"aux2");}}
  ];
  items.forEach(function(it){
    const c=document.createElement("div");c.className="card";c.style.margin="0";c.style.display="grid";c.style.gridTemplateColumns="140px 1fr";c.style.gap="12px";c.style.alignItems="center";
    const s=el("svg",{viewBox:"0 0 200 120"});s.style.width="100%";it.draw(s);c.appendChild(s);
    const dv=document.createElement("div");dv.innerHTML="<h4 style='font-size:1rem;margin-bottom:4px'>"+it.t+"</h4><p style='margin:0;font-size:.92rem'>"+it.d+"</p>";c.appendChild(dv);host.appendChild(c);
  });
})();

/* ---------- 2.3 laboratorio dos puntos ---------- */
(function(){
  const svg=$("#lab2"),L=svg.querySelector(".layer"),H=svg.querySelector(".handles");
  const W=800,init=function(){return {pl:[60,160],pr:[740,160],nx:400,yT:235,yB:370,xl:270,xr:545};};
  let st=init();
  const ca=$("#aux2"),ch=$("#hid2");
  const hL=makeHandle(H,"#c0392b","pf"),hR=makeHandle(H,"#1f5fa8","pf"),hT=makeHandle(H,"#1d2533","move"),hB=makeHandle(H,"#1d2533","size"),hWL=makeHandle(H,"#c0392b","size"),hWR=makeHandle(H,"#1f5fa8","size");
  function render(){
    L.innerHTML="";
    const hy=st.pl[1],pl=st.pl,pr=st.pr;
    st.nx=clamp(st.nx,pl[0]+50,pr[0]-50);
    st.xl=clamp(st.xl,pl[0]+20,st.nx-25);st.xr=clamp(st.xr,st.nx+25,pr[0]-20);
    const nT=[st.nx,st.yT],nB=[st.nx,st.yB];
    const TL=atX(nT,pl,st.xl),BL=atX(nB,pl,st.xl),TR=atX(nT,pr,st.xr),BR=atX(nB,pr,st.xr);
    const KT=inter(TL,pr,TR,pl),KB=inter(BL,pr,BR,pl);
    const top=hy<st.yT,bot=hy>st.yB;
    line(L,[0,hy],[W,hy],"lh");txt(L,W/2,hy-12,"LH","lbl lhl","middle");
    if(ca.checked){
      [nT,nB].forEach(function(p){line(L,p,pl,"aux1");line(L,p,pr,"aux2");});
      if(top){line(L,TL,pr,"aux2");line(L,TR,pl,"aux1");}
      if(bot){line(L,BL,pr,"aux2");line(L,BR,pl,"aux1");}
    }
    if(top&&KT)poly(L,[nT,TL,KT,TR],"facet");
    if(bot&&KB)poly(L,[nB,BL,KB,BR],"facet");
    poly(L,[nT,TL,BL,nB],"face1");poly(L,[nT,TR,BR,nB],"face2");
    if(ch.checked){
      if(KT&&KB)line(L,KT,KB,"hid");
      if(!top&&KT){line(L,TL,KT,"hid");line(L,TR,KT,"hid");}
      if(!bot&&KB){line(L,BL,KB,"hid");line(L,BR,KB,"hid");}
    }
    if(top&&KT){line(L,TL,KT,"edge2");line(L,TR,KT,"edge1");}
    if(bot&&KB){line(L,BL,KB,"edge2");line(L,BR,KB,"edge1");}
    line(L,nT,TL,"edge1");line(L,nB,BL,"edge1");line(L,nT,TR,"edge2");line(L,nB,BR,"edge2");
    line(L,TL,BL,"edge");line(L,TR,BR,"edge");line(L,nT,nB,"edge");
    /* ángulo */
    const corner=Math.abs(st.yB-hy)>=Math.abs(st.yT-hy)?nB:nT;
    const a1=Math.atan2(pl[1]-corner[1],pl[0]-corner[0]),a2=Math.atan2(pr[1]-corner[1],pr[0]-corner[0]);
    let da=a2-a1;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
    const ang=Math.abs(da)*180/Math.PI,good=ang>90;
    const pts=[];for(let i=0;i<=16;i++){const a=a1+da*i/16;pts.push((corner[0]+38*Math.cos(a)).toFixed(1)+","+(corner[1]+38*Math.sin(a)).toFixed(1));}
    el("polyline",{points:pts.join(" "),class:"arc",stroke:good?"#2e7d4f":"#c77700"},L);
    const mid=a1+da/2,ly=corner[1]+62*Math.sin(mid);
    txt(L,corner[0]+14,ly+(Math.sin(mid)>0?14:0),Math.round(ang)+"°",good?"lbl okc":"lbl warnc","start");
    txt(L,pl[0],hy+46,"PF I","lbl pf1","middle");txt(L,pr[0],hy+46,"PF D","lbl pf2","middle");
    place(hL,pl);place(hR,pr);place(hT,nT);place(hB,nB);place(hWL,BL);place(hWR,BR);
    const sep=Math.round(pr[0]-pl[0]);
    $("#lab2Out").innerHTML="Ángulo de la esquina cercana: <b style='color:"+(good?"var(--ok)":"var(--warn)")+"'>"+Math.round(ang)+"°</b>. "+(good?"Mayor de 90°: el objeto se ve natural.":"Menor de 90°: el objeto se ve deformado. Separa los PF o acerca la arista a la LH.")+" "+(top?"La LH está por encima: se ve la cara superior.":bot?"La LH está por debajo: se ve la cara inferior.":"La LH atraviesa el objeto: no se ve la cara superior ni la inferior.")+" Separación entre PF: "+sep+" unidades.";
  }
  drag(svg,hL,function(p){st.pl=[clamp(p[0],10,st.nx-60),clamp(p[1],30,430)];st.pr[1]=st.pl[1];render();});
  drag(svg,hR,function(p){st.pr=[clamp(p[0],st.nx+60,790),clamp(p[1],30,430)];st.pl[1]=st.pr[1];render();});
  drag(svg,hT,function(p){st.nx=p[0];st.yT=clamp(p[1],15,st.yB-50);render();});
  drag(svg,hB,function(p){st.yB=clamp(p[1],st.yT+50,440);render();});
  drag(svg,hWL,function(p){st.xl=p[0];render();});
  drag(svg,hWR,function(p){st.xr=p[0];render();});
  [ca,ch].forEach(function(c){c.addEventListener("input",render);});
  $("#lab2reset").addEventListener("click",function(){st=init();render();});
  render();
})();

/* 2.4 pasos dos puntos */
(function(){
  const PL=[40,165],PR=[760,165],nT=[380,215],nB=[380,350],xl=245,xr=565;
  const TL=atX(nT,PL,xl),BL=atX(nB,PL,xl),TR=atX(nT,PR,xr),BR=atX(nB,PR,xr),K=inter(TL,PR,TR,PL),KB=inter(BL,PR,BR,PL);
  stepper($("#st2"),[
    {t:"LH y dos puntos de fuga",d:"Traza la LH y ubica PF I y PF D sobre ella, <b>lo más separados posible</b>: en la plancha, cerca de los bordes del área de dibujo.",
     items:[{k:"l",a:[0,165],b:[800,165],c:"lh"},{k:"d",p:PL,c:"pfdot",t:"PF I",o:[4,-16],lc:"lbl pf1"},{k:"d",p:PR,c:"pfdot2",t:"PF D",o:[-62,-16],lc:"lbl pf2"}]},
    {t:"Arista cercana",d:"Dibuja una arista vertical entre los dos PF. Es la esquina del objeto más cercana a ti y la única línea que conserva su altura real. Aquí está debajo de la LH: veremos la cara superior.",
     items:[{k:"l",a:nT,b:nB,c:"edge"},{k:"t",p:[380,385],s:"arista cercana",a:"middle",c:"lbl s"}]},
    {t:"Cuatro líneas auxiliares",d:"Desde el extremo superior y el inferior de la arista, traza una auxiliar hacia PF I (rojas) y otra hacia PF D (azules).",
     items:[{k:"l",a:nT,b:PL,c:"aux1"},{k:"l",a:nB,b:PL,c:"aux1"},{k:"l",a:nT,b:PR,c:"aux2"},{k:"l",a:nB,b:PR,c:"aux2"}]},
    {t:"Ancho de cada cara",d:"Decide el ancho visible de cada cara y levanta una vertical en cada lado, entre las auxiliares. Una cara más ancha que la otra muestra mejor el giro del objeto.",
     items:[{k:"l",a:TL,b:BL,c:"edge"},{k:"l",a:TR,b:BR,c:"edge"}]},
    {t:"Cara superior: se cruzan las familias",d:"Desde la esquina superior izquierda traza hacia <b class='c2'>PF D</b>; desde la superior derecha, hacia <b class='c1'>PF I</b>. Donde se cortan está la esquina trasera.",
     items:[{k:"l",a:TL,b:PR,c:"aux2"},{k:"l",a:TR,b:PL,c:"aux1"},{k:"d",p:K,c:"inkdot",r:6}]},
    {t:"Repasa las aristas visibles",d:"Repasa con trazo firme. Cada arista horizontal pertenece a una familia: roja si va a PF I, azul si va a PF D. Las verticales quedan negras y paralelas.",dim:true,
     items:[{k:"p",pts:[nT,TL,K,TR],c:"facet"},{k:"p",pts:[nT,TL,BL,nB],c:"face1"},{k:"p",pts:[nT,TR,BR,nB],c:"face2"},
       {k:"l",a:nT,b:TL,c:"edge1"},{k:"l",a:nB,b:BL,c:"edge1"},{k:"l",a:nT,b:TR,c:"edge2"},{k:"l",a:nB,b:BR,c:"edge2"},{k:"l",a:TL,b:K,c:"edge2"},{k:"l",a:TR,b:K,c:"edge1"},
       {k:"l",a:BL,b:KB,c:"hid"},{k:"l",a:BR,b:KB,c:"hid"},{k:"l",a:K,b:KB,c:"hid"}]}
  ]);
})();

/* 2.5 dónde está el error */
(function(){
  const host=$("#errs");
  function base(s,cfg){
    const pl=cfg.pl,pr=cfg.pr,hy=pl[1],nT=[cfg.nx,cfg.yT],nB=[cfg.nx,cfg.yB];
    const TL=atX(nT,pl,cfg.xl),BL=atX(nB,pl,cfg.xl),TR=atX(nT,pr,cfg.xr),BR=atX(nB,pr,cfg.xr),K=inter(TL,pr,TR,pl);
    line(s,[0,hy],[320,hy],"lh");el("circle",{cx:pl[0],cy:hy,r:6,class:"pfdot"},s);el("circle",{cx:pr[0],cy:hy,r:6,class:"pfdot2"},s);
    txt(s,pl[0],hy-12,"PF I","lbl xs pf1",pl[0]<40?"start":"middle");txt(s,pr[0],hy-12,"PF D","lbl xs pf2",pr[0]>280?"end":"middle");
    return {nT:nT,nB:nB,TL:TL,BL:BL,TR:TR,BR:BR,K:K,pl:pl,pr:pr};
  }
  const cases=[
    {cfg:{pl:[12,70],pr:[308,70],nx:160,yT:105,yB:185,xl:95,xr:225},
     draw:function(s,g,fx){const B=g.BR;const bad=atX(g.nB,g.pl,225);
       poly(s,[g.nT,g.TL,g.K,g.TR],"facet");line(s,g.nT,g.TL,"edge1");line(s,g.nB,g.BL,"edge1");line(s,g.nT,g.TR,"edge2");line(s,g.TL,g.K,"edge2");line(s,g.TR,g.K,"edge1");
       line(s,g.TL,g.BL,"edge");line(s,g.nT,g.nB,"edge");line(s,g.TR,bad,"edge");line(s,g.nB,bad,"edge2");
       line(fx,g.nB,B,"fix");line(fx,B,g.pr,"fixd");line(fx,g.TR,B,"fix");},
     o:["Una arista vertical está inclinada","La arista inferior derecha se dirige al PF equivocado","Los dos PF no están sobre la misma LH"],a:1,
     e:"La arista inferior de la cara derecha prolonga la familia del PF I. Debe dirigirse al PF D, como la arista superior de esa misma cara."},
    {cfg:{pl:[12,70],pr:[308,70],nx:160,yT:105,yB:185,xl:95,xr:225},
     draw:function(s,g,fx){const bad=[g.BR[0]+22,g.BR[1]+3];
       poly(s,[g.nT,g.TL,g.K,g.TR],"facet");line(s,g.nT,g.TL,"edge1");line(s,g.nB,g.BL,"edge1");line(s,g.nT,g.TR,"edge2");line(s,g.TL,g.K,"edge2");line(s,g.TR,g.K,"edge1");
       line(s,g.TL,g.BL,"edge");line(s,g.nT,g.nB,"edge");line(s,g.TR,bad,"edge");line(s,g.nB,bad,"edge2");
       line(fx,g.TR,g.BR,"fix");line(fx,g.nB,g.BR,"fix");},
     o:["La arista vertical derecha está inclinada","La cara superior está mal cerrada","El ángulo de la esquina es menor de 90°"],a:0,
     e:"En dos puntos todas las verticales son paralelas. Inclinar una equivale a introducir sin querer un tercer punto de fuga."},
    {cfg:{pl:[105,70],pr:[215,70],nx:160,yT:96,yB:205,xl:136,xr:186},
     draw:function(s,g,fx){
       poly(s,[g.nT,g.TL,g.K,g.TR],"facet");line(s,g.nT,g.TL,"edge1");line(s,g.nB,g.BL,"edge1");line(s,g.nT,g.TR,"edge2");line(s,g.nB,g.BR,"edge2");line(s,g.TL,g.K,"edge2");line(s,g.TR,g.K,"edge1");
       line(s,g.TL,g.BL,"edge");line(s,g.TR,g.BR,"edge");line(s,g.nT,g.nB,"edge");
       line(s,g.nB,g.pl,"aux1");line(s,g.nB,g.pr,"aux2");
       const a1=Math.atan2(g.pl[1]-g.nB[1],g.pl[0]-g.nB[0]),a2=Math.atan2(g.pr[1]-g.nB[1],g.pr[0]-g.nB[0]);const ang=Math.round((a2-a1)*180/Math.PI);
       const pts=[];for(let i=0;i<=12;i++){const a=a1+(a2-a1)*i/12;pts.push((g.nB[0]+26*Math.cos(a)).toFixed(1)+","+(g.nB[1]+26*Math.sin(a)).toFixed(1));}
       el("polyline",{points:pts.join(" "),class:"arc",stroke:"#c77700"},fx);txt(fx,g.nB[0]+30,g.nB[1]-34,ang+"° (menor de 90°)","lbl xs warnc");
       txt(fx,160,248,"Solución: separar los PF","lbl xs okc","middle");},
     o:["Una arista va al PF equivocado","Falta la cara inferior","Los PF están demasiado cerca: la esquina mide menos de 90°"],a:2,
     e:"Con los PF tan juntos, el ángulo de la esquina cercana queda muy por debajo de 90° y el objeto parece estirado. Ubica los PF cerca de los bordes de la hoja."}
  ];
  cases.forEach(function(cs,ci){
    const card=document.createElement("div");card.className="errcard";
    const s=el("svg",{viewBox:"0 0 320 260"});s.style.background="#fffefb";
    const g=base(s,cs.cfg);const fx=el("g",{class:"fixlayer"});
    cs.draw(s,g,fx);s.appendChild(fx);
    txt(s,10,250,"Figura "+String.fromCharCode(65+ci),"lbl xs");
    card.appendChild(s);
    const b=document.createElement("div");b.className="body q";b.style.border="0";b.style.margin="0";
    b.innerHTML='<div class="qt">¿Cuál es el error?</div><div class="opts"></div><div class="fb"></div>';
    const opts=b.querySelector(".opts");
    cs.o.forEach(function(o,i){const bt=document.createElement("button");bt.type="button";bt.className="opt";bt.textContent=o;
      bt.addEventListener("click",function(){
        if(i===cs.a){bt.classList.add("right");b.classList.add("done");card.classList.add("solved");b.querySelector(".fb").innerHTML="<b>Correcto.</b> "+cs.e;}
        else{bt.classList.add("wrong");bt.disabled=true;}
      });opts.appendChild(bt);});
    card.appendChild(b);host.appendChild(card);
  });
})();

quiz($("#quiz2"),$("#quiz2s"),[
  {q:"En perspectiva de dos puntos, ¿cuántas familias de aristas convergen a un punto de fuga?",o:["Una","Dos","Tres"],a:1,e:"Las dos familias horizontales convergen, cada una a su PF. Las verticales se mantienen paralelas."},
  {q:"Cuando la caja empieza a girar desde la vista frontal, el PF derecho…",o:["aparece en el centro de la hoja","llega desde muy lejos y se acerca a medida que aumenta el giro","no existe hasta que el giro llega a 45°"],a:1,e:"Con giros pequeños las aristas de ancho casi son horizontales, así que su PF está muy lejos. Lo viste en la figura 2.1."},
  {q:"Una arista de la cara izquierda del objeto debe dirigirse…",o:["al PF I","al PF D","a cualquiera de los dos"],a:0,e:"Cada cara tiene sus aristas horizontales en una sola familia. Mezclar familias produce un sólido torcido."},
  {q:"Si acercas mucho los dos PF al objeto, el dibujo…",o:["se ve más natural","se ve más deformado","no cambia"],a:1,e:"El ángulo de la esquina cercana baja de 90° y el objeto se ve estirado."}
]);

/* ---------- persistencia de casillas ---------- */
(function(){
  const ls=store();
  document.querySelectorAll("[data-key]").forEach(function(group){
    const key="dt11-g1-"+group.getAttribute("data-key");
    const boxes=group.querySelectorAll("input[type=checkbox]");
    let saved=[];try{saved=JSON.parse((ls&&ls.getItem(key))||"[]");}catch(e){saved=[];}
    boxes.forEach(function(b,i){
      b.checked=!!saved[i];
      const stg=b.closest(".stage");if(stg)stg.classList.toggle("done",b.checked);
      b.addEventListener("change",function(){
        if(stg)stg.classList.toggle("done",b.checked);
        const arr=Array.prototype.map.call(boxes,function(x){return x.checked;});
        try{if(ls)ls.setItem(key,JSON.stringify(arr));}catch(e){}
      });
    });
  });
})();
})();
