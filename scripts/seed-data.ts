// scripts/seed-data.ts
// Standardised fragrance catalogue — ~85 top fragrances across 40+ brands.
// Rules: accords per fragrance sum to exactly 100 | Title Case note names | consistent brand slugs.
// Concentrations: Parfum | EDP | EDT | EDC
// Genders: masculine | feminine | unisex

export type Concentration = 'Parfum' | 'EDP' | 'EDT' | 'EDC'
export type Gender = 'masculine' | 'feminine' | 'unisex'

export interface SeedBrand {
  slug: string
  name: string
  country: string
}

export interface SeedAccord {
  name: string
  percentage: number
}

export interface SeedFragrance {
  slug: string
  name: string
  brand_slug: string
  description: string
  year: number
  concentration: Concentration
  gender: Gender
  top_notes: string[]
  heart_notes: string[]
  base_notes: string[]
  accords: SeedAccord[]
}

// Global note family map — used by seed script to populate the notes table.
// All note names that appear in any fragrance must have an entry here.
export const NOTE_FAMILIES: Record<string, string> = {
  // Citrus
  'Bergamot': 'citrus', 'Lemon': 'citrus', 'Orange': 'citrus', 'Grapefruit': 'citrus',
  'Mandarin': 'citrus', 'Lime': 'citrus', 'Yuzu': 'citrus', 'Blood Orange': 'citrus',
  'Petitgrain': 'citrus', 'Neroli': 'citrus', 'Orange Blossom': 'citrus',
  // Floral
  'Rose': 'floral', 'Jasmine': 'floral', 'Iris': 'floral', 'Violet': 'floral',
  'Lily of the Valley': 'floral', 'Peony': 'floral', 'Tuberose': 'floral',
  'Magnolia': 'floral', 'Ylang-Ylang': 'floral', 'Geranium': 'floral',
  'Narcissus': 'floral', 'Orchid': 'floral', 'Cherry Blossom': 'floral',
  'Freesia': 'floral', 'Heliotrope': 'floral', 'Peach Blossom': 'floral',
  'Lotus': 'floral', 'Gardenia': 'floral',
  // Woody
  'Sandalwood': 'woody', 'Cedarwood': 'woody', 'Oud': 'woody', 'Patchouli': 'woody',
  'Birch': 'woody', 'Oak Moss': 'woody', 'Guaiac Wood': 'woody', 'Agarwood': 'woody',
  'Cypress': 'woody', 'Pine': 'woody', 'Cashmeran': 'woody', 'Iso E Super': 'woody',
  'Blonde Wood': 'woody', 'Vetiver': 'woody',
  // Aquatic / Fresh
  'Sea Salt': 'aquatic', 'Aquatic Notes': 'aquatic', 'Marine Notes': 'aquatic',
  'Aldehydes': 'fresh', 'Cucumber': 'fresh',
  // Green
  'Violet Leaf': 'green', 'Fig': 'green', 'Green Tea': 'green', 'Basil': 'green',
  'Mint': 'green', 'Sage': 'green', 'Galbanum': 'green', 'Green Apple': 'green',
  // Spicy
  'Black Pepper': 'spicy', 'Cardamom': 'spicy', 'Cinnamon': 'spicy', 'Clove': 'spicy',
  'Ginger': 'spicy', 'Nutmeg': 'spicy', 'Pink Pepper': 'spicy', 'Saffron': 'spicy',
  'Star Anise': 'spicy', 'Cumin': 'spicy', 'Elemi': 'spicy',
  // Fruity
  'Apple': 'fruity', 'Pineapple': 'fruity', 'Blackcurrant': 'fruity', 'Peach': 'fruity',
  'Pear': 'fruity', 'Plum': 'fruity', 'Raspberry': 'fruity', 'Blackberry': 'fruity',
  'Strawberry': 'fruity', 'Melon': 'fruity', 'Lychee': 'fruity', 'Mango': 'fruity',
  'Red Berries': 'fruity', 'Quince': 'fruity',
  // Gourmand
  'Vanilla': 'gourmand', 'Chocolate': 'gourmand', 'Caramel': 'gourmand',
  'Coffee': 'gourmand', 'Tonka Bean': 'gourmand', 'Almond': 'gourmand',
  'Hazelnut': 'gourmand', 'Honey': 'gourmand', 'Praline': 'gourmand',
  'Sugar': 'gourmand', 'Licorice': 'gourmand',
  // Musky / Amber
  'Musk': 'musky', 'Ambergris': 'musky', 'White Musk': 'musky', 'Ambroxan': 'musky',
  'Cashmere': 'musky', 'Civet': 'musky',
  // Resinous / Balsamic
  'Amber': 'resinous', 'Benzoin': 'resinous', 'Labdanum': 'resinous', 'Myrrh': 'resinous',
  'Frankincense': 'resinous', 'Incense': 'resinous', 'Resin': 'resinous',
  'Styrax': 'resinous', 'Beeswax': 'resinous', 'Oakmoss': 'resinous',
  // Leathery
  'Leather': 'leathery', 'Suede': 'leathery', 'Birch Tar': 'leathery',
  // Herbs / Fougere
  'Lavender': 'fougere', 'Coumarin': 'fougere', 'Rosemary': 'fougere',
  'Thyme': 'fougere', 'Artemisia': 'fougere',
  // Tobacco / Smoky
  'Tobacco': 'smoky', 'Smoke': 'smoky', 'Birch Smoke': 'smoky',
}

export const BRANDS: SeedBrand[] = [
  { slug: 'creed',                     name: 'Creed',                     country: 'France'  },
  { slug: 'maison-francis-kurkdjian',  name: 'Maison Francis Kurkdjian',  country: 'France'  },
  { slug: 'tom-ford',                  name: 'Tom Ford',                  country: 'USA'     },
  { slug: 'dior',                      name: 'Dior',                      country: 'France'  },
  { slug: 'chanel',                    name: 'Chanel',                    country: 'France'  },
  { slug: 'yves-saint-laurent',        name: 'Yves Saint Laurent',        country: 'France'  },
  { slug: 'giorgio-armani',            name: 'Giorgio Armani',            country: 'Italy'   },
  { slug: 'paco-rabanne',              name: 'Paco Rabanne',              country: 'France'  },
  { slug: 'viktor-rolf',               name: 'Viktor & Rolf',             country: 'Netherlands' },
  { slug: 'jean-paul-gaultier',        name: 'Jean Paul Gaultier',        country: 'France'  },
  { slug: 'thierry-mugler',            name: 'Thierry Mugler',            country: 'France'  },
  { slug: 'versace',                   name: 'Versace',                   country: 'Italy'   },
  { slug: 'dolce-gabbana',             name: 'Dolce & Gabbana',           country: 'Italy'   },
  { slug: 'guerlain',                  name: 'Guerlain',                  country: 'France'  },
  { slug: 'lancome',                   name: 'Lancôme',                   country: 'France'  },
  { slug: 'jo-malone',                 name: 'Jo Malone London',          country: 'UK'      },
  { slug: 'byredo',                    name: 'Byredo',                    country: 'Sweden'  },
  { slug: 'le-labo',                   name: 'Le Labo',                   country: 'USA'     },
  { slug: 'diptyque',                  name: 'Diptyque',                  country: 'France'  },
  { slug: 'parfums-de-marly',          name: 'Parfums de Marly',          country: 'France'  },
  { slug: 'amouage',                   name: 'Amouage',                   country: 'Oman'    },
  { slug: 'mancera',                   name: 'Mancera',                   country: 'France'  },
  { slug: 'nishane',                   name: 'Nishane',                   country: 'Turkey'  },
  { slug: 'initio',                    name: 'Initio Parfums Privés',     country: 'France'  },
  { slug: 'kilian',                    name: 'Kilian Paris',              country: 'France'  },
  { slug: 'acqua-di-parma',            name: 'Acqua di Parma',            country: 'Italy'   },
  { slug: 'hermes',                    name: 'Hermès',                    country: 'France'  },
  { slug: 'narciso-rodriguez',         name: 'Narciso Rodriguez',         country: 'USA'     },
  { slug: 'carolina-herrera',          name: 'Carolina Herrera',          country: 'USA'     },
  { slug: 'marc-jacobs',               name: 'Marc Jacobs',               country: 'USA'     },
  { slug: 'burberry',                  name: 'Burberry',                  country: 'UK'      },
  { slug: 'hugo-boss',                 name: 'Hugo Boss',                 country: 'Germany' },
  { slug: 'davidoff',                  name: 'Davidoff',                  country: 'Switzerland' },
  { slug: 'montblanc',                 name: 'Montblanc',                 country: 'Germany' },
  { slug: 'frederic-malle',            name: 'Frédéric Malle',            country: 'France'  },
  { slug: 'xerjoff',                   name: 'Xerjoff',                   country: 'Italy'   },
  { slug: 'penhaligons',               name: "Penhaligon's",              country: 'UK'      },
  { slug: 'roja-dove',                 name: 'Roja Dove',                 country: 'UK'      },
  { slug: 'gucci',                     name: 'Gucci',                     country: 'Italy'   },
  { slug: 'bvlgari',                   name: 'Bvlgari',                   country: 'Italy'   },
  { slug: 'givenchy',                  name: 'Givenchy',                  country: 'France'  },
  { slug: 'chloe',                     name: 'Chloé',                     country: 'France'  },
  { slug: 'valentino',                 name: 'Valentino',                 country: 'Italy'   },
  { slug: 'montale',                   name: 'Montale',                   country: 'France'  },
  { slug: 'issey-miyake',              name: 'Issey Miyake',              country: 'Japan'   },
  { slug: 'ralph-lauren',              name: 'Ralph Lauren',              country: 'USA'     },
  { slug: 'calvin-klein',              name: 'Calvin Klein',              country: 'USA'     },
]

export const FRAGRANCES: SeedFragrance[] = [

  // ── CREED ────────────────────────────────────────────────────────────────────

  {
    slug: 'creed-aventus',
    name: 'Aventus',
    brand_slug: 'creed',
    description: 'A masterful woody-chypre inspired by Napoleon Bonaparte. Opens with a burst of pineapple and blackcurrant before settling into a smoky birch and musk base.',
    year: 2010, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Pineapple', 'Blackcurrant', 'Bergamot', 'Apple'],
    heart_notes: ['Birch', 'Rose', 'Jasmine', 'Patchouli'],
    base_notes:  ['Ambergris', 'Oak Moss', 'Vanilla', 'Musk'],
    accords: [{ name: 'Fruity', percentage: 30 }, { name: 'Citrus', percentage: 25 }, { name: 'Woody', percentage: 28 }, { name: 'Smoky', percentage: 17 }],
  },
  {
    slug: 'creed-green-irish-tweed',
    name: 'Green Irish Tweed',
    brand_slug: 'creed',
    description: 'A fresh fougère celebrating the Irish countryside. Often cited as the original inspiration for Cool Water.',
    year: 1985, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Violet Leaf', 'Lemon', 'Verbena'],
    heart_notes: ['Iris', 'Sandalwood'],
    base_notes:  ['Ambergris', 'Cashmere'],
    accords: [{ name: 'Green', percentage: 38 }, { name: 'Fresh', percentage: 30 }, { name: 'Woody', percentage: 22 }, { name: 'Floral', percentage: 10 }],
  },
  {
    slug: 'creed-silver-mountain-water',
    name: 'Silver Mountain Water',
    brand_slug: 'creed',
    description: 'Inspired by the pure meltwaters of Mont Blanc. A crisp, sparkling green tea and citrus fragrance with a metallic freshness.',
    year: 1995, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Bergamot', 'Mandarin', 'Grapefruit'],
    heart_notes: ['Green Tea', 'Blackcurrant'],
    base_notes:  ['Sandalwood', 'Musk', 'Cashmere'],
    accords: [{ name: 'Citrus', percentage: 35 }, { name: 'Green', percentage: 30 }, { name: 'Fresh', percentage: 22 }, { name: 'Woody', percentage: 13 }],
  },
  {
    slug: 'creed-viking',
    name: 'Viking',
    brand_slug: 'creed',
    description: 'Bold and adventurous, Viking blends spicy pink pepper with fresh lavender and a warm cedar base.',
    year: 2017, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Pink Pepper', 'Bergamot', 'Grapefruit'],
    heart_notes: ['Lavender', 'Rose', 'Geranium'],
    base_notes:  ['Cedarwood', 'Sandalwood', 'Vetiver', 'Musk'],
    accords: [{ name: 'Fresh', percentage: 32 }, { name: 'Spicy', percentage: 25 }, { name: 'Woody', percentage: 28 }, { name: 'Floral', percentage: 15 }],
  },
  {
    slug: 'creed-himalaya',
    name: 'Himalaya',
    brand_slug: 'creed',
    description: 'A clean, ozonic citrus fragrance evoking the peak of the Himalayas with a crisp sandalwood finish.',
    year: 2002, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Bergamot', 'Lemon', 'Grapefruit'],
    heart_notes: ['Iris', 'Jasmine', 'Neroli'],
    base_notes:  ['Sandalwood', 'Cedarwood', 'Ambroxan'],
    accords: [{ name: 'Citrus', percentage: 40 }, { name: 'Fresh', percentage: 28 }, { name: 'Floral', percentage: 17 }, { name: 'Woody', percentage: 15 }],
  },

  // ── MAISON FRANCIS KURKDJIAN ──────────────────────────────────────────────

  {
    slug: 'mfk-baccarat-rouge-540',
    name: 'Baccarat Rouge 540',
    brand_slug: 'maison-francis-kurkdjian',
    description: "Created for Baccarat crystal house's 250th anniversary. An ethereal amber-floral with Ambroxan and Cedar that leaves a luminous trail.",
    year: 2015, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Saffron', 'Jasmine'],
    heart_notes: ['Amberwood', 'Ambroxan'],
    base_notes:  ['Cedarwood', 'Musk'],
    accords: [{ name: 'Amber', percentage: 38 }, { name: 'Musky', percentage: 28 }, { name: 'Floral', percentage: 22 }, { name: 'Woody', percentage: 12 }],
  },
  {
    slug: 'mfk-grand-soir',
    name: 'Grand Soir',
    brand_slug: 'maison-francis-kurkdjian',
    description: 'A warmly sensual amber fragrance opening with a bright aldehydic burst, softening into a rich amber-vanilla heart.',
    year: 2016, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Aldehydes', 'Bergamot'],
    heart_notes: ['Iris', 'Jasmine', 'Rose'],
    base_notes:  ['Amber', 'Tonka Bean', 'Vanilla', 'Musk'],
    accords: [{ name: 'Amber', percentage: 45 }, { name: 'Floral', percentage: 22 }, { name: 'Gourmand', percentage: 20 }, { name: 'Musky', percentage: 13 }],
  },
  {
    slug: 'mfk-amyris-homme',
    name: 'Amyris Homme',
    brand_slug: 'maison-francis-kurkdjian',
    description: 'A sophisticated fougère built around sandalwood from Amyris and a fresh aromatic heart, for the effortlessly elegant man.',
    year: 2012, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Grapefruit', 'Cardamom', 'Basil'],
    heart_notes: ['Lavender', 'Iris', 'Geranium'],
    base_notes:  ['Sandalwood', 'Vetiver', 'Musk', 'Amber'],
    accords: [{ name: 'Woody', percentage: 35 }, { name: 'Fresh', percentage: 28 }, { name: 'Floral', percentage: 22 }, { name: 'Spicy', percentage: 15 }],
  },

  // ── TOM FORD ──────────────────────────────────────────────────────────────

  {
    slug: 'tom-ford-black-orchid',
    name: 'Black Orchid',
    brand_slug: 'tom-ford',
    description: 'A dark, luxuriant floral chypre. Black orchid and spices are wrapped in patchouli and sandalwood for a rich, sensual signature.',
    year: 2006, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Truffle', 'Bergamot', 'Blackcurrant', 'Citrus'],
    heart_notes: ['Orchid', 'Lotus', 'Tuberose', 'Ylang-Ylang'],
    base_notes:  ['Patchouli', 'Sandalwood', 'Amber', 'Vetiver', 'Vanilla'],
    accords: [{ name: 'Dark', percentage: 30 }, { name: 'Floral', percentage: 28 }, { name: 'Woody', percentage: 25 }, { name: 'Spicy', percentage: 17 }],
  },
  {
    slug: 'tom-ford-oud-wood',
    name: 'Oud Wood',
    brand_slug: 'tom-ford',
    description: 'A groundbreaking woody oriental that demystified oud for Western audiences. Rare oud harmonises with sandalwood, rosewood and cardamom.',
    year: 2007, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Cardamom', 'Rosewood', 'Chinese Pepper'],
    heart_notes: ['Oud', 'Sandalwood', 'Vetiver'],
    base_notes:  ['Tonka Bean', 'Amber', 'Musk'],
    accords: [{ name: 'Oud', percentage: 38 }, { name: 'Woody', percentage: 32 }, { name: 'Spicy', percentage: 18 }, { name: 'Amber', percentage: 12 }],
  },
  {
    slug: 'tom-ford-tobacco-vanille',
    name: 'Tobacco Vanille',
    brand_slug: 'tom-ford',
    description: 'The quintessential cosy gourmand. Tobacco leaf, tonka bean and vanilla create an addictively sweet and smoky warmth.',
    year: 2007, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Tobacco Leaf', 'Spices'],
    heart_notes: ['Tonka Bean', 'Tobacco Blossom', 'Jasmine'],
    base_notes:  ['Vanilla', 'Cacao', 'Sandalwood', 'Dried Fruits'],
    accords: [{ name: 'Gourmand', percentage: 42 }, { name: 'Smoky', percentage: 28 }, { name: 'Amber', percentage: 18 }, { name: 'Woody', percentage: 12 }],
  },
  {
    slug: 'tom-ford-noir-de-noir',
    name: 'Noir de Noir',
    brand_slug: 'tom-ford',
    description: 'A rich, velvety rose-oud composition suffused with dark earth, spice and truffle. The darkest rose in the Private Blend collection.',
    year: 2007, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Bergamot', 'Black Pepper', 'Saffron'],
    heart_notes: ['Rose', 'Truffle', 'Vanilla'],
    base_notes:  ['Oud', 'Patchouli', 'Sandalwood', 'Musk'],
    accords: [{ name: 'Floral', percentage: 30 }, { name: 'Dark', percentage: 28 }, { name: 'Woody', percentage: 25 }, { name: 'Spicy', percentage: 17 }],
  },
  {
    slug: 'tom-ford-lost-cherry',
    name: 'Lost Cherry',
    brand_slug: 'tom-ford',
    description: 'A hedonistic cherry gourmand dripping with almond and liqueur over a warm sandalwood and tonka bean base.',
    year: 2018, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Cherry', 'Black Cherry', 'Bitter Almond'],
    heart_notes: ['Turkish Rose', 'Jasmine Sambac', 'Clove'],
    base_notes:  ['Sandalwood', 'Tonka Bean', 'Vanilla', 'Peru Balsam'],
    accords: [{ name: 'Fruity', percentage: 38 }, { name: 'Gourmand', percentage: 30 }, { name: 'Floral', percentage: 18 }, { name: 'Woody', percentage: 14 }],
  },

  // ── DIOR ─────────────────────────────────────────────────────────────────

  {
    slug: 'dior-sauvage-edp',
    name: 'Sauvage',
    brand_slug: 'dior',
    description: 'A raw, noble Ambroxan-forward fresh fragrance inspired by wide open spaces. The EDP adds a lavender heart for depth and warmth.',
    year: 2018, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Bergamot', 'Mandarin'],
    heart_notes: ['Lavender', 'Sichuan Pepper', 'Pink Pepper'],
    base_notes:  ['Ambroxan', 'Cedarwood', 'Vetiver'],
    accords: [{ name: 'Fresh', percentage: 35 }, { name: 'Woody', percentage: 28 }, { name: 'Amber', percentage: 22 }, { name: 'Spicy', percentage: 15 }],
  },
  {
    slug: 'dior-miss-dior-edp',
    name: 'Miss Dior',
    brand_slug: 'dior',
    description: 'A bouquet of peonies, roses and grasse jasmine wrapped in white musks and a subtle patchouli. The modern feminine icon.',
    year: 2017, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Peony', 'Blood Orange', 'Rose'],
    heart_notes: ['Rose de Grasse', 'Jasmine Sambac', 'Peony'],
    base_notes:  ['Patchouli', 'White Musk', 'Cedarwood'],
    accords: [{ name: 'Floral', percentage: 48 }, { name: 'Fresh', percentage: 22 }, { name: 'Woody', percentage: 18 }, { name: 'Musky', percentage: 12 }],
  },
  {
    slug: 'dior-jadore-edp',
    name: "J'adore",
    brand_slug: 'dior',
    description: 'A luminous floral abstraction of femininity. Ylang-ylang, Damascus rose and sambac jasmine shimmer over a warm sandalwood base.',
    year: 1999, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Aldehydes', 'Mandarin', 'Magnolia'],
    heart_notes: ['Tuberose', 'Ylang-Ylang', 'Rose', 'Jasmine Sambac'],
    base_notes:  ['Sandalwood', 'Musk', 'Blackberry'],
    accords: [{ name: 'Floral', percentage: 55 }, { name: 'Fruity', percentage: 18 }, { name: 'Musky', percentage: 15 }, { name: 'Woody', percentage: 12 }],
  },
  {
    slug: 'dior-homme-intense',
    name: 'Dior Homme Intense',
    brand_slug: 'dior',
    description: 'An intense, powdery iris that blurs gender boundaries. Lavender, iris and cedarwood in a richly modern take on the classic barbershop.',
    year: 2011, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Lavender', 'Bergamot'],
    heart_notes: ['Iris', 'Rose'],
    base_notes:  ['Ambrette', 'Vetiver', 'Cedarwood', 'Vanilla'],
    accords: [{ name: 'Floral', percentage: 35 }, { name: 'Woody', percentage: 28 }, { name: 'Fresh', percentage: 22 }, { name: 'Gourmand', percentage: 15 }],
  },
  {
    slug: 'dior-fahrenheit',
    name: 'Fahrenheit',
    brand_slug: 'dior',
    description: 'A controversial masterpiece. Petrol-like aldehydes and violet leaf open this gasoline-warm leather chypre — one of the most distinctive fragrances ever made.',
    year: 1988, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Violet Leaf', 'Hawthorn', 'Bergamot', 'Mandarin'],
    heart_notes: ['Nutmeg', 'Jasmine', 'Lily of the Valley', 'Carnation'],
    base_notes:  ['Leather', 'Sandalwood', 'Cedarwood', 'Amber', 'Musk'],
    accords: [{ name: 'Woody', percentage: 30 }, { name: 'Leather', percentage: 28 }, { name: 'Green', percentage: 22 }, { name: 'Spicy', percentage: 20 }],
  },

  // ── CHANEL ────────────────────────────────────────────────────────────────

  {
    slug: 'chanel-no5-edp',
    name: 'No. 5',
    brand_slug: 'chanel',
    description: "The world's most famous fragrance. An aldehyic floral abstraction of May rose and jasmine, created by Ernest Beaux in 1921.",
    year: 1921, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Aldehydes', 'Neroli', 'Ylang-Ylang', 'Bergamot'],
    heart_notes: ['Rose', 'Jasmine', 'Lily of the Valley', 'Iris'],
    base_notes:  ['Sandalwood', 'Vanilla', 'Amber', 'Civet', 'Musk'],
    accords: [{ name: 'Floral', percentage: 45 }, { name: 'Powdery', percentage: 28 }, { name: 'Musky', percentage: 15 }, { name: 'Woody', percentage: 12 }],
  },
  {
    slug: 'chanel-coco-mademoiselle',
    name: 'Coco Mademoiselle',
    brand_slug: 'chanel',
    description: 'A dazzling oriental fresh fragrance for the independent, sensual woman. Bright citrus and patchouli in a modern classic.',
    year: 2001, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Orange', 'Grapefruit', 'Bergamot', 'Mandarin'],
    heart_notes: ['Rose', 'Jasmine', 'Mimosa'],
    base_notes:  ['Patchouli', 'Vetiver', 'Sandalwood', 'Vanilla', 'White Musk'],
    accords: [{ name: 'Citrus', percentage: 30 }, { name: 'Floral', percentage: 28 }, { name: 'Woody', percentage: 25 }, { name: 'Musky', percentage: 17 }],
  },
  {
    slug: 'chanel-bleu-de-chanel-edp',
    name: 'Bleu de Chanel',
    brand_slug: 'chanel',
    description: 'A sophisticated woody aromatic that bridges fresh and warm. A declaration of freedom for the man who defies categorisation.',
    year: 2010, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Citrus', 'Mint', 'Pink Pepper', 'Ginger'],
    heart_notes: ['Iso E Super', 'Jasmine', 'Nutmeg', 'Ginger'],
    base_notes:  ['Incense', 'Amber', 'Sandalwood', 'Cedarwood', 'Musk'],
    accords: [{ name: 'Woody', percentage: 35 }, { name: 'Fresh', percentage: 28 }, { name: 'Amber', percentage: 22 }, { name: 'Spicy', percentage: 15 }],
  },
  {
    slug: 'chanel-allure-homme-sport',
    name: 'Allure Homme Sport',
    brand_slug: 'chanel',
    description: 'An energetic, confident fresh fragrance. Mandarin, cedar and white musk project an easy, spirited masculinity.',
    year: 2004, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Aldehydes', 'Bergamot', 'Citrus'],
    heart_notes: ['Pepper', 'Lavender', 'Rosemary'],
    base_notes:  ['Cedarwood', 'Musk', 'Amber'],
    accords: [{ name: 'Fresh', percentage: 42 }, { name: 'Woody', percentage: 30 }, { name: 'Citrus', percentage: 18 }, { name: 'Spicy', percentage: 10 }],
  },
  {
    slug: 'chanel-chance-edp',
    name: 'Chance',
    brand_slug: 'chanel',
    description: 'A completely different take on chance — a fresh floral that subverts the traditional fragrance pyramid. Round, warm and vivid.',
    year: 2002, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Pink Pepper', 'Grapefruit'],
    heart_notes: ['Jasmine', 'Iris', 'Hyacinth'],
    base_notes:  ['Patchouli', 'Amber', 'White Musk', 'Vetiver'],
    accords: [{ name: 'Floral', percentage: 38 }, { name: 'Fresh', percentage: 28 }, { name: 'Woody', percentage: 22 }, { name: 'Spicy', percentage: 12 }],
  },

  // ── YVES SAINT LAURENT ───────────────────────────────────────────────────

  {
    slug: 'ysl-black-opium',
    name: 'Black Opium',
    brand_slug: 'yves-saint-laurent',
    description: 'An addictive gourmand floral with a coffee-vanilla heart. Dark, sensual and intoxicating — the rock-chic fragrance for bold women.',
    year: 2014, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Pink Pepper', 'Orange Blossom', 'Pear'],
    heart_notes: ['Coffee', 'Jasmine', 'Bitter Almond'],
    base_notes:  ['Patchouli', 'Vanilla', 'Cedarwood', 'Cashmeran'],
    accords: [{ name: 'Gourmand', percentage: 38 }, { name: 'Floral', percentage: 25 }, { name: 'Spicy', percentage: 20 }, { name: 'Woody', percentage: 17 }],
  },
  {
    slug: 'ysl-la-nuit-de-lhomme',
    name: "La Nuit de L'Homme",
    brand_slug: 'yves-saint-laurent',
    description: 'A seductive evening fragrance for men. Cardamom, vetiver and cedar unite in a sophisticatedly dark woody spice.',
    year: 2009, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Cardamom', 'Bergamot', 'Star Anise'],
    heart_notes: ['Lavender', 'Cedarwood'],
    base_notes:  ['Vetiver', 'Amber', 'Coumarin'],
    accords: [{ name: 'Spicy', percentage: 38 }, { name: 'Woody', percentage: 30 }, { name: 'Fresh', percentage: 20 }, { name: 'Amber', percentage: 12 }],
  },
  {
    slug: 'ysl-libre-edp',
    name: 'Libre',
    brand_slug: 'yves-saint-laurent',
    description: 'A duality of lavender and orange blossom, representing freedom through contradiction. The fragrance of radical femininity.',
    year: 2019, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Mandarin', 'Lavender', 'Petitgrain'],
    heart_notes: ['Orange Blossom', 'Jasmine', 'Lavender'],
    base_notes:  ['Vanilla', 'Amberwood', 'Musk', 'Cedarwood'],
    accords: [{ name: 'Floral', percentage: 35 }, { name: 'Fresh', percentage: 28 }, { name: 'Amber', percentage: 22 }, { name: 'Gourmand', percentage: 15 }],
  },
  {
    slug: 'ysl-mon-paris',
    name: 'Mon Paris',
    brand_slug: 'yves-saint-laurent',
    description: 'A whirlwind love story set in Paris. Raspberry and peony swirl around jasmine in a sweet, passionate floral chypre.',
    year: 2016, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Raspberry', 'Pear', 'Bergamot'],
    heart_notes: ['Peony', 'Rose', 'Jasmine'],
    base_notes:  ['Patchouli', 'Ambrette', 'White Musk'],
    accords: [{ name: 'Floral', percentage: 40 }, { name: 'Fruity', percentage: 30 }, { name: 'Musky', percentage: 18 }, { name: 'Woody', percentage: 12 }],
  },

  // ── GIORGIO ARMANI ────────────────────────────────────────────────────────

  {
    slug: 'armani-acqua-di-gio-profumo',
    name: 'Acqua di Giò Profumo',
    brand_slug: 'giorgio-armani',
    description: 'The darker, more profound version of Acqua di Giò. Marine freshness deepened by incense and patchouli into an almost meditative calm.',
    year: 2015, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Sea Notes', 'Bergamot', 'Geranium'],
    heart_notes: ['Incense', 'Sage', 'Rosemary'],
    base_notes:  ['Patchouli', 'Vetiver', 'Ambroxan'],
    accords: [{ name: 'Aquatic', percentage: 35 }, { name: 'Woody', percentage: 28 }, { name: 'Fresh', percentage: 22 }, { name: 'Spicy', percentage: 15 }],
  },
  {
    slug: 'armani-code',
    name: 'Armani Code',
    brand_slug: 'giorgio-armani',
    description: 'The code that seduces. Bergamot and anise open into a star anise and olive blossom heart, finishing with tobacco and leather.',
    year: 2004, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Bergamot', 'Lemon', 'Star Anise'],
    heart_notes: ['Olive Blossom', 'Sage'],
    base_notes:  ['Tobacco', 'Leather', 'Guaiac Wood', 'Tonka Bean'],
    accords: [{ name: 'Woody', percentage: 32 }, { name: 'Spicy', percentage: 28 }, { name: 'Amber', percentage: 25 }, { name: 'Citrus', percentage: 15 }],
  },
  {
    slug: 'armani-si',
    name: 'Sì',
    brand_slug: 'giorgio-armani',
    description: "A contemporary chypre celebrating the strength and freedom of today's woman. Blackcurrant nectar over rose and freesia, anchored in Chypre de Ciste.",
    year: 2013, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Blackcurrant Nectar', 'Mandarin'],
    heart_notes: ['Rose', 'Freesia', 'Neroli'],
    base_notes:  ['Patchouli', 'Ambroxan', 'Vanilla', 'Musk'],
    accords: [{ name: 'Floral', percentage: 35 }, { name: 'Fruity', percentage: 28 }, { name: 'Musky', percentage: 22 }, { name: 'Woody', percentage: 15 }],
  },

  // ── PACO RABANNE ─────────────────────────────────────────────────────────

  {
    slug: 'paco-rabanne-1-million',
    name: '1 Million',
    brand_slug: 'paco-rabanne',
    description: 'An opulent spicy-leathery fresh fragrance inspired by gold bars. Grapefruit and mint open a blood mandarin, cinnamon and leather accord.',
    year: 2008, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Grapefruit', 'Mint', 'Blood Mandarin'],
    heart_notes: ['Cinnamon', 'Spices', 'Rose'],
    base_notes:  ['Leather', 'Amber', 'Patchouli', 'Blond Wood'],
    accords: [{ name: 'Spicy', percentage: 35 }, { name: 'Citrus', percentage: 28 }, { name: 'Leather', percentage: 22 }, { name: 'Amber', percentage: 15 }],
  },
  {
    slug: 'paco-rabanne-invictus',
    name: 'Invictus',
    brand_slug: 'paco-rabanne',
    description: 'A victorious, aquatic fresh fragrance for the athletic champion. Grapefruit, marine accord and guaiac wood in a trophy-worthy bottle.',
    year: 2013, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Grapefruit', 'Marine Notes', 'Mandarin'],
    heart_notes: ['Jasmine', 'Bay Leaf', 'Hedione'],
    base_notes:  ['Guaiac Wood', 'Oakmoss', 'Ambergris'],
    accords: [{ name: 'Aquatic', percentage: 40 }, { name: 'Citrus', percentage: 30 }, { name: 'Woody', percentage: 20 }, { name: 'Fresh', percentage: 10 }],
  },
  {
    slug: 'paco-rabanne-olympea',
    name: 'Olympéa',
    brand_slug: 'paco-rabanne',
    description: 'A goddess fragrance for a woman who claims her power. Salted vanilla and fresh water lily in an intimate, sensual floral.',
    year: 2015, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Green Mandarin', 'Ginger'],
    heart_notes: ['Water Lily', 'Jasmine'],
    base_notes:  ['Vanilla', 'Ambergris', 'Sandalwood', 'Cashmere'],
    accords: [{ name: 'Gourmand', percentage: 35 }, { name: 'Floral', percentage: 28 }, { name: 'Aquatic', percentage: 22 }, { name: 'Musky', percentage: 15 }],
  },

  // ── VIKTOR & ROLF ────────────────────────────────────────────────────────

  {
    slug: 'viktor-rolf-flowerbomb',
    name: 'Flowerbomb',
    brand_slug: 'viktor-rolf',
    description: 'An explosion of flowers — a floral bomb of jasmine, freesia and cattleya orchid. Sweet, feminine and intensely present.',
    year: 2005, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Bergamot', 'Green Tea', 'Osmanthus'],
    heart_notes: ['Jasmine', 'Freesia', 'Rose', 'Orchid', 'Cattleya'],
    base_notes:  ['Patchouli', 'Musk', 'Amber', 'Vanilla'],
    accords: [{ name: 'Floral', percentage: 50 }, { name: 'Gourmand', percentage: 22 }, { name: 'Musky', percentage: 18 }, { name: 'Woody', percentage: 10 }],
  },
  {
    slug: 'viktor-rolf-spicebomb',
    name: 'Spicebomb',
    brand_slug: 'viktor-rolf',
    description: 'An explosive spicy fougère. Red chilli and saffron ignite a tobacco and leather heart in a grenade-shaped bottle.',
    year: 2012, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Pink Pepper', 'Bergamot', 'Grapefruit', 'Elemi'],
    heart_notes: ['Saffron', 'Cinnamon', 'Paprika'],
    base_notes:  ['Tobacco', 'Leather', 'Vetiver'],
    accords: [{ name: 'Spicy', percentage: 45 }, { name: 'Woody', percentage: 25 }, { name: 'Leather', percentage: 18 }, { name: 'Citrus', percentage: 12 }],
  },

  // ── JEAN PAUL GAULTIER ───────────────────────────────────────────────────

  {
    slug: 'jpgaultier-le-male',
    name: 'Le Mâle',
    brand_slug: 'jean-paul-gaultier',
    description: 'The iconic sailor fragrance. Lavender and mint freshen a warm mint-vanilla heart — a fougère that has never left the top ten.',
    year: 1995, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Mint', 'Bergamot', 'Cardamom'],
    heart_notes: ['Lavender', 'Cinnamon', 'Cumin'],
    base_notes:  ['Vanilla', 'Amber', 'Musk', 'Sandalwood'],
    accords: [{ name: 'Fresh', percentage: 32 }, { name: 'Spicy', percentage: 28 }, { name: 'Gourmand', percentage: 25 }, { name: 'Musky', percentage: 15 }],
  },
  {
    slug: 'jpgaultier-classique',
    name: 'Classique',
    brand_slug: 'jean-paul-gaultier',
    description: 'A sensual oriental floral with bergamot, rose and ginger, anchored in amber and vanilla. Housed in the legendary corset bottle.',
    year: 1993, concentration: 'EDT', gender: 'feminine',
    top_notes:   ['Bergamot', 'Mandarin', 'Ginger'],
    heart_notes: ['Rose', 'Iris', 'Orange Blossom'],
    base_notes:  ['Amber', 'Vanilla', 'Musk', 'Sandalwood'],
    accords: [{ name: 'Floral', percentage: 38 }, { name: 'Amber', percentage: 28 }, { name: 'Gourmand', percentage: 22 }, { name: 'Citrus', percentage: 12 }],
  },

  // ── THIERRY MUGLER ───────────────────────────────────────────────────────

  {
    slug: 'mugler-angel',
    name: 'Angel',
    brand_slug: 'thierry-mugler',
    description: 'The original gourmand fragrance. Cotton candy, patchouli and chocolate in a transgressive floral oriental that changed perfumery.',
    year: 1992, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Cassis', 'Melon', 'Mandarin'],
    heart_notes: ['Peony', 'Jasmine', 'Lily of the Valley'],
    base_notes:  ['Patchouli', 'Vanilla', 'Chocolate', 'Caramel', 'Honey', 'Musk'],
    accords: [{ name: 'Gourmand', percentage: 45 }, { name: 'Floral', percentage: 22 }, { name: 'Woody', percentage: 20 }, { name: 'Fruity', percentage: 13 }],
  },
  {
    slug: 'mugler-alien',
    name: 'Alien',
    brand_slug: 'thierry-mugler',
    description: 'A solar, mineral-amber wonder. White jasmine and cashmeran wood radiate an otherworldly warmth — mysterious and luminous.',
    year: 2005, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Calabrian Bergamot'],
    heart_notes: ['White Jasmine', 'Sambac Jasmine'],
    base_notes:  ['White Amber', 'Cashmeran'],
    accords: [{ name: 'Amber', percentage: 45 }, { name: 'Floral', percentage: 30 }, { name: 'Woody', percentage: 15 }, { name: 'Musky', percentage: 10 }],
  },

  // ── VERSACE ───────────────────────────────────────────────────────────────

  {
    slug: 'versace-eros',
    name: 'Eros',
    brand_slug: 'versace',
    description: 'Named after the Greek god of love. Fresh mint and vanilla in a dynamic, bold fougère — unapologetically masculine.',
    year: 2012, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Mint', 'Green Apple', 'Lemon'],
    heart_notes: ['Tonka Bean', 'Ambroxan', 'Geranium'],
    base_notes:  ['Vanilla', 'Vetiver', 'Oakmoss', 'Cedarwood'],
    accords: [{ name: 'Fresh', percentage: 35 }, { name: 'Gourmand', percentage: 28 }, { name: 'Woody', percentage: 22 }, { name: 'Green', percentage: 15 }],
  },
  {
    slug: 'versace-dylan-blue',
    name: 'Dylan Blue',
    brand_slug: 'versace',
    description: 'A modern aquatic fougère with bergamot, grapefruit and papyrus — self-confident, powerful and Mediterranean.',
    year: 2016, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Grapefruit', 'Bergamot', 'Aquatic Notes', 'Fig Leaf'],
    heart_notes: ['Violet Leaf', 'Ambroxan', 'Papyrus'],
    base_notes:  ['Patchouli', 'Musk', 'Mineral Notes'],
    accords: [{ name: 'Aquatic', percentage: 38 }, { name: 'Fresh', percentage: 30 }, { name: 'Woody', percentage: 22 }, { name: 'Citrus', percentage: 10 }],
  },

  // ── DOLCE & GABBANA ───────────────────────────────────────────────────────

  {
    slug: 'dg-light-blue',
    name: 'Light Blue',
    brand_slug: 'dolce-gabbana',
    description: 'The joy of a Sicilian summer. Lemon zest, green apple and bamboo open a warm, sensual feminine fragrance by Olivier Cresp.',
    year: 2001, concentration: 'EDT', gender: 'feminine',
    top_notes:   ['Lemon', 'Apple', 'Cedar'],
    heart_notes: ['Bamboo', 'White Rose', 'Jasmine'],
    base_notes:  ['Cedarwood', 'Musk', 'Amber'],
    accords: [{ name: 'Citrus', percentage: 38 }, { name: 'Fresh', percentage: 30 }, { name: 'Floral', percentage: 20 }, { name: 'Woody', percentage: 12 }],
  },
  {
    slug: 'dg-the-one',
    name: 'The One',
    brand_slug: 'dolce-gabbana',
    description: 'Warm, sophisticated and charismatic. A spicy-oriental blend of grapefruit, coriander and ginger over a rich tobacco and amber base.',
    year: 2008, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Grapefruit', 'Coriander', 'Basil'],
    heart_notes: ['Cardamom', 'Ginger', 'Orange Blossom'],
    base_notes:  ['Tobacco', 'Cedarwood', 'Amber', 'Musk'],
    accords: [{ name: 'Spicy', percentage: 35 }, { name: 'Woody', percentage: 28 }, { name: 'Amber', percentage: 25 }, { name: 'Citrus', percentage: 12 }],
  },

  // ── GUERLAIN ─────────────────────────────────────────────────────────────

  {
    slug: 'guerlain-la-petite-robe-noire',
    name: 'La Petite Robe Noire',
    brand_slug: 'guerlain',
    description: 'A fruity rose-cherry gourmand. Bergamot, blackcurrant and cherry swirl above rose and iris in a warm almond and musk base.',
    year: 2012, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Bergamot', 'Blackcurrant', 'Cherry'],
    heart_notes: ['Rose', 'Iris', 'Almond'],
    base_notes:  ['Musk', 'Cedarwood', 'Patchouli'],
    accords: [{ name: 'Fruity', percentage: 35 }, { name: 'Floral', percentage: 30 }, { name: 'Gourmand', percentage: 22 }, { name: 'Woody', percentage: 13 }],
  },
  {
    slug: 'guerlain-mon-guerlain',
    name: 'Mon Guerlain',
    brand_slug: 'guerlain',
    description: 'Lavender from Provence and vanilla from Tahiti — this romantic floral gourmand celebrates the essence of a free, playful femininity.',
    year: 2017, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Bergamot', 'Lavender'],
    heart_notes: ['Jasmine', 'Lavender'],
    base_notes:  ['Vanilla', 'Sandalwood', 'Musk'],
    accords: [{ name: 'Floral', percentage: 35 }, { name: 'Gourmand', percentage: 30 }, { name: 'Fresh', percentage: 22 }, { name: 'Woody', percentage: 13 }],
  },
  {
    slug: 'guerlain-shalimar',
    name: 'Shalimar',
    brand_slug: 'guerlain',
    description: 'The mythical oriental — a lush garden in India. Created by Jacques Guerlain in 1925, vanilla and iris in a classic oriental structure.',
    year: 1925, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Bergamot', 'Lemon', 'Mandarin'],
    heart_notes: ['Rose', 'Jasmine', 'Iris'],
    base_notes:  ['Vanilla', 'Civet', 'Tonka Bean', 'Incense', 'Vetiver'],
    accords: [{ name: 'Amber', percentage: 40 }, { name: 'Floral', percentage: 28 }, { name: 'Gourmand', percentage: 20 }, { name: 'Citrus', percentage: 12 }],
  },

  // ── LANCÔME ───────────────────────────────────────────────────────────────

  {
    slug: 'lancome-la-vie-est-belle',
    name: 'La Vie Est Belle',
    brand_slug: 'lancome',
    description: 'Life is beautiful — a radiant declaration. Iris, patchouli and praline unite in a joyful gourmand floral that became an instant classic.',
    year: 2012, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Blackcurrant', 'Pear', 'Grapefruit'],
    heart_notes: ['Iris', 'Jasmine', 'Orange Blossom'],
    base_notes:  ['Patchouli', 'Praline', 'Vanilla', 'Sandalwood', 'Musk'],
    accords: [{ name: 'Gourmand', percentage: 38 }, { name: 'Floral', percentage: 30 }, { name: 'Fruity', percentage: 18 }, { name: 'Woody', percentage: 14 }],
  },
  {
    slug: 'lancome-tresor',
    name: 'Trésor',
    brand_slug: 'lancome',
    description: 'A timeless love poem. Apricot rose and iris in a classic powdery rose structure, with a warm amber and musk base.',
    year: 1990, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Peach', 'Apricot', 'Rose'],
    heart_notes: ['Rose', 'Heliotrope', 'Iris', 'Lily'],
    base_notes:  ['Sandalwood', 'Amber', 'Musk', 'Vanilla'],
    accords: [{ name: 'Floral', percentage: 45 }, { name: 'Fruity', percentage: 25 }, { name: 'Musky', percentage: 18 }, { name: 'Woody', percentage: 12 }],
  },

  // ── JO MALONE ────────────────────────────────────────────────────────────

  {
    slug: 'jo-malone-peony-blush-suede',
    name: 'Peony & Blush Suede',
    brand_slug: 'jo-malone',
    description: 'A quintessentially British bouquet. Peony, red apple and Alexia rose rest on a bed of soft suede — beautifully feminine.',
    year: 2013, concentration: 'EDC', gender: 'feminine',
    top_notes:   ['Red Apple'],
    heart_notes: ['Peony', 'Rose', 'Jasmine'],
    base_notes:  ['Suede', 'Plum'],
    accords: [{ name: 'Floral', percentage: 50 }, { name: 'Fruity', percentage: 22 }, { name: 'Leather', percentage: 18 }, { name: 'Musky', percentage: 10 }],
  },
  {
    slug: 'jo-malone-wood-sage-sea-salt',
    name: 'Wood Sage & Sea Salt',
    brand_slug: 'jo-malone',
    description: 'The wild edge of a windswept clifftop. Sea salt and ambrette seeds are anchored by gritty driftwood and sage.',
    year: 2014, concentration: 'EDC', gender: 'unisex',
    top_notes:   ['Sea Salt', 'Ambrette Seeds'],
    heart_notes: ['Sage'],
    base_notes:  ['Driftwood', 'Musk'],
    accords: [{ name: 'Aquatic', percentage: 40 }, { name: 'Green', percentage: 30 }, { name: 'Woody', percentage: 20 }, { name: 'Musky', percentage: 10 }],
  },
  {
    slug: 'jo-malone-lime-basil-mandarin',
    name: 'Lime Basil & Mandarin',
    brand_slug: 'jo-malone',
    description: 'The signature Jo Malone scent. Zesty lime and peppery basil combine with white thyme in a bright, vibrant aromatic freshness.',
    year: 1999, concentration: 'EDC', gender: 'unisex',
    top_notes:   ['Lime', 'Mandarin'],
    heart_notes: ['Basil', 'Thyme'],
    base_notes:  ['White Musk', 'Patchouli', 'Amber'],
    accords: [{ name: 'Citrus', percentage: 42 }, { name: 'Green', percentage: 30 }, { name: 'Fresh', percentage: 18 }, { name: 'Musky', percentage: 10 }],
  },

  // ── BYREDO ────────────────────────────────────────────────────────────────

  {
    slug: 'byredo-gypsy-water',
    name: 'Gypsy Water',
    brand_slug: 'byredo',
    description: 'Inspired by gypsies living in the forests of Europe. Bergamot, pepper and juniper berries over sandalwood and vanilla.',
    year: 2008, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Bergamot', 'Lemon', 'Pepper', 'Juniper Berries'],
    heart_notes: ['Incense', 'Orris', 'Pine Needles'],
    base_notes:  ['Sandalwood', 'Vanilla', 'Amber'],
    accords: [{ name: 'Woody', percentage: 35 }, { name: 'Fresh', percentage: 28 }, { name: 'Amber', percentage: 22 }, { name: 'Spicy', percentage: 15 }],
  },
  {
    slug: 'byredo-bal-dafrique',
    name: "Bal d'Afrique",
    brand_slug: 'byredo',
    description: 'An homage to 1920s Paris as seen through an African lens. Bergamot, African violet and cyclamen over a warm cedar and musk base.',
    year: 2009, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Bergamot', 'Cyclamen', 'Lemon'],
    heart_notes: ['African Violet', 'Jasmine', 'Marigold'],
    base_notes:  ['Cedarwood', 'Musk', 'Blonde Wood', 'Vetiver'],
    accords: [{ name: 'Floral', percentage: 35 }, { name: 'Citrus', percentage: 28 }, { name: 'Woody', percentage: 25 }, { name: 'Musky', percentage: 12 }],
  },
  {
    slug: 'byredo-mojave-ghost',
    name: 'Mojave Ghost',
    brand_slug: 'byredo',
    description: 'A flower that blooms in the Mojave Desert, giving fragrance without photosynthesis. Magnolia, sandalwood and ambrette in an airy, spacious composition.',
    year: 2014, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Sapodilla', 'Ambrette'],
    heart_notes: ['Magnolia', 'Violet', 'Sandalwood'],
    base_notes:  ['Cedarwood', 'Musk', 'Amber'],
    accords: [{ name: 'Floral', percentage: 38 }, { name: 'Woody', percentage: 30 }, { name: 'Fresh', percentage: 20 }, { name: 'Musky', percentage: 12 }],
  },

  // ── LE LABO ───────────────────────────────────────────────────────────────

  {
    slug: 'le-labo-santal-33',
    name: 'Santal 33',
    brand_slug: 'le-labo',
    description: 'The cultural phenomenon. Cardamom, iris and violet over sandalwood, leather and cedar — the smell of New York cool.',
    year: 2011, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Cardamom', 'Iris', 'Violet'],
    heart_notes: ['Ambrox', 'Sandalwood'],
    base_notes:  ['Leather', 'Cedarwood', 'Musk'],
    accords: [{ name: 'Woody', percentage: 40 }, { name: 'Leather', percentage: 25 }, { name: 'Spicy', percentage: 20 }, { name: 'Floral', percentage: 15 }],
  },
  {
    slug: 'le-labo-rose-31',
    name: 'Rose 31',
    brand_slug: 'le-labo',
    description: 'A masculine take on rose. Cumin, cedar and musk strip the flower of its femininity, creating a rough, resinous, leather rose.',
    year: 2006, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Rose', 'Cumin'],
    heart_notes: ['Mastic', 'Guaiac Wood', 'Clove'],
    base_notes:  ['Cedarwood', 'Musk', 'Amber'],
    accords: [{ name: 'Floral', percentage: 32 }, { name: 'Woody', percentage: 30 }, { name: 'Spicy', percentage: 25 }, { name: 'Musky', percentage: 13 }],
  },
  {
    slug: 'le-labo-another-13',
    name: 'Another 13',
    brand_slug: 'le-labo',
    description: 'Created for AnOther Magazine. A transparent, almost abstract skin scent — ambroxan, musk and moss in a quietly addictive formula.',
    year: 2010, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Ambrette'],
    heart_notes: ['Jasmine', 'Ambrox'],
    base_notes:  ['Musk', 'Moss', 'Cedarwood'],
    accords: [{ name: 'Musky', percentage: 45 }, { name: 'Floral', percentage: 28 }, { name: 'Woody', percentage: 18 }, { name: 'Fresh', percentage: 9 }],
  },

  // ── DIPTYQUE ─────────────────────────────────────────────────────────────

  {
    slug: 'diptyque-philosykos',
    name: 'Philosykos',
    brand_slug: 'diptyque',
    description: 'The entirety of a fig tree — milky sap, leaves, wood and fruit — captured in a single fresh green fragrance.',
    year: 1996, concentration: 'EDT', gender: 'unisex',
    top_notes:   ['Fig Leaf', 'Leaf'],
    heart_notes: ['Fig', 'Fig Wood'],
    base_notes:  ['White Cedar', 'Musk'],
    accords: [{ name: 'Green', percentage: 45 }, { name: 'Woody', percentage: 30 }, { name: 'Fresh', percentage: 15 }, { name: 'Fruity', percentage: 10 }],
  },
  {
    slug: 'diptyque-tam-dao',
    name: 'Tam Dao',
    brand_slug: 'diptyque',
    description: 'An ode to Indian sandalwood. Sandalwood, cedar and cypress weave a meditative woody fragrance with a subtle floral softness.',
    year: 2003, concentration: 'EDT', gender: 'unisex',
    top_notes:   ['Cypress', 'Myrtle'],
    heart_notes: ['Sandalwood', 'White Rose', 'Lily of the Valley'],
    base_notes:  ['Cedarwood', 'Musk', 'Sandalwood'],
    accords: [{ name: 'Woody', percentage: 55 }, { name: 'Floral', percentage: 22 }, { name: 'Fresh', percentage: 13 }, { name: 'Musky', percentage: 10 }],
  },

  // ── PARFUMS DE MARLY ─────────────────────────────────────────────────────

  {
    slug: 'pdm-layton',
    name: 'Layton',
    brand_slug: 'parfums-de-marly',
    description: 'An opulent, apple-spiced lavender fragrance inspired by the elegance of 18th-century France. Refined, versatile and immensely well-received.',
    year: 2016, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Apple', 'Bergamot', 'Lavender'],
    heart_notes: ['Jasmine', 'Geranium', 'Violet'],
    base_notes:  ['Sandalwood', 'Vanilla', 'Pepper', 'Musk', 'Amber'],
    accords: [{ name: 'Floral', percentage: 30 }, { name: 'Fruity', percentage: 25 }, { name: 'Woody', percentage: 25 }, { name: 'Amber', percentage: 20 }],
  },
  {
    slug: 'pdm-pegasus',
    name: 'Pegasus',
    brand_slug: 'parfums-de-marly',
    description: 'Named after the winged stallion. A solar heliotrope-almond fragrance wrapped in sandalwood and vanilla — approachable yet distinguished.',
    year: 2011, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Bergamot', 'Lavender'],
    heart_notes: ['Jasmine', 'Heliotrope'],
    base_notes:  ['Sandalwood', 'Vanilla', 'Sugar', 'Almond'],
    accords: [{ name: 'Gourmand', percentage: 40 }, { name: 'Floral', percentage: 28 }, { name: 'Woody', percentage: 20 }, { name: 'Fresh', percentage: 12 }],
  },
  {
    slug: 'pdm-herod',
    name: 'Herod',
    brand_slug: 'parfums-de-marly',
    description: 'A tobacco and vanilla gourmand with pine and cypress creating a sophisticated, darkly sweet silhouette.',
    year: 2012, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Cinnamon', 'Pepper'],
    heart_notes: ['Tobacco', 'Cypress', 'Pine'],
    base_notes:  ['Vanilla', 'Amber', 'Vetiver'],
    accords: [{ name: 'Gourmand', percentage: 38 }, { name: 'Smoky', percentage: 28 }, { name: 'Woody', percentage: 22 }, { name: 'Spicy', percentage: 12 }],
  },

  // ── AMOUAGE ───────────────────────────────────────────────────────────────

  {
    slug: 'amouage-reflection-man',
    name: 'Reflection Man',
    brand_slug: 'amouage',
    description: 'A luminous floral aromatic. Neroli, ylang-ylang and vetiver in a sophisticated, pristine composition inspired by purity.',
    year: 2007, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Neroli', 'Bergamot', 'Rosemary'],
    heart_notes: ['Ylang-Ylang', 'Rose', 'Jasmine'],
    base_notes:  ['Sandalwood', 'Vetiver', 'Musk'],
    accords: [{ name: 'Floral', percentage: 40 }, { name: 'Fresh', percentage: 28 }, { name: 'Woody', percentage: 22 }, { name: 'Citrus', percentage: 10 }],
  },
  {
    slug: 'amouage-interlude-man',
    name: 'Interlude Man',
    brand_slug: 'amouage',
    description: 'An intense, smoky oriental. Bergamot and amber open into oud, frankincense and tobacco in a fragrance of unsettling depth.',
    year: 2012, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Bergamot', 'Oregano', 'Amber'],
    heart_notes: ['Rose', 'Labdanum', 'Cistus'],
    base_notes:  ['Oud', 'Sandalwood', 'Patchouli', 'Frankincense'],
    accords: [{ name: 'Resinous', percentage: 35 }, { name: 'Oud', percentage: 28 }, { name: 'Spicy', percentage: 22 }, { name: 'Floral', percentage: 15 }],
  },

  // ── MANCERA ───────────────────────────────────────────────────────────────

  {
    slug: 'mancera-cedrat-boise',
    name: 'Cedrat Boisé',
    brand_slug: 'mancera',
    description: 'The most popular Mancera by far. Citrus and bergamot over a refreshing cedar accord, with leather and vanilla depth.',
    year: 2011, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Bergamot', 'Lemon', 'Blackcurrant'],
    heart_notes: ['Rose', 'Patchouli', 'Jasmine'],
    base_notes:  ['Amber', 'Musk', 'Vanilla', 'Leather'],
    accords: [{ name: 'Citrus', percentage: 35 }, { name: 'Woody', percentage: 28 }, { name: 'Leather', percentage: 22 }, { name: 'Amber', percentage: 15 }],
  },
  {
    slug: 'mancera-roses-vanille',
    name: 'Roses Vanille',
    brand_slug: 'mancera',
    description: 'A lush, intoxicating rose soliflore sweetened with vanilla. Rich, feminine and unapologetically glamorous.',
    year: 2011, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Rose', 'Pear', 'Raspberry'],
    heart_notes: ['Rose', 'Jasmine', 'Peony'],
    base_notes:  ['Vanilla', 'Musk', 'Amber', 'Sandalwood'],
    accords: [{ name: 'Floral', percentage: 45 }, { name: 'Gourmand', percentage: 28 }, { name: 'Fruity', percentage: 17 }, { name: 'Musky', percentage: 10 }],
  },

  // ── NISHANE ───────────────────────────────────────────────────────────────

  {
    slug: 'nishane-hacivat',
    name: 'Hacivat',
    brand_slug: 'nishane',
    description: 'Inspired by the Turkish shadow-puppet character. Pineapple and bergamot launch this complex woody-spicy fragrance with a vetiver and oud finish.',
    year: 2016, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Pineapple', 'Bergamot', 'Pink Pepper'],
    heart_notes: ['Birch', 'Patchouli', 'Jasmine'],
    base_notes:  ['Oud', 'Vetiver', 'Musk', 'Ambergris'],
    accords: [{ name: 'Woody', percentage: 32 }, { name: 'Fruity', percentage: 25 }, { name: 'Spicy', percentage: 22 }, { name: 'Amber', percentage: 21 }],
  },
  {
    slug: 'nishane-ani',
    name: 'Ani',
    brand_slug: 'nishane',
    description: 'Named after the ancient Armenian city. A honeyed, floral-amber composition with magnolia and leather over a rich vanilla base.',
    year: 2019, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Bergamot', 'Mandarin', 'Cardamom'],
    heart_notes: ['Magnolia', 'Jasmine', 'Iris'],
    base_notes:  ['Vanilla', 'Leather', 'Oud', 'Amber'],
    accords: [{ name: 'Floral', percentage: 35 }, { name: 'Amber', percentage: 30 }, { name: 'Leather', percentage: 20 }, { name: 'Citrus', percentage: 15 }],
  },

  // ── INITIO ────────────────────────────────────────────────────────────────

  {
    slug: 'initio-oud-for-greatness',
    name: 'Oud for Greatness',
    brand_slug: 'initio',
    description: 'A hypnotic, aphrodisiac oud composition. Natural agarwood over saffron and musk — raw, powerful and utterly compelling.',
    year: 2018, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Nutmeg', 'Saffron'],
    heart_notes: ['Agarwood', 'Patchouli'],
    base_notes:  ['Musk', 'Ambergris'],
    accords: [{ name: 'Oud', percentage: 45 }, { name: 'Spicy', percentage: 28 }, { name: 'Amber', percentage: 17 }, { name: 'Musky', percentage: 10 }],
  },
  {
    slug: 'initio-absolute-aphrodisiac',
    name: 'Absolute Aphrodisiac',
    brand_slug: 'initio',
    description: 'Vanilla, rose and white musk in a skin-close aphrodisiac formula. Almost addictive, warm and deeply intimate.',
    year: 2016, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Pepper'],
    heart_notes: ['Rose', 'Jasmine', 'Coffee'],
    base_notes:  ['Vanilla', 'White Musk', 'Sandalwood', 'Amber'],
    accords: [{ name: 'Musky', percentage: 38 }, { name: 'Gourmand', percentage: 30 }, { name: 'Floral', percentage: 20 }, { name: 'Spicy', percentage: 12 }],
  },

  // ── KILIAN ────────────────────────────────────────────────────────────────

  {
    slug: 'kilian-black-phantom',
    name: 'Black Phantom',
    brand_slug: 'kilian',
    description: 'A Caribbean pirate story in a rum and coffee bottle. Dark rum, coffee and dark chocolate over bittersweet caramel and musk.',
    year: 2015, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Dark Rum', 'Bitter Almond', 'Caramel'],
    heart_notes: ['Coffee', 'Jasmine', 'Immortelle'],
    base_notes:  ['Sandalwood', 'Musk', 'Sugar Cane', 'Tonka Bean'],
    accords: [{ name: 'Gourmand', percentage: 50 }, { name: 'Floral', percentage: 20 }, { name: 'Woody', percentage: 18 }, { name: 'Amber', percentage: 12 }],
  },
  {
    slug: 'kilian-love-dont-be-shy',
    name: "Love, Don't Be Shy",
    brand_slug: 'kilian',
    description: 'A sweet, marshmallow-like neroli with orange blossom and musk. Inspired by the Jungle Book song — innocent, playful and addictive.',
    year: 2007, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Neroli', 'Bergamot', 'Grapefruit'],
    heart_notes: ['Jasmine', 'Orange Blossom', 'Honeysuckle'],
    base_notes:  ['Musk', 'Vanilla', 'Caramel', 'Marshmallow'],
    accords: [{ name: 'Gourmand', percentage: 42 }, { name: 'Floral', percentage: 30 }, { name: 'Citrus', percentage: 18 }, { name: 'Musky', percentage: 10 }],
  },

  // ── ACQUA DI PARMA ────────────────────────────────────────────────────────

  {
    slug: 'adp-colonia',
    name: 'Colonia',
    brand_slug: 'acqua-di-parma',
    description: 'The original Italian luxury fragrance. Created in 1916, this EDC is a bright, sunny cologne of citrus, lavender and rosemary — effortless Italian elegance.',
    year: 1916, concentration: 'EDC', gender: 'unisex',
    top_notes:   ['Bergamot', 'Lemon', 'Mandarin', 'Calabrian Orange'],
    heart_notes: ['Lavender', 'Rosemary', 'Verbena', 'Violet Leaf'],
    base_notes:  ['Sandalwood', 'Vetiver', 'Musk', 'Amber'],
    accords: [{ name: 'Citrus', percentage: 45 }, { name: 'Fresh', percentage: 30 }, { name: 'Woody', percentage: 15 }, { name: 'Floral', percentage: 10 }],
  },
  {
    slug: 'adp-magnolia-nobile',
    name: 'Magnolia Nobile',
    brand_slug: 'acqua-di-parma',
    description: 'An elegant magnolia soliflore with bergamot top notes and a warm musked base. The Italian garden in a bottle.',
    year: 2013, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Bergamot', 'Lemon'],
    heart_notes: ['Magnolia', 'Heliotrope', 'Jasmine', 'Peach'],
    base_notes:  ['Sandalwood', 'Musk', 'Amber'],
    accords: [{ name: 'Floral', percentage: 50 }, { name: 'Citrus', percentage: 22 }, { name: 'Fruity', percentage: 18 }, { name: 'Musky', percentage: 10 }],
  },

  // ── HERMÈS ────────────────────────────────────────────────────────────────

  {
    slug: 'hermes-terre-dhermes',
    name: "Terre d'Hermès",
    brand_slug: 'hermes',
    description: 'A dialogue between sky and earth. Flint mineral, orange and pepper over cedar and vetiver in one of the great modern woody fragances.',
    year: 2006, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Grapefruit', 'Orange'],
    heart_notes: ['Pepper', 'Pelargonium', 'Flint'],
    base_notes:  ['Vetiver', 'Cedarwood', 'Benzoin', 'Patchouli'],
    accords: [{ name: 'Woody', percentage: 38 }, { name: 'Citrus', percentage: 28 }, { name: 'Spicy', percentage: 22 }, { name: 'Resinous', percentage: 12 }],
  },
  {
    slug: 'hermes-un-jardin-sur-le-nil',
    name: 'Un Jardin sur le Nil',
    brand_slug: 'hermes',
    description: 'A stroll through the gardens on the Nile at Aswan. Green mango, lotus and blue water lily in a serene watery-green fragrance.',
    year: 2005, concentration: 'EDT', gender: 'unisex',
    top_notes:   ['Green Mango', 'Grapefruit'],
    heart_notes: ['Lotus', 'Sycamore', 'Peony'],
    base_notes:  ['Incense', 'Dry Wood'],
    accords: [{ name: 'Green', percentage: 40 }, { name: 'Aquatic', percentage: 28 }, { name: 'Fruity', percentage: 20 }, { name: 'Woody', percentage: 12 }],
  },
  {
    slug: 'hermes-twilly-dhermes',
    name: "Twilly d'Hermès",
    brand_slug: 'hermes',
    description: 'Inspired by the silk Twilly scarf. Ginger, tuberose and sandalwood in a playful, spirited floral with mischievous energy.',
    year: 2017, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Ginger', 'Rhubarb'],
    heart_notes: ['Tuberose', 'Jasmine', 'Iris'],
    base_notes:  ['Sandalwood', 'Musk'],
    accords: [{ name: 'Floral', percentage: 42 }, { name: 'Spicy', percentage: 25 }, { name: 'Woody', percentage: 22 }, { name: 'Fresh', percentage: 11 }],
  },

  // ── NARCISO RODRIGUEZ ─────────────────────────────────────────────────────

  {
    slug: 'narciso-rodriguez-for-her',
    name: 'For Her',
    brand_slug: 'narciso-rodriguez',
    description: 'A musky, sensual skin fragrance. Musk at the heart surrounded by rose and osmanthus in a minimalist structure that becomes a second skin.',
    year: 2003, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Peach', 'Bergamot'],
    heart_notes: ['Musk', 'Rose', 'Osmanthus'],
    base_notes:  ['Sandalwood', 'Amber', 'Vetiver'],
    accords: [{ name: 'Musky', percentage: 42 }, { name: 'Floral', percentage: 30 }, { name: 'Woody', percentage: 18 }, { name: 'Fruity', percentage: 10 }],
  },

  // ── CAROLINA HERRERA ─────────────────────────────────────────────────────

  {
    slug: 'carolina-herrera-good-girl',
    name: 'Good Girl',
    brand_slug: 'carolina-herrera',
    description: 'Good on top, bad underneath — a heel-shaped bottle housing a duality of jasmine and cocoa. Seductive, confident and addictive.',
    year: 2016, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Lemon', 'Almond'],
    heart_notes: ['Jasmine Sambac', 'Tuberose'],
    base_notes:  ['Tonka Bean', 'Cacao', 'Coffee', 'Sandalwood', 'Amber'],
    accords: [{ name: 'Gourmand', percentage: 40 }, { name: 'Floral', percentage: 30 }, { name: 'Woody', percentage: 18 }, { name: 'Amber', percentage: 12 }],
  },

  // ── MARC JACOBS ───────────────────────────────────────────────────────────

  {
    slug: 'marc-jacobs-daisy',
    name: 'Daisy',
    brand_slug: 'marc-jacobs',
    description: 'Young, fresh and effortlessly feminine. Strawberry, violet and jasmine in a bright sheer floral for everyday charm.',
    year: 2007, concentration: 'EDT', gender: 'feminine',
    top_notes:   ['Strawberry', 'Violet Leaf', 'Grapefruit'],
    heart_notes: ['Violet', 'Jasmine', 'Gardenia'],
    base_notes:  ['Musk', 'Vanilla', 'White Wood'],
    accords: [{ name: 'Floral', percentage: 45 }, { name: 'Fruity', percentage: 28 }, { name: 'Musky', percentage: 17 }, { name: 'Fresh', percentage: 10 }],
  },

  // ── BURBERRY ─────────────────────────────────────────────────────────────

  {
    slug: 'burberry-her',
    name: 'Her',
    brand_slug: 'burberry',
    description: 'An ode to London womanhood. Red berries, jasmine and ambroxan capture the vibrant femininity of the modern British city.',
    year: 2018, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Strawberry', 'Raspberry', 'Blackberry', 'Blueberry'],
    heart_notes: ['Jasmine', 'Violet'],
    base_notes:  ['Ambroxan', 'Musk', 'Amber'],
    accords: [{ name: 'Fruity', percentage: 42 }, { name: 'Floral', percentage: 28 }, { name: 'Musky', percentage: 20 }, { name: 'Amber', percentage: 10 }],
  },

  // ── HUGO BOSS ─────────────────────────────────────────────────────────────

  {
    slug: 'hugo-boss-bottled',
    name: 'Boss Bottled',
    brand_slug: 'hugo-boss',
    description: "One of the best-selling men's fragrances ever. Apple, cinnamon and vanilla — a reliable, versatile warm woody spice.",
    year: 1998, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Apple', 'Plum', 'Bergamot', 'Lemon'],
    heart_notes: ['Cinnamon', 'Mahogany', 'Cloves', 'Carnation'],
    base_notes:  ['Sandalwood', 'Vetiver', 'Musk', 'Vanilla', 'Cedarwood'],
    accords: [{ name: 'Woody', percentage: 32 }, { name: 'Spicy', percentage: 28 }, { name: 'Fruity', percentage: 22 }, { name: 'Amber', percentage: 18 }],
  },
  {
    slug: 'hugo-boss-the-scent',
    name: 'The Scent',
    brand_slug: 'hugo-boss',
    description: 'Inspired by natural aphrodisiacs. Grapefruit, ginger and maninka fruit over leather and vetiver — seductive and magnetic.',
    year: 2015, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Grapefruit', 'Maninka Fruit'],
    heart_notes: ['Ginger', 'Lavender'],
    base_notes:  ['Leather', 'Vetiver'],
    accords: [{ name: 'Spicy', percentage: 35 }, { name: 'Citrus', percentage: 28 }, { name: 'Leather', percentage: 22 }, { name: 'Woody', percentage: 15 }],
  },

  // ── DAVIDOFF ─────────────────────────────────────────────────────────────

  {
    slug: 'davidoff-cool-water',
    name: 'Cool Water',
    brand_slug: 'davidoff',
    description: 'The quintessential oceanic fragrance. Launched in 1988, this marine-lavender fougère defined a generation of fresh masculine fragrances.',
    year: 1988, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Aquatic Notes', 'Mint', 'Green Nuances'],
    heart_notes: ['Lavender', 'Jasmine', 'Coriander'],
    base_notes:  ['Sandalwood', 'Musk', 'Cedarwood', 'Amber'],
    accords: [{ name: 'Aquatic', percentage: 42 }, { name: 'Fresh', percentage: 30 }, { name: 'Woody', percentage: 18 }, { name: 'Floral', percentage: 10 }],
  },

  // ── MONTBLANC ─────────────────────────────────────────────────────────────

  {
    slug: 'montblanc-explorer',
    name: 'Explorer',
    brand_slug: 'montblanc',
    description: 'For the modern adventurer. Vetiver from Haiti and bergamot from Calabria over a patchouli base — grounded, confident and refined.',
    year: 2019, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Bergamot', 'Grapefruit'],
    heart_notes: ['Clary Sage', 'Hedione'],
    base_notes:  ['Haitian Vetiver', 'Patchouli', 'Akigalawood'],
    accords: [{ name: 'Woody', percentage: 40 }, { name: 'Fresh', percentage: 30 }, { name: 'Citrus', percentage: 18 }, { name: 'Spicy', percentage: 12 }],
  },
  {
    slug: 'montblanc-legend',
    name: 'Legend',
    brand_slug: 'montblanc',
    description: 'An iconic fresh aromatic for the man who forges his own legend. A clean, timeless fougère that punches well above its price point.',
    year: 2011, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Bergamot', 'Lavender', 'Pineapple'],
    heart_notes: ['Oakmoss', 'Geranium', 'Coumarin'],
    base_notes:  ['Sandalwood', 'Musk', 'Woody Notes'],
    accords: [{ name: 'Fresh', percentage: 38 }, { name: 'Woody', percentage: 28 }, { name: 'Floral', percentage: 22 }, { name: 'Fruity', percentage: 12 }],
  },

  // ── FRÉDÉRIC MALLE ────────────────────────────────────────────────────────

  {
    slug: 'frederic-malle-portrait-of-a-lady',
    name: 'Portrait of a Lady',
    brand_slug: 'frederic-malle',
    description: 'A stunning rose-patchouli composition by Dominique Ropion. Turkish rose and patchouli at enormous concentration — a masterpiece of modern perfumery.',
    year: 2010, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Raspberry', 'Blackcurrant'],
    heart_notes: ['Turkish Rose', 'Patchouli', 'Jasmine', 'Cloves'],
    base_notes:  ['Sandalwood', 'Musk', 'Benzoin'],
    accords: [{ name: 'Floral', percentage: 42 }, { name: 'Woody', percentage: 28 }, { name: 'Fruity', percentage: 18 }, { name: 'Spicy', percentage: 12 }],
  },

  // ── XERJOFF ───────────────────────────────────────────────────────────────

  {
    slug: 'xerjoff-naxos',
    name: 'Naxos',
    brand_slug: 'xerjoff',
    description: 'Italian la dolce vita in a bottle. Bergamot and lavender open a honey-tobacco accord over cedarwood and tonka bean.',
    year: 2016, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Bergamot', 'Lavender', 'Lemon'],
    heart_notes: ['Honey', 'Tobacco', 'Cinnamon'],
    base_notes:  ['Tonka Bean', 'Vanilla', 'Musk', 'Cedarwood'],
    accords: [{ name: 'Gourmand', percentage: 38 }, { name: 'Smoky', percentage: 25 }, { name: 'Floral', percentage: 22 }, { name: 'Citrus', percentage: 15 }],
  },

  // ── PENHALIGON'S ─────────────────────────────────────────────────────────

  {
    slug: 'penhaligons-halfeti',
    name: 'Halfeti',
    brand_slug: 'penhaligons',
    description: 'Inspired by Halfeti, the Turkish village of black roses. Dark rose, oud and amber in a mysterious, opulent oriental.',
    year: 2017, concentration: 'EDP', gender: 'unisex',
    top_notes:   ['Grapefruit', 'Pink Pepper', 'Cardamom'],
    heart_notes: ['Black Rose', 'Jasmine', 'Oud'],
    base_notes:  ['Amber', 'Musk', 'Guaiac Wood', 'Patchouli'],
    accords: [{ name: 'Floral', percentage: 35 }, { name: 'Oud', percentage: 25 }, { name: 'Amber', percentage: 25 }, { name: 'Spicy', percentage: 15 }],
  },

  // ── ROJA DOVE ─────────────────────────────────────────────────────────────

  {
    slug: 'roja-dove-elysium',
    name: 'Elysium',
    brand_slug: 'roja-dove',
    description: 'A refined, elevated fresh fragrance built on rare ingredients. Bergamot, cassis and grapefruit over a base of labdanum and musk.',
    year: 2017, concentration: 'Parfum', gender: 'masculine',
    top_notes:   ['Bergamot', 'Blackcurrant', 'Grapefruit'],
    heart_notes: ['Geranium', 'Jasmine', 'Rose'],
    base_notes:  ['Labdanum', 'Musk', 'Cedarwood', 'Tonka Bean'],
    accords: [{ name: 'Citrus', percentage: 35 }, { name: 'Floral', percentage: 28 }, { name: 'Musky', percentage: 22 }, { name: 'Woody', percentage: 15 }],
  },

  // ── GUCCI ─────────────────────────────────────────────────────────────────

  {
    slug: 'gucci-bloom',
    name: 'Bloom',
    brand_slug: 'gucci',
    description: 'A rich white floral — tuberose, jasmine and Rangoon creeper in a full, generous bloom. Flora femininity at its most opulent.',
    year: 2017, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Rangoon Creeper'],
    heart_notes: ['Tuberose', 'Jasmine'],
    base_notes:  ['Sandalwood', 'Musk'],
    accords: [{ name: 'Floral', percentage: 60 }, { name: 'Musky', percentage: 22 }, { name: 'Woody', percentage: 18 }],
  },
  {
    slug: 'gucci-guilty-pour-homme',
    name: 'Guilty Pour Homme',
    brand_slug: 'gucci',
    description: 'A fresh aromatic fragrance for the man who takes risks. Lemon, lavender and pink pepper over patchouli and cedarwood.',
    year: 2011, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Lemon', 'Lavender', 'Pink Pepper'],
    heart_notes: ['Orange Blossom', 'Neroli'],
    base_notes:  ['Patchouli', 'Cedarwood'],
    accords: [{ name: 'Fresh', percentage: 38 }, { name: 'Floral', percentage: 28 }, { name: 'Woody', percentage: 22 }, { name: 'Spicy', percentage: 12 }],
  },

  // ── BVLGARI ───────────────────────────────────────────────────────────────

  {
    slug: 'bvlgari-man-in-black',
    name: 'Man in Black',
    brand_slug: 'bvlgari',
    description: 'A bold, smoky oriental. Lava-inspired rum and spices over iris and leather, anchored in a volcanic guaiac wood base.',
    year: 2014, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Rum', 'Spices', 'Agarwood'],
    heart_notes: ['Iris', 'Tuberose', 'Leather'],
    base_notes:  ['Sandalwood', 'Guaiac Wood', 'Amber', 'Musk'],
    accords: [{ name: 'Amber', percentage: 35 }, { name: 'Woody', percentage: 28 }, { name: 'Spicy', percentage: 22 }, { name: 'Leather', percentage: 15 }],
  },

  // ── GIVENCHY ─────────────────────────────────────────────────────────────

  {
    slug: 'givenchy-linterdit',
    name: "L'Interdit",
    brand_slug: 'givenchy',
    description: 'A white floral forbidden accord inspired by Audrey Hepburn. Jasmine and tuberose over a dark patchouli and vetiver base.',
    year: 2018, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Pear', 'Orange', 'Blackcurrant'],
    heart_notes: ['Jasmine', 'Tuberose', 'White Flowers'],
    base_notes:  ['Patchouli', 'Vetiver', 'Amberwood', 'White Musk'],
    accords: [{ name: 'Floral', percentage: 42 }, { name: 'Woody', percentage: 28 }, { name: 'Fruity', percentage: 18 }, { name: 'Musky', percentage: 12 }],
  },
  {
    slug: 'givenchy-gentleman-boisee',
    name: 'Gentleman Boisée',
    brand_slug: 'givenchy',
    description: 'A cedar-iris composition reinterpreting classic barbershop masculinity through a contemporary woody lens.',
    year: 2021, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Bergamot', 'Pink Pepper'],
    heart_notes: ['Iris', 'Vetiver'],
    base_notes:  ['Cedarwood', 'Sandalwood', 'Amber'],
    accords: [{ name: 'Woody', percentage: 45 }, { name: 'Floral', percentage: 28 }, { name: 'Spicy', percentage: 17 }, { name: 'Amber', percentage: 10 }],
  },

  // ── CHLOÉ ────────────────────────────────────────────────────────────────

  {
    slug: 'chloe-eau-de-parfum',
    name: 'Chloé',
    brand_slug: 'chloe',
    description: 'A soft, romantic magnolia-peony fragrance. Magnolia, peony and rose rest on a warm cedar base — delicate, feminine and effortless.',
    year: 2008, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Peach', 'Litchi', 'Freesia'],
    heart_notes: ['Peony', 'Magnolia', 'Rose'],
    base_notes:  ['Cedarwood', 'Amber', 'Musk'],
    accords: [{ name: 'Floral', percentage: 50 }, { name: 'Fruity', percentage: 22 }, { name: 'Musky', percentage: 18 }, { name: 'Woody', percentage: 10 }],
  },

  // ── VALENTINO ─────────────────────────────────────────────────────────────

  {
    slug: 'valentino-born-in-roma',
    name: 'Voce Viva',
    brand_slug: 'valentino',
    description: 'A sparkling, joyful floral. Bergamot, orris and vanilla in a fragrance celebrating the vibrant, expressive voice of the modern woman.',
    year: 2021, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Bergamot', 'Grapefruit'],
    heart_notes: ['Orris', 'Jasmine', 'Iris'],
    base_notes:  ['Vanilla', 'Musk', 'Sandalwood'],
    accords: [{ name: 'Floral', percentage: 42 }, { name: 'Citrus', percentage: 25 }, { name: 'Gourmand', percentage: 20 }, { name: 'Woody', percentage: 13 }],
  },

  // ── MONTALE ───────────────────────────────────────────────────────────────

  {
    slug: 'montale-black-aoud',
    name: 'Black Aoud',
    brand_slug: 'montale',
    description: 'A daring oud-rose composition. Rose and patchouli surround a powerful oud note in a bold, uncompromising oriental.',
    year: 2006, concentration: 'EDP', gender: 'masculine',
    top_notes:   ['Rose'],
    heart_notes: ['Oud', 'Rose', 'Patchouli'],
    base_notes:  ['Musk', 'Sandalwood', 'Amber'],
    accords: [{ name: 'Oud', percentage: 40 }, { name: 'Floral', percentage: 30 }, { name: 'Woody', percentage: 18 }, { name: 'Amber', percentage: 12 }],
  },

  // ── ISSEY MIYAKE ─────────────────────────────────────────────────────────

  {
    slug: 'issey-miyake-leau-dissey-homme',
    name: "L'Eau d'Issey Pour Homme",
    brand_slug: 'issey-miyake',
    description: 'Water as a metaphor for freedom. Yuzu, sage and lotus in a minimalist aquatic that redefined the modern fresh fragrance genre.',
    year: 1994, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Yuzu', 'Mandarin', 'Lemon', 'Cyclamen'],
    heart_notes: ['Sage', 'Coriander', 'Water Lily', 'Lotus'],
    base_notes:  ['Sandalwood', 'Musk', 'Amber'],
    accords: [{ name: 'Aquatic', percentage: 38 }, { name: 'Citrus', percentage: 30 }, { name: 'Fresh', percentage: 20 }, { name: 'Woody', percentage: 12 }],
  },

  // ── RALPH LAUREN ─────────────────────────────────────────────────────────

  {
    slug: 'ralph-lauren-polo-blue',
    name: 'Polo Blue',
    brand_slug: 'ralph-lauren',
    description: 'Inspired by wide open American skies. Melon and cucumber over sage and violet — a clean, sporty aromatic for the active man.',
    year: 2003, concentration: 'EDT', gender: 'masculine',
    top_notes:   ['Melon', 'Cucumber', 'Suede'],
    heart_notes: ['Basil', 'Sage', 'Violet'],
    base_notes:  ['Suede', 'Vetiver', 'Musk', 'Sandalwood'],
    accords: [{ name: 'Fresh', percentage: 40 }, { name: 'Aquatic', percentage: 28 }, { name: 'Green', percentage: 20 }, { name: 'Woody', percentage: 12 }],
  },

  // ── CALVIN KLEIN ─────────────────────────────────────────────────────────

  {
    slug: 'ck-eternity',
    name: 'Eternity',
    brand_slug: 'calvin-klein',
    description: 'A clean, classic floral inspired by love that lasts. Fresh freesia and sage over a green muguet heart — enduring and American.',
    year: 1988, concentration: 'EDP', gender: 'feminine',
    top_notes:   ['Green Nuances', 'Mandarin', 'Sage', 'Freesia'],
    heart_notes: ['Lily of the Valley', 'Heliotrope', 'Rose', 'Violet'],
    base_notes:  ['Sandalwood', 'Amber', 'Musk', 'Patchouli'],
    accords: [{ name: 'Floral', percentage: 45 }, { name: 'Green', percentage: 25 }, { name: 'Musky', percentage: 18 }, { name: 'Woody', percentage: 12 }],
  },
]
