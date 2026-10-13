import { useEffect, useState } from 'react';
import { assetUrl } from '../services/api';

const ICONS = {
  footwear: '👟', accessories: '👜', dresses: '👗', ethnic: '🥻', jeans: '👖', trousers: '👖',
  jackets: '🧥', sweaters: '🧶', tshirts: '👕', shirts: '👔', tops: '👚', activewear: '🎽',
};

/** Image with a graceful, on-brand fallback — never a broken image icon. */
export default function ItemImage({ src, alt, category, className = '' }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={`rw-img-fallback ${className}`} role="img" aria-label={alt || 'No photo'}>
        <span aria-hidden="true">{ICONS[category] || '👕'}</span>
        <small>Curated Garment</small>
      </div>
    );
  }
  return <img src={assetUrl(src)} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}
