// 10 fixed habitat-based colors for electric borders
export const HABITAT_COLORS = {
  'Tropical Rainforest': '#1F6F4A',
  'Coral Reef': '#1ECAD3',
  'Open Ocean': '#0A3D62',
  'Freshwater / Wetlands': '#6B8E23',
  'Savannah': '#C2A14D',
  'Grassland': '#6FAF44',
  'Desert': '#C2B280',
  'Alpine / Mountain': '#8A8F98',
  'Arctic / Tundra': '#E6F2F7',
  'Mangroves / Coastal Wetlands': '#556B2F',
} as const;

export type HabitatType = keyof typeof HABITAT_COLORS;

// Get habitat type based on species name, region, and scientific name
const getHabitatType = (name: string, region: string, scientificName: string, id: string): HabitatType => {
  const nameLower = name.toLowerCase();
  const regionLower = region.toLowerCase();
  const scientificLower = scientificName.toLowerCase();
  const combined = `${nameLower} ${regionLower} ${scientificLower}`;

  // 1. Tropical Rainforest — #1F6F4A
  const rainforestKeywords = [
    'tiger', 'orangutan', 'gorilla', 'chimpanzee', 'bonobo', 'sloth', 'toucan', 'macaw', 'parrot',
    'jaguar', 'ocelot', 'tapir', 'capybara', 'monkey', 'lemur', 'frog', 'tree', 'canopy',
    'rainforest', 'jungle', 'tropical forest', 'amazon', 'borneo', 'sumatra', 'congo', 'madagascar',
    'indonesia', 'malaysia', 'philippines', 'brazil', 'peru', 'colombia', 'ecuador',
    'panthera', 'pongo', 'gorilla', 'pan', 'ateles', 'alouatta'
  ];
  if (rainforestKeywords.some(kw => combined.includes(kw))) {
    return 'Tropical Rainforest';
  }

  // 2. Coral Reef — #1ECAD3
  const coralReefKeywords = [
    'coral', 'reef', 'clownfish', 'nemo', 'anemone', 'parrotfish', 'angelfish', 'butterflyfish',
    'seahorse', 'seadragon', 'mantis shrimp', 'lobster', 'crab', 'starfish', 'sea star',
    'grouper', 'snapper', 'wrasse', 'damselfish', 'surgeonfish', 'tang', 'triggerfish',
    'barracuda', 'moray', 'eel', 'octopus', 'squid', 'cuttlefish', 'nudibranch',
    'great barrier', 'caribbean', 'red sea', 'maldives', 'fiji', 'hawaii', 'polynesia'
  ];
  if (coralReefKeywords.some(kw => combined.includes(kw))) {
    return 'Coral Reef';
  }

  // 3. Open Ocean — #0A3D62
  const oceanKeywords = [
    'whale', 'dolphin', 'porpoise', 'shark', 'tuna', 'marlin', 'sailfish', 'swordfish',
    'manta ray', 'stingray', 'jellyfish', 'sea turtle', 'leatherback', 'loggerhead',
    'blue whale', 'humpback', 'orca', 'killer whale', 'sperm whale', 'fin whale',
    'seal', 'sea lion', 'walrus', 'penguin', 'albatross', 'petrel', 'pelican',
    'ocean', 'pelagic', 'marine', 'atlantic', 'pacific', 'indian ocean', 'antarctic',
    'balaenoptera', 'physeter', 'orcinus', 'delphinus', 'carcharodon', 'mobula'
  ];
  if (oceanKeywords.some(kw => combined.includes(kw))) {
    return 'Open Ocean';
  }

  // 4. Freshwater / Wetlands — #6B8E23
  const freshwaterKeywords = [
    'otter', 'beaver', 'platypus', 'duck', 'goose', 'swan', 'heron', 'egret', 'crane',
    'stork', 'ibis', 'flamingo', 'pelican', 'kingfisher', 'cormorant', 'loon',
    'alligator', 'crocodile', 'caiman', 'gavial', 'turtle', 'terrapin', 'snapping turtle',
    'pike', 'bass', 'trout', 'salmon', 'catfish', 'piranha', 'sturgeon', 'paddlefish',
    'river', 'lake', 'pond', 'wetland', 'marsh', 'swamp', 'bog', 'fen', 'delta',
    'freshwater', 'aquatic', 'amphibian', 'frog', 'toad', 'salamander', 'newt',
    'alligator', 'crocodylus', 'gavialis', 'pseudemys', 'chelydra'
  ];
  if (freshwaterKeywords.some(kw => combined.includes(kw))) {
    return 'Freshwater / Wetlands';
  }

  // 5. Savannah — #C2A14D
  const savannahKeywords = [
    'elephant', 'lion', 'giraffe', 'zebra', 'wildebeest', 'antelope', 'gazelle',
    'impala', 'kudu', 'eland', 'buffalo', 'rhino', 'rhinoceros', 'hippo', 'hippopotamus',
    'cheetah', 'leopard', 'hyena', 'jackal', 'wild dog', 'meerkat', 'mongoose',
    'warthog', 'baboon', 'vulture', 'eagle', 'secretary bird', 'ostrich', 'emu',
    'savannah', 'savanna', 'serengeti', 'masai mara', 'kruger', 'south africa',
    'kenya', 'tanzania', 'botswana', 'namibia', 'zimbabwe', 'sub-saharan',
    'loxodonta', 'panthera leo', 'giraffa', 'equus', 'connochaetes', 'tragelaphus'
  ];
  if (savannahKeywords.some(kw => combined.includes(kw))) {
    return 'Savannah';
  }

  // 6. Grassland — #6FAF44
  const grasslandKeywords = [
    'bison', 'pronghorn', 'prairie dog', 'groundhog', 'marmot', 'badger', 'coyote',
    'wolf', 'fox', 'deer', 'elk', 'moose', 'caribou', 'reindeer', 'antelope',
    'prairie', 'grassland', 'steppe', 'pampas', 'veldt', 'plain', 'meadow',
    'north america', 'great plains', 'midwest', 'canada', 'mongolia', 'kazakhstan',
    'russia', 'ukraine', 'argentina', 'uruguay', 'paraguay'
  ];
  if (grasslandKeywords.some(kw => combined.includes(kw))) {
    return 'Grassland';
  }

  // 7. Desert — #C2B280
  const desertKeywords = [
    'camel', 'dromedary', 'bactrian', 'fennec', 'fox', 'jackal', 'coyote',
    'scorpion', 'tarantula', 'gila monster', 'beaded lizard', 'horned lizard',
    'rattlesnake', 'sidewinder', 'kangaroo rat', 'jerboa', 'gerbil', 'hamster',
    'desert', 'sahara', 'gobi', 'kalahari', 'namib', 'atacama', 'mojave', 'sonoran',
    'arabia', 'saudi', 'uae', 'qatar', 'kuwait', 'bahrain', 'oman', 'yemen',
    'australia', 'outback', 'arid', 'semi-arid', 'xeric'
  ];
  if (desertKeywords.some(kw => combined.includes(kw))) {
    return 'Desert';
  }

  // 8. Alpine / Mountain — #8A8F98
  const alpineKeywords = [
    'mountain', 'alpine', 'snow leopard', 'ibex', 'mountain goat', 'bighorn', 'mouflon',
    'chamois', 'marmot', 'pika', 'mountain lion', 'cougar', 'puma', 'lynx', 'bobcat',
    'condor', 'eagle', 'vulture', 'lammergeier', 'bearded vulture', 'golden eagle',
    'himalaya', 'himalayan', 'tibet', 'tibetan', 'andes', 'andean', 'alps', 'alpine',
    'rocky mountains', 'sierra', 'cascades', 'appalachian', 'urals', 'altai',
    'panthera uncia', 'capra', 'ovis', 'rupicapra', 'marmota', 'ochotona', 'aquila'
  ];
  if (alpineKeywords.some(kw => combined.includes(kw))) {
    return 'Alpine / Mountain';
  }

  // 9. Arctic / Tundra — #E6F2F7
  const arcticKeywords = [
    'polar bear', 'arctic fox', 'arctic hare', 'arctic wolf', 'musk ox', 'caribou',
    'reindeer', 'moose', 'walrus', 'seal', 'narwhal', 'beluga', 'bowhead whale',
    'snowy owl', 'ptarmigan', 'grouse', 'lemming', 'vole', 'ermine', 'weasel',
    'arctic', 'tundra', 'taiga', 'siberia', 'alaska', 'canada', 'greenland', 'iceland',
    'norway', 'sweden', 'finland', 'russia', 'svalbard', 'antarctic', 'penguin',
    'ursus maritimus', 'alopex lagopus', 'rangifer', 'ovibos', 'balaena'
  ];
  if (arcticKeywords.some(kw => combined.includes(kw))) {
    return 'Arctic / Tundra';
  }

  // 10. Mangroves / Coastal Wetlands — #556B2F
  const mangroveKeywords = [
    'mangrove', 'mudskipper', 'fiddler crab', 'hermit crab', 'mud crab', 'snapping shrimp',
    'mangrove snake', 'water monitor', 'saltwater crocodile', 'estuarine crocodile',
    'mangrove monitor', 'kingfisher', 'heron', 'egret', 'ibis', 'spoonbill',
    'coastal', 'estuary', 'brackish', 'intertidal', 'mudflat', 'salt marsh',
    'bangladesh', 'sundarbans', 'florida', 'everglades', 'mexico', 'brazil', 'thailand',
    'mangrove', 'rhizophora', 'avicennia', 'crocodylus porosus'
  ];
  if (mangroveKeywords.some(kw => combined.includes(kw))) {
    return 'Mangroves / Coastal Wetlands';
  }

  // Fallback: use ID to pick a habitat deterministically
  const idNum = parseInt(id.replace(/\D/g, '')) || 0;
  const habitatTypes = Object.keys(HABITAT_COLORS) as HabitatType[];
  return habitatTypes[idNum % habitatTypes.length];
};

// Get habitat color based on species data
export const getHabitatColor = (region: string, id: string, name?: string, scientificName?: string): string => {
  const speciesName = name || '';
  const scientific = scientificName || '';
  const habitatType = getHabitatType(speciesName, region, scientific, id);
  return HABITAT_COLORS[habitatType];
};
