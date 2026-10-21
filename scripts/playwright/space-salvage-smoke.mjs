// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {chromium} from 'playwright';
import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';
const browser=await chromium.launch(getPlaywrightLaunchOptions({headless:true,backend:'webgpu-core'}));
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.goto(process.env.SPACE_SALVAGE_URL || 'http://127.0.0.1:5200/');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('running'),null,{timeout:120000});
 await page.locator('button[aria-expanded]').first().click();
 await page.locator('#pause').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('paused'));const paused=await page.locator('#status').textContent();await page.waitForTimeout(500);if(paused!==await page.locator('#status').textContent())throw new Error('Simulation advanced while paused');console.log('pause',paused);await page.locator('#pause').click();await page.locator('button[aria-expanded]').first().click();
 let previous=[-11,2];let previousTime=0;let held=[];
 for(let iteration=0;iteration<70;iteration++){
  const nav=(await page.locator('#navigation').textContent()).match(/-?\d+\.?\d*/g).map(Number);const time=Number((await page.locator('#status').textContent()).match(/[\d.]+/)[0]);
  const elapsed=time-previousTime;const velocity=elapsed>0?nav.map((value,index)=>(value-previous[index])/elapsed):[0,0];
  const delta=[-14-nav[0],8-nav[1]];
  for(const key of held)await page.keyboard.up(key);held=[];
  if(Math.hypot(...delta)<0.55){await page.keyboard.down('Space');await page.waitForTimeout(1000);await page.keyboard.up('Space');break;}
  const acceleration=delta.map((value,index)=>value*1.4-velocity[index]*2.3);
  if(Math.abs(acceleration[0])>0.5)held.push(acceleration[0]>0?'KeyD':'KeyA');
  if(Math.abs(acceleration[1])>0.5)held.push(acceleration[1]>0?'KeyW':'KeyS');
  for(const key of held)await page.keyboard.down(key);
  previous=nav;previousTime=time;await page.waitForTimeout(200);
 }
 for(const key of held)await page.keyboard.up(key);
 console.log('docking position',await page.locator('#navigation').textContent());
 // First cargo starts at (-7, 6); top-down viewport spans 44.8 x 28 world units.
 await page.mouse.move(((-7/22.4)+1)*720,(1-6/14)*450);await page.mouse.down();
 await page.waitForFunction(()=>document.querySelector('#cargo-count').textContent!=='0 / 5',null,{timeout:45000});await page.mouse.up();
 console.log('recovery',await page.locator('#cargo-count').textContent(),await page.locator('#target').textContent());
 if(process.env.SPACE_SALVAGE_SCREENSHOT)await page.screenshot({path:process.env.SPACE_SALVAGE_SCREENSHOT});
 await page.keyboard.press('KeyR');await page.waitForFunction(()=>document.querySelector('#cargo-count').textContent==='0 / 5',null,{timeout:30000});
 console.log('reset',await page.locator('#hull').textContent(),await page.locator('#navigation').textContent());console.log('errors',errors,'startup',await page.locator('#startup-error').textContent());
 if(errors.length||await page.locator('#startup-error').textContent())process.exitCode=1;
}finally{await browser.close();}
