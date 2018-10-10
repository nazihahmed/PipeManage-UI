#!/usr/bin/env bash
GIT_SHORT=$(git rev-parse --short HEAD)
green=`tput setaf 2`
red=`tput setaf 1`
reset=`tput sgr0`
echo "building Docker image:${red} ${GIT_SHORT}${reset}"
docker build -t 925898274702.dkr.ecr.us-west-2.amazonaws.com/app-intel:${GIT_SHORT} .
$(aws ecr get-login --no-include-email --region us-west-2) &&
docker push 925898274702.dkr.ecr.us-west-2.amazonaws.com/app-intel:${GIT_SHORT} &&
echo 'image pushed to registry, image url :' &&
echo "${green}925898274702.dkr.ecr.us-west-2.amazonaws.com/app-intel:${GIT_SHORT}${reset}" ||
echo "${red}failed to push image to registry${reset}"
