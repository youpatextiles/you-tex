/* Youpa Textiles - COMPORTEMENT DU SITE PUBLIC : pages, catégories, articles, galerie de photos. */
const $ = id => document.getElementById(id);
let courante = CATEGORIES[0].id;
let ARTICLES = [];

function lienWA(msg){return "https://wa.me/"+NUMERO+"?text="+encodeURIComponent(msg);}
function creerEl(tag,props,...enfants){const e=document.createElement(tag);Object.assign(e,props||{});enfants.forEach(x=>e.append(x));return e;}

/* Galerie : une ou plusieurs photos, flèches, compteur et glissement du doigt */
function galerie(a){
  const ph=creerEl("div",{className:"photo"});
  const photos=a.photos||[];
  if(!photos.length){ph.textContent="Photo à venir";return ph;}
  const img=creerEl("img",{src:photos[0],alt:a.nom,loading:"lazy"});
  ph.append(img);
  if(photos.length>1){
    let i=0,x0=null;
    const cpt=creerEl("span",{className:"cpt",textContent:"1/"+photos.length});
    const aller=d=>{i=(i+d+photos.length)%photos.length;img.src=photos[i];cpt.textContent=(i+1)+"/"+photos.length;};
    const fleche=(txt,d,cls,label)=>{const b=creerEl("button",{type:"button",className:"fl "+cls,textContent:txt});b.setAttribute("aria-label",label);b.onclick=()=>aller(d);return b;};
    ph.addEventListener("touchstart",e=>{x0=e.touches[0].clientX;},{passive:true});
    ph.addEventListener("touchend",e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>40)aller(dx<0?1:-1);x0=null;});
    ph.append(fleche("‹",-1,"g","Photo précédente"),fleche("›",1,"d","Photo suivante"),cpt);
  }
  return ph;
}

function afficherCats(){
  const nav=$("cats");nav.replaceChildren();
  CATEGORIES.forEach(c=>{
    const b=creerEl("button",{type:"button",textContent:c.fr});
    b.setAttribute("aria-pressed",c.id===courante);
    b.onclick=()=>{courante=c.id;afficherCats();afficherArticles();};
    nav.append(b);
  });
}
function afficherArticles(){
  const c=CATEGORIES.find(x=>x.id===courante);
  $("titre").replaceChildren(c.fr,creerEl("span",{textContent:c.ha}));
  const g=$("grille");g.replaceChildren();
  const liste=ARTICLES.filter(a=>a.cat===courante);
  if(!liste.length){g.append(creerEl("p",{className:"vide",textContent:"Aucun article pour le moment. Revenez bientôt !"}));return;}
  liste.forEach(a=>{
    const ph=galerie(a);
    if(a.epuise)ph.append(creerEl("span",{className:"badge",textContent:"Épuisé"}));
    const bas=a.epuise
      ?creerEl("span",{className:"prix",textContent:"Article épuisé"})
      :creerEl("a",{href:lienWA("Bonjour, je suis intéressé(e) par : "+a.nom+(a.prix==="Prix à discuter"?". Pouvez-vous me donner le prix ?":"")),target:"_blank",rel:"noopener",textContent:"Commander sur WhatsApp"});
    g.append(creerEl("article",{className:"art"},ph,creerEl("div",{className:"art-b"},creerEl("b",{textContent:a.nom}),creerEl("span",{className:"prix",textContent:a.prix}),bas)));
  });
}
function montrer(vitrine){
  $("accueil").hidden=vitrine;$("vitrine").hidden=!vitrine;
  history.replaceState(null,"",vitrine?"#boutique":location.pathname);
  window.scrollTo(0,0);
}
async function demarrer(){
  $("continuer").onclick=()=>montrer(true);
  $("retour").onclick=()=>montrer(false);
  $("wa-haut").href=lienWA("Bonjour Youpa Textiles, j’aimerais avoir des informations.");
  try{ARTICLES=await Api.articles();}catch(e){ARTICLES=[];}
  afficherCats();afficherArticles();
  if(location.hash==="#boutique")montrer(true);
}
demarrer();
