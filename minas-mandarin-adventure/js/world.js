// Overworld: tile map, wandering villagers, tap-to-walk, D-pad/keyboard movement.
const C=14,Rw=16,TS=32,NEED={animals:0,food:4,nature:8},DIRS=[[0,1],[-1,0],[1,0],[0,-1]],EM={cat:"🐱",bear:"🐻",frog:"🐸",rabbit:"🐰",pig:"🐷"};
const BLD=[{n:"My Home",x:5,y:2,c:"#ff9db8",go:"home"},{n:"Shop",x:1,y:5,c:"#6fc3e8",go:"shop"},{n:"Museum",x:10,y:5,c:"#b79cf0",go:"museum"}];
const land=(x,y)=>{const a=(x-6.5)/6.4,b=(y-7.5)/7.4,d=a*a+b*b;return d>1?"~":d>.78?"s":"g"};
const T=Array.from({length:Rw},(_,y)=>Array.from({length:C},(_,x)=>land(x,y)));
for(let y=10;y<12;y++)for(let x=10;x<13;x++)T[y][x]="~";
for(let y=4;y<14;y++)T[y][6]="p";for(let x=2;x<12;x++)T[8][x]="p";T[7][2]=T[7][11]="p";
const fp=(x,y)=>BLD.some(b=>x>=b.x&&x<b.x+3&&y>=b.y&&y<b.y+2);
const TREES=[[1,9],[1,11],[3,14],[5,14],[8,14],[10,13],[12,8],[1,3],[3,2],[9,2],[11,2],[4,6]].filter(([x,y])=>T[y][x]!=="~"&&T[y][x]!=="p"&&!fp(x,y)),TSET=new Set(TREES.map(t=>t.join()));
const mk=o=>Object.assign({tx:o.x,ty:o.y,p:0,mv:0,f:0,tm:1+Math.random()*2},o);
const PL=mk({x:6,y:9});
const NP=[{n:"Pip",k:"cat",th:"animals",x:7,y:11},{n:"Momo",k:"bear",th:"food",x:3,y:11},{n:"Finn",k:"frog",th:"nature",x:9,y:10},{n:"Bun",k:"rabbit",x:4,y:3,say:"你好! Nǐ hǎo! That means hello!",w:"你好"},{n:"Pinky",k:"pig",x:9,y:3,say:"谢谢! Xièxie! That means thank you!",w:"谢谢"}].map(o=>mk(Object.assign(o,{hx:o.x,hy:o.y})));
let WR=0,WD=0,WL=0,WDIR=[0,0],WPATH=[],WWANT=null,WPET,Dlg=false,SC,X,ST,DPR=1;
const occ=(x,y,me)=>[PL,...NP].some(o=>o!==me&&((o.x===x&&o.y===y)||(o.mv&&o.tx===x&&o.ty===y)));
const pass=(x,y,me)=>x>=0&&y>=0&&x<C&&y<Rw&&T[y][x]!=="~"&&!TSET.has(x+","+y)&&!fp(x,y)&&!occ(x,y,me);
function step(m,dx,dy){m.f=DIRS.findIndex(d=>d[0]===dx&&d[1]===dy);if(!pass(m.x+dx,m.y+dy,m))return 0;m.tx=m.x+dx;m.ty=m.y+dy;m.p=0;m.mv=1;return 1}
const adv=(m,dt,sp)=>{if(!m.mv)return 0;m.p+=dt*sp;if(m.p>=1){m.x=m.tx;m.y=m.ty;m.p=0;m.mv=0;return 1}return 0};
const ex=m=>m.x+(m.tx-m.x)*(m.mv?m.p:0),ey=m=>m.y+(m.ty-m.y)*(m.mv?m.p:0);
function route(tx,ty){const g=pass(tx,ty,PL)?[[tx,ty]]:DIRS.map(d=>[tx+d[0],ty+d[1]]).filter(p=>pass(p[0],p[1],PL));if(!g.length)return null;const sx=PL.mv?PL.tx:PL.x,sy=PL.mv?PL.ty:PL.y,q=[[sx,sy]],pr={[sx+","+sy]:null};
while(q.length){const[x,y]=q.shift();if(g.some(p=>p[0]===x&&p[1]===y)){const r=[];let k=x+","+y;while(pr[k]){r.unshift(pr[k][1]);k=pr[k][0]}return r}
for(const d of DIRS){const nx=x+d[0],ny=y+d[1],k=nx+","+ny;if(!(k in pr)&&pass(nx,ny,PL)){pr[k]=[x+","+y,d];q.push([nx,ny])}}}return null}
function tapAt(e){if(Dlg)return;const r=SC.getBoundingClientRect(),tx=Math.floor((e.clientX-r.left)/r.width*C),ty=Math.floor((e.clientY-r.top)/r.height*Rw);
const b=BLD.find(b=>tx>=b.x&&tx<b.x+3&&ty>=b.y&&ty<b.y+2),n=NP.find(o=>(o.x===tx&&o.y===ty)||(o.mv&&o.tx===tx&&o.ty===ty));
WWANT=n||null;const p=route(b?b.x+1:tx,b?b.y+2:ty);if(p){WPATH=p;WDIR=[0,0]}else toast("Can’t walk there!")}
function arrive(){const b=BLD.find(b=>PL.x===b.x+1&&PL.y===b.y+2);if(b){PL.x=PL.tx=b.x+1;PL.y=PL.ty=b.y+3;WPATH=[];WWANT=null;go(b.go)}}
function face(a,b){a.f=DIRS.findIndex(d=>d[0]===b.x-a.x&&d[1]===b.y-a.y)}
function talk(n){Dlg=true;WDIR=[0,0];WPATH=[];face(n,PL);const need=n.th?NEED[n.th]:0,lk=n.th&&learned()<need;let t,b=`<button class="btn g" onclick="WCL()">OK</button>`;
if(!n.th){t=n.say;speak(n.w)}else if(lk)t=`${n.n} says: learn ${need} words first! You know ${learned()} so far.`;
else{t=TH[n.th].say;b=`<button class="btn" onclick="WGO('${n.th}')">Let’s learn!</button><button class="btn g" onclick="WCL()">Later</button>`}
const d=$("#dlg");d.innerHTML=`<div class="bub"><em>${EM[n.k]}<small>${n.n}</small></em><div>${t}</div></div><div class="dr">${b}</div>`;d.style.display="block"}
function WCL(){Dlg=false;$("#dlg").style.display="none"}
function WGO(th){Dlg=false;begin(th)}
function action(){if(Dlg||PL.mv)return;const f=DIRS[PL.f],n=NP.find(o=>o.x===PL.x+f[0]&&o.y===PL.y+f[1])||NP.find(o=>Math.abs(o.x-PL.x)+Math.abs(o.y-PL.y)===1);if(n){face(PL,n);talk(n)}else toast("Walk up to a villager and tap A!")}
function tick(ts){if(!WR)return;const dt=Math.min(.05,(ts-WL)/1000||0);WL=ts;WD=ts;
if(!Dlg){if(!PL.mv){const d=(WDIR[0]||WDIR[1])?WDIR:WPATH.shift();if(d){const px=PL.x,py=PL.y;if(step(PL,d[0],d[1])){WPET.tx=px;WPET.ty=py}else WPATH=[]}}
if(adv(PL,dt,5.5)){arrive();if(!WR)return}
if(!PL.mv&&WWANT&&!WPATH.length){const n=WWANT;WWANT=null;if(Math.abs(n.x-PL.x)+Math.abs(n.y-PL.y)===1){face(PL,n);talk(n)}}}
NP.forEach(n=>{if(!Dlg&&!n.mv){n.tm-=dt;if(n.tm<=0){n.tm=1+Math.random()*2.5;const d=rnd(DIRS),nx=n.x+d[0],ny=n.y+d[1];if(Math.abs(nx-n.hx)<=2&&Math.abs(ny-n.hy)<=2)step(n,d[0],d[1])}}adv(n,dt,2.2)});
const q=WPET,dx=q.tx-q.x,dy=q.ty-q.y,dd=Math.hypot(dx,dy);if(dd>.05){const s=Math.min(dd,5*dt);q.x+=dx/dd*s;q.y+=dy/dd*s}
draw();WR=requestAnimationFrame(tick)}
const hs=(x,y)=>(Math.imul(x*31+y,2654435761)>>>0)%97;
function mkStatic(){const o=document.createElement("canvas");o.width=C*TS*DPR;o.height=Rw*TS*DPR;const g=o.getContext("2d");g.scale(DPR,DPR);
for(let y=0;y<Rw;y++)for(let x=0;x<C;x++){const t=T[y][x],X0=x*TS,Y=y*TS,h=hs(x,y);
g.fillStyle=t==="~"?"#7fd3e8":t==="s"?"#f6e2a6":t==="p"?"#ecd09a":(x+y)%2?"#b9e77a":"#b2e272";g.fillRect(X0,Y,TS,TS);
if(t==="g"){g.fillStyle="#97d160";if(h%3==0){g.fillRect(X0+8,Y+10,2,5);g.fillRect(X0+12,Y+12,2,4)}if(h%7==1){g.fillStyle=["#ff9db8","#fff","#ffd54f"][h%3];g.fillRect(X0+16,Y+18,4,4);g.fillStyle="#ffd54f";g.fillRect(X0+17,Y+19,2,2)}}
if(t==="s"&&h%4==0){g.fillStyle="#e8cf8c";g.fillRect(X0+10,Y+14,3,3)}
if(t==="p"&&h%3==0){g.fillStyle="#dcb97c";g.fillRect(X0+6,Y+8,4,3)}
if(t==="~")[[0,-1,0,0,TS,3],[0,1,0,TS-3,TS,3],[-1,0,0,0,3,TS],[1,0,TS-3,0,3,TS]].forEach(([dx,dy,a,b,w,hh])=>{const n=T[y+dy]&&T[y+dy][x+dx];if(n&&n!=="~"){g.fillStyle="rgba(255,255,255,.7)";g.fillRect(X0+a,Y+b,w,hh)}})}
for(let y=10;y<=12;y++)for(let x=2;x<=4;x++){if(T[y][x]!=="g")continue;g.fillStyle="#9b6b43";g.fillRect(x*TS+2,y*TS+4,TS-4,TS-8);for(let i=0;i<4;i++){g.fillStyle=["#ff7aa2","#fff","#ffd54f","#c9a0ff"][(x+y+i)%4];g.fillRect(x*TS+6+(i%2)*14,y*TS+8+(i>>1)*12,6,6)}}
return o}
const el=(g,x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill()};
const rr=(g,x,y,w,h,r,c)=>{g.fillStyle=c;g.beginPath();g.roundRect?g.roundRect(x,y,w,h,r):g.rect(x,y,w,h);g.fill()};
const eyes=(g,cx,cy,f)=>{if(f===3)return;(f===0?[-4,4]:f===1?[-5]:[5]).forEach(o=>el(g,cx+o,cy,1.8,2.4,"#3b2a33"))};
function tree(g,x,y){const cx=x*TS+16,b=y*TS;el(g,cx,b+29,13,5,"rgba(0,0,0,.15)");rr(g,cx-3,b+15,6,14,2,"#a9744a");el(g,cx,b+10,15,13,"#4fa64f");el(g,cx-4,b+6,9,7,"#6cc26a");if((x+y)%3===0){el(g,cx+6,b+12,2.5,2.5,"#ff6b6b");el(g,cx-7,b+14,2.5,2.5,"#ff6b6b")}}
function bld(g,b){const x=b.x*TS,y=b.y*TS,w=3*TS,h=2*TS;el(g,x+w/2,y+h+1,w/2+4,6,"rgba(0,0,0,.15)");rr(g,x+4,y+22,w-8,h-22,3,"#fff3d6");
rr(g,x+10,y+34,16,14,3,"#bfe8ff");rr(g,x+w-26,y+34,16,14,3,"#bfe8ff");rr(g,x+w/2-9,y+h-26,18,26,[9,9,0,0],"#a9744a");el(g,x+w/2+4,y+h-12,1.8,1.8,"#ffd54f");
g.fillStyle=b.c;g.beginPath();g.moveTo(x-2,y+27);g.lineTo(x+14,y+2);g.lineTo(x+w-14,y+2);g.lineTo(x+w+2,y+27);g.fill();g.fillStyle="rgba(255,255,255,.25)";for(let i=1;i<5;i++)g.fillRect(x+10+i*(w-20)/5,y+4,3,22);
rr(g,x+w/2-14,y+h+6,28,10,4,"rgba(255,213,79,.9)");g.font="bold 11px ui-rounded,system-ui";const tw=g.measureText(b.n).width+14;rr(g,x+w/2-tw/2,y-12,tw,16,8,"#fff");g.fillStyle="#5b4636";g.textAlign="center";g.fillText(b.n,x+w/2,y)}
function npc(g,n,t){const cx=(ex(n)+.5)*TS,cy=(ey(n)+1)*TS-3,bob=n.mv?Math.abs(Math.sin(t/70))*3:0,c={cat:"#ffb36b",bear:"#b98557",frog:"#7ed36b",rabbit:"#fffaf5",pig:"#ffb3c7"}[n.k],hy=cy-18-bob;
el(g,cx,cy+2,11,4,"rgba(0,0,0,.18)");el(g,cx,cy-7-bob,8,7,c);el(g,cx,cy-6-bob,5,5,"rgba(255,255,255,.55)");
if(n.k==="cat"||n.k==="pig")[-1,1].forEach(s=>{g.fillStyle=c;g.beginPath();g.moveTo(cx+s*4,hy-8);g.lineTo(cx+s*11,hy-15+(n.k==="pig"?4:0));g.lineTo(cx+s*11,hy-2);g.fill()});
if(n.k==="bear")[-1,1].forEach(s=>el(g,cx+s*9,hy-8,4,4,c));
if(n.k==="rabbit")[-1,1].forEach(s=>{el(g,cx+s*5,hy-16,3.5,9,c);el(g,cx+s*5,hy-15,1.8,6,"#ffb3c7")});
el(g,cx,hy,11,10.5,c);
if(n.k==="frog")[-1,1].forEach(s=>{el(g,cx+s*6,hy-9,5,5,"#fff");el(g,cx+s*6+(n.f===1?-1:n.f===2?1:0),hy-9,2.4,2.4,"#3b2a33")});
if(n.f!==3){if(n.k!=="frog")eyes(g,cx,hy+1,n.f);[-1,1].forEach(s=>el(g,cx+s*7,hy+5,2.5,1.8,"rgba(255,120,150,.5)"));if(n.k==="pig")el(g,cx,hy+5,4,3,"#ff8fb0");if(n.k==="cat")el(g,cx,hy+4,1.5,1,"#d9667a")}
if(n.th){g.font="bold 18px serif";g.textAlign="center";g.fillText(learned()<NEED[n.th]?"🔒":"❗",cx,hy-20-Math.abs(Math.sin(t/300))*3)}}
function me(g,t){const cx=(ex(PL)+.5)*TS,cy=(ey(PL)+1)*TS-3,bob=PL.mv?Math.abs(Math.sin(t/60))*3:0,hy=cy-19-bob,h=I(S.eq.hair||"hair0"),tp=I(S.eq.top||"top0"),f=PL.f,lf=PL.mv?Math.sin(t/60)*2:0;
el(g,cx,cy+2,11,4,"rgba(0,0,0,.18)");
if(h.k==="long")rr(g,cx-12,hy-4,24,22,8,h.c);else if(h.k==="bob")el(g,cx,hy+1,12,12,h.c);
if(h.k==="pig")[-1,1].forEach(s=>el(g,cx+s*12,hy+6,4,8,h.c));
el(g,cx-4,cy-1+lf,3.5,2.5,"#fff");el(g,cx+4,cy-1-lf,3.5,2.5,"#fff");rr(g,cx-7,cy-13-bob,14,11,4,tp.c);el(g,cx,hy,10,10,"#ffdcc0");
if(h.k==="buns")[-1,1].forEach(s=>el(g,cx+s*8,hy-10,4.5,4.5,h.c));
g.fillStyle=h.c;g.beginPath();g.ellipse(cx,hy-1,10.5,9.5,0,f===3?0:Math.PI,f===3?7:Math.PI*2);g.fill();
if(f!==3){eyes(g,cx,hy+2,f);[-1,1].forEach(s=>el(g,cx+s*6,hy+6,2.3,1.6,"rgba(255,120,150,.5)"))}
g.textAlign="center";if(S.eq.glass&&f!==3){g.font="15px serif";g.fillText(I(S.eq.glass).e,cx,hy+7)}
if(S.eq.bow){g.font="12px serif";g.fillText(I(S.eq.bow).e,cx+8,hy-8)}if(S.eq.hat){g.font="22px serif";g.fillText(I(S.eq.hat).e,cx,hy-6)}}
function pet(g,t){if(!S.eq.pet)return;const mv=Math.hypot(WPET.tx-WPET.x,WPET.ty-WPET.y)>.05,x=(WPET.x+.5)*TS,y=(WPET.y+1)*TS;g.font="22px serif";g.textAlign="center";el(g,x,y-2,8,3,"rgba(0,0,0,.15)");g.fillText(I(S.eq.pet).e,x,y-5-(mv?Math.abs(Math.sin(t/80))*4:0))}
function draw(){const g=X;g.drawImage(ST,0,0,C*TS,Rw*TS);g.fillStyle="rgba(255,255,255,.35)";
for(let y=0;y<Rw;y++)for(let x=0;x<C;x++)if(T[y][x]==="~"&&(x+y)%2===0)g.fillRect(x*TS+6+Math.sin(WD/600+x+y)*4,y*TS+12,10,2);
const L=[];TREES.forEach(([x,y])=>L.push([y+1,()=>tree(g,x,y)]));BLD.forEach(b=>L.push([b.y+2,()=>bld(g,b)]));NP.forEach(n=>L.push([ey(n)+1,()=>npc(g,n,WD)]));L.push([ey(PL)+1,()=>me(g,WD)]);L.push([WPET.y+1,()=>pet(g,WD)]);
L.sort((a,b)=>a[0]-b[0]).forEach(l=>l[1]());g.fillStyle=tint();g.fillRect(0,0,C*TS,Rw*TS)}
function fit(){const w=$("#wd"),bar=$(".bar"),aw=$(".scr").clientWidth-28,ah=$("#app").clientHeight-(bar?bar.offsetHeight:0)-60,s=Math.max(200,Math.min(aw,ah*C/Rw));w.style.width=s+"px";SC.style.width="100%";SC.style.height=s*Rw/C+"px"}
function mountWorld(){SC=$("#wc");DPR=Math.min(2,devicePixelRatio||1);SC.width=C*TS*DPR;SC.height=Rw*TS*DPR;X=SC.getContext("2d");X.scale(DPR,DPR);ST=ST||mkStatic();
Dlg=false;WDIR=[0,0];WPATH=[];WWANT=null;[PL,...NP].forEach(m=>{m.mv=0;m.p=0;m.x=m.tx;m.y=m.ty});WPET={x:PL.x,y:PL.y,tx:PL.x,ty:PL.y};fit();SC.onpointerdown=tapAt;
const dp=$(".dp");dp.onpointerdown=e=>{const b=e.target.closest("button");if(!b)return;WDIR=b.dataset.d.split(",").map(Number);WPATH=[];WWANT=null;dp.setPointerCapture(e.pointerId)};dp.onpointerup=dp.onpointercancel=()=>{WDIR=[0,0]};
$("#ab").onclick=action;cancelAnimationFrame(WR);WL=performance.now();WR=requestAnimationFrame(tick)}
function stopWorld(){cancelAnimationFrame(WR);WR=0}
const KM={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};
addEventListener("keydown",e=>{if(!WR)return;const d=KM[e.key];if(d){WDIR=d;WPATH=[];e.preventDefault()}else if(e.key==="Enter"||e.key===" "){action();e.preventDefault()}});
addEventListener("keyup",e=>{if(KM[e.key]&&WDIR===KM[e.key])WDIR=[0,0]});
addEventListener("resize",()=>{if(WR)fit()});
