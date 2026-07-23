export enum CourseStatusEnum {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export type Course = {
  id: string;
  title: string;
  description?: string | null;
  provider?: string | null;
  url: string;
  isFree: boolean;
  price?: number | null;
  language?: string | null;
  submittedByProfileId?: string | null;
  status: CourseStatusEnum;
  createdAt: string;
  updatedAt: string;
  averageRating?: number | null;
  totalReviews?: number | null;
};

import { User } from "./user";

export type CourseReview = {
  id: string;
  courseId: string;
  profileId: string;
  rating: number;
  comment?: string | null;
  provenCompletion: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User | null;
};
