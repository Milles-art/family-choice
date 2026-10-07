import { HeroSlideshow } from './HeroSlideshow';
import { useStore } from '../store';
import { categories, getDealProducts, getBestSellers, getNewArrivals, recipes } from '../data';
import { ProductCard } from './ProductCard';
import { ArrowRight, Truck, ShoppingBag, ShieldCheck, Clock, PackageCheck, MapPin } from 'lucide-react';
import { imageSet } from '../images';
import { settings } from '../api';
import { formatTzs } from '../currency';
import type { Product, Page } from '../types';
import { SectionSkeleton } from './LoadingState';

export function HomePage() {
  const { navigate, settingsReady, catalogReady, catalogError, retryCatalog } = useStore();
  const shop = () => navigate({name:'catalog'});
  const selected = new Set<string>();
  const select = (items: Product[]) => {
    const result = items.filter(product => !selected.has(product.id)).slice(0, 6);
    result.forEach(product => selected.add(product.id));
    return result;
  };
  const sections: { title: string; items: Product[]; page: Page }[] = [
    { title: 'Deals', items: select(getDealProducts()), page: {name:'deals'} },
    { title: 'Best sellers', items: select(getBestSellers()), page: {name:'catalog'} },
    { title: 'New arrivals', items: select(getNewArrivals()), page: {name:'new-arrivals'} },
  ];
  return <div className="fc-home">
    <HeroSlideshow/>
    <section className="store-container fc-section"><div data-reveal className="fc-section-heading"><div><h2>Shop by Category</h2><p>Everything on your list, in its own little aisle.</p></div><button className="fc-text-button" onClick={shop}>Shop all <ArrowRight size={18}/></button></div><div className="fc-category-grid" data-reveal-group>{categories.map(category => <button key={category.id} className="fc-category" onClick={() => navigate({name:'catalog',categoryId:category.id})}><img src={category.image} srcSet={imageSet(category.image)} sizes="(min-width: 1280px) 12vw, (min-width: 640px) 25vw, 50vw" width={640} height={640} alt={category.name} loading="lazy" decoding="async"/><span>{category.name}</span></button>)}</div></section>
    <div className="home-lower">
      {!catalogReady && catalogError && <div className="store-container lower-section"><div className="surface p-6"><h2>The catalogue is unavailable</h2><p role="alert" className="my-3">{catalogError}</p><button className="button-primary" onClick={retryCatalog}>Retry catalogue</button></div></div>}
      {(catalogReady || !catalogError) && sections.map(section => <section key={section.title} className="lower-product-section lower-section" aria-label={section.title}>
        <div className="store-container">
          <div data-reveal className="lower-section-heading"><h2>{section.title}</h2><button className="lower-link" aria-label={`View all ${section.title.toLowerCase()}`} onClick={() => navigate(section.page)}>View all <ArrowRight size={18}/></button></div>
          {!catalogReady ? <SectionSkeleton cards={6} label={`Loading ${section.title.toLowerCase()}`}/> : section.items.length ? <div data-reveal className="lower-product-grid">{section.items.map(product => <ProductCard key={product.id} product={product} onQuickView={p => navigate({name:'product',productId:p.id})}/>)}</div> : <div className="lower-empty"><p>No additional {section.title.toLowerCase()} to feature right now.</p><button className="lower-link" onClick={() => navigate(section.page)}>Browse {section.title.toLowerCase()} <ArrowRight size={18}/></button></div>}
        </div>
      </section>)}
      <section className="lower-services" aria-label="Shopping services"><div className="store-container lower-service-grid" data-reveal-group>{[
        {icon:Truck,title:'Delivery information',text:settingsReady ? `${formatTzs(settings.delivery_cents/100)} delivery. Free delivery from ${formatTzs(settings.free_delivery_cents/100)} in groceries. Review available areas at checkout.` : 'See available areas and delivery fees at checkout.'},
        {icon:ShoppingBag,title:'Delivery or pickup',text:'Choose how to receive your groceries at checkout.'},
        {icon:ShieldCheck,title:'Clear checkout totals',text:'Groceries, delivery and tax are shown separately.'},
      ].map(item => <div className="lower-service" key={item.title}><item.icon size={24} aria-hidden="true"/><div><h3>{item.title}</h3><p>{item.text}</p></div></div>)}</div></section>
      <section className="fc-steps" aria-labelledby="home-steps-title"><div className="store-container fc-steps-inner">
        <div data-reveal><h2 id="home-steps-title">Shopping made simple</h2><p className="fc-steps-sub">Three easy steps from your list to your door.</p></div>
        <div className="fc-steps-grid" data-reveal-group>{[
          {icon:ShoppingBag,title:'Choose your items',text:'Browse the aisles or search to fill your cart with everyday essentials.'},
          {icon:MapPin,title:'Pick delivery or pickup',text:'Add your address and choose the option that suits you at checkout.'},
          {icon:PackageCheck,title:'Review and receive',text:'Check your totals before you place the order, then receive your groceries.'},
        ].map((step,i) => <div className="fc-step" key={step.title}><span className="fc-step-num" aria-hidden="true">{i+1}</span><h3>{step.title}</h3><p>{step.text}</p></div>)}</div>
        <div data-reveal className="fc-steps-cta"><button className="button-primary" onClick={shop}>Start shopping <ArrowRight size={18}/></button><button className="fc-steps-link" onClick={() => navigate({name:'info',section:'how-it-works'})}>How ordering works</button></div>
      </div></section>
      <section className="lower-section store-container" aria-labelledby="home-recipes-title">
        <div data-reveal className="lower-section-heading"><h2 id="home-recipes-title">Recipe inspiration</h2><button className="lower-link" onClick={()=>navigate({name:'recipes'})}>All recipes <ArrowRight size={18}/></button></div>
        <div className="lower-recipes" data-reveal-group>{recipes.slice(0,3).map(recipe=><button key={recipe.id} className="lower-recipe" aria-label={`Explore recipe: ${recipe.name}`} onClick={()=>navigate({name:'recipes'})}><div className="lower-recipe-image"><img src={recipe.image} srcSet={imageSet(recipe.image)} sizes="(min-width: 768px) 33vw, 100vw" width={960} height={640} loading="lazy" decoding="async" alt={recipe.name}/></div><div className="lower-recipe-body"><span className="lower-recipe-time"><Clock size={15} aria-hidden="true"/>{recipe.prepTime}</span><h3>{recipe.name}</h3><span className="lower-link">Explore recipe <ArrowRight size={18}/></span></div></button>)}</div>
      </section>
    </div>
  </div>;
}
