const axios = require('axios');
const fs = require('fs');

async function pingProjects() {
  try {
    console.log('Starting ping process...');
    
    // Load config
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    console.log('Config loaded successfully');
    
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
    console.log('Results:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Critical error:', error);
    process.exit(1);
  }
}

pingProjects(); 