import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IssuesService, Issue, IssueCreate, IssueUpdate, Priority, Status } from '../../services/issues.service';

@Component({
  selector: 'app-issue-form',
  templateUrl: './issue-form.component.html'
})
export class IssueFormComponent implements OnInit {
  id?: number;
  model: IssueCreate | IssueUpdate = { title: '', description: '', status: 'open', priority: 'medium', assignee: '' };
  statuses: Status[] = ['open', 'in_progress', 'resolved', 'closed'];
  priorities: Priority[] = ['low', 'medium', 'high', 'critical'];
  saving: boolean = false;
  isEdit: boolean = false;

  constructor(private route: ActivatedRoute, private router: Router, private issues: IssuesService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      this.id = idParam ? Number(idParam) : undefined;
      this.isEdit = !!this.id;
      if (this.isEdit && this.id) {
        this.issues.get(this.id).subscribe(issue => {
          this.model = {
            title: issue.title,
            description: issue.description || '',
            status: issue.status,
            priority: issue.priority,
            assignee: issue.assignee || ''
          };
        });
      }
    });
  }

  save(): void {
    this.saving = true;
    if (this.isEdit && this.id) {
      this.issues.update(this.id, this.model as IssueUpdate).subscribe({
        next: (res: Issue) => { this.saving = false; this.router.navigate(['/issues']); },
        error: () => { this.saving = false; }
      });
    } else {
      this.issues.create(this.model as IssueCreate).subscribe({
        next: (res: Issue) => { this.saving = false; this.router.navigate(['/issues']); },
        error: () => { this.saving = false; }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/issues']);
  }
}
