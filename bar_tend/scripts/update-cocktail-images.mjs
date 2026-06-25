import fs from 'fs';
import path from 'path';
import { apiCocktails } from './api-cocktails.js';

const DB_PATH = path.resolve('src/data/cocktail-db.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

// Manual mappings for missing from local cache
const manualMappings = {
  'Last Word': 'https://www.thecocktaildb.com/images/media/drink/91oule1513702624.jpg',
  'Boulevardier': 'https://www.thecocktaildb.com/images/media/drink/km84qi1513705868.jpg',
  'Black Russian': 'https://www.thecocktaildb.com/images/media/drink/8oxlqf1606772765.jpg',
  'Mai-Tai': 'https://www.thecocktaildb.com/images/media/drink/twyrrp1439907470.jpg',
  "Dark 'N' Stormy": 'https://www.thecocktaildb.com/images/media/drink/t1tn0s1504374905.jpg',
  'Bloody Mary': 'https://www.thecocktaildb.com/images/media/drink/t6caa21582485702.jpg',
  'Singapore Sling': 'https://www.thecocktaildb.com/images/media/drink/7dozeg1582578095.jpg',
  'Aperol Spritz': 'https://www.thecocktaildb.com/images/media/drink/iloasq1587661955.jpg',
  
  // Local generated assets
  'Paper Plane': '/images/cocktails/paper_plane.jpg',
  'Painkiller': '/images/cocktails/painkiller.jpg',
  'XYZ': '/images/cocktails/xyz.jpg',
  'PUKEY Goddess Shot': '/images/cocktails/pukey_goddess_shot.jpg',
  'Glitch Rain': '/images/cocktails/glitch_rain.jpg'
};

let updatedCount = 0;

db.cocktails = db.cocktails.map(c => {
  if (c.image) return c; // Keep existing image
  
  const engName = c.name_en || c.name;
  
  // 1. Check manual mapping by English name
  if (engName && manualMappings[engName]) {
    c.image = manualMappings[engName];
    updatedCount++;
    console.log(`Mapped manually: ${c.name_ko} (${engName}) -> ${c.image}`);
    return c;
  }
  
  // 2. Check local cache
  if (engName) {
    const match = apiCocktails.find(a => a && a.name && a.name.toLowerCase() === engName.toLowerCase());
    if (match && match.image) {
      c.image = match.image;
      updatedCount++;
      console.log(`Mapped from cache: ${c.name_ko} (${engName}) -> ${c.image}`);
      return c;
    }
  }

  console.warn(`WARNING: No image found for ${c.name_ko} (${engName})`);
  return c;
});

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
console.log(`\nSuccessfully updated ${updatedCount} cocktail images in cocktail-db.json.`);
