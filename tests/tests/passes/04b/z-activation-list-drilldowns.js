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

//
// tests that create an action and test that it shows up in the list UI
//    this test also covers toggling the sidecar
//
const common = require('../../../lib/common'),
      openwhisk = require('../../../lib/openwhisk'),
      ui = require('../../../lib/ui'),
      assert = require('assert'),
      keys = ui.keys,
      cli = ui.cli,
      sidecar = ui.sidecar,
      actionName = 'long'


describe('List activations, then drill down to summary views', function() {
    before(common.before(this))
    after(common.after(this))

    it('should have an active repl', () => cli.waitForRepl(this.app))

    const drilldownWith = command => {
        return it(`should list activations and click on ${command}`, () => cli.do(`$ ls`, this.app)
                  .then(cli.expectOKWithCustom({passthrough: true}))
                  .then(N => sidecar.expectClosed(this.app)
                        .then(() => `${ui.selectors.OUTPUT_N(N)} .list-paginator-left-buttons span[data-button-command="${command}"]`)
                        .then(sel => { console.error(`Looking for ${sel}`); return sel })
                        .then(sel => this.app.client.waitForEnabled(sel).then(() => sel))
                        .then(sel => this.app.client.click(sel))
                        .catch(err => this.app.client.getText(ui.selectors.OUTPUT_N(N))
                               .then(txt => {
                                   console.log(`huh, got this ${txt}`)
                                   throw err
                               })))
                  .then(() => this.app)
                  .then(sidecar.expectOpen)
                  .then(sidecar.expectShowing('Recent Activations'))
                  .catch(common.oops(this)))
    }

    const closeSidecar = () => {
        return it('should toggle the sidebar closed with escape', () => this.app.client.keys(keys.ESCAPE)                                            
                  .then(() => sidecar.expectClosed(this.app))
                  .catch(common.oops(this)))
    }

    drilldownWith('summary')
    closeSidecar()

    // timeline disabled shell issue #794
    //drilldownWith('timeline')
    //closeSidecar()

    drilldownWith('grid')
    closeSidecar()
})
