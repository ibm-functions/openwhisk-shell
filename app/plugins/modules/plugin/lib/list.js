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

const debug = require('debug')('plugins')
debug('loading')

const path = require('path'),
      fs = require('fs-extra'),
      { list:usage } = require('../usage'),
      util = require('util')

debug('finished module imports')

/**
 * Flatten an array of arrays
 *
 */
const flatten = arrays => [].concat.apply([], arrays)

/**
 * Pull out the sub-directories in the given directory, if it is an @-style npm group
 *
 */
const extractNested = root => dir => dir.charAt(0) === '@'
      ? fs.readdir(path.join(root, dir)).then(subdirs => subdirs.map(subdir => `${dir}/${subdir}`))
      : dir // we'll flatten this below

/**
 * Read the package.json of one given plugin to get its version
 *
 */
const getVersion = moduleDir => plugin => fs.readFile(path.join(moduleDir, plugin, 'package.json'))
      .then(JSON.parse)                         // parse the package.json
      .then(_ => _.version)                     // project out the version field
      .then(version => ({plugin, version}))     // return a pair of the plugin name and its version
      // for debugging: .then(_ => { console.error(_); return _ })

/**
 * Read the package.json of all plugins to get their versions
 *
 */
const getVersions = moduleDir => installedPlugins => Promise.all(installedPlugins.map(getVersion(moduleDir)))

const doList = (_a, _b, fullArgv, modules, rawCommandString, _2, argvWithoutOptions, dashOptions) => {
    debug('command execution started')

    const rootDir = ui.userDataDir()
    const moduleDir = path.join(rootDir, 'plugins', 'modules')

    // help the REPL render our records
    const type = 'plugins'

    return fs.pathExists(moduleDir)
        .then(exists => fs.readdir(moduleDir))                           // read the top-level directory contents
        .then(dirs => Promise.all(dirs.map(extractNested(moduleDir))))   // extract any @foo/bar nested plugins
        .then(flatten)                                                   // if there are nested plugins, we need to flatten the arrays
        .then(getVersions(moduleDir))
        .then(installedPlugins => {
            if (installedPlugins.length > 0) {
                //
                // make a list of records that includes more than just
                // the plugin name, so that the REPL can format them
                //
                return installedPlugins.map(({plugin, version}) => ({type, name: `${plugin}`,
                                                                     attributes: [ { key: 'version', value: version } ],
                                                                     onclick: () => repl.pexec(`plugin commands ${plugin}`)
                                                                    }))
            } else {
                return 'No user-installed plugins found'
            }
        }).catch(err => {
            if (err.code === 'ENOENT') {
                // this error is OK; it just means that moduleDir
                // doesn't exist, so there are no plugins to list!
                return 'No user-installed plugins found'
            } else {
                // some unpredicted error occurred :(
                console.error(err.code)
                console.error(err)
                throw new Error('Internal Error')
            }
        })
}

module.exports = (commandTree, prequire) => {
    commandTree.listen('/plugin/list', doList, { usage })
}

debug('loading done')
