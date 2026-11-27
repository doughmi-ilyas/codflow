/** bcrypt cost. 10 in production; tests lower it through BCRYPT_ROUNDS to stay fast. */
export const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);
