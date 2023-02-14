#!/bin/sh

grepzt() {
  [ -f /var/lib/zerotier-one/zerotier-one.pid -a -n "$(cat /var/lib/zerotier-one/zerotier-one.pid 2>/dev/null)" -a -d "/proc/$(cat /var/lib/zerotier-one/zerotier-one.pid 2>/dev/null)" ]
  return $?
}

mkztfile() {
  file=$1
  mode=$2
  content=$3

  mkdir -p /var/lib/zerotier-one
  echo "$content" > "/var/lib/zerotier-one/$file"
  chmod "$mode" "/var/lib/zerotier-one/$file"
}

if [ "x$ZEROTIER_API_SECRET" != "x" ]
then
  mkztfile authtoken.secret 0600 "$ZEROTIER_API_SECRET"
fi

if [ "x$ZEROTIER_IDENTITY_PUBLIC" != "x" ]
then
  mkztfile identity.public 0644 "$ZEROTIER_IDENTITY_PUBLIC"
fi

if [ "x$ZEROTIER_IDENTITY_SECRET" != "x" ]
then
  mkztfile identity.secret 0600 "$ZEROTIER_IDENTITY_SECRET"
fi

mkztfile zerotier-one.port 0600 "9993"

killzerotier() {
  log "Killing zerotier"
  kill $(cat /var/lib/zerotier-one/zerotier-one.pid 2>/dev/null)
  exit 0
}

log_header() {
  echo -n "\r=>"
}

log_detail_header() {
  echo -n "\r===>"
}

log() {
  echo "$(log_header)" "$@"
}

log_params() {
  title=$1
  shift
  log "$title" "[$@]"
}

log_detail() {
  echo "$(log_detail_header)" "$@"
}

log_detail_params() {
  title=$1
  shift
  log_detail "$title" "[$@]"
}

trap killzerotier INT TERM

log "Configuring networks to join"
mkdir -p /var/lib/zerotier-one/networks.d

log_params "Joining networks:" $@
for i in "$@"
do
  log_detail_params "Configuring join:" "$i"
  touch "/var/lib/zerotier-one/networks.d/${i}.conf"
done

log "Starting ZeroTier"
nohup /usr/sbin/zerotier-one &

while ! grepzt
do
  log_detail "ZeroTier hasn't started, waiting a second"

  if [ -f nohup.out ]
  then
    tail -n 10 nohup.out
  fi

  sleep 1
done

log_params "Writing healthcheck for networks:" $@

cat >/healthcheck.sh <<EOF
#!/bin/bash
for i in $@
do
  [ "\$(zerotier-cli get \$i status)" = "OK" ] || exit 1
done
EOF

chmod +x /healthcheck.sh

log_params "zerotier-cli info:" "$(zerotier-cli info)"

zerotier-cli join $ZEROTIER_NETWORK_ID

service nginx restart

log "Sleeping infinitely"
while true
do
  sleep 1
done