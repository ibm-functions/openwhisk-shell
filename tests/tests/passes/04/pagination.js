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
      actionName = `paginator-test-${new Date().getTime()}`,
      actionName2 = `test-paginator-${new Date().getTime()}` // intentionally jumbled w.r.t. actionName

// number of invocations; the paginator will use a limit of NN / 2, so
// this must be a multiple of 2
const NN = 4

/**
 * Invoke the given action NN times, each time waiting for the
 * activationId to show up in the activation list results
 *
 */
const invokeABunch = (ctx, actionName) => {
    for (let idx = 0; idx < NN; idx++) {
        it(`should invoke it idx=${idx}`, () => cli.do(`wsk action invoke ${actionName}`, ctx.app)
	   .then(cli.expectJustOK)
           .then(sidecar.expectOpen)
           .then(sidecar.expectShowing(actionName))
           .then(() => ctx.app.client.getText(ui.selectors.SIDECAR_ACTIVATION_ID)) // get the activationId
           .then(activationId => ui.waitForActivation(ctx.app, activationId, { name: actionName })) // wait till activation list shows it
           .catch(common.oops(ctx)))
    }
}

/**
 * List activations, paginate back and forth, optionally filtering by
 * the given action
 *
 */
const testPagination = (ctx, actionName) => {
    const { app } = ctx

    const limit = NN / 2,
          extraArgs = actionName ? `--name ${actionName}` : ''

    // selector that identifies the REPL output of the command just executed
    const lastBlock = 'repl .repl-block:nth-last-child(2)',
          tableRows = `${lastBlock} .log-line`,
          tableRowsFiltered = actionName ? `${tableRows}[data-name="${actionName}"]` : tableRows,
          description = `${lastBlock} .list-paginator-description`,
          prevButton = `${lastBlock} .list-paginator-button-prev`,
          nextButton = `${lastBlock} .list-paginator-button-next`

    return cli.do(`$ ls --limit ${limit} ${extraArgs}`, app)
        .then(cli.expectJustOK)
        .then(() => app.client.waitUntil(() => {
            return Promise.all([app.client.getText(description), app.client.elements(tableRowsFiltered)])
                .then(([paginatorText, rows]) => {
                    return paginatorText.indexOf(`1\u2013${limit} of`) === 0 // starts with "1-limit of" ...
                        && rows.value.length === limit
                })
        }))

        // click next button
        .then(() => app.client.click(nextButton))
        .then(() => app.client.waitUntil(() => {
            return Promise.all([app.client.getText(description), app.client.elements(tableRowsFiltered)])
                .then(([paginatorText, rows]) => {
                    return paginatorText.indexOf(`${limit + 1}\u2013${limit + limit} of`) === 0 // starts with 'N+1-N+limit+1 of'
                        && rows.value.length === limit
                })
        }))

        // click prev button
        .then(() => app.client.click(prevButton))
        .then(() => app.client.waitUntil(() => {
            return Promise.all([app.client.getText(description), app.client.elements(tableRowsFiltered)])
                .then(([paginatorText, rows]) => {
                    return paginatorText.indexOf(`1\u2013${limit} of`) === 0 // starts with "1-limit of" ...
                        && rows.value.length === limit
                })
        }))

        .catch(common.oops(ctx))
}

describe('Activation list paginator', function() {
    before(common.before(this))
    after(common.after(this), () => cli.do(`wsk rule rm ${ruleName}`))

    it('should have an active repl', () => cli.waitForRepl(this.app))

    it(`should create an action ${actionName}`, () => cli.do(`create ${actionName} ./data/foo.js`, this.app)
       .then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName)))

    it(`should create an action ${actionName2}`, () => cli.do(`create ${actionName2} ./data/foo.js`, this.app)
       .then(cli.expectJustOK)
       .then(sidecar.expectOpen)
       .then(sidecar.expectShowing(actionName2)))

    invokeABunch(this, actionName)
    it('paginate activations without filter', () => testPagination(this))

    invokeABunch(this, actionName2)
    it(`paginate activations with filter ${actionName}`, () => testPagination(this, actionName))
    it(`paginate activations with filter ${actionName2}`, () => testPagination(this, actionName2))
})
