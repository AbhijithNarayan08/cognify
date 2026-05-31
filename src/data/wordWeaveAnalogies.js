// src/data/wordWeaveAnalogies.js

export const WORD_WEAVE_ANALOGIES = [
  // ── LEVEL 1: Category Membership ("is a type of") ──────────────────────────
  {
    id: 'l1-01',
    level: 1,
    wordA: 'Dog',
    wordD: 'Plant',
    bridgeWord: 'Animal',
    relationship: 'category membership',
    distractors: ['Tree', 'Bark', 'Petal'],
    explanation: 'correct — both are types of organism categories (animal and plant)'
  },
  {
    id: 'l1-02',
    level: 1,
    wordA: 'Apple',
    wordD: 'Carrot',
    bridgeWord: 'Fruit',
    relationship: 'category membership',
    distractors: ['Vegetable', 'Sweet', 'Juice'],
    explanation: 'correct — both are agricultural classifications (fruit and vegetable)'
  },
  {
    id: 'l1-03',
    level: 1,
    wordA: 'Robin',
    wordD: 'Salmon',
    bridgeWord: 'Bird',
    relationship: 'category membership',
    distractors: ['Fish', 'Feather', 'Water'],
    explanation: 'correct — both are animal classifications (bird and fish)'
  },
  {
    id: 'l1-04',
    level: 1,
    wordA: 'Gold',
    wordD: 'Oak',
    bridgeWord: 'Metal',
    relationship: 'category membership',
    distractors: ['Tree', 'Shiny', 'Wood'],
    explanation: 'correct — both represent material classes (metal and tree)'
  },
  {
    id: 'l1-05',
    level: 1,
    wordA: 'Piano',
    wordD: 'Hammer',
    bridgeWord: 'Instrument',
    relationship: 'category membership',
    distractors: ['Tool', 'Music', 'Nail'],
    explanation: 'correct — both are object classifications (musical instrument and physical tool)'
  },
  {
    id: 'l1-06',
    level: 1,
    wordA: 'Shirt',
    wordD: 'Sofa',
    bridgeWord: 'Clothing',
    relationship: 'category membership',
    distractors: ['Furniture', 'Fabric', 'Living Room'],
    explanation: 'correct — shirt is a type of clothing; sofa is a type of furniture'
  },
  {
    id: 'l1-07',
    level: 1,
    wordA: 'France',
    wordD: 'Asia',
    bridgeWord: 'Country',
    relationship: 'category membership',
    distractors: ['Continent', 'Europe', 'Travel'],
    explanation: 'correct — France is a country; Asia is a continent'
  },
  {
    id: 'l1-08',
    level: 1,
    wordA: 'Football',
    wordD: 'Poker',
    bridgeWord: 'Sport',
    relationship: 'category membership',
    distractors: ['Game', 'Goal', 'Card'],
    explanation: 'correct — football is a sport; poker is a game'
  },
  {
    id: 'l1-09',
    level: 1,
    wordA: 'Pistol',
    wordD: 'Shield',
    bridgeWord: 'Weapon',
    relationship: 'category membership',
    distractors: ['Armor', 'Bullet', 'Defense'],
    explanation: 'correct — pistol is a weapon; shield is armor/defense'
  },
  {
    id: 'l1-10',
    level: 1,
    wordA: 'Physicist',
    wordD: 'Painter',
    bridgeWord: 'Scientist',
    relationship: 'category membership',
    distractors: ['Artist', 'Laboratory', 'Canvas'],
    explanation: 'correct — physicist is a scientist; painter is an artist'
  },
  {
    id: 'l1-11',
    level: 1,
    wordA: 'Python',
    wordD: 'Eagle',
    bridgeWord: 'Reptile',
    relationship: 'category membership',
    distractors: ['Raptor', 'Scale', 'Nest'],
    explanation: 'correct — python is a reptile; eagle is a raptor/bird'
  },
  {
    id: 'l1-12',
    level: 1,
    wordA: 'Chevrolet',
    wordD: 'Boeing',
    bridgeWord: 'Automobile',
    relationship: 'category membership',
    distractors: ['Aircraft', 'Engine', 'Cockpit'],
    explanation: 'correct — Chevrolet is an automobile; Boeing is an aircraft manufacturer'
  },
  {
    id: 'l1-13',
    level: 1,
    wordA: 'Mars',
    wordD: 'Milky Way',
    bridgeWord: 'Planet',
    relationship: 'category membership',
    distractors: ['Galaxy', 'Orbit', 'Star'],
    explanation: 'correct — Mars is a planet; Milky Way is a galaxy'
  },
  {
    id: 'l1-14',
    level: 1,
    wordA: 'Wheat',
    wordD: 'Basil',
    bridgeWord: 'Grain',
    relationship: 'category membership',
    distractors: ['Herb', 'Flour', 'Pesto'],
    explanation: 'correct — wheat is a grain; basil is an herb'
  },
  {
    id: 'l1-15',
    level: 1,
    wordA: 'Oven',
    wordD: 'Blender',
    bridgeWord: 'Appliance',
    relationship: 'category membership',
    distractors: ['Device', 'Bake', 'Smoothie'],
    explanation: 'correct — both are kitchen classifications (appliance and device)'
  },

  // ── LEVEL 2: Functional Relationship ("is used to") ───────────────────────
  {
    id: 'l2-01',
    level: 2,
    wordA: 'Pen',
    wordD: 'Knife',
    bridgeWord: 'Write',
    relationship: 'functional relationship',
    distractors: ['Cut', 'Ink', 'Blade'],
    explanation: 'correct — pen is used to write; knife is used to cut'
  },
  {
    id: 'l2-02',
    level: 2,
    wordA: 'Key',
    wordD: 'Scale',
    bridgeWord: 'Unlock',
    relationship: 'functional relationship',
    distractors: ['Weigh', 'Lock', 'Weight'],
    explanation: 'correct — key is used to unlock; scale is used to weigh'
  },
  {
    id: 'l2-03',
    level: 2,
    wordA: 'Anchor',
    wordD: 'Compass',
    bridgeWord: 'Secure',
    relationship: 'functional relationship',
    distractors: ['Navigate', 'Ship', 'North'],
    explanation: 'correct — anchor is used to secure; compass is used to navigate'
  },
  {
    id: 'l2-04',
    level: 2,
    wordA: 'Shield',
    wordD: 'Sword',
    bridgeWord: 'Defend',
    relationship: 'functional relationship',
    distractors: ['Attack', 'Armor', 'Blade'],
    explanation: 'correct — shield is used to defend; sword is used to attack'
  },
  {
    id: 'l2-05',
    level: 2,
    wordA: 'Oven',
    wordD: 'Freezer',
    bridgeWord: 'Bake',
    relationship: 'functional relationship',
    distractors: ['Freeze', 'Hot', 'Ice'],
    explanation: 'correct — oven is used to bake; freezer is used to freeze'
  },
  {
    id: 'l2-06',
    level: 2,
    wordA: 'Broom',
    wordD: 'Shovel',
    bridgeWord: 'Sweep',
    relationship: 'functional relationship',
    distractors: ['Dig', 'Dust', 'Dirt'],
    explanation: 'correct — broom is used to sweep; shovel is used to dig'
  },
  {
    id: 'l2-07',
    level: 2,
    wordA: 'Camera',
    wordD: 'Microphone',
    bridgeWord: 'Record',
    relationship: 'functional relationship',
    distractors: ['Amplify', 'Lens', 'Voice'],
    explanation: 'correct — camera is used to capture visual records; microphone to capture audio'
  },
  {
    id: 'l2-08',
    level: 2,
    wordA: 'Glue',
    wordD: 'Scissors',
    bridgeWord: 'Bond',
    relationship: 'functional relationship',
    distractors: ['Sever', 'Sticky', 'Blades'],
    explanation: 'correct — glue is used to bond; scissors are used to sever/cut'
  },
  {
    id: 'l2-09',
    level: 2,
    wordA: 'Goggles',
    wordD: 'Helmet',
    bridgeWord: 'Protect',
    relationship: 'functional relationship',
    distractors: ['Secure', 'Eyes', 'Head'],
    explanation: 'correct — goggles protect eyes; helmet protects head'
  },
  {
    id: 'l2-10',
    level: 2,
    wordA: 'Thermometer',
    wordD: 'Clock',
    bridgeWord: 'Measure',
    relationship: 'functional relationship',
    distractors: ['Track', 'Temp', 'Hour'],
    explanation: 'correct — thermometer measures temperature; clock tracks/measures time'
  },
  {
    id: 'l2-11',
    level: 2,
    wordA: 'Soap',
    wordD: 'Towel',
    bridgeWord: 'Cleanse',
    relationship: 'functional relationship',
    distractors: ['Dry', 'Wash', 'Bath'],
    explanation: 'correct — soap is used to cleanse; towel is used to dry'
  },
  {
    id: 'l2-12',
    level: 2,
    wordA: 'Net',
    wordD: 'Hook',
    bridgeWord: 'Catch',
    relationship: 'functional relationship',
    distractors: ['Snare', 'Fish', 'Bait'],
    explanation: 'correct — both net and hook are functional designs used to catch/snare fish'
  },
  {
    id: 'l2-13',
    level: 2,
    wordA: 'Screwdriver',
    wordD: 'Hammer',
    bridgeWord: 'Tighten',
    relationship: 'functional relationship',
    distractors: ['Drive', 'Screw', 'Nail'],
    explanation: 'correct — screwdriver is used to tighten screws; hammer is used to drive nails'
  },
  {
    id: 'l2-14',
    level: 2,
    wordA: 'Eraser',
    wordD: 'Pencil',
    bridgeWord: 'Remove',
    relationship: 'functional relationship',
    distractors: ['Create', 'Rubber', 'Graphite'],
    explanation: 'correct — eraser is used to remove markings; pencil is used to create them'
  },
  {
    id: 'l2-15',
    level: 2,
    wordA: 'Siren',
    wordD: 'Lantern',
    bridgeWord: 'Warn',
    relationship: 'functional relationship',
    distractors: ['Illuminate', 'Sound', 'Light'],
    explanation: 'correct — siren is used to warn; lantern is used to illuminate'
  },

  // ── LEVEL 3: Part-to-Whole ("is part of") ──────────────────────────────────
  {
    id: 'l3-01',
    level: 3,
    wordA: 'Finger',
    wordD: 'Petal',
    bridgeWord: 'Hand',
    relationship: 'part-to-whole',
    distractors: ['Flower', 'Grip', 'Pistil'],
    explanation: 'correct — finger is part of a hand; petal is part of a flower'
  },
  {
    id: 'l3-02',
    level: 3,
    wordA: 'Wheel',
    wordD: 'Sail',
    bridgeWord: 'Car',
    relationship: 'part-to-whole',
    distractors: ['Boat', 'Tire', 'Mast'],
    explanation: 'correct — wheel is part of a car; sail is part of a boat'
  },
  {
    id: 'l3-03',
    level: 3,
    wordA: 'Keyboard',
    wordD: 'Strings',
    bridgeWord: 'Computer',
    relationship: 'part-to-whole',
    distractors: ['Violin', 'Key', 'Bow'],
    explanation: 'correct — keyboard is part of a computer; strings are part of a violin'
  },
  {
    id: 'l3-04',
    level: 3,
    wordA: 'Page',
    wordD: 'Scene',
    bridgeWord: 'Book',
    relationship: 'part-to-whole',
    distractors: ['Play', 'Read', 'Actor'],
    explanation: 'correct — page is part of a book; scene is part of a play'
  },
  {
    id: 'l3-05',
    level: 3,
    wordA: 'Bricks',
    wordD: 'Fibers',
    bridgeWord: 'Wall',
    relationship: 'part-to-whole',
    distractors: ['Rope', 'Mortar', 'Thread'],
    explanation: 'correct — bricks are part of a wall; fibers are part of rope'
  },
  {
    id: 'l3-06',
    level: 3,
    wordA: 'Engine',
    wordD: 'CPU',
    bridgeWord: 'Vehicle',
    relationship: 'part-to-whole',
    distractors: ['Computer', 'Motor', 'Microchip'],
    explanation: 'correct — engine is part of a vehicle; CPU is part of a computer'
  },
  {
    id: 'l3-07',
    level: 3,
    wordA: 'Branch',
    wordD: 'Tributary',
    bridgeWord: 'Tree',
    relationship: 'part-to-whole',
    distractors: ['River', 'Leaf', 'Stream'],
    explanation: 'correct — branch is part of a tree; tributary is part of a river'
  },
  {
    id: 'l3-08',
    level: 3,
    wordA: 'Spark',
    wordD: 'Drop',
    bridgeWord: 'Flame',
    relationship: 'part-to-whole',
    distractors: ['Ocean', 'Fire', 'Water'],
    explanation: 'correct — spark initiates/constitutes flame; drop constitutes ocean'
  },
  {
    id: 'l3-09',
    level: 3,
    wordA: 'Sleeve',
    wordD: 'Collar',
    bridgeWord: 'Shirt',
    relationship: 'part-to-whole',
    distractors: ['Jacket', 'Cuff', 'Neck'],
    explanation: 'correct — sleeve and collar are both integral structural parts of a shirt'
  },
  {
    id: 'l3-10',
    level: 3,
    wordA: 'Stitch',
    wordD: 'Link',
    bridgeWord: 'Seam',
    relationship: 'part-to-whole',
    distractors: ['Chain', 'Thread', 'Metal'],
    explanation: 'correct — stitch constitutes a seam; link constitutes a chain'
  },
  {
    id: 'l3-11',
    level: 3,
    wordA: 'Feather',
    wordD: 'Scale',
    bridgeWord: 'Plumage',
    relationship: 'part-to-whole',
    distractors: ['Armor', 'Bird', 'Fish'],
    explanation: 'correct — feather is part of plumage; scale is part of reptilian armor'
  },
  {
    id: 'l3-12',
    level: 3,
    wordA: 'Pupil',
    wordD: 'Lobe',
    bridgeWord: 'Eye',
    relationship: 'part-to-whole',
    distractors: ['Ear', 'Sight', 'Hear'],
    explanation: 'correct — pupil is part of the eye; lobe is part of the ear'
  },
  {
    id: 'l3-13',
    level: 3,
    wordA: 'Citizen',
    wordD: 'Soldier',
    bridgeWord: 'Population',
    relationship: 'part-to-whole',
    distractors: ['Army', 'State', 'Combat'],
    explanation: 'correct — citizen is part of a population; soldier is part of an army'
  },
  {
    id: 'l3-14',
    level: 3,
    wordA: 'Verse',
    wordD: 'Movement',
    bridgeWord: 'Song',
    relationship: 'part-to-whole',
    distractors: ['Symphony', 'Lyric', 'Tempo'],
    explanation: 'correct — verse is part of a song; movement is part of a symphony'
  },
  {
    id: 'l3-15',
    level: 3,
    wordA: 'Window',
    wordD: 'Porthole',
    bridgeWord: 'House',
    relationship: 'part-to-whole',
    distractors: ['Ship', 'Glass', 'Cabin'],
    explanation: 'correct — window is part of a house; porthole is part of a ship'
  },

  // ── LEVEL 4: Antonymic / Synonymic ("opposites or equivalents") ───────────
  {
    id: 'l4-01',
    level: 4,
    wordA: 'Hot',
    wordD: 'Fast',
    bridgeWord: 'Cold',
    relationship: 'antonyms',
    distractors: ['Slow', 'Warm', 'Speed'],
    explanation: 'correct — hot is the opposite of cold; fast is the opposite of slow'
  },
  {
    id: 'l4-02',
    level: 4,
    wordA: 'Huge',
    wordD: 'Swift',
    bridgeWord: 'Tiny',
    relationship: 'antonyms',
    distractors: ['Sluggish', 'Small', 'Speedy'],
    explanation: 'correct — huge is the opposite of tiny; swift is the opposite of sluggish'
  },
  {
    id: 'l4-03',
    level: 4,
    wordA: 'Rich',
    wordD: 'Brave',
    bridgeWord: 'Poor',
    relationship: 'antonyms',
    distractors: ['Cowardly', 'Wealth', 'Fearless'],
    explanation: 'correct — rich is the opposite of poor; brave is the opposite of cowardly'
  },
  {
    id: 'l4-04',
    level: 4,
    wordA: 'True',
    wordD: 'Guilty',
    bridgeWord: 'False',
    relationship: 'antonyms',
    distractors: ['Innocent', 'Truth', 'Crime'],
    explanation: 'correct — true is the opposite of false; guilty is the opposite of innocent'
  },
  {
    id: 'l4-05',
    level: 4,
    wordA: 'Start',
    wordD: 'Ascend',
    bridgeWord: 'Finish',
    relationship: 'antonyms',
    distractors: ['Descend', 'End', 'Climb'],
    explanation: 'correct — start is the opposite of finish; ascend is the opposite of descend'
  },
  {
    id: 'l4-06',
    level: 4,
    wordA: 'Abundant',
    wordD: 'Arrogant',
    bridgeWord: 'Scarce',
    relationship: 'antonyms',
    distractors: ['Humble', 'Plentiful', 'Proud'],
    explanation: 'correct — abundant is the opposite of scarce; arrogant is the opposite of humble'
  },
  {
    id: 'l4-07',
    level: 4,
    wordA: 'Cautious',
    wordD: 'Flexible',
    bridgeWord: 'Reckless',
    relationship: 'antonyms',
    distractors: ['Rigid', 'Careful', 'Stiff'],
    explanation: 'correct — cautious is the opposite of reckless; flexible is the opposite of rigid'
  },
  {
    id: 'l4-08',
    level: 4,
    wordA: 'Praise',
    wordD: 'Construct',
    bridgeWord: 'Criticize',
    relationship: 'antonyms',
    distractors: ['Demolish', 'Acclaim', 'Build'],
    explanation: 'correct — praise is the opposite of criticize; construct is the opposite of demolish'
  },
  {
    id: 'l4-09',
    level: 4,
    wordA: 'Generous',
    wordD: 'Polite',
    bridgeWord: 'Stingy',
    relationship: 'antonyms',
    distractors: ['Rude', 'Kind', 'Mean'],
    explanation: 'correct — generous is the opposite of stingy; polite is the opposite of rude'
  },
  {
    id: 'l4-10',
    level: 4,
    wordA: 'Expand',
    wordD: 'Remember',
    bridgeWord: 'Contract',
    relationship: 'antonyms',
    distractors: ['Forget', 'Shrink', 'Recall'],
    explanation: 'correct — expand is the opposite of contract; remember is the opposite of forget'
  },
  {
    id: 'l4-11',
    level: 4,
    wordA: 'Mourn',
    wordD: 'Poverty',
    bridgeWord: 'Rejoice',
    relationship: 'antonyms',
    distractors: ['Wealth', 'Sorrow', 'Cash'],
    explanation: 'correct — mourn is the opposite of rejoice; poverty is the opposite of wealth'
  },
  {
    id: 'l4-12',
    level: 4,
    wordA: 'Hostile',
    wordD: 'Frequent',
    bridgeWord: 'Friendly',
    relationship: 'antonyms',
    distractors: ['Seldom', 'Warm', 'Rare'],
    explanation: 'correct — hostile is the opposite of friendly; frequent is the opposite of seldom'
  },
  {
    id: 'l4-13',
    level: 4,
    wordA: 'Chaotic',
    wordD: 'Trivial',
    bridgeWord: 'Orderly',
    relationship: 'antonyms',
    distractors: ['Vital', 'Messy', 'Crucial'],
    explanation: 'correct — chaotic is the opposite of orderly; trivial is the opposite of vital'
  },
  {
    id: 'l4-14',
    level: 4,
    wordA: 'Obvious',
    wordD: 'Temporary',
    bridgeWord: 'Obscure',
    relationship: 'antonyms',
    distractors: ['Permanent', 'Hidden', 'Lasting'],
    explanation: 'correct — obvious is the opposite of obscure; temporary is the opposite of permanent'
  },
  {
    id: 'l4-15',
    level: 4,
    wordA: 'Acquire',
    wordD: 'Approve',
    bridgeWord: 'Lose',
    relationship: 'antonyms',
    distractors: ['Reject', 'Gain', 'Forbid'],
    explanation: 'correct — acquire is the opposite of lose; approve is the opposite of reject'
  },

  // ── LEVEL 5: Abstract Causal / Structural ("developmental origin") ─────────
  {
    id: 'l5-01',
    level: 5,
    wordA: 'Seed',
    wordD: 'Idea',
    bridgeWord: 'Tree',
    relationship: 'causal origin',
    distractors: ['Innovation', 'Sprout', 'Brainstorm'],
    explanation: 'correct — seed develops into a tree; idea develops into an innovation'
  },
  {
    id: 'l5-02',
    level: 5,
    wordA: 'Spark',
    wordD: 'Tension',
    bridgeWord: 'Conflagration',
    relationship: 'causal origin',
    distractors: ['Conflict', 'Fire', 'Anger'],
    explanation: 'correct — spark causes a conflagration (fire); tension causes conflict'
  },
  {
    id: 'l5-03',
    level: 5,
    wordA: 'Cocoon',
    wordD: 'Chrysalis',
    bridgeWord: 'Moth',
    relationship: 'causal origin',
    distractors: ['Butterfly', 'Silk', 'Caterpillar'],
    explanation: 'correct — cocoon yields a moth; chrysalis yields a butterfly'
  },
  {
    id: 'l5-04',
    level: 5,
    wordA: 'Quake',
    wordD: 'Impact',
    bridgeWord: 'Tsunami',
    relationship: 'causal origin',
    distractors: ['Crater', 'Wave', 'Meteor'],
    explanation: 'correct — earthquake causes a tsunami; impact causes a crater'
  },
  {
    id: 'l5-05',
    level: 5,
    wordA: 'Draft',
    wordD: 'Blueprint',
    bridgeWord: 'Novel',
    relationship: 'causal origin',
    distractors: ['Skyscraper', 'Writer', 'Steel'],
    explanation: 'correct — draft develops into a finished novel; blueprint into a skyscraper'
  },
  {
    id: 'l5-06',
    level: 5,
    wordA: 'Rain',
    wordD: 'Silt',
    bridgeWord: 'Erosion',
    relationship: 'causal origin',
    distractors: ['Delta', 'Storm', 'River'],
    explanation: 'correct — rain causes erosion; silt deposition forms a delta'
  },
  {
    id: 'l5-07',
    level: 5,
    wordA: 'Tax',
    wordD: 'Tariff',
    bridgeWord: 'Revenue',
    relationship: 'causal origin',
    distractors: ['Protectionism', 'Finance', 'Trade'],
    explanation: 'correct — tax generates state revenue; tariff generates protectionism/trade barriers'
  },
  {
    id: 'l5-08',
    level: 5,
    wordA: 'Drought',
    wordD: 'Deluge',
    bridgeWord: 'Famine',
    relationship: 'causal origin',
    distractors: ['Flood', 'Dry', 'Rain'],
    explanation: 'correct — drought causes famine; deluge causes flood'
  },
  {
    id: 'l5-09',
    level: 5,
    wordA: 'Symptom',
    wordD: 'Clue',
    bridgeWord: 'Diagnosis',
    relationship: 'causal origin',
    distractors: ['Solution', 'Disease', 'Mystery'],
    explanation: 'correct — symptom leads to a diagnosis; clue leads to a solution'
  },
  {
    id: 'l5-10',
    level: 5,
    wordA: 'Stagnation',
    wordD: 'Competition',
    bridgeWord: 'Decline',
    relationship: 'causal origin',
    distractors: ['Innovation', 'Rust', 'Market'],
    explanation: 'correct — stagnation leads to decline; competition leads to innovation'
  },
  {
    id: 'l5-11',
    level: 5,
    wordA: 'Vaccine',
    wordD: 'Filter',
    bridgeWord: 'Immunity',
    relationship: 'causal origin',
    distractors: ['Purity', 'Virus', 'Clean'],
    explanation: 'correct — vaccine induces immunity; filter induces purity/cleanliness'
  },
  {
    id: 'l5-12',
    level: 5,
    wordA: 'Foundry',
    wordD: 'Laboratory',
    bridgeWord: 'Steel',
    relationship: 'causal origin',
    distractors: ['Discovery', 'Iron', 'Experiment'],
    explanation: 'correct — foundry produces steel; laboratory produces scientific discoveries'
  },
  {
    id: 'l5-13',
    level: 5,
    wordA: 'Greed',
    wordD: 'Trust',
    bridgeWord: 'Corruption',
    relationship: 'causal origin',
    distractors: ['Cooperation', 'Money', 'Alliance'],
    explanation: 'correct — greed breeds corruption; trust breeds cooperation/alliances'
  },
  {
    id: 'l5-14',
    level: 5,
    wordA: 'Melody',
    wordD: 'Word',
    bridgeWord: 'Symphony',
    relationship: 'causal origin',
    distractors: ['Sentence', 'Note', 'Language'],
    explanation: 'correct — melody develops into a symphony; word develops into a sentence'
  },
  {
    id: 'l5-15',
    level: 5,
    wordA: 'Precedent',
    wordD: 'Premise',
    bridgeWord: 'Tradition',
    relationship: 'causal origin',
    distractors: ['Conclusion', 'Law', 'Logic'],
    explanation: 'correct — precedent establishes a tradition; premise establishes a conclusion'
  }
];
