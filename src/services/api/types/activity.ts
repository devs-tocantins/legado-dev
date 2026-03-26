export enum ActivityTypeEnum {
  QUIZ = "quiz",
  SURVEY = "survey",
  CHALLENGE = "challenge",
  EVENT = "event",
  OTHER = "other",
}

export type Activity = {
  id: string;
  name: string;
  description?: string;
  points: number;
  type: ActivityTypeEnum;
  createdAt: string;
  updatedAt: string;
};
