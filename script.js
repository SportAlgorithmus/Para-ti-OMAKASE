/* =========================================================
   OMAKASE — dedicatoria interactiva
   Partículas que arman el símbolo ">|<" y luego dan paso
   al "menú" del álbum.
========================================================= */

const introSection = document.getElementById('intro');
const galaxyCanvas  = document.getElementById('galaxy');
const gctx          = galaxyCanvas.getContext('2d');
const menu           = document.getElementById('menu');

let W, H, DPR;
function resizeGalaxy(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = galaxyCanvas.width  = window.innerWidth  * DPR;
  H = galaxyCanvas.height = window.innerHeight * DPR;
  galaxyCanvas.style.width  = window.innerWidth + 'px';
  galaxyCanvas.style.height = window.innerHeight + 'px';
}
resizeGalaxy();
window.addEventListener('resize', resizeGalaxy);

/* ---------- 1. sample points from the ">|<" glyph ---------- */
function sampleSymbolPoints(count){
  const off = document.createElement('canvas');
  off.width = window.innerWidth;
  off.height = window.innerHeight;
  const octx = off.getContext('2d');
  octx.clearRect(0,0,off.width,off.height);

  const fontSize = Math.min(off.width, off.height) * 0.4;
  octx.fillStyle = '#fff';
  octx.font = `900 ${fontSize}px Arial, sans-serif`;
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  // slightly condensed by scaling horizontally
  octx.save();
  octx.translate(off.width/2, off.height/2);
  octx.scale(1, 1);
  octx.fillText('>|<', 0, 0);
  octx.restore();

  const img = octx.getImageData(0,0,off.width,off.height).data;
  const points = [];
  const step = 3; // sampling density
  for(let y=0; y<off.height; y+=step){
    for(let x=0; x<off.width; x+=step){
      const idx = (y*off.width + x) * 4 + 3;
      if(img[idx] > 128){
        points.push({ x: x*DPR, y: y*DPR });
      }
    }
  }
  // shuffle & trim/pad to count
  for(let i=points.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [points[i],points[j]] = [points[j],points[i]];
  }
  const result = [];
  for(let i=0;i<count;i++){
    result.push(points[i % points.length]);
  }
  return result;
}

/* ---------- 2. particle system ---------- */
const PARTICLE_COUNT = 900;
let particles = [];
let stars = [];
let assembled = false;
let startTime = null;

function initParticles(){
  const targets = sampleSymbolPoints(PARTICLE_COUNT);
  particles = targets.map(t => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.max(W,H) * (0.5 + Math.random()*0.6);
    return {
      x: W/2 + Math.cos(angle)*radius,
      y: H/2 + Math.sin(angle)*radius,
      tx: t.x,
      ty: t.y,
      size: (Math.random()*1.6 + 0.6) * DPR,
      speed: 0.02 + Math.random()*0.03,
      hue: Math.random() < 0.15 ? 'gold' : 'bone',
      twinkle: Math.random()*Math.PI*2
    };
  });
}

function initStars(){
  stars = [];
  const count = Math.floor((W*H) / (9000 * DPR));
  for(let i=0;i<count;i++){
    stars.push({
      x: Math.random()*W,
      y: Math.random()*H,
      size: Math.random()*1.4*DPR + 0.2,
      twinkle: Math.random()*Math.PI*2,
      speed: 0.01 + Math.random()*0.02
    });
  }
}

initParticles();
initStars();

function drawStars(t){
  gctx.fillStyle = 'rgba(241,236,224,0.8)';
  for(const s of stars){
    const a = 0.25 + 0.5 * Math.abs(Math.sin(t*s.speed + s.twinkle));
    gctx.globalAlpha = a;
    gctx.beginPath();
    gctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
    gctx.fill();
  }
  gctx.globalAlpha = 1;
}

function animateGalaxy(ts){
  if(!startTime) startTime = ts;
  const t = (ts - startTime) / 1000;

  gctx.clearRect(0,0,W,H);
  drawStars(t);

  for(const p of particles){
    p.x += (p.tx - p.x) * p.speed;
    p.y += (p.ty - p.y) * p.speed;

    const twinkleA = 0.6 + 0.4 * Math.sin(t*2 + p.twinkle);
    gctx.beginPath();
    gctx.fillStyle = p.hue === 'gold'
      ? `rgba(201,162,75,${twinkleA})`
      : `rgba(255,120,100,${twinkleA})`;
    gctx.shadowBlur = 6 * DPR;
    gctx.shadowColor = p.hue === 'gold' ? '#c9a24b' : '#ff5b48';
    gctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    gctx.fill();
  }
  gctx.shadowBlur = 0;

  requestAnimationFrame(animateGalaxy);
}
requestAnimationFrame(animateGalaxy);

/* ---------- 3. transition to menu ---------- */
const albumNav = document.getElementById('album-nav');
const sayonaraMenu = document.getElementById('sayonara-menu');
let sayonaraInitialized = false;

function openMenu(){
  if(assembled) return;
  assembled = true;
  introSection.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
  introSection.style.opacity = '0';
  introSection.style.transform = 'scale(1.05)';
  setTimeout(()=>{
    introSection.style.display = 'none';
    albumNav.hidden = false;
    menu.hidden = false;
    // sayonaraMenu se queda oculto hasta que la persona toque "Ver SAYONARA"
    document.body.style.overflowY = 'auto';
    initBgSymbols();
  }, 850);
}

introSection.addEventListener('click', (e)=>{
  // avoid closing when editing the name field
  if(e.target.id === 'nombre-editable') return;
  openMenu();
});

/* ---------- 3b. alternar entre OMAKASE y SAYONARA ---------- */
const navButtons = document.querySelectorAll('.nav-btn');

function activateTab(target){
  navButtons.forEach(b=>{
    const isActive = b.dataset.target === target;
    b.classList.toggle('active', isActive);
  });
  document.querySelector('.nav-btn[data-target="menu"]').textContent =
    target === 'menu' ? 'OMAKASE' : '← OMAKASE';
  document.querySelector('.nav-btn[data-target="sayonara-menu"]').textContent =
    target === 'sayonara-menu' ? 'SAYONARA' : 'Ver SAYONARA →';

  menu.hidden = target !== 'menu';
  sayonaraMenu.hidden = target !== 'sayonara-menu';
  window.scrollTo({ top: 0, behavior: 'auto' });

  if(target === 'sayonara-menu' && !sayonaraInitialized){
    initBgSymbolsSayonara();
    initSayonaraSymbol();
    sayonaraInitialized = true;
  } else if(target === 'sayonara-menu'){
    resizeBgSayonara();
  } else {
    resizeBg();
  }
}

navButtons.forEach(btn=>{
  btn.addEventListener('click', ()=> activateTab(btn.dataset.target));
});

// safety: don't trigger navigation while typing the name
document.getElementById('nombre-editable').addEventListener('keydown', e=>{
  if(e.key === 'Enter'){ e.preventDefault(); e.target.blur(); }
});

/* ---------- 4. floating symbols behind the menu ---------- */
const bgCanvas = document.getElementById('bg-symbols');
const bctx = bgCanvas.getContext('2d');
let bW, bH, bDPR;
let bgSymbols = [];

function resizeBg(){
  bDPR = Math.min(window.devicePixelRatio || 1, 2);
  bW = bgCanvas.width  = window.innerWidth * bDPR;
  bH = bgCanvas.height = document.documentElement.scrollHeight * bDPR;
  bgCanvas.style.width  = window.innerWidth + 'px';
  bgCanvas.style.height = document.documentElement.scrollHeight + 'px';
}

function initBgSymbols(){
  resizeBg();
  bgSymbols = [];
  const count = 26;
  for(let i=0;i<count;i++){
    bgSymbols.push({
      x: Math.random()*bW,
      y: Math.random()*bH,
      size: (Math.random()*14 + 8) * bDPR,
      drift: Math.random()*0.3 + 0.05,
      angle: Math.random()*Math.PI*2,
      opacity: Math.random()*0.25 + 0.06
    });
  }
  requestAnimationFrame(animateBg);
}

function animateBg(ts){
  if(!menu.hidden){
    bctx.clearRect(0,0,bW,bH);
    for(const s of bgSymbols){
      s.y -= s.drift;
      if(s.y < -40) s.y = bH + 40;
      bctx.save();
      bctx.translate(s.x, s.y);
      bctx.font = `700 ${s.size}px Arial`;
      bctx.textAlign = 'center';
      bctx.textBaseline = 'middle';
      bctx.fillStyle = `rgba(179,35,28,${s.opacity})`;
      bctx.fillText('>|<', 0, 0);
      bctx.restore();
    }
  }
  requestAnimationFrame(animateBg);
}

window.addEventListener('resize', ()=>{
  if(!menu.hidden) resizeBg();
  if(!sayonaraMenu.hidden) resizeBgSayonara();
});

/* ---------- 4b. fondo flotante de flores para Sayonara (mismo patrón, en azul) ---------- */
const bgCanvasSayonara = document.getElementById('bg-symbols-sayonara');
const bctxSayonara = bgCanvasSayonara.getContext('2d');
let bWs, bHs, bDPRs;
let bgFlowers = [];

function resizeBgSayonara(){
  bDPRs = Math.min(window.devicePixelRatio || 1, 2);
  bWs = bgCanvasSayonara.width  = window.innerWidth * bDPRs;
  bHs = bgCanvasSayonara.height = sayonaraMenu.scrollHeight * bDPRs;
  bgCanvasSayonara.style.width  = window.innerWidth + 'px';
  bgCanvasSayonara.style.height = sayonaraMenu.scrollHeight + 'px';
}

function initBgSymbolsSayonara(){
  resizeBgSayonara();
  bgFlowers = [];
  const count = 22;
  for(let i=0;i<count;i++){
    bgFlowers.push({
      x: Math.random()*bWs,
      y: Math.random()*bHs,
      size: (Math.random()*13 + 8) * bDPRs,
      drift: Math.random()*0.3 + 0.05,
      opacity: Math.random()*0.28 + 0.08
    });
  }
  requestAnimationFrame(animateBgSayonara);
}

function animateBgSayonara(ts){
  if(!sayonaraMenu.hidden){
    bctxSayonara.clearRect(0,0,bWs,bHs);
    for(const s of bgFlowers){
      s.y -= s.drift;
      if(s.y < -40) s.y = bHs + 40;
      bctxSayonara.save();
      bctxSayonara.translate(s.x, s.y);
      bctxSayonara.font = `700 ${s.size}px Arial`;
      bctxSayonara.textAlign = 'center';
      bctxSayonara.textBaseline = 'middle';
      bctxSayonara.fillStyle = `rgba(43,75,255,${s.opacity})`;
      bctxSayonara.fillText('✿', 0, 0);
      bctxSayonara.restore();
    }
  }
  requestAnimationFrame(animateBgSayonara);
}

/* ---------- 4c. la flor de Sayonara armándose con partículas ---------- */
function initSayonaraSymbol(){
  const canvas = document.getElementById('sayonara-symbol');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = 260;
  canvas.width = size * dpr;
  canvas.height = size * dpr;

  // muestrear puntos de la flor "✿" en un canvas auxiliar
  const off = document.createElement('canvas');
  off.width = size; off.height = size;
  const octx = off.getContext('2d');
  octx.fillStyle = '#fff';
  octx.font = `${size*0.78}px Arial`;
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  octx.fillText('✿', size/2, size/2 + size*0.03);
  const img = octx.getImageData(0,0,size,size).data;

  const targets = [];
  const step = 3;
  for(let y=0; y<size; y+=step){
    for(let x=0; x<size; x+=step){
      const idx = (y*size + x) * 4 + 3;
      if(img[idx] > 128) targets.push({ x: x*dpr, y: y*dpr });
    }
  }
  for(let i=targets.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [targets[i],targets[j]] = [targets[j],targets[i]];
  }

  const count = Math.min(500, targets.length);
  const flowerParticles = [];
  for(let i=0;i<count;i++){
    const t = targets[i];
    const angle = Math.random() * Math.PI * 2;
    const radius = size * dpr * (0.7 + Math.random()*0.5);
    flowerParticles.push({
      x: (size*dpr)/2 + Math.cos(angle)*radius,
      y: (size*dpr)/2 + Math.sin(angle)*radius,
      tx: t.x, ty: t.y,
      sz: (Math.random()*1.5 + 0.6) * dpr,
      speed: 0.02 + Math.random()*0.03,
      twinkle: Math.random()*Math.PI*2
    });
  }

  let start = null;
  function frame(ts){
    if(!start) start = ts;
    const t = (ts - start) / 1000;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(const p of flowerParticles){
      p.x += (p.tx - p.x) * p.speed;
      p.y += (p.ty - p.y) * p.speed;
      const a = 0.6 + 0.4 * Math.sin(t*2 + p.twinkle);
      ctx.beginPath();
      ctx.fillStyle = `rgba(111,143,255,${a})`;
      ctx.shadowBlur = 6 * dpr;
      ctx.shadowColor = '#2b4bff';
      ctx.arc(p.x, p.y, p.sz, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    if(!sayonaraMenu.hidden) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------- 5. cover image fallback handling ---------- */
const coverImg = document.getElementById('cover-img');
coverImg.addEventListener('error', ()=>{ coverImg.classList.add('broken'); coverImg.removeAttribute('src'); });

const coverImgSayonara = document.getElementById('cover-img-sayonara');
coverImgSayonara.addEventListener('error', ()=>{ coverImgSayonara.classList.add('broken'); coverImgSayonara.removeAttribute('src'); });

/* ---------- 5b. countdown OMAKASE TOUR — Bogotá (temporal) ---------- */
(function(){
  const wrap = document.getElementById('tour-countdown');
  if(!wrap) return;

  const targetDate = new Date(wrap.dataset.tourDate).getTime();
  const grid = wrap.querySelector('.countdown-grid');
  const todayMsg = wrap.querySelector('.countdown-today');
  const elDays  = document.getElementById('cd-days');
  const elHours = document.getElementById('cd-hours');
  const elMins  = document.getElementById('cd-mins');
  const elSecs  = document.getElementById('cd-secs');

  let timer = null;

  function tick(){
    const diff = targetDate - Date.now();

    if(diff <= 0){
      grid.hidden = true;
      todayMsg.hidden = false;
      if(timer) clearInterval(timer);
      return;
    }

    const days  = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff / (1000*60*60)) % 24);
    const mins  = Math.floor((diff / (1000*60)) % 60);
    const secs  = Math.floor((diff / 1000) % 60);

    elDays.textContent  = String(days).padStart(2,'0');
    elHours.textContent = String(hours).padStart(2,'0');
    elMins.textContent  = String(mins).padStart(2,'0');
    elSecs.textContent  = String(secs).padStart(2,'0');
  }

  tick();
  timer = setInterval(tick, 1000);
})();

/* ---------- 6. previews por canción (reproductor oficial de Spotify) ---------- */
document.querySelectorAll('.play-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const li = btn.closest('li');
    const playerBox = li.querySelector('.player');
    const trackId = li.dataset.track;

    // cerrar cualquier otro reproductor abierto
    document.querySelectorAll('.player.open').forEach(p=>{
      if(p !== playerBox){
        p.classList.remove('open');
        p.innerHTML = '';
      }
    });
    document.querySelectorAll('.play-btn.playing').forEach(b=>{
      if(b !== btn) b.classList.remove('playing');
    });

    const isOpen = playerBox.classList.contains('open');
    if(isOpen){
      playerBox.classList.remove('open');
      playerBox.innerHTML = '';
      btn.classList.remove('playing');
      btn.textContent = '▶';
      return;
    }

    playerBox.innerHTML = '<p class="player-loading">cargando preview…</p>';
    playerBox.classList.add('open');
    btn.classList.add('playing');
    btn.textContent = '❚❚';

    const iframe = document.createElement('iframe');
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    // el iframe debe existir en el DOM ANTES de asignarle src, si no, el navegador
    // nunca dispara la carga (y menos con loading="lazy" en un elemento suelto).
    playerBox.innerHTML = '';
    playerBox.appendChild(iframe);
    iframe.src = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;
  });
});
