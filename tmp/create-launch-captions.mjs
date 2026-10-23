import {chapters} from '../docs/video/medsy-launch/story.js';
import fs from 'node:fs';
const stamp=s=>`00:${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')},000`;
fs.writeFileSync('docs/video/medsy-launch/medsy-product-introduction.srt',chapters.map((s,i)=>`${i+1}\n${stamp(s.start)} --> ${stamp(s.end)}\n${s.caption}\n`).join('\n'));
