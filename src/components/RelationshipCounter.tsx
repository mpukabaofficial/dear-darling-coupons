import { useEffect, useState } from "react";
import { differenceInCalendarDays, intervalToDuration, startOfDay } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseLocalDate } from "@/lib/dates";

const getRelationshipStats = (relationshipStartDate: string, currentTime: Date) => {
  // relationship_start_date is a calendar date, so treat it as local midnight
  const startDate = parseLocalDate(relationshipStartDate);

  // For live counting of seconds, use current time with full precision
  const totalMsLive = currentTime.getTime() - startDate.getTime();
  const totalSeconds = Math.floor(totalMsLive / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);

  // For days/weeks/months/years, use midnight to keep values stable throughout the day
  const todayDate = startOfDay(currentTime);
  const totalDays = differenceInCalendarDays(todayDate, startDate);
  const totalWeeks = Math.floor(totalDays / 7);

  // Years, months, days breakdown using calendar arithmetic
  const { years = 0, months = 0, days = 0 } =
    totalDays > 0 ? intervalToDuration({ start: startDate, end: todayDate }) : {};

  // Calculate total months, years, decades, centuries
  const totalMonths = years * 12 + months;
  const totalYears = years;
  const totalDecades = Math.floor(totalYears / 10);
  const totalCenturies = Math.floor(totalYears / 100);

  // Create calendar string
  const parts = [];
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  const calendarString = parts.join(', ');

  return [
    { label: 'Total Seconds', value: totalSeconds.toLocaleString(), sublabel: 'Seconds' },
    { label: 'Total Minutes', value: totalMinutes.toLocaleString(), sublabel: 'Minutes' },
    { label: 'Total Hours', value: totalHours.toLocaleString(), sublabel: 'Hours' },
    { label: 'Total Days', value: totalDays.toLocaleString(), sublabel: 'Days' },
    { label: 'Total Weeks', value: totalWeeks.toLocaleString(), sublabel: 'Weeks' },
    { label: 'Total Months', value: totalMonths.toLocaleString(), sublabel: totalMonths === 1 ? 'Month' : 'Months' },
    { label: 'Total Years', value: totalYears.toLocaleString(), sublabel: totalYears === 1 ? 'Year' : 'Years' },
    { label: 'Total Decades', value: totalDecades.toLocaleString(), sublabel: totalDecades === 1 ? 'Decade' : 'Decades' },
    { label: 'Total Centuries', value: totalCenturies.toLocaleString(), sublabel: totalCenturies === 1 ? 'Century' : 'Centuries' },
    { label: 'Time Together', value: calendarString, sublabel: 'Total' },
  ];
};

interface RelationshipCounterProps {
  startDate: string | null;
}

// Live "days together" counter. Owns its own 1s timer so only this card
// re-renders every second, not the whole Home page.
const RelationshipCounter = ({ startDate }: RelationshipCounterProps) => {
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!startDate) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [startDate]);

  const stats = startDate ? getRelationshipStats(startDate, currentTime) : null;

  const nextStat = () => {
    if (!stats) return;
    setCurrentStatIndex((prev) => (prev + 1) % stats.length);
  };

  const prevStat = () => {
    if (!stats) return;
    setCurrentStatIndex((prev) => (prev - 1 + stats.length) % stats.length);
  };

  return (
    <div className="bg-gradient-to-br from-peach to-soft-pink p-6 rounded-3xl shadow-soft relative hover-lift animate-gradient">
      <div className="flex items-center gap-3 mb-2">
        <Calendar className="w-6 h-6 text-primary" />
        <h3 className="text-lg font-semibold">Days Together</h3>
      </div>
      {stats ? (
        <>
          <div className="absolute top-6 right-6 flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevStat}
              className="h-8 w-8 rounded-full hover:bg-primary/20"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextStat}
              className="h-8 w-8 rounded-full hover:bg-primary/20"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-4xl font-bold text-primary mb-1">
            {stats[currentStatIndex].value}
          </p>
          <p className="text-sm text-muted-foreground">
            {stats[currentStatIndex].sublabel}
          </p>
        </>
      ) : (
        <>
          <p className="text-4xl font-bold text-primary">—</p>
          <p className="text-sm text-muted-foreground mt-2">
            Set your relationship start date in settings
          </p>
        </>
      )}
    </div>
  );
};

export default RelationshipCounter;
