import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const bank=JSON.parse(fs.readFileSync(new URL('../content/qbank.json',import.meta.url),'utf8')).questions;
const out=path.resolve('../submission');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:out,size:{width:1440,height:900}}});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let issued=null;
page.on('response',async r=>{if(r.url().endsWith('/api/item')&&r.status()===200)issued=(await r.json()).item});
try{
 await page.goto('http://localhost:3000');
 await page.addStyleTag({content:'nextjs-portal{display:none}'});
 await page.waitForTimeout(2500);
 await page.getByRole('button',{name:'Continue as guest',exact:true}).click();
 await page.waitForTimeout(2500);
 await page.screenshot({path:path.join(out,'home-desktop.png'),fullPage:true});
 await page.getByRole('button',{name:'Choose a chapter',exact:true}).click();
 await page.waitForTimeout(1800);
 await page.locator('.topic-card').filter({hasText:'Vector components'}).click();
 for(let i=0;i<6;i++){
   await page.waitForTimeout(1500);
   if(!await page.locator('.question-card').count())break;
   const it=bank.find(x=>x.id===issued.id);
   const right=issued.options.indexOf(it.options[it.answer]);
   const wrong=issued.node==='vec_comp'&&issued.type==='B1';
   await page.locator('.answer-option').nth(wrong?(right+1)%issued.options.length:right).click();
   await page.waitForTimeout(700);
   await page.locator('.confidence-buttons button').first().click();
 }
 await page.waitForTimeout(1600);
 await page.screenshot({path:path.join(out,'diagnosis.png')});
 await page.locator('.learning-actions .primary').click();
 await page.waitForTimeout(1600);
 await page.screenshot({path:path.join(out,'repair.png')});
 await page.locator('.repair-cta').click();
 await page.waitForTimeout(2200);
 const it=bank.find(x=>x.id===issued.id);
 await page.locator('.answer-option').nth(issued.options.indexOf(it.options[it.answer])).click();
 await page.waitForTimeout(700);
 await page.locator('.confidence-buttons button').first().click();
 await page.waitForTimeout(2000);
 await page.locator('.result-card .result-icon.pass').waitFor();
 await page.screenshot({path:path.join(out,'repair-result.png')});
 await page.getByRole('button',{name:'Done',exact:true}).click();
 await page.getByRole('button',{name:'Concept map',exact:true}).click();
 await page.waitForTimeout(2000);
 await page.locator('[data-node="vec_comp"]').click();
 await page.waitForTimeout(2300);
 await page.screenshot({path:path.join(out,'concept-map.png')});
 const progress=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('kadi.student.v1')??'{}'));
 const seen=progress.seenQuestionIds??[];
 const exhausted=await page.request.post('http://localhost:3000/api/item',{data:{node:'vec_comp',type:'B1',exclude:seen}});
 if(exhausted.status()!==404)throw new Error('Seen diagnostic question was recycled');
 if(new Set(seen).size!==seen.length)throw new Error('Duplicate shown-question history');
 console.log('Core journey completed; seen items persist; exhausted pool returns 404. Browser errors:',JSON.stringify(errors));
}catch(error){console.error(error);await page.screenshot({path:path.join(out,'demo-debug.png')});process.exitCode=1}
finally{const video=page.video();await context.close();await video.saveAs(path.join(out,'athena-local-demo.webm'));await video.delete();await browser.close();console.log('Recording saved in submission/athena-local-demo.webm')}
