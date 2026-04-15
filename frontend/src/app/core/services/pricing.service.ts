import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PricingConfig, PricingResult } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  constructor(private api: ApiService) {}

  getPricingConfig(): Observable<PricingConfig> {
    return this.api.get<PricingConfig>('pricing/config');
  }

  updatePricingConfig(config: Partial<PricingConfig>): Observable<PricingConfig> {
    return this.api.post<PricingConfig>('pricing/config', config);
  }

  calculatePricing(request: any): Observable<PricingResult> {
    return this.api.post<PricingResult>('pricing/calculate', request);
  }
}
