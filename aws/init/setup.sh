#!/bin/bash

# setup cronjob
echo "*/30 * * * * sh /aws/cronjob.sh" >> mycron
crontab mycron
rm mycron

# start crontab service
crond

