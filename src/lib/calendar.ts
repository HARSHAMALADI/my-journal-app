import { clearGoogleCalendarToken } from "./firebase";

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string; // ISO datetime
  end: string;
  source: "google" | "apple";
}

/**
 * Fetch Google Calendar events for a specific day
 */
export async function fetchGoogleCalendarEvents(
  date: Date,
  accessToken: string
): Promise<CalendarEvent[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    `timeMin=${encodeURIComponent(startOfDay.toISOString())}&` +
    `timeMax=${encodeURIComponent(endOfDay.toISOString())}&` +
    `singleEvents=true&orderBy=startTime`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearGoogleCalendarToken();
      throw new Error("TOKEN_EXPIRED");
    }
    throw new Error("Failed to fetch Google Calendar events");
  }

  const data = await response.json();

  return (data.items || [])
    .filter((e: any) => e.start?.dateTime) // skip all-day events for schedule
    .map((event: any) => ({
      id: event.id,
      summary: event.summary || "Untitled Event",
      start: event.start.dateTime,
      end: event.end.dateTime,
      source: "google" as const,
    }));
}

/**
 * Fetch Apple Calendar events via iCal proxy
 */
export async function fetchAppleCalendarEvents(
  iCalUrl: string,
  date: Date
): Promise<CalendarEvent[]> {
  const response = await fetch("/api/ical", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: iCalUrl }),
  });

  if (!response.ok) throw new Error("Failed to fetch iCal data");

  const { icsData } = await response.json();
  return parseICalData(icsData, date);
}

/**
 * Parse .ics data and extract events for a specific date
 */
function parseICalData(icsData: string, date: Date): CalendarEvent[] {
  const targetDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const events: CalendarEvent[] = [];

  // Simple ICS parser — extract VEVENT blocks
  const vevents = icsData.split("BEGIN:VEVENT");
  for (let i = 1; i < vevents.length; i++) {
    const block = vevents[i].split("END:VEVENT")[0];

    const summary = extractField(block, "SUMMARY") || "Untitled Event";
    const dtStart = extractDateTime(block, "DTSTART");
    const dtEnd = extractDateTime(block, "DTEND");
    const uid = extractField(block, "UID") || `apple-${i}`;

    if (!dtStart) continue;

    // Check if event is on target date
    const eventDate = dtStart.toISOString().split("T")[0];
    if (eventDate !== targetDate) continue;

    events.push({
      id: uid,
      summary,
      start: dtStart.toISOString(),
      end: dtEnd?.toISOString() || dtStart.toISOString(),
      source: "apple" as const,
    });
  }

  return events;
}

function extractField(block: string, field: string): string | null {
  // Handles both "FIELD:value" and "FIELD;params:value"
  const regex = new RegExp(`^${field}[;:](.*)$`, "m");
  const match = block.match(regex);
  if (!match) return null;
  // Remove any parameters before the actual value
  const val = match[1];
  const colonIdx = val.indexOf(":");
  // If there was a semicolon match, the value is after the last colon
  if (match[0].charAt(field.length) === ";") {
    return colonIdx >= 0 ? val.substring(colonIdx + 1).trim() : val.trim();
  }
  return val.trim();
}

function extractDateTime(block: string, field: string): Date | null {
  // Match DTSTART:20260212T100000Z or DTSTART;TZID=...:20260212T100000
  const regex = new RegExp(`^${field}[^:]*:(.+)$`, "m");
  const match = block.match(regex);
  if (!match) return null;

  const raw = match[1].trim();

  // Format: 20260212T100000Z or 20260212T100000
  if (raw.length >= 15) {
    const year = parseInt(raw.slice(0, 4));
    const month = parseInt(raw.slice(4, 6)) - 1;
    const day = parseInt(raw.slice(6, 8));
    const hour = parseInt(raw.slice(9, 11));
    const minute = parseInt(raw.slice(11, 13));
    const second = parseInt(raw.slice(13, 15));

    if (raw.endsWith("Z")) {
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    }
    return new Date(year, month, day, hour, minute, second);
  }

  // Date-only: 20260212
  if (raw.length >= 8) {
    const year = parseInt(raw.slice(0, 4));
    const month = parseInt(raw.slice(4, 6)) - 1;
    const day = parseInt(raw.slice(6, 8));
    return new Date(year, month, day);
  }

  return null;
}

/**
 * Map calendar events to schedule time slot indices
 * Schedule: index 0 = 5:00 AM, index 19 = 12:00 AM
 */
export function mapEventsToSchedule(
  events: CalendarEvent[]
): Map<number, CalendarEvent[]> {
  const eventsBySlot = new Map<number, CalendarEvent[]>();

  events.forEach((event) => {
    const eventStart = new Date(event.start);
    const eventHour = eventStart.getHours();

    let slotIndex: number;
    if (eventHour >= 5 && eventHour <= 23) {
      slotIndex = eventHour - 5;
    } else if (eventHour >= 0 && eventHour < 5) {
      slotIndex = 19; // Map early morning to 12AM slot
    } else {
      return;
    }

    if (!eventsBySlot.has(slotIndex)) {
      eventsBySlot.set(slotIndex, []);
    }
    eventsBySlot.get(slotIndex)!.push(event);
  });

  return eventsBySlot;
}
