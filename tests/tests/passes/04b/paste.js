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

const common = require('../../../lib/common'),
      openwhisk = require('../../../lib/openwhisk'),
      ui = require('../../../lib/ui'),
      assert = require('assert'),
      keys = ui.keys,
      cli = ui.cli,
      sidecar = ui.sidecar,
      actionName = 'foo',
      actionName2 = 'foo2',
      actionName3 = 'foo3',
      actionName4 = 'foo4',
      actionName5 = 'foo5',
      actionName6 = 'foo6',
      actionName7 = 'foo7',
      actionName8 = 'foo8'

describe('Execute commands via paste', function() {
    before(common.before(this))
    after(common.after(this))

    it('should have an active repl', () => cli.waitForRepl(this.app))

    it('should paste a single line and enter the newline manually', () => this.app.electron.clipboard.writeText(`let ${actionName} = x=>x`)
       .then(() => this.app.client.execute(() => document.execCommand('paste')))
       .then(() => cli.do(ui.keys.ENTER, this.app))
       .then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName))
       .catch(common.oops(this)))

    it('should paste a single line with terminating newline', () => cli.paste(`let ${actionName2} = x=>x\n`, this.app)
       .then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName2))
       .catch(common.oops(this)))

    it('should paste a single line with multiple terminating newlines', () => cli.paste(`let ${actionName3} = x=>x\n \n \n \n`, this.app)
       .then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName3))
       .catch(common.oops(this)))

    it('should paste two lines', () => cli.paste(`let ${actionName4} = x=>x\nlet ${actionName5} = x=>x\n`, this.app, 2)
       .then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName5))
       .catch(common.oops(this)))

    it('should get the action created by the first line', () => cli.do(`open ${actionName4}`, this.app)
       .then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName4))
       .catch(common.oops(this)))

    it('should paste three lines without trailing newline', () => this.app.electron.clipboard.writeText(`let ${actionName6} = x=>x\nlet ${actionName7} = x=>x\n\n\n\n   \n   \n\nlet ${actionName8} = x=>x`)
       .then(() => this.app.client.execute(() => document.execCommand('paste')))
       .then(() => cli.do(ui.keys.ENTER, this.app))
       .then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName8))
       .catch(common.oops(this)))

    it('should get the action created by the first line', () => cli.do(`open ${actionName6}`, this.app)
       .then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName6))
       .catch(common.oops(this)))
    it('should get the action created by the second line', () => cli.do(`open ${actionName7}`, this.app)
       .then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName7))
       .catch(common.oops(this)))
})
