const GAME_TRANSITIONS={thh:"crush",gd:"explode",udg:"glitch",v3:"shatter"};
let gamesCache=[];
let activeGameId="thh";
let transitionBusy=false;

async function loadData(){
  const base=document.body.dataset.base||"";
  const path=base+"data/";
  try{
    const [games,characters]=await Promise.all([
      fetch(path+"games.json").then(response=>{if(!response.ok)throw new Error("Could not load games");return response.json()}),
      fetch(path+"characters.json").then(response=>{if(!response.ok)throw new Error("Could not load characters");return response.json()})
    ]);
    gamesCache=games;
    renderGames(games);
    renderCharacters(characters);
    syncStage(games.find(game=>game.id===activeGameId)||games[0]);
  }catch(error){console.error("Database loading error:",error)}
}

function renderGames(games){
  document.querySelectorAll("#game-list").forEach(container=>{
    container.innerHTML="";
    games.forEach(game=>{
      const article=document.createElement("article");
      article.className="card";
      const meta=document.createElement("span");
      meta.className="meta";
      meta.textContent=game.type;
      const title=document.createElement("h3");
      title.textContent=game.title;
      const description=document.createElement("p");
      description.textContent=game.description;
      const release=document.createElement("p");
      release.innerHTML="<strong>Release:</strong> ";
      release.append(document.createTextNode(game.release));
      if(document.querySelector("#game-stage")){
        const button=document.createElement("button");
        button.className="button card-action";
        button.type="button";
        button.textContent=game.id===activeGameId?"Selected":"Enter game";
        button.setAttribute("aria-label","Switch to "+game.title);
        button.addEventListener("click",()=>switchGame(game.id));
        article.append(meta,title,description,release,button);
      }else{
        article.append(meta,title,description,release);
      }
      container.append(article);
    });
  });
}

function renderCharacters(characters){
  const container=document.querySelector("#character-list");
  if(!container)return;
  container.innerHTML=characters.map(character=>'<article class="card"><span class="meta">'+escapeHtml(character.game)+'</span><h3>'+escapeHtml(character.name)+'</h3><p><strong>Talent:</strong> '+escapeHtml(character.talent)+'</p><p>'+escapeHtml(character.description)+'</p></article>').join("");
}

function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}

function syncStage(game){
  if(!game)return;
  const title=document.querySelector("#stage-title");
  const eyebrow=document.querySelector("#stage-eyebrow");
  const description=document.querySelector("#stage-description");
  const hint=document.querySelector("#stage-hint");
  if(title)title.textContent=game.title;
  if(eyebrow)eyebrow.textContent="NOW SELECTED · "+game.type.toUpperCase();
  if(description)description.textContent=game.description;
  if(hint)hint.textContent="Current selection: "+game.title;
  document.querySelectorAll("#game-list .card").forEach(card=>{
    const button=card.querySelector("button");
    if(button&&button.getAttribute("aria-label")==="Switch to "+game.title)button.textContent="Selected";
    else if(button)button.textContent="Enter game";
  });
}

function switchGame(nextId){
  if(transitionBusy||nextId===activeGameId)return;
  const nextGame=gamesCache.find(game=>game.id===nextId);
  const stage=document.querySelector("#game-stage");
  const overlay=document.querySelector("#transition-overlay");
  const stamp=document.querySelector("#transition-stamp");
  if(!nextGame||!stage||!overlay||!stamp){activeGameId=nextId;syncStage(nextGame);return}
  transitionBusy=true;
  const effect=GAME_TRANSITIONS[activeGameId]||"crush";
  stage.classList.remove("is-leaving-crush","is-leaving-explode","is-leaving-glitch","is-leaving-shatter");
  overlay.className="transition-overlay effect-"+effect;
  stamp.textContent="EXECUTION START";
  overlay.setAttribute("aria-hidden","false");
  overlay.classList.add("is-active");
  stage.classList.add("is-leaving-"+effect);
  const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration=reducedMotion?80:780;
  window.setTimeout(()=>{
    activeGameId=nextId;
    syncStage(nextGame);
    stage.classList.remove("is-leaving-crush","is-leaving-explode","is-leaving-glitch","is-leaving-shatter");
    stamp.textContent="WELCOME TO "+nextGame.title;
    overlay.className="transition-overlay effect-"+(GAME_TRANSITIONS[nextId]||"crush")+" is-active";
    window.setTimeout(()=>{
      overlay.classList.remove("is-active");
      overlay.setAttribute("aria-hidden","true");
      transitionBusy=false;
    },reducedMotion?80:420);
  },duration);
}

loadData();