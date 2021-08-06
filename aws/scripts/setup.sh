#!/bin/bash

# setup cronjob
echo "*/${S3_SYNC_FRECUENCY_MIN} * * * * sh /aws/scripts/cronjob.sh" >> mycron
crontab mycron
rm mycron

# start crontab service
crond

