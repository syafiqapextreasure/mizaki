// Section boundaries use the original Malay headings of each article.
const moduleStarts={
 'tab-siapakah':/^(?:PEJABAT PAKAR|PROSES MENCIPTA|KOS PROJEK|PENGALAMAN KERJA|BELIAU ADALAH|MOHD\. ZAKI ABDULLAH|PENGHARGAAN|TAN SRI MUHAMMAD|PROF\. NIK|PROF\. DATUK|KHAIRUL NIZAM|DATUK WIRA DR)/,
 'tab-rahsia':/^\d+\s*\)/,
 'tab-mana':/^(?:[12]\)\.\s*(?:SAYANGKAN|JADI AHLI)|TETAPI INGAT|SESAL DAHULU|ELAKAN DIRI)/,
 'tab-yuran':/^(?:[123]\)\s*(?:YURAN|UPAH)|CONTOH:\s*BIL|KENAPA PAKAR|JAMINAN$|SEDARKAH ANDA|TESTIMONI$|SESI TAKLIMAT|PEJABAT URUSAN)/,
 'tab-peringatan':/^(?:JADI JAGA|KUTIP SAMPAH|MEREMPAT$|MENGEMIS$|HARAP IHSAN|BAHKAN SEMAKIN|DI HANTAR|LEBIH MALANG|AKHIRNYA HIDUP|HAMPIR 300|DIANTARA PUNCA|1,142 ORANG)/,
 'tab-daftar':/^\d+\)\s*(?:Mulakan|Langkah)/i
};
function renderModularSample(page,layout){
  const articles=document.createElement('div');
  articles.className='sample-articles';
  page.dataset.sample=layout;
  let card,body,run,tail;
  function preserveGap(text){
    if(tail && text)tail.after(document.createTextNode(text));
  }
  const words=n=>n.textContent.replace(/\s+/g,' ').trim();
  function begin(node){
    card=document.createElement('article');
    const heading=document.createElement('h2');
    heading.append(...node.childNodes);card.append(heading);tail=heading;
    body=document.createElement('div');body.className='sample-body';card.append(body);
    articles.append(card);run=null;
  }
  function add(node){
    const isPhoto=node.tagName==='IMG';
    if(!isPhoto && !words(node)){preserveGap(node.textContent);return}
    if(!card || (!isPhoto && moduleStarts[page.id].test(words(node)))){begin(node);return}
    const kind=isPhoto?'sample-plates':'sample-reading';
    if(run?.className!==kind){run=document.createElement('div');run.className=kind;body.append(run)}
    if(isPhoto){
      const button=document.createElement('button');
      button.type='button';button.addEventListener('click',()=>enlarge(node));
      if(!node.alt||node.alt==='Gambar')node.alt=card.querySelector('h2').textContent.trim();
      button.setAttribute('aria-label','Besarkan gambar: '+node.alt);
      button.append(node);run.append(button);tail=button;
    }else{
      const line=document.createElement('p');line.append(...node.childNodes);
      if(/^=+$/.test(words(line)))line.className='sample-rule';
      if(/^\d+[).]/.test(words(line))||/^(?:Tuan Haji|Encik|SESI TAKLIMAT)/.test(words(line)))line.classList.add('sample-line');
      run.append(line);tail=line;
    }
  }
  // Flatten structural containers while retaining inline emphasis and the position of every image.
  function visit(node){
    if(node.nodeType===Node.COMMENT)return;
    if(node.nodeType===Node.TEXT_NODE){
      if(!words(node)){preserveGap(node.textContent);return}
      const p=document.createElement('p');p.append(node);add(p);return;
    }
    if(node.tagName==='IMG'){add(node);return}
    if(node.querySelector('p,h2,h3,div')||node===page){[...node.childNodes].forEach(visit);return}
    if(node.querySelector('img')){
      let line=document.createElement('p');
      for(const child of [...node.childNodes]){
        if(child.nodeType===1 && (child.tagName==='IMG'||child.querySelector('img'))){add(line);visit(child);line=document.createElement('p')}
        else line.append(child);
      }
      add(line);return;
    }
    add(node);
  }
  for(const n of page.querySelectorAll('[style]'))n.removeAttribute('style');
  visit(page);
  for(const c of articles.children){
    if(!c.querySelector('.sample-body').textContent.trim()&&!c.querySelector('img'))c.classList.add('sample-heading-only');
    const pics=c.querySelectorAll('img');
    if(pics.length)c.classList.add('sample-illustrated');
    if(pics.length>2||c.textContent.length>1450)c.classList.add('sample-long');
  }
  page.replaceChildren(articles);
}
/* Compose the selected pages from their archived text and photographs. The
   numbered ranges refer to non-empty source paragraphs, before layout. */
function selectedArticle(page) {
  const photos = [...page.querySelectorAll('img')];
  const lines = [];
  let run = '';
  function flush() {
    const words = run.replace(/\s+/g, ' ').trim();
    if (words) lines.push(words);
    run = '';
  }
  function read(node) {
    if (node.nodeType === Node.TEXT_NODE) { run += node.nodeValue; return; }
    if (node.nodeType !== Node.ELEMENT_NODE || node.tagName === 'IMG') return;
    const block = /^(P|DIV|H[1-6])$/.test(node.tagName);
    if (block) flush();
    node.childNodes.forEach(read);
    if (block) flush();
  }
  read(page);
  flush();
  const esc = value => value.replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const copy = (first, last = first) => esc(lines.slice(first, last + 1).join(' '));
  const para = (first, last = first) => '<p>' + copy(first,last) + '</p> ';
  const items = (first,last) => '<ul class="source-list">' + lines.slice(first,last+1).map(v => '<li>'+esc(v)+'</li> ').join('') + '</ul> ';
  const title = (at,tag='h3') => '<'+tag+'>'+copy(at)+'</'+tag+'> ';
  const pic = (i,alt) => '<button type="button" class="source-photo" data-index="'+i+'" aria-label="Besarkan gambar: '+esc(alt)+'"></button> ';
  const strip = (from,alts) => '<div class="photo-strip">'+alts.map((a,i)=>pic(from+i,a)).join('')+'</div>';
  const heroCopy = (end) => '<div hidden aria-hidden="true">'+copy(0,end)+'</div> ';
  let layout;
  if (page.id === 'tab-siapakah') {
    const mentors = [
      [73,77,[4,5]], [78,83,[6]], [84,89,[7]], [90,98,[8]], [99,106,[9]]
    ];
    layout = `<div class="sheet founder-overview"><h2>${copy(0).replace(/^4\)\s*/, '')}</h2>
      <div class="founder-opening"><div>${para(1,7)}${items(8,12)}${title(13)}${para(14,15)}</div>
      <div class="founder-project">
      <div class="project-columns"><div>${title(16)}${para(17,19)}</div><div>${title(20)}${para(21,25)}</div></div></div></div>
      <div class="founder-chronicle">${para(26,37)}${para(38,43)}</div></div>
      <div class="sheet dark-sheet founder-career"><div>${title(44)}${items(45,51)}</div>
      <div class="founder-profile"><div class="founder-portrait">${pic(0,'Mohd. Zaki Abdullah')}</div><b>${copy(52,53)}</b></div>
      <div><h3>${copy(54,55)}</h3> ${items(56,59)}${para(60)}${items(61,63)}${para(64)}</div><div class="family-album">${strip(1,['Keluarga pengasas','Pasukan MIZAKI'])}</div></div>
      <div class="sheet founder-quote">${para(65)}${pic(3,'Petikan inspirasi perniagaan')}<span hidden>${copy(66)}</span> </div>
      <div class="sheet dark-sheet founder-thanks">${title(67,'h2')}${para(68,72)}</div>
      <div class="sheet mentor-section"><div class="rail-buttons" data-page-chrome><button type="button" data-shift="-1" aria-label="Tokoh sebelumnya">←</button><button type="button" data-shift="1" aria-label="Tokoh seterusnya">→</button></div><div class="mentor-grid" tabindex="0" role="region" aria-label="Galeri tokoh penghargaan">${mentors.map(([first,last,images])=>`<article><div class="mentor-photos">${images.map(i=>pic(i,lines[first])).join('')}</div>${title(first)}${para(first+1,last)}</article>`).join('')}</div></div>
      <div class="sheet founder-end"><div>${para(107,109)}${para(110,111)}<strong>${copy(112)}</strong></div>${pic(10,'Semua kejayaan bermula dengan percubaan')}</div>`;
  } else if (page.id === 'tab-rahsia') {
    const numbers = lines.flatMap((v,i)=>i>2 && /^\d+\)\s/.test(v)?[i]:[]);
    const art = {1:[0,'Keratan akhbar simpanan KWSP'],2:[1,'Wang simpanan'],3:[2,'Pengurusan kewangan peribadi'],5:[3,'Keratan rencana'],7:[4,'Jihad bisnes']};
    const closing = lines.length-1;
    const invitation=copy(closing).replace(/^(.*?) (Dan Scan \/ .*)$/, '<strong>$1</strong> <span>$2</span>');
    page.dataset.subtitle=lines[1];
    layout = `<div class="sheet benefits-page"><div class="benefits-intro">${para(2)}</div>
      <div class="benefit-cards tile-wall">${numbers.map((at,i)=>{
        const number=i+1, asset=art[number], heading=lines[at].match(/^(\d+)(\))\s+(.*)$/);
        return `<article class="benefit-card" data-benefit="${number}">${asset?pic(...asset):''}<div><h3><span class="benefit-index">${heading[1]}<span hidden>)</span></span> ${esc(heading[3])}</h3> ${para(at+1,(numbers[i+1]??closing)-1)}</div></article>`;
      }).join('')}</div><div class="benefit-end"><p>${invitation}</p> ${pic(5,'Semua kejayaan bermula dengan percubaan')}</div></div>`;
  } else if (page.id === 'tab-mana') {
    layout = `${heroCopy(0)}<div class="sheet choice-band">${title(1,'h2')}${title(2)}
      <div class="choice-panorama"><img data-page-chrome data-art="pilihan" alt="Tekanan kewangan, saling membantu dan dua keadaan ketika bersara"><details><summary data-page-chrome>Lihat empat gambar asal</summary>${strip(0,['Ilustrasi muflis','Sokongan kewangan','Dua keadaan selepas bersara','Pesara mengesat air mata'])}</details></div>
      ${para(3,5)}<blockquote>${copy(6)}</blockquote> ${para(7)}</div>
      <div class="choice-or">${copy(8)}</div> <div class="sheet choice-band dark-sheet">${title(9,'h2')}${title(10)}
      ${strip(4,['Petikan tentang mencuba','Petikan Richard Branson','Jom sertai kami'])}
      ${para(11,12)}${para(13,18)}${para(19)}<blockquote>${copy(20)}</blockquote> </div>
      <div class="sheet choice-reminder">${title(21,'h2')}<div class="warning-lines">${para(22,25)}${para(26)}${para(27)}</div><blockquote>${copy(28)}</blockquote> </div>
      <div class="sheet dark-sheet choice-end">${para(29)}${title(30)}${para(31)}</div>`;
  } else if (page.id === 'tab-peringatan') {
    const clipping = (first,last,image,alt) => `<article class="press-item">${pic(image,alt)}${title(first)}${last>first?para(first+1,last):''}</article>`;
    layout = `${heroCopy(3)}<div class="sheet reminder-page">
      <div class="reminder-head">${pic(0,'Pesara bekerja sebagai pengawal keselamatan')}<div>${title(4,'h2')}${title(5)}${para(6,7)}</div></div>
      <p class="archive-hint" data-page-chrome>Tekan gambar untuk membesarkan keratan asal.</p><div class="press-stories tile-wall">${clipping(8,8,1,'Kutip sampah untuk hidup')}${clipping(9,9,2,'Merempat')}${clipping(10,10,3,'Pesara polis jadi pengemis')}${clipping(11,12,4,'Pesara tentera harap ihsan anak')}${clipping(13,13,5,'Anak derhaka semakin ramai')}${clipping(14,14,6,'Saya rindu')}${clipping(15,15,7,'Rumah orang tua')}
      ${clipping(16,16,8,'Keratan akhbar tentang anak dan ibu bapa')}${clipping(17,17,9,'Sendiri menanti syurga')}
      <article class="press-item press-wide">${strip(10,['253,635 diisytihar muflis','20,000 muflis setiap tahun'])}${title(18)}${para(19)}</article>
      </div><div class="press-causes">${title(20)}${strip(12,['41 belia muflis setiap hari','Hidup bergaya punca muflis','Muflis kerana hutang kereta','Pinjam RM85,000 untuk kahwin','Pelamin hutang','Wang hantaran'])}</div></div>
      <article class="sheet reminder-last">${pic(18,'Petikan tentang masa depan')}<div><h3>${copy(21,22)}</h3> ${para(23,24)}</div></article><div class="sheet">
      <div class="reminder-end">${para(25)}${title(26)}${para(27)}</div></div>`;
  } else if (page.id === 'tab-yuran') {
    const fee = (first,end,detail) => '<article><h3>'+copy(first)+'</h3><strong>'+copy(first+1,end)+'</strong>'+detail+'</article>';
    const figures = [[50,50,51,51],[52,54,55,55],[56,56,57,57],[58,58,59,59],[60,60,61,61],[62,62,63,63],[64,64,65,66],[67,67,68,69],[70,70,71,71]];
    layout = `${heroCopy(0)}<div class="sheet fee-page"><h2>${copy(1,2)}</h2>
      <div class="fee-three">${fee(3,6,para(7))}${fee(8,11,para(12,13))}
      <article>${title(38)}${para(39)}<strong>${copy(40)}</strong></article></div>
      <div class="rate-notes">${para(14,17)}${para(18,20)}</div>
      <div class="rate-pair">${feeSchedule()}<aside class="rate-example">${title(21)}${para(22)}${para(23)}${para(24)}</aside></div>
      <div class="fee-share">${[25,26,27,28].map(i=>para(i)).join('')}</div>
      <div class="fee-verdict"><h3>${copy(29,30)}</h3>${para(31,32)}<strong>${copy(33)}</strong>${para(34,37)}</div>
      <article class="fee-reasons"><div><h3>${copy(42,44)}</h3>${para(45,49)}</div><div>
      <dl class="fee-table">${figures.map(([a,b,c,d])=>'<div><dt>'+copy(a,b)+'</dt><dd>'+copy(c,d)+'</dd></div>').join('')}</dl>
      </div><div class="fee-reasons-end">${para(72,74)}${para(75,79)}<strong>${copy(80,82)}</strong></div></article></div>
      <article class="sheet guarantee-band"><div class="guarantee-seal" aria-hidden="true" data-page-chrome><span>JAMINAN</span><b>3×</b><span>BAYARAN</span></div>
      <div>${title(84,'h2')}<p>${copy(85)} <strong>${copy(86)}</strong></p> <p>${copy(87)} <strong>${copy(88)}</strong> ${copy(89)}</p> ${para(90,92)}</div></article>
      <article class="sheet fee-comparison"><h2>${copy(94,95)}</h2><div class="comparison-copy"><div>${para(96,98)}${para(99,108)}</div><div>${para(109,116)}${para(117,125)}</div></div>
      <div class="comparison-pair">${feeChart()}<div class="comparison-reading">${para(126,135)}<strong>${copy(136)}</strong></div></div></article>
      <div class="sheet fee-testimonials"><div class="fee-banner">${title(138,'h2')}${para(139)}</div><div class="fee-people fee-gallery">${lines.slice(140,145).map((v,i)=>{const k=v.indexOf(',');return '<figure>'+pic(6+i,v.slice(0,k))+'<figcaption><strong>'+esc(v.slice(0,k))+',</strong> '+esc(v.slice(k+1).trim())+'</figcaption></figure>'}).join('')}</div></div>
      <div class="sheet fee-briefing"><div class="fee-banner">${title(145,'h2')}${para(146,150)}</div><div class="fee-events fee-gallery">${Array.from({length:6},(_,i)=>pic(11+i,'Sesi taklimat MIZAKI, foto '+(i+1))).join('')}</div></div>`;
  } else if (page.id === 'tab-daftar') {
    const steps = [[4,5,7],[8,9,13],[14,15,16],[17,18,20]];
    const alts = ['Jom sertai kami','Semua impian boleh dicapai','Orang yang berjaya memberi usaha','Orang dan peluang'];
    layout = `${heroCopy(0)}<div class="sheet register-first">${title(1,'h2')}${para(2,3)}</div>
      ${steps.map(([first,heading,end],i)=>`<article class="sheet register-step ${i%2?'dark-sheet':''}"><div><b class="step-label">${copy(first)}</b> ${title(heading,'h2')}${para(heading+1,end)}</div>${pic(i,alts[i])}</article>`).join('')}
      <div class="sheet register-note">${title(21)}${para(22,24)}</div>
      <div class="sheet register-end"><h2>${copy(25,27)}</h2> ${para(28,29)}${para(30)}<strong>${copy(31)}</strong></div>`;
  } else return false;
  page.classList.add('selected-page');
  page.innerHTML = layout.replace(/(<\/(?:h[23]|strong|dt|dd|figcaption|article|figure|div)>)(?=<)/g,'$1 ');
  const artwork = {
    'tab-siapakah': {0:'zaki-profil',1:'keluarga',2:'pasukan',10:'kejayaan'},
    'tab-rahsia': {1:'simpanan',2:'kewangan',3:'laporan',4:'bisnes',5:'kejayaan'},
    'tab-mana': {4:'mencuba',5:'branson',6:'sertai'},
    'tab-peringatan': {18:'renungan'},
    'tab-yuran': Object.fromEntries(Array.from({length:11},(_,i)=>[6+i,i<5?'yuran-pelanggan-'+(i+1):'yuran-taklimat-'+(i-4)])),
    'tab-daftar':['sertai','impian','usaha','peluang']
  }[page.id] || {};
  for (const im of page.querySelectorAll('[data-art]')) im.src=redrawnAssets[im.dataset.art] || photos[0].src;
  for (const button of page.querySelectorAll('[data-index]')) {
    const im=photos[Number(button.dataset.index)];
    im.removeAttribute('style'); im.removeAttribute('class');
    im.alt=button.getAttribute('aria-label').slice('Besarkan gambar: '.length);
    const key=artwork[button.dataset.index];
    if (redrawnAssets[key]) {
      im.dataset.originalSrc=im.src;
      im.src=redrawnAssets[key];
      im.dataset.art=key;
    }
    button.append(im);button.addEventListener('click',()=>enlarge(im));
  }
  page.querySelectorAll('.tile-wall, .press-causes .photo-strip').forEach(arrangeTiles);
  const rail=page.querySelector('.mentor-grid');
  if(rail) connectMentorRail(rail);
  if(page.id==='tab-yuran'){
    const reveal=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting){
        entry.target.classList.add('fee-in-view');reveal.unobserve(entry.target);
      }
    });
    page.querySelectorAll('.rate-schedule,.fee-plot').forEach(el=>reveal.observe(el));
  }
  return true;
}

function feeSchedule(){
  const rows=[
    ['1.00–2,000','PERCUMA','1,000–2,000'],['2,000–12,000','20–120','1,980–11,880'],
    ['12,001–24,000','240–720','11,761–23,280'],['24,001–36,000','720–1,080','23,281–34,920'],
    ['36,001–48,000','1,440–1,920','34,561–46,080'],['48,001–60,000','2,400–3,000','45,601–57,000'],
    ['60,001–72,000','3,600–4,320','56,401–67,680'],['72,001–84,000','5,040–5,880','66,961–78,120'],
    ['84,001–96,000','6,720–7,680','77,281–88,320'],['96,001–108,000','8,640–9,720','87,361–98,280'],
    ['108,001–122,500','10,800–12,250','97,201–110,250']
  ];
  return `<div class="rate-schedule" data-page-chrome role="region" aria-label="Jadual yuran Pakar $IMP$, dalam ringgit" tabindex="0"><table><caption>Yuran Pakar $IMP$</caption><thead><tr>${['Bil.','Untung (RM)','Peratus','Yuran (RM)','Anda dapat (RM)'].map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(([profit,fee,net],i)=>`<tr><th scope="row">${i+1}</th><td>${profit}</td><td>${i}%</td><td>${fee}</td><td>${net}</td></tr>`).join('')}</tbody><tfoot><tr><th colspan="3" scope="row">Bahagian</th><td>1</td><td>9</td></tr></tfoot></table></div>`;
}

function feeChart(){
  const years=[5,10,15,20,30,40,52];
  const x=y=>62+(y-5)*454/47;
  const y=v=>188-v*150/400000;
  const trace=(values,label,style)=>{
    const points=values.map((v,i)=>[x(years[i]),y(v)]);
    return `<g class="${style}"><title>${label}</title><path class="plot-trace" pathLength="1" d="${points.map(([a,b],i)=>`${i?'L':'M'}${a},${b}`).join(' ')}"/>${points.map(([a,b])=>style==='bask'?`<rect x="${a-3}" y="${b-3}" width="6" height="6"/>`:`<circle cx="${a}" cy="${b}" r="3.5"/>`).join('')}</g>`;
  };
  return `<figure class="fee-plot" data-page-chrome><figcaption>Tempoh untuk mencapai RM350,000</figcaption><div class="plot-key"><span>● &nbsp;$IMP$</span><span>■ &nbsp;BASK</span></div><svg viewBox="0 0 550 230" role="img" aria-label="Graf asal menunjukkan sasaran RM350,000 pada tahun ke-15 bagi $IMP$ dan tahun ke-52 bagi BASK. Nilai pertengahan adalah anggaran visual."><text x="8" y="22">RM</text>${[0,100000,200000,300000,400000].map(v=>`<line x1="62" x2="520" y1="${y(v)}" y2="${y(v)}"/><text x="54" y="${y(v)+4}" text-anchor="end">${v.toLocaleString('en-US')}</text>`).join('')}${years.map(n=>`<text x="${x(n)}" y="209" text-anchor="middle">${n}</text>`).join('')}<text x="516" y="227" text-anchor="end">Tahun</text>${trace([4000,9000,25000,45000,95000,185000,350000],'BASK','bask')}${trace([10000,80000,350000],'$IMP$','simps')}</svg><small>Titik pertengahan dianggarkan daripada graf asal. BASK mencapai sasaran pada 52 tahun dalam graf dan kira-kira 50 tahun dalam penerangan.</small></figure>`;
}

function connectMentorRail(rail) {
  const controls=[...rail.parentElement.querySelectorAll('[data-shift]')];
  function move(direction) {
    const step=rail.children[1].offsetLeft-rail.children[0].offsetLeft;
    rail.scrollBy({left:step*direction,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  function sync() {
    if(!rail.clientWidth)return;
    const box=rail.getBoundingClientRect();
    const visible=[...rail.children].filter(card=>{
      const r=card.getBoundingClientRect();
      return r.right>box.left+1 && r.left<box.right-1;
    });
    if(visible.length)rail.style.height=Math.ceil(Math.max(...visible.map(card=>card.offsetHeight))+6)+'px';
    controls[0].disabled=rail.scrollLeft<=1;
    controls[1].disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-1;
  }
  controls.forEach(button=>button.onclick=()=>move(Number(button.dataset.shift)));
  rail.addEventListener('scroll',sync,{passive:true});
  rail.addEventListener('keydown',event=>{
    if(!['ArrowRight','ArrowLeft'].includes(event.key))return;
    event.preventDefault();move(event.key==='ArrowLeft'?-1:1);
  });
  const observer=new ResizeObserver(sync);
  observer.observe(rail);[...rail.children].forEach(card=>observer.observe(card));
}

function arrangeTiles(wall) {
  // Position complete cards in DOM order, filling the shortest column first.
  const cards=[...wall.children];
  let queued=false;
  function layout() {
    queued=false;
    if(!wall.clientWidth)return;
    const css=getComputedStyle(wall), count=Number(css.getPropertyValue('--columns').trim()) || 1;
    const gap=parseFloat(css.columnGap)||16, ends=Array(count).fill(1);
    wall.classList.add('packed');
    for(const card of cards){
      const span=card.matches('[data-benefit="1"],.press-wide')?count:1;
      const start=span===count?0:ends.indexOf(Math.min(...ends));
      const top=Math.max(...ends.slice(start,start+span));
      card.style.gridColumn=(start+1)+' / span '+span;
      card.style.gridRowStart=top;
      const height=Math.ceil(card.getBoundingClientRect().height);
      card.style.gridRowEnd='span '+Math.max(1,height);
      ends.fill(top+height+gap,start,start+span);
    }
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(layout)}}
  const observer=new ResizeObserver(schedule);
  observer.observe(wall);cards.forEach(card=>observer.observe(card));
  schedule();
}
function renderSimulatorPage(page){
  const layout=new URLSearchParams(location.search).get('susun');
  page.dataset.layout=['editorial','dossier'].includes(layout)?layout:'modular';

  const make=(tag,css)=>Object.assign(document.createElement(tag),{className:css});
  const normalized=node=>node.textContent.replace(/\s+/g,' ').trim();
  const originals=Array.from(page.querySelectorAll('h3,p,img')).filter(n=>n.tagName==='IMG'||normalized(n));
  const descriptions=['Paparan simulator $IMP$ pada komputer riba','Wang kertas ringgit Malaysia','Bangunan kediaman','Seorang lelaki menyemak bil dan perbelanjaan','Jom kita JEMPUT Rezeki. Ini Kali Rezeki Kita,,,'];
  const contents=document.createDocumentFragment();
  let cursor=0,photo=0;
  function takeUntil(prefix){
    const start=cursor;
    while(cursor<originals.length && !(prefix && normalized(originals[cursor]).startsWith(prefix)))cursor++;
    if(prefix && cursor===originals.length)throw Error('Teks asal halaman 3 berubah: '+prefix);
    return originals.slice(start,cursor);
  }
  function insert(parent,node,heading){
    if(node.tagName==='IMG'){
      const button=make('button','imp-picture');
      button.type='button';
      node.alt=descriptions[photo++];
      button.setAttribute('aria-label','Besarkan gambar: '+node.alt);
      button.addEventListener('click',()=>enlarge(node));
      node.removeAttribute('style');node.removeAttribute('class');
      button.append(node);parent.append(button,' ');
      return;
    }
    const item=make(heading||'p','');
    item.append(...Array.from(node.childNodes));
    for(const span of item.querySelectorAll('[style]'))span.removeAttribute('style');
    if(heading==='h3' && item.firstChild?.nodeType===Node.TEXT_NODE){
      const prefix=item.firstChild;
      const match=prefix.textContent.match(/^\s*\d+\)\.?/);
      if(match){
        prefix.splitText(match[0].length);
        const number=make('span','imp-number');
        prefix.before(number);number.textContent=prefix.textContent.match(/\d+/)[0];prefix.remove();
      }
    }
    parent.append(item,' ');
  }
  function band(css){
    const block=make('div','imp-band '+css);
    contents.append(block);
    return block;
  }
  function prose(parent,nodes){
    const para=make('div','imp-prose');
    for(const node of nodes)insert(para,node);
    parent.append(para);
    return para;
  }
  const hero=band('imp-hero');
  const heroNodes=takeUntil('RANCANG, JIMAT');
  const heroLead=make('div','imp-hero-lead');
  hero.append(heroLead);
  const screen=heroNodes.findIndex(n=>n.tagName==='IMG');
  const intro=takeUntil('Perancangan Tersebut');
  insert(heroLead,intro.shift(),'h2');
  prose(heroLead,intro);
  const product=prose(hero,heroNodes.slice(screen));
  product.classList.add('imp-product');
  const gains=band('imp-gains');
  insert(gains,originals[cursor++],'h2');
  const gainList=make('div','imp-gain-list');
  gains.append(gainList);
  for(const next of ['2)','Dalam Masa Yang Sama']){
    const entry=make('article','imp-gain');
    gainList.append(entry);
    insert(entry,originals[cursor++],'h3');
    prose(entry,takeUntil(next));
  }
  const last=make('article','imp-gain');
  gainList.append(last);
  const assetDescription=takeUntil('3)');
  insert(last,originals[cursor++],'h3');
  prose(last,assetDescription);
  const assets=make('div','imp-assets');
  gains.append(assets);
  while(originals[cursor]?.tagName==='IMG')insert(assets,originals[cursor++]);
  const details=band('imp-details');
  prose(details,takeUntil('Dengan Adanya'));
  const scan=prose(details,takeUntil('Tidak Melakukan'));
  scan.classList.add('imp-scan');
  const context=band('imp-context');
  context.append(scan.querySelector('.imp-picture'));
  prose(context,takeUntil('================'));
  function directory(css,end){
    const block=band(css);
    const divider=make('div','imp-divider');
    divider.setAttribute('aria-hidden','true');
    insert(divider,originals[cursor++]);
    block.append(divider);
    insert(block,originals[cursor++],'h2');
    const grid=make('div','imp-directory');
    block.append(grid);
    let entry;
    for(const node of takeUntil(end)){
      if(/^\d+\)\./.test(normalized(node))){
        entry=make('article','imp-entry');grid.append(entry);
        insert(entry,node,'h3');
      }else insert(entry,node);
    }
  }
  directory('imp-functions','================');
  directory('imp-features','Sesiapa Yang Mendapatkan');
  const closing=band('imp-closing');
  const ending=takeUntil(null);
  prose(closing,ending.slice(0,-1));
  insert(closing,ending.at(-1));
  page.replaceChildren(contents);
}
const pages=[...document.querySelectorAll('main section')],links=[...document.querySelectorAll('nav a')],q=s=>document.querySelector(s);
const dialog=q('dialog');
function organize(page){
  const nodes=[];
  function flatten(node){
    if(node.nodeType===1 && node.querySelector('img') && node.tagName!=='A'){
      [...node.childNodes].forEach(flatten);
    }else nodes.push(node);
  }
  [...page.childNodes].forEach(flatten);
  page.replaceChildren();
  let copy, gallery, spread;
  function newSpread(){
    spread=document.createElement('div');spread.className='spread solo';
    copy=document.createElement('div');copy.className='copy';
    gallery=document.createElement('div');gallery.className='gallery';
    spread.append(copy,gallery);page.append(spread);
  }
  newSpread();
  for(const node of nodes){
    if(node.tagName==='IMG'){
      const plate=document.createElement('figure');plate.className='plate';
      plate.style.setProperty('--limit',node.dataset.width+'px');
      node.tabIndex=0;node.setAttribute('role','button');node.setAttribute('aria-label','Besarkan gambar');
      plate.append(node);gallery.append(plate);spread.classList.remove('solo');
    }else{
      if(gallery.childElementCount && node.textContent.trim() && node.nodeType!==8)newSpread();
      copy.append(node);
    }
  }
}
function applyDirectoryStyle(page){
  const copy=page.querySelector('.copy');
  const intro=document.createElement('div');
  intro.className='section-intro';
  if(page.id==='tab-home'){
    const title=copy.querySelector('h2');
    const greeting=copy.querySelector('.double-block');
    const audience=greeting.querySelector('div');
    audience.classList.add('audience-row');
    audience.previousElementSibling.classList.add('ribbon');
    audience.nextElementSibling.classList.add('ribbon');
    audience.nextElementSibling.nextElementSibling.classList.add('byline');
    const range=document.createRange();
    range.setStart(copy,0);
    range.setEndAfter(greeting);
    intro.append(range.extractContents());
    title.classList.add('directory-title');
  }else{
    const title=[...copy.children].find(el=>el.textContent.trim());
    if(!title)return;
    const range=document.createRange();
    range.setStart(copy,0);
    range.setEndAfter(title);
    intro.append(range.extractContents());
    title.classList.add('directory-title');
  }
  page.prepend(intro);
  const spreads=[...page.querySelectorAll('.spread')];
  spreads.forEach((el,index)=>{if(index%3===0)el.classList.add('spotlight')});
}
pages.forEach(page=>{
  // The shared footer now supplies the closing registration link.
  if(!['tab-home','tab-pengenalan'].includes(page.id)){
    const join=page.querySelector('a[href="https://t.me/+qmz3SPJb2b1lNjI1"]');
    if(join && join.parentElement.textContent.trim()===join.textContent.trim())join.parentElement.remove();
  }
  if(page.id==='tab-apa'){
    renderSimulatorPage(page);
    return;
  }
  const sample=new URLSearchParams(location.search).get('sampel');
  if(moduleStarts[page.id] && ['kad','indeks','panel'].includes(sample)){
    renderModularSample(page,sample);
    return;
  }
  if(moduleStarts[page.id] && selectedArticle(page))return;
  organize(page);
  applyDirectoryStyle(page);
});
const titles=['Rancang hari ini, senang hari tua.','Adakah Wang Simpanan Anda Mencukupi?','Apa itu $IMP$?','Mohd. Zaki Abdullah','“Rahsia” lebih 20 manfaat besar','Mana satu pilihan anda?','Yuran, jaminan & testimoni','Untuk renungan & tindakan segera','09) DAFTAR'];
const subtitles=['Perancangan pendapatan 1 hingga 35 tahun dengan bimbingan Pakar $IMP$.','Kenali kesan kos sara hidup terhadap simpanan anda dan langkah untuk merancang pendapatan selepas bersara.','$mart Instan Multi - Purpose $imulator, $IMP$','MIZAKI MANAGEMENT SERVICES (MIZAKI) (KT0333491-W)','','','','Inilah Akibatnya Jika Tidak Rancang Pendapatan, Jimat Berbelanja & Tambah Pendapatan Dalam Satu Masa.',''];
const tabStrip=q('#page-navigation');
function revealSelectedTab(){
  if(tabStrip.scrollWidth<=tabStrip.clientWidth)return;
  const current=tabStrip.querySelector('[aria-current="page"]');
  if(!current)return;
  const tab=current.getBoundingClientRect(),strip=tabStrip.getBoundingClientRect();
  if(tab.left<strip.left-1 || tab.right>strip.right+1)tabStrip.scrollLeft+=tab.left-strip.left;
}
const headerShell=q('.sticky-header');
new ResizeObserver(()=>{
  document.documentElement.style.setProperty('--sticky-height',headerShell.offsetHeight+'px');
  revealSelectedTab();
}).observe(headerShell);
function show(){
  let i=pages.findIndex(p=>'#'+p.id===location.hash);if(i<0)i=0;
  pages.forEach((p,j)=>p.hidden=j!==i);
  links.forEach((a,j)=>{if(i===j)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  revealSelectedTab();
  q('.hero-band').classList.toggle('register-hero',pages[i].id==='tab-daftar');
  q('.page-name').textContent=links[i].title;
  q('h1').textContent=titles[i];const subtitle=pages[i].dataset.subtitle || subtitles[i];q('.lead p').textContent=subtitle;q('.lead p').hidden=!subtitle;q('.lead a').hidden=i!==0;
  const im=q('.scene');im.src=(i===3 && redrawnAssets.founder) || document.getElementById('photo-'+[0,6,2,5,3,2,4,1,2][i]).src;im.classList.toggle('founder',i===3);im.alt=i===3?'Gambaran semula pengasas di antara dua kereta. Foto asal dalam galeri keluarga.':i===1?'Pasangan menyemak bajet keluarga bersama':'';
  for(const [a,j] of [[q('#prev'),i-1],[q('#next'),i+1]]){a.hidden=!pages[j];if(pages[j])a.href='#'+pages[j].id}
  const next=q('#next');
  if(i===pages.length-1){next.hidden=false;next.href='#tab-home';next.textContent='01 Utama →'}
  else next.textContent='Seterusnya →';
  window.scrollTo(0,0);
}
window.onhashchange=show;show();
const pressControls=document.createElement('div');
pressControls.className='press-controls';
pressControls.hidden=true;
pressControls.innerHTML='<button type="button" data-direction="-1">← Sebelumnya</button><output aria-live="polite"></output><button type="button" data-direction="1">Seterusnya →</button>';
dialog.append(pressControls);
const originalToggle=document.createElement('button');
originalToggle.type='button';
originalToggle.className='original-switch';
originalToggle.hidden=true;
dialog.append(originalToggle);
let enlargedImage=null;
let currentPressImage=null;
originalToggle.addEventListener('click',()=>{
  if(!enlargedImage?.dataset.originalSrc)return;
  const viewer=dialog.querySelector('img');
  const original=viewer.src!==enlargedImage.dataset.originalSrc;
  viewer.src=original?enlargedImage.dataset.originalSrc:enlargedImage.src;
  viewer.alt=(original?'Imej asal. ':'Visual baharu. ')+enlargedImage.alt;
  originalToggle.textContent=original?'Lihat visual baharu':'Lihat imej asal';
});
function displayEnlargement(im){
  const viewer=dialog.querySelector('img');
  enlargedImage=im;
  originalToggle.hidden=!im.dataset.originalSrc;
  originalToggle.textContent='Lihat imej asal';
  viewer.src=im.src;
  viewer.alt=im.alt;
  const collection=im.closest('.intro-archive,.fee-gallery');
  currentPressImage=collection?im:null;
  pressControls.hidden=!collection;
  if(collection){
    const items=Array.from(collection.querySelectorAll('.intro-figure img,.source-photo img'));
    pressControls.querySelector('output').value=(items.indexOf(im)+1)+' / '+items.length;
  }
}
function changeClipping(direction){
  if(!currentPressImage)return;
  const items=Array.from(currentPressImage.closest('.intro-archive,.fee-gallery').querySelectorAll('.intro-figure img,.source-photo img'));
  const next=(items.indexOf(currentPressImage)+direction+items.length)%items.length;
  displayEnlargement(items[next]);
}
pressControls.addEventListener('click',event=>{
  const control=event.target.closest('[data-direction]');
  if(control)changeClipping(Number(control.dataset.direction));
});
dialog.addEventListener('keydown',event=>{
  if(currentPressImage && ['ArrowLeft','ArrowRight'].includes(event.key)){
    event.preventDefault();
    changeClipping(event.key==='ArrowRight'?1:-1);
  }
});
function enlarge(im){displayEnlargement(im);dialog.showModal()}
document.addEventListener('click',e=>{if(e.target.matches('.plate img,.pictures img,.document-card img'))enlarge(e.target)});
document.addEventListener('keydown',e=>{if(e.target.matches('.plate img,.pictures img,.document-card img')&&['Enter',' '].includes(e.key)){e.preventDefault();enlarge(e.target)}});
dialog.onclick=event=>{if(event.target!==originalToggle && !pressControls.contains(event.target))dialog.close()};
const home=document.querySelector('#tab-home');
const originalText=home.textContent.replace(/\s+/g,' ').trim();
const intro=home.querySelector('.section-intro');
const copy=originalText.slice(originalText.indexOf('Alhamdulillah!'));
const images=[...home.querySelectorAll('img')];
const anchors=['Alhamdulillah!','PENEMUAN TERBARU OLEH PAKAR!','Dalam Masa Yang Sama Beliau','Jauh Lebih Baik','Kini Siapa Sahaja','Semua Itu Boleh Anda','Walaupun Pendapatan Anda Kurang','Ditambah Pula','Selain Daripada Itu','1) YURAN PENDAFTARAN','2) YURAN PAKAR','3) UPAH SCAN','Dengan Melakukan Scan','Melalui Scan / Rancang'];
const cuts=anchors.map(x=>copy.indexOf(x));if(cuts.some((v,i)=>v<0||(i&&v<=cuts[i-1])))throw Error('Section boundary');
const originalImages=[[],[0,1],[2],[3,4],[5],[6],[],[],[],[],[],[],[],[7]];
const breaks=[['Telah Ditemui','Ia Adalah'],['$IMP$ (','Iaitu Satu','Dari 1'],['Dengan Jenama','Telah Mendapat'],[],['Buat Pertama','WANG SIMPANAN','* 35','* DAPAT','* WANG','Berbanding Jika'],['7 LANGKAH','1) DAFTAR','2) SCAN','3) TUKAR','4) SEWAKAN','5) PANTAU','6) TAMBAH','7) CAPAI','ALIRAN PROSES'],['TETAPI','Berbanding Melalui'],['Bagi Kakitangan','PERNIAGAAN JUAL'],['“RAHSIA”','Untuk Dapatkannya'],['PERCUMA!','(Konsultan'],['PERCUMA!','(Yuran Konsultan','Bagi Sesiapa','Bagi Yang','Tak Perlu','Yuran Perlu'],['Hanya RM50','(Pakar'],Array.from({length:11},(_,i)=>' '+(i+1)+') '),['Sebab Itu','Bermula Dengan','INSYAALLAH!','Dapatkan Maklumat','TEKAN DISINI']];
function el(tag,cls){const n=document.createElement(tag);n.className=cls||'';return n}
home.replaceChildren(intro);
anchors.forEach((a,i)=>{
 const segment=copy.slice(cuts[i],cuts[i+1]??copy.length).trim();
 const panel=el('div','panel p'+i);home.append(panel);
 
 const inner=el('div','inside'),body=el('div','bodycopy');panel.append(inner);inner.append(body);
 const idx=[0,...breaks[i].map(a=>segment.indexOf(a)).filter(x=>x>0),segment.length].sort((a,b)=>a-b);
 idx.slice(0,-1).forEach((start,j)=>{const v=segment.slice(start,idx[j+1]).trim();if(!v)return;const n=el('p');n.textContent=v;body.append(n,document.createTextNode(' '))});
 if(originalImages[i].length){inner.classList.add('split');const media=el('div','pictures');inner.append(media);originalImages[i].forEach(k=>media.append(images[k]))}
});
const normalized=home.textContent.replace(/\s+/g,' ').trim();if(normalized!==originalText)throw Error('Copy mismatch');
if([...home.querySelectorAll('img[data-origin]')].some((im,i)=>im!==images[i])||home.querySelectorAll('img[data-origin]').length!==8)throw Error('Original images mismatch');
const selectedHome=document.querySelector('#tab-home');
const modular=document.createElement('div');
modular.className='modular-content';
selectedHome.querySelector('.p1').before(modular);
for(let i=1;i<=13;i++)modular.append(selectedHome.querySelector('.p'+i));
selectedHome.querySelectorAll('.band').forEach(el=>el.remove());
const documents=selectedHome.querySelector('.p2 .pictures');
const article=selectedHome.querySelector('.p1 .pictures img:nth-child(2)');
documents.prepend(article);
for(const panel of modular.querySelectorAll('.panel')){
  for(const para of panel.querySelectorAll('.bodycopy p')){
    para.innerHTML=para.innerHTML.replace(/RM350,000|RM322,536|RM28,839|RM50 SAHAJA \/ SCAN/g,'<strong class="amount">$&</strong>');
  }
}
const scan=selectedHome.querySelector('.p12 .bodycopy');
const scanGrid=document.createElement('div');scanGrid.className='scan-grid';
const scanItems=[...scan.children].slice(1);
scanItems.forEach(item=>scanGrid.append(item,document.createTextNode(" ")));
scan.append(scanGrid);
const steps=selectedHome.querySelector('.p5 .bodycopy');
for(const p of steps.children)if(/^[1-7]\)/.test(p.textContent.trim()))p.classList.add('step-row');


const registerParagraph=document.querySelector('.p13 .bodycopy p:last-child');
const registerLink=document.createElement('a');
registerLink.href='https://t.me/+qmz3SPJb2b1lNjI1';
registerLink.target='_blank';
registerLink.rel='noopener';
registerLink.textContent=registerParagraph.textContent;
registerParagraph.replaceChildren(registerLink);
const groupPanels=(className,numbers)=>{
 const group=document.createElement('div');group.className=className;
 modular.querySelector('.p'+numbers[0]).before(group);
 numbers.forEach(number=>group.append(modular.querySelector('.p'+number)));
};
groupPanels('process-section',[5,6,7]);
groupPanels('fees-section',[9,10]);
groupPanels('scan-section',[11,12]);
const bank=modular.querySelector('.p4 .pictures img');
modular.querySelector('.p3 .pictures').append(bank);
modular.querySelector('.p4 .pictures').remove();
modular.querySelector('.p4 .inside').classList.remove('split');
const comparisons=[...modular.querySelector('.p4 .bodycopy').children].slice(3,6);
const stats=document.createElement('div');stats.className='stats-strip';
comparisons[0].before(stats);
comparisons.forEach(p=>stats.append(p,document.createTextNode(' ')));
const feesTerms=document.createElement('div');feesTerms.className='fees-terms';
const feeParagraphs=[...modular.querySelector('.p10 .bodycopy').children];
feeParagraphs.slice(3).forEach(p=>feesTerms.append(p,document.createTextNode(' ')));
modular.querySelector('.fees-section').append(feesTerms);
// Align the selected layout while retaining the source copy.
const productLead=modular.querySelector('.p1 .bodycopy p:first-child');
const productTitle=document.createElement('span');productTitle.className='product-title';
const leadText=productLead.textContent;
const splitAt=leadText.indexOf('$MART');
productLead.textContent=leadText.slice(0,splitAt);
productTitle.textContent=leadText.slice(splitAt);
productLead.append(productTitle);
const documentPanel=modular.querySelector('.p2 .inside');
const documentImages=[...documentPanel.querySelectorAll('img')];
const documentCopy=[...documentPanel.querySelectorAll('.bodycopy p')];
documentPanel.replaceChildren();
for(let i=0;i<2;i++){
 const card=document.createElement('div');card.className='document-card';
 card.append(documentImages[i]);
 const description=document.createElement('div');description.className='document-copy';
 (i===0?documentCopy.slice(0,2):documentCopy.slice(2)).forEach(p=>description.append(p,document.createTextNode(' ')));
 card.append(description);documentPanel.append(card);
}
const process=modular.querySelector('.process-section');
const processHeading=document.createElement('div');processHeading.className='process-heading';
const stepCopy=process.querySelector('.p5 .bodycopy');
[...stepCopy.children].slice(0,2).forEach(p=>processHeading.append(p,document.createTextNode(' ')));
process.prepend(processHeading);
const processText=document.createElement('div');processText.className='process-text';
process.querySelector('.p6').before(processText);
processText.append(process.querySelector('.p6'),process.querySelector('.p7'));
const closing=modular.querySelector('.p13 .bodycopy');
[...closing.children].forEach((p,index)=>p.classList.add('closing-'+index));
const withAccent=(paragraph,phrase,cls)=>{
 const head=paragraph.firstChild;
 if(!head||head.nodeType!==Node.TEXT_NODE)return;
 const start=head.textContent.indexOf(phrase);
 if(start<0)return;
 const highlighted=head.splitText(start);highlighted.splitText(phrase.length);
 const span=document.createElement('span');span.className=cls;
 highlighted.before(span);span.append(highlighted);
};
withAccent(modular.querySelector('.p1 .bodycopy p:last-child'),'Dari 1 TAHUN HINGGA 35 TAHUN Akan Datang','marker');
withAccent(modular.querySelector('.p3 .bodycopy p'),'JONGKONG EMAS, BITCOIN DAN LAIN-LAIN LAGI.','gold-type');
scanGrid.querySelectorAll('p').forEach(p=>{
 const num=p.textContent.match(/^\d+\)/);
 if(num)withAccent(p,num[0],'scan-number');
});

const stripNote = modular.querySelector('.p4 .bodycopy > p:last-child');
const bankNote = stripNote.firstChild;
const divider = bankNote.textContent.indexOf('Yang Hanya Dapat');
if (divider > 0) {
  bankNote.splitText(divider);
  const note = el('span', 'comparison-note');
  note.append(bankNote);
  stats.append(document.createTextNode(' '), note);
}
const benefits = modular.querySelector('.p8 .bodycopy');
const processEnd = processText.querySelector('.p7 .bodycopy');
[...benefits.children].slice(0,2).forEach(p => processEnd.append(p, document.createTextNode(' ')));
const titleParts = modular.querySelector('.p1 .bodycopy p:nth-child(2)');
const titlePrefix = titleParts.firstChild;
if (titlePrefix.textContent.startsWith('$IMP$ ')) {
  titlePrefix.splitText(5);
  productTitle.append(document.createTextNode(' '),titlePrefix);
}
const benefitLine = modular.querySelector('.p4 .bodycopy > p:nth-child(3)');
const prefix = benefitLine.firstChild;
const key = prefix.textContent.indexOf('Lebih Daripada');
if (key > 0) {
  const headline = el('span', 'stat-headline');
  const words = prefix.splitText(key);
  headline.append(words,benefitLine.querySelector('.amount'));
  benefitLine.append(headline);
}
for (const p of [...processEnd.children, ...processText.querySelectorAll('.p6 p'), ...documentPanel.querySelectorAll('p')]) {
  for (const node of [...p.childNodes]) {
    if (node.nodeType !== Node.TEXT_NODE) continue;
    const pieces = node.textContent.split(/(HARTA INTELEK MAYA|ASET BERNILAI TINGGI|HOLLYGOLD®|‘TRADE MARK’|PERBADANAN HARTA INTELEK MALAYSIA|“RAHSIA” LEBIH 20 MANFAAT BESAR LAIN|“PENCEN KE 2” LEBIH RM7,000|“PENCEN” LEBIH RM7,000|PERNIAGAAN JUAL BELI & SEWA ABT|1 TAHUN HINGGA 15 TAHUN SAHAJA)/g);
    if (pieces.length < 2) continue;
    node.replaceWith(...pieces.map((part,index)=>{if(index%2===0)return part;const b=el('b','wine-type');b.textContent=part;return b}));
  }
}
const scanPrice=modular.querySelector('.p11 .amount');
withAccent(scanPrice,'RM50','scan-price');
const closingNote=el('div','closing-note');
closing.prepend(closingNote);
closingNote.append(closing.querySelector('.closing-0'),document.createTextNode(' '),closing.querySelector('.closing-1'),document.createTextNode(' '));

process.querySelector('.p5 .pictures').remove();
const thirdYear=modular.querySelector('.p10 .bodycopy p:nth-child(2)');
withAccent(thirdYear,'SELAMA 3 TAHUN','fee-duration');
const closingHeadline=closing.querySelector('.closing-2');
const closingMessage=closing.querySelector('.closing-3');
if(closingMessage.firstChild.textContent.startsWith('INSYAALLAH! ')){
 const phrase=closingMessage.firstChild;
 phrase.splitText('INSYAALLAH!'.length);
 closingHeadline.append(document.createTextNode(' '),phrase);
}
const discovery = el('div', 'discovery-band');
modular.prepend(discovery);
discovery.append(home.querySelector('.p0'),modular.querySelector('.p1'));
const timeline = process.querySelector('.p5');
timeline.classList.add('step-infographic');
stepCopy.className='step-list';
const timelineCaption=stepCopy.lastElementChild;
timelineCaption.className='timeline-caption';
stepCopy.querySelectorAll('.step-row').forEach((row,index)=>{
  const prefix=row.firstChild;
  const number=prefix.splitText(String(index+1).length+1);
  const badge=el('span','step-count');
  badge.textContent=prefix.textContent;
  prefix.replaceWith(badge);
  const label=el('span','step-label');
  badge.after(label);
  while(label.nextSibling) label.append(label.nextSibling);
  row.style.setProperty('--sequence',index);
});
const entry=modular.querySelector('.p13');
entry.classList.add('registration-section');
const action=q('.footer-action');
const reminder=entry.querySelector('.pictures');
reminder.className='reminder-art';
reminder.querySelector('img').alt='Jangan Tunggu Sampai Esok!';
const prompt=closing.querySelector('.closing-4'),join=closing.querySelector('.closing-5');
join.querySelector('a').rel='noopener';
action.prepend(reminder,prompt,join);
function revealSteps(){
  if(!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const observer=new IntersectionObserver(entries=>{
    const entering=entries.filter(e=>e.isIntersecting).sort((a,b)=>Number(a.target.style.getPropertyValue('--sequence'))-Number(b.target.style.getPropertyValue('--sequence')));
    entering.forEach(({target},index)=>{
      target.style.animationDelay=(index*110)+'ms';
      target.classList.add('step-arrived');
      observer.unobserve(target);
    });
  },{threshold:.22});
  stepCopy.querySelectorAll('.step-row').forEach(row=>observer.observe(row));
}
revealSteps();
{
  const page = document.getElementById('tab-pengenalan');
  const source = page.textContent.replace(/\s+/g, ' ').trim();
  const images = Array.from(page.querySelectorAll('img'));
  const register = page.querySelector('a[href]');
  const sections = [
    ['intro', '2) PENGENALAN', [0]],
    ['planning', 'Sudahkah Anda Buat Perancangan', [1]],
    ['obstacles', 'Sampai 35 Tahun Pulak Tu!', [2]],
    ['press-card', 'Tak Rancang Pendapatan Adalah', [3]],
    ['press-card', 'Tidak Mustahil Anda Juga', [4]],
    ['press-card', 'Jika Tidak Rancang, Berjimat', [5]],
    ['press-card', 'Merempat, Mengemis', [6]],
    ['press-card', 'Dibuang Anak Menantu', [7]],
    ['reflection', '3) 1,482', []],
    ['questions', 'Ingatlah, Tidak Ada Yang Mustahil', []],
    ['solution', 'ALHAMDULILLAH!', []],
    ['benefit', '1) MENAMBAH WANG SIMPANAN', []],
    ['benefit', '2) MENDAPAT', []],
    ['benefit', '3) “RAHSIA”', []],
    ['membership', 'Semua Itu Diperolehi', [8]],
    ['dream', 'Ayuh! Tukarkan Mimpi Ngeri', [9]],
    ['scan-offer', 'Mulakan Langkah Pertama Anda', [10]],
    ['join', 'TEKAN DISINI UNTUK MENJADI', []]
  ];
  const starts = sections.map(([,lead]) => source.indexOf(lead));
  if(starts.some((v,i)=>v<0 || (i && starts[i-1]>=v)) || images.length!==11)
    throw Error('Pengenalan source changed');
  const labels = ['Bakul barangan runcit, resit dan dompet','Buku perancangan, kalkulator dan pen','Keratan mengenai simpanan KWSP','Keratan mengenai kemuflisan','Keratan mengenai hutang','Keratan mengenai wang bersara','Keratan mengenai penjagaan warga emas','Keratan mengenai sokongan keluarga','Pesanan mengenai usaha dan alasan','Ilustrasi impian masa hadapan','Pesanan Takut Mencuba?'];
  const breaks = ['Anda Mungkin Akan Hidup','TETAPI','Adakah Wang Simpanan','Sedangkan Kos Sara Hidup','Jangan Tunggu','ANDA MESTI!!','Tetapi Bagaimana','Berbagai Alasan','Nak Upah Konsultan','Lantaklah!','Itulah Sebabnya','1) HAMPIR','2) LEBIH','Yang Paling Teruk','Adakah Anda Ingat','Semoga Allah','JUTAWAN BAHKAN','Inikan Pula','Anda Ada RM10','Masa Untuk Anda Lalui','Berbagai Cabaran','Sudahkan Anda','Tak Apa, Jangan Risau.','Selain Daripada','Bahkan Ia Dapat','Bayangkan!','Sebaliknya Nasib','Kini Sudah Ada','Anda Hanya Lakukan','Ia Akan Membuka','Ia Akan Menentukan','PILIHAN DITANGAN ANDA!','Jangan Sampai Anda'];
  const highlights = /(35 TAHUN AKAN DATANG|1 TAHUN HINGGA 35 TAHUN|35 TAHUN|RM350,000|RM7,000 SEBULAN|RM50 SAHAJA \/ SCAN\.|LAKUKAN SEGERA SEKARANG JUGA!)/g;
  const result = document.createDocumentFragment();
  let gallery,benefits;
  sections.forEach(([kind,lead,ids],i)=>{
    const block=el('article','intro-block intro-'+kind);
    let parent=result;
    if(kind==='press-card'){
      if(!gallery){gallery=el('div','intro-archive');result.append(gallery)}
      parent=gallery;
    }
    if(kind==='benefit'){
      if(!benefits){benefits=el('div','intro-benefits');result.append(benefits)}
      parent=benefits;
    }
    parent.append(block);
    const body=el('div','intro-prose');
    block.append(body);
    const segment=source.slice(starts[i],starts[i+1]??source.length).trim();
    const cuts=[0,...breaks.map(b=>segment.indexOf(b)).filter(n=>n>0),segment.length].sort((a,b)=>a-b);
    for(let j=0;j<cuts.length-1;j++){
      const part=segment.slice(cuts[j],cuts[j+1]).trim();
      if(!part)continue;
      const node=kind==='join'?register:el((j===0 && ['obstacles','reflection','solution','dream'].includes(kind)) || part.startsWith('Tetapi Bagaimana') || part.startsWith('PILIHAN DITANGAN')?'h2':'p');
      if(kind==='join'){node.className='button';node.textContent=part}
      else for(const [k,v] of part.split(highlights).entries()){
        if(k%2){const b=el('strong');b.textContent=v;node.append(b)}else node.append(v);
      }
      body.append(node,document.createTextNode(' '));
    }
    for(const n of ids){
      const button=el('button','intro-figure');
      button.type='button';button.setAttribute('aria-label','Besarkan gambar: '+labels[n]);
      const img=images[n];img.removeAttribute('role');img.removeAttribute('tabindex');img.removeAttribute('aria-label');img.removeAttribute('style');img.alt=labels[n];
      button.append(img);button.addEventListener('click',()=>enlarge(img));block.append(button);
    }
  });
  const opening=result.querySelector('.intro-intro');
  const openingCopy=opening.querySelector('.intro-prose');
  const [pageLabel,horizon,...concerns]=openingCopy.children;
  const calendar=el('div','retirement-calendar');
  calendar.setAttribute('role','img');
  calendar.setAttribute('aria-label','Tempoh selepas bersara: 35 tahun. Setiap titik mewakili satu tahun, dalam tujuh kumpulan lima tahun.');
  const ruler=el('div','year-ruler');
  for(let end=5;end<=35;end+=5){
    const group=el('div','year-group');
    group.dataset.year=end;
    for(let year=0;year<5;year++)group.append(el('i'));
    ruler.append(group);
  }
  calendar.append(ruler);
  const horizonPanel=el('div','horizon-panel');
  const horizonText=el('div','horizon-text');
  horizonText.append(pageLabel,document.createTextNode(' '),horizon,document.createTextNode(' '));
  horizonPanel.append(horizonText,calendar);
  const concernsPanel=el('div','cost-notes');
  const questions=el('div','cost-copy');
  concerns.forEach(p=>questions.append(p,document.createTextNode(' ')));
  concernsPanel.append(questions,opening.querySelector('.intro-figure'));
  opening.replaceChildren(horizonPanel,concernsPanel);

  const planning=result.querySelector('.intro-planning');
  const planningCopy=planning.querySelector('.intro-prose');
  const planningLines=Array.from(planningCopy.children);
  const sequence=el('div','planning-sequence');
  const symbols=[
    '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M7 6V3m10 3V3M3 11h18m-13 4h3"/>',
    '<path d="M6 3h12M6 21h12M7 3v3c0 3 3 4 5 6-2 2-5 3-5 6v3m10-18v3c0 3-3 4-5 6 2 2 5 3 5 6v3"/>',
    '<path d="M5 21V4m1 0h12l-3 4 3 4H6"/>'
  ];
  for(const [i,p] of planningLines.slice(0,-1).entries()){
    const step=el('div','planning-stop');
    step.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+symbols[i]+'</svg>';
    step.append(p,document.createTextNode(' '));sequence.append(step);
  }
  const promptBand=el('div','planning-prompt');
  promptBand.append(planningLines.at(-1),document.createTextNode(' '),planning.querySelector('.intro-figure'));
  planning.replaceChildren(sequence,promptBand);

  const reminder=result.querySelector('.intro-questions');
  const solution=result.querySelector('.intro-solution');
  const feature=el('div','planning-feature');
  feature.setAttribute('role','region');
  feature.setAttribute('aria-label','Persediaan dan manfaat perancangan');
  reminder.before(feature);
  const columns=reminder.querySelector('.intro-prose');
  const reminderLines=Array.from(columns.children);
  for(const lines of [reminderLines.slice(0,4),reminderLines.slice(4)]){
    const column=el('div','reminder-column');
    for(const line of lines)column.append(line,document.createTextNode(' '));
    columns.append(column);
  }
  feature.append(reminder,solution);
  solution.append(benefits);
  const solutionTitle=solution.querySelector('h2');
  const ribbon=el('span','horizon-ribbon');
  ribbon.dataset.label=solution.querySelector('strong').textContent;
  ribbon.setAttribute('aria-hidden','true');
  solutionTitle.after(ribbon);
  const titles=['MENAMBAH WANG SIMPANAN DAN MILIKI ASET BERNILAI TINGGI (ABT)','MENDAPAT “PENCEN / PENCEN KE 2”','“RAHSIA” LEBIH 20 MANFAAT BESAR YANG LAIN.'];
  Array.from(benefits.children).forEach((card,i)=>{
    const paragraph=card.querySelector('p');
    const first=paragraph.firstChild;
    const title=first.splitText(3);
    title.splitText(titles[i].length);
    const label=el('strong','benefit-heading');
    title.before(label);label.append(title);
    const index=el('span','benefit-number');
    first.before(index);index.append(first);
    card.dataset.number=String(i+1).padStart(2,'0');
  });
  // Bring the lead clipping and its context into the same exhibit as the five related items.
  const report=result.querySelector('.intro-obstacles');
  const collection=el('div','press-collection');
  collection.setAttribute('role','region');
  collection.setAttribute('aria-label','Galeri keratan media');
  report.before(collection);
  const lead=report.querySelector('.intro-prose');
  const firstCard=el('article','intro-block intro-press-card');
  const leadCaption=el('div','intro-prose');
  leadCaption.append(lead.lastElementChild,document.createTextNode(' '));
  firstCard.append(leadCaption,report.querySelector('.intro-figure'));
  gallery.prepend(firstCard);
  const reflection=result.querySelector('.intro-reflection');
  collection.append(report,gallery,reflection);
  const thumbnails=Array.from(gallery.querySelectorAll('.intro-figure'));
  thumbnails.forEach(button=>{
    const card=button.parentElement;
    card.prepend(button);
    button.title=button.getAttribute('aria-label');
  });
  // Lay each clipping into the first available column as its image or caption resizes.
  const measureCards=new ResizeObserver(entries=>{
    for(const {target} of entries){
      const height=target.getBoundingClientRect().height;
      if(height>0)target.style.gridRowEnd='span '+Math.ceil((height+20)/4);
    }
  });
  gallery.classList.add('press-masonry');
  for(const card of gallery.children)measureCards.observe(card);
  const motivation=el('div','motivation-feature');
  motivation.setAttribute('role','region');
  motivation.setAttribute('aria-label','Keahlian dan perancangan pendapatan');
  const stories=['membership','dream','scan-offer'].map(kind=>result.querySelector('.intro-'+kind));
  stories[0].before(motivation);
  motivation.append(...stories);
  const quotes=[
    'Orang yang berjaya memberi usaha. Orang yang gagal memberi alasan. — Irfan Khairi',
    'No matter what your current circumstances are, if you can imagine something better for yourself, you can create it. — @successpictures',
    'Takut Mencuba? Sampai Bila Nak Berjaya...'
  ];
  stories.forEach((story,i)=>{
    const art=story.querySelector('.intro-figure');
    art.querySelector('img').alt=quotes[i];
    art.setAttribute('aria-label','Besarkan gambar: '+quotes[i]);
    story.prepend(art);
  });
  const reflectionTitle=reflection.querySelector('h2');
  reflectionTitle.firstChild.textContent=reflectionTitle.firstChild.textContent.replace(/^3\)\s+/,'');
  page.replaceChildren(result);
  if(page.textContent.replace(/\s+/g,' ').trim()!==source.replace('3) 1,482','1,482'))throw Error('Pengenalan copy mismatch');

  page.querySelector('.intro-join').remove();
}
