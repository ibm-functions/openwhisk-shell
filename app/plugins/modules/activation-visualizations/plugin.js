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

const { toplevel:usage } = require('./usage')

/**
 * This is the module
 *
 */
module.exports = (commandTree, prequire) => {
    // register the top-level usage handler
    commandTree.subtree('/visualize', { usage })

    // register the command handlers
    require('./lib/grid')(commandTree, prequire)
    require('./lib/timeline-histogram')(commandTree, prequire)
    require('./lib/table')(commandTree, prequire)
    require('./lib/mirror')(commandTree, prequire)

    // exported API
    const { injectContent } = require('./lib/util'),
          { renderCell } = require('./lib/cell')
   
    return {
        renderCell: function() {
            injectContent()
            return renderCell.apply(undefined, arguments)
        }
    }
}
