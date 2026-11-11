// Pilot book content — « Le Baobab aux Mille Secrets »
// Source of truth for seed. Narrative text is original fiction inspired by
// West-African savanna oral storytelling (see docs/editorial-catalog.md).
// Age bands adjust register only — the beats never change.

export const PILOT_SLUG = "le-baobab-aux-mille-secrets";

export const pilotPagePlan = [
  { no: 1, kind: "cover", title: "Le Baobab aux Mille Secrets" },
  { no: 2, kind: "story", beat: "opening" },
  { no: 3, kind: "story", beat: "decision" },
  { no: 4, kind: "story", beat: "crossing" },
  { no: 5, kind: "story", beat: "companion" },
  { no: 6, kind: "story", beat: "arrival" },
  { no: 7, kind: "story", beat: "secret_listening" },
  { no: 8, kind: "story", beat: "secret_roots" },
  { no: 9, kind: "story", beat: "secret_community" },
  { no: 10, kind: "story", beat: "return" },
  { no: 11, kind: "story", beat: "moral" },
  { no: 12, kind: "back", title: "Fin" },
] as const;

interface BandTexts {
  "3-5": string;
  "6-8": string;
  "9-12": string;
}

interface StoryPageSpec {
  no: number;
  kind: "story";
  beat: string;
  illustrationHint: string;
  text: BandTexts;
  moralVariants?: Record<string, BandTexts>;
}

const T = (a: string, b: string, c: string): BandTexts => ({ "3-5": a, "6-8": b, "9-12": c });

const storyPages: StoryPageSpec[] = [
  {
    no: 2,
    kind: "story",
    beat: "opening",
    illustrationHint: "Village au crépuscule, silhouettes de cases et de personnes",
    text: T(
      "Le soir, le village s'endort. « Le baobab sait tout, dit la vieille Nabè. Mais il faut savoir écouter. »",
      "Quand le soleil descend derrière les collines, le village s'endort lentement. « Le baobab connaît tous les secrets du vent, murmure Nabè la conteuse. Mais il faut savoir écouter. »",
      "Au crépuscule, quand la savane s'étire sous un ciel de cendres chaudes, le village s'endort. « Le baobab garde les secrets du vent depuis plus de mille ans, dit Nabè, la gardienne des contes. Mais les secrets ne se prennent pas : ils s'écoutent. »",
    ),
  },
  {
    no: 3,
    kind: "story",
    beat: "decision",
    illustrationHint: "L'enfant regarde l'horizon depuis la case, baobab lointain à droite",
    text: T(
      "{{hero}} veut connaître les secrets. « Je vais voir le baobab ! » dit {{hero}}. « Attends la lune, répond Nabè. La nuit, le vent parle plus bas. »",
      "{{hero}} ne pense qu'à une chose : le baobab. « Je veux entendre ses secrets ! » « Patiente jusqu'à la lune, dit Nabè. Dans la nuit, le vent murmure plus bas — et les secrets sont plus proches de l'oreille. »",
      "Les secrets du baobab trottent dans la tête de {{hero}} depuis des jours. « Je veux les connaître, Nabè. Tous. » « Alors va à lui quand la lune sera haute, répond la conteuse. Dans la nuit, le vent parle tout bas — et ce qu'il dit ne s'entend qu'à ceux qui se taisent. »",
    ),
  },
  {
    no: 4,
    kind: "story",
    beat: "crossing",
    illustrationHint: "Traversée de la savane à la lune, hautes herbes, baobab au loin",
    text: T(
      "{{hero}} marche dans la grande herbe. « Chut ! » dit {{companion}}. « Écoute le vent ! » Le vent murmure : « Doucement… doucement… »",
      "Sous la lune, {{hero}} franchit la savane. Les herbes hautes chuchotent sur son passage. « Chut ! » souffle {{companion}}. « Écoute le vent — il parle tout bas ce soir. » Et le vent dit : « Doucement… doucement… les secrets aiment la patience. »",
      "La lune trace un chemin argenté sur la savane. {{hero}} avance entre les herbes hautes qui bruissent comme des pages de livre. « Chut… » souffle {{companion}}. « Écoute le vent. » Le vent murmure entre les feuilles : « Doucement, doucement… ce qui est grand se dit tout bas. »",
    ),
  },
  {
    no: 5,
    kind: "story",
    beat: "companion",
    illustrationHint: "L'enfant et un petit oiseau posés sur une branche, baobab en arrière-plan",
    text: T(
      "{{companion}} vole devant, comme une petite lanterne. « Par ici ! » dit {{companion}}. « Le baobab est juste là ! »",
      "Soudain, {{companion}} se pose sur une branche et ouvre les ailes. « Je connais le chemin, dit {{companion}}. Les oiseaux voient les secrets de loin. » « Alors guide-moi ! » répond {{hero}}.",
      "{{companion}} se pose sur la plus haute branche et déploie ses ailes. « Les oiseaux ont vu le baobab avant toi, dit {{companion}}. Nous voyons les secrets de loin — viens, je te montre le chemin que les ancêtres ont pris. » « Alors guide-moi, {{companion}} », dit {{hero}} en souriant.",
    ),
  },
  {
    no: 6,
    kind: "story",
    beat: "arrival",
    illustrationHint: "Le grand baobab sous la lune, petit personnage à son pied",
    text: T(
      "Le baobab est là ! Grand comme une montagne. « Je suis le gardien des mots, dit le baobab. Que veux-tu savoir ? »",
      "Devant eux, le baobab dresse son tronc immense vers la lune. « Je suis le gardien des mots, dit le baobab en ébranlant ses feuilles. Que veux-tu savoir ? »",
      "Le baobab se dresse, immense, racines comme des colonnes, branches ouvertes comme des bras. « Je suis le gardien des mots du vent, dit l'arbre d'une voix qui ressemble au crépuscule. Que veux-tu savoir, petit voyageur ? »",
    ),
  },
  {
    no: 7,
    kind: "story",
    beat: "secret_listening",
    illustrationHint: "L'enfant assis dos au tronc, feuilles et vent en mouvement",
    text: T(
      "« Le premier secret, dit le baobab, c'est l'écoute. » {{hero}} ferme les yeux. Le vent murmure : « Écoute… écoute… ce qui est dit n'est pas tout ; ce qui est entendu est tout. »",
      "« Le premier secret, dit le baobab, c'est l'écoute. » {{hero}} s'assoit au pied du tronc et ferme les yeux. Le vent glisse entre les feuilles : « Écoute… écoute… ce qui est dit n'est jamais tout ; ce qui est entendu est tout. »",
      "« Le premier secret, dit le baobab en secouant doucement ses feuilles, c'est l'écoute. » {{hero}} s'assoit contre le tronc et ferme les yeux. Le vent descend le long des branches : « Écoute… écoute… les mots sont la moitié du message ; l'autre moitié habite dans le silence qui les entoure. »",
    ),
  },
  {
    no: 8,
    kind: "story",
    beat: "secret_roots",
    illustrationHint: "Racines du baobab visibles, terre, petites racines reliées",
    text: T(
      "« Le deuxième secret, ce sont les racines, dit le baobab. » {{hero}} voit que les racines relient tous les arbres. « Nous sommes une seule famille. »",
      "« Le deuxième secret, ce sont les racines, dit le baobab. » {{hero}} s'accroupit et découvre que les racines du grand arbre courent sous la terre jusqu'aux racines des plus petits. « Nous sommes une seule famille, murmure le baobab. Aucun arbre ne pousse seul. »",
      "« Le deuxième secret, ce sont les racines, dit le baobab. » {{hero}} remarque que les racines du géant courent sous la terre et viennent toucher celles des acacias et des manguiers. « Nous sommes une seule famille, dit l'arbre. Aucun être ne pousse vraiment seul — tout est relié sous la terre comme au ciel. »",
    ),
  },
  {
    no: 9,
    kind: "story",
    beat: "secret_community",
    illustrationHint: "Sous le baobab, silhouettes du village rassemblé, feu doux",
    text: T(
      "« Le troisième secret ? C'est le village ! Sous moi, on se raconte les histoires. C'est ça, la vraie magie. »",
      "« Le troisième secret, dit le baobab, c'est le village. » Il montre les cases lointaines. « Sous mes branches, on se raconte les histoires depuis longtemps. C'est ça, la vraie magie : les mots qui voyagent de bouche en bouche. »",
      "« Le troisième secret, dit le baobab, c'est le village. » Du haut de son tronc, il montre les cases qui l'entourent. « Sous mes branches, les gens se sont raconté des histoires depuis des centaines d'années. C'est ça, la vraie magie : les mots qui voyagent de bouche en bouche et deviennent plus beaux à chaque fois. »",
    ),
  },
  {
    no: 10,
    kind: "story",
    beat: "return",
    illustrationHint: "L'enfant rentrant au village, raconte aux villageois sous le ciel",
    text: T(
      "{{hero}} rentre au village et raconte tout. « Et tu as tout gardé pour toi ? » demande Nabè. « Non ! dit {{hero}}. Je vais raconter à tout le monde ! »",
      "{{hero}} rentre au village et raconte tout, les yeux brillants. « Et tu as tout gardé pour toi ? » demande Nabè. « Non, Nabè ! dit {{hero}}. Les secrets sont faits pour être partagés — je vais les raconter à tout le monde ! »",
      "De retour au village, {{hero}} raconte tout, debout au milieu des villageois. « Et tu as tout gardé pour toi ? » demande Nabè, les yeux malins. « Non, Nabè ! Les secrets sont faits pour voyager — je vais les raconter à tout le monde, et le vent les portera plus loin encore ! »",
    ),
  },
  {
    no: 11,
    kind: "story",
    beat: "moral",
    illustrationHint: "Villageois regroupés sous le baobab au coucher du soleil, ambiance feu de camp",
    text: T(
      "Depuis ce jour, le vent du soir apporte des histoires. « Le plus grand secret, dit Nabè, c'est de savoir écouter — puis de savoir raconter. »",
      "Depuis ce jour, chaque soir, le vent du baobab apporte une histoire nouvelle. « Tu as compris, dit Nabè en riant. Le plus grand secret, c'est d'écouter — puis de raconter. »",
      "Depuis ce jour, chaque soir, le vent du baobab apporte une histoire nouvelle au village. « Tu as compris, dit Nabè en riant. Le plus grand des secrets, c'est d'écouter — puis de raconter à son tour. Un conte n'existe que s'il voyage. »",
    ),
    moralVariants: {
      ecoute: {
        "3-5": "Depuis ce jour, le vent du soir apporte des histoires. « Le plus grand secret, dit Nabè, c'est de savoir écouter — puis de savoir raconter. »",
        "6-8": "Depuis ce jour, chaque soir, le vent du baobab apporte une histoire nouvelle. « Tu as compris, dit Nabè en riant. Le plus grand secret, c'est d'écouter — puis de raconter. »",
        "9-12": "Depuis ce jour, chaque soir, le vent du baobab apporte une histoire nouvelle au village. « Tu as compris, dit Nabè en riant. Le plus grand des secrets, c'est d'écouter — puis de raconter à son tour. Un conte n'existe que s'il voyage. »",
      },
      partage: {
        "3-5": "Depuis ce jour, le vent du soir apporte des histoires. « Le plus grand secret, dit Nabè, c'est de tout partager — les mots, les bonbons, les sourires. »",
        "6-8": "Depuis ce jour, chaque soir, le vent du baobab apporte une histoire nouvelle. « Tu as compris, dit Nabè en riant. Le plus grand secret, c'est de partager — ce qu'on a entendu, on le donne aux autres. »",
        "9-12": "Depuis ce jour, chaque soir, le vent du baobab apporte une histoire nouvelle au village. « Tu as compris, dit Nabè en riant. Le plus grand des secrets, c'est de partager : un conte qui n'est pas raconté est un secret qui meurt ; un conte raconté devient un cadeau. »",
      },
      courage: {
        "3-5": "Depuis ce jour, le vent du soir apporte des histoires. « Le plus grand secret, dit Nabè, c'est d'être courageux — même quand la herbe est haute. »",
        "6-8": "Depuis ce jour, chaque soir, le vent du baobab apporte une histoire nouvelle. « Tu as compris, dit Nabè en riant. Le plus grand secret, c'est le courage : {{hero}} a eu peur, mais il est allé quand même. »",
        "9-12": "Depuis ce jour, chaque soir, le vent du baobab apporte une histoire nouvelle au village. « Tu as compris, dit Nabè en riant. Le plus grand des secrets, c'est le courage d'aller vers ce qu'on ne connaît pas — {{hero}} avait peur de la savane, et pourtant il est parti. »",
      },
    },
  },
];

// Cover and back pages have no flowing text but carry title/dedication slots.
export const coverPage = {
  no: 1,
  kind: "cover",
  title: "Le Baobab aux Mille Secrets",
  illustrationHint: "Baobab au crépuscule, grand ciel ocre, silhouette",
};

export const backPage = {
  no: 12,
  kind: "back",
  title: "Fin",
  illustrationHint: "Petit baobab sous les étoiles, nuit",
  text: {
    base: "Et le vent continue de souffler…\n\nPour {{hero}}, avec tout mon amour.",
  },
};

export const pilotNarrativeSchema = {
  pageCount: 12,
  pages: [
    coverPage,
    ...storyPages.map((p) => ({
      no: p.no,
      kind: p.kind,
      beat: p.beat,
      illustrationHint: p.illustrationHint,
      text: { bands: p.text },
      ...(p.moralVariants ? { moralVariants: p.moralVariants } : {}),
    })),
    backPage,
  ],
};

// Personalization schema consumed by the studio form (docs/editorial-catalog.md §4)
export const pilotPersonalizationSchema = {
  fields: [
    { key: "hero_name", type: "text", required: true, maxLength: 30, pattern: "^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$" },
    { key: "age_band", type: "enum", required: true, options: ["3-5", "6-8", "9-12"] },
    { key: "skin_tone", type: "enum", required: false, options: ["mat", "clair", "cuivré", "brun", "foncé", "noisette"] },
    { key: "hair", type: "text", required: false, maxLength: 60 },
    { key: "outfit", type: "enum", required: false, options: ["pagne wax", "chemise", "salopette", "robe"] },
    { key: "companion", type: "boolean", required: false, default: true },
    { key: "moral_emphasis", type: "enum", required: false, options: ["ecoute", "partage", "courage"], default: "ecoute" },
  ],
};

export const heroBibleTemplate = {
  role: "hero",
  description:
    "Jeune héros·ïne de la savane ouest-africaine, silhouette douce en aquarelle, " +
    "regard curieux vers le baobab, proportions enfant (tête ~1/3 du corps). " +
    "Teint {{skin_tone}}, cheveux {{hair}}, tenue {{outfit}}.",
  styleTokens: {
    medium: "hand-painted watercolor",
    palette: ["ochre", "sienna", "dusty teal", "bone"],
    line: "soft ink contour, minimal",
    texture: "paper grain",
    light: "warm late-afternoon sun",
  },
};

export const companionBible = {
  role: "companion",
  name: "Nzoma",
  description:
    "Petit martin-pêcheur, plumage teal et rouille, ailé guide de la savane. " +
    "Toujours posé sur une branche quand il parle.",
  styleTokens: {
    medium: "hand-painted watercolor",
    palette: ["dusty teal", "ochre", "bone"],
  },
};
