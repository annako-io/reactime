/* eslint-disable jest/no-disabled-tests */
/* eslint-disable react/state-in-constructor */
/* eslint-disable lines-between-class-members */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/order */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable react/jsx-filename-extension */
import { string } from 'prop-types';
import React, { useState } from 'react';
import { render } from 'react-dom';
import linkFiberStart from '../linkFiber';

const puppeteer = require('puppeteer');
const SERVER = require('../puppeteerServer');

// Apple uses port 5000 for Air Play.
const APP = 'http://localhost:5001';

let linkFiber;
let mode;
let snapShot;

let browser;
let page;

interface fooState {
  foo: string,
  setFoo?: (string) => void
}
function App(): JSX.Element {
  const [fooState, setFooState] = useState({
    foo: 'bar',
  });
  return (
    <div>{fooState}</div>
  );
}

xdescribe('unit test for linkFiber', () => {
  beforeAll(async () => {
    await SERVER;
    const args = puppeteer.defaultArgs().filter(arg => String(arg).toLowerCase() !== '--disable-extensions');
    browser = await puppeteer.launch({
      args: args.concat(['--no-sandbox', '--disable-setuid-sandbox',
        '---extensions-on-chrome-urls',
        '--whitelisted-extension-id=fmkadmapgofadopljbjfkapdkoienihi',
        '--whitelisted-extension-id=hilpbahfbckghckaiafiiinjkeagmfhn',
        '--load-extension=/mnt/d/Libraries/Documents/codeRepos/reactime/src/extension/build']),
      devtools: true,
      ignoreDefaultArgs: true,
    });

    const c = await puppeteer.connect({
      browserWSEndpoint: browser.wsEndpoint(),
      ignoreHTTPSErrors: false,
    });

    page = await browser.newPage();
  });

  afterAll(async () => {
    await SERVER.close();

    await browser.close();
  });

  beforeEach(() => {
    snapShot = { tree: null };
    mode = {
      jumping: false,
      paused: false,
    };
    linkFiber = linkFiberStart(snapShot, mode);

    page.waitForFunction(async lf => {
      const container = document.createElement('div');
      render(<App />, container);
      lf(container);
    }, {}, linkFiber);
  });

  test('type of tree should be an object', () => {
    expect(typeof snapShot.tree).toBe('object');
  });

  test.skip('linkFiber should mutate the snapshot tree property', () => {
    expect(snapShot.tree.state).toBe('root');
    expect(snapShot.tree.children).toHaveLength(1);
    expect(snapShot.tree.children[0].component.state.foo).toBe('bar');
  });

  test.skip('linkFiber should modify the setState of the stateful component', () => {
    expect(snapShot.tree.children[0].component.setState.linkFiberChanged).toBe(true);
  });
});

SERVER.close();
