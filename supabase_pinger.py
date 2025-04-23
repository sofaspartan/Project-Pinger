import json
import time
import requests
import schedule
from datetime import datetime
import logging
import sys
import os
from daemon import DaemonContext
import signal

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('supabase_pinger.log'),
        logging.StreamHandler()
    ]
)

def load_config():
    try:
        with open('config.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        logging.error("config.json not found!")
        raise
    except json.JSONDecodeError:
        logging.error("Invalid JSON in config.json!")
        raise

def ping_supabase_project(project):
    try:
        response = requests.get(f"{project['url']}/rest/v1/", timeout=10)
        if response.status_code == 200:
            logging.info(f"Successfully pinged {project['name']} ({project['url']})")
        else:
            logging.warning(f"Failed to ping {project['name']} ({project['url']}). Status code: {response.status_code}")
    except requests.RequestException as e:
        logging.error(f"Error pinging {project['name']} ({project['url']}): {str(e)}")

def ping_all_projects():
    config = load_config()
    for project in config['supabase_projects']:
        ping_supabase_project(project)

def run_daemon():
    config = load_config()
    interval_minutes = config.get('ping_interval_minutes', 15)
    
    logging.info(f"Starting Supabase Pinger. Will ping projects every {interval_minutes} minutes.")
    
    # Schedule the pings
    schedule.every(interval_minutes).minutes.do(ping_all_projects)
    
    # Run immediately on startup
    ping_all_projects()
    
    # Keep the script running
    while True:
        schedule.run_pending()
        time.sleep(1)

def main():
    # Create a PID file
    pid_file = '/tmp/supabase_pinger.pid'
    
    # Create the daemon context
    with DaemonContext(
        working_directory=os.getcwd(),
        pidfile=pid_file,
        signal_map={
            signal.SIGTERM: lambda signum, frame: sys.exit(0)
        }
    ):
        run_daemon()

if __name__ == "__main__":
    main() 