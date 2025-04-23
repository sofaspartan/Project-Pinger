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

    console.log('Starting ping process...');
    
    // Try to load config
    let config;
    try {
      config = require('../config.json');
      console.log('Config loaded successfully');
    } catch (configError) {
      console.error('Error loading config:', configError);
      res.status(500).json({ 
        success: false,
        error: 'Failed to load configuration',
        details: configError.message
      });
      return;
    }
    
    const results = [];

    for (const project of config.supabase_projects) {
      console.log(`Pinging project: ${project.name}`);
      try {
        // First, ping the REST API
        const restResponse = await axios.get(`${project.url}/rest/v1/`, {
          timeout: 10000,
          headers: {
            'apikey': project.anon_key,
            'Authorization': `Bearer ${project.anon_key}`
          }
        });

        // Then, make a database query to ensure real activity
        const dbResponse = await axios.post(
          `${project.url}/rest/v1/rpc/ping`,
          {},
          {
            timeout: 10000,
            headers: {
              'apikey': project.anon_key,
              'Authorization': `Bearer ${project.anon_key}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            }
          }
        );
        
        console.log(`Success for ${project.name}: REST=${restResponse.status}, DB=${dbResponse.status}`);
        results.push({
          name: project.name,
          url: project.url,
          status: 'success',
          restStatus: restResponse.status,
          dbStatus: dbResponse.status
        });
      } catch (error) {
        console.error(`Error pinging ${project.name}:`, error.message);
        results.push({
          name: project.name,
          url: project.url,
          status: 'error',
          error: error.message,
          details: error.response?.data || 'No additional details'
        });
      }
    }

    console.log('Ping process completed');
    res.status(200).json({ 
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Critical error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}; 