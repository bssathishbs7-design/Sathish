import {browser} from './cdp.mjs';const b=await browser();console.log((await b.evaluate('document.querySelector("#status").textContent')).result.value);b.close();
