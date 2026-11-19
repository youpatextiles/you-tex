/* Youpa Textiles - ACCÈS AUX DONNÉES avec Supabase (remplace le mode démonstration) */
const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const Api = {
  /* Lecture : ouverte à tous les visiteurs */
  async articles() {
    const { data, error } = await _sb
      .from("articles")
      .select("id, categorie, nom, prix, epuise, photos_articles(url, ordre)")
      .order("cree_le", { ascending: false });
    if (error) throw error;
    return data.map(a => ({
      id: a.id,
      cat: a.categorie,
      nom: a.nom || ((CATEGORIES.find(c => c.id === a.categorie) || {}).fr || "Article"),
      prix: a.prix || "Prix à discuter",
      epuise: a.epuise,
      photos: (a.photos_articles || []).sort((x, y) => x.ordre - y.ordre).map(p => p.url)
    }));
  },

  /* Écriture : réservée à la propriétaire connectée */
  async ajouter({ cat, nom, prix, photos }) {   // photos = liste de fichiers JPEG
    const { data: art, error } = await _sb.from("articles")
      .insert({ categorie: cat, nom: nom || null, prix: prix || null }).select("id").single();
    if (error) throw error;
    for (let i = 0; i < photos.length; i++) {
      const chemin = art.id + "/" + Date.now() + "-" + i + ".jpg";
      const up = await _sb.storage.from("photos").upload(chemin, photos[i], { contentType: "image/jpeg" });
      if (up.error) throw up.error;
      const url = _sb.storage.from("photos").getPublicUrl(chemin).data.publicUrl;
      const ins = await _sb.from("photos_articles").insert({ article_id: art.id, url, ordre: i });
      if (ins.error) throw ins.error;
    }
  },

  async supprimer(id) {
    const { data: ph } = await _sb.from("photos_articles").select("url").eq("article_id", id);
    const chemins = (ph || []).map(p => decodeURIComponent(p.url.split("/photos/")[1]));
    if (chemins.length) await _sb.storage.from("photos").remove(chemins);
    const { error } = await _sb.from("articles").delete().eq("id", id);
    if (error) throw error;
  },

  async basculerEpuise(id) {
    const { data, error } = await _sb.from("articles").select("epuise").eq("id", id).single();
    if (error) throw error;
    const r = await _sb.from("articles").update({ epuise: !data.epuise }).eq("id", id);
    if (r.error) throw r.error;
  },

  /* Connexion de la propriétaire */
  async connexion(email, mdp) {
    const { error } = await _sb.auth.signInWithPassword({ email, password: mdp });
    if (error) throw new Error("E-mail ou mot de passe incorrect.");
  },
  async connecte() {
    const { data } = await _sb.auth.getSession();
    return !!data.session;
  },
  async deconnexion() { await _sb.auth.signOut(); }
};