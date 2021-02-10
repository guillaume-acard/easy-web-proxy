BLUE='\033[1;34m'
NC='\033[0m'
RED='\033[0;31m'

echo -e "### Restarting ${BLUE}ul-app-proxy${NC} server ###"
SERVER_PROCESS=`pgrep -f ul-app-proxy`
if [ -n "$SERVER_PROCESS" ]; then
  echo -e "Server is running: ${RED}Killing server process id=$SERVER_PROCESS ${NC}"
  kill $SERVER_PROCESS
else
  echo "Server is not running."
fi
nohup npm run start &