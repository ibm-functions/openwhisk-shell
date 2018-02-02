/*
 * Copyright 2018 IBM Corporation
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

//
// test the edit actionName command
//
const common = require('../../../lib/common'),
      openwhisk = require('../../../lib/openwhisk'),
      ui = require('../../../lib/ui'),
      assert = require('assert'),
      keys = ui.keys,
      cli = ui.cli,
      sidecar = ui.sidecar,
      actionName = 'long'

describe('edit actions', function() {
    before(common.before(this))
    after(common.after(this))

    it('should have an active repl', () => cli.waitForRepl(this.app))

    it('should report 404 for edit non-existing action', () => cli.do('edit nope', this.app)
       .then(cli.expectError(404))
       .catch(common.oops(this)))

    it('should create an action', () => cli.do('let foo = x=>x', this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing('foo'))
       .catch(common.oops(this)))

    it('should edit with implicit entity', () => cli.do('edit', this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing('foo'))
       .catch(common.oops(this)))

    it('should create an second action', () => cli.do('let foo2 = x=>x', this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing('foo2'))
       .catch(common.oops(this)))

    // do this in a loop, to make sure we don't have any event listener leaks
    for (let idx = 0; idx < 20; idx++) {
        it(`should edit the first action iter=${idx}`, () => cli.do('edit foo', this.app)
           .then(cli.expectOK)
           .then(sidecar.expectOpen)
           .then(sidecar.expectShowing('foo'))
           .then(sidecar.expectBadge('v0.0.1'))
           .catch(common.oops(this)))
    }
    
    it('should edit the second action', () => cli.do('edit foo2', this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing('foo2'))
       .then(sidecar.expectBadge('v0.0.1'))
       .catch(common.oops(this)))

    it('should create a sequence', () => cli.do('let seq = x=>x -> x=>x', this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing('seq'))
       .catch(common.oops(this)))
    it('should report 406 for edit of sequence', () => cli.do('edit seq', this.app)
       .then(cli.expectError(406))
       .catch(common.oops(this)))

    it('should create a zip action', () => cli.do('let zippy.zip = data/zip', this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing('zippy'))
       .catch(common.oops(this)))
    it('should report 406 for edit of zip', () => cli.do('edit zippy', this.app)
       .then(cli.expectError(406))
       .catch(common.oops(this)))
})
