import type { Hex } from "viem";
import type { IntentRegistryWriter } from "./registry.js";
import type { PaymentIntent } from "./types.js";

export type PublishStatus = "queued" | "publishing" | "published" | "failed";

export interface PublishJob {
  intentHash: Hex;
  intent: PaymentIntent;
  status: PublishStatus;
  attempts: number;
  txHash?: Hex;
  lastError?: string;
}

export interface IntentPublisherOptions {
  maxAttempts?: number;
  /** Délai entre tentatives (ms) ; injectable pour les tests. */
  backoffMs?: (attempt: number) => number;
  sleep?: (ms: number) => Promise<void>;
  onChange?: (job: PublishJob) => void;
}

/**
 * Publication ASYNCHRONE de l'intention vers IntentRegistry : `enqueue` rend la main immédiatement,
 * la garde (Jev/Mistral + règles déterministes) n'attend jamais la chaîne. La lecture `isConfirmed`
 * (registry.ts) est, elle, synchrone au moment du règlement.
 * File en mémoire, un worker, retries bornés — suffisant pour la démo ; à remplacer par Inngest/BullMQ en prod.
 */
export class IntentPublisher {
  private readonly jobs = new Map<Hex, PublishJob>();
  private readonly queue: Hex[] = [];
  private draining: Promise<void> | null = null;
  private readonly maxAttempts: number;
  private readonly backoffMs: (attempt: number) => number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly onChange: ((job: PublishJob) => void) | undefined;

  constructor(
    private readonly writer: IntentRegistryWriter,
    opts: IntentPublisherOptions = {},
  ) {
    this.maxAttempts = opts.maxAttempts ?? 3;
    this.backoffMs = opts.backoffMs ?? ((attempt) => 500 * 2 ** (attempt - 1));
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.onChange = opts.onChange;
  }

  /** Non bloquant : retourne le job et démarre le worker en arrière-plan. */
  enqueue(intentHash: Hex, intent: PaymentIntent): PublishJob {
    const existing = this.jobs.get(intentHash);
    if (existing) return existing;
    const job: PublishJob = { intentHash, intent, status: "queued", attempts: 0 };
    this.jobs.set(intentHash, job);
    this.queue.push(intentHash);
    void this.drain();
    return job;
  }

  get(intentHash: Hex): PublishJob | undefined {
    return this.jobs.get(intentHash);
  }

  /** Attend que la file soit vide (tests, arrêt propre). */
  async idle(): Promise<void> {
    while (this.draining) await this.draining;
  }

  private drain(): Promise<void> {
    if (this.draining) return this.draining;
    this.draining = (async () => {
      try {
        let next: Hex | undefined;
        while ((next = this.queue.shift()) !== undefined) {
          const job = this.jobs.get(next);
          if (job) await this.publish(job);
        }
      } finally {
        this.draining = null;
      }
    })();
    return this.draining;
  }

  private async publish(job: PublishJob): Promise<void> {
    while (job.attempts < this.maxAttempts) {
      job.attempts += 1;
      this.update(job, "publishing");
      try {
        job.txHash = await this.writer.publishIntent(job.intentHash, job.intent);
        this.update(job, "published");
        return;
      } catch (err) {
        job.lastError = err instanceof Error ? err.message : String(err);
        if (job.attempts < this.maxAttempts) await this.sleep(this.backoffMs(job.attempts));
      }
    }
    this.update(job, "failed");
  }

  private update(job: PublishJob, status: PublishStatus): void {
    job.status = status;
    this.onChange?.(job);
  }
}
