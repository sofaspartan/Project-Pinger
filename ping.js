const axios = require('axios');
const fs = require('fs');

async function pingProjects() {
  try {
    console.error('Starting ping process...');

    // Load config
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    console.error('Config loaded successfully');

    const results = [];

    for (const project of config.supabase_projects) {
      console.error(`Pinging project: ${project.name}`);
      try {
        // First, ping the REST API
        const restResponse = await axios.get(`${project.url}/rest/v1/`, {
          timeout: 10000,
          headers: {
            'apikey': project.anon_key,
            'Authorization': `Bearer ${project.anon_key}`
          }
        });

        // Then, make a database query to ensure real activity (optional - requires setup.sql in project)
        let dbStatus = null;
        try {
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
          dbStatus = dbResponse.status;
        } catch (dbError) {
          // RPC may be missing; REST ping still keeps project awake
          console.error(`  RPC ping skipped for ${project.name}:`, dbError.message);
        }

        console.error(`Success for ${project.name}: REST=${restResponse.status}${dbStatus != null ? `, DB=${dbStatus}` : ''}`);
        results.push({
          name: project.name,
          url: project.url,
          status: 'success',
          restStatus: restResponse.status,
          dbStatus
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

    console.error('Ping process completed');

    // Output results as JSON to stdout only (for GitHub Actions artifact)
    process.stdout.write(JSON.stringify({
      timestamp: new Date().toISOString(),
      results
    }, null, 2));
  } catch (error) {
    console.error('Critical error:', error);
    process.exit(1);
  }
}

pingProjects(); 