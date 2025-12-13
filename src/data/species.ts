export type ConservationStatus = 'CR' | 'EN' | 'VU';

export interface Species {
  id: string;
  name: string;
  scientificName: string;
  status: ConservationStatus;
  ticker: string;
  image: string;
  population: string;
  region: string;
  votes: number;
  description: string;
  code?: string;
}

export const speciesData: Species[] = [
  {
    id: '001',
    name: 'Sumatran Tiger',
    scientificName: 'Panthera tigris sumatrae',
    status: 'CR',
    ticker: '$FCBC001',
    image: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?w=800&q=80',
    population: '< 400',
    region: 'Sumatra, Indonesia',
    votes: 1247,
    description: 'The smallest surviving tiger subspecies, found only on the Indonesian island of Sumatra.'
  },
  {
    id: '002',
    name: 'African Elephant',
    scientificName: 'Loxodonta africana',
    status: 'EN',
    ticker: '$FCBC002',
    image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=800&q=80',
    population: '~ 415,000',
    region: 'Sub-Saharan Africa',
    votes: 2341,
    description: 'The largest living land animal, threatened by poaching and habitat loss.'
  },
  {
    id: '003',
    name: 'Mountain Gorilla',
    scientificName: 'Gorilla beringei beringei',
    status: 'EN',
    ticker: '$FCBC003',
    image: 'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=800&q=80',
    population: '~ 1,063',
    region: 'Central Africa',
    votes: 1856,
    description: 'One of our closest relatives, living in the volcanic mountains of central Africa.'
  },
  {
    id: '004',
    name: 'Amur Leopard',
    scientificName: 'Panthera pardus orientalis',
    status: 'CR',
    ticker: '$FCBC004',
    image: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=800&q=80',
    population: '< 100',
    region: 'Russian Far East',
    votes: 987,
    description: 'The world\'s rarest big cat, adapted to the cold forests of the Russian Far East.'
  },
  {
    id: '005',
    name: 'Black Rhinoceros',
    scientificName: 'Diceros bicornis',
    status: 'CR',
    ticker: '$FCBC005',
    image: 'https://images.unsplash.com/photo-1598894000329-2f0d85edb68f?w=800&q=80',
    population: '~ 5,500',
    region: 'Eastern & Southern Africa',
    votes: 1432,
    description: 'A critically endangered species that has been brought back from the brink of extinction.'
  },
  {
    id: '006',
    name: 'Giant Panda',
    scientificName: 'Ailuropoda melanoleuca',
    status: 'VU',
    ticker: '$FCBC006',
    image: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800&q=80',
    population: '~ 1,864',
    region: 'Central China',
    votes: 3421,
    description: 'An iconic symbol of conservation, native to the bamboo forests of China.'
  },
  {
    id: '007',
    name: 'Snow Leopard',
    scientificName: 'Panthera uncia',
    status: 'VU',
    ticker: '$FCBC007',
    image: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?w=800&q=80',
    population: '~ 4,000',
    region: 'Central Asia',
    votes: 2156,
    description: 'The "Ghost of the Mountains," elusive predator of the high Himalayan peaks.'
  },
  {
    id: '008',
    name: 'Orangutan',
    scientificName: 'Pongo pygmaeus',
    status: 'CR',
    ticker: '$FCBC008',
    image: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=800&q=80',
    population: '~ 104,000',
    region: 'Borneo & Sumatra',
    votes: 1789,
    description: 'The only great ape found in Asia, known for exceptional intelligence.'
  },
  {
    id: '009',
    name: 'Polar Bear',
    scientificName: 'Ursus maritimus',
    status: 'VU',
    ticker: '$FCBC009',
    image: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=800&q=80',
    population: '~ 26,000',
    region: 'Arctic Circle',
    votes: 2567,
    description: 'The largest land carnivore, threatened by rapid Arctic ice loss.'
  },
  {
    id: '010',
    name: 'Hawksbill Turtle',
    scientificName: 'Eretmochelys imbricata',
    status: 'CR',
    ticker: '$FCBC010',
    image: 'https://images.unsplash.com/photo-1591025207163-942350e47db2?w=800&q=80',
    population: '< 23,000',
    region: 'Tropical Oceans',
    votes: 1234,
    description: 'A critically endangered sea turtle essential to coral reef ecosystems.'
  },
  {
    id: '011',
    name: 'Bengal Tiger',
    scientificName: 'Panthera tigris tigris',
    status: 'EN',
    ticker: '$FCBC011',
    image: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800&q=80',
    population: '~ 2,500',
    region: 'Indian Subcontinent',
    votes: 2891,
    description: 'The most numerous tiger subspecies, symbol of India\'s wilderness.'
  },
  {
    id: '012',
    name: 'Red Panda',
    scientificName: 'Ailurus fulgens',
    status: 'EN',
    ticker: '$FCBC012',
    image: 'https://images.unsplash.com/photo-1527118732049-c88155f2107c?w=800&q=80',
    population: '< 10,000',
    region: 'Eastern Himalayas',
    votes: 2234,
    description: 'A charming arboreal mammal, not actually related to the giant panda.'
  },
  {
    id: '013',
    name: 'Cheetah',
    scientificName: 'Acinonyx jubatus',
    status: 'VU',
    ticker: '$FCBC013',
    image: 'https://images.unsplash.com/photo-1475359524104-d101d02a042b?w=800&q=80',
    population: '~ 7,000',
    region: 'Africa & Iran',
    votes: 1987,
    description: 'The fastest land animal, capable of reaching speeds over 70 mph.'
  },
  {
    id: '014',
    name: 'Whale Shark',
    scientificName: 'Rhincodon typus',
    status: 'EN',
    ticker: '$FCBC014',
    image: 'https://images.unsplash.com/photo-1560275619-4662e36fa65c?w=800&q=80',
    population: 'Unknown',
    region: 'Tropical Oceans',
    votes: 1654,
    description: 'The largest fish in the world, a gentle giant of the seas.'
  },
  {
    id: '015',
    name: 'Blue Whale',
    scientificName: 'Balaenoptera musculus',
    status: 'EN',
    ticker: '$FCBC015',
    image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=800&q=80',
    population: '~ 10,000',
    region: 'All Oceans',
    votes: 3102,
    description: 'The largest animal ever known to exist, still recovering from whaling.'
  },
  {
    id: '016',
    name: 'Koala',
    scientificName: 'Phascolarctos cinereus',
    status: 'VU',
    ticker: '$FCBC016',
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
  }
};

export const getStatusColor = (status: ConservationStatus): string => {
  switch (status) {
    case 'CR': return 'bg-status-cr';
    case 'EN': return 'bg-status-en';
    case 'VU': return 'bg-status-vu';
  }
};