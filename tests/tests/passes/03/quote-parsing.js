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
      assert = require('assert'),
      keys = ui.keys,
      cli = ui.cli,
      sidecar = ui.sidecar,
      actionName = 'foo'

describe('parameter parsing with quotes', function() {
    before(common.before(this))
    after(common.after(this))

    it('should have an active repl', () => cli.waitForRepl(this.app))

    const createWith = params => {
        return it(`should create package with -p creds ${params}`, () => cli.do(`package update ppp -p creds ${params}`, this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing('ppp'))
       .catch(common.oops(this)))
    }

    const expectParams = params => {
        return it('should show parameters', () => cli.do('params', this.app)
                  .then(cli.expectOK)
                  .then(sidecar.expectOpen)
                  .then(sidecar.expectShowing('ppp'))
                  .then(app => app.client.getText(`${ui.selectors.SIDECAR_PACKAGE_PARAMETERS}`))
                  .then(ui.expectStruct(params))
                  .catch(common.oops(this)))
    }

    createWith(`'"foo" "bar"'`)
    expectParams({creds:'"foo" "bar"'})

    createWith(`{"foo":"bar"}`)
    expectParams({creds:{foo:"bar"}})

    createWith(`{"'foo'":"bar"}`)
    expectParams({creds:{"'foo'":"bar"}})

    createWith(`'{"foo": "bar"}'`)
    expectParams({creds:{foo:"bar"}})

    createWith(`{"foo":{"bar":"baz"}}`)
    expectParams({creds:{foo:{bar:"baz"}}})
})
