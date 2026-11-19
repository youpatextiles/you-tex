/* Youpa Textiles - ESPACE PROPRIÉTAIRE (version Supabase) */
const $ = id => document.getElementById(id);
let photosPretes = [];   // fichiers JPEG réduits, prêts à être envoyés

/* Réduit chaque photo (800 px max) pour économiser l'espace de stockage */
function reduire(fichier, max = 800){
  return new Promise((ok, ko) => {
    const url = URL.createObjectURL(fichier);
    const im = new Image();
    im.onerror = () => { URL.revokeObjectURL(url); ko(new Error("lecture")); };
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement("canvas");
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(b => b ? ok(b) : ko(new Error("conversion")), "image/jpeg", 0.78);
    };
    im.src = url;
  });
}
function message(txt, erreur){ const m = $("msg"); m.textContent = txt; m.style.color = erreur ? "#b80000" : "#13803c"; }
function el(tag, props, ...enf){ const e = document.createElement(tag); Object.assign(e, props || {}); enf.forEach(x => e.append(x)); return e; }

async function afficherEcran(){
  const ok = await Api.connecte();
  $("connexion").hidden = ok; $("panneau").hidden = !ok;
  if (ok) afficherListe();
}
async function afficherListe(){
  const liste = $("liste"); liste.replaceChildren();
  let arts = [];
  try { arts = await Api.articles(); }
  catch (err) { liste.append(el("p", {textContent: "Impossible de charger les articles."})); return; }
  if (!arts.length){ liste.append(el("p", {textContent: "Aucun article pour le moment."})); return; }
  arts.forEach(a => {
    const cat = CATEGORIES.find(c => c.id === a.cat);
    const vignette = a.photos && a.photos[0] ? el("img", {src: a.photos[0], alt: ""}) : el("div", {className: "sans"});
    const info = el("div", {className: "info"}, el("b", {textContent: a.nom}),
      el("span", {textContent: (cat ? cat.fr : a.cat) + " · " + a.prix + " · " + (a.photos ? a.photos.length : 0) + " photo(s)"}));
    const ep = el("button", {type: "button", textContent: a.epuise ? "Remettre en vente" : "Marquer épuisé"});
    ep.onclick = async () => {
      try { await Api.basculerEpuise(a.id); afficherListe(); } catch (err) { message("Action impossible.", true); }
    };
    const sup = el("button", {type: "button", className: "sup", textContent: "Supprimer"});
    sup.onclick = async () => {
      if (!confirm("Supprimer « " + a.nom + " » ?")) return;
      try { await Api.supprimer(a.id); afficherListe(); } catch (err) { message("Suppression impossible.", true); }
    };
    liste.append(el("div", {className: "ligne"}, vignette, info, ep, sup));
  });
}

$("f-connexion").addEventListener("submit", async e => {
  e.preventDefault();
  try { await Api.connexion($("email").value.trim(), $("mdp").value); $("mdp").value = ""; afficherEcran(); }
  catch (err) { alert(err.message); }
});
$("deco").onclick = async () => { await Api.deconnexion(); afficherEcran(); };
/* Œil : afficher ou masquer le mot de passe */
$("oeil").onclick = () => {
  const champ = $("mdp");
  const visible = champ.type === "password";
  champ.type = visible ? "text" : "password";
  $("oeil").textContent = visible ? "🙈" : "👁";
  $("oeil").setAttribute("aria-label", visible ? "Masquer le mot de passe" : "Afficher le mot de passe");
};
CATEGORIES.forEach(c => $("cat").append(el("option", {value: c.id, textContent: c.fr})));

$("fichiers").addEventListener("change", async e => {
  photosPretes = []; $("apercu").replaceChildren();
  message("Préparation des photos…");
  try {
    for (const f of e.target.files){
      const blob = await reduire(f);
      photosPretes.push(blob);
      $("apercu").append(el("img", {src: URL.createObjectURL(blob), alt: ""}));
    }
    message(photosPretes.length ? photosPretes.length + " photo(s) prête(s)." : "");
  } catch (err) { message("Une photo n’a pas pu être lue.", true); }
});

$("f-article").addEventListener("submit", async e => {
  e.preventDefault();
  const bouton = e.target.querySelector("button[type=submit]");
  bouton.disabled = true;
  message("Envoi en cours, patientez…");
  try {
    await Api.ajouter({cat: $("cat").value, nom: $("nom").value.trim(), prix: $("prix").value.trim(), photos: photosPretes});
    e.target.reset(); photosPretes = []; $("apercu").replaceChildren();
    message("Article enregistré et en ligne !");
    afficherListe();
  } catch (err) {
    message("Enregistrement impossible : " + (err.message || "erreur inconnue"), true);
  }
  bouton.disabled = false;
});

afficherEcran();