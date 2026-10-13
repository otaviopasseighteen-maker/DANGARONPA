(() => {
"use strict";
const $=(s,r=document)=>r.querySelector(s), app=$("#app"), searchDialog=$("#search-dialog"), detailDialog=$("#detail-dialog");
const colors={thh:"#ff3b5f",gd:"#7be7e8",udg:"#ff6fae",v3:"#f4d35e"};
const labels={thh:"TRIGGER HAPPY HAVOC",gd:"GOODBYE DESPAIR",udg:"ULTRA DESPAIR GIRLS",v3:"KILLING HARMONY"};
let games=[],characters=[],stories=[],executions=[],activeGame=null,activeTab="characters",spoilerUnlocked=false,portraitLoadStarted=false;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const gameLabel=id=>labels[id]||String(id||"").toUpperCase();
const getGame=id=>games.find(g=>g.id===id),charsFor=id=>characters.filter(c=>c.gameId===id),storyFor=id=>stories.find(s=>s.id===id),executionFor=id=>executions.find(e=>e.id===id);
const initials=name=>String(name||"DR").split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0]).join("").toUpperCase()||"DR";
async function loadData(){
 try{
  const data=await Promise.all(["games.json","characters.json","story.json","executions.json"].map(async f=>{const r=await fetch("data/"+f);if(!r.ok)throw Error("Não foi possível carregar data/"+f);return r.json()}));
  [games,characters,stories,executions]=data;
  render();loadPortraits();
 }catch(e){console.error(e);app.innerHTML='<div class="page-wrap"><div class="error-box"><div class="eyebrow">ERRO DE SISTEMA</div><h1>ARQUIVO INDISPONÍVEL</h1><p>Não consegui ler os arquivos. Abra pelo GitHub Pages ou use um servidor local.</p><p class="mono">'+esc(e.message)+'</p><button class="btn btn-primary" onclick="location.reload()">TENTAR NOVAMENTE ↻</button></div></div>'}
}
async function loadPortraits(){
 if(portraitLoadStarted)return;portraitLoadStarted=true;
 const names=[...new Set(characters.filter(c=>!c.imageUrl).map(c=>c.name).filter(Boolean))];
 const found=new Map();
 for(let start=0;start<names.length;start+=35){
  const batch=names.slice(start,start+35);
  try{
   const p=new URLSearchParams({action:"query",format:"json",formatversion:"2",prop:"pageimages",piprop:"thumbnail",pithumbsize:"640",redirects:"1",origin:"*"});
   p.set("titles",batch.join("|"));
   const r=await fetch("https://danganronpa.fandom.com/api.php?"+p.toString());
   if(!r.ok)continue;const j=await r.json();
   (j.query?.pages||[]).forEach(page=>{if(page.thumbnail?.source)found.set(String(page.title||"").trim().toLowerCase(),page.thumbnail.source)});
  }catch(e){console.warn("Retratos adicionais indisponíveis; mantendo os endereços cadastrados.",e)}
 }
 let changed=false;
 characters.forEach(c=>{if(c.imageUrl)return;const src=found.get(String(c.name||"").trim().toLowerCase());if(src){c.imageUrl=src;changed=true}});
 if(changed)render();
}
function render(){
 const p=location.hash.replace(/^#/,"").split("/");
 if(!p[0]||["home","games","archive"].includes(p[0])){
  home();
  if(p[0]==="archive"||p[0]==="games")setTimeout(()=>document.getElementById(p[0])?.scrollIntoView({behavior:"smooth"}),0);
  else window.scrollTo({top:0,behavior:"auto"});
  return;
 }
 if(p[0]==="game"&&getGame(p[1]))gamePage(p[1],p[2]||"characters");else home();
 window.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
}
function home(){
 activeGame=null;
 const monokumaPortrait=document.querySelector(".hero-monokuma-img"); if(monokumaPortrait){fetch("https://danganronpa.fandom.com/api.php?action=query&titles=Monokuma&prop=pageimages&format=json&pithumbsize=700&origin=*").then(r=>r.json()).then(data=>{const pages=data?.query?.pages||{};const page=Object.values(pages)[0];if(page?.thumbnail?.source)monokumaPortrait.src=page.thumbnail.source;}).catch(()=>{});}
 app.innerHTML='<div class="page-wrap"><section class="hero"><div class="hero-content"><div class="eyebrow">ARQUIVO CENTRAL // ACESSO AUTORIZADO</div><h1>HOPE IS<br><span>A LIE.</span></h1><p class="hero-copy">Quatro jogos. Um arquivo confidencial. Explore personagens, histórias e registros de cada jogo — sem misturar o cânone dos games com o anime.</p><div class="hero-actions"><a class="btn btn-primary" href="#games">ENTRAR NOS ARQUIVOS <span>↘</span></a><button class="btn" data-open-search>BUSCA GLOBAL <span>⌕</span></button></div><div class="hero-foot mono"><span><i class="status-dot"></i> SISTEMA OPERACIONAL</span><span>DATABASE // 001—004</span></div></div><div class="hero-art" aria-label="Emblema abstrato do arquivo"><div class="hero-ring ring-one"></div><div class="hero-ring ring-two"></div><div class="hero-cross">×</div><img class="hero-monokuma-img" src="" alt="Rosto de Monokuma" loading="eager"><span class="art-label label-top">HOPE&#39;S PEAK<br>CONFIDENTIAL</span><span class="art-label label-bottom">TRUTH / DESPAIR / HOPE</span><span class="art-stamp">CLASSIFIED</span></div></section></div><div class="ticker"><div class="ticker-track"><span>▰ <strong>AVISO</strong> — ESTE ARQUIVO CONTÉM SPOILERS</span><span>NO HOPE WITHOUT DESPAIR</span><span>▰ <strong>AVISO</strong> — ESTE ARQUIVO CONTÉM SPOILERS</span><span>NO HOPE WITHOUT DESPAIR</span></div></div><div class="page-wrap"><section class="section" id="games"><div class="section-heading"><div><div class="eyebrow">SELECIONE UM JOGO</div><h2>Escolha seu<br>próximo caso.</h2></div><p>Pastas independentes, cada uma com seu elenco, história e arquivos. Abra um jogo para investigar os registros.</p></div><div class="game-grid">'+games.map(gameCard).join("")+'</div></section><section class="archive-strip"><div class="archive-stat"><strong>'+String(games.length).padStart(2,"0")+'</strong><span>JOGOS CATALOGADOS</span></div><div class="archive-stat"><strong>'+String(characters.length).padStart(2,"0")+'</strong><span>DOSSIÊS DE PERSONAGEM</span></div><div class="archive-stat"><strong>100%</strong><span>FOCO NOS JOGOS</span></div></section><section class="section global-archive" id="archive"><div class="section-heading"><div><div class="eyebrow">BUSCA MULTIVERSO</div><h2>Arquivo geral.</h2></div><p>Procure nomes, talentos ou palavras-chave em todos os jogos catalogados.</p></div><div class="classified"><span class="classified-stamp">ACESSO AUTORIZADO</span><h3>Toda pista deixa um rastro.</h3><p>Use a pesquisa global para encontrar rapidamente um personagem e abrir seu dossiê.</p><button class="btn btn-primary" data-open-search>INICIAR INVESTIGAÇÃO ↗</button></div></section></div>';
 bindCommon();
}
function gameCard(g){
 const id=g.id,n=({"thh":"01","gd":"02","udg":"03","v3":"04"})[id]||"??",accent=colors[id]||"#ff3b5f";
 return '<a class="game-card game-'+esc(id)+'" data-number="'+n+'" style="--game-accent:'+accent+'" href="#game/'+esc(id)+'"><div class="game-card-noise"></div><div class="game-topline"><span class="game-index">FILE_0'+n+'</span><span>'+esc(g.release||"CLASSIFIED")+'</span></div><div class="game-card-main"><span class="game-kicker">'+esc(g.type||"GAME FILE")+'</span><h3>'+esc(g.title)+'</h3><p>'+esc(g.description||"Arquivo de jogo recuperado.")+'</p></div><div class="game-bottom"><span>'+charsFor(id).length+' DOSSIÊS INDEXADOS</span><span class="game-arrow">↗</span></div><span class="game-watermark">'+n+'</span></a>';
}
function gamePage(id,tab){
 activeGame=getGame(id);activeTab=["characters","story","executions","intel"].includes(tab)?tab:"characters";
 app.innerHTML='<div class="page-wrap game-page"><header class="subpage-head"><nav class="breadcrumb"><a href="#home">ARQUIVO CENTRAL</a><span>/</span><span>'+esc(gameLabel(id))+'</span></nav><section class="game-hero" style="--game-accent:'+(colors[id]||"#ff3b5f")+'"><div class="game-hero-watermark">'+({"thh":"01","gd":"02","udg":"03","v3":"04"})[id]+'</div><div class="eyebrow">DOSSIÊ DE JOGO // '+({"thh":"01","gd":"02","udg":"03","v3":"04"})[id]+'</div><h1>'+esc(activeGame.title)+'</h1><p>'+esc(activeGame.description||"Arquivo de jogo")+'</p><div class="game-meta"><span class="tag">ANO: '+esc(activeGame.release||"CLASSIFIED")+'</span><span class="tag">'+charsFor(id).length+' PERSONAGENS</span><span class="tag">STATUS: ABERTO</span></div></section></header><nav class="tabs" aria-label="Seções do jogo"><button class="tab '+(activeTab==="characters"?"active":"")+'" data-tab="characters">01 / PERSONAGENS</button><button class="tab '+(activeTab==="story"?"active":"")+'" data-tab="story">02 / HISTÓRIA</button><button class="tab '+(activeTab==="executions"?"active":"")+'" data-tab="executions">03 / EXECUÇÕES</button><button class="tab '+(activeTab==="intel"?"active":"")+'" data-tab="intel">04 / RELATÓRIO</button></nav><div id="game-content">'+tabContent(id,activeTab)+'</div><div class="page-back"><a class="btn" href="#home">← VOLTAR AOS JOGOS</a><button class="btn" data-open-search>⌕ BUSCAR EM TODOS OS ARQUIVOS</button></div></div>';
 bindCommon();document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{activeTab=b.dataset.tab;document.querySelectorAll("[data-tab]").forEach(t=>t.classList.toggle("active",t===b));$("#game-content").innerHTML=tabContent(id,activeTab);bindContent(id,activeTab)}));bindContent(id,activeTab);
}
function tabContent(id,tab){return tab==="characters"?characterContent(id):tab==="story"?storyContent(id):tab==="executions"?executionsContent(id):intelContent(id)}
function characterContent(id){
 const list=charsFor(id);
 return '<div class="toolbar"><div><div class="eyebrow">REGISTROS DE INDIVÍDUOS</div><p class="muted">'+list.length+' dossiês nesta pasta. Selecione um perfil para ver detalhes.</p></div><div class="character-tools"><input class="filter-input" id="character-filter" type="search" placeholder="Buscar nome, talento..." aria-label="Filtrar personagens"><select class="filter-select" id="role-filter" aria-label="Filtrar por categoria"><option value="">Todas as categorias</option><option value="protagon">Protagonistas</option><option value="antagon">Antagonistas</option><option value="criatura">Mascotes e criaturas</option><option value="estudante">Estudantes</option><option value="secund">Secundários</option></select></div></div><div class="character-grid" id="character-grid">'+list.map((c,i)=>characterCard(c,i)).join("")+'</div>';
}
function portraitMarkup(c,large=false){
 const image=c.imageUrl||c.image||"",fallback=initials(c.name),cls=large?"detail-portrait":"character-image";
 return '<span class="'+cls+(image?' has-image':'')+'">'+(image?'<img loading="lazy" decoding="async" src="'+esc(image)+'" alt="Retrato de '+esc(c.name)+'" onerror="this.closest(\'.'+cls+'\').classList.add(\'image-failed\');this.remove()">':'')+'<span class="portrait-fallback" aria-hidden="true">'+esc(fallback)+'</span><span class="portrait-corner" aria-hidden="true">DR</span></span>';
}
function characterCard(c,i){
 return '<button class="character-card" data-character="'+esc(c.id)+'" aria-label="Abrir dossiê de '+esc(c.name)+'">'+portraitMarkup(c)+'<span class="character-number">NO. '+String(i+1).padStart(2,"0")+'</span><span class="character-open">↗</span><span class="character-copy"><span class="character-role">'+esc(c.role||"ARQUIVO")+'</span><h3>'+esc(c.name)+'</h3><p>'+esc(c.talent||"Talento não registrado")+'</p></span></button>';
}
function storyContent(id){
 const s=storyFor(id);if(!s)return empty("NENHUM REGISTRO DE HISTÓRIA","Este arquivo ainda não tem um dossiê narrativo estruturado.");
 const ch=s.chapters||[];
 return '<div class="story-intro"><div class="classified"><span class="classified-stamp">SPOILER ALERT</span><h3>'+esc(s.title||activeGame.title)+'</h3><p>'+esc(s.premise||s.description||"Registro de história recuperado parcialmente.")+'</p><button class="btn btn-primary" id="spoiler-toggle">'+(spoilerUnlocked?"OCULTAR DETALHES":"REVELAR DETALHES COM SPOILERS")+' ↘</button></div><div class="story-side"><span class="eyebrow">CENÁRIOS REGISTRADOS</span>'+(s.locations||[]).map((l,i)=>'<div class="location-line"><span>0'+(i+1)+'</span>'+esc(l)+'</div>').join("")+'</div></div><div id="story-details" '+(spoilerUnlocked?"":"hidden")+'><div class="timeline">'+(ch.length?ch.map((c,i)=>'<article class="timeline-item"><span class="mono timeline-number">CASE '+String(i+1).padStart(2,"0")+'</span><h3>'+esc(c.title||c.name||"Capítulo "+(i+1))+'</h3><p>'+esc(c.summary||c.description||c.content||"Registro sem resumo.")+'</p></article>').join(""):'<p class="muted">Ainda não existem capítulos detalhados.</p>')+'</div></div>';
}
function executionsContent(id){
 const group=executionFor(id),entries=group&&group.entries||[],isUdg=id==="udg";
 if(!entries.length)return empty("ARQUIVO SEM REGISTROS","Nenhum registro foi encontrado para este jogo. Não vamos inventar informações para preencher a pasta.");
 return '<div class="classified executions-intro"><span class="classified-stamp">CONTEÚDO COM SPOILERS</span><h3>'+(isUdg?'Eventos e confrontos':'Registros de execução')+'</h3><p>'+esc(group.description||"Os registros abaixo podem revelar acontecimentos importantes da história.")+'</p><p class="mono">ABRA UM REGISTRO PARA LER O CONTEXTO.</p></div><div class="record-list">'+entries.map((e,i)=>'<article class="record-card"><div class="record-index">'+String(i+1).padStart(2,"0")+'</div><div class="record-main"><span class="record-warning">▰ ARQUIVO COM SPOILERS</span><h3>'+esc(e.name||e.title||"Registro sem título")+'</h3><p>'+esc(e.character||"Identidade não registrada")+'</p></div><button class="record-open" data-execution="'+esc(id)+'" data-entry="'+i+'">ABRIR ↗</button></article>').join("")+'</div>';
}
function intelContent(id){
 const s=storyFor(id),e=executionFor(id);
 return '<div class="section-heading intel-heading"><div><div class="eyebrow">RESUMO DO SISTEMA</div><h2>Relatório de<br>inteligência.</h2></div><p>Uma visão geral do que foi catalogado nesta pasta. Dados ausentes ficam pendentes em vez de inventados.</p></div><section class="archive-strip intel-strip"><div class="archive-stat"><strong>'+charsFor(id).length+'</strong><span>DOSSIÊS DE PERSONAGEM</span></div><div class="archive-stat"><strong>'+((s&&s.chapters)||[]).length+'</strong><span>REGISTROS DE CAPÍTULO</span></div><div class="archive-stat"><strong>'+((e&&e.entries)||[]).length+'</strong><span>REGISTROS DE EVENTO</span></div></section><div class="classified"><span class="classified-stamp">STATUS // EM EXPANSÃO</span><h3>Conecte os pontos.</h3><p>Personagens, narrativa e registros são mantidos separados por jogo. A busca global encontra termos em todas as pastas.</p><button class="btn btn-primary" data-open-search>BUSCAR NA REDE ↗</button></div>';
}
function empty(title,msg){return '<div class="empty-state"><div class="eyebrow">'+esc(title)+'</div><p>'+esc(msg)+'</p></div>'}
function bindContent(id,tab){
 if(tab==="characters"){
  const input=$("#character-filter"),role=$("#role-filter"),grid=$("#character-grid");
  const update=()=>{const q=(input?.value||"").toLowerCase().trim(),r=role?.value||"",found=charsFor(id).filter(c=>{const text=[c.name,c.talent,c.role,c.description].join(" ").toLowerCase(),roleText=String(c.role||"").toLowerCase(),isCreature=/monokuma|monomi|usami|monokub|mascote|criatura|urso robótico/i.test(c.name+" "+c.role);let matchRole=!r||(r==="protagon"&&/protagon/i.test(roleText))||(r==="antagon"&&/antagon/i.test(roleText))||(r==="criatura"&&isCreature)||(r==="estudante"&&/estudante/i.test(roleText))||(r==="secund"&&/secund|aliado|investigador|personagem-chave/i.test(roleText));return text.includes(q)&&matchRole});grid.innerHTML=found.length?found.map((c,i)=>characterCard(c,i)).join(""):empty("NENHUM PERFIL ENCONTRADO","Tente outro termo ou remova o filtro de categoria.");bindCharacterCards(grid)};
  input?.addEventListener("input",update);role?.addEventListener("change",update);bindCharacterCards(grid||document);
 }
 if(tab==="story"){const b=$("#spoiler-toggle");if(b)b.addEventListener("click",()=>{spoilerUnlocked=!spoilerUnlocked;$("#story-details").hidden=!spoilerUnlocked;b.textContent=(spoilerUnlocked?"OCULTAR DETALHES":"REVELAR DETALHES COM SPOILERS")+" ↘"})}
 if(tab==="executions")document.querySelectorAll("[data-execution]").forEach(b=>b.addEventListener("click",()=>{const g=executionFor(b.dataset.execution),e=g&&g.entries[Number(b.dataset.entry)];if(!e)return;showDetail('<div class="eyebrow">'+(id==="udg"?"REGISTRO DE EVENTO":"REGISTRO DE EXECUÇÃO")+' // '+esc(gameLabel(id))+'</div><h2 class="detail-title">'+esc(e.name||e.title||"Registro")+'</h2><div class="detail-body"><p><strong>Personagem:</strong> '+esc(e.character||"Não identificado")+'</p><p>'+esc(e.context||"Sem contexto registrado.")+'</p></div>')}));
}
function openCharacter(c){
 showDetail('<div class="detail-hero">'+portraitMarkup(c,true)+'<div><div class="eyebrow">DOSSIÊ INDIVIDUAL // '+esc(gameLabel(c.gameId))+'</div><h2 class="detail-title">'+esc(c.name)+'</h2><div class="game-meta"><span class="tag">'+esc(c.role||"ARQUIVO")+'</span><span class="tag">'+esc(c.talent||"TALENTO NÃO REGISTRADO")+'</span></div></div></div><div class="detail-body"><h3>Resumo do registro</h3><p>'+esc(c.description||"Nenhuma descrição cadastrada.")+'</p>'+(c.story?'<h3>Notas do arquivo</h3><p>'+esc(c.story)+'</p>':"")+'<p class="mono">ORIGEM: '+esc(c.game||gameLabel(c.gameId))+' // ID: '+esc(c.id)+'</p><a class="btn" href="#game/'+esc(c.gameId)+'/characters" onclick="document.getElementById(\'detail-dialog\').close()">VOLTAR À PASTA ↗</a></div>');
}
function bindCharacterCards(root=document){root.querySelectorAll("[data-character]").forEach(b=>{if(b.dataset.bound)return;b.dataset.bound="1";b.addEventListener("click",()=>{const c=characters.find(x=>x.id===b.dataset.character);if(c)openCharacter(c)})})}
function showDetail(html){$("#detail-content").innerHTML=html;if(detailDialog.showModal)detailDialog.showModal();else detailDialog.setAttribute("open","")}
function bindCommon(){document.querySelectorAll("[data-open-search]").forEach(b=>b.addEventListener("click",openSearch));$("#global-search-open").onclick=openSearch;bindCharacterCards()}
function openSearch(){if(searchDialog.showModal)searchDialog.showModal();else searchDialog.setAttribute("open","");$("#global-search").focus();searchResults("")}
function searchResults(query){
 const target=$("#search-results"),q=query.trim().toLowerCase(),found=characters.filter(c=>!q||[c.name,c.talent,c.role,c.game,c.description].join(" ").toLowerCase().includes(q)).slice(0,30);
 target.innerHTML=found.length?found.map(c=>'<button class="search-result" data-search-character="'+esc(c.id)+'"><span class="search-avatar">'+esc(initials(c.name))+'</span><span class="search-result-copy">'+esc(c.name)+'<small>'+esc(c.talent||c.role||"DOSSIÊ")+' · '+esc(c.game||gameLabel(c.gameId))+'</small></span><span class="search-arrow">↗</span></button>').join(""):'<p class="muted">Nenhum resultado encontrado. Tente outro termo.</p>';
 target.querySelectorAll("[data-search-character]").forEach(b=>b.addEventListener("click",()=>{const c=characters.find(x=>x.id===b.dataset.searchCharacter);if(!c)return;searchDialog.close();location.hash="game/"+c.gameId+"/characters";setTimeout(()=>{const card=Array.from(document.querySelectorAll("[data-character]")).find(x=>x.dataset.character===c.id);if(card)card.click();else openCharacter(c)},100)}));
}
$("#global-search").addEventListener("input",e=>searchResults(e.target.value));
$(".close-dialog").addEventListener("click",()=>searchDialog.close());$(".detail-close").addEventListener("click",()=>detailDialog.close());
searchDialog.addEventListener("click",e=>{if(e.target===searchDialog)searchDialog.close()});detailDialog.addEventListener("click",e=>{if(e.target===detailDialog)detailDialog.close()});
window.addEventListener("hashchange",render);loadData();
})();