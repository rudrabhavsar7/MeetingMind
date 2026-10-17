import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import { WebSocketServer } from 'ws';

let frames = 0;
let ended = 0;
let nonSilent = false;
const frameRmsLevels = [];
const frameProcessingDelayMs = Number(process.env.MEETINGMIND_SMOKE_FRAME_PROCESS_DELAY_MS ?? 0);
const controls = [];
const meetings = [];
const workspaceId = '11111111-1111-4111-8111-111111111111';
const meetingId = '22222222-2222-4222-8222-222222222222';
const actions = [
  {
    id:'44444444-4444-4444-8444-444444444444', meeting_id:meetingId,
    text:'Synthetic action rollback check', assignee:'Smoke User', assignee_user_id:'33333333-3333-4333-8333-333333333333',
    due_date:new Date(Date.now()+2*86400000).toISOString(),
    status:'open', source_segment_id:null, created_at:new Date().toISOString(),
  },
  {
    id:'66666666-6666-4666-8666-666666666666', meeting_id:meetingId,
    text:'Synthetic action completion check', assignee:'Other User', assignee_user_id:'88888888-8888-4888-8888-888888888888',
    due_date:null, status:'open', source_segment_id:null, created_at:new Date().toISOString(),
  },
];
const meetingFilterRequests = [];
const meetingListSnapshots = [];
const weekStart = new Date();
weekStart.setUTCHours(0,0,0,0);
weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
for (let index = 0; index < 12; index++) {
  const endedAt = new Date();
  const startedAt = new Date(endedAt.getTime() - (index + 1) * 60_000);
  const id = `55555555-5555-4555-8555-${String(index + 1).padStart(12, '0')}`;
  meetings.push({
    id, workspace_id:workspaceId, title:`Synthetic historical meeting ${index + 1}`, status:'completed',
    source_app:'google_meet', source_url:null, duration_seconds:1800, participant_count:2,
    started_at:startedAt.toISOString(), ended_at:endedAt.toISOString(),
    created_at:startedAt.toISOString(), summary_preview:'Synthetic summary fixture',
  });
}
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let data;
  if (req.url.endsWith('/auth/me')) data = {workspaces:[{id:workspaceId,name:'Smoke workspace'}]};
  else if (req.url.endsWith('/extension/connect')) data = {extension_token:'synthetic-extension-token'};
  else if (req.url.includes('/extension/presence/')) data = {};
  else if (req.url.endsWith('/meetings/live')) {
    const meeting = {
      id: meetingId, workspace_id: workspaceId, title: 'Synthetic capture dashboard flow', status: 'recording',
      source_app: 'google_meet', source_url: 'https://meet.google.com/abc-defg-hij', duration_seconds: 0,
      participant_count: 1, started_at: new Date().toISOString(), ended_at: null,
      created_at: new Date().toISOString(), summary_preview: null,
    };
    meetings.unshift(meeting);
    data = {meeting,stream_url:`ws://localhost:${server.address().port}/stream`,stream_token:'synthetic-stream-token'};
  }
  else if (req.url.endsWith('/end')) {
    ended++;
    const meeting = meetings.find(item => item.id === meetingId);
    if (meeting) { meeting.status = 'completed'; meeting.ended_at = new Date().toISOString(); }
    data = {};
  }
  else { res.statusCode=404; data={}; }
  res.end(JSON.stringify({data}));
});
const sockets = new WebSocketServer({server});
sockets.on('connection', socket => socket.on('message', (bytes, binary) => {
  if (binary) {
    assert.equal(bytes.subarray(0,4).toString(), 'MM01');
    const acceptFrame = () => {
      frames++;
      const pcm = bytes.subarray(20);
      nonSilent ||= pcm.some(x=>x!==0);
      let sumSquares = 0;
      for (let offset = 0; offset < pcm.length; offset += 2) {
        const sample = pcm.readInt16LE(offset) / 32768;
        sumSquares += sample * sample;
      }
      frameRmsLevels.push(Math.sqrt(sumSquares / (pcm.length / 2)));
      socket.send(JSON.stringify({type:'audio_ack',highest_contiguous_sequence:bytes.readUInt32BE(4)}));
      socket._socket.resume();
    };
    if (frameProcessingDelayMs > 0) {
      socket._socket.pause();
      setTimeout(acceptFrame, frameProcessingDelayMs);
    } else acceptFrame();
  } else {
    const message=JSON.parse(bytes.toString());
    controls.push(message.type);
    if(message.type==='stream_hello') socket.send(JSON.stringify({type:'stream_ready',highest_contiguous_sequence:-1}));
    if(message.type==='ping') socket.send(JSON.stringify({type:'pong',nonce:message.nonce}));
  }
}));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));

async function attachTarget(browserCdp, targetId) {
  const {sessionId} = await browserCdp.send('Target.attachToTarget', {targetId, flatten:false});
  let nextId = 0;
  const pending = new Map();
  browserCdp.on('Target.receivedMessageFromTarget', event => {
    if (event.sessionId !== sessionId) return;
    const message = JSON.parse(event.message);
    const handler = pending.get(message.id);
    if (!handler) return;
    pending.delete(message.id);
    message.error ? handler.reject(message.error) : handler.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10_000);
    pending.set(id, {
      resolve: value => { clearTimeout(timer); resolve(value); },
      reject: error => { clearTimeout(timer); reject(error); },
    });
    browserCdp.send('Target.sendMessageToTarget', {
      sessionId,
      message: JSON.stringify({id, method, params}),
    }).catch(reject);
  });
  return {send};
}

const extensionPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../extension/dist');
const context = await chromium.launchPersistentContext('', {
  headless: false,
  ignoreHTTPSErrors: true,
  args: ['--enable-unsafe-extension-debugging', `--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`, '--autoplay-policy=no-user-gesture-required'],
});
try {
  const background = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  background.on('console', message => console.log(JSON.stringify({stage:'service-worker-console',text:message.text()})));
  const extensionId = new URL(background.url()).host;
  await background.evaluate(async () => {
    const existing = await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT']});
    if (existing.length === 0) {
      await chrome.offscreen.createDocument({
        url:'offscreen.html',
        reasons:['USER_MEDIA'],
        justification:'Install synthetic microphone fixture for extension capture smoke test',
      });
    }
  });
  const browserCdp = await context.browser().newBrowserCDPSession();
  const offscreenTarget = (await browserCdp.send('Target.getTargets')).targetInfos
    .find(target => target.url === `chrome-extension://${extensionId}/offscreen.html`);
  assert.ok(offscreenTarget, 'Precreated offscreen document is visible to CDP');
  const offscreen = await attachTarget(browserCdp, offscreenTarget.targetId);
  const microphoneShim = `(() => {
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async constraints => {
      const tabCapture = constraints?.audio?.mandatory?.chromeMediaSource === 'tab'
        || constraints?.audio?.chromeMediaSource === 'tab';
      if (!constraints?.audio || tabCapture) return originalGetUserMedia(constraints);
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const destination = audioContext.createMediaStreamDestination();
      gain.gain.value = 0.12;
      oscillator.frequency.value = 440;
      oscillator.connect(gain).connect(destination);
      oscillator.start();
      await audioContext.resume();
      const stream = destination.stream;
      stream.getTracks().forEach(track => track.addEventListener('ended', () => {
        oscillator.stop();
        void audioContext.close();
      }, {once:true}));
      return stream;
    };
    window.__meetingMindSmokeMicShimInstalled = true;
  })()`;
  const shimResult = await offscreen.send('Runtime.evaluate', {expression:microphoneShim, returnByValue:true});
  assert.equal(shimResult.result?.value, undefined, 'Synthetic microphone shim installs in offscreen document');
  const shimInstalled = await offscreen.send('Runtime.evaluate', {
    expression:'window.__meetingMindSmokeMicShimInstalled === true', returnByValue:true,
  });
  assert.equal(shimInstalled.result?.value, true, 'Synthetic microphone shim is active before capture');
  await background.evaluate(async ({workspaceId,port})=>chrome.storage.local.set({extensionToken:'synthetic-token',workspaceId,workspaceName:'Smoke workspace',apiBaseUrl:`http://localhost:${port}/api/v1`}), {workspaceId,port:server.address().port});
  const meet = await context.newPage();
  await meet.route('https://meet.google.com/**', route => {
    return route.fulfill({ contentType: 'text/html', body: `
      <title>MeetingMind capture smoke</title>
      <h1>Synthetic meeting audio</h1>
      <button id="play">Play audio</button>
      <script>
        window.__captureFocusProbe = { status: 'ready', samples: [] };
        let context;
        const sample = () => window.__captureFocusProbe.samples.push({
          at: performance.now(), visibility: document.visibilityState,
          focused: document.hasFocus(), audioTime: context?.currentTime ?? 0, audioState: context?.state ?? 'not-started',
        });
        setInterval(sample, 100);
        document.querySelector('#play').onclick = async () => {
          context = new AudioContext();
          await context.resume();
          const source = context.createOscillator();
          const gain = context.createGain();
          source.frequency.value = 660;
          gain.gain.value = 0.4;
          source.connect(gain).connect(context.destination);
          window.__captureFocusProbe.status = 'playing';
          source.onended = () => { window.__captureFocusProbe.status = 'ended'; };
          window.__captureFocusProbe.duration = 10;
          source.start();
          source.stop(context.currentTime + window.__captureFocusProbe.duration);
        };
      </script>` });
  });
  await meet.goto('https://meet.google.com/abc-defg-hij');
  await meet.waitForFunction(() => window.__captureFocusProbe?.status === 'ready');
  const cdp = await context.newCDPSession(meet);
  const target = await cdp.send('Target.getTargetInfo');
  const targets = await browserCdp.send('Target.getTargets', {filter:[{type:'tab',exclude:false}]});
  const tab = targets.targetInfos.find(t=>t.url===meet.url());
  await browserCdp.send('Extensions.triggerAction', { id: extensionId, targetId: tab?.targetId ?? target.targetInfo.targetId });
  await new Promise(resolve => setTimeout(resolve, 1500));
  const panel = (await browserCdp.send('Target.getTargets')).targetInfos.find(t=>t.url===`chrome-extension://${extensionId}/index.html`);
  assert.ok(panel, 'Toolbar action opens side panel');

  let dashboard;
  const dashboardErrors = [];
  const dashboardBaseUrl = process.env.DASHBOARD_BASE_URL;
  if (dashboardBaseUrl) {
    dashboard = await context.newPage();
    let fixtureAuthenticated = false;
    const fixtureUser = {
      id:'33333333-3333-4333-8333-333333333333',email:'smoke@example.invalid',full_name:'Smoke User',
      workspaces:[{id:workspaceId,name:'Smoke workspace',slug:'smoke',role:'member'}],
    };
    dashboard.on('pageerror', error => dashboardErrors.push(error.name));
    dashboard.on('response', response => {
      if (response.status() >= 500 && response.url().includes('/api/v1/') && !response.url().includes('/action-items/')) {
        dashboardErrors.push(`HTTP ${response.status()} ${new URL(response.url()).pathname}`);
      }
    });
    await dashboard.route('**/api/v1/**', async route => {
      const request = route.request();
      const url = new URL(request.url());
      const pathname = url.pathname;
      const method = request.method();
      const json = (body, status = 200) => route.fulfill({status, contentType:'application/json', body:JSON.stringify(body)});

      if (pathname.endsWith('/auth/refresh')) {
        return fixtureAuthenticated
          ? json({data:{access_token:'synthetic-console-token',token_type:'bearer',user:fixtureUser}})
          : json({detail:'No fixture session'}, 401);
      }
      if (pathname.endsWith('/auth/login') && method === 'POST') {
        fixtureAuthenticated = true;
        return route.fulfill({
          contentType:'application/json',
          headers:{'Set-Cookie':'refresh_token=synthetic-refresh-token; Path=/; HttpOnly; SameSite=Lax'},
          body:JSON.stringify({data:{access_token:'synthetic-console-token',token_type:'bearer',user:fixtureUser}}),
        });
      }
      if (pathname.endsWith('/auth/me') && method === 'GET') return json({data:fixtureUser});
      if (pathname.endsWith(`/workspaces/${workspaceId}/dashboard-stats`) && method === 'GET') {
        const completedThisWeek = meetings.filter(item => item.status === 'completed' && item.ended_at && new Date(item.ended_at) >= weekStart).length;
        return json({data:{meetings_processed_this_week:completedThisWeek,meeting_duration_seconds_this_week:completedThisWeek*1800,action_items_due_soon:1}});
      }
      if (pathname.endsWith('/extension/presence/status') && method === 'GET') {
        return json({data:{state:'recent',last_seen_at:new Date().toISOString()}});
      }
      if (pathname.endsWith(`/workspaces/${workspaceId}/meetings`) && method === 'GET') {
        const status = url.searchParams.get('filter[status]') ?? url.searchParams.get('status');
        meetingFilterRequests.push(status ?? 'all');
        const limit = Number(url.searchParams.get('limit') ?? 50);
        const rows = meetings.filter(item => !status || item.status === status)
          .sort((left,right) => new Date(right.started_at)-new Date(left.started_at)).slice(0,limit);
        meetingListSnapshots.push({filter:status ?? 'all',count:rows.length,containsCapture:rows.some(item=>item.id===meetingId)});
        return json({data:rows,meta:{next_cursor:null,has_more:false,limit}});
      }
      if (pathname.includes(`/workspaces/${workspaceId}/action-items`) && method === 'GET') {
        const status = url.searchParams.get('filter[status]') ?? url.searchParams.get('status');
        return json({data:actions.filter(item => !status || item.status === status),meta:{next_cursor:null,has_more:false,limit:20}});
      }
      if (pathname.endsWith(`/meetings/${meetingId}/transcript`)) return json({data:[],meta:{next_cursor:null,has_more:false,limit:500}});
      if (pathname.endsWith(`/meetings/${meetingId}/action-items`) || pathname.endsWith(`/meetings/${meetingId}/decisions`) || pathname.endsWith(`/meetings/${meetingId}/summaries`)) return json({data:[]});
      if (pathname.endsWith(`/meetings/${meetingId}`)) return json({data:meetings.find(item => item.id === meetingId)});
      if (method === 'PATCH' && pathname.includes(`/meetings/${meetingId}/action-items/`)) {
        const itemId = pathname.split('/').at(-1);
        if (itemId === '44444444-4444-4444-8444-444444444444') {
          return json({detail:'Synthetic failure for rollback check'}, 503);
        }
        const item = actions.find(candidate => candidate.id === itemId);
        if (item) {
          Object.assign(item, request.postDataJSON());
          return json(item);
        }
        return json({detail:'Fixture action not found'}, 404);
      }
      return json({detail:'Fixture route not found'}, 404);
    });
    await dashboard.goto(new URL('/login', dashboardBaseUrl).toString());
    await dashboard.locator('#login-email').fill('smoke@example.invalid');
    await dashboard.locator('#login-password').fill('synthetic-password');
    await dashboard.locator('#login-submit').click();
    await dashboard.waitForURL('**/dashboard');
    await dashboard.getByRole('heading', {name:'Recent Meetings'}).waitFor();
    await dashboard.getByText('12', {exact:true}).waitFor();
    assert.equal(await dashboard.locator('section[aria-labelledby="recent-meetings-heading"] a[href^="/meetings/"]').count(), 10,
      'Dashboard feed shows latest ten while workspace total remains twelve');
  }

  const {sessionId} = await browserCdp.send('Target.attachToTarget',{targetId:panel.targetId,flatten:false});
  let nextId=0;
  const pending=new Map();
  browserCdp.on('Target.receivedMessageFromTarget', event=>{
    if(event.sessionId!==sessionId) return;
    const message=JSON.parse(event.message);
    const handler=pending.get(message.id);
    if(handler){pending.delete(message.id);message.error?handler.reject(message.error):handler.resolve(message.result);}
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++nextId;
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`CDP timeout: ${method}`));},10000);
    pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});
    browserCdp.send('Target.sendMessageToTarget',{sessionId,message:JSON.stringify({id,method,params})}).catch(reject);
  });
  const read=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
  const click=async label=>{
    const rect=await read(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!b)return null;const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    assert.ok(rect, `Button ${label} exists`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...rect,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',...rect,button:'left',clickCount:1});
  };
  assert.match(await read('document.body.innerText'), /Ready to Capture/);
  await meet.bringToFront();
  await click('Start Capture');
  await new Promise(resolve=>setTimeout(resolve,1200));
  const microphoneOnlyFrameCount = frameRmsLevels.length;
  const averageRms = levels => levels.length ? levels.reduce((sum, level) => sum + level, 0) / levels.length : 0;
  const microphoneOnlyRms = averageRms(frameRmsLevels.slice(0, microphoneOnlyFrameCount));
  assert.ok(microphoneOnlyFrameCount > 0,
    `Fake microphone permission produces PCM frames; panel=${JSON.stringify(await read('document.body.innerText'))}`);
  await meet.bringToFront();
  const tabPlaybackFirstFrame = frameRmsLevels.length;
  await meet.locator('#play').click();
  await meet.waitForFunction(() => window.__captureFocusProbe?.status === 'ended', null, { timeout: 45000 });
  const focusProbe = await meet.evaluate(() => window.__captureFocusProbe);
  const tabPlaybackRms = averageRms(frameRmsLevels.slice(tabPlaybackFirstFrame));
  const focusSamples = focusProbe.samples;
  const lostFocusSamples = focusSamples.filter(sample => sample.visibility !== 'visible' || !sample.focused);
  console.log(JSON.stringify({stage:'playback-frame-diagnostics',frames,frameProcessingDelayMs,
    focusSamples:focusSamples.length,lostFocusSamples:lostFocusSamples.length,
    playbackDurationSeconds:focusProbe.duration,lastAudioTime:focusSamples.at(-1)?.audioTime}));
  assert.equal(lostFocusSamples.length, 0, 'Meet stays foreground during synthetic playback');
  assert.ok(focusProbe.duration >= 8 && focusProbe.duration <= 12, 'Synthetic tab source plays a sustained 8-12 second signal');
  if (frameProcessingDelayMs >= 1000) {
    await click('Stop');
    await new Promise(resolve=>setTimeout(resolve,7000));
    console.log(JSON.stringify({stage:'slow-backend-stop-probe',frames,frameProcessingDelayMs,ended}));
    throw new Error('Slow backend processing diagnostic complete');
  }
  assert.ok(frames >= Math.floor(focusProbe.duration * 2) - 2,
    `Sustained playback yields MM01 frames; got ${frames} frames for ${focusProbe.duration}s`);
  assert.ok(tabPlaybackRms > microphoneOnlyRms * 1.2,
    `Tab playback raises captured PCM level above fake-microphone baseline (${tabPlaybackRms.toFixed(4)} vs ${microphoneOnlyRms.toFixed(4)})`);
  if (dashboard) {
    await dashboard.bringToFront();
    const captureCard = dashboard.locator('section[aria-labelledby="recent-meetings-heading"] a').filter({hasText:'Synthetic capture dashboard flow'});
    try {
      await captureCard.waitFor({timeout:30000});
    } catch (error) {
      console.error(JSON.stringify({dashboardPolls:meetingListSnapshots,frames,ended,bodyHasCapture:(await dashboard.locator('body').innerText()).includes('Synthetic capture dashboard flow')}));
      throw error;
    }
    await captureCard.getByLabel('Status: Recording').waitFor({timeout:10000});
  }
  await new Promise(resolve=>setTimeout(resolve,1000));
  assert.ok(frames>0 && nonSilent, 'Real tab audio reaches WebSocket as non-silent MM01 frames');
  assert.match(await read('document.body.innerText'), /RECORDING/);
  await click('Pause');
  await new Promise(resolve=>setTimeout(resolve,700));
  const pausedFrames=frames;
  await new Promise(resolve=>setTimeout(resolve,1100));
  assert.equal(frames,pausedFrames,'Pause stops audio frames');
  assert.match(await read('document.body.innerText'), /PAUSED/);
  await click('Resume');
  await new Promise(resolve=>setTimeout(resolve,1200));
  assert.ok(frames>pausedFrames,'Resume restarts audio frames');
  const beforeReload=frames;
  await send('Page.reload');
  await new Promise(resolve=>setTimeout(resolve,1500));
  assert.ok(frames>beforeReload,'Offscreen capture survives panel reload');
  assert.match(await read('document.body.innerText'), /RECORDING/);
  await click('Stop');
  await new Promise(resolve=>setTimeout(resolve,1000));
  assert.equal(ended,1,'Stop finalizes meeting');
  if (dashboard) {
    const captureCard = dashboard.locator('section[aria-labelledby="recent-meetings-heading"] a').filter({hasText:'Synthetic capture dashboard flow'});
    await captureCard.getByLabel('Status: Completed').waitFor({timeout:30000});
    await dashboard.getByText('13', {exact:true}).waitFor({timeout:30000});
    assert.equal(await dashboard.locator('section[aria-labelledby="recent-meetings-heading"] a[href^="/meetings/"]').count(), 10,
      'Dashboard keeps ten recent cards while total includes completed capture');
    await dashboard.goto(new URL('/meetings', dashboardBaseUrl).toString());
    await dashboard.getByRole('button', {name:'Completed',exact:true}).click();
    await dashboard.getByText('Synthetic capture dashboard flow').waitFor({timeout:10000});
    await dashboard.getByRole('button', {name:'Recording',exact:true}).click();
    await dashboard.getByText('No meetings yet').waitFor({timeout:10000});
    assert.ok(meetingFilterRequests.includes('completed') && meetingFilterRequests.includes('recording'),
      'Status filter requests carry documented filter[status] values');
    await dashboard.goto(new URL('/actions', dashboardBaseUrl).toString());
    await dashboard.getByText('Synthetic action rollback check').waitFor();
    await dashboard.getByRole('button', {name:'Mark complete: Synthetic action completion check'}).click();
    await dashboard.getByRole('button', {name:'Mark incomplete: Synthetic action completion check'}).waitFor({timeout:5000});
    const failedPatch = dashboard.waitForResponse(response =>
      response.request().method() === 'PATCH' && response.status() === 503
    );
    await dashboard.getByRole('button', {name:'Mark complete: Synthetic action rollback check'}).click();
    await failedPatch;
    await dashboard.getByRole('button', {name:'Mark complete: Synthetic action rollback check'}).waitFor({timeout:5000});
    assert.deepEqual(dashboardErrors, [], 'Dashboard fixture has no page or API errors');
  }
  assert.equal(await background.evaluate(async ()=>(await chrome.tabCapture.getCapturedTabs()).some(t=>t.status==='active')),false,'Stop releases tab capture');
  const stoppedFrames=frames;
  await meet.bringToFront();
  await click('Start Capture');
  await new Promise(resolve=>setTimeout(resolve,2000));
  assert.ok(frames>stoppedFrames,'Second capture starts successfully');
  await click('Stop');
  await new Promise(resolve=>setTimeout(resolve,1000));
  assert.equal(ended,2);
  const checks = ['toolbar opens panel','start captures real tab audio','MM01 non-silent frames acknowledged','pause','resume','panel reload preserves recording','stop releases capture and finalizes','second start and stop'];
  if (dashboard) checks.push('Dashboard observes capture creation and completion without reload','meeting status filter reflects synthetic capture status','successful action update persists checkbox state','failed action update rolls back checkbox state');
  console.log(JSON.stringify({result:'PASS',checks,frames,frameProcessingDelayMs,nonSilent,ended,controls,dashboard:!!dashboard,
    playbackDurationSeconds:focusProbe.duration,focusSamples:focusSamples.length,lostFocusSamples:lostFocusSamples.length,
    microphoneOnlyRms,tabPlaybackRms,
    lastAudioTime:focusSamples.at(-1)?.audioTime}));
} finally {
  await context.close();
  for(const client of sockets.clients) client.terminate();
  await new Promise(resolve=>server.close(resolve));
}
