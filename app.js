document.addEventListener('DOMContentLoaded', () => {
(()=>{'use strict';const ids=['about','experience','achievements','skills','projects','contacts'];let lang='ru';try{lang=localStorage.getItem('mk-lang')==='en'?'en':'ru'}catch{}const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function render(){const d=CONTENT[lang],open=[...document.querySelectorAll('.career')].map(x=>x.open);document.documentElement.lang=lang;document.title=d.name+' — Product & Systems';$('meta[name=description]').content=d.desc;document.querySelectorAll('[data-t]').forEach(e=>e.textContent=d[e.dataset.t]);document.querySelectorAll('[data-nav]').forEach(e=>e.textContent=d.nav[e.dataset.nav]);$('#nav').innerHTML=ids.map((id,i)=>`<a href="#${id}">${d.nav[i]}</a>`).join('');$('#lang').textContent=lang==='ru'?'EN':'RU';$('#lang').setAttribute('aria-label',lang==='ru'?'Switch to English':'Переключить на русский');$('#theme').setAttribute('aria-label',d.theme);$('#menu').setAttribute('aria-label',d.menu);document.querySelectorAll('.pdf-link').forEach(a=>a.href=`assets/Maxim-Kurylev-${lang.toUpperCase()}.pdf`);document.querySelectorAll('.pdf-lang').forEach(e=>e.textContent=lang.toUpperCase());$('#journey').innerHTML=d.route.map((x,i)=>`<div><small>0${i+1}</small><h3>${x}</h3><p>${d.routeSub[i]}</p></div>`).join('');$('#timeline').innerHTML=d.roles.map((r,i)=>`<details class="career" ${open.length?open[i]?'open':'':i===0?'open':''}><summary><time>${r.date}</time><div><h3>${r.company}</h3><span class="job">${r.title}</span></div><span class="plus" aria-hidden="true">+</span></summary><ul>${r.bullets.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></details>`).join('');$('#achievements-grid').innerHTML=d.achievements.map(a=>`<article class="achievement"><strong>${a.value}</strong><h3>${a.title}</h3><p>${a.text}</p></article>`).join('');$('#skill-list').innerHTML=d.skillGroups.map(([title,text])=>`<div class="skill-row"><h3>${title}</h3><p>${text}</p></div>`).join('');$('#education-list').innerHTML=d.education.map(t=>`<li>${t}</li>`).join('');$('#project-list').innerHTML=d.projects.map((p,i)=>`<article class="project"><span class="project-num">0${i+1}</span><div><span class="project-tag">${p.tag}</span><h3>${p.name}</h3></div><div><p>${p.text}</p><div class="actions">${p.links.map(([t,url])=>`<a class="text-link" href="${url}" target="_blank" rel="noopener noreferrer">${t} ↗</a>`).join('')}</div></div></article>`).join('');$('#status').textContent=''}render();$('meta[name=theme-color]').content=document.documentElement.dataset.theme==='light'?'#f7f8f4':'#0c1618';$('#theme').setAttribute('aria-pressed',String(document.documentElement.dataset.theme==='light'));$('#lang').onclick=()=>{lang=lang==='ru'?'en':'ru';try{localStorage.setItem('mk-lang',lang)}catch{}render()};$('#theme').onclick=()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;$('#theme').setAttribute('aria-pressed',String(t==='light'));$('meta[name=theme-color]').content=t==='dark'?'#0c1618':'#f7f8f4';try{localStorage.setItem('mk-theme',t)}catch{}};$('#menu').onclick=()=>{const open=$('#nav').classList.toggle('is-open');$('#menu').setAttribute('aria-expanded',String(open))};$('#nav').addEventListener('click',e=>{if(e.target.closest('a')){$('#nav').classList.remove('is-open');$('#menu').setAttribute('aria-expanded','false')}});document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#nav').classList.remove('is-open');$('#menu').setAttribute('aria-expanded','false')}});$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText('kourilev@mail.ru');$('#status').textContent=CONTENT[lang].copied}catch{$('#status').textContent=CONTENT[lang].copyFail}};if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)document.querySelectorAll('#nav a').forEach(a=>a.setAttribute('aria-current',String(a.hash==='#'+e.target.id)))}),{rootMargin:'-15% 0px -55% 0px'});ids.forEach(id=>observer.observe(document.getElementById(id)))} })();
}, { once: true });

// Orbital scene: dependency-free canvas, with a static CSS fallback.
document.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('.system-visual');
  if (!scene) return;
  const stage = scene.querySelector('.orbit-stage');
  const canvas = scene.querySelector('.orbit-canvas');
  const core = scene.querySelector('.orb-core');
  const toggle = scene.querySelector('.motion-toggle');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  let width = 0, height = 0, frame = 0, last = 0, clock = 0;
  let visible = true, paused = false, hovered = false, light = false;
  let mouseX = 0, mouseY = 0, tiltX = 0, tiltY = 0, presence = 0;
  let pulse = 0, pulseTimer;
  const rings = [
    { tilt: 1.04, angle: -.64, speed: .049, travel: .24, phase: .65, radius: 1, color: 0 },
    { tilt: 1.12, angle: .66, speed: -.037, travel: -.18, phase: 3.2, radius: .99, color: 1 },
    { tilt: .78, angle: 1.75, speed: .028, travel: .145, phase: 4.8, radius: .94, color: 2 }
  ];
  const rgb = (color, alpha) => `rgba(${color.join(',')},${alpha})`;
  const palette = () => light ? [[40,118,96],[87,133,116],[150,119,66]] : [[158,213,189],[99,157,143],[212,191,152]];

  function project(angle, ring, radius) {
    const inclination = ring.tilt + Math.sin(clock * .09 + ring.phase) * .075;
    const azimuth = ring.angle + clock * ring.speed;
    let x = Math.cos(angle) * radius * ring.radius;
    let y = Math.sin(angle) * radius * ring.radius * Math.cos(inclination);
    let z = Math.sin(angle) * radius * ring.radius * Math.sin(inclination);
    [x, y] = [x * Math.cos(azimuth) - y * Math.sin(azimuth), x * Math.sin(azimuth) + y * Math.cos(azimuth)];
    const rx = tiltY * .20, ry = tiltX * .20;
    [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
    [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
    const depth = 1 / (1 - z / (radius * 5));
    return { x: width / 2 + x * depth, y: height / 2 + y * depth, z: z / radius, depth };
  }

  function paint() {
    // Clear physical pixels too: fractional layout sizes otherwise leave a hairline.
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.restore();
    const radius = Math.min(width, height) * .41, colors = palette();
    if (!radius) return;
    const haze = ctx.createRadialGradient(width / 2 + tiltX * radius * .35, height / 2 + tiltY * radius * .35, 0, width / 2, height / 2, radius * 1.45);
    haze.addColorStop(0, rgb(colors[0], .035 + presence * .065 + pulse * .07));
    haze.addColorStop(1, rgb(colors[0], 0));
    ctx.fillStyle = haze; ctx.fillRect(0, 0, width, height);

    rings.forEach(ring => {
      const color = colors[ring.color];
      // Depth changes the line weight and opacity without a rotating text layer.
      for (let i = 0; i < 112; i++) {
        const a = project(i / 112 * TAU, ring, radius);
        const b = project((i + 1) / 112 * TAU, ring, radius);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.lineWidth = .65 + (a.z + 1) * .22;
        ctx.strokeStyle = rgb(color, .14 + (a.z + 1) * .13 + presence * .07 + pulse * .12);
        ctx.stroke();
      }
      const angle = clock * ring.travel + ring.phase;
      // Short, fading trajectories make the motion legible at a glance.
      for (let i = 16; i >= 1; i--) {
        const a = project(angle - Math.sign(ring.travel) * i * .018, ring, radius);
        const b = project(angle - Math.sign(ring.travel) * (i - 1) * .018, ring, radius);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = rgb(color, (1 - i / 17) * .42);
        ctx.lineWidth = 1.5 * a.depth; ctx.stroke();
      }
      const p = project(angle, ring, radius);
      const glow = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,13 * p.depth);
      glow.addColorStop(0,rgb(color,.35 + presence * .15)); glow.addColorStop(1,rgb(color,0));
      ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(p.x,p.y,13*p.depth,0,TAU);ctx.fill();
      ctx.fillStyle = rgb(color,.85);ctx.beginPath();ctx.arc(p.x,p.y,2.3*p.depth,0,TAU);ctx.fill();
      ctx.fillStyle = light ? '#fff' : '#e5fff0';ctx.beginPath();ctx.arc(p.x-.3,p.y-.4,.85*p.depth,0,TAU);ctx.fill();
      const companion = project(angle + Math.PI * .83,ring,radius);
      ctx.fillStyle=rgb(color,.35);ctx.beginPath();ctx.arc(companion.x,companion.y,1,0,TAU);ctx.fill();
    });

    if (pulse > 0 && !reduce.matches) {
      const elapsed = 1 - pulse;
      for (let i=0; i<2; i++) {
        const progress = elapsed * 1.35 - i * .18;
        if (progress <= 0 || progress >= 1) continue;
        ctx.beginPath();ctx.ellipse(width/2,height/2,radius*(.38+progress*1.05),radius*(.31+progress*.89),-.12,0,TAU);
        ctx.lineWidth=1.2;ctx.strokeStyle=rgb(colors[i===0?0:2],Math.sin(progress*Math.PI)*.35*(1-progress));ctx.stroke();
      }
    }
  }

  function tick(now) {
    frame=0;
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;
    const easing=1-Math.exp(-dt*5);
    tiltX+=(mouseX-tiltX)*easing;tiltY+=(mouseY-tiltY)*easing;
    presence+=((hovered?1:0)-presence)*easing;
    clock+=dt*(1+pulse*.6);pulse=Math.max(0,pulse-dt/1.8);
    core.style.setProperty('--lean-x',`${-tiltY*5}deg`);
    core.style.setProperty('--lean-y',`${tiltX*7}deg`);
    core.style.setProperty('--shine-x',`${50+tiltX*27}%`);
    core.style.setProperty('--shine-y',`${50+tiltY*27}%`);
    paint();schedule();
  }
  function schedule() {
    if (!frame && visible && !document.hidden && !paused && !reduce.matches) frame=requestAnimationFrame(tick);
  }
  function refresh() {
    if(frame)cancelAnimationFrame(frame);frame=0;last=0;
    scene.classList.toggle('motion-still',paused||reduce.matches);
    paint();schedule();
  }
  function labels() {
    const en=document.documentElement.lang==='en';
    light=document.documentElement.dataset.theme==='light';
    core.setAttribute('aria-label',en?'Send a pulse through the orbits':'Запустить световой импульс по орбитам');
    toggle.setAttribute('aria-label',en?(paused?'Resume orbital animation':'Pause orbital animation'):(paused?'Возобновить анимацию орбит':'Приостановить анимацию орбит'));
    toggle.setAttribute('aria-pressed',String(paused));
    toggle.title=toggle.getAttribute('aria-label');
    scene.querySelector('.orbital-hint').textContent=reduce.matches?(en?'SELECT THE CORE':'НАЖМИТЕ НА ЦЕНТР'):(en?'HOVER · CLICK TO CONNECT':'НАВЕДИТЕ · НАЖМИТЕ');
    paint();
  }
  function resize() {
    const box=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    width=box.width;height=box.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);paint();
  }
  stage.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch'||paused||reduce.matches)return;
    const rect=stage.getBoundingClientRect();mouseX=(e.clientX-rect.left)/rect.width*2-1;mouseY=(e.clientY-rect.top)/rect.height*2-1;
    hovered=true;scene.classList.add('is-engaged');
  });
  const leave=()=>{mouseX=mouseY=0;hovered=false;scene.classList.remove('is-engaged')};
  stage.addEventListener('pointerleave',leave);
  stage.addEventListener('pointercancel',leave);
  core.addEventListener('focus',()=>{hovered=true;scene.classList.add('is-engaged')});
  core.addEventListener('blur',leave);
  stage.addEventListener('click',()=>{
    pulse=1;scene.classList.remove('is-pulsing');void core.offsetWidth;scene.classList.add('is-pulsing');
    clearTimeout(pulseTimer);pulseTimer=setTimeout(()=>{scene.classList.remove('is-pulsing');if(paused||reduce.matches){pulse=0;paint()}},1800);
    paint();
  });
  toggle.addEventListener('click',()=>{paused=!paused;leave();labels();refresh()});
  reduce.addEventListener('change',()=>{leave();labels();refresh()});
  document.addEventListener('visibilitychange',refresh);
  new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:['lang','data-theme']});
  new ResizeObserver(resize).observe(stage);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;refresh()},{threshold:.01}).observe(scene);
  labels();resize();scene.classList.add('orbit-ready');refresh();
}, { once: true });
