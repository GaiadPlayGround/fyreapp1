export type ConservationStatus = 'CR' | 'EN' | 'VU' | 'NT' | 'LC' | 'DD' | 'NE' | 'EW' | 'EX';

export interface Species {
  // Identity & Token
  id: string;           // FCBC ID (e.g. "FCBC #4")
  name: string;         // Common name
  symbol: string;       // FCBC ticker (e.g. "FCBC4")
  code: string;         // Internal FCBC code
  
  // Conservation
  status: ConservationStatus;     // Short IUCN code (CR, VU, etc.)
  statusLabel: string;            // Human-readable IUCN status
  rarity: string;                 // FCBC rarity tier
  
  // Media
  image: string;        // High-res IPFS image URL
  
  // Legacy/Display fields
  scientificName: string;
  ticker: string;       // Display ticker with $ prefix
  population: string;
  region: string;
  votes: number;
  description: string;
}

export const speciesData: Species[] = [
  {
    id: 'FCBC #1',
    name: 'Sumatran Tiger',
    symbol: 'FCBC1',
    code: 'FCBC1',
    status: 'CR',
    statusLabel: 'Critically Endangered',
    rarity: 'Legendary',
    scientificName: 'Panthera tigris sumatrae',
    ticker: '$FCBC1',
    image: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?w=800&q=80',
    population: '< 400',
    region: 'Sumatra, Indonesia',
    votes: 1247,
    description: 'The smallest surviving tiger subspecies, found only on the Indonesian island of Sumatra.'
  },
  {
    id: 'FCBC #2',
    name: 'African Elephant',
    symbol: 'FCBC2',
    code: 'FCBC2',
    status: 'EN',
    statusLabel: 'Endangered',
    rarity: 'Epic',
    scientificName: 'Loxodonta africana',
    ticker: '$FCBC2',
    image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=800&q=80',
    population: '~ 415,000',
    region: 'Sub-Saharan Africa',
    votes: 2341,
    description: 'The largest living land animal, threatened by poaching and habitat loss.'
  },
  {
    id: 'FCBC #3',
    name: 'Mountain Gorilla',
    symbol: 'FCBC3',
    code: 'FCBC3',
    status: 'EN',
    statusLabel: 'Endangered',
    rarity: 'Rare',
    scientificName: 'Gorilla beringei beringei',
    ticker: '$FCBC3',
    image: 'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=800&q=80',
    population: '~ 1,063',
    region: 'Central Africa',
    votes: 1856,
    description: 'One of our closest relatives, living in the volcanic mountains of central Africa.'
  },
  {
    id: 'FCBC #4',
    name: 'Amur Leopard',
    symbol: 'FCBC4',
    code: 'FCBC4',
    status: 'CR',
    statusLabel: 'Critically Endangered',
    rarity: 'Legendary',
    scientificName: 'Panthera pardus orientalis',
    ticker: '$FCBC4',
    image: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=800&q=80',
    population: '< 100',
    region: 'Russian Far East',
    votes: 987,
    description: 'The world\'s rarest big cat, adapted to the cold forests of the Russian Far East.'
  },
  {
    id: 'FCBC #5',
    name: 'Black Rhinoceros',
    symbol: 'FCBC5',
    code: 'FCBC5',
    status: 'CR',
    statusLabel: 'Critically Endangered',
    rarity: 'Epic',
    scientificName: 'Diceros bicornis',
    ticker: '$FCBC5',
    image: 'https://images.unsplash.com/photo-1598894000329-2f0d85edb68f?w=800&q=80',
    population: '~ 5,500',
    region: 'Eastern & Southern Africa',
    votes: 1432,
    description: 'A critically endangered species that has been brought back from the brink of extinction.'
  },
  {
    id: 'FCBC #6',
    name: 'Giant Panda',
    symbol: 'FCBC6',
    code: 'FCBC6',
    status: 'VU',
    statusLabel: 'Vulnerable',
    rarity: 'Rare',
    scientificName: 'Ailuropoda melanoleuca',
    ticker: '$FCBC6',
    image: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800&q=80',
    population: '~ 1,864',
    region: 'Central China',
    votes: 3421,
    description: 'An iconic symbol of conservation, native to the bamboo forests of China.'
  },
  {
    id: 'FCBC #7',
    name: 'Snow Leopard',
    symbol: 'FCBC7',
    code: 'FCBC7',
    status: 'VU',
    statusLabel: 'Vulnerable',
    rarity: 'Uncommon',
    scientificName: 'Panthera uncia',
    ticker: '$FCBC7',
    image: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?w=800&q=80',
    population: '~ 4,000',
    region: 'Central Asia',
    votes: 2156,
    description: 'The "Ghost of the Mountains," elusive predator of the high Himalayan peaks.'
  },
  {
    id: 'FCBC #8',
    name: 'Orangutan',
    symbol: 'FCBC8',
    code: 'FCBC8',
    status: 'CR',
    statusLabel: 'Critically Endangered',
    rarity: 'Common',
    scientificName: 'Pongo pygmaeus',
    ticker: '$FCBC8',
    image: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=800&q=80',
    population: '~ 104,000',
    region: 'Borneo & Sumatra',
    votes: 1789,
    description: 'The only great ape found in Asia, known for exceptional intelligence.'
  },
  {
    id: 'FCBC #9',
    name: 'Polar Bear',
    symbol: 'FCBC9',
    code: 'FCBC9',
    status: 'VU',
    statusLabel: 'Vulnerable',
    rarity: 'Legendary',
    scientificName: 'Ursus maritimus',
    ticker: '$FCBC9',
    image: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=800&q=80',
    population: '~ 26,000',
    region: 'Arctic Circle',
    votes: 2567,
    description: 'The largest land carnivore, threatened by rapid Arctic ice loss.'
  },
  {
    id: 'FCBC #10',
    name: 'Hawksbill Turtle',
    symbol: 'FCBC10',
    code: 'FCBC10',
    status: 'CR',
    statusLabel: 'Critically Endangered',
    rarity: 'Epic',
    scientificName: 'Eretmochelys imbricata',
    ticker: '$FCBC10',
    image: 'https://images.unsplash.com/photo-1591025207163-942350e47db2?w=800&q=80',
    population: '< 23,000',
    region: 'Tropical Oceans',
    votes: 1234,
    description: 'A critically endangered sea turtle essential to coral reef ecosystems.'
  },
  {
    id: 'FCBC #11',
    name: 'Bengal Tiger',
    symbol: 'FCBC11',
    code: 'FCBC11',
    status: 'EN',
    statusLabel: 'Endangered',
    rarity: 'Rare',
    scientificName: 'Panthera tigris tigris',
    ticker: '$FCBC11',
    image: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800&q=80',
    population: '~ 2,500',
    region: 'Indian Subcontinent',
    votes: 2891,
    description: 'The most numerous tiger subspecies, symbol of India\'s wilderness.'
  },
  {
    id: 'FCBC #12',
    name: 'Red Panda',
    symbol: 'FCBC12',
    code: 'FCBC12',
    status: 'EN',
    statusLabel: 'Endangered',
    rarity: 'Uncommon',
    scientificName: 'Ailurus fulgens',
    ticker: '$FCBC12',
    image: 'https://images.unsplash.com/photo-1527118732049-c88155f2107c?w=800&q=80',
    population: '< 10,000',
    region: 'Eastern Himalayas',
    votes: 2234,
    description: 'A charming arboreal mammal, not actually related to the giant panda.'
  },
  {
    id: 'FCBC #13',
    name: 'Cheetah',
    symbol: 'FCBC13',
    code: 'FCBC13',
    status: 'VU',
    statusLabel: 'Vulnerable',
    rarity: 'Common',
    scientificName: 'Acinonyx jubatus',
    ticker: '$FCBC13',
    image: 'https://images.unsplash.com/photo-1475359524104-d101d02a042b?w=800&q=80',
    population: '~ 7,000',
    region: 'Africa & Iran',
    votes: 1987,
    description: 'The fastest land animal, capable of reaching speeds over 70 mph.'
  },
  {
    id: 'FCBC #14',
    name: 'Whale Shark',
    symbol: 'FCBC14',
    code: 'FCBC14',
    status: 'EN',
    statusLabel: 'Endangered',
    rarity: 'Legendary',
    scientificName: 'Rhincodon typus',
    ticker: '$FCBC14',
    image: 'https://images.unsplash.com/photo-1560275619-4662e36fa65c?w=800&q=80',
    population: 'Unknown',
    region: 'Tropical Oceans',
    votes: 1654,
    description: 'The largest fish in the world, a gentle giant of the seas.'
  },
  {
    id: 'FCBC #15',
    name: 'Blue Whale',
    symbol: 'FCBC15',
    code: 'FCBC15',
    status: 'EN',
    statusLabel: 'Endangered',
    rarity: 'Epic',
    scientificName: 'Balaenoptera musculus',
    ticker: '$FCBC15',
    image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=800&q=80',
    population: '~ 10,000',
    region: 'All Oceans',
    votes: 3102,
    description: 'The largest animal ever known to exist, still recovering from whaling.'
  },
  {
    id: 'FCBC #16',
    name: 'Koala',
    symbol: 'FCBC16',
    code: 'FCBC16',
    status: 'VU',
    statusLabel: 'Vulnerable',
    rarity: 'Rare',
    scientificName: 'Phascolarctos cinereus',
    ticker: '$FCBC16',
    image: 'https://images.unsplash.com/photo-1459262838948-3e2de6c1ec80?w=800&q=80',
    population: '~ 80,000',
    region: 'Eastern Australia',
    votes: 2456,
    description: 'An iconic Australian marsupial, threatened by habitat loss and disease.'
  },
];

export const getStatusLabel = (status: ConservationStatus): string => {
  switch (status) {
    case 'CR': return 'Critically Endangered';
    case 'EN': return 'Endangered';
    case 'VU': return 'Vulnerable';
    case 'NT': return 'Near Threatened';
    case 'LC': return 'Least Concern';
    case 'DD': return 'Data Deficient';
    case 'NE': return 'Not Evaluated';
    case 'EW': return 'Extinct in Wild';
    case 'EX': return 'Extinct';
    default: return 'Unknown';
  }
};

export const getStatusColor = (status: ConservationStatus): string => {
  switch (status) {
    case 'CR': return 'bg-status-cr';
    case 'EN': return 'bg-status-en';
    case 'VU': return 'bg-status-vu';
    case 'NT': return 'bg-amber-500';
    case 'LC': return 'bg-green-500';
    case 'DD': return 'bg-gray-500';
    case 'NE': return 'bg-gray-400';
    case 'EW': return 'bg-purple-600';
    case 'EX': return 'bg-black';
    default: return 'bg-gray-500';
  }
};