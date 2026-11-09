const LATE_COMING_BANDS = [
  { minimum: 2, maximum: 4, convertedDays: 0.5 },
  { minimum: 5, maximum: 7, convertedDays: 1 },
  { minimum: 8, maximum: 10, convertedDays: 1.5 },
  { minimum: 11, maximum: 13, convertedDays: 2 },
];

export const getLateComingConversion = (count) => {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('Late-coming count must be a non-negative integer');
  }

  if (count <= 1) return { count, convertedDays: 0, needsPolicyReview: false };

  const band = LATE_COMING_BANDS.find(
    ({ minimum, maximum }) => count >= minimum && count <= maximum,
  );

  if (!band) return { count, convertedDays: null, needsPolicyReview: true };

  return { count, convertedDays: band.convertedDays, needsPolicyReview: false };
};

export const getHalfDayThresholdMinutes = ({ standardHours, thresholdPercent = 50 }) => {
  if (!Number.isFinite(standardHours) || standardHours <= 0) {
    throw new RangeError('Standard hours must be a positive number');
  }

  if (!Number.isFinite(thresholdPercent) || thresholdPercent < 0 || thresholdPercent > 100) {
    throw new RangeError('Half-day threshold must be between 0 and 100 percent');
  }

  return Math.round(standardHours * 60 * thresholdPercent / 100);
};
