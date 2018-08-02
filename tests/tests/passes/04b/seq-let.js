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
      seqName = 'seq',
      seqName2 = 'seq2',
      seqName3 = 'seq3',
      seqName4 = 'seq4',
      seqName5 = 'seq5',
      actionNames = ['a', 'b', 'c']

describe('Create a sequence via let', function() {
    before(common.before(this))
    after(common.after(this))

    it('should have an active repl', () => cli.waitForRepl(this.app))

    // create the component actions
    actionNames.forEach(actionName => {
        it('should create an action via let', () => cli.do(`let ${actionName}.js = x=>x`, this.app)
	    .then(cli.expectJustOK)
           .then(sidecar.expectOpen)
           .then(sidecar.expectShowing(actionName)))
    })

    // create the sequence with white spaces
    it('should create a sequence with white spaces', () => cli.do(`let ${seqName} = ${actionNames.join(' -> ')}`, this.app)
	.then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(seqName)))

    // create the sequence without white spaces
    it('should create a sequence without white spaces', () => cli.do(`let ${seqName2}=${actionNames.join('->')}`, this.app)
	.then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(seqName2)))

    // create the sequence with white spaces
    it('should create a sequence with inline function', () => cli.do(`let ${seqName4} = a->x=>({y:x.y})->b`, this.app)
	.then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(seqName4)))

    // create the sequence with white spaces
    it('should create a sequence with two inline functions', () => cli.do(`let ${seqName5} = a->x=>({y:x.y})->x=>({y:x.y})->b`, this.app)
	.then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(seqName5)))

    // do a recursive delete
    it(`should delete ${seqName5} and its two inline anonymous functions`, () => cli.do(`rm -r ${seqName5}`, this.app)
	.then(cli.expectOKWithCustom({ expect: 'deleted 3 elements', exact: true }))
       .then(sidecar.expectClosed))

    // create the sequence with a max of white spaces
    it('should create a sequence with a mix of white space', () => cli.do(`let ${seqName3}= ${actionNames.join('-> ')}`, this.app)
	.then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(seqName3)))

    // invoke one of the sequences
    it('should do an async of the sequence, using implicit context', () => cli.do(`async -p y 3`, this.app)
	.then(cli.expectJustOK))

    // call await
    it('should await successful completion of the activation', () => cli.do(`await`, this.app)
	.then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(seqName3))
       .then(() => this.app.client.getText(ui.selectors.SIDECAR_ACTIVATION_RESULT))
       .then(ui.expectStruct({"y":3})))
})
