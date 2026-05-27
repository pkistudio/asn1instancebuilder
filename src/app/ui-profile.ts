import type { FormPathSegment } from './form-model.js';

export type UiFieldPath = string | readonly FormPathSegment[];

export type UiProfileInputMode = 'text' | 'hex' | 'base64' | 'utf8' | 'datetime' | 'oid';

export type UiProfileWidget =
  | 'text'
  | 'textarea'
  | 'integer'
  | 'boolean'
  | 'select'
  | 'choice'
  | 'bytes'
  | 'bitString'
  | 'objectIdentifier'
  | 'dateTime';

export interface UiFieldProfile {
  label?: string;
  description?: string;
  widget?: UiProfileWidget;
  placeholder?: string;
  defaultInput?: unknown;
  hidden?: boolean;
  collapsed?: boolean;
  order?: number;
  inputMode?: UiProfileInputMode;
}

/** Internal input-experience metadata for one top-level ASN.1 type. */
export interface UiProfile {
  id: string;
  typeName: string;
  /** Field profiles keyed by normalized form paths such as "subject.name" or "extensions.0.extnValue". */
  fields?: Record<string, UiFieldProfile>;
}

export function normalizeUiFieldPath(path: UiFieldPath): string {
  if (typeof path === 'string') return path.trim();
  return path.map((segment) => String(segment)).join('.');
}

export function getUiFieldProfile(profile: UiProfile | undefined, path: UiFieldPath): UiFieldProfile | undefined {
  return profile?.fields?.[normalizeUiFieldPath(path)];
}