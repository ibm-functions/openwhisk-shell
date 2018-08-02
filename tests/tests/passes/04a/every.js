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
      actionName = 'foo',
      interval = '3s',
      WAIT_TIME = 6000,  // <---- !!!!!!!!!!! IMPORTANT this value must be greater than interval, and expressed in millis
      ruleName = `every_${interval}_do_${actionName}`

/** Turn an list of strings into a map */
const toMap = L => L.reduce((M, elt) => { M[elt] = true; return M }, {})

describe('Create a rule using every', function() {
    // alarms tests disabled
    return

    before(common.before(this))
    after(common.after(this), () => cli.do(`wsk rule rm ${ruleName}`))

    it('should have an active repl', () => cli.waitForRepl(this.app))

    /** keep track of activations, and whether new activations show up */
    let priorActivations
    const lookForSomethingNew = newActivations => {
        for (activation in newActivations) {
            if (!priorActivations[activation]) {
                return true // yup, we found something new
            }
        }
        return false // failure
    }
    
    // remember the current list of activations
    it('should list activations, so we can remember them', () => cli.do(`wsk activation list`, this.app)
	.then(cli.expectOKWithCustom({ selector: '.activationId .clickable', elements: true }))
       .then(activations => Promise.all(activations.value.map(activation => this.app.client.elementIdText(activation.ELEMENT).then(elt => elt.value))))
       .then(toMap)
       .then(M => { priorActivations = M }))

    // create an action, using the implicit entity type
    it('should create an action', () => cli.do(`create ${actionName} ./data/foo.js`, this.app)
	.then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName)))

    // create the second action
    it('should create a rule using every', () => cli.do(`every ${interval} do ${actionName}`, this.app)
	.then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(ruleName)))

    // list tests
    ui.aliases.list.forEach(cmd => {
	it(`should find the new rule with "${cmd}"`, () => cli.do(cmd, this.app).then(cli.expectOKWithOnly(ruleName)))
	it(`should find the new rule with "rule ${cmd}"`, () => cli.do(`rule ${cmd}`, this.app).then(cli.expectOKWithOnly(ruleName)))
	it(`should find the new rule with "wsk rule ${cmd}"`, () => cli.do(`wsk rule ${cmd}`, this.app).then(cli.expectOKWithOnly(ruleName)))
    })

    // now see if the rule is live
    it('should list activations and find new invocations of foo', () => this.app.client.pause(WAIT_TIME)
       .then(() => cli.do(`wsk activation list`, this.app))
       .then(cli.expectOKWithCustom({ selector: '.activationId .clickable', elements: true }))
       .then(activations => Promise.all(activations.value.map(activation => this.app.client.elementIdText(activation.ELEMENT).then(elt => elt.value))))
       .then(toMap)
       .then(lookForSomethingNew)
       .then(somethingNew => assert(somethingNew)))

    // delete the rule
    it('should delete the rule, using implicit context', () => cli.do(`rm`, this.app)
	.then(cli.expectJustOK)
       .then(sidecar.expectClosed))

    // we should be able to re-create the rule, now
    it('should re-create the rule using every', () => cli.do(`every ${interval} do ${actionName}`, this.app)
	.then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(ruleName)))

    // for good measure, try deleting the rule again, this time using an explicit name
    it('should delete the rule, using an explicit name', () => cli.do(`rm ${ruleName}`, this.app)
	.then(cli.expectJustOK)
       .then(sidecar.expectClosed))
})
