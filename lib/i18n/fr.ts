// French-first UI strings — docs/design-system.md §voice.
// Components consume t(); en.ts stub can mirror keys later.

export const fr = {
  brand: "Racontemoi",
  tagline: "Le conte que vous avez aimé, raconté avec votre enfant dedans.",

  nav: {
    catalog: "Histoires",
    account: "Mon atelier",
    login: "Se connecter",
    logout: "Se déconnecter",
    start: "Commencer un livre",
  },

  home: {
    eyebrow: "Ateliers de livres personnalisés",
    heroTitle: "Un conte africain, rien que pour votre enfant.",
    heroSub:
      "Choisissez une histoire, gravez-y votre enfant, illustrez chaque page et gardez le livre pour toujours.",
    ctaPrimary: "Créer mon premier livre",
    ctaSecondary: "Voir les histoires",
    collectionsTitle: "Les collections",
    pilotBadge: "Livre pilote",
    culturalNote:
      "Chaque histoire déclare ses sources : fait historique, inspiration culturelle ou fiction originale.",
    howTitle: "Comment ça marche",
    how1Title: "Choisissez l'histoire",
    how1Text: "Des contes éditorialisés, ancrés dans leurs cultures.",
    how2Title: "Personnalisez le héros",
    how2Text: "Un prénom, un âge, quelques traits — le conte s'adapte.",
    how3Title: "Relisez et illustrez",
    how3Text: "Vous approuvez chaque page avant qu'elle n'existe vraiment.",
    how4Title: "Lisez et gardez",
    how4Text: "Livre interactif, export PDF à offrir ou à relire.",
  },

  catalog: {
    title: "Les histoires",
    subtitle: "Une collection éditoriale, grandie livre après livre.",
    soon: "Bientôt",
    startBook: "Créer mon livre",
    backToCatalog: "Toutes les histoires",
  },

  story: {
    whatYouPersonalize: "Ce que vous personnalisez",
    sampleSpread: "Un aperçu",
    culturalContext: "Contexte culturel",
    inspirationNote: "Inspiration culturelle — fiction originale",
    synopsis: "L'histoire",
    cta: "Créer mon livre",
    pages: "12 pages",
  },

  auth: {
    loginTitle: "Bon retour dans l'atelier",
    loginSub: "Connectez-vous pour retrouver vos livres.",
    registerTitle: "Ouvrez votre atelier",
    registerSub: "Un compte, vos livres, rien de plus.",
    email: "Adresse e-mail",
    password: "Mot de passe",
    name: "Votre prénom",
    submitLogin: "Se connecter",
    submitRegister: "Créer mon compte",
    noAccount: "Pas encore de compte ?",
    hasAccount: "Déjà un compte ?",
    privacy:
      "Nous demandons le moins possible : un prénom suffit pour votre enfant.",
    errors: {
      invalid: "E-mail ou mot de passe incorrect.",
      emailTaken: "Un compte existe déjà avec cet e-mail.",
      generic: "Une erreur est survenue. Réessayez.",
    },
  },

  studio: {
    stepPersonalize: "Personnaliser",
    stepStory: "L'histoire",
    stepIllustrate: "Les illustrations",
    stepRead: "Lecture",
    heroTitle: "Votre enfant, héros du conte",
    heroName: "Prénom de l'enfant",
    ageBand: "Âge",
    age35: "3–5 ans",
    age68: "6–8 ans",
    age912: "9–12 ans",
    traitsTitle: "Quelques traits (facultatif)",
    skinTone: "Teint",
    hair: "Cheveux",
    outfit: "Tenue",
    companion: "Ajouter un compagnon de route",
    moral: "L'accent du conte",
    coverPreview: "Votre page de garde",
    writeStory: "Écrire l'histoire",
    writing: "L'écrivain travaille…",
    storyReady: "Votre histoire est prête",
    versionDeterministic: "Version atelier",
    versionAi: "Version IA",
    approveStory: "Approuver cette histoire",
    editPage: "Modifier",
    saveEdit: "Enregistrer",
    bibleTitle: "La fiche du héros",
    illustrate: "Illustrer le livre",
    illustrating: "L'illustrateur travaille…",
    pageDone: "Prête",
    regenerate: "Régénérer",
    approvePage: "Approuver",
    readBook: "Lire le livre",
    exportPdf: "Exporter en PDF",
    demoBadge: "Démo",
    liveBadge: "Génération réelle",
    costConfirmTitle: "Coût de génération",
    costConfirmBody:
      "Cette génération utilise l'IA réelle et peut entraîner des frais. Confirmez-vous ?",
    confirm: "Confirmer",
    cancel: "Annuler",
  },

  reader: {
    pageOf: "Page",
    close: "Fermer",
    prev: "Page précédente",
    next: "Page suivante",
    progress: "Progression",
    backToBook: "Retour au livre",
  },

  project: {
    title: "Votre livre",
    statusDraft: "Personnalisation à finir",
    statusNarrative: "Histoire en cours",
    statusIllustrating: "Illustrations en cours",
    statusReady: "Prêt à lire",
    statusExported: "Exporté",
    resume: "Reprendre",
    delete: "Supprimer",
    deleteConfirm:
      "Supprimer ce livre et toutes ses illustrations ? Cette action est définitive.",
    deleteYes: "Oui, supprimer",
    deleteNo: "Annuler",
    exports: "Exports PDF",
    download: "Télécharger",
  },

  account: {
    title: "Mon atelier",
    subtitle: "Vos livres en cours et terminés.",
    empty: "Aucun livre pour l'instant — le premier conte vous attend.",
    emptyCta: "Voir les histoires",
  },

  jobs: {
    pending: "En file d'attente",
    processing: "En cours",
    completed: "Terminé",
    failed: "Échec — réessayez",
    retry: "Réessayer",
  },

  footer: {
    line: "Racontemoi — des contes africains, faits avec soin.",
  },
} as const;

export type Strings = typeof fr;
export function t(key: string): string {
  const parts = key.split(".");
  let node: unknown = fr;
  for (const p of parts) {
    node = (node as Record<string, unknown>)?.[p];
    if (node === undefined) return key;
  }
  return String(node);
}
