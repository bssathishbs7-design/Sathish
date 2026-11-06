import test from 'node:test';
import assert from 'node:assert/strict';
import { teamRoles, rolesForRequest } from './team-hierarchy.mjs';
test('each leadership stage follows its reports and optional AI scope adds exactly one specialist',()=>{
  for(const includeAI of [false,true]){
    const roles=rolesForRequest({includeAI});
    assert.equal(roles.length,includeAI?11:10);
    assert.equal(roles.at(-1).id,'executive');
    for(const role of roles)if(role.parent)assert.ok(roles.findIndex(r=>r.id===role.parent)>roles.indexOf(role),role.name);
  }
  assert.equal(new Set(teamRoles.map(r=>r.id)).size,11);
  assert.ok(teamRoles.some(r=>r.ownership.includes('recovery')));
  assert.ok(teamRoles.some(r=>r.ownership.includes('communication')));
});
