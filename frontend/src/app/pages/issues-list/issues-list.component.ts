import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IssuesService, Issue, IssuesResponse, Priority, Status } from '../../services/issues.service';

@Component({
  selector: 'app-issues-list',
  templateUrl: './issues-list.component.html'
})
export class IssuesListComponent implements OnInit {
  // filters and controls
  search: string = '';
  status: '' | Status = '';
  priority: '' | Priority = '';
  assignee: string = '';
  sortBy: 'id' | 'title' | 'status' | 'priority' | 'assignee' | 'updatedAt' = 'updatedAt';
  sortDir: 'asc' | 'desc' = 'desc';
  page: number = 1;
  pageSize: number = 10;

  // data
  items: Issue[] = [];
  total: number = 0;

  statuses: Status[] = ['open', 'in_progress', 'resolved', 'closed'];
  priorities: Priority[] = ['low', 'medium', 'high', 'critical'];

  loading: boolean = false;

  constructor(private issues: IssuesService, private router: Router) {}

  ngOnInit(): void {
    this.fetch();
  }

  get maxPage(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  fetch(): void {
    this.loading = true;
    this.issues.list({
      search: this.search || undefined,
      status: this.status || undefined,
      priority: this.priority || undefined,
      assignee: this.assignee || undefined,
      sortBy: this.sortBy,
      sortDir: this.sortDir,
      page: this.page,
      pageSize: this.pageSize,
    }).subscribe({
      next: (res: IssuesResponse) => {
        this.items = res.items;
        this.total = res.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  resetFilters(): void {
    this.search = '';
    this.status = '';
    this.priority = '';
    this.assignee = '';
    this.page = 1;
    this.fetch();
  }

  onSort(column: 'id' | 'title' | 'status' | 'priority' | 'assignee' | 'updatedAt'): void {
    if (this.sortBy === column) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDir = 'asc';
    }
    this.fetch();
  }

  onPageChange(delta: number): void {
    const newPage = this.page + delta;
    this.page = Math.min(Math.max(1, newPage), this.maxPage);
    this.fetch();
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.fetch();
  }

  openDetail(issue: Issue): void {
    this.router.navigate(['/issues', issue.id]);
  }

  openCreate(): void {
    this.router.navigate(['/issues/new']);
  }

  openEdit(issue: Issue, event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/issues', issue.id, 'edit']);
  }
}
