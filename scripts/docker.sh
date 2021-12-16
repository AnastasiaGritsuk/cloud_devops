#!/bin/bash

# our comment is here
myDir=$(pwd)
echo "The current directory is:"
$myDir
echo "The user logged in is:"
whoami

echo "I have \$1 in my pocket"

docker build -t quote-app1 ../quote-app/
