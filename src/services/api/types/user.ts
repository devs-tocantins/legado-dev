import { FileEntity } from "./file-entity";
import { Role } from "./role";

export enum UserProviderEnum {
  EMAIL = "email",
  GOOGLE = "google",
  GITHUB = "github",
}

export type User = {
  id: number | string;
  email: string;
  firstName?: string;
  lastName?: string;
  photo?: FileEntity;
  provider?: UserProviderEnum;
  socialId?: string;
  role?: Role;
  status?: {
    id: number | string;
    name?: string;
  };
  isBanned?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  lastNotifiedLegalVersion?: number;
};
