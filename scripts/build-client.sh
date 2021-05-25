#!/usr/bin/env bash

zipFile=../static/client-app.zip

if [[ -f $zipFile ]]
then
  rm -r $zipFile
fi

npm run build
zip -r  $zipFile ../static
