#!/usr/bin/env node
// Fetch public repos for a GitHub user/org and write to astro/src/data/site.json as `projects`.
// Usage: node scripts/fetch-projects.js AnomFIN

const fs = require('fs');
const path = require('path');

async function main() {
  const user = process.argv[2] || 'AnomFIN';
  const api = `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=updated`;
  const res = await fetch(api, { headers: { 'User-Agent': 'anomfin-site-updater' } });
  if (!res.ok) {
    console.error('Fetch failed', res.status, await res.text());
    process.exit(1);
  }
  const repos = await res.json();
  const projects = repos
    .filter(r => !r.fork)
    .map(r => ({
      name: r.name,
      desc: r.description || 'Ei kuvausta',
      link: r.homepage || r.html_url,
      tags: (r.topics && r.topics.length ? r.topics : undefined)
    }))
    .slice(0, 8);

  const dataPath = path.join(__dirname, '..', 'astro', 'src', 'data', 'site.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
  const json = JSON.parse(raw);
  json.projects = projects;
  fs.writeFileSync(dataPath, JSON.stringify(json, null, 2));
  console.log(`Updated ${dataPath} with ${projects.length} projects from ${user}.`);
}

main().catch(err => { console.error(err); process.exit(1); });

