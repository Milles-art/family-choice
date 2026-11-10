import fs from 'node:fs';const products=JSON.parse(fs.readFileSync('backend/database/seeders/data/products.json','utf8'));
const groups=new Map();for(const p of products){const list=groups.get(p.image)||[];list.push(`${p.id}: ${p.name}`);groups.set(p.image,list);}
const brands=products.filter(p=>/coca|pepsi|nutella|kellogg|nescaf|tide|heinz|nestl|dove|colgate/i.test(p.name));
const badPrices=products.filter(p=>p.price<=0||p.originalPrice&&p.originalPrice<=p.price);
const flags={duplicateImages:[...groups].filter(([,v])=>v.length>1).map(([image,products])=>({image,products})),brandedStockPhotoReview:brands.map(p=>({id:p.id,name:p.name,image:p.image,price:p.price})),invalidPriceRelationships:badPrices};fs.writeFileSync('artifacts/ui/content-flags.json',JSON.stringify(flags,null,2));console.log(JSON.stringify(flags,null,2));
