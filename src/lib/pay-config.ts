/**
 * Beta payments by hand. Put the owner's QR images in `public/pay/` as `gcash.png` and `bank.png`.
 * `accountName` is shown under the QR so the payer can check they are paying the right person.
 */
export const PAY = {
  gcash: { label: 'GCash', image: '/pay/gcash.png', accountName: '' },
  bank: { label: 'Bank', image: '/pay/bank.png', accountName: '' },
} as const;
export type PayMethod = keyof typeof PAY;

/** What the screen promises, in minutes. The owner's own promise is 5, the public one is 15. */
export const PAY_WAIT_MINUTES = 15;
