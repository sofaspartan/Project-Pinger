const axios = require('axios');
const { loadConfig, projectApiKey } = require('./configLoader');

async function pingProjects() {
  try {
    console.error('Starting ping process...');

    const config = loadConfig();
    console.error('Config loaded successfully');

    const results = [];

    for (const project of config.supabase_projects) {
      console.error(`Pinging project: ${project.name}`);
      try {
        const apiKey = projectApiKey(project);
        const restResponse = await axios.get(`${project.url}/rest/v1/`, {
          timeout: 10000,
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`
          }
        });

        let dbStatus = null;
        try {
          const dbResponse = await axios.post(
            `${project.url}/rest/v1/rpc/ping`,
            {},
            {
              timeout: 10000,
              headers: {
                apikey: apiKey,
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                Prefer: 'return=minimal'
              }
            }
          );
          dbStatus = dbResponse.status;
        } catch (dbError) {
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
