const GAME_TRANSITIONS={thh:"crush",gd:"explode",udg:"glitch",v3:"shatter"};
let gamesCache=[],activeGameId="thh",transitionBusy=false,allCharacters=[];

async function loadData(){
  const path=(document.body.dataset.base||"")+"data/";
  try{
    const [games,characters,stories,executions]=await Promise.all(["games.json","characters.json","story.json","executions.json"].map(file=>fetch(path+file).then(r=>{if(!r.ok)throw new Error("Falha ao carregar "+file);return r.json()})));
    gamesCache=games;allCharacters=characters;
    renderGames(games);renderCharacters(characters);renderStories(stories,games);renderExecutions(executions,games);
    syncStage(games.find(g=>g.id===activeGameId)||games[0]);setupCharacterFilters();
  }catch(error){console.error("Erro ao carregar a base:",error);document.querySelectorAll(".container").forEach(c=>{if(!c.querySelector(".load-error"))c.insertAdjacentHTML("beforeend",'<p class="load-error">Não foi possível carregar os dados. Atualize a página e tente novamente.</p>')})}
}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderGames(games){
 document.querySelectorAll("#game-list").forEach(container=>{container.innerHTML="";games.forEach(game=>{
  const article=document.createElement("article");article.className="card game-card";article.dataset.gameId=game.id;
  article.innerHTML='<span class="meta">'+escapeHtml(game.type)+'</span><h3>'+escapeHtml(game.title)+'</h3><p>'+escapeHtml(game.description)+'</p><p><strong>Lançamento:</strong> '+escapeHtml(game.release)+'</p>';
  if(document.querySelector("#game-stage")){const b=document.createElement("button");b.className="button card-action";b.type="button";b.textContent=game.id===activeGameId?"Selecionado":"Entrar no jogo";b.addEventListener("click",()=>switchGame(game.id));article.append(b)}
  else article.insertAdjacentHTML("beforeend",'<p class="card-links"><a href="story.html?game='+encodeURIComponent(game.id)+'">História</a> · <a href="executions.html?game='+encodeURIComponent(game.id)+'">Execuções</a></p>');
  container.append(article)
 })})
}
function renderCharacters(characters){
 const container=document.querySelector("#character-list");if(!container)return;
 const filter=new URLSearchParams(location.search).get("game");
 const filtered=filter&&filter!=="all"?characters.filter(c=>c.gameId===filter):characters;
 container.innerHTML=filtered.map(c=>'<article class="card character-card" data-game-id="'+escapeHtml(c.gameId)+'"><div class="character-art" role="img" aria-label="Imagem de '+escapeHtml(c.name)+'" style="background-image:linear-gradient(180deg,rgba(10,10,15,.02) 10%,rgba(10,10,15,.94) 100%),url(&quot;'+escapeHtml(c.imageUrl||"") +'&quot;)"><span class="character-art-placeholder">'+escapeHtml(c.name.split(/\s+/).map(n=>n[0]).slice(0,2).join("").toUpperCase())+'</span></div><span class="meta">'+escapeHtml(c.game)+'</span><h3>'+escapeHtml(c.name)+'</h3><p class="talent"><strong>Talento:</strong> '+escapeHtml(c.talent)+'</p><p class="character-role"><strong>Papel:</strong> '+escapeHtml(c.role||"Personagem") +'</p><p>'+escapeHtml(c.description)+'</p><details><summary>Ver resumo da história</summary><p>'+escapeHtml(c.story)+'</p><p class="spoiler-note">Nível de spoiler: '+escapeHtml(c.spoilerLevel)+'</p></details></article>').join("");
}
function setupCharacterFilters(){const filters=document.querySelector("#character-filters");if(!filters)return;filters.querySelectorAll("[data-game-filter]").forEach(button=>button.addEventListener("click",()=>{const id=button.dataset.gameFilter;filters.querySelectorAll("button").forEach(b=>b.classList.toggle("is-selected",b===button));renderCharacters(id==="all"?allCharacters:allCharacters.filter(c=>c.gameId===id))}))}
function renderStories(stories,games){
 const container=document.querySelector("#story-list");if(!container)return;
 const selected=new URLSearchParams(location.search).get("game");
 const list=selected?stories.filter(s=>s.id===selected):stories;
 container.innerHTML=list.map(s=>'<section class="data-section" id="story-'+escapeHtml(s.id)+'"><p class="eyebrow">'+escapeHtml((games.find(g=>g.id===s.id)||{}).title||s.title)+'</p><h2>'+escapeHtml(s.subtitle)+'</h2><p class="spoiler-note">Aviso: '+escapeHtml(s.spoilerWarning)+'</p><p class="story-premise">'+escapeHtml(s.premise)+'</p><h3>Etapas da história</h3><div class="chapter-grid">'+s.chapters.map((ch,i)=>'<article class="chapter-card"><span class="meta">ETAPA '+(i+1)+'</span><h4>'+escapeHtml(ch.title)+'</h4><p>'+escapeHtml(ch.summary)+'</p></article>').join("")+'</div><h3>Locais importantes</h3><ul class="location-list">'+s.locations.map(l=>'<li>'+escapeHtml(l)+'</li>').join("")+'</ul><a class="text-link" href="characters.html?game='+escapeHtml(s.id)+'">Ver personagens deste jogo →</a></section>').join("")
}
function renderExecutions(data,games){
 const container=document.querySelector("#execution-list");if(!container)return;
 const selected=new URLSearchParams(location.search).get("game"),list=selected?data.filter(d=>d.id===selected):data;
 container.innerHTML=list.map(group=>'<section class="data-section execution-section" id="execution-'+escapeHtml(group.id)+'"><p class="eyebrow">'+escapeHtml((games.find(g=>g.id===group.id)||{}).title||group.title)+'</p><h2>'+escapeHtml(group.title)+'</h2><p>'+escapeHtml(group.description)+'</p><div class="execution-grid">'+group.entries.map(entry=>'<article class="chapter-card execution-card"><span class="meta">SPOILERS</span><h3>'+escapeHtml(entry.name)+'</h3><p><strong>Personagem:</strong> '+escapeHtml(entry.character)+'</p><p>'+escapeHtml(entry.context)+'</p>'+(entry.videoUrl&&/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(entry.videoUrl)?'<p><a class="text-link" href="'+escapeHtml(entry.videoUrl)+'" target="_blank" rel="noopener noreferrer">Assistir ao vídeo ↗</a></p>':'<p class="media-pending">'+escapeHtml(entry.videoNote||"Vídeo ainda não cadastrado.")+'</p>')+'</article>').join("")+'</div></section>').join("")
}
function syncStage(game){if(!game)return;const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};set("stage-title",game.title);set("stage-eyebrow","SELECIONADO · "+game.type.toUpperCase());set("stage-description",game.description);set("stage-hint","Jogo selecionado: "+game.title);document.querySelectorAll("#game-list .game-card").forEach(card=>{const b=card.querySelector("button");if(b)b.textContent=card.dataset.gameId===game.id?"Selecionado":"Entrar no jogo"})}
function switchGame(nextId){if(transitionBusy||nextId===activeGameId)return;const game=gamesCache.find(g=>g.id===nextId),stage=document.querySelector("#game-stage"),overlay=document.querySelector("#transition-overlay"),stamp=document.querySelector("#transition-stamp");if(!game||!stage||!overlay||!stamp){activeGameId=nextId;syncStage(game);return}transitionBusy=true;const effect=GAME_TRANSITIONS[activeGameId]||"crush";stage.classList.remove("is-leaving-crush","is-leaving-explode","is-leaving-glitch","is-leaving-shatter");overlay.className="transition-overlay effect-"+effect;stamp.textContent="EXECUTION START";overlay.setAttribute("aria-hidden","false");overlay.classList.add("is-active");stage.classList.add("is-leaving-"+effect);const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;window.setTimeout(()=>{activeGameId=nextId;syncStage(game);stage.classList.remove("is-leaving-crush","is-leaving-explode","is-leaving-glitch","is-leaving-shatter");stamp.textContent="WELCOME TO "+game.title;overlay.className="transition-overlay effect-"+(GAME_TRANSITIONS[nextId]||"crush")+" is-active";window.setTimeout(()=>{overlay.classList.remove("is-active");overlay.setAttribute("aria-hidden","true");transitionBusy=false},reduced?80:420)},reduced?80:780)}
loadData();