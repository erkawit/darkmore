const pCanvas = document.getElementById('portraitCanvas');
const pCtx = pCanvas.getContext('2d');
const wpCanvas = document.getElementById('weaponPreviewCanvas');
const wpCtx = wpCanvas.getContext('2d');

function updatePlayerHUD() {
    const pct = Math.max(0, (player.hp / player.maxHp) * 100);
    document.getElementById('hp-bar').style.width = pct + '%';
    document.getElementById('hp-trail').style.width = pct + '%';
    document.getElementById('hp-text').innerText = `${Math.max(0, Math.ceil(player.hp))} / ${player.maxHp}`;
    document.getElementById('gold-val').innerText = player.gold;
    document.getElementById('weapon-tier-badge').innerText = `+${player.weaponLevel} GREATSWORD`;
}

function renderLivePortrait(globalTick) {
    pCtx.clearRect(0, 0, 76, 76);
    pCtx.save();
    pCtx.translate(38, 48);
    pCtx.scale(1.15, 1.15);

    pCtx.fillStyle = '#1b202b';
    pCtx.beginPath(); pCtx.arc(0, -4, 22, 0, Math.PI * 2); pCtx.fill();

    pCtx.fillStyle = '#ffe0bd';
    pCtx.strokeStyle = '#090b10';
    pCtx.lineWidth = 2;
    pCtx.beginPath(); pCtx.roundRect(-18, -16, 36, 31, 14); pCtx.fill(); pCtx.stroke();

    if (player.state === 'dead') {
        pCtx.strokeStyle = '#ef4444'; pCtx.lineWidth = 2.5;
        [-7, 7].forEach(ex => {
            pCtx.beginPath();
            pCtx.moveTo(ex-3, -2); pCtx.lineTo(ex+3, 4);
            pCtx.moveTo(ex+3, -2); pCtx.lineTo(ex-3, 4);
            pCtx.stroke();
        });
    } else if (player.hurtFlash > 0) {
        pCtx.strokeStyle = '#ef4444'; pCtx.lineWidth = 2.5;
        pCtx.beginPath();
        pCtx.moveTo(-10, -2); pCtx.lineTo(-4, 1); pCtx.lineTo(-10, 4);
        pCtx.moveTo(10, -2); pCtx.lineTo(4, 1); pCtx.lineTo(10, 4);
        pCtx.stroke();
    } else {
        const blink = (globalTick % 140) < 5;
        drawAnimeEye(pCtx, -7, 1, 6.5, 9.5, blink);
        drawAnimeEye(pCtx, 7, 1, 6.5, 9.5, blink);
    }

    drawHeroHairAndHorns(pCtx, 'front');
    pCtx.restore();
}

function updateCooldownUI() {
    const cdDashEl = document.getElementById('cd-dash');
    const cdSkillEl = document.getElementById('cd-skill');
    const stamBar = document.getElementById('stamina-bar');

    if (player.dashCd > 0) {
        cdDashEl.style.display = 'flex';
        cdDashEl.innerText = (player.dashCd / 60).toFixed(1);
        stamBar.style.width = ((1 - player.dashCd / 45) * 100) + '%';
    } else {
        cdDashEl.style.display = 'none';
        stamBar.style.width = '100%';
    }

    if (player.skillCd > 0) {
        cdSkillEl.style.display = 'flex';
        cdSkillEl.innerText = Math.ceil(player.skillCd / 60);
    } else {
        cdSkillEl.style.display = 'none';
    }
}

// ================= SOUL FORGE MODAL CONTROLLER =================
function toggleForgeModal() {
    const modal = document.getElementById('forge-modal');
    if (modal.style.display === 'none') {
        modal.style.display = 'flex';
        refreshForgeModalUI();
    } else {
        modal.style.display = 'none';
    }
}

function refreshForgeModalUI() {
    const tier = WEAPON_UPGRADE_TIERS[player.weaponLevel];
    document.getElementById('forge-weapon-name').innerText = `${tier.name} [+${tier.level}]`;
    document.getElementById('forge-weapon-name').style.color = tier.edgeColor;
    document.getElementById('forge-weapon-stats').innerText = `พลังโจมตี: ${tier.atk} | ออร่า: ${tier.auraName}`;

    const btn = document.getElementById('btn-do-upgrade');
    if (player.weaponLevel >= 8) {
        document.getElementById('forge-rate').innerText = 'MAX';
        document.getElementById('forge-cost').innerText = '0';
        btn.innerText = '🌟 ตีบวกถึงระดับสูงสุดแล้ว (+8)';
        btn.disabled = true;
    } else {
        document.getElementById('forge-rate').innerText = tier.rate + '%';
        document.getElementById('forge-cost').innerText = tier.cost;
        btn.innerText = `⚡ ตีบวกขึ้น +${player.weaponLevel + 1}`;
        btn.disabled = false;
    }

    // วาดพรีวิวอาวุธในหน้าต่างตีบวก
    wpCtx.clearRect(0, 0, 220, 110);
    wpCtx.save();
    wpCtx.translate(45, 55);
    wpCtx.scale(1.45, 1.45);
    drawGreatSwordModel(wpCtx, false, tier, globalTick);
    wpCtx.restore();
}

function attemptUpgradeWeapon() {
    if (player.weaponLevel >= 8) return;
    const tier = WEAPON_UPGRADE_TIERS[player.weaponLevel];
    const msgEl = document.getElementById('forge-msg');

    if (player.gold < tier.cost) {
        msgEl.style.color = '#ef4444';
        msgEl.innerText = `❌ Soul Gold ไม่พอ! (ต้องการ ${tier.cost} แต่มี ${player.gold})`;
        return;
    }

    player.gold -= tier.cost;
    const roll = Math.random() * 100;
    if (roll <= tier.rate) {
        player.weaponLevel++;
        msgEl.style.color = '#4ade80';
        msgEl.innerText = `✨ สำเร็จ! อัปเกรดอาวุธเป็นระดับ +${player.weaponLevel} เรียบร้อย!`;
        spawnUpgradeParticles();
    } else {
        msgEl.style.color = '#facc15';
        msgEl.innerText = `💥 การตีบวกล้มเหลว! (ระดับอาวุธไม่ลดลง)`;
    }
    updatePlayerHUD();
    refreshForgeModalUI();
}

function setMaxUpgradeInstantly() {
    player.weaponLevel = 8;
    updatePlayerHUD();
    refreshForgeModalUI();
    spawnUpgradeParticles();
    const msgEl = document.getElementById('forge-msg');
    msgEl.style.color = '#e879f9';
    msgEl.innerText = '🔥 เปิดใช้งานศาสตราวุธเทพอสูร +8 สูงสุดแล้ว!';
}