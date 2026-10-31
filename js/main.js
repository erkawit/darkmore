const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CAMERA_ZOOM = 1.65;
let viewW = window.innerWidth;
let viewH = window.innerHeight;

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    canvas.width = viewW * dpr;
    canvas.height = viewH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let globalTick = 0;
let kills = 0, combo = 0, comboTimer = 0, screenShake = 0;
const particles = [];
const floatingTexts = [];
const groundEffects = [];
const enemies = [];
const props = [];

for (let i = 0; i < 40; i++) {
    props.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        type: Math.random() > 0.3 ? 'tuft' : 'pillar',
        scale: 0.85 + Math.random() * 0.4
    });
}

const player = {
    x: 0, y: 0, vx: 0, vy: 0,
    speed: 3.8,
    dir: 2,
    hp: 500, maxHp: 500,
    gold: 500,
    weaponLevel: 0,
    state: 'idle',
    animTick: 0,
    stateTimer: 0,
    comboStep: 0,
    dashCd: 0,
    skillCd: 0,
    hurtFlash: 0,
    deathTick: 0,
    scarf: [{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}]
};

// Controls
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' || e.code === 'KeyJ') performAttack();
    if (e.code === 'ShiftLeft' || e.code === 'KeyL') performDash();
    if (e.code === 'KeyE' || e.code === 'KeyK') performWhirlwind();
});
window.addEventListener('keyup', e => keys[e.code] = false);

// Virtual Joystick
let joyInput = { x: 0, y: 0, active: false };
const joyZone = document.getElementById('joystick-zone');
const joyKnob = document.getElementById('joystick-knob');

function handleJoyMove(clientX, clientY) {
    const rect = joyZone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const maxR = 44;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
    }
    joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    if (dist > 10) {
        const d8 = getDir8(dx, dy, 2);
        joyInput.x = DIR_VECTORS[d8].x;
        joyInput.y = DIR_VECTORS[d8].y;
    } else {
        joyInput.x = 0; joyInput.y = 0;
    }
}
joyZone.addEventListener('pointerdown', e => { joyInput.active = true; handleJoyMove(e.clientX, e.clientY); });
window.addEventListener('pointermove', e => { if (joyInput.active) handleJoyMove(e.clientX, e.clientY); });
window.addEventListener('pointerup', () => {
    joyInput.active = false; joyInput.x = 0; joyInput.y = 0;
    joyKnob.style.transform = `translate(0px, 0px)`;
});

document.getElementById('btn-atk').addEventListener('pointerdown', e => { e.stopPropagation(); performAttack(); });
document.getElementById('btn-skill').addEventListener('pointerdown', e => { e.stopPropagation(); performWhirlwind(); });
document.getElementById('btn-dash').addEventListener('pointerdown', e => { e.stopPropagation(); performDash(); });

function spawnUpgradeParticles() {
    const tier = WEAPON_UPGRADE_TIERS[player.weaponLevel];
    for (let i = 0; i < 28; i++) {
        particles.push({
            x: player.x, y: player.y - 28,
            vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 9,
            r: 4 + Math.random() * 5, color: tier.edgeColor, life: 32, maxLife: 32
        });
    }
}

function performAttack() {
    if (player.state === 'dead' || player.state === 'attack' || player.state === 'skill') return;
    player.state = 'attack';
    player.stateTimer = 18;
    player.comboStep = (player.comboStep + 1) % 2;
    screenShake = 4;

    const vec = DIR_VECTORS[player.dir];
    player.x += vec.x * 8;
    player.y += vec.y * 8;

    const tierAtk = WEAPON_UPGRADE_TIERS[player.weaponLevel].atk;
    checkPlayerHitbox(95, tierAtk + combo * 2, true);
}

function performWhirlwind() {
    if (player.state === 'dead' || player.state === 'skill' || player.skillCd > 0) return;
    player.state = 'skill';
    player.stateTimer = 48;
    player.skillCd = 150;
}

function performDash() {
    if (player.state === 'dead' || player.dashCd > 0) return;
    player.state = 'dash';
    player.stateTimer = 10;
    player.dashCd = 45;
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: player.x, y: player.y - 24,
            vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
            r: 4 + Math.random() * 4, color: '#38bdf8', life: 18, maxLife: 18
        });
    }
}

function checkPlayerHitbox(radius, baseDmg, directional) {
    const fVec = DIR_VECTORS[player.dir];
    let hitSuccess = false;

    enemies.forEach(en => {
        if (en.state === 'dead') return;
        const dx = en.x - player.x;
        const dy = en.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= radius + en.radius) {
            if (directional) {
                const dot = (dx * fVec.x + dy * fVec.y) / (dist || 1);
                if (dot < -0.25) return;
            }
            const isCrit = Math.random() > 0.52;
            const finalDmg = Math.floor(baseDmg * (isCrit ? 1.85 : 1) * (0.9 + Math.random() * 0.2));
            inflictDamageToEnemy(en, finalDmg, isCrit, fVec);
            hitSuccess = true;
        }
    });

    if (hitSuccess) {
        combo++;
        comboTimer = 150;
        document.getElementById('combo-val').innerText = combo;
    }
}

function inflictDamageToEnemy(en, dmg, isCrit, knockVec) {
    en.hp -= dmg;
    en.hurtFlash = 7;
    screenShake = isCrit ? 8 : 4;

    floatingTexts.push({
        x: en.x + (Math.random() - 0.5) * 20,
        y: en.y - en.heightOffset - 15,
        text: isCrit ? `CRIT ${dmg}!` : `${dmg}`,
        color: isCrit ? '#facc15' : '#ffffff',
        size: isCrit ? 20 : 15,
        life: 38
    });

    const tierColor = WEAPON_UPGRADE_TIERS[player.weaponLevel].edgeColor;
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: en.x, y: en.y - 25,
            vx: knockVec.x * (3 + Math.random()*5) + (Math.random()-0.5)*5,
            vy: knockVec.y * (3 + Math.random()*5) + (Math.random()-0.5)*5,
            r: 3 + Math.random() * 4,
            color: isCrit ? '#facc15' : tierColor,
            life: 22, maxLife: 22
        });
    }

    if (en.hp <= 0) {
        en.hp = 0;
        en.state = 'dead';
        en.deathTick = 0;
        kills++;
        player.gold += en.isBoss ? 500 : 45;
        document.getElementById('kill-val').innerText = kills;
        updatePlayerHUD();

        if (en.isBoss) {
            document.getElementById('boss-hud').style.display = 'none';
            screenShake = 22;
        }
        if (kills % 6 === 0 && !enemies.some(e => e.isBoss && e.state !== 'dead')) {
            spawnBossNow();
        }
        return;
    }

    // มอนสเตอร์ทั่วไปติดท่าชะงัก (Hit Stagger) ส่วนบอสไม่ติดชะงัก
    if (!en.isBoss) {
        en.state = 'hit';
        en.stateTimer = 20;
        en.vx = knockVec.x * 7.5;
        en.vy = knockVec.y * 7.5;
        en.dir = getDir8(-knockVec.x, -knockVec.y, en.dir);
    } else {
        const bpct = Math.max(0, (en.hp / en.maxHp) * 100);
        document.getElementById('boss-hp-bar').style.width = bpct + '%';
        document.getElementById('boss-hp-trail').style.width = `calc(${bpct}% - 4px)`;
    }
}

function damagePlayer(dmg, knockX, knockY) {
    if (player.state === 'dead' || player.state === 'dash') return;
    player.hp -= dmg;
    player.hurtFlash = 10;
    screenShake = 9;
    updatePlayerHUD();

    floatingTexts.push({
        x: player.x, y: player.y - 65,
        text: `-${dmg}`, color: '#ff2a44', size: 18, life: 40
    });

    if (player.hp <= 0) {
        player.hp = 0;
        updatePlayerHUD();
        player.state = 'dead';
        player.deathTick = 0;
        setTimeout(() => {
            if (player.state === 'dead') {
                document.getElementById('death-screen').style.display = 'flex';
            }
        }, 1600);
    } else {
        player.x += knockX * 10;
        player.y += knockY * 10;
    }
}

function testPlayerDeath() {
    if (player.state !== 'dead') damagePlayer(9999, 0, 0);
}

function respawnPlayer() {
    player.hp = player.maxHp;
    player.state = 'idle';
    player.deathTick = 0;
    updatePlayerHUD();
    document.getElementById('death-screen').style.display = 'none';
    enemies.forEach(en => {
        const d = Math.hypot(en.x - player.x, en.y - player.y);
        if (d < 200 && en.state !== 'dead') {
            inflictDamageToEnemy(en, 80, true, { x: (en.x - player.x)/(d||1), y: (en.y - player.y)/(d||1) });
        }
    });
}

function spawnRegularMob() {
    const aliveMobs = enemies.filter(e => !e.isBoss && e.state !== 'dead').length;
    if (aliveMobs >= 7) return;
    const angle = Math.random() * Math.PI * 2;
    const dist = 280 + Math.random() * 140;
    const subType = Math.random() > 0.45 ? 'imp' : 'orc';
    enemies.push({
        isBoss: false,
        subType: subType,
        x: player.x + Math.cos(angle) * dist,
        y: player.y + Math.sin(angle) * dist,
        vx: 0, vy: 0,
        dir: 2,
        hp: subType === 'orc' ? 160 : 110,
        maxHp: subType === 'orc' ? 160 : 110,
        speed: subType === 'orc' ? 1.45 : 1.9,
        radius: 20,
        heightOffset: 48,
        state: 'walk',
        stateTimer: 0,
        atkCooldown: 0,
        hurtFlash: 0,
        deathTick: 0,
        animOffset: Math.floor(Math.random() * 100)
    });
}

function spawnBossNow() {
    if (enemies.some(e => e.isBoss && e.state !== 'dead')) return;
    const angle = Math.random() * Math.PI * 2;
    enemies.push({
        isBoss: true,
        subType: 'overlord',
        x: player.x + Math.cos(angle) * 260,
        y: player.y + Math.sin(angle) * 260,
        vx: 0, vy: 0,
        dir: 2,
        hp: 1800, maxHp: 1800,
        speed: 1.35,
        radius: 36,
        heightOffset: 82,
        state: 'walk',
        stateTimer: 0,
        atkCooldown: 60,
        hurtFlash: 0,
        deathTick: 0,
        animOffset: 0
    });
    document.getElementById('boss-hud').style.display = 'block';
    document.getElementById('boss-hp-bar').style.width = '100%';
    document.getElementById('boss-hp-trail').style.width = 'calc(100% - 4px)';
    floatingTexts.push({
        x: player.x, y: player.y - 80,
        text: '⚠️ OVERLORD MALAKOR APPEARED! ⚠️', color: '#e879f9', size: 20, life: 75
    });
}

function updateGame() {
    globalTick++;
    player.animTick++;

    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer === 0) {
            combo = 0;
            document.getElementById('combo-val').innerText = 0;
        }
    }

    if (player.hurtFlash > 0) player.hurtFlash--;
    if (player.dashCd > 0) player.dashCd--;
    if (player.skillCd > 0) player.skillCd--;

    updateCooldownUI();
    renderLivePortrait(globalTick);

    // ปล่อยละอองออร่าตามตัวหากตีบวกสูง
    if (player.weaponLevel >= 4 && globalTick % 5 === 0 && player.state !== 'dead') {
        const tier = WEAPON_UPGRADE_TIERS[player.weaponLevel];
        particles.push({
            x: player.x + (Math.random() - 0.5) * 28,
            y: player.y - 10 - Math.random() * 35,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -1 - Math.random() * 1.5,
            r: 2.5 + Math.random() * 2.5,
            color: tier.auraColor,
            life: 20, maxLife: 20
        });
    }

    if (player.state === 'dead') {
        player.deathTick++;
    } else {
        let mx = 0, my = 0;
        if (keys['KeyW'] || keys['ArrowUp']) my -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) my += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) mx += 1;

        if (joyInput.active) {
            mx = joyInput.x;
            my = joyInput.y;
        }

        if (mx !== 0 || my !== 0) {
            const len = Math.hypot(mx, my);
            mx /= len; my /= len;
            player.dir = getDir8(mx, my, player.dir);
            document.getElementById('dir-indicator').innerText = DIR_NAMES[player.dir];
        }

        if (player.state === 'attack' || player.state === 'skill' || player.state === 'dash') {
            player.stateTimer--;
            if (player.state === 'skill' && player.stateTimer % 6 === 0) {
                player.dir = (player.dir + 1) % 8;
                const tierAtk = WEAPON_UPGRADE_TIERS[player.weaponLevel].atk;
                checkPlayerHitbox(105, Math.floor(tierAtk * 0.65), false);
            }
            if (player.stateTimer <= 0) {
                player.state = (mx !== 0 || my !== 0) ? 'walk' : 'idle';
            }
        } else {
            player.state = (mx !== 0 || my !== 0) ? 'walk' : 'idle';
        }

        const spdMult = player.state === 'dash' ? 3.0 : (player.state === 'attack' ? 0.35 : 1.0);
        player.vx = mx * player.speed * spdMult;
        player.vy = my * player.speed * spdMult;
        player.x += player.vx;
        player.y += player.vy;
    }

    const fVec = DIR_VECTORS[player.dir];
    let leadX = player.x - fVec.x * 8;
    let leadY = player.y - 34 - fVec.y * 4;
    player.scarf.forEach((node, i) => {
        node.x += (leadX - node.x) * 0.38 - fVec.x * 2.5;
        node.y += (leadY - node.y) * 0.38 + Math.sin(globalTick * 0.22 + i) * 1.3;
        leadX = node.x;
        leadY = node.y;
    });

    for (let i = enemies.length - 1; i >= 0; i--) {
        const en = enemies[i];
        if (en.hurtFlash > 0) en.hurtFlash--;
        if (en.atkCooldown > 0) en.atkCooldown--;

        if (en.state === 'dead') {
            en.deathTick++;
            if (en.isBoss && en.deathTick < 50 && en.deathTick % 4 === 0) {
                particles.push({
                    x: en.x + (Math.random() - 0.5) * 50,
                    y: en.y - 35 + (Math.random() - 0.5) * 50,
                    vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
                    r: 6 + Math.random() * 6, color: '#c084fc', life: 25, maxLife: 25
                });
            }
            const maxDeadTime = en.isBoss ? 95 : 45;
            if (en.deathTick >= maxDeadTime) enemies.splice(i, 1);
            continue;
        }

        if (en.state === 'hit') {
            en.stateTimer--;
            en.x += en.vx;
            en.y += en.vy;
            en.vx *= 0.8;
            en.vy *= 0.8;
            if (en.stateTimer <= 0) en.state = 'walk';
            continue;
        }

        const dx = player.x - en.x;
        const dy = player.y - en.y;
        const dist = Math.hypot(dx, dy);

        if (en.isBoss) {
            if (en.state === 'windup') {
                en.stateTimer--;
                if (en.stateTimer <= 0) {
                    screenShake = 16;
                    groundEffects.push({ x: en.x, y: en.y, r: 10, maxR: 120, life: 20 });
                    if (dist <= 120 && player.state !== 'dead') {
                        damagePlayer(65, dx / (dist || 1), dy / (dist || 1));
                    }
                    en.state = 'walk';
                    en.atkCooldown = 110;
                }
            } else {
                en.dir = getDir8(dx, dy, en.dir);
                if (dist > 70) {
                    en.x += (dx / dist) * en.speed;
                    en.y += (dy / dist) * en.speed;
                } else if (en.atkCooldown <= 0 && player.state !== 'dead') {
                    en.state = 'windup';
                    en.stateTimer = 45;
                }
            }
        } else {
            en.dir = getDir8(dx, dy, en.dir);
            if (dist > 38) {
                en.x += (dx / dist) * en.speed + en.vx;
                en.y += (dy / dist) * en.speed + en.vy;
            } else if (en.atkCooldown <= 0 && player.state !== 'dead') {
                en.state = 'attack';
                en.atkCooldown = 55;
                damagePlayer(18, dx / (dist || 1), dy / (dist || 1));
            }
            en.vx *= 0.82;
            en.vy *= 0.82;
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx; pt.y += pt.vy; pt.life--;
        if (pt.life <= 0) particles.splice(i, 1);
    }
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y -= 1.1; ft.life--;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
    for (let i = groundEffects.length - 1; i >= 0; i--) {
        const ge = groundEffects[i];
        ge.r += (ge.maxR - ge.r) * 0.25;
        ge.life--;
        if (ge.life <= 0) groundEffects.splice(i, 1);
    }
}

function renderScene() {
    ctx.fillStyle = '#11151f';
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.save();
    ctx.translate(viewW / 2, viewH / 2);
    ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);

    let shakeX = 0, shakeY = 0;
    if (screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake * 1.4;
        shakeY = (Math.random() - 0.5) * screenShake * 1.4;
        screenShake--;
    }
    ctx.translate(-player.x + shakeX, -player.y + shakeY);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    const grid = 70;
    const spanW = (viewW / CAMERA_ZOOM);
    const spanH = (viewH / CAMERA_ZOOM);
    const startX = Math.floor((player.x - spanW) / grid) * grid;
    const startY = Math.floor((player.y - spanH) / grid) * grid;
    for (let x = startX; x < player.x + spanW; x += grid) {
        ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, player.y + spanH); ctx.stroke();
    }
    for (let y = startY; y < player.y + spanH; y += grid) {
        ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(player.x + spanW, y); ctx.stroke();
    }

    groundEffects.forEach(ge => {
        ctx.strokeStyle = `rgba(244, 63, 94, ${ge.life / 20})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(ge.x, ge.y, ge.r, ge.r * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
    });

    const renderQueue = [
        { y: player.y, fn: () => drawChibiHero8Dir(ctx, player, globalTick) },
        ...enemies.map(en => ({
            y: en.y,
            fn: () => en.isBoss ? drawBossOverlord8Dir(ctx, en, globalTick) : drawRegularMonster8Dir(ctx, en, globalTick)
        })),
        ...props.map(pr => ({
            y: pr.y,
            fn: () => {
                ctx.save();
                ctx.translate(pr.x, pr.y);
                ctx.scale(pr.scale, pr.scale);
                if (pr.type === 'pillar') {
                    ctx.fillStyle = '#1e2536';
                    ctx.strokeStyle = '#090b10';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-12, -46); ctx.lineTo(0, -56); ctx.lineTo(14, -42); ctx.lineTo(16, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillRect(-3, -36, 6, 18);
                } else {
                    ctx.strokeStyle = '#283147'; ctx.lineWidth = 2.5;
                    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-7,-12); ctx.lineTo(0,0); ctx.lineTo(6,-14); ctx.stroke();
                }
                ctx.restore();
            }
        }))
    ];

    renderQueue.sort((a, b) => a.y - b.y);
    renderQueue.forEach(item => item.fn());

    particles.forEach(pt => {
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.life / pt.maxLife;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    floatingTexts.forEach(ft => {
        ctx.font = `900 ${ft.size}px 'Kanit', sans-serif`;
        ctx.fillStyle = ft.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3.5;
        ctx.strokeText(ft.text, ft.x - 15, ft.y);
        ctx.fillText(ft.text, ft.x - 15, ft.y);
    });

    ctx.restore();
}

let engineStarted = false;
function startGameEngine() {
    if (engineStarted) return;
    engineStarted = true;
    updatePlayerHUD();
    for (let i = 0; i < 4; i++) spawnRegularMob();
    setInterval(spawnRegularMob, 2200);

    function loop() {
        updateGame();
        renderScene();
        requestAnimationFrame(loop);
    }
    loop();
}