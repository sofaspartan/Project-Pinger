const axios = require('axios');
const JSZip = require('jszip');

const REPO = 'sofaspartan/Project-Pinger';

function githubHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json'
  };
}

const PING_WORKFLOW_PATH = '.github/workflows/ping.yml';

async function fetchPingResultsFromArtifact(runId) {
  const listRes = await axios.get(
    `https://api.github.com/repos/${REPO}/actions/runs/${runId}/artifacts`,
    { headers: githubHeaders() }
  );

  const artifacts = listRes.data.artifacts || [];
  const pingArt = artifacts.find((a) => a.name === 'ping-results');
  if (!pingArt || !pingArt.archive_download_url) {
    return null;
  }

  const zipRes = await axios.get(pingArt.archive_download_url, {
    headers: githubHeaders(),
    responseType: 'arraybuffer',
    maxRedirects: 5
  });

  const zip = await JSZip.loadAsync(zipRes.data);
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  const jsonPath =
    names.find((n) => n === 'ping-results.json') ||
    names.find((n) => n.endsWith('ping-results.json'));
  if (!jsonPath) {
    throw new Error(`ping-results zip has no ping-results.json (files: ${names.join(', ')})`);
  }

  const text = await zip.file(jsonPath).async('string');
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed.results)) {
    return parsed.results;
  }
  if (Array.isArray(parsed)) {
    return parsed;
  }
  return null;
}

function ratioFromResults(results) {
  if (!results || !results.length) return null;
  const ok = results.filter((p) => p.status === 'success').length;
  return Math.round((ok / results.length) * 1000) / 1000;
}

async function buildSparklineRatios(limit) {
  const cap = Math.min(Math.max(limit, 4), 10);
  const runsRes = await axios.get(
    `https://api.github.com/repos/${REPO}/actions/runs?per_page=${Math.min(cap * 2, 30)}`,
    { headers: githubHeaders() }
  );
  const allRuns = runsRes.data.workflow_runs || [];
  const pingRuns = allRuns
    .filter(
      (r) =>
        r.path === PING_WORKFLOW_PATH ||
        r.name === 'Supabase Project Pinger'
    )
    .slice(0, cap);

  const ratios = await Promise.all(
    pingRuns.map(async (run) => {
      try {
        const results = await fetchPingResultsFromArtifact(run.id);
        return ratioFromResults(results);
      } catch (e) {
        return null;
      }
    })
  );

  return { points: ratios.reverse(), usedRuns: pingRuns.length };
}

module.exports = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { runId, jobId, pingResults, sparkline } = req.query;
    let data;

    if (jobId) {
      const response = await axios.get(
        `https://api.github.com/repos/${REPO}/actions/jobs/${jobId}/logs`,
        {
          headers: githubHeaders(),
          responseType: 'text'
        }
      );
      data = response.data;
    } else if (runId && pingResults != null && String(pingResults) !== '') {
      const results = await fetchPingResultsFromArtifact(runId);
      if (!results) {
        res.status(404).json({
          error: 'No ping-results artifact for this run',
          results: null
        });
        return;
      }
      res.status(200).json({ results });
      return;
    } else if (sparkline != null && String(sparkline) !== '') {
      const limit = parseInt(req.query.limit, 10);
      const { points, usedRuns } = await buildSparklineRatios(
        Number.isFinite(limit) && limit > 0 ? limit : 10
      );
      res.status(200).json({ points, usedRuns });
      return;
    } else if (runId) {
      const response = await axios.get(
        `https://api.github.com/repos/${REPO}/actions/runs/${runId}/jobs`,
        { headers: githubHeaders() }
      );
      data = response.data;
    } else {
      const response = await axios.get(
        `https://api.github.com/repos/${REPO}/actions/runs`,
        { headers: githubHeaders() }
      );
      data = response.data;
    }

    if (jobId) {
      res.setHeader('Content-Type', 'text/plain');
      res.status(200).send(data);
    } else {
      res.status(200).json(data);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: error.message,
      details: error.response?.data
    });
  }
};
