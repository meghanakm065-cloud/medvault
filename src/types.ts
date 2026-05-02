export type UserRole = 'patient' | 'doctor';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  age?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  degree?: string;
  sharingEnabled: boolean;
  onboarded: boolean;
}

export type RecordType = 'prescription' | 'report';

export interface MedicalRecord {
  id: string;
  patientId: string;
  fileURL: string;
  fileName: string;
  type: RecordType;
  createdAt: any; // Firestore Timestamp
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}
