import { fromFetch } from 'rxjs/fetch'
import { switchMap } from 'rxjs/operators'
import type { Observable } from 'rxjs'
import type { StoryDuration } from './actions/app'

export const ALL_GROUPS_PATH = 'groups'
export const ALL_STORIES_PATH = 'stories/search'
export const LABELS_PATH = 'labels/'
export const PROJECTS_PATH = 'projects/'
export const SHORTCUT_TOKEN = '631788d0-309b-475b-9ed9-902a660a1d32'
export const SHORTCUT_TOKEN_HEADER = 'Shortcut-Token'
export const SHORTCUT_URL = 'https://api.app.shortcut.com/api/v3'


// rename to fromGet
export const fromRequest = <T = any>(url: string, headers?: HeadersInit): Observable<T> => fromFetch(
  url,
  {
    headers: {[SHORTCUT_TOKEN_HEADER]: SHORTCUT_TOKEN, 'Content-Type': 'application/json', ...headers}
  }
).pipe(switchMap(res => {
  if (!res.ok || res.status >= 400) {
    throw new Error(`Request Error: [${res.status}] ${res.statusText}`)
  }

  return res.json();
}));

export const fromPost = <T = any>(url: string, body: any, headers?: HeadersInit): Observable<T> => fromFetch(
  url,
  {
    method: 'POST',
    headers: {[SHORTCUT_TOKEN_HEADER]: SHORTCUT_TOKEN, 'Content-Type': 'application/json', ...headers},
    body: JSON.stringify(body)
  }
).pipe(switchMap(res => {
  if (!res.ok || res.status >= 400) {
    throw new Error(`Request Error: [${res.status}] ${res.statusText}`)
  }

  return res.json();
}));

export const quantile = (sorted: StoryDuration[], q: number): number => {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;

  if (sorted[base + 1] !== undefined) {
    return sorted[base].days + rest * (sorted[base + 1].days - sorted[base].days);
  } else {
    return sorted[base].days;
  }
};
