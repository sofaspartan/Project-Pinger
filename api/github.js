const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { runId, jobId } = req.query;
    let data;

    if (jobId) {
      // Get job logs
      const response = await axios.get(
        `https://api.github.com/repos/sofaspartan/Project-Pinger/actions/jobs/${jobId}/logs`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          responseType: 'text'  // Important: Get response as text
        }
      );
      data = response.data;
    } else if (runId) {
      // Get run jobs
      const response = await axios.get(
        `https://api.github.com/repos/sofaspartan/Project-Pinger/actions/runs/${runId}/jobs`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      data = response.data;
    } else {
      // Get all runs
      const response = await axios.get(
        'https://api.github.com/repos/sofaspartan/Project-Pinger/actions/runs',
        {
          headers: {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      data = response.data;
    }

    // For job logs, send as text
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