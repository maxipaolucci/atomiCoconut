#!/bin/bash

# replace log size in nginx logrotate config with env var
sed -i "s?LOG_SIZE?$LOG_SIZE?" /etc/logrotate.d/nginx

# start crontab service
service cron start

# start nginx
nginx -g "daemon off;"
