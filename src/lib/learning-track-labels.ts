import {
  LearningTrackTier,
  TrackItemType,
} from "@/services/api/types/learning-track";

export const LEARNING_TRACK_TIER_LABELS: Record<LearningTrackTier, string> = {
  [LearningTrackTier.ALICERCE]: "Alicerce",
  [LearningTrackTier.PILAR]: "Pilar",
  [LearningTrackTier.ARCO]: "Arco",
};

export const LEARNING_TRACK_TIER_DESCRIPTIONS: Record<
  LearningTrackTier,
  string
> = {
  [LearningTrackTier.ALICERCE]: "Do zero até pronto para estagiar",
  [LearningTrackTier.PILAR]: "Aprofundamento profissional",
  [LearningTrackTier.ARCO]: "Especializações e trilhas avançadas",
};

export const TRACK_ITEM_TYPE_LABELS: Record<TrackItemType, string> = {
  [TrackItemType.RESOURCE]: "Recurso",
  [TrackItemType.TEXT]: "Leitura",
  [TrackItemType.PROOF]: "Prova prática",
  [TrackItemType.COURSE_COMPLETION]: "Curso",
  [TrackItemType.EVENT]: "Evento",
  [TrackItemType.MISSION]: "Missão",
  [TrackItemType.CHECKPOINT]: "Checkpoint",
};
