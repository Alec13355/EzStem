import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { UserSettingsResponse, UpdateUserSettingsRequest } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
  constructor(private api: ApiService) {}

  getSettings(): Observable<UserSettingsResponse> {
    return this.api.get<UserSettingsResponse>('user-settings');
  }

  updateSettings(request: UpdateUserSettingsRequest): Observable<UserSettingsResponse> {
    return this.api.put<UserSettingsResponse>('user-settings', request);
  }
}
