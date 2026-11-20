const clubTimeZone = "Africa/Lagos";

export function getNextTrainingDate(now: Date): string {
  const parts = new Map(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: clubTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map(({ type, value }) => [type, value]),
  );
  const getNumber = (part: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.get(part);
    const number = Number(value);
    if (!value || !Number.isInteger(number)) {
      throw new Error(`Unable to calculate the next training date: missing ${part}`);
    }
    return number;
  };

  const year = getNumber("year");
  const month = getNumber("month");
  const day = getNumber("day");
  const hour = getNumber("hour");
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  let daysUntilSaturday = (6 - weekday + 7) % 7;

  if (daysUntilSaturday === 0 && hour >= 11) {
    daysUntilSaturday = 7;
  }

  const trainingDate = new Date(Date.UTC(year, month - 1, day + daysUntilSaturday));
  const weekdayName = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
  }).format(trainingDate);
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(trainingDate);
  return `${weekdayName} ${dateLabel}`.toUpperCase();
}
