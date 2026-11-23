import { productPackages } from './catalog';

const number = new Intl.NumberFormat('fa-IR');
const sample = text => ({ text, example: true });

function SpecRow({ name, value }) {
  return <div className="product-spec-row">
    <dt>{name}</dt>
    <dd>{typeof value === 'object' ? <><span>{value.text}</span><span className="product-example">نمونه</span></> : value}</dd>
  </div>;
}

export default function ProductSpecifications({ product, category, description, selected, hidden }) {
  const dimensions = selected.physical?.shippingDimensions;
  const qualities = [...new Set([product, ...product.variants].flatMap(item =>
    item.options.filter(option => /کیف|درجه/.test(option.name)).map(option => option.value)))];
  const options = [
    ...product.options.filter(option => !selected.options.some(current => current.name === option.name)),
    ...selected.options,
  ];
  const units = productPackages(selected).filter(unit => unit.amount > 1);
  const rows = [
    ['شکل محصول', selected.form || product.form || sample('بسته‌بندی معمولی')],
    [category.filter, selected.detail || product.detail || sample('مصرف روزمره')],
    ['کیفیت‌های محصول', qualities.length ? qualities.join('، ') : sample('درجه ۱، درجه ۲ و ممتاز')],
    ['واحد اصلی', selected.unit],
    ['واحدهای فرعی', units.length ? units.map(unit => `هر ${unit.name} برابر ${number.format(unit.amount)} ${selected.unit}`).join('، ') : sample(`هر بسته برابر ۳۰ ${selected.unit}`)],
    ['ابعاد بسته', dimensions ? [dimensions.lengthMm, dimensions.widthMm, dimensions.heightMm].map(value => number.format(value)).join(' × ') + ' میلی‌متر' : sample('۴۰۰ × ۳۰۰ × ۲۰۰ میلی‌متر')],
    ['وزن حمل', selected.physical?.shippingWeightG != null ? number.format(selected.physical.shippingWeightG) + ' گرم' : sample('۱٬۰۰۰ گرم')],
    ['چگالی استاندارد', selected.physical?.standardDensityKgM3 != null ? number.format(selected.physical.standardDensityKgM3) + ' کیلوگرم بر مترمکعب' : sample('۱٬۰۰۰ کیلوگرم بر مترمکعب')],
  ];
  return <section id="product-specifications" className="product-spec-sheet" aria-labelledby="product-spec-tab" hidden={hidden}>
    <h2>مشخصات محصول</h2>
    <section className="product-spec-group">
      <h3>مشخصات و بسته‌بندی</h3>
      <dl>{rows.map(([name, value]) => <SpecRow key={name} name={name} value={value} />)}</dl>
    </section>
    <section className="product-spec-group">
      <h3>گزینه‌ها و توضیحات</h3>
      <dl>
        {options.map((option, index) => <SpecRow key={option.name + index} name={option.name} value={option.value} />)}
        {!options.length && <SpecRow name="گزینهٔ محصول" value={sample('نوع بسته‌بندی')} />}
        <SpecRow name="توضیحات" value={description || sample('جزئیات مبدأ و نگهداری پس از تکمیل اطلاعات نمایش داده می‌شود.')} />
      </dl>
    </section>
  </section>;
}
