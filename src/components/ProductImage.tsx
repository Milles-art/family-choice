import { useState, type ImgHTMLAttributes } from 'react';
import { Package } from 'lucide-react';
export function ProductImage({ alt, className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed,setFailed] = useState(false);
  return failed ? <span role="img" aria-label={`${alt || 'Product'}: image unavailable`} className={`flex flex-col items-center justify-center gap-2 bg-gray-50 text-gray-500 ${className ?? ''}`}><Package className="w-8 h-8" aria-hidden="true"/><span className="text-xs text-center">Image unavailable</span></span> : <img {...props} alt={alt} className={className} onError={()=>setFailed(true)}/>;
}
