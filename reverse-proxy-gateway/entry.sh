#!/bin/bash
service nginx restart
echo network $ZEROTIER_NETWORK_ID
/entrypoint.sh