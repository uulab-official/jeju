// One controller per JS runtime. Native update work cannot be cancelled;
// every continuation must re-check the activation gate before requesting reload.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Candidate = { id: string; runtimeVersion: string; projectId?: string };
export type LaunchFacts = {
  supported: boolean;
  projectId: string | null;
  runtimeVersion: string | null;
  runningUpdateId: string | null;
  isEmbeddedLaunch?: boolean;
  emergency: boolean;
  restartCount: number;
  checkAutomatically: string | null;
};
export type NativeSnapshot = {
  working: boolean;
  pending: boolean;
  candidate: Candidate | null;
  downloadProgress?: number;
  error: boolean;
};
export type StartupSnapshot = {
  phase: 'preparing' | 'checking' | 'downloading' | 'applying' | 'ready';
  progress: number;
  downloadProgress?: number;
  reason?: string;
  runningUpdateId: string | null;
  candidateId?: string;
};
export type StartupAdapter = {
  facts: () => LaunchFacts;
  prepare: () => Promise<void>;
  check: () => Promise<Candidate | null>;
  fetch: () => Promise<Candidate | null>;
  reload: () => Promise<void>;
  storage: { get: (key: string) => Promise<string | null>; set: (key: string, value: string) => Promise<void> };
  nativeSnapshot: () => NativeSnapshot;
  // Must read live auth/onboarding/interaction state, not a captured startup value.
  canReload: () => boolean;
};

// SecureStore key-safe, injective encoding of app/runtime/candidate scope.
export function attemptKey(facts: LaunchFacts, candidateId: string): string {
  const encode = (value: string) => Array.from(value).map((char) => char.codePointAt(0)!.toString(16)).join('-');
  return `uulab.ota.${encode(facts.projectId!.toLowerCase())}.${encode(facts.runtimeVersion!)}.${candidateId.toLowerCase()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function manifestCandidate(manifest: unknown, nativeRuntimeVersion?: string | null): Candidate | null {
  // Native manifests are external data; malformed nested fields/getters must
  // never throw during render or establish a candidate's compatibility.
  try {
    if (!isRecord(manifest)) return null;
    const { id, extra } = manifest;
    // Only pass nativeRuntimeVersion for a manifest returned by the installed Expo
    // updates API. Native selection already filters by its installed runtime.
    const runtimeVersion = manifest.runtimeVersion === undefined ? nativeRuntimeVersion : manifest.runtimeVersion;
    if (typeof id !== 'string' || !UUID.test(id) || typeof runtimeVersion !== 'string' || !runtimeVersion.trim()) return null;
    if (extra !== undefined && !isRecord(extra)) return null;
    const eas = isRecord(extra) ? extra.eas : undefined;
    if (eas !== undefined && !isRecord(eas)) return null;
    const projectId = isRecord(eas) ? eas.projectId : undefined;
    if (projectId !== undefined && (typeof projectId !== 'string' || !UUID.test(projectId))) return null;
    return { id: id.toLowerCase(), runtimeVersion, ...(typeof projectId === 'string' ? { projectId: projectId.toLowerCase() } : {}) };
  } catch { return null; }
}

export type StartupOptions = {
  deadlineMs: number; // Per-app UX budget; no universal timeout.
  clock?: {
    now: () => number;
    setTimeout: (callback: () => void, ms: number) => ReturnType<typeof setTimeout>;
    clearTimeout: (timer: ReturnType<typeof setTimeout>) => void;
  };
};

function ownership(policy: string | null) {
  if (['ALWAYS', 'ON_LOAD', 'WIFI_ONLY'].includes(policy ?? '')) return 'native';
  if (['NEVER', 'ERROR_RECOVERY_ONLY', 'ON_ERROR_RECOVERY'].includes(policy ?? '')) return 'manual';
  return 'unknown';
}

export function createStartupGate(adapter: StartupAdapter, options: StartupOptions) {
  const { deadlineMs } = options;
  // Browser host timers reject an arbitrary object as their receiver.
  // Keep the host call global while preserving injected clock receivers.
  const clock = options.clock ?? {
    now: () => performance.now(),
    setTimeout: (callback: () => void, ms: number) => setTimeout(callback, ms),
    clearTimeout: (timer: ReturnType<typeof setTimeout>) => clearTimeout(timer),
  };
  if (!Number.isFinite(deadlineMs) || deadlineMs <= 0) throw new Error('Startup requires a finite positive deadline.');
  let runningUpdateId: string | null = null;
  try { runningUpdateId = adapter.facts().runningUpdateId; } catch { /* Fail open inside run. */ }
  let snapshot: StartupSnapshot = { phase: 'preparing', progress: 0.1, runningUpdateId };
  let open = true;
  let started = false;
  let settled = false;
  let entryRecorded = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let expiresAt = Infinity;
  const now = () => clock.now();
  let nativeRevision = 0;
  let wakeNative: (() => void) | undefined;
  const listeners = new Set<(state: StartupSnapshot) => void>();
  let resolve!: (state: StartupSnapshot) => void;
  const result = new Promise<StartupSnapshot>((done) => { resolve = done; });

  function publish(next: Partial<StartupSnapshot>) {
    const updated = { ...snapshot, ...next, progress: Math.max(snapshot.progress, next.progress ?? snapshot.progress) };
    if (Object.keys(updated).every((key) => updated[key as keyof StartupSnapshot] === snapshot[key as keyof StartupSnapshot])) return;
    snapshot = updated;
    // A rendering subscriber must not strand the gate's promise.
    listeners.forEach((listener) => { try { listener(snapshot); } catch { /* Consumer error. */ } });
  }
  function finish(reason: string) {
    if (settled) return;
    open = false;
    settled = true;
    if (timer !== undefined) clock.clearTimeout(timer);
    wakeNative?.();
    publish({ phase: 'ready', progress: 1, reason, downloadProgress: undefined });
    resolve(snapshot);
  }
  function active() {
    if (!open) return false;
    if (now() >= expiresAt) { finish('deadline'); return false; }
    return true;
  }
  function launchable(facts: LaunchFacts) {
    return facts.supported && typeof facts.projectId === 'string' && UUID.test(facts.projectId) &&
      typeof facts.runtimeVersion === 'string' && !!facts.runtimeVersion.trim() &&
      ((typeof facts.runningUpdateId === 'string' && UUID.test(facts.runningUpdateId)) ||
        (facts.runningUpdateId === null && facts.isEmbeddedLaunch === true)) &&
      !facts.emergency && facts.restartCount === 0 &&
      ownership(facts.checkAutomatically) !== 'unknown';
  }
  function eligible(candidate: Candidate | null, facts: LaunchFacts): candidate is Candidate {
    return launchable(facts) && !!candidate && typeof candidate.id === 'string' && UUID.test(candidate.id) &&
      candidate.runtimeVersion === facts.runtimeVersion &&
      (candidate.projectId === undefined || (typeof candidate.projectId === 'string' && UUID.test(candidate.projectId) &&
        candidate.projectId.toLowerCase() === facts.projectId?.toLowerCase()));
  }
  function sameScope(before: LaunchFacts, after: LaunchFacts) {
    return launchable(after) && before.projectId?.toLowerCase() === after.projectId?.toLowerCase() &&
      before.runtimeVersion === after.runtimeVersion && before.checkAutomatically === after.checkAutomatically;
  }
  function freshFacts(before: LaunchFacts): LaunchFacts | null {
    if (!active()) return null;
    const current = { ...adapter.facts() };
    if (current.emergency || current.restartCount !== 0) { finish('restart-or-recovery'); return null; }
    if (!sameScope(before, current) || before.runningUpdateId !== current.runningUpdateId || before.isEmbeddedLaunch !== current.isEmbeddedLaunch) { finish('launch-facts-changed'); return null; }
    return active() ? current : null;
  }
  async function nativeIdle(expectedFacts: LaunchFacts): Promise<NativeSnapshot | null> {
    // On iOS a successful check/fetch Promise resolves before Expo publishes
    // its completion state. Busy can therefore be our own completed operation
    // or another native owner. Observe it within the ORIGINAL budget; never
    // start another API or reload while that owner is still working.
    while (active()) {
      const observedRevision = nativeRevision;
      if (!freshFacts(expectedFacts)) return null;
      if (!adapter.canReload()) { finish('critical-flow'); return null; }
      const native = adapter.nativeSnapshot();
      if (native.error) { finish('native-update-error'); return null; }
      if (!native.working) return native;
      if (typeof native.downloadProgress === 'number' && Number.isFinite(native.downloadProgress) &&
        native.downloadProgress >= 0 && native.downloadProgress <= 1) {
        publish({ phase: 'downloading', progress: 0.4 });
        reportDownload(native);
      }
      if (!active()) return null;
      if (observedRevision !== nativeRevision) continue;
      await new Promise<void>((wake) => { wakeNative = wake; });
      wakeNative = undefined;
    }
    return null;
  }
  async function activate(candidate: Candidate | null, expectedFacts: LaunchFacts, requirePending: boolean) {
    // reloadAsync selects the latest native cached update, not a supplied ID.
    // Revalidate that selection after every async boundary and notification.
    function currentForActivation() {
      const facts = freshFacts(expectedFacts);
      if (!facts) return null;
      if (!adapter.canReload()) { finish('critical-flow'); return null; }
      if (!eligible(candidate, facts)) { finish('uncertain-or-incompatible-candidate'); return null; }
      if (candidate.id.toLowerCase() === facts.runningUpdateId?.toLowerCase()) { finish('already-running'); return null; }
      const native = adapter.nativeSnapshot();
      if (native.error) { finish('native-update-error'); return null; }
      // Last synchronous guard immediately before each irreversible boundary.
      if (native.working) { finish('native-ownership-changed'); return null; }
      if (requirePending && !native.pending) { finish('candidate-no-longer-pending'); return null; }
      if (native.pending && (!eligible(native.candidate, facts) || native.candidate.id.toLowerCase() !== candidate.id.toLowerCase())) {
        finish('native-candidate-changed'); return null;
      }
      return active() ? facts : null;
    }
    async function idleForActivation() {
      if (!await nativeIdle(expectedFacts)) return null;
      return currentForActivation();
    }
    const facts = await idleForActivation();
    if (!facts || !candidate) return;
    publish({ candidateId: candidate.id.toLowerCase() });
    if (!await idleForActivation()) return;
    const key = attemptKey(facts, candidate.id);
    // Any prior attempt, even unreadable, suppresses repeat activation.
    const previous = await adapter.storage.get(key);
    if (!await idleForActivation()) return;
    if (previous !== null) return finish('candidate-already-attempted');
    if (!currentForActivation()) return;
    await adapter.storage.set(key, JSON.stringify({ state: 'attempted', projectId: facts.projectId?.toLowerCase(),
      runtimeVersion: facts.runtimeVersion, candidateId: candidate.id.toLowerCase(), attemptedAt: Date.now() }));
    if (!await idleForActivation()) return;
    publish({ phase: 'applying', progress: 0.9, downloadProgress: undefined });
    // Subscribers can synchronously report background/unmount/entry/native changes.
    if (!await idleForActivation()) return;
    if (!currentForActivation()) return;
    open = false; // Exactly one owner can request reload in this runtime.
    // Native success is not proof the candidate ran. No success continuation:
    // the original total-deadline timer remains fallback for stalled reloads.
    void adapter.reload().catch(() => finish('reload-rejected'));
  }
  function reportDownload(native: NativeSnapshot) {
    const progress = native.downloadProgress;
    if (snapshot.phase !== 'downloading' || typeof progress !== 'number' ||
      !Number.isFinite(progress) || progress < 0 || progress > 1) return;
    const actual = Math.max(snapshot.downloadProgress ?? 0, progress);
    publish({ progress: 0.4 + actual * 0.4, downloadProgress: actual });
  }
  async function run() {
    try {
      await adapter.prepare();
      if (!active()) return;
      const facts = { ...adapter.facts() };
      if (!facts.supported || typeof facts.projectId !== 'string' || !UUID.test(facts.projectId) ||
        typeof facts.runtimeVersion !== 'string' || !facts.runtimeVersion.trim()) return finish('unsupported-or-unlinked');
      if (!((typeof facts.runningUpdateId === 'string' && UUID.test(facts.runningUpdateId)) ||
        (facts.runningUpdateId === null && facts.isEmbeddedLaunch === true))) return finish('uncertain-running-update');
      if (facts.emergency || facts.restartCount !== 0) return finish('restart-or-recovery');
      if (!adapter.canReload()) return finish('critical-flow');
      publish({ phase: 'checking', progress: 0.25 });
      const policyOwner = ownership(facts.checkAutomatically);
      if (policyOwner === 'unknown') return finish('unsupported-update-policy');
      // Native ownership is re-read after every async continuation. A pending
      // bundle borrowed from native cache must remain exact pending through
      // activation, even when it arrives during our manual check/ledger read.
      const initialNative = await nativeIdle(facts);
      if (!initialNative) return;
      if (initialNative.pending) return await activate(initialNative.candidate, facts, true);
      if (policyOwner === 'native') return finish('no-native-pending-update');
      if (!freshFacts(facts)) return;
      // An event may arrive while the idle Promise is being delivered.
      const beforeCheck = adapter.nativeSnapshot();
      if (beforeCheck.working || beforeCheck.pending) {
        const native = await nativeIdle(facts);
        if (!native) return;
        if (native.pending) return await activate(native.candidate, facts, true);
      }
      if (!freshFacts(facts)) return;
      const checkSelection = adapter.nativeSnapshot();
      if (checkSelection.error) return finish('native-update-error');
      if (checkSelection.working) return finish('native-ownership-changed');
      if (checkSelection.pending) return await activate(checkSelection.candidate, facts, true);
      const available = await adapter.check();
      const checkedFacts = freshFacts(facts);
      if (!checkedFacts) return;
      let native = await nativeIdle(facts);
      if (!native) return;
      if (native.pending) return await activate(native.candidate, facts, true);
      if (!available) return finish('no-update');
      if (!eligible(available, checkedFacts)) return finish('uncertain-or-incompatible-candidate');
      if (available.id.toLowerCase() === checkedFacts.runningUpdateId?.toLowerCase()) return finish('already-running');
      const previous = await adapter.storage.get(attemptKey(facts, available.id));
      if (!freshFacts(facts)) return;
      if (previous !== null) return finish('candidate-already-attempted');
      native = await nativeIdle(facts);
      if (!native) return;
      if (native.pending) return await activate(native.candidate, facts, true);
      publish({ phase: 'downloading', progress: 0.4 });
      native = await nativeIdle(facts);
      if (!native) return;
      if (native.pending) return await activate(native.candidate, facts, true);
      if (!freshFacts(facts)) return;
      const beforeFetch = adapter.nativeSnapshot();
      if (beforeFetch.error) return finish('native-update-error');
      if (beforeFetch.working) return finish('native-ownership-changed');
      if (beforeFetch.pending) return await activate(beforeFetch.candidate, facts, true);
      if (!active()) return;
      const downloaded = await adapter.fetch();
      if (!freshFacts(facts)) return;
      native = await nativeIdle(facts);
      if (!native) return;
      if (native.pending) {
        // A no-new API response may race a separately cached native selection.
        // Adopt that exact cache, but never contradict a concrete fetched ID.
        if (downloaded && typeof downloaded.id === 'string' &&
          downloaded.id.toLowerCase() !== native.candidate?.id.toLowerCase()) return finish('native-candidate-changed');
        return await activate(native.candidate, facts, true);
      }
      if (!downloaded || typeof downloaded.id !== 'string' || downloaded.id.toLowerCase() !== available.id.toLowerCase()) {
        return finish('candidate-changed-during-download');
      }
      await activate(downloaded, facts, native.pending);

    } catch {
      finish('startup-error'); // Includes offline, native API and safety-storage failures.
    }
  }

  return {
    snapshot: () => snapshot,
    subscribe(listener: (state: StartupSnapshot) => void) {
      listeners.add(listener);
      try { listener(snapshot); } catch { /* Consumer error. */ }
      return () => { listeners.delete(listener); };
    },
    start() {
      if (!started && !settled) {
        started = true;
        expiresAt = now() + deadlineMs;
        timer = clock.setTimeout(() => finish('deadline'), deadlineMs);
        void run();
      }
      return result;
    },
    close(reason: 'background' | 'unmount' | 'entry') { finish(reason); },
    observeNative() {
      nativeRevision += 1;
      if (!active()) return;
      try { reportDownload(adapter.nativeSnapshot()); } catch { finish('startup-error'); }
      wakeNative?.();
    },
    async markAppEntered() {
      finish('entry');
      if (entryRecorded) return;
      entryRecorded = true;
      // Diagnostic facts/storage are best effort and never reject entry.
      try {
        const facts = { ...adapter.facts() };
        if (!facts.supported || facts.emergency || !facts.projectId || !UUID.test(facts.projectId) || !facts.runtimeVersion ||
          !facts.runningUpdateId || !UUID.test(facts.runningUpdateId)) return;
        // Only a currently RUNNING candidate plus real app entry proves application.
        const key = attemptKey(facts, facts.runningUpdateId);
        const value = await adapter.storage.get(key);
        if (!value) return;
        const attempt = JSON.parse(value);
        if (!isRecord(attempt) || attempt.candidateId !== facts.runningUpdateId.toLowerCase() ||
          attempt.projectId !== facts.projectId.toLowerCase() || attempt.runtimeVersion !== facts.runtimeVersion ||
          !['attempted', 'entered'].includes(String(attempt.state))) return;
        const current = adapter.facts();
        if (current.emergency || !current.supported || current.projectId?.toLowerCase() !== facts.projectId.toLowerCase() ||
          current.runtimeVersion !== facts.runtimeVersion || current.runningUpdateId?.toLowerCase() !== facts.runningUpdateId.toLowerCase()) return;
        await adapter.storage.set(key, JSON.stringify({ ...attempt, state: 'entered', enteredAt: Date.now() }));
      } catch { /* Entry must never depend on diagnostic storage. */ }
    },
  };
}

export type StartupGate = ReturnType<typeof createStartupGate>;
