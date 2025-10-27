// script.js — handles tasks, habits, goals, projects, timer, theme, and editable calendar
document.addEventListener('DOMContentLoaded', ()=> {
  // helpers
  const $ = s => document.querySelector(s);
  const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));
  const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) || def; } catch(e) { return def; } };

  // THEME
  const themeToggle = $('#toggle-theme');
  if(themeToggle) {
    const saved = localStorage.getItem('df_theme') || 'dark';
    if(saved === 'light') { document.body.classList.remove('dark'); themeToggle.checked = false; } else { document.body.classList.add('dark'); themeToggle.checked = true; }
    themeToggle.addEventListener('change', ()=> {
      if(themeToggle.checked) { document.body.classList.add('dark'); localStorage.setItem('df_theme','dark'); }
      else { document.body.classList.remove('dark'); localStorage.setItem('df_theme','light'); }
    });
  }

  // TASKS
  if($('#add-task')) {
    const renderTasks = () => {
      const listEl = $('#task-list'); if(!listEl) return;
      listEl.innerHTML = '';
      const tasks = load('df_tasks', []);
      tasks.forEach(t => {
        const div = document.createElement('div'); div.className = 'item';
        div.innerHTML = `<div>${escapeHtml(t.title)} <span style="color:var(--muted)">• ${t.duration} min</span></div><div><button class="btn del-task">Delete</button></div>`;
        div.querySelector('.del-task').addEventListener('click', ()=> {
          const newTasks = load('df_tasks', []).filter(x => x.id !== t.id);
          save('df_tasks', newTasks); renderTasks();
        });
        listEl.appendChild(div);
      });
    };
    $('#add-task').addEventListener('click', ()=> {
      const title = $('#task-title').value.trim();
      const duration = $('#task-duration').value || 30;
      if(!title) { alert('Enter a task title'); return; }
      const tasks = load('df_tasks', []); tasks.unshift({id: Date.now(), title, duration}); save('df_tasks', tasks);
      $('#task-title').value = ''; renderTasks();
    });
    renderTasks();
  }

  // HABITS
  if($('#add-habit')) {
    const render = ()=> {
      const list = $('#habit-list'); if(!list) return;
      list.innerHTML = '';
      const items = load('df_habits', []);
      items.forEach(h=> {
        const div = document.createElement('div'); div.className = 'item';
        div.innerHTML = `<div>${escapeHtml(h.name)} <span style="color:var(--muted)">• Streak: ${h.streak}</span></div><div><button class="btn del-habit">Delete</button></div>`;
        div.querySelector('.del-habit').addEventListener('click', ()=> { save('df_habits', load('df_habits', []).filter(x=> x.id !== h.id)); render(); });
        list.appendChild(div);
      });
    };
    $('#add-habit').addEventListener('click', ()=> {
      const name = $('#habit-title').value.trim();
      if(!name) { alert('Enter habit'); return; }
      const items = load('df_habits', []); items.unshift({id: Date.now(), name, streak: 0}); save('df_habits', items);
      $('#habit-title').value = ''; render();
    });
    render();
  }

  // GOALS
  if($('#add-goal')) {
    const render = ()=> {
      const list = $('#goals-list'); if(!list) return;
      list.innerHTML = '';
      const items = load('df_goals', []);
      items.forEach(g=> {
        const div = document.createElement('div'); div.className = 'card';
        div.innerHTML = `<div style="display:flex;justify-content:space-between"><strong>${escapeHtml(g.title)}</strong><span style="color:var(--muted)">${g.progress}%</span></div>
          <div style="height:8px;background:rgba(255,255,255,0.04);border-radius:6px;margin-top:8px"><div style="width:${g.progress}%;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent-2));border-radius:6px"></div></div>
          <div style="margin-top:8px"><button class="btn inc">+10%</button></div>`;
        div.querySelector('.inc').addEventListener('click', ()=> {
          g.progress = Math.min(100, g.progress + 10);
          const all = load('df_goals', []).map(x=> x.id === g.id ? g : x); save('df_goals', all); render();
        });
        list.appendChild(div);
      });
    };
    $('#add-goal').addEventListener('click', ()=> {
      const title = $('#goal-title').value.trim();
      if(!title) { alert('Enter goal'); return; }
      const items = load('df_goals', []); items.unshift({id: Date.now(), title, progress: 0}); save('df_goals', items);
      $('#goal-title').value = ''; render();
    });
    render();
  }

  // PROJECTS
  if($('#add-project')) {
    const render = ()=> {
      const list = $('#projects-list'); if(!list) return;
      list.innerHTML = '';
      const items = load('df_projects', []);
      items.forEach(p=> {
        const d = document.createElement('div'); d.className='item';
        d.innerHTML = `<div>${escapeHtml(p.name)}</div><div><button class="btn del-p">Delete</button></div>`;
        d.querySelector('.del-p').addEventListener('click', ()=> { save('df_projects', load('df_projects', []).filter(x=> x.id !== p.id)); render(); });
        list.appendChild(d);
      });
    };
    $('#add-project').addEventListener('click', ()=> {
      const name = $('#project-title').value.trim();
      if(!name) { alert('Enter project'); return; }
      const items = load('df_projects', []); items.unshift({id: Date.now(), name, tasks: 0}); save('df_projects', items);
      $('#project-title').value = ''; render();
    });
    render();
  }

  // TIMER (dashboard)
  if($('#start-timer')) {
    let timer=null; let seconds=0;
    $('#start-timer').addEventListener('click', ()=> {
      seconds = Math.max(1, parseInt($('#timer-min').value || 25)) * 60; clearInterval(timer);
      timer = setInterval(()=> {
        if(seconds <= 0) { clearInterval(timer); $('#timer-display').textContent = '00:00'; return; }
        seconds--; const m = Math.floor(seconds / 60); const s = seconds % 60;
        $('#timer-display').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      }, 1000);
    });
    $('#stop-timer').addEventListener('click', ()=> { clearInterval(timer); $('#timer-display').textContent = '00:00'; });
  }

  // CALENDAR (editable)
  if($('#calendar-root')) {
    const eventsKey = 'df_events';
    const getEvents = ()=> load(eventsKey, {});
    const saveEvents = (e)=> save(eventsKey, e);

    const monthLabel = $('#cal-month');
    const prevBtn = $('#cal-prev');
    const nextBtn = $('#cal-next');
    const daysContainer = $('#cal-days');
    const selectedDateInput = $('#event-date');
    const eventTitleInput = $('#event-title');
    const eventNoteInput = $('#event-note');
    const addEventBtn = $('#add-event');
    const dayEventsList = $('#day-events');

    let current = new Date(); current.setDate(1);

    function formatDate(d) { return d.toISOString().slice(0,10); }

    function renderMonth() {
      monthLabel.textContent = current.toLocaleString(undefined, {month:'long', year:'numeric'});
      daysContainer.innerHTML = '';
      const firstDayIndex = current.getDay(); // 0=Sun
      const lastDay = new Date(current.getFullYear(), current.getMonth()+1, 0).getDate();

      for(let i=0;i<firstDayIndex;i++) { const b = document.createElement('div'); b.className='day'; b.style.opacity='0.4'; daysContainer.appendChild(b); }

      for(let d=1; d<=lastDay; d++) {
        const dt = new Date(current.getFullYear(), current.getMonth(), d);
        const cell = document.createElement('div'); cell.className='day';
        const iso = formatDate(dt);
        cell.innerHTML = `<div class="date">${d}</div><div class="events"></div>`;
        const events = getEvents()[iso] || [];
        const eventsEl = cell.querySelector('.events');
        events.forEach(ev => {
          const e = document.createElement('div'); e.className='event'; e.textContent = ev.title;
          eventsEl.appendChild(e);
        });
        cell.addEventListener('click', ()=> {
          selectedDateInput.value = iso;
          renderDayEvents(iso);
        });
        daysContainer.appendChild(cell);
      }
    }

    function renderDayEvents(iso) {
      const evs = getEvents()[iso] || [];
      dayEventsList.innerHTML = `<h4>Events for ${iso}</h4>`;
      if(evs.length === 0) dayEventsList.innerHTML += '<div class="muted">No events</div>';
      evs.forEach(ev => {
        const d = document.createElement('div'); d.className='item';
        d.innerHTML = `<div><strong>${escapeHtml(ev.title)}</strong><div class="muted">${escapeHtml(ev.note||'')}</div></div><div><button class="btn del-ev">Delete</button></div>`;
        d.querySelector('.del-ev').addEventListener('click', ()=> {
          const all = getEvents();
          all[iso] = all[iso].filter(x => x.id !== ev.id);
          if(all[iso].length === 0) delete all[iso];
          saveEvents(all);
          renderMonth(); renderDayEvents(iso);
        });
        dayEventsList.appendChild(d);
      });
    }

    addEventBtn.addEventListener('click', ()=> {
      const date = selectedDateInput.value; const title = eventTitleInput.value.trim(); const note = eventNoteInput.value.trim();
      if(!date || !title) { alert('Select date and enter title'); return; }
      const all = getEvents();
      if(!all[date]) all[date] = [];
      all[date].unshift({id: Date.now(), title, note});
      saveEvents(all);
      eventTitleInput.value = ''; eventNoteInput.value = '';
      renderMonth(); renderDayEvents(date);
    });

    prevBtn.addEventListener('click', ()=> { current.setMonth(current.getMonth()-1); renderMonth(); });
    nextBtn.addEventListener('click', ()=> { current.setMonth(current.getMonth()+1); renderMonth(); });

    renderMonth();
    selectedDateInput.value = formatDate(new Date());
    renderDayEvents(selectedDateInput.value);
  }

  // Helpers
  function escapeHtml(s) { return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
});
