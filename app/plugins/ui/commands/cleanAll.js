/*
 * Copyright 2017 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const debug = require('debug')('wipe')

/**
 * This plugin introduces /wsk/wipe, which helps with removing all
 * entities from the current namespace. It also demonstrates the
 * prompt function of the repl.
 *
 */

/**
 * Log a message, then call the given function
 *
 */
const logThen = f => msg => {
    debug(`retry ${msg}`)
    return f()
}

/**
 * Delete all of the entities in the given `entities` array
 *
 */
const deleteAllOnce = entities =>
      Promise.all(entities.map(entity => {
	  const tryDelete = () => repl.qexec(`${entity.type} delete "/${entity.namespace}/${entity.name}"`)

	  // with retries...
	  return tryDelete()
              .catch(err => {
                  if (err.statusCode === 404) {
                      // ignore 404s, since we're deleting
                      debug('concurrent deletion')
                  } else {
                      throw err
                  }
              })
	      .catch(logThen(tryDelete)).catch(logThen(tryDelete)).catch(logThen(tryDelete)).catch(logThen(tryDelete))
		  .catch(logThen(tryDelete)).catch(logThen(tryDelete)).catch(logThen(tryDelete)).catch(logThen(tryDelete));
      }))

/**
 * List the entities of a given entity type (e.g. actions)
 *
 */
const list = type => repl.qexec(`${type} list --limit 200`)

/**
 * Because we can only list at most 200 entities at a time, we'll need to loop...
 *
 */
const deleteAllUntilDone = type => entities => {
    debug(`deleteAllUntilDone ${type} ${entities.length}`)

    if (entities.length === 0) {
	return Promise.resolve(true)
    } else {
	return deleteAllOnce(entities)
	    .then(() => list(type))
	    .then(deleteAllUntilDone(type))
    }
}

/**
 * This method initiates the deleteAllUntilDone loop
 *
 */
const clean = (type, quiet) => {
    if (!quiet) {
        if (ui.headless) {
            process.stdout.write('.'.random)
        } else {
            debug(`Cleaning ${type}`)
        }
    }
    return list(type).then(deleteAllUntilDone(type))
}

/**
 * Handle 404s with a retry of the given operation
 *
 */
const handle404s = retry => err => {
    if (err.statusCode === 404) {
        // ignore 404s, since we're deleting!
        return retry()
    } else {
        console.error(err)
        throw err
    }
}

/**
 * The main wipe method: clean triggers and actions, then rules and packages
 *
 */
const doWipe1 = quiet => Promise.all([clean('trigger', quiet), clean('action', quiet)]).catch(handle404s(() => doWipe1(true)));
const doWipe2 = quiet => Promise.all([clean('rule', quiet), clean('package', quiet)]).catch(handle404s(() => doWipe2(true)));
const doWipe = () => doWipe1().then(() => doWipe2()).then(() => {
    if (ui.headless) {
        // we did process.stdout.write above, so clear a newline
        console.log('.'.random)
    }
})

/**
 * This is the exported module
 *
 */
module.exports = commandTree => commandTree.listen('/wsk/wipe', (block, nextBlock, argv) => {
    //
    // first, hide the sidecar
    //
    const sidecarVisibility = plugins.require('/views/sidecar/visibility')
    sidecarVisibility.hide(true) // true means clean out current selection

    //
    // then ask the user to confirm the dangerous operation
    //
    return repl.prompt('DANGER!', block, nextBlock, {
        placeholder: 'This operation will remove all entities. Enter "yes" to confirm.',
        dangerous: true
    }, options => {
        if (options.field !== 'yes') {
            //
            // the user didn't type 'yes', get out of here!
            //
            return Promise.reject('Operation cancelled')
        } else {
	    //
	    // here is the core logic, initiate the wipe, then return to the home context with a message
	    //
	    return doWipe()
	        .then(() => commandTree.cdToHome('Your OpenWhisk assets have been successfully removed')) // change back to the home context
                .catch(err => {
		    console.error(`wipe::oops ${err}`)
		    console.error(err)
		    throw err
	        })
        }
    })
}, { docs: 'Remove all of your OpenWhisk assets from the current namespace' })
