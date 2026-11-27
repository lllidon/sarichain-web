'use client';

import { useState } from 'react';

const fallbackImage = '/img/catalog/field.webp';

export default function SafeCategoryImage({ src }) {
  const [failed, setFailed] = useState(false);
  return <img
    src={!src || failed ? fallbackImage : src}
    alt=""
    loading="lazy"
    onError={() => setFailed(true)}
  />;
}
