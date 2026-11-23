export const loginMessages = {
  credentials: 'شماره موبایل یا رمز ورود صحیح نیست. اطلاعات را بررسی کنید.',
  invalid: 'شماره موبایل یا رمز عبور را با قالب درست وارد کنید.',
  forbidden: 'دسترسی ورود برای این حساب مجاز نیست. با پشتیبانی تماس بگیرید.',
  'rate-limit': 'تعداد تلاش‌ها زیاد است. کمی بعد دوباره امتحان کنید.',
  unavailable: 'فعلاً ارتباط با سامانهٔ ورود برقرار نیست. دوباره تلاش کنید.',
  rejected: 'درخواست ورود از این نشانی پذیرفته نشد. صفحه را دوباره باز کنید.',
};

export function loginProblem(status) {
  if (status === 401) return 'credentials';
  if (status === 400 || status === 422) return 'invalid';
  if (status === 403) return 'forbidden';
  if (status === 429) return 'rate-limit';
  return 'unavailable';
}
