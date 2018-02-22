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
// tests wsk package bind
//
const common = require('../../../lib/common'),
      openwhisk = require('../../../lib/openwhisk'),
      ui = require('../../../lib/ui'),
      assert = require('assert'),
      keys = ui.keys,
      cli = ui.cli,
      sidecar = ui.sidecar,
      actionName = 'foo'

describe('wsk action update without input file', function() {
    before(common.before(this))
    after(common.after(this))

    it('should have an active repl', () => cli.waitForRepl(this.app))

    it('should create an action', () => cli.do(`let ${actionName} = x=>x -p x 3`, this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName))
       .catch(common.oops(this)))

    it('should switch to parameters mode', () => cli.do('parameters', this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName))
       .then(app => app.client.getText(`${ui.selectors.SIDECAR_CONTENT} .action-source`))
       .then(ui.expectStruct({"x":3}))
       .catch(common.oops(this)))

    it('should update the action with no code via fsh action update', () => cli.do(`fsh action update ${actionName} -p y 5`, this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName))
       .catch(common.oops(this)))
    it('should switch to parameters mode and verify updated params', () => cli.do('parameters', this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName))
       .then(app => app.client.getText(`${ui.selectors.SIDECAR_CONTENT} .action-source`))
       .then(ui.expectStruct({"y":5})) // note that the original parameter binding is expected to be overwritten
       .catch(common.oops(this)))

    it('should update the action with no code via bx wsk action update', () => cli.do(`bx wsk action update ${actionName} -p y 6`, this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName))
       .catch(common.oops(this)))
    it('should switch to parameters mode and verify updated params', () => cli.do('parameters', this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName))
       .then(app => app.client.getText(`${ui.selectors.SIDECAR_CONTENT} .action-source`))
       .then(ui.expectStruct({"y":6})) // note that the original parameter binding is expected to be overwritten
       .catch(common.oops(this)))

    it('should update the action with no code', () => cli.do(`wsk action update ${actionName} -p y 4`, this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName))
       .catch(common.oops(this)))

    it('should switch to parameters mode and verify updated params', () => cli.do('parameters', this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName))
       .then(app => app.client.getText(`${ui.selectors.SIDECAR_CONTENT} .action-source`))
       .then(ui.expectStruct({"y":4})) // note that the original parameter binding is expected to be overwritten
       .catch(common.oops(this)))

    it('should update the action, this time with a file', () => cli.do(`wsk action update ${actionName} -p name updater ./data/foo.js`, this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName))
       .catch(common.oops(this)))

    it('should switch to parameters mode and verify updated params', () => cli.do('parameters', this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName))
       .then(app => app.client.getText(`${ui.selectors.SIDECAR_CONTENT} .action-source`))
       .then(ui.expectStruct({"name":"updater"})) // note that the original parameter binding is expected to be overwritten
       .catch(common.oops(this)))

    it('should invoke the new code', () => cli.do(`wsk action invoke ${actionName}`, this.app)
       .then(cli.expectOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName))
       .then(app => app.client.getText(ui.selectors.SIDECAR_ACTIVATION_RESULT))
       .then(ui.expectStruct({ name: 'Step1 updater' }))
       .catch(common.oops(this)))
})
