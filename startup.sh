#!/bin/sh

cd /home/node/app

if [ -d "/home/node/app/node_modules" ]; 
then
  echo "Skipping installing node_modules"
else
  npm ci
fi

if [ -d "/home/node/app/build" ];
then
  echo "Skipping running build"
else
  npm run build
fi

if [ -d "/home/node/app/cache" ];
then
  echo "cache directory exists"
else
  mkdir /home/node/app/cache
fi

npm start
