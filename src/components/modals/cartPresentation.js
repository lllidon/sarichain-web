import { catalogQuantityLimit, isCartProduct } from '../Products/cartData';
import { productPackages, withOffer } from '../Products/catalog';

export function displayCart(cart, catalog, account) {
  const purchasable = catalog.flatMap(product => [product, ...product.variants]);
  return cart.map(item => {
    const catalogItem = purchasable.find(product => isCartProduct(item, product));
    const actualOffer = catalogItem && (item.offerId ? catalogItem.offers.find(offer => offer.id === item.offerId) : catalogItem.offer);
    const offer = account && item.available ? {
      id: item.offerId, name: item.sellerName, price: item.price / item.amount, stock: item.stock,
    } : actualOffer;
    const product = catalogItem && withOffer(catalogItem, offer);
    const packs = product?.orderable ? productPackages(product) : [];
    const pack = account
      ? item.available && item.price !== null && { id: item.unitId, name: item.unitName, amount: item.amount, price: { min: item.price, max: item.price } }
      : packs.find(option => option.id === item.unitId);
    const availableUnits = !pack ? [] : packs.filter(option => !cart.some(line => isCartProduct(line, product) &&
      (line.offerId ?? catalogItem.offer?.id) === offer?.id && line.unitId === option.id) &&
      catalogQuantityLimit(cart, product, option, catalog) >= 1);
    const maxQuantity = !pack ? 0 : product
      ? catalogQuantityLimit(cart, product, pack, catalog, item.offerId ?? null) : Math.floor(item.stock / item.amount);
    return { ...item, product, pack, availableUnits, maxQuantity };
  });
}
