export const qualities = [
  { id: 'premium', name: 'ممتاز', tone: 'green', adjustment: 0.12 },
  { id: 'first', name: 'درجه یک', tone: 'amber', adjustment: 0 },
  { id: 'standard', name: 'استاندارد', tone: 'slate', adjustment: -0.08 },
];

export const areas = [
  { id: 'sari', name: 'مرکز ساری', distances: [3, 8, 14] },
  { id: 'farahabad', name: 'فرح‌آباد', distances: [12, 4, 19] },
  { id: 'south-sari', name: 'جنوب ساری', distances: [10, 16, 5] },
];

const sellers = [
  { id: 'sarv', name: 'نهاده سبز سرو', location: 'ساری، بلوار کشاورز', delivery: 'ارسال امروز', adjustment: 0.04, qualities: ['premium', 'first'] },
  { id: 'baran', name: 'تعاونی کشت باران', location: 'جاده فرح‌آباد', delivery: 'ارسال روز کاری بعد', adjustment: 0, qualities: ['first', 'standard'] },
  { id: 'rooyesh', name: 'فروشگاه رویش مازندران', location: 'ساری، مسیر تاکام', delivery: 'ارسال روز کاری بعد', adjustment: 0.02, qualities: ['premium', 'first', 'standard'] },
];

export function marketplaceOffer(product, sellerId, qualityId) {
  const seller = sellers.find(seller => seller.id === sellerId);
  const quality = qualities.find(quality => quality.id === qualityId);
  if (!product.orderable || !seller || !quality || !seller.qualities.includes(qualityId)) return null;

  return {
    sellerId,
    qualityId,
    sellerName: seller.name,
    qualityName: quality.name,
    unitPrice: Math.round(product.price * (1 + seller.adjustment + quality.adjustment) / 1000) * 1000,
  };
}

export function nearbyOffers(product, area, qualityId) {
  return sellers.map((seller, index) => ({
    ...seller,
    offer: marketplaceOffer(product, seller.id, qualityId),
    distance: area.distances[index],
  })).filter(seller => seller.offer).sort((a, b) => a.distance - b.distance);
}
