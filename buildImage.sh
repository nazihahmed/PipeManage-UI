#!/usr/bin/env bash
GIT_SHORT=$(git rev-parse --short HEAD)
echo 'building docker image: ${GIT_SHORT}'
docker build -t 925898274702.dkr.ecr.us-west-2.amazonaws.com/app-intel:${GIT_SHORT} .
docker push 925898274702.dkr.ecr.us-west-2.amazonaws.com/app-intel:${GIT_SHORT}
echo 'image pushed to registry, image url :'
echo '925898274702.dkr.ecr.us-west-2.amazonaws.com/app-intel:${GIT_SHORT}'
