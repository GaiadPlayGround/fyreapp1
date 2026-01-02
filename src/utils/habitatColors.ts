// 7 fixed habitat-based colors for electric borders
export const HABITAT_COLORS = [
  '#005ae0', // Ocean Blue - Marine/Aquatic
  '#00a86b', // Jade Green - Forest/Jungle
  '#ffd700', // Golden Yellow - Savanna/Grassland
  '#9b59b6', // Royal Purple - Mountain/Alpine
  '#e74c3c', // Crimson Red - Desert/Arid
  '#f39c12', // Amber Orange - Tropical
  '#1abc9c', // Teal - Wetland/Swamp
] as const;

// Get a deterministic color based on species region/habitat
export const getHabitatColor = (region: string, id: string): string => {
  const regionLower = region.toLowerCase();
  
  // Ocean/Marine
  if (regionLower.includes('ocean') || regionLower.includes('sea') || regionLower.includes('marine') || regionLower.includes('arctic') || regionLower.includes('pacific') || regionLower.includes('atlantic')) {
    return HABITAT_COLORS[0];
  }
  
  // Forest/Jungle
  if (regionLower.includes('forest') || regionLower.includes('jungle') || regionLower.includes('rainforest') || regionLower.includes('borneo') || regionLower.includes('sumatra') || regionLower.includes('amazon') || regionLower.includes('congo')) {
    return HABITAT_COLORS[1];
  }
  
  // Savanna/Grassland
  if (regionLower.includes('savanna') || regionLower.includes('africa') || regionLower.includes('plains') || regionLower.includes('grassland') || regionLower.includes('prairie')) {
    return HABITAT_COLORS[2];
  }
  
  // Mountain/Alpine
  if (regionLower.includes('mountain') || regionLower.includes('himalaya') || regionLower.includes('andes') || regionLower.includes('alpine') || regionLower.includes('tibet') || regionLower.includes('highland')) {
    return HABITAT_COLORS[3];
  }
  
  // Desert/Arid
  if (regionLower.includes('desert') || regionLower.includes('sahara') || regionLower.includes('arabia') || regionLower.includes('arid') || regionLower.includes('gobi')) {
    return HABITAT_COLORS[4];
  }
  
  // Tropical
  if (regionLower.includes('tropical') || regionLower.includes('indonesia') || regionLower.includes('malaysia') || regionLower.includes('philippines') || regionLower.includes('madagascar') || regionLower.includes('galapagos')) {
    return HABITAT_COLORS[5];
  }
  
  // Wetland/Swamp
  if (regionLower.includes('wetland') || regionLower.includes('swamp') || regionLower.includes('marsh') || regionLower.includes('river') || regionLower.includes('lake')) {
    return HABITAT_COLORS[6];
  }
  
  // Fallback: use ID to pick a color deterministically
  const idNum = parseInt(id.replace(/\D/g, '')) || 0;
  return HABITAT_COLORS[idNum % HABITAT_COLORS.length];
};
