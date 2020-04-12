#!/bin/bash

echo "The branch is:"
echo "$1"

if [ "$1" == "refs/heads/release/v1" ]; then
  if [ -z "$2" ]; then
    echo "Second parameter needed"
    exit 1;
  fi
  curl -sL https://ibm.biz/idt-installer | bash
  ibmcloud cf install
  ibmcloud login -r us-south --apikey=$2
  ibmcloud target --cf
  ibmcloud cf push
fi
