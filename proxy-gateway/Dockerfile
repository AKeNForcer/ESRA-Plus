FROM zerotier/zerotier

RUN apt update

RUN apt install nginx -y

COPY entry.sh /entry.sh

RUN ["chmod", "+x", "/entry.sh"]

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY entrypoint.sh /entrypoint.sh

RUN ["chmod", "+x", "/entrypoint.sh"]

ENTRYPOINT ["/entry.sh"]

# RUN service nginx start