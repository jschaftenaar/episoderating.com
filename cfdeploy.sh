#!/bin/bash

echo "The branch is:"
echo "$1"

echo "$GITHUB_BASE_REF"
echo "$GITHUB_HEAD_REF"
echo "$GITHUB_BASE_REF"

#release/paigebot
if [ "$1" == "release/v1" ]; then
  curl -sL https://ibm.biz/idt-installer | bash
  ibmcloud cf install
  ibmcloud login -r us-south --apikey=$2
  ibmcloud target --cf
  ibmcloud cf push
fi
