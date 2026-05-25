import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  OrgResponse, OrgMemberResponse, OrgInviteResponse,
  OrgPreviewResponse, AcceptInviteResponse
} from '../../shared/models/api.models';

const ACTIVE_ORG_KEY = 'ezstem_active_org';
const ACTIVE_ORG_NAME_KEY = 'ezstem_active_org_name';

@Injectable({ providedIn: 'root' })
export class OrgService {
  private _activeOrgId = signal<string | null>(localStorage.getItem(ACTIVE_ORG_KEY));
  private _activeOrgName = signal<string | null>(localStorage.getItem(ACTIVE_ORG_NAME_KEY));
  readonly activeOrgId = this._activeOrgId.asReadonly();
  readonly activeOrgName = this._activeOrgName.asReadonly();

  constructor(private api: ApiService) {}

  setActiveOrg(orgId: string | null, orgName?: string): void {
    if (orgId) {
      localStorage.setItem(ACTIVE_ORG_KEY, orgId);
      if (orgName) localStorage.setItem(ACTIVE_ORG_NAME_KEY, orgName);
    } else {
      localStorage.removeItem(ACTIVE_ORG_KEY);
      localStorage.removeItem(ACTIVE_ORG_NAME_KEY);
    }
    this._activeOrgId.set(orgId);
    this._activeOrgName.set(orgId ? (orgName ?? localStorage.getItem(ACTIVE_ORG_NAME_KEY)) : null);
  }

  createOrg(name: string): Observable<OrgResponse> {
    return this.api.post<OrgResponse>('organizations', { name });
  }

  getMyOrgs(): Observable<OrgResponse[]> {
    return this.api.get<OrgResponse[]>('organizations/my');
  }

  createInvite(orgId: string): Observable<OrgInviteResponse> {
    return this.api.post<OrgInviteResponse>(`organizations/${orgId}/invite`, {});
  }

  getInvitePreview(token: string): Observable<OrgPreviewResponse> {
    return this.api.get<OrgPreviewResponse>(`organizations/preview/${token}`);
  }

  acceptInvite(token: string): Observable<AcceptInviteResponse> {
    return this.api.post<AcceptInviteResponse>(`organizations/join/${token}`, {}).pipe(
      tap((result) => this.setActiveOrg(result.orgId, result.orgName))
    );
  }

  getMembers(orgId: string): Observable<OrgMemberResponse[]> {
    return this.api.get<OrgMemberResponse[]>(`organizations/${orgId}/members`);
  }

  removeMember(orgId: string, memberId: string): Observable<void> {
    return this.api.delete<void>(`organizations/${orgId}/members/${memberId}`);
  }
}
