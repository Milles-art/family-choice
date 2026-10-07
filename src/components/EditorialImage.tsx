import { editorialDimensions } from '../editorialDimensions';

type Props = { name: string; alt: string; className?: string; sizes?: string; eager?: boolean };

export function EditorialImage({ name, alt, className = '', sizes = '(min-width: 768px) 50vw, 100vw', eager = false }: Props) {
  const category = name.startsWith('category-');
  const widths = category ? [320, 640, 960] : [480, 960, 1440];
  const dimensions = editorialDimensions[name] ?? { width: widths[1], height: category ? widths[1] : 640 };
  return <img src={`/images/editorial/${name}-${widths[1]}.webp`} srcSet={widths.map(w => `/images/editorial/${name}-${w}.webp ${w}w`).join(', ')} sizes={sizes} width={dimensions.width} height={dimensions.height} alt={alt} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" className={`w-full object-cover ${className}`}/>;
}
