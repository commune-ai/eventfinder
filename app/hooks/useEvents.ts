"use client";
import { useState, useEffect } from "react";
import moment from "moment";

interface Venue {
  name: string;
  location: {
    latitude: string;
    longitude: string;
  };
}

interface Image {
  url: string;
}

interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  dates: {
    start: {
      localDate: string;
      localTime: string;
    };
    status: {
      code: string;
    };
    timezone: string;
  };
  info: string;
  priceRanges: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  _embedded: {
    venues: Venue[];
  };
  images: Image[];
}

interface ProcessedEvent {
  lat: string;
  lon: string;
  id: string;
  title: string;
  url: string;
  info: string;
  venueNameData: string;
  featureImage: string;
  eventStartDay: string;
  eventStartTime: string;
  eventTimeZone: string;
}

export function useEvents() {
  const [events, setEvents] = useState<ProcessedEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/explore");
        const data = await response.json();

        const currentDate = moment().format("YYYY-MM-DD");
        const startWeekDate = moment().subtract(1, "days").format("YYYY-MM-DD");
        const endWeekDate = moment().add(8, "days").format("YYYY-MM-DD");

        const filteredEvents = data._embedded.events
          .filter((event: TicketmasterEvent) => {
            const dateData = event.dates.start.localDate;
            const dateCheck = moment(dateData).isBetween(
              startWeekDate,
              endWeekDate
            );
            const cancelledCheck = event.dates.status.code;
            return dateCheck && cancelledCheck === "onsale";
          })
          .map(
            (event: TicketmasterEvent): ProcessedEvent => ({
              lat: event._embedded.venues[0].location.latitude,
              lon: event._embedded.venues[0].location.longitude,
              id: event.id,
              info: event.info,
              title: event.name,
              url: event.url,
              venueNameData: event._embedded.venues[0].name,
              featureImage: event.images[0].url,
              eventStartDay: event.dates.start.localDate,
              eventStartTime: event.dates.start.localTime,
              eventTimeZone: event.dates.timezone,
            })
          );

        setEvents(filteredEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, []);

  return events;
}
