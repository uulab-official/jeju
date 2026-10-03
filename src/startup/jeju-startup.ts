import { createStartupGate, type StartupAdapter, type StartupOptions, type StartupGate } from './startup-ota';

export type StartupTheme = 'system' | 'light' | 'dark';
export type JejuStartupState = {
  phase: 'loading' | 'ready' | 'recovery';
  fontsReady: boolean;
  theme: StartupTheme;
  progress: number;
  message: string;
  retrying?: boolean;
};
export type JejuStartupServices = {
  loadFonts: () => Promise<void>;
  essentialFontsReady: () => boolean;
  readTheme: () => Promise<StartupTheme>;
  ping: () => Promise<unknown>;
};
export type JejuStartupOptions = {
  deadlineMs?: number;
  otaWindowMs?: number;
  fontTimeoutMs?: number;
  themeTimeoutMs?: number;
  minimumSplashMs?: number;
  finishMs?: number;
  clock?: StartupOptions['clock'];
};

// Only pending work is shared. Successful theme values are never cached:
// AppThemeProvider consumes initialMode only on a genuine provider mount.
function pendingOperation<T>(operation: () => Promise<T>) {
  let pending: Promise<T> | undefined;
  const run = (canStart?: () => boolean) => {
    if (!pending) {
      const current = Promise.resolve().then(() => {
        if (canStart && !canStart()) throw Error('Startup acquisition closed before dispatch.');
        return operation();
      });
      pending = current;
      void current.then(() => { if (pending === current) pending = undefined; }, () => { if (pending === current) pending = undefined; });
    }
    return pending;
  };
  return { run, pending: () => pending };
}

export function createJejuStartupRuntime(adapter: StartupAdapter, services: JejuStartupServices, options: JejuStartupOptions = {}) {
  const deadlineMs = options.deadlineMs ?? 12_000;
  const otaWindowMs = Math.min(options.otaWindowMs ?? 10_000, deadlineMs);
  const fontTimeoutMs = options.fontTimeoutMs ?? 5_000;
  const themeTimeoutMs = options.themeTimeoutMs ?? 2_000;
  const minimumSplashMs = options.minimumSplashMs ?? 650;
  const finishMs = options.finishMs ?? 180;
  if ([deadlineMs, otaWindowMs, fontTimeoutMs, themeTimeoutMs].some(value => !Number.isFinite(value) || value <= 0) ||
      [minimumSplashMs, finishMs].some(value => !Number.isFinite(value) || value < 0)) throw Error('Jeju startup budgets must be finite.');
  const clock = options.clock ?? { now: () => performance.now(), setTimeout, clearTimeout };
  const loadFonts = pendingOperation(services.loadFonts);
  const readTheme = pendingOperation(services.readTheme);
  let gate: StartupGate | undefined;
  let otaSealed = false;
  let entered = false;
  let ownerCanReload: (() => boolean) | undefined;
  let pingStarted = false;

  function closeOta(reason: 'background' | 'unmount' | 'entry') {
    otaSealed = true;
    gate?.close(reason);
  }
  function essentialReady() {
    try { return services.essentialFontsReady(); } catch { return false; }
  }

  function mount() {
    let state: JejuStartupState = { phase: 'loading', fontsReady: essentialReady(), theme: 'system', progress: 0.08, message: '제주를 준비하고 있어요' };
    let mounted = true;
    let busy = false;
    let generation = 0;
    const listeners = new Set<(state: JejuStartupState) => void>();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const cancellations = new Set<() => void>();
    let unsubscribe: (() => void) | undefined;
    let resolveAttempt: ((state: JejuStartupState) => void) | undefined;
    let attemptResult: Promise<JejuStartupState> | undefined;
    function publish(next: Partial<JejuStartupState>) {
      if (!mounted) return;
      state = { ...state, ...next, progress: Math.max(state.progress, next.progress ?? state.progress) };
      listeners.forEach(listener => { try { listener(state); } catch { /* A render cannot strand readiness. */ } });
    }
    function schedule(callback: () => void, ms: number) {
      const timer = clock.setTimeout(() => { timers.delete(timer); callback(); }, ms);
      timers.add(timer);
      return timer;
    }
    function finish() {
      if (!mounted || !busy) return;
      busy = false;
      generation += 1;
      cancellations.forEach(cancel => cancel()); cancellations.clear();
      timers.forEach(timer => clock.clearTimeout(timer)); timers.clear();
      unsubscribe?.();
      closeOta('entry');
      const fontsReady = essentialReady();
      publish({ fontsReady, phase: fontsReady ? 'ready' : 'recovery', progress: 1,
        retrying: false,
        message: fontsReady ? '준비 완료' : '제주 글꼴을 준비하지 못했어요' });
      resolveAttempt?.(state);
    }
    async function bounded<T>(request: Promise<T>, timeoutMs: number): Promise<T | undefined> {
      let timeout: ReturnType<typeof setTimeout> | undefined;
      let cancel: (() => void) | undefined;
      try {
        return await Promise.race([request.catch(() => undefined), new Promise<undefined>(done => {
          cancel = () => done(undefined); cancellations.add(cancel);
          timeout = schedule(cancel, timeoutMs);
        })]);
      } finally {
        if (timeout !== undefined) { clock.clearTimeout(timeout); timers.delete(timeout); }
        if (cancel) cancellations.delete(cancel);
      }
    }
    function start(retry = false) {
      if (!mounted || busy || (!retry && attemptResult) || (retry && state.phase !== 'recovery')) return attemptResult ?? Promise.resolve(state);
      busy = true;
      const attempt = ++generation;
      const startedAt = clock.now();
      const expiresAt = startedAt + deadlineMs;
      let splashVisibleAt = essentialReady() ? startedAt : undefined;
      state = { ...state, phase: retry ? 'recovery' : 'loading', retrying: retry, fontsReady: essentialReady(), progress: 0.08, message: '제주를 준비하고 있어요' };
      publish({});
      attemptResult = new Promise(done => { resolveAttempt = done; });
      schedule(finish, deadlineMs);
      const current = () => mounted && busy && attempt === generation && clock.now() < expiresAt;
      const themeExpiresAt = Math.min(expiresAt, startedAt + themeTimeoutMs);
      let themeAcquisitionOpen = true;
      const themeCurrent = () => themeAcquisitionOpen && current() && clock.now() < themeExpiresAt;
      async function freshTheme() {
        if (!themeCurrent()) return undefined;
        const previous = readTheme.pending();
        if (previous) {
          // A prior mount may have read its value before a local theme change.
          // Serialize a fresh read; never treat the prior result as initialMode.
          await previous.catch(() => undefined);
        }
        // Promise.race cannot cancel an earlier native read. The acquisition's
        // absolute deadline also protects delayed timer/exact-boundary resumes.
        if (!themeCurrent()) return undefined;
        return readTheme.run(themeCurrent);
      }
      const preparation = Promise.all([
        bounded(essentialReady() ? Promise.resolve() : loadFonts.run(), fontTimeoutMs).then(() => {
          if (current()) {
            const fontsReady = essentialReady();
            if (fontsReady && splashVisibleAt === undefined) splashVisibleAt = clock.now();
            publish({ fontsReady });
          }
        }),
        bounded(freshTheme(), Math.max(0, themeExpiresAt - clock.now())).then(theme => {
          if (themeCurrent() && (theme === 'system' || theme === 'dark' || theme === 'light')) publish({ theme });
        }).finally(() => {
          themeAcquisitionOpen = false;
        }),
      ]).then(() => {
        if (current() && !essentialReady()) finish();
      });
      if (!pingStarted) {
        pingStarted = true;
        // Existing backend warmup remains best effort. It never gates entry or repeats.
        void Promise.resolve().then(services.ping).catch(() => {});
      }
      if (!gate && !otaSealed && !retry) {
        ownerCanReload = () => current() && !entered && essentialReady();
        gate = createStartupGate({ ...adapter, prepare: async () => { await preparation; if (current()) await adapter.prepare(); },
          canReload: () => !otaSealed && !entered && Boolean(ownerCanReload?.()) && adapter.canReload(),
        }, { deadlineMs: otaWindowMs, clock });
      }
      unsubscribe = gate?.subscribe(update => {
        if (!current() || update.phase === 'ready') return;
        publish({ progress: update.progress, message: update.phase === 'applying' ? '새로운 제주로 이동하고 있어요'
          : update.phase === 'downloading' ? '업데이트를 받고 있어요'
          : update.phase === 'checking' ? '최신 업데이트를 확인하고 있어요' : '제주를 준비하고 있어요' });
      });
      void (async () => {
        try {
          await Promise.all([preparation, gate?.start()]);
          if (!current()) return;
          if (!essentialReady()) { finish(); return; }
          publish({ progress: 1, message: '준비 완료' });
          // Keep Jeju's existing finish, but never extend the whole decision budget.
          const remaining = Math.max(0, minimumSplashMs - (clock.now() - (splashVisibleAt ?? clock.now()))) + finishMs;
          await new Promise<void>(done => {
            const cancel = () => { cancellations.delete(cancel); done(); };
            cancellations.add(cancel); schedule(cancel, Math.min(remaining, Math.max(0, expiresAt - clock.now())));
          });
          if (current()) finish();
        } catch { finish(); }
        finally { unsubscribe?.(); }
      })();
      return attemptResult;
    }
    return {
      snapshot: () => state,
      subscribe(listener: (state: JejuStartupState) => void) { listeners.add(listener); listener(state); return () => { listeners.delete(listener); }; },
      start: () => start(),
      retry: () => start(true),
      close(reason: 'background' | 'unmount' | 'entry') {
        closeOta(reason);
        if (reason === 'unmount') {
          mounted = false; busy = false; generation += 1;
          cancellations.forEach(cancel => cancel()); cancellations.clear();
          timers.forEach(timer => clock.clearTimeout(timer)); timers.clear();
          unsubscribe?.();
          resolveAttempt?.(state); listeners.clear();
        }
      },
    };
  }
  return {
    mount, closeOta,
    observeNative: () => gate?.observeNative(),
    markAppEntered() { entered = true; closeOta('entry'); void gate?.markAppEntered(); },
  };
}
