FROM amazon/aws-cli:2.2.20
# latest version tested


# isntall crontab
RUN yum install -y cronie sudo which

# start crontab on boot
RUN chkconfig crond on

# create directories
RUN mkdir -p /aws/s3-logs/server/production
RUN mkdir -p /aws/s3-logs/server/testing
RUN mkdir -p /aws/s3-logs/nginx/production
RUN mkdir -p /aws/s3-logs/nginx/testing
RUN mkdir -p /aws/init

# this script is for startup of the container
COPY startup.sh /aws
# this script defines what this cronjob does
COPY cronjob.sh /aws
# exec permissions
RUN chmod -x /aws/*.sh

VOLUME [ "/root/.aws" ]
VOLUME [ "/aws/s3-logs" ]
VOLUME ["/aws/init"]

# tail the dummy file
ENTRYPOINT [ "sh", "startup.sh" ]