/** Credentials exist only in the open dialog and the same-origin request body. */
async function openConnection() {
  const node=dialog('Connect OpenAI','<p class="small">Link your API account to review modules and prepare plans.</p><label for="openai-key">API key <span class="small">OPENAI_API_KEY</span></label><div class="connection-key"><input id="openai-key" type="password" autocomplete="off" spellcheck="false" maxlength="512" aria-describedby="key-help"><button type="button" id="show-key" aria-label="Show API key" aria-pressed="false">'+uiIcon('eye')+'</button></div><p id="key-help" class="small">Required. Stored on this computer by the local service.</p><label for="openai-model">Model ID <span class="small">OPENAI_MODEL</span></label><input id="openai-model" autocomplete="off" spellcheck="false" maxlength="200" required placeholder="Enter your model ID"><p class="notice connection-note">Link sends a small verification request to OpenAI. API usage charges may apply. Reviews and plans start separately.</p>','<button id="cancel-connection">Cancel</button><button id="link-connection" class="copy" disabled>Link</button>');
  node.classList.add('connection-dialog');
  const key=node.querySelector('#openai-key'),model=node.querySelector('#openai-model'),link=node.querySelector('#link-connection'),cancel=node.querySelector('#cancel-connection'),close=node.querySelector('[data-close]'),show=node.querySelector('#show-key'),error=node.querySelector('.dialog-error');
  let hasKey=false,loaded=false,busy=false;
  const update=()=>{link.disabled=!loaded||busy||!model.value.trim()||(!hasKey&&!key.value.trim());};
  key.oninput=model.oninput=()=>{error.textContent='';update();};
  show.onclick=()=>{const visible=key.type==='password';key.type=visible?'text':'password';show.innerHTML=uiIcon(visible?'eyeOff':'eye');show.setAttribute('aria-label',visible?'Hide API key':'Show API key');show.setAttribute('aria-pressed',String(visible));};
  cancel.onclick=()=>node.close();
  node.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  node.addEventListener('close',()=>{key.value='';});
  link.onclick=async()=>{
    if(link.disabled)return;
    if(key.value.trim()&&!/^[A-Za-z0-9_-]{20,512}$/.test(key.value.trim())){error.textContent='Enter a valid API key.';key.focus();return;}
    if(!/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/.test(model.value.trim())){error.textContent='Enter a valid model ID.';model.focus();return;}
    busy=true;error.textContent='';link.textContent='Connecting…';node.setAttribute('aria-busy','true');[key,model,cancel,close,show].forEach(control=>control.disabled=true);update();
    try{await api('/api/connection',{key:key.value.trim(),model:model.value.trim(),useSavedKey:hasKey&&!key.value.trim()});key.value='';node.close();await refreshWorkspace();notify('OpenAI connected. You can now start a review or plan.');}
    catch(failure){error.textContent=failure.message;}
    finally{busy=false;link.textContent='Link';node.removeAttribute('aria-busy');[key,model,cancel,close,show].forEach(control=>control.disabled=false);update();}
  };
  try{
    if(location.protocol==='file:')throw Error('Open http://127.0.0.1:6190 after starting the local planning service.');
    const state=await api('/api/connection');if(!node.open)return;
    hasKey=state.hasKey;model.value=state.model;loaded=true;key.required=!hasKey;
    if(hasKey){key.placeholder='Enter a new key to replace the saved key';node.querySelector('#key-help').textContent='A key is saved. Leave this field empty to keep it.';}
    update();(hasKey?model:key).focus();
  }catch{error.textContent='Local service unavailable. Start node scripts/reports/planning-server.mjs and open http://127.0.0.1:6190.';}
}
