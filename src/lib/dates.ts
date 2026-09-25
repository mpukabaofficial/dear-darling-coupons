import { endOfDay, parseISO, startOfDay } from "date-fns";

// Start and end of the user's local calendar day, as UTC ISO strings for
// comparing against timestamptz columns.
export const getLocalDayRange = (date: Date = new Date()) => ({
  start: startOfDay(date).toISOString(),
  end: endOfDay(date).toISOString(),
});

// Parse a DATE column value ("yyyy-MM-dd") as local midnight. `new Date(str)`
// would treat it as UTC midnight, which is the previous day west of UTC.
export const parseLocalDate = (value: string) => parseISO(value);
