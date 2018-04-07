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

const common = require('../../../lib/common'),
      openwhisk = require('../../../lib/openwhisk'),
      ui = require('../../../lib/ui'),
      fs = require('fs'),
      assert = require('assert'),
      keys = ui.keys,
      cli = ui.cli,
      sidecar = ui.sidecar,
      flip = 'flip'

const removeWhitespace = txt => txt.replace(/\s/g, '')

describe('blackbox actions from a shell script', function() {
    before(common.before(this))
    after(common.after(this))

    it('should have an active repl', () => cli.waitForRepl(this.app))

    const expectedFlipSource = removeWhitespace(fs.readFileSync('./data/flip.sh').toString())

    it('should create a blackbox action', () => cli.do(`wsk action create --native ${flip} ./data/flip.sh`, this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(flip))
       .then(() => this.app.client.getText(ui.selectors.SIDECAR_ACTION_SOURCE))
       .then(removeWhitespace)
       .then(txt => assert.equal(txt, expectedFlipSource))
       .catch(common.oops(this)))

    const N1 = 3
    it(`should invoke the native action with implicit entity`, () => cli.do(`invoke -p n ${N1}`, this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(flip))
       .then(sidecar.expectResultSubset({
           trials: N1
       }))
       .catch(common.oops(this)))

    const N2 = 4
    it(`should invoke (again) the native action with implicit entity`, () => cli.do(`invoke -p n ${N2}`, this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(flip))
       .then(sidecar.expectResultSubset({
           trials: N2
       }))
       .catch(common.oops(this)))

    it('should update a blackbox action variant 1', () => cli.do(`wsk action update --native ${flip} ./data/flip.sh`, this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(flip))
       .then(() => this.app.client.getText(ui.selectors.SIDECAR_ACTION_SOURCE))
       .then(removeWhitespace)
       .then(txt => assert.equal(txt, expectedFlipSource))
       .catch(common.oops(this)))

    it('should update a blackbox action variant 2', () => cli.do(`wsk action update ${flip} --native ./data/flip.sh`, this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(flip))
       .then(() => this.app.client.getText(ui.selectors.SIDECAR_ACTION_SOURCE))
       .then(removeWhitespace)
       .then(txt => assert.equal(txt, expectedFlipSource))
       .catch(common.oops(this)))

    it('should update a blackbox action variant 3', () => cli.do(`wsk action update ${flip} ./data/flip.sh --native`, this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(flip))
       .then(() => this.app.client.getText(ui.selectors.SIDECAR_ACTION_SOURCE))
       .then(removeWhitespace)
       .then(txt => assert.equal(txt, expectedFlipSource))
       .catch(common.oops(this)))

    const N3 = 5
    it(`should invoke (again) the native action, now with explicit`, () => cli.do(`invoke ${flip} -p n ${N3}`, this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(flip))
       .then(sidecar.expectResultSubset({
           trials: N3
       }))
       .catch(common.oops(this)))
})
