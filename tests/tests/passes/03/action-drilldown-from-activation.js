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
      actionName = `foo-${new Date().getTime()}`,
      actionName2 = 'foo2',
      fs = require('fs')

describe('activation list, activation get, click on header', function() {
    before(common.before(this))
    after(common.after(this))

    it('should have an active repl', () => cli.waitForRepl(this.app))

    it('should create an action', () => cli.do(`let ${actionName} = x=>x -p x 3`, this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName))
       .catch(common.oops(this)))

    const expectedSrc = 'let main = x => x'

    it('should async that action and click on the activation id', () => cli.do(`async ${actionName}`, this.app)
       .then(cli.expectOKWithCustom(cli.makeCustom('.activationId', '')))
       .then(selector => this.app.client.getText(selector)
	     .then(activationId => this.app.client.click(selector)
		   .then(() => sidecar.expectOpen(this.app))
		   .then(sidecar.expectShowing(actionName, activationId))))
       .catch(common.oops(this)))

    it(`click on action name in sidecar header and show action source`, () => this.app.client.click(ui.selectors.SIDECAR_TITLE)
       .then(() => this.app)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName))
       .then(() => this.app.client.waitUntil(() => this.app.client.getText(ui.selectors.SIDECAR_ACTION_SOURCE))
             .then(x => x.trim())
             .then(actualSrc => actualSrc === expectedSrc))
       .catch(common.oops(this)))
})
