/** Application type：1 快手 2 抖音 */
export const APP_TYPE_ENUM = {
  1: { text: '快手', status: 'Warning' },
  2: { text: '抖音', status: 'Processing' },
} as const;

export const APP_TYPE_OPTIONS = [
  { label: '快手', value: 1 },
  { label: '抖音', value: 2 },
];
