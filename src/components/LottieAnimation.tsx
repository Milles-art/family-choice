import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
const Player = lazy(() => import('@lottiefiles/dotlottie-react').then(module => ({ default: module.DotLottieReact })));
const sources = {
  groceryDelivery: 'https://assets-v2.lottiefiles.com/a/c6342f07-d274-473b-8f8a-dd972706ae5b/zjdQOJcE1S.lottie',
  shoppingCart: 'https://assets-v2.lottiefiles.com/a/49330c42-ef4a-11ef-9057-e33728d07f2b/zrBsm1tC6k.lottie',
  emptyCart: 'https://assets-v2.lottiefiles.com/a/b6182608-1152-11ee-ade3-1f7ed6c4c3bd/Q6YDMrelee.lottie',
  orderConfirmed: 'https://assets-v2.lottiefiles.com/a/0a2c35f2-118c-11ee-a60a-d33cbccf8d5b/mijjitjqog.lottie',
};
export function LottieAnimation({ animation, className, label, loop = false }: {animation:keyof typeof sources; className?:string;label:string;loop?:boolean}) {
  const [reduced,setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible,setVisible] = useState(false);
  const [hidden,setHidden] = useState(document.hidden);
  const [paused,setPaused] = useState(false);
  const [failed,setFailed] = useState(false);
  const [started,setStarted] = useState(false);
  const [complete,setComplete] = useState(false);
  const player = useRef<{ play:()=>void; pause:()=>void } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)'); const motion = () => setReduced(media.matches); const visibility = () => setHidden(document.hidden);
    media.addEventListener('change',motion); document.addEventListener('visibilitychange',visibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting)); if(ref.current) observer.observe(ref.current);
    return () => { media.removeEventListener('change',motion); document.removeEventListener('visibilitychange',visibility); observer.disconnect(); };
  },[]);
  useEffect(() => { if (visible && !hidden && !reduced) setStarted(true); },[visible,hidden,reduced]);
  useEffect(() => { if (visible && !hidden && !paused && !reduced && !complete) player.current?.play(); else player.current?.pause(); },[visible,hidden,paused,reduced,complete]);
  const Icon = animation === 'orderConfirmed' ? CheckCircle2 : ShoppingBag;
  const fallback = <Icon className="w-2/3 h-2/3 text-green-700" aria-hidden="true"/>;
  return <div ref={ref} className={`relative flex items-center justify-center ${className ?? ''}`} role="img" aria-label={label}>{!reduced && started && !failed ? <Suspense fallback={fallback}><Player src={sources[animation]} autoplay={!hidden && visible && !paused && !complete} loop={loop} className="w-full h-full" dotLottieRefCallback={instance => { player.current = instance; instance?.addEventListener('loadError',() => setFailed(true)); instance?.addEventListener('complete',() => { if (!loop) setComplete(true); }); }}/></Suspense> : fallback}{loop && !reduced && <button className="absolute bottom-0 bg-white rounded px-2 text-xs" aria-label={paused ? 'Play animation' : 'Pause animation'} onClick={() => setPaused(value=>!value)}>{paused ? 'Play' : 'Pause'}</button>}</div>;
}
