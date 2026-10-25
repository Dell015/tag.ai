/**
 * Beta payments by hand. QR images live in `public/pay/<Bank>/<Name><amount>.jpg`, one per package price
 * (each QR already has its amount filled in). File names are case sensitive on the server.
 * `accountName` is optional and shows under the QR.
 */
/**
 * `crop` zooms in on the QR itself: x and y are where the square starts and w how wide it is, all as a fraction of the
 * screenshot, and `ratio` is the screenshot's height divided by its width. The same crop works for every amount.
 */
export interface QrCrop { x: number; y: number; w: number; ratio: number }

export const PAY = {
  gcash: { label: 'GCash', image: (php: number) => `/pay/GCash/Gcash${php}.jpg`, accountName: '', crop: { x: 0.1946, y: 0.157, w: 0.6109, ratio: 1.945 } as QrCrop },
  bpi: { label: 'BPI', image: (php: number) => `/pay/BPI/BPI${php}.jpg`, accountName: '', crop: { x: 0.297, y: 0.382, w: 0.406, ratio: 1.13 } as QrCrop },
  maribank: { label: 'MariBank', image: (php: number) => `/pay/MariBank/Maribank${php}.jpg`, accountName: '', crop: { x: 0.2424, y: 0.1595, w: 0.5152, ratio: 1.2985 } as QrCrop },
} as const;
export type PayMethod = keyof typeof PAY;
export const PAY_METHODS = Object.keys(PAY) as PayMethod[];

/** What the screen promises, in minutes. The owner's own promise is 5, the public one is 15. */
export const PAY_WAIT_MINUTES = 15;
