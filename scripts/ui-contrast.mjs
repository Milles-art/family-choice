import fs from 'node:fs';
const luminance=hex=>{const c=hex.replace('#','').match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
const pairs=[['Primary button','#ffffff','#166534'],['Body text','#172b22','#f5f7f3'],['Muted text','#52635a','#ffffff'],['Secondary text','#647269','#f5f7f3'],['Errors','#b91c1c','#ffffff'],['Hero title','#052e16','#e9f1df']];
const results=pairs.map(([name,fg,bg])=>{const l=[luminance(fg),luminance(bg)].sort((a,b)=>b-a);return {name,foreground:fg,background:bg,ratio:Number(((l[0]+.05)/(l[1]+.05)).toFixed(2)),bodyAA:(l[0]+.05)/(l[1]+.05)>=4.5};});fs.writeFileSync('artifacts/ui/contrast-checks.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
