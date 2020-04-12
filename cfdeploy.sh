#!/bin/bash

echo "The branch is:"
echo "$1"

if [ "$1" == "refs/heads/release/v1" ]; then
  curl -sL https://ibm.biz/idt-installer | bash
  ibmcloud cf install
  ibmcloud login -r us-south --apikey=$2
  ibmcloud target --cf
  ibmcloud cf push
fi
