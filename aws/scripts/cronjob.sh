#!/bin/bash

dt=`date '+%d/%m/%Y_%H:%M:%S'`

echo "Importing files from S3 at $dt..." >> /var/log/cronjobs.log

# not using the $S3_BUCKET env variable because cronjob has issues loading them
/usr/local/bin/aws s3 sync s3://elasticbeanstalk-ap-southeast-2-782522910439/atomiCoconut/logs/server /aws/s3-logs/server/production >> /var/log/cronjobs.log
/usr/local/bin/aws s3 sync s3://elasticbeanstalk-ap-southeast-2-782522910439/atomiCoconut-testing/logs/server /aws/s3-logs/server/testing >> /var/log/cronjobs.log
/usr/local/bin/aws s3 sync s3://elasticbeanstalk-ap-southeast-2-782522910439/atomiCoconut/logs/nginx /aws/s3-logs/nginx/production >> /var/log/cronjobs.log
/usr/local/bin/aws s3 sync s3://elasticbeanstalk-ap-southeast-2-782522910439/atomiCoconut-testing/logs/nginx /aws/s3-logs/nginx/testing >> /var/log/cronjobs.log

echo "Files imported successfully." >> /var/log/cronjobs.log
echo " " >> /var/log/cronjobs.log