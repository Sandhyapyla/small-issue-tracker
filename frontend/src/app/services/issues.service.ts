import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Status = 'open' | 'in_progress' | 'resolved' | 'closed';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Issue {
	id: number;
	title: string;
	description?: string | null;
	status: Status;
	priority: Priority;
	assignee?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface IssueCreate {
	title: string;
	description?: string | null;
	status?: Status;
	priority?: Priority;
	assignee?: string | null;
}

export interface IssueUpdate {
	title?: string;
	description?: string | null;
	status?: Status;
	priority?: Priority;
	assignee?: string | null;
}

export interface IssuesResponse {
	items: Issue[];
	total: number;
	page: number;
	pageSize: number;
}

@Injectable({
	providedIn: 'root'
})
export class IssuesService {
	private readonly baseUrl = 'http://127.0.0.1:8000';

	constructor(private http: HttpClient) {}

	list(params: {
		search?: string;
		status?: Status;
		priority?: Priority;
		assignee?: string;
		sortBy?: 'id' | 'title' | 'status' | 'priority' | 'assignee' | 'updatedAt';
		sortDir?: 'asc' | 'desc';
		page?: number;
		pageSize?: number;
	}): Observable<IssuesResponse> {
		let httpParams = new HttpParams();
		Object.entries(params).forEach(([k, v]) => {
			if (v !== undefined && v !== null && v !== '') {
				httpParams = httpParams.set(k, String(v));
			}
		});
		return this.http.get<IssuesResponse>(`${this.baseUrl}/issues`, { params: httpParams });
	}

	get(id: number): Observable<Issue> {
		return this.http.get<Issue>(`${this.baseUrl}/issues/${id}`);
	}

	create(body: IssueCreate): Observable<Issue> {
		return this.http.post<Issue>(`${this.baseUrl}/issues`, body);
	}

	update(id: number, body: IssueUpdate): Observable<Issue> {
		return this.http.put<Issue>(`${this.baseUrl}/issues/${id}`, body);
	}
}
