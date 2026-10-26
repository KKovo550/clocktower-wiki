import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export async function backupMain({ request, before, after, runNumber }) {
  if (before === '0'.repeat(40)) return { skipped: 'initial push' };
  if (![before, after].every(x => /^[a-f0-9]{40}$/.test(x)) || !/^\d+$/.test(String(runNumber))) throw Error('Invalid push metadata');
  const tag = `tags/backup/main-before-${runNumber}-${before.slice(0, 8)}`;
  const created = await request('POST', 'git/refs', { ref: `refs/${tag}`, sha: before });
  if (![201, 422].includes(created.status)) throw Error(`Create backup tag: HTTP ${created.status}`);
  const saved = await request('GET', `git/ref/${tag}`);
  if (saved.status !== 200 || saved.data?.object?.sha !== before) throw Error('Backup tag missing or points to a different commit');
  const main = await request('GET', 'git/ref/heads/main');
  if (main.status !== 200) throw Error(`Read main: HTTP ${main.status}`);
  // Every run retains its immutable tag. An older queued run must not move the latest pointer backwards.
  if (main.data?.object?.sha !== after) return { tag, skipped: 'superseded push' };
  const ref = 'heads/backup/latest-before-main-update';
  const current = await request('GET', `git/ref/${ref}`);
  let updated;
  if (current.status === 200) updated = await request('PATCH', `git/refs/${ref}`, { sha: before, force: true });
  else if (current.status === 404) updated = await request('POST', 'git/refs', { ref: `refs/${ref}`, sha: before });
  else throw Error(`Read recovery branch: HTTP ${current.status}`);
  if (![200, 201].includes(updated.status)) throw Error(`Update recovery branch: HTTP ${updated.status}`);
  const verified = await request('GET', `git/ref/${ref}`);
  if (verified.status !== 200 || verified.data?.object?.sha !== before) throw Error('Recovery branch verification failed');
  return { tag, verified: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const repository = process.env.GITHUB_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository || '') || !process.env.GH_TOKEN) throw Error('Missing repository or token');
  const request = async (method, endpoint, body) => {
    const response = await fetch(`https://api.github.com/repos/${repository}/${endpoint}`, {
      method, signal: AbortSignal.timeout(30000),
      headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, data: await response.json() };
  };
  console.log(await backupMain({ request, before: event.before, after: event.after, runNumber: process.env.GITHUB_RUN_NUMBER }));
}
