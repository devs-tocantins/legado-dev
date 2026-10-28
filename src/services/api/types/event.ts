import { FileEntity } from "./file-entity";

export enum EventStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum EventCategory {
  MEETUP = "MEETUP",
  WORKSHOP = "WORKSHOP",
  HACKATHON = "HACKATHON",
  PALESTRA = "PALESTRA",
  CURSO = "CURSO",
  OUTRO = "OUTRO",
}

export enum EventModality {
  ONLINE = "ONLINE",
  PRESENCIAL = "PRESENCIAL",
  HIBRIDO = "HIBRIDO",
}

export type Event = {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  modality: EventModality;
  startAt: string;
  endAt?: string | null;
  location?: string | null;
  locationMapUrl?: string | null;
  onlineUrl?: string | null;
  externalUrl?: string | null;
  status: EventStatus;
  rejectionReason?: string | null;
  organizerId: number;
  reviewerId?: number | null;
  reviewedAt?: string | null;
  coverImageId?: string | null;
  coverImage?: FileEntity | null;
  googleCalendarUrl: string;
  createdAt: string;
  updatedAt: string;
};
