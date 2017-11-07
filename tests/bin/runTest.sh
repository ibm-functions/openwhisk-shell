#
# Copyright 2017 IBM Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

#!/usr/bin/env bash

#
# This script runs a given test suite "layer". We try at most three
# times for success.
#

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
ROOTDIR="$SCRIPTDIR/../.."

if [ -n "$LAYER" ]; then
    # user asked to run tests in just one specified layer, e.g. "07"

    if [ -n "$KEY_FROM_LAYER" ]; then
        # user asked to pick up a previously configured auth key
        DIR=$ROOTDIR/.openwhisk-shell/keys

        export AUTH=`cat $DIR/${LAYER}`
        export __OW_API_KEY="$AUTH"
        export TEST_ORG=""
        export TEST_SPACE="ns${LAYER}"

        echo "Key from layer $TEST_SPACE"

        if [ -f "$DIR/${LAYER}b" ]; then
            # some layers need a second auth and namespace
            export AUTH2=`cat $DIR/${LAYER}b`
            export TEST_SPACE2="ns${LAYER}b"
        fi

        # echo "LAYER=$LAYER; KEY=${__OW_API_KEY}"
    fi

    LAYER="passes/${LAYER}"
fi

#
# note that, in the following, passing --bail to mocha means we fail
# fast, if any test within the test suite fails
#

NYC="${SCRIPTDIR}/../node_modules/.bin/nyc"

export RUNNING_SHELL_TEST=true
NO_USAGE_TRACKING=true "$NYC" -silent mocha -c --bail --recursive --timeout ${TIMEOUT-60000} tests/$LAYER

if [ $? != 0 ]; then
    # oops, the test suite failed. we will restart, in the hopes that a second try works
    NO_USAGE_TRACKING=true "$NYC" --silent mocha -c --bail --recursive --timeout ${TIMEOUT-60000} tests/$LAYER
    if [ $? != 0 ]; then
        # oops, the test suite failed, again! let's try one last time
        NO_USAGE_TRACKING=true "$NYC" --silent mocha -c --bail --recursive --timeout ${TIMEOUT-60000} tests/$LAYER
    fi
fi
