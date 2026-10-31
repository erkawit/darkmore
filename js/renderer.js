// วาดตัวละครผู้เล่น 8 ทิศทาง พร้อมออร่าตามระดับตีบวก (+0 ถึง +8)
function drawChibiHero8Dir(ctx, p, globalTick) {
    ctx.save();
    ctx.translate(p.x, p.y);
    const cfg = getDirConfig(p.dir);
    const tier = WEAPON_UPGRADE_TIERS[p.weaponLevel];

    // --- ท่าตายตัวละคร (Player Death Animation) ---
    if (p.state === 'dead') {
        const dt = Math.min(p.deathTick, 60);
        const fallProgress = Math.min(1, dt / 25);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath(); ctx.ellipse(0, 4, 24 + fallProgress * 14, 10, 0, 0, Math.PI * 2); ctx.fill();

        ctx.save();
        ctx.translate(36 * cfg.flipX, -5);
        ctx.rotate(0.35 * cfg.flipX);
        drawGreatSwordModel(ctx, false, tier, globalTick);
        ctx.restore();

        ctx.save();
        ctx.scale(cfg.flipX, 1);
        ctx.translate(0, -18 * (1 - fallProgress));
        ctx.rotate(fallProgress * (Math.PI / 2.15));

        ctx.fillStyle = '#272c3a';
        ctx.strokeStyle = '#090b10';
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.roundRect(-14, -34, 28, 24, 6); ctx.fill(); ctx.stroke();

        ctx.translate(0, -52);
        ctx.fillStyle = '#ffe0bd';
        ctx.beginPath(); ctx.roundRect(-20, -17, 40, 34, 15); ctx.fill(); ctx.stroke();

        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 2.8;
        [-7, 8].forEach(ex => {
            ctx.beginPath();
            ctx.moveTo(ex - 3.5, -2); ctx.lineTo(ex + 3.5, 5);
            ctx.moveTo(ex + 3.5, -2); ctx.lineTo(ex - 3.5, 5);
            ctx.stroke();
        });

        drawHeroHairAndHorns(ctx, 'side');
        ctx.restore();

        const soulY = -30 - (p.deathTick * 0.7) % 55;
        const soulX = Math.sin(p.deathTick * 0.1) * 8;
        ctx.fillStyle = 'rgba(125, 211, 252, 0.75)';
        ctx.beginPath(); ctx.arc(soulX, soulY, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(soulX, soulY, 4, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
        return;
    }

    // วาดวงแหวนออร่าใต้เท้าหากตีบวกตั้งแต่ +3 ขึ้นไป
    if (p.weaponLevel >= 3 && tier.auraColor) {
        ctx.save();
        ctx.strokeStyle = tier.auraColor;
        ctx.lineWidth = p.weaponLevel >= 7 ? 3.5 : 2;
        ctx.globalAlpha = 0.55 + Math.sin(globalTick * 0.15) * 0.25;
        ctx.beginPath();
        ctx.ellipse(0, 5, 28 + Math.sin(globalTick * 0.1) * 4, 12, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    const drawScarfTrail = () => {
        ctx.save();
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -34);
        p.scarf.forEach(node => ctx.lineTo(node.x - p.x, node.y - p.y));
        ctx.stroke();
        ctx.restore();
    };

    if (!cfg.isUp) drawScarfTrail();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath(); ctx.ellipse(0, 5, 24, 10, 0, 0, Math.PI * 2); ctx.fill();

    if (p.hurtFlash > 0) ctx.filter = 'brightness(250%) contrast(150%)';
    ctx.scale(cfg.flipX, 1);

    const isMoving = p.state === 'walk' || p.state === 'dash';
    const bounce = isMoving ? Math.abs(Math.sin(p.animTick * 0.28)) * 6.5 : Math.sin(p.animTick * 0.08) * 2;
    const legSwing = isMoving ? Math.sin(p.animTick * 0.28) * 11 : 0;

    ctx.fillStyle = '#1e222d';
    ctx.strokeStyle = '#090a0f';
    ctx.lineWidth = 2.2;

    if (cfg.view === 'front' || cfg.view === 'back') {
        ctx.beginPath(); ctx.roundRect(-12, -15 - Math.max(0, legSwing * 0.5), 9, 15, 4); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(3, -15 - Math.max(0, -legSwing * 0.5), 9, 15, 4); ctx.fill(); ctx.stroke();
    } else {
        ctx.beginPath(); ctx.roundRect(-9 - legSwing * 0.5, -15, 9, 15, 4); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(1 + legSwing * 0.5, -15, 9, 15, 4); ctx.fill(); ctx.stroke();
    }

    ctx.translate(0, -bounce);

    if (cfg.isUp) drawHeroWeaponSwing(ctx, p, tier, globalTick);

    ctx.fillStyle = '#282e3d';
    ctx.strokeStyle = '#0b0d13';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.roundRect(-14, -38, 28, 25, 7); ctx.fill(); ctx.stroke();

    if (cfg.view === 'back' || cfg.view === 'diagUp') {
        ctx.fillStyle = '#1a1423';
        ctx.beginPath();
        ctx.moveTo(-13, -36); ctx.lineTo(13, -36);
        ctx.lineTo(17 + (isMoving ? 4 : 0), -10);
        ctx.lineTo(-17 - (isMoving ? 4 : 0), -10);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        ctx.fillStyle = tier.edgeColor;
        ctx.beginPath(); ctx.arc(0, -24, 5, 0, Math.PI * 2); ctx.fill();
    } else {
        const chestShift = cfg.view === 'front' ? 0 : (cfg.view === 'diagDown' ? 4 : 7);
        ctx.fillStyle = tier.edgeColor;
        ctx.beginPath();
        ctx.moveTo(-6 + chestShift, -34); ctx.lineTo(6 + chestShift, -34); ctx.lineTo(chestShift, -21);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-14, -18, 28, 4.5);
        ctx.beginPath(); ctx.arc(chestShift, -16, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    ctx.fillStyle = '#333b4d';
    ctx.beginPath(); ctx.arc(-14, -33, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(14, -33, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.save();
    ctx.translate(0, -56);
    if (isMoving) ctx.rotate(0.05);

    ctx.fillStyle = '#1b202b';
    ctx.beginPath(); ctx.arc(0, -3, 24, 0, Math.PI * 2); ctx.fill();

    if (cfg.view === 'back') {
        drawHeroHairAndHorns(ctx, 'back');
    } else if (cfg.view === 'diagUp') {
        ctx.fillStyle = '#ffe0bd';
        ctx.beginPath(); ctx.roundRect(-16, -16, 35, 32, 14); ctx.fill(); ctx.stroke();
        drawHeroHairAndHorns(ctx, 'diagUp');
    } else {
        ctx.fillStyle = '#ffe0bd';
        ctx.beginPath(); ctx.roundRect(-20, -17, 40, 34, 15); ctx.fill(); ctx.stroke();

        const isBlink = (p.animTick % 150) < 5;
        if (cfg.view === 'front') {
            drawAnimeEye(ctx, -8, 1, 7, 10, isBlink);
            drawAnimeEye(ctx, 8, 1, 7, 10, isBlink);
            ctx.strokeStyle = '#c27866'; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(-14, 5); ctx.lineTo(-9, 10); ctx.stroke();
        } else if (cfg.view === 'diagDown') {
            drawAnimeEye(ctx, -3, 1, 6.5, 10, isBlink);
            drawAnimeEye(ctx, 11, 1, 7.5, 10, isBlink);
            ctx.strokeStyle = '#c27866'; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(-10, 5); ctx.lineTo(-5, 10); ctx.stroke();
        } else if (cfg.view === 'side') {
            drawAnimeEye(ctx, 10, 1, 7.5, 10, isBlink);
        }

        drawHeroHairAndHorns(ctx, cfg.view);
    }
    ctx.restore();

    if (!cfg.isUp) drawHeroWeaponSwing(ctx, p, tier, globalTick);

    ctx.filter = 'none';
    ctx.restore();

    if (cfg.isUp) drawScarfTrail();
}

function drawAnimeEye(ctx, x, y, w, h, isBlink) {
    if (isBlink) {
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x - w/2, y); ctx.lineTo(x + w/2, y); ctx.stroke();
        return;
    }
    ctx.fillStyle = '#0f1319';
    ctx.beginPath(); ctx.roundRect(x - w/2, y - h/2, w, h, 3); ctx.fill();
    ctx.fillStyle = '#ff2a44';
    ctx.beginPath(); ctx.arc(x, y + 1.5, w * 0.38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x - 1.2, y - 2, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0f1319'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(x - w/2 - 1, y - h/2 - 3); ctx.lineTo(x + w/2, y - h/2 - 1); ctx.stroke();
}

function drawHeroHairAndHorns(ctx, viewMode) {
    ctx.fillStyle = '#222736';
    ctx.strokeStyle = '#090b10';
    ctx.lineWidth = 2.2;

    if (viewMode === 'back' || viewMode === 'diagUp') {
        ctx.beginPath();
        ctx.moveTo(-22, 6);
        ctx.lineTo(-28, -8); ctx.lineTo(-19, -12);
        ctx.lineTo(-22, -26); ctx.lineTo(-8, -19);
        ctx.lineTo(0, -32);   ctx.lineTo(9, -19);
        ctx.lineTo(22, -26);  ctx.lineTo(19, -12);
        ctx.lineTo(28, -8);   ctx.lineTo(22, 6);
        ctx.lineTo(12, 15);   ctx.lineTo(4, 6);
        ctx.lineTo(0, 17);    ctx.lineTo(-5, 6);
        ctx.lineTo(-13, 15);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.moveTo(-22, -3);
        ctx.lineTo(-28, -15); ctx.lineTo(-17, -15);
        ctx.lineTo(-20, -29); ctx.lineTo(-6, -20);
        ctx.lineTo(3, -34);   ctx.lineTo(11, -20);
        ctx.lineTo(24, -27);  ctx.lineTo(19, -13);
        ctx.lineTo(27, -5);   ctx.lineTo(16, -4);
        ctx.lineTo(9, 2);     ctx.lineTo(3, -9);
        ctx.lineTo(-2, 4);    ctx.lineTo(-9, -9);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(-2, -16); ctx.lineTo(6, -28); ctx.lineTo(8, -12); ctx.lineTo(2, -1);
        ctx.closePath();
        ctx.fill();
    }

    ctx.fillStyle = '#ff2a44';
    ctx.beginPath(); ctx.moveTo(-14, -15); ctx.lineTo(-24, -31); ctx.lineTo(-7, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(13, -15); ctx.lineTo(23, -31); ctx.lineTo(7, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawHeroWeaponSwing(ctx, p, tier, globalTick) {
    ctx.save();
    ctx.translate(6, -26);

    let angle = -0.35 + Math.sin(p.animTick * 0.08) * 0.06;
    let showSlash = false;

    if (p.state === 'skill') {
        angle = p.animTick * 0.85;
        showSlash = true;
    } else if (p.state === 'attack') {
        const prog = 1 - (p.stateTimer / 18);
        angle = p.comboStep === 0 ? (-2.1 + prog * 3.7) : (1.7 - prog * 3.7);
        showSlash = p.stateTimer > 4;
    }

    ctx.rotate(angle);

    if (showSlash) {
        ctx.save();
        ctx.strokeStyle = tier.slashRgba;
        ctx.lineWidth = 22 + p.weaponLevel * 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 56, -0.95, 0.95);
        ctx.stroke();
        ctx.restore();
    }

    drawGreatSwordModel(ctx, true, tier, globalTick);
    ctx.restore();
}

function drawGreatSwordModel(ctx, withHand, tier, globalTick) {
    ctx.save();
    // เปลวแสงออร่ารอบใบดาบตามระดับการตีบวก
    if (tier && tier.auraColor) {
        ctx.shadowColor = tier.auraColor;
        ctx.shadowBlur = 6 + tier.level * 2.5;
    }

    ctx.strokeStyle = '#090b10';
    ctx.lineWidth = 2.2;
    ctx.fillStyle = '#451a03';
    ctx.fillRect(4, -3.5, 16, 7);

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(19, -15); ctx.lineTo(26, 0); ctx.lineTo(19, 15); ctx.lineTo(15, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#1e2433';
    ctx.strokeStyle = tier ? tier.edgeColor : '#ff2a44';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(22, -9.5); ctx.lineTo(74, -6.5); ctx.lineTo(94, 0); ctx.lineTo(74, 6.5); ctx.lineTo(22, 9.5);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = tier ? tier.coreColor : '#fb923c';
    ctx.fillRect(28, -2.2, 44, 4.4);

    // สายฟ้าวิ่งรอบใบดาบสำหรับ +6 ถึง +8
    if (tier && tier.level >= 6) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(30, -5);
        ctx.lineTo(45, (Math.sin(globalTick * 0.5) * 6));
        ctx.lineTo(65, -4);
        ctx.lineTo(85, 0);
        ctx.stroke();
    }
    ctx.restore();

    if (withHand) {
        ctx.fillStyle = '#ffe0bd';
        ctx.strokeStyle = '#090b10';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(12, 0, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
}

// วาดมอนสเตอร์ทั่วไป 8 ทิศทาง + ท่าชะงัก (Hit Stagger) + ท่าตาย
function drawRegularMonster8Dir(ctx, en, globalTick) {
    ctx.save();
    ctx.translate(en.x, en.y);
    const cfg = getDirConfig(en.dir);

    if (en.state === 'dead') {
        const alpha = Math.max(0, 1 - (en.deathTick / 45));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(0, 4, 22, 8, 0, 0, Math.PI * 2); ctx.fill();

        ctx.scale(cfg.flipX, 1);
        const fallAngle = Math.min(Math.PI / 2, (en.deathTick / 14) * (Math.PI / 2));
        ctx.rotate(-fallAngle);

        ctx.fillStyle = en.subType === 'orc' ? '#2e4c38' : '#3b1d5e';
        ctx.strokeStyle = '#090a0f';
        ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.roundRect(-18, -36, 36, 32, 14); ctx.fill(); ctx.stroke();

        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(2, -24); ctx.lineTo(9, -17);
        ctx.moveTo(9, -24); ctx.lineTo(2, -17);
        ctx.stroke();

        ctx.restore();
        return;
    }

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.ellipse(0, 4, 20, 8, 0, 0, Math.PI * 2); ctx.fill();

    if (en.hurtFlash > 0) ctx.filter = 'brightness(280%)';
    ctx.scale(cfg.flipX, 1);

    const isStaggered = en.state === 'hit';
    const bounce = isStaggered ? 0 : Math.abs(Math.sin((globalTick + en.animOffset) * 0.18)) * 6;
    ctx.translate(0, -bounce);

    if (isStaggered) {
        ctx.translate((Math.random() - 0.5) * 5, -4);
        ctx.rotate(-0.38);
    }

    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-10, -10, 7, 10, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(3, -10, 7, 10, 3); ctx.fill(); ctx.stroke();

    const bodyColor = en.subType === 'orc' ? '#2f523a' : '#4c1d95';
    ctx.fillStyle = bodyColor;
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.roundRect(-18, -38, 36, 32, 15); ctx.fill(); ctx.stroke();

    ctx.fillStyle = en.subType === 'orc' ? '#d97706' : '#ec4899';
    ctx.beginPath(); ctx.moveTo(-11, -35); ctx.lineTo(-20, -49); ctx.lineTo(-4, -36); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(11, -35); ctx.lineTo(20, -49); ctx.lineTo(4, -36); ctx.closePath(); ctx.fill(); ctx.stroke();

    if (cfg.view !== 'back') {
        const eyeShift = cfg.view === 'front' ? 0 : 5;
        if (isStaggered) {
            ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(-6 + eyeShift, -27); ctx.lineTo(-1 + eyeShift, -23); ctx.lineTo(-6 + eyeShift, -19);
            ctx.moveTo(10 + eyeShift, -27); ctx.lineTo(5 + eyeShift, -23); ctx.lineTo(10 + eyeShift, -19);
            ctx.stroke();

            ctx.fillStyle = '#991b1b';
            ctx.beginPath(); ctx.arc(2 + eyeShift, -13, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        } else {
            ctx.fillStyle = '#facc15';
            if (cfg.view === 'front' || cfg.view === 'diagDown') {
                ctx.beginPath(); ctx.arc(-5 + eyeShift, -23, 3.8, 0, Math.PI * 2); ctx.fill();
            }
            ctx.beginPath(); ctx.arc(6 + eyeShift, -23, 4.2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.moveTo(2 + eyeShift, -15); ctx.lineTo(5 + eyeShift, -11); ctx.lineTo(8 + eyeShift, -15); ctx.fill();
        }
    } else {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.arc(0, -22, 8, 0, Math.PI * 2); ctx.fill();
    }

    ctx.save();
    ctx.translate(10, -18);
    if (isStaggered) ctx.rotate(-0.9);
    else if (en.state === 'attack') ctx.rotate(1.1);
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(22, -12); ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath(); ctx.arc(23, -13, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();

    ctx.filter = 'none';
    ctx.restore();

    if (isStaggered) {
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2.5;
        ctx.strokeText('⚡ชะงัก!', en.x - 18, en.y - 58);
        ctx.fillText('⚡ชะงัก!', en.x - 18, en.y - 58);
    }

    if (en.hp < en.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(en.x - 22, en.y - 53, 44, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(en.x - 21, en.y - 52, 42 * (en.hp / en.maxHp), 4);
    }
}

// วาดบอสใหญ่ 8 ทิศทาง (ไม่ติดชะงัก + มีท่าตายระเบิดพลัง)
function drawBossOverlord8Dir(ctx, boss, globalTick) {
    ctx.save();
    ctx.translate(boss.x, boss.y);
    const cfg = getDirConfig(boss.dir);

    if (boss.state === 'dead') {
        const dt = boss.deathTick;
        const alpha = Math.max(0, 1 - Math.max(0, dt - 50) / 45);
        ctx.globalAlpha = alpha;

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(0, 5, 42 + dt * 0.6, 18 + dt * 0.2, 0, 0, Math.PI * 2); ctx.stroke();

        const shakeX = dt < 50 ? (Math.random() - 0.5) * 10 : 0;
        const collapseY = Math.min(28, dt * 0.6);
        ctx.translate(shakeX, collapseY);
        ctx.scale(cfg.flipX, 1);

        if (dt >= 50) {
            const fallRot = Math.min(Math.PI / 2.2, ((dt - 50) / 20) * (Math.PI / 2.2));
            ctx.rotate(fallRot);
        }

        drawBossBodyParts(ctx, cfg, true, false);
        ctx.restore();
        return;
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 6, 40 + Math.sin(globalTick * 0.1) * 4, 16, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    if (boss.state === 'windup') {
        const chargeRatio = 1 - (boss.stateTimer / 45);
        ctx.save();
        ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + chargeRatio * 0.25})`;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(0, 6, 115, 55, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
    }

    if (boss.hurtFlash > 0) ctx.filter = 'brightness(220%)';
    ctx.scale(cfg.flipX, 1);
    const bounce = Math.abs(Math.sin(globalTick * 0.12)) * 5;
    ctx.translate(0, -bounce);

    drawBossBodyParts(ctx, cfg, false, boss.state === 'windup');

    ctx.filter = 'none';
    ctx.restore();
}

function drawBossBodyParts(ctx, cfg, isDead, isWindup) {
    ctx.strokeStyle = '#07080d';
    ctx.lineWidth = 2.8;

    ctx.fillStyle = '#3b0764';
    ctx.beginPath();
    ctx.moveTo(-26, -62); ctx.lineTo(26, -62); ctx.lineTo(36, -6); ctx.lineTo(-36, -6);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#111827';
    ctx.beginPath(); ctx.roundRect(-18, -20, 13, 20, 5); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(5, -20, 13, 20, 5); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#1f2937';
    ctx.beginPath(); ctx.roundRect(-25, -64, 50, 46, 12); ctx.fill(); ctx.stroke();

    if (cfg.view !== 'back') {
        const shift = cfg.view === 'front' ? 0 : 7;
        ctx.fillStyle = '#a855f7';
        ctx.beginPath(); ctx.arc(shift, -42, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f3e8ff';
        ctx.beginPath(); ctx.arc(shift, -42, 4, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = '#374151';
    ctx.beginPath(); ctx.arc(-26, -56, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(26, -56, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.save();
    ctx.translate(0, -82);
    ctx.fillStyle = '#111827';
    ctx.beginPath(); ctx.roundRect(-24, -22, 48, 40, 16); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.moveTo(-18, -16); ctx.lineTo(-38, -42); ctx.lineTo(-10, -22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(18, -16); ctx.lineTo(38, -42); ctx.lineTo(10, -22); ctx.closePath(); ctx.fill(); ctx.stroke();

    if (cfg.view !== 'back') {
        const eyeShift = cfg.view === 'front' ? 0 : 6;
        if (isDead) {
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-10 + eyeShift, -6); ctx.lineTo(-2 + eyeShift, 2);
            ctx.moveTo(-2 + eyeShift, -6); ctx.lineTo(-10 + eyeShift, 2);
            ctx.moveTo(4 + eyeShift, -6); ctx.lineTo(12 + eyeShift, 2);
            ctx.moveTo(12 + eyeShift, -6); ctx.lineTo(4 + eyeShift, 2);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath(); ctx.arc(-7 + eyeShift, -2, 5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(8 + eyeShift, -2, 5, 0, Math.PI * 2); ctx.fill();
        }
    }
    ctx.restore();

    ctx.save();
    ctx.translate(18, -44);
    ctx.rotate(isWindup ? -1.45 : 0.25);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, -4, 58, 8);
    ctx.fillStyle = '#9333ea';
    ctx.beginPath();
    ctx.moveTo(38, -28); ctx.lineTo(64, -18); ctx.lineTo(56, 28); ctx.lineTo(38, 18);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
}