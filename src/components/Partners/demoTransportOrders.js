const stop = (kind, label, city, address, latitude, longitude, province = 'مازندران') =>
  ({ kind, label, province, city, address, latitude, longitude });

const sari = [
  [36.5633,53.0601],[36.5701,53.0478],[36.5512,53.0731],[36.5814,53.0352],
  [36.5448,53.0502],[36.5902,53.0681],[36.5584,53.0208],[36.5758,53.0882],
  [36.5356,53.0834],[36.6001,53.0527],[36.5481,53.0365],[36.5852,53.0791],
  [36.5668,53.0982],[36.5269,53.0612],[36.6071,53.0304],[36.5572,53.1051],
];
const sariStop = (kind, label, index) => stop(kind, label, 'ساری', 'محدوده نمونه ' + (index + 1), ...sari[index % sari.length]);

const intraSpecs = [
  ['میوه و سبزی تازه', 620, 3.2, 'daily', 2, 2],
  ['بسته‌های فروشگاهی', 180, 1.1, 'hourly', 1, 3],
  ['محصولات لبنی', 950, 4.8, 'daily', 3, 2],
  ['مصالح ساختمانی سبک', 1250, 5.5, 'multiday', 2, 4],
  ['گل و گیاه', 240, 2.4, 'hourly', 4, 3],
  ['کارتن و بسته‌بندی', 410, 3.1, 'daily', 1, 2],
  ['محصولات کشاورزی', 780, 4.2, 'daily', 3, 4],
  ['لوازم فروشگاهی', 330, 2.0, 'multiday', 2, 3],
  ['بار سردخانه‌ای', 1100, 6.5, 'hourly', 4, 2],
  ['تجهیزات و قطعات', 520, 3.6, 'daily', 2, 4],
];

export const demoTransportOrders = {
  intracity: intraSpecs.map(([goodsType, weightKg, volumeM3, urgency, pickupCount, dropoffCount], index) => ({
    _id: 'demo-intra-' + (index + 1), kind: 'job', isDemo: true, status: 'approved',
    goodsType, weightKg, volumeM3, urgency, deadline: new Date('2026-11-27T' + String(8 + index).padStart(2, '0') + ':00:00+03:30').toISOString(),
    createdAt: new Date('2026-11-25T' + String(10 + index).padStart(2, '0') + ':00:00+03:30').toISOString(),
    quote: { category: 'intracity', distanceKm: 4 + index * 1.7, standardKar: 2 + index * .1, specialKar: 3 + index * .15 },
    stops: [
      ...Array.from({ length: pickupCount }, (_, i) => sariStop('pickup', 'مبدأ ' + (i + 1), index + i)),
      ...Array.from({ length: dropoffCount }, (_, i) => sariStop('dropoff', 'مقصد ' + (i + 1), index + pickupCount + i + 4)),
    ],
  })),
  intercity: [
    {
      _id: 'demo-intercity-1', kind: 'job', isDemo: true, status: 'approved', goodsType: 'محصولات بسته‌بندی‌شده',
      weightKg: 680, volumeM3: 4.1, urgency: 'daily', deadline: new Date('2026-11-27T18:00:00+03:30').toISOString(),
      createdAt: new Date('2026-11-25T12:00:00+03:30').toISOString(),
      quote: { category: 'intercity', distanceKm: 19.4, standardKar: 2.8, specialKar: 4.2 },
      stops: [
        stop('pickup','انبار ساری','ساری','محدوده نمونه انبار',36.5633,53.0601),
        stop('pickup','مرکز جمع‌آوری','ساری','محدوده نمونه مرکز',36.5814,53.0352),
        stop('dropoff','مرکز توزیع','قائم‌شهر','محدوده نمونه توزیع',36.4631,52.8603),
        stop('dropoff','فروشگاه مقصد','قائم‌شهر','محدوده نمونه فروشگاه',36.4552,52.8751),
      ],
    },
    {
      _id: 'demo-intercity-2', kind: 'job', isDemo: true, status: 'approved', goodsType: 'بار کشاورزی',
      weightKg: 920, volumeM3: 5.7, urgency: 'hourly', deadline: new Date('2026-11-27T14:00:00+03:30').toISOString(),
      createdAt: new Date('2026-11-25T13:00:00+03:30').toISOString(),
      quote: { category: 'intercity', distanceKm: 21.8, standardKar: 3, specialKar: 4.5 },
      stops: [
        stop('pickup','بارگیری ساری','ساری','محدوده نمونه بارگیری',36.5512,53.0731),
        stop('dropoff','مقصد اول','نکا','محدوده نمونه اول',36.6508,53.2990),
        stop('dropoff','مقصد دوم','نکا','محدوده نمونه دوم',36.6591,53.3102),
      ],
    },
  ],
  interprovincial: [{
    _id: 'demo-interprovincial-1', kind: 'job', isDemo: true, status: 'approved', goodsType: 'بار تجاری بین‌استانی',
    weightKg: 1450, volumeM3: 8.2, urgency: 'multiday', deadline: new Date('2026-11-29T18:00:00+03:30').toISOString(),
    createdAt: new Date('2026-11-25T14:00:00+03:30').toISOString(),
    quote: { category: 'interprovincial', distanceKm: 126, standardKar: 5.5, specialKar: 8.25 },
    stops: [
      stop('pickup','مرکز بارگیری','ساری','محدوده نمونه بارگیری',36.5633,53.0601),
      stop('pickup','انبار تکمیلی','ساری','محدوده نمونه انبار',36.5902,53.0681),
      stop('dropoff','مرکز توزیع گلستان','گرگان','محدوده نمونه توزیع',36.8390,54.4400,'گلستان'),
      stop('dropoff','فروشگاه مقصد','گرگان','محدوده نمونه فروشگاه',36.8501,54.4250,'گلستان'),
    ],
  }],
};
