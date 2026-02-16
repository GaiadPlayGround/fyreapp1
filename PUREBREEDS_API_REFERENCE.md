# PureBreeds API Reference Guide

**Endpoint:** `https://server.fcbc.fun/api/v1/zora/species?count=1234`  
**Status:** LIVE ✅  
**Updated:** 2026-02-15 14:19 UTC+1

---

## Quick Start

### Fetch All Species
```bash
curl "https://server.fcbc.fun/api/v1/zora/species?count=1234"
```

### Response Structure
```json
{
  "data": [
    {
      "symbol": "FCBC72",
      "name": "Snow Leopard",
      "id": "FCBC 72",
      "code": "22732/50664030",
      "status": "Vulnerable",
      "rarity": "Rare {3}",
      "description": "The Snow Leopard is a slender...",
      "about": "FCBC is a Club, a Collectible and a Game...",
      "image": "https://scontent-iad4-1.choicecdn.com/...",
      "price": 0,
      "priceChange24h": 6.5,
      "marketCap": 491.8,
      "marketCapFormatted": "$491.80",
      "volume24h": 6.5,
      "totalVolume": 48.371951,
      "circulatingSupply": 1000000000,
      "totalSupply": 1000000000,
      "holders": 18,
      "iucnStatus": "VU",
      "dnaSquares": 1000000000,
      "tokenAddress": "0xaf34629c15f74eaa79d722a3bbe083a251e9247b",
      "poolAddress": null,
      "poolCurrencyToken": {
        "address": "0x17d8d3c956a9b2d72257d7c9624cfcfd8ba8672b",
        "name": "warplette",
        "decimals": 18
      },
      "chainId": 8453,
      "creatorAddress": "0xae28916f0bc703fccbaf9502d15f838a1caa01b3",
      "tokenUri": "ipfs://bafybeifcrifm4cq44rvfmro2ptd24in6wuhdtc2sgpuwq4so4lgdvmytyy",
      "tradable": false,
      "voteCount": 0,
      "votes": [],
      "voteSquareAvg": { "totalVotes": 0, "average": 0 }
    }
    // ... 233 more species
  ]
}
```

---

## Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Ticker symbol (e.g., "FCBC72") |
| `name` | string | Common name (e.g., "Snow Leopard") |
| `tokenAddress` | string | Ethereum-like contract address on Base |
| `iucnStatus` | string | IUCN conservation status (CR, EN, VU, NT, LC, DD, EX) |
| `description` | string | Detailed species description + behavior |
| `image` | string | IPFS/CDN image URL |
| `marketCap` | number | Current market cap in USDC (approx) |
| `marketCapFormatted` | string | Human-readable market cap |
| `totalVolume` | number | Total trading volume lifetime |
| `volume24h` | number | 24-hour trading volume |
| `holders` | number | Number of token holders |
| `circulatingSupply` | number | Tokens in circulation (usually 1B) |
| `chainId` | number | Blockchain ID (8453 = Base) |
| `creatorAddress` | string | FCBC contract creator address |
| `voteCount` | number | Community votes (breeding preference indicator) |
| `rarity` | string | Collectible rarity tier (Common, Rare, Epic, Legendary, Mythic, Relic) |
| `status` | string | Conservation status (Least Concern → Near Extinct) |

---

## IUCN Status Codes

```
EX  = Extinct
EW  = Extinct in the Wild
CR  = Critically Endangered
EN  = Endangered
VU  = Vulnerable
NT  = Near Threatened
LC  = Least Concern
DD  = Data Deficient
NE  = Not Evaluated
```

---

## Rarity Tiers

```
Common {1}        = Most abundant, least rare
Uncommon {2}      = Regular collectibles
Rare {3}          = Sought-after variants
Epic {4}          = Scarce & valuable
Legendary {5}     = Extremely rare
Mythic {6}        = Extinct in wild
Relic {6}         = Living fossils (highest tier)
```

---

## Use Cases

### 1. Daily FunFacts
```javascript
// Select 2 random species
const species = apiResponse.data;
const species1 = species[Math.floor(Math.random() * species.length)];
const species2 = species[Math.floor(Math.random() * species.length)];

// Extract facts
console.log(`🦁 ${species1.name}`);
console.log(`Status: ${species1.iucnStatus}`);
console.log(`${species1.description}`);
console.log(`Contract: ${species1.tokenAddress}`);
```

### 2. Portfolio Tracking
```javascript
// Filter by user holdings (requires additional indexing)
const myHoldings = ['0xaf34629c15f74eaa79d722a3bbe083a251e9247b', '...'];
const portfolio = species.filter(s => myHoldings.includes(s.tokenAddress));

// Calculate total value
const totalValue = portfolio.reduce((sum, s) => sum + s.marketCap, 0);
```

### 3. Conservation Focus
```javascript
// Find all critically endangered species
const critical = species.filter(s => s.iucnStatus === 'CR');
critical.forEach(s => {
  console.log(`Help save: ${s.name}`);
  console.log(`Support: ${s.creatorAddress}`);
});
```

### 4. Trading Bot
```javascript
// Track volume & price trends
const active = species
  .filter(s => s.volume24h > 0)
  .sort((a, b) => b.volume24h - a.volume24h)
  .slice(0, 10);

console.log('Top traded species today:', active);
```

### 5. Breeding System Integration
```javascript
// Get vote scores (indicates breeding preference)
const mostBreedable = species
  .filter(s => s.voteCount > 0)
  .sort((a, b) => b.voteSquareAvg.average - a.voteSquareAvg.average);

console.log('Most desirable for breeding:', mostBreedable[0].name);
```

---

## Data Quality Notes

- **Prices:** May be 0 if token recently deployed
- **Votes:** Community voting feature (optional participation)
- **Pool:** Null = no liquidity pool yet; paired once trading volume established
- **Images:** Decentralized storage via IPFS CDN
- **Supply:** Fixed at 1B per species (standard ERC-20)

---

## Performance Tips

1. **Cache locally** - API is stable; cache for 1-6 hours
2. **Selective fetching** - Filter before processing (e.g., `iucnStatus === 'CR'`)
3. **Sort on client** - Reduce server load
4. **Rate limit** - Keep to 1 call per day per feature
5. **Async/await** - Use promises for non-blocking operations

---

## Integration Examples

### Python
```python
import requests
import random

response = requests.get('https://server.fcbc.fun/api/v1/zora/species?count=1234')
species = response.json()['data']

# Random species
random_species = random.choice(species)
print(f"{random_species['symbol']}: {random_species['name']}")
print(f"Status: {random_species['iucnStatus']}")
print(f"Market Cap: {random_species['marketCapFormatted']}")
```

### JavaScript
```javascript
async function getSpecies() {
  const res = await fetch('https://server.fcbc.fun/api/v1/zora/species?count=1234');
  const data = await res.json();
  return data.data;
}

// Get species by ticker
getSpecies().then(species => {
  const fcbc72 = species.find(s => s.symbol === 'FCBC72');
  console.log(fcbc72);
});
```

### cURL
```bash
# Get all species
curl "https://server.fcbc.fun/api/v1/zora/species?count=1234" \
  -H "Accept: application/json"

# Extract specific ticker
curl "https://server.fcbc.fun/api/v1/zora/species?count=1234" | \
  jq '.data[] | select(.symbol=="FCBC72")'
```

---

## CSV Export

**File:** `FCBC_SPECIES_LIST_TICKER_CA.csv`
- Simple format: Ticker | Contract Address
- 234 rows (FCBC1-234)
- Use for: Trading pairs, address lookups, API caching

---

## Rate Limits

- **Per minute:** No specific limit observed (generous)
- **Recommended:** 1 call/day per application feature
- **Burst:** Safe for 10-100 calls in succession
- **Max:** Unlimited; expect ~100-200ms response time

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Connection refused` | Endpoint temporarily down; retry with exponential backoff |
| `Empty data array` | Try without count parameter or reduce count value |
| `Missing fields` | API schema may have changed; check field existence before use |
| `Stale prices` | Cache refresh every 6 hours; prices update as trades occur |

---

## Support & Feedback

- **API Status:** Check `server.fcbc.fun` directly
- **Issues:** Report to Creator Address: `0xae28916f0bc703fccbaf9502d15f838a1caa01b3`
- **Updates:** Follow @warplette for API changelog announcements

---

**Last Updated:** 2026-02-15  
**API Version:** 1.0  
**Blockchain:** Base (Coinbase L2)  
**Contract:** Standard ERC-20 (1B supply per species)

*Learn about endangered species. Collect DNA tokens. Make impact.*
