/* Avance compartido por los seis cuadernillos del Diplomado 2026. */
(() => {
  const PROFILE = 'fgdll-dpl1-2026-profile-v1';
  const ids = {
    1: ['t1-q1','t1-q3','t1-q4','t1-q5','t2-q1','t2-excusa','t2-verdad','t2-accion','t3-q1','t3-q2','t3-q3','t3-q4','t4-q1','t4-q2','t4-q3','t4-accion'],
    2: ['e1-version','e1-carta','e1-energia','e2-negociacion','e3-objetivo','e3-cuando','e3-incomodidad'],
    3: ['r1-reclamo','r1-necesidad','r2-reclamo','r2-necesidad','r3-reclamo','r3-necesidad','m-persona','m-l1','m-l2','m-l3','m-l4','m-personal','culpa-desc','reflexion-final'],
    4: ['e1-situacion','e1-evitar','b-pienso','b-siento','b-hago','m1-sit','m1-elige','m2-sit','m2-elige','m3-sit','m3-elige','e3-autocomp','frase-firme','e4-compromiso'],
    5: ['d-situacion','d-honesta','a-persona','a-q1','a-q2','a-q3','r-resonancia','r-absorcion','r-patron','c1-sit','c1-desc','c-huerfano','l-limite','l-fantasma','l-verdad','frase-ancla','ancla-cuando'],
    6: ['p-reflexion','au1-real','au1-hist','au2-real','au2-hist','au3-real','au3-hist','p-prescindible','cod-quien','cod-noneg','cod-sombra','cod-dolor','cod-permanencia','declaracion-final','perm-compromiso']
  };
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { return {}; } };
  const profile = () => read(PROFILE);
  const saveProfile = value => { try { localStorage.setItem(PROFILE, JSON.stringify(value)); } catch {} };
  const savedModule = n => read('gdl_m' + n + '_v1');
  const percentage = (n, data) => {
    const threshold = n <= 2 ? (n === 1 ? 10 : 8) : (n === 3 ? 5 : 4);
    const filled = ids[n].filter(id => String(data[id] || '').trim().length > threshold).length;
    if (n === 6) {
      const ratings = Object.values(data.ratings || {}).filter(v => Number(v) > 0).length;
      return Math.round(100 * (filled + Math.min(ratings, 8)) / (ids[n].length + 8));
    }
    return Math.round(100 * filled / ids[n].length);
  };
  const nameField = document.getElementById('student-name');
  if (nameField) {
    nameField.value = profile().name || '';
    nameField.addEventListener('input', () => {
      const state = profile();
      saveProfile({ ...state, name: nameField.value.trim() });
      render();
    });
    for (let n = 1; n <= 6; n++) {
      const card = document.getElementById('m' + n);
      const res = card && card.querySelector('.res');
      if (!res) continue;
      const video = Array.from(res.querySelectorAll('a')).find(a => /Ver clase|Ver video/i.test(a.textContent));
      const workbook = res.querySelector('a.featured');
      if (!video || !workbook) continue;
      const step = document.createElement('div');
      step.className = 'study-step';
      const videoLabel = n === 6 ? 'las dos partes de la clase' : 'la clase completa';
      step.innerHTML = '<span class="step-state"></span><label><input type="checkbox" aria-label="Confirmo que vi ' + videoLabel + ' del módulo ' + n + '">Ya vi ' + videoLabel + '; voy a responder el cuadernillo.</label>';
      video.after(step);
      const check = step.querySelector('input');
      check.addEventListener('change', () => {
        const state = profile();
        saveProfile({ ...state, videos: { ...state.videos, [n]: check.checked } });
        render();
      });
      workbook.addEventListener('click', event => {
        if (!nameField.value.trim() || !profile().videos?.[n]) {
          event.preventDefault();
          if (!nameField.value.trim()) { nameField.focus(); nameField.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          else check.focus();
        }
      });
    }
    function render() {
      const state = profile();
      let sum = 0, done = 0;
      for (let n = 1; n <= 6; n++) {
        const card = document.getElementById('m' + n);
        const step = card.querySelector('.study-step');
        if (!step) continue;
        const watched = Boolean(state.videos?.[n]);
        const workbookPct = percentage(n, savedModule(n));
        step.querySelector('input').checked = watched;
        step.querySelector('.step-state').textContent = 'Cuadernillo ' + workbookPct + '% · ' + (watched ? 'clase confirmada' : 'primero mira la clase');
        const workbook = card.querySelector('a.featured');
        workbook.classList.toggle('workbook-locked', !watched || !state.name);
        workbook.setAttribute('aria-disabled', String(!watched || !state.name));
        sum += (watched ? 20 : 0) + workbookPct * .8;
        if (watched && workbookPct === 100) done++;
        const pill = document.querySelector('.progress .pill[href="#m' + n + '"]');
        if (pill) pill.title = 'Módulo ' + n + ': cuadernillo ' + workbookPct + '%';
      }
      const total = Math.round(sum / 6);
      document.getElementById('course-progress').value = total;
      document.getElementById('course-progress-text').textContent = 'Avance general: ' + total + '%';
      document.getElementById('course-progress-detail').textContent = done + ' de 6 módulos completos. Cada módulo requiere confirmar la clase y responder el cuadernillo.';
      document.getElementById('cierre-diplomado').hidden = !(done === 6 && state.name);
    }
    window.addEventListener('focus', render);
    window.addEventListener('pageshow', render);
    window.addEventListener('storage', render);
    render();
  } else {
    const n = Number(location.pathname.match(/\/M([1-6])\.html$/i)?.[1]);
    if (!n) return;
    const field = document.getElementById(n === 1 ? 'nombre-alumno' : 'nombre');
    if (!field) return;
    const main = document.getElementById('main');
    if (main) {
      const toolbar = document.createElement('div');
      toolbar.style.cssText = 'position:sticky;top:0;z-index:20;display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:12px 16px;background:#17191e;color:#fff;border-bottom:2px solid #f2ad00';
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Guardar mi cuadernillo';
      button.style.cssText = 'padding:10px 16px;border:0;border-radius:7px;background:#f2ad00;color:#17191e;font:inherit;font-weight:700;cursor:pointer';
      const status = document.createElement('span');
      status.setAttribute('role', 'status');
      status.textContent = 'Tus respuestas se guardan automáticamente en este dispositivo.';
      toolbar.append(button, status);
      main.prepend(toolbar);
      button.addEventListener('click', () => {
        if (typeof saveAndUpdate === 'function') saveAndUpdate();
        try {
          status.textContent = localStorage.getItem('gdl_m' + n + '_v1') ? 'Cuadernillo guardado en este dispositivo.' : 'No se pudo guardar. Revisa el almacenamiento del navegador.';
        } catch { status.textContent = 'No se pudo guardar. Revisa el almacenamiento del navegador.'; }
      });
    }
    const stored = savedModule(n);
    field.value = profile().name || stored.nombre || '';
    field.addEventListener('input', () => {
      const state = profile();
      saveProfile({ ...state, name: field.value.trim() });
    });
    // The original workbook saves responses and calculates its own progress.
    // Keep the common name in sync even when the student enters with the cover button.
    const start = document.querySelector('#cover button[onclick="iniciar()"]');
    let enteringName = '';
    start?.addEventListener('click', () => { enteringName = field.value.trim(); }, true);
    start?.addEventListener('click', () => {
      if (!enteringName) return;
      field.value = enteringName;
      saveProfile({ ...profile(), name: enteringName });
      if (typeof saveAndUpdate === 'function') saveAndUpdate();
    });
  }
})();
