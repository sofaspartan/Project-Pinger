const fs = require('fs');
const path = require('path');

function loadConfig() {
  const raw = process.env.PINGER_CONFIG_JSON;
  if (raw != null && String(raw).trim() !== '') {
    return JSON.parse(raw);
  }
  const configPath = path.join(__dirname, 'config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(
      'Missing config: set PINGER_CONFIG_JSON or create config.json (see config.example.json).'
    );
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function projectApiKey(project) {
  const key =
    project.secret_key ??
    project.service_role_key;
  if (!key) {
    throw new Error(
      `Project "${project.name}" needs secret_key (Supabase default secret / service_role JWT).`
    );
  }
  return key;
}

module.exports = { loadConfig, projectApiKey };
