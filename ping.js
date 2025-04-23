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
        const response = await axios.get(`${project.url}/rest/v1/`, {
          timeout: 10000,
          headers: {
            'apikey': project.anon_key,
            'Authorization': `Bearer ${project.anon_key}`
          }
        });
        
        console.log(`Success for ${project.name}: ${response.status}`);
        results.push({
          name: project.name,
          url: project.url,
          status: 'success',
          statusCode: response.status
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