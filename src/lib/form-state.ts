import 'server-only';
import { getSession, getWritableSession, saveSession, updateSessionData } from './session';

/** Laravel's withInput() + withErrors(): old values and error bags kept for the next page */
export interface FormState {
  old?: Record<string, string>;
  errors?: Record<string, Record<string, string[]>>; // bag → field → messages
  flags?: Record<string, boolean>; // e.g. show_register
}

type WithForm = { _form?: FormState; _intended?: string };

/** From a Route Handler / Server Action, before redirecting back */
export async function putFormState(state: FormState) {
  const s = await getWritableSession();
  (s.data as WithForm)._form = state;
  await saveSession(s);
}

/** Read once in a page (then removed), like old() and $errors */
export async function takeFormState(): Promise<FormState> {
  const s = await getSession();
  const state = (s.data as WithForm)._form;
  if (state && s.id) await updateSessionData(s.id, {}, ['_form']);
  return state ?? {};
}

/** redirect()->guest(): remember the page a guest tried to open (Server Components too) */
export async function rememberIntended(path: string) {
  const s = await getSession();
  if (s.id) await updateSessionData(s.id, { _intended: path });
}

/** redirect()->intended() */
export async function pullIntended(fallback: string): Promise<string> {
  const s = await getWritableSession();
  const d = s.data as WithForm;
  const to = d._intended && d._intended.startsWith('/') && !d._intended.startsWith('//') ? d._intended : fallback;
  if (d._intended) { delete d._intended; await saveSession(s); }
  return to;
}
