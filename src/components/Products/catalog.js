export function productImage(product) {
  const image = product.image || '/img/catalog/field.webp';
  return image.startsWith('/catalog-demo/') ? '/web' + image : image;
}

const packaging = {
  bottle: { name: 'بطری', amount: 1 },
  bag: { name: 'کیسه', amount: 1 },
  box: { name: 'جعبه', amount: 4 },
  carton: { name: 'کارتن', amount: 6 },
  jug: { name: 'گالن', amount: 5 },
};

const packageCodes = {
  '1001': ['bottle', 'carton'],
  '1002': ['bag', 'box'],
  '1003': ['bottle', 'carton'],
  '1004': ['bag', 'box'],
  '1005': ['bottle', 'carton'],
  '1006': ['bottle', 'carton'],
  '1007': ['bag', 'box'],
  '1008': ['bottle', 'jug'],
};

export function productPackages(product) {
  return (packageCodes[product.code.replace(/^SC-/, '')] ?? (product.form === 'پودری' ? ['bag', 'box'] : ['bottle', 'carton'])).map(id => ({
    id,
    ...packaging[id],
    price: product.price * packaging[id].amount,
  }));
}

export function productHref(product) {
  return `/products/${encodeURIComponent(product.code)}`;
}
