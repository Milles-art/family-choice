import { useEffect } from 'react';
import site from '../../backend/resources/seo/site.json';
import { useStore } from '../store';
import { getProductById, products } from '../data';
import { pageUrl } from '../routing';
export function PageSeo() {
  const { page, catalogReady, catalogVersion } = useStore();
  useEffect(() => {
    if (page.name === 'product' && !catalogReady) return;
    const path = pageUrl(page).split('?')[0];
    const pages = site.pages as Record<string, string[]>;
    const categories = site.categories as Record<string, string>;
    const privateTitles: Record<string,string> = {account:'My account',cart:'Basket',checkout:'Checkout',wishlist:'Wishlist',track:'Track your order','forgot-password':'Forgot password','reset-password':'Reset password'};
    let [label, description] = pages[path] ?? [privateTitles[page.name] ?? 'Page not found', 'FAMILY CHOICE SUPERMARKET in Morogoro.'];
    let indexable = Boolean(pages[path]);
    let canonical = site.origin + path;
    let image = site.origin + '/images/brand/social-sharing.png';
    const product = page.name === 'product' ? getProductById(page.productId) : undefined;
    if (page.name === 'product') {
      indexable = Boolean(product);
      if (product) { label = product.name; description = `${product.name} — ${product.unit}. ${product.description ?? ''}`.slice(0,155); canonical = site.origin + pageUrl(page); image = new URL(product.image, site.origin).href; }
    }
    if (page.name === 'catalog') {
      canonical = site.origin + pageUrl({...page, searchQuery:undefined});
      if (page.categoryId) { label = categories[page.categoryId] ?? 'Category not found'; indexable = Boolean(categories[page.categoryId]); description = `Browse ${label} at FAMILY CHOICE SUPERMARKET in Morogoro. See current prices, pack sizes and stock information.`; }
      if (catalogReady) { const eligible = products.filter(p => !page.categoryId || p.categoryId === page.categoryId); if (!eligible.length || (page.pageNumber ?? 1) > Math.ceil(eligible.length / 24)) indexable = false; }
      if (page.searchQuery) { label = `Search: ${page.searchQuery}`; indexable = false; }
      if ((page.pageNumber ?? 1) > 1) label += ` — Page ${page.pageNumber}`;
    }
    if (catalogReady && page.name === 'deals' && !products.some(p => (p.originalPrice ?? 0) > p.price)) indexable = false;
    if (catalogReady && page.name === 'new-arrivals' && !products.some(p => p.tags.includes('new'))) indexable = false;
    if (page.name === 'not-found') canonical = site.origin + window.location.pathname;
    document.title = `${label} | ${site.name}`;
    const meta = (key:string, content:string, property=false) => {
      const attr = property ? 'property' : 'name';
      let node = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!node) { node = document.createElement('meta'); node.setAttribute(attr,key); document.head.append(node); }
      node.content = content;
    };
    meta('description',description); meta('robots',indexable ? 'index, follow' : 'noindex, follow');
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.append(link); }
    link.href = canonical;
    for (const [key,value] of Object.entries({title:document.title,description,url:canonical,image,type:product?'product':'website',site_name:site.name,locale:'en_TZ'})) meta(`og:${key}`,value,true);
    meta('twitter:card','summary_large_image'); meta('twitter:title',document.title); meta('twitter:description',description); meta('twitter:image',image);
    let schema = document.getElementById('storefront-schema');
    if (!schema) { schema = document.createElement('script'); schema.id = 'storefront-schema'; schema.setAttribute('type','application/ld+json'); document.head.append(schema); }
    const business = {'@type':'GroceryStore','@id':site.origin+'/#store',name:site.name,url:site.origin+'/',telephone:site.phone,email:site.email,logo:site.origin+'/images/brand/family-choice-logo.svg',image:site.origin+'/images/brand/social-sharing.png',address:{'@type':'PostalAddress',streetAddress:'Mafiga Shell',addressLocality:'Morogoro',addressCountry:'TZ'},areaServed:{'@type':'City',name:'Morogoro'}};
    const graph: Record<string,unknown>[] = [business, {'@type':'WebSite','@id':site.origin+'/#website',url:site.origin+'/',name:site.name}, {'@type':'WebPage',url:canonical,name:label}];
    if (path !== '/') graph.push({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:site.origin+'/'},{'@type':'ListItem',position:2,name:label,item:canonical}]});
    if (product) {
      const entry: Record<string,unknown> = {'@type':'Product',name:product.name,sku:product.id,url:canonical,description:product.description || product.name,image:[image]};
      if (product.priceType === 'store-confirmed' && product.stockStatus !== 'unverified' && Number.isFinite(product.price) && product.price > 0) entry.offers = {'@type':'Offer',url:canonical,priceCurrency:'TZS',price:product.price.toFixed(2),availability:'https://schema.org/'+(product.inStock?'InStock':'OutOfStock'),seller:{'@id':site.origin+'/#store'}};
      graph.push(entry);
    }
    schema.textContent = JSON.stringify(indexable ? {'@context':'https://schema.org','@graph':graph} : {});
    schema.dataset.url = canonical;
  }, [page, catalogReady, catalogVersion]);
  return null;
}
