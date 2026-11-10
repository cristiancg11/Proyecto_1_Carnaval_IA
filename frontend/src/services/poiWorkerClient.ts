/**
 * Client RPC manager communicating with the dedicated poiWorker via postMessage.
 * Offloads spatial calculations and Haversine sorting from the main UI thread.
 * Includes graceful synchronous fallback to POIService if Web Workers are unavailable.
 */

import { RAW_PASTO_POIS, POIService, IntentMatchResult, PointOfInterest, LatLngTuple } from '../data/pastoPOIs';
import { WorkerRequest, WorkerResponse } from '../workers/poiWorker';

export class POIWorkerClient {
  private static instance: POIWorkerClient | null = null;
  private worker: Worker | null = null;
  private isInitialized = false;
  private requestIdCounter = 0;
  private pendingRequests: Map<
    string,
    { resolve: (value: any) => void; reject: (reason: any) => void; timer: ReturnType<typeof setTimeout> }
  > = new Map();

  private constructor() {
    this.initWorker();
  }

  public static getInstance(): POIWorkerClient {
    if (!POIWorkerClient.instance) {
      POIWorkerClient.instance = new POIWorkerClient();
    }
    return POIWorkerClient.instance;
  }

  /**
   * Initializes the Web Worker and sets up the message event listener.
   */
  private initWorker(): void {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      console.info('[POIWorkerClient] Web Workers not available in environment; using main-thread fallback.');
      return;
    }

    try {
      this.worker = new Worker(new URL('../workers/poiWorker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, success, result, error } = event.data;
        const pending = this.pendingRequests.get(id);
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(id);
          if (success) {
            pending.resolve(result);
          } else {
            pending.reject(new Error(error || 'Worker task failed'));
          }
        }
      };

      this.worker.onerror = (err) => {
        console.warn('[POIWorkerClient] Worker runtime error:', err);
      };

      // Seed worker with initial POI dataset
      this.sendRequest('INIT', RAW_PASTO_POIS).then(() => {
        this.isInitialized = true;
      }).catch((err) => {
        console.warn('[POIWorkerClient] Failed to initialize worker dataset:', err);
      });
    } catch (err) {
      console.warn('[POIWorkerClient] Could not instantiate Web Worker:', err);
      this.worker = null;
    }
  }

  /**
   * Dispatches a postMessage request to the Web Worker with a timeout.
   */
  private sendRequest<T = any>(action: WorkerRequest['action'], payload?: any, timeoutMs = 3000): Promise<T> {
    if (!this.worker) {
      return this.fallbackExecution(action, payload);
    }

    const id = `req-${++this.requestIdCounter}-${Date.now()}`;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        // On timeout, gracefully fallback to synchronous main thread execution
        console.warn(`[POIWorkerClient] Task ${action} (${id}) timed out; falling back to main thread.`);
        this.fallbackExecution<T>(action, payload).then(resolve).catch(reject);
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });
      this.worker!.postMessage({ id, action, payload } as WorkerRequest);
    });
  }

  /**
   * Synchronous main-thread fallback using POIService.
   */
  private async fallbackExecution<T = any>(action: WorkerRequest['action'], payload?: any): Promise<T> {
    const service = POIService.getInstance(RAW_PASTO_POIS);
    switch (action) {
      case 'INIT':
        return { count: service.size } as T;
      case 'INTENT_MATCH':
        return service.findBestForIntent(payload?.query, payload?.userCoords) as T;
      case 'FIND_CLOSEST': {
        const res = service.findClosest(payload?.coords, payload?.category);
        return (res ? { poi: res.poi.toJSON(), distanceKm: res.distanceKm } : null) as T;
      }
      case 'FILTER_BY_CATEGORY':
        return service.getByCategory(payload?.category).map((p) => p.toJSON()) as T;
      case 'SEARCH':
        return service.search(payload?.query, payload?.userCoords).map((p) => p.toJSON()) as T;
      default:
        throw new Error(`Unsupported fallback action: ${action}`);
    }
  }

  /**
   * Evaluates user query for spatial intent (restaurants, bathrooms, police, health, stages)
   * offloaded to the Web Worker.
   */
  public async findBestPOIAsync(query: string, userCoords?: LatLngTuple): Promise<IntentMatchResult | null> {
    return this.sendRequest<IntentMatchResult | null>('INTENT_MATCH', { query, userCoords });
  }

  /**
   * Finds closest POI to user coordinates offloaded to the Web Worker.
   */
  public async findClosestPOIAsync(
    coords: LatLngTuple,
    category?: string
  ): Promise<{ poi: PointOfInterest; distanceKm: number } | null> {
    return this.sendRequest('FIND_CLOSEST', { coords, category });
  }

  /**
   * Filters POIs by category offloaded to the Web Worker.
   */
  public async filterByCategoryAsync(category: string, userCoords?: LatLngTuple): Promise<PointOfInterest[]> {
    return this.sendRequest('FILTER_BY_CATEGORY', { category, userCoords });
  }

  /**
   * Searches POIs by query offloaded to the Web Worker.
   */
  public async searchAsync(query: string, userCoords?: LatLngTuple): Promise<PointOfInterest[]> {
    return this.sendRequest('SEARCH', { query, userCoords });
  }

  /**
   * Terminates the worker instance when shutting down.
   */
  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

export const poiWorkerClient = POIWorkerClient.getInstance();
export default poiWorkerClient;
