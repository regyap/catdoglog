// Exercise the running app without mocks at a phone-sized browser viewport.
const path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const appUrl = process.env.APP_URL;
  if(!appUrl) throw new Error('Set APP_URL to the running app HTTP address before checking the browser.');
  const browser = await chromium.launch({channel:process.env.SCREENSHOT_BROWSER || 'chrome',headless:true});
  try {
    const page = await browser.newPage({viewport:{width:430,height:932},deviceScaleFactor:2});
    const errors=[];
    page.on('pageerror', error=>errors.push(error.message));
    const sightings = page.waitForResponse(response=>response.url().includes('/api/sightings')).catch(error=>({error}));
    await page.goto(appUrl, {timeout:60000});
    await page.getByText(/nearby\?/).waitFor({timeout:60000});
    const response = await sightings;
    if(response.error) throw response.error;
    if(response.status()!==200 || !Array.isArray((await response.json()).sightings)) throw new Error('Sightings API failed');
    await page.locator('.leaflet-marker-icon').first().waitFor();
    if(await page.locator('.leaflet-marker-icon').count()!==4) throw new Error('Demo markers missing');
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('.leaflet-tile')).some(tile=>tile.naturalWidth>0));
    await page.getByRole('button',{name:'Follow your live location'}).click();
    await page.getByText(/Browser GPS needs HTTPS/).waitFor();
    await page.getByRole('button',{name:'Toggle satellite map'}).click();
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('.leaflet-tile')).some(tile=>tile.src.includes('arcgisonline') && tile.naturalWidth>0));
    await page.getByRole('button',{name:'Toggle satellite map'}).click();
    await page.getByText('My animals',{exact:true}).click();
    await page.getByText('Animals you’ve met',{exact:true}).waitFor();
    await page.getByText('Friends',{exact:true}).first().click();
    await page.getByText('Grow your care circle',{exact:true}).waitFor();
    await page.getByText('Profile',{exact:true}).click();
    await page.getByText('Your impact',{exact:true}).waitFor();
    await page.getByText('Explore',{exact:true}).click();
    await page.locator('.leaflet-marker-icon').first().waitFor();
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('.leaflet-tile')).some(tile=>tile.naturalWidth>0));
    await page.screenshot({path:path.resolve(__dirname,'../../docs/screenshots/web-explore.png')});
    if(errors.length) throw new Error(errors.join('\n'));
    console.log('PASS: real web UI, API response, four map markers, street/satellite tiles, HTTPS GPS message, and four tabs; no page errors.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
