'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { partnerBackend, partnerSessionCookie } from '../../../lib/partnerBackend';
import { partnerHref, sections } from '../../../components/Partners/workspaceSections';

export async function saveWorkspaceEntry(section, formData) {
  const settings = Object.hasOwn(sections, section) ? sections[section] : null;
  if (!settings?.entry) return;
  const token = (await cookies()).get(partnerSessionCookie)?.value;
  if (!token) redirect('/partners');

  const href = partnerHref(section);
  const id = formData.get('id');
  const removing = id !== null;
  const title = formData.get('title');
  const details = formData.get('details');
  if (removing ? typeof id !== 'string' || !/^[a-f0-9]{24}$/i.test(id) :
    typeof title !== 'string' || !title.trim() || title.length > 120 ||
    typeof details !== 'string' || !details.trim() || details.length > 1000) redirect(href + '&result=invalid');

  let result;
  try {
    result = await partnerBackend('/web/workspace/' + section + (removing ? '/' + id : ''), {
      token, method: removing ? 'DELETE' : 'POST',
      body: removing ? undefined : JSON.stringify({ title, details }),
    });
  } catch {
    redirect(href + '&result=error');
  }
  if (result.status === 401) redirect('/partners');
  redirect(href + '&result=' + (result.ok ? removing ? 'removed' : 'saved' : 'error'));
}

export async function leaveWorkspace() {
  (await cookies()).delete(partnerSessionCookie);
  redirect('/partners');
}
