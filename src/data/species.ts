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
  
  // Zora/Onchain data (optional)
  tokenAddress?: string;          // ERC-20 token contract address
  poolCurrencyToken?: {           // Currency token for trading
    address: string;
    name: string;
    decimals: number;
  };
  chainId?: number;                // Chain ID (8453 for Base)
  tradable?: boolean;              // Whether token is tradable
  marketCap?: number;              // Market cap in USD
  marketCapFormatted?: string;    // Formatted market cap (e.g., "$309.56")
  holders?: number;                // Number of token holders
  circulatingSupply?: number;      // Circulating supply
  totalSupply?: number;            // Total supply
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

// Additional dummy species data to fill the grid
const additionalAnimals: Array<{ name: string; scientificName: string; status: ConservationStatus; region: string }> = [
  { name: 'Javan Rhinoceros', scientificName: 'Rhinoceros sondaicus', status: 'CR', region: 'Java, Indonesia' },
  { name: 'Vaquita', scientificName: 'Phocoena sinus', status: 'CR', region: 'Gulf of California' },
  { name: 'Saola', scientificName: 'Pseudoryx nghetinhensis', status: 'CR', region: 'Vietnam & Laos' },
  { name: 'Cross River Gorilla', scientificName: 'Gorilla gorilla diehli', status: 'CR', region: 'Nigeria & Cameroon' },
  { name: 'Sumatran Rhinoceros', scientificName: 'Dicerorhinus sumatrensis', status: 'CR', region: 'Indonesia & Malaysia' },
  { name: 'Philippine Eagle', scientificName: 'Pithecophaga jefferyi', status: 'CR', region: 'Philippines' },
  { name: 'Kakapo', scientificName: 'Strigops habroptilus', status: 'CR', region: 'New Zealand' },
  { name: 'Yangtze Finless Porpoise', scientificName: 'Neophocaena asiaeorientalis', status: 'CR', region: 'Yangtze River, China' },
  { name: 'Northern White Rhinoceros', scientificName: 'Ceratotherium simum cottoni', status: 'CR', region: 'Central Africa' },
  { name: 'Spix Macaw', scientificName: 'Cyanopsitta spixii', status: 'EW', region: 'Brazil' },
  { name: 'Asian Elephant', scientificName: 'Elephas maximus', status: 'EN', region: 'South & Southeast Asia' },
  { name: 'Bonobo', scientificName: 'Pan paniscus', status: 'EN', region: 'Democratic Republic of Congo' },
  { name: 'Chimpanzee', scientificName: 'Pan troglodytes', status: 'EN', region: 'Central & West Africa' },
  { name: 'Galapagos Penguin', scientificName: 'Spheniscus mendiculus', status: 'EN', region: 'Galapagos Islands' },
  { name: 'Green Sea Turtle', scientificName: 'Chelonia mydas', status: 'EN', region: 'Tropical & Subtropical Oceans' },
  { name: 'Fin Whale', scientificName: 'Balaenoptera physalus', status: 'VU', region: 'All Oceans' },
  { name: 'African Wild Dog', scientificName: 'Lycaon pictus', status: 'EN', region: 'Sub-Saharan Africa' },
  { name: 'Dhole', scientificName: 'Cuon alpinus', status: 'EN', region: 'Central & East Asia' },
  { name: 'Ethiopian Wolf', scientificName: 'Canis simensis', status: 'EN', region: 'Ethiopian Highlands' },
  { name: 'Malayan Tiger', scientificName: 'Panthera tigris jacksoni', status: 'CR', region: 'Malay Peninsula' },
  { name: 'Indochinese Tiger', scientificName: 'Panthera tigris corbetti', status: 'EN', region: 'Southeast Asia' },
  { name: 'South China Tiger', scientificName: 'Panthera tigris amoyensis', status: 'CR', region: 'South China' },
  { name: 'Clouded Leopard', scientificName: 'Neofelis nebulosa', status: 'VU', region: 'Southeast Asia' },
  { name: 'Sunda Clouded Leopard', scientificName: 'Neofelis diardi', status: 'VU', region: 'Borneo & Sumatra' },
  { name: 'Iberian Lynx', scientificName: 'Lynx pardinus', status: 'EN', region: 'Iberian Peninsula' },
  { name: 'Fishing Cat', scientificName: 'Prionailurus viverrinus', status: 'VU', region: 'South & Southeast Asia' },
  { name: 'Flat-headed Cat', scientificName: 'Prionailurus planiceps', status: 'EN', region: 'Thailand, Malaysia, Indonesia' },
  { name: 'Bay Cat', scientificName: 'Catopuma badia', status: 'EN', region: 'Borneo' },
  { name: 'Andean Cat', scientificName: 'Leopardus jacobita', status: 'EN', region: 'Andes Mountains' },
  { name: 'Marbled Cat', scientificName: 'Pardofelis marmorata', status: 'NT', region: 'South & Southeast Asia' },
  { name: 'Black-footed Ferret', scientificName: 'Mustela nigripes', status: 'EN', region: 'North American Great Plains' },
  { name: 'Giant Otter', scientificName: 'Pteronura brasiliensis', status: 'EN', region: 'South America' },
  { name: 'Sea Otter', scientificName: 'Enhydra lutris', status: 'EN', region: 'North Pacific Ocean' },
  { name: 'Marine Otter', scientificName: 'Lontra felina', status: 'EN', region: 'Peru & Chile' },
  { name: 'Hairy-nosed Otter', scientificName: 'Lutra sumatrana', status: 'EN', region: 'Southeast Asia' },
  { name: 'Wolverine', scientificName: 'Gulo gulo', status: 'LC', region: 'Northern Hemisphere' },
  { name: 'Sun Bear', scientificName: 'Helarctos malayanus', status: 'VU', region: 'Southeast Asia' },
  { name: 'Sloth Bear', scientificName: 'Melursus ursinus', status: 'VU', region: 'Indian Subcontinent' },
  { name: 'Spectacled Bear', scientificName: 'Tremarctos ornatus', status: 'VU', region: 'Andes Mountains' },
  { name: 'Giant Anteater', scientificName: 'Myrmecophaga tridactyla', status: 'VU', region: 'Central & South America' },
  { name: 'Pangolin', scientificName: 'Manis spp.', status: 'CR', region: 'Africa & Asia' },
  { name: 'Okapi', scientificName: 'Okapia johnstoni', status: 'EN', region: 'Democratic Republic of Congo' },
  { name: 'Giraffe', scientificName: 'Giraffa camelopardalis', status: 'VU', region: 'Sub-Saharan Africa' },
  { name: 'Pygmy Hippopotamus', scientificName: 'Choeropsis liberiensis', status: 'EN', region: 'West Africa' },
  { name: 'Baird Tapir', scientificName: 'Tapirus bairdii', status: 'EN', region: 'Central America' },
  { name: 'Mountain Tapir', scientificName: 'Tapirus pinchaque', status: 'EN', region: 'Andes Mountains' },
  { name: 'Malayan Tapir', scientificName: 'Tapirus indicus', status: 'EN', region: 'Southeast Asia' },
  { name: 'Wild Bactrian Camel', scientificName: 'Camelus ferus', status: 'CR', region: 'Central Asia' },
  { name: 'Hirola', scientificName: 'Beatragus hunteri', status: 'CR', region: 'Kenya & Somalia' },
  { name: 'Addax', scientificName: 'Addax nasomaculatus', status: 'CR', region: 'Sahara Desert' },
  { name: 'Scimitar Oryx', scientificName: 'Oryx dammah', status: 'EW', region: 'North Africa' },
  { name: 'Arabian Oryx', scientificName: 'Oryx leucoryx', status: 'VU', region: 'Arabian Peninsula' },
  { name: 'Przewalski Horse', scientificName: 'Equus ferus przewalskii', status: 'EN', region: 'Mongolia & China' },
  { name: 'Grevy Zebra', scientificName: 'Equus grevyi', status: 'EN', region: 'Kenya & Ethiopia' },
  { name: 'African Wild Ass', scientificName: 'Equus africanus', status: 'CR', region: 'Horn of Africa' },
  { name: 'Kiang', scientificName: 'Equus kiang', status: 'LC', region: 'Tibetan Plateau' },
  { name: 'Pygmy Sloth', scientificName: 'Bradypus pygmaeus', status: 'CR', region: 'Panama' },
  { name: 'Maned Sloth', scientificName: 'Bradypus torquatus', status: 'VU', region: 'Brazil' },
  { name: 'Numbat', scientificName: 'Myrmecobius fasciatus', status: 'EN', region: 'Western Australia' },
  { name: 'Tasmanian Devil', scientificName: 'Sarcophilus harrisii', status: 'EN', region: 'Tasmania' },
  { name: 'Wombat', scientificName: 'Lasiorhinus latifrons', status: 'NT', region: 'Australia' },
  { name: 'Leadbeater Possum', scientificName: 'Gymnobelideus leadbeateri', status: 'CR', region: 'Victoria, Australia' },
  { name: 'Mahogany Glider', scientificName: 'Petaurus gracilis', status: 'EN', region: 'Queensland, Australia' },
  { name: 'Quokka', scientificName: 'Setonix brachyurus', status: 'VU', region: 'Western Australia' },
  { name: 'Tree Kangaroo', scientificName: 'Dendrolagus spp.', status: 'EN', region: 'New Guinea & Australia' },
  { name: 'Kangaroo Island Dunnart', scientificName: 'Sminthopsis aitkeni', status: 'CR', region: 'Kangaroo Island' },
  { name: 'Aye-aye', scientificName: 'Daubentonia madagascariensis', status: 'EN', region: 'Madagascar' },
  { name: 'Indri', scientificName: 'Indri indri', status: 'CR', region: 'Madagascar' },
  { name: 'Silky Sifaka', scientificName: 'Propithecus candidus', status: 'CR', region: 'Madagascar' },
  { name: 'Golden Bamboo Lemur', scientificName: 'Hapalemur aureus', status: 'CR', region: 'Madagascar' },
  { name: 'Black-and-white Ruffed Lemur', scientificName: 'Varecia variegata', status: 'CR', region: 'Madagascar' },
  { name: 'Ring-tailed Lemur', scientificName: 'Lemur catta', status: 'EN', region: 'Madagascar' },
  { name: 'Greater Bamboo Lemur', scientificName: 'Prolemur simus', status: 'CR', region: 'Madagascar' },
  { name: 'Fossa', scientificName: 'Cryptoprocta ferox', status: 'VU', region: 'Madagascar' },
  { name: 'Drill', scientificName: 'Mandrillus leucophaeus', status: 'EN', region: 'Nigeria & Cameroon' },
  { name: 'Mandrill', scientificName: 'Mandrillus sphinx', status: 'VU', region: 'Central Africa' },
  { name: 'Golden Snub-nosed Monkey', scientificName: 'Rhinopithecus roxellana', status: 'EN', region: 'Central China' },
  { name: 'Tonkin Snub-nosed Monkey', scientificName: 'Rhinopithecus avunculus', status: 'CR', region: 'Vietnam' },
  { name: 'Delacour Langur', scientificName: 'Trachypithecus delacouri', status: 'CR', region: 'Vietnam' },
  { name: 'Cat Ba Langur', scientificName: 'Trachypithecus poliocephalus', status: 'CR', region: 'Vietnam' },
  { name: 'Proboscis Monkey', scientificName: 'Nasalis larvatus', status: 'EN', region: 'Borneo' },
  { name: 'Siamang', scientificName: 'Symphalangus syndactylus', status: 'EN', region: 'Indonesia & Malaysia' },
  { name: 'Lar Gibbon', scientificName: 'Hylobates lar', status: 'EN', region: 'Southeast Asia' },
  { name: 'Hoolock Gibbon', scientificName: 'Hoolock hoolock', status: 'EN', region: 'Bangladesh, India, Myanmar' },
  { name: 'Hainan Gibbon', scientificName: 'Nomascus hainanus', status: 'CR', region: 'Hainan Island, China' },
  { name: 'Tarsier', scientificName: 'Tarsius spp.', status: 'VU', region: 'Southeast Asian Islands' },
  { name: 'Slow Loris', scientificName: 'Nycticebus spp.', status: 'EN', region: 'South & Southeast Asia' },
  { name: 'Pygmy Slow Loris', scientificName: 'Nycticebus pygmaeus', status: 'EN', region: 'Vietnam, Laos, Cambodia' },
  { name: 'Narwhal', scientificName: 'Monodon monoceros', status: 'NT', region: 'Arctic Waters' },
  { name: 'Beluga Whale', scientificName: 'Delphinapterus leucas', status: 'LC', region: 'Arctic & Sub-arctic' },
  { name: 'Amazon River Dolphin', scientificName: 'Inia geoffrensis', status: 'EN', region: 'Amazon Basin' },
  { name: 'Indus River Dolphin', scientificName: 'Platanista gangetica minor', status: 'EN', region: 'Indus River, Pakistan' },
  { name: 'Ganges River Dolphin', scientificName: 'Platanista gangetica', status: 'EN', region: 'Ganges River, India' },
  { name: 'Maui Dolphin', scientificName: 'Cephalorhynchus hectori maui', status: 'CR', region: 'New Zealand' },
  { name: 'North Atlantic Right Whale', scientificName: 'Eubalaena glacialis', status: 'CR', region: 'North Atlantic' },
  { name: 'Sei Whale', scientificName: 'Balaenoptera borealis', status: 'EN', region: 'All Oceans' },
];

const rarityTiers = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const unsplashImages = [
  'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  'https://images.unsplash.com/photo-1504006833117-8886a355efbf?w=800&q=80',
  'https://images.unsplash.com/photo-1551969014-7d2c4cddf0b6?w=800&q=80',
  'https://images.unsplash.com/photo-1518467166778-b88f373ffec7?w=800&q=80',
  'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&q=80',
  'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=800&q=80',
  'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&q=80',
  'https://images.unsplash.com/photo-1484406566174-9da000fda645?w=800&q=80',
  'https://images.unsplash.com/photo-1462953491269-9aff00919695?w=800&q=80',
  'https://images.unsplash.com/photo-1544985361-b420d7a77043?w=800&q=80',
  'https://images.unsplash.com/photo-1504173010664-32509aeebb62?w=800&q=80',
  'https://images.unsplash.com/photo-1571745544682-143ea663cf2c?w=800&q=80',
  'https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?w=800&q=80',
  'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=800&q=80',
];

export const generateAdditionalSpecies = (): Species[] => {
  return additionalAnimals.map((animal, index) => {
    const id = 17 + index;
    return {
      id: `FCBC #${id}`,
      name: animal.name,
      symbol: `FCBC${id}`,
      code: `FCBC${id}`,
      status: animal.status,
      statusLabel: getStatusLabel(animal.status),
      rarity: rarityTiers[Math.floor(Math.random() * rarityTiers.length)],
      scientificName: animal.scientificName,
      ticker: `$FCBC${id}`,
      image: unsplashImages[index % unsplashImages.length],
      population: '~ Unknown',
      region: animal.region,
      votes: Math.floor(Math.random() * 3000) + 100,
      description: `The ${animal.name} is a remarkable species native to ${animal.region}, facing conservation challenges in its natural habitat.`
    };
  });
};

export const getAllSpeciesData = (): Species[] => {
  return [...speciesData, ...generateAdditionalSpecies()];
};