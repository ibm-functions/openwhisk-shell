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

const debug = require('debug')('plugin compile-command')
debug('loading')

const path = require('path'),
      compile = require('./compile'),
      { success } = require('./util')

debug('finished loading modules')

module.exports = commandTree => {
    commandTree.listen('/plugin/compile', () => {
        const rootDir = ui.userDataDir()
        return compile(rootDir, true)
            .then(([newCommands]) => success('installed', 'will be available, after reload', newCommands))
    })
}
