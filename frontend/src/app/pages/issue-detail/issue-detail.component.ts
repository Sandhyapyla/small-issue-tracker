import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IssuesService, Issue } from '../../services/issues.service';

@Component({
  selector: 'app-issue-detail',
  templateUrl: './issue-detail.component.html'
})
export class IssueDetailComponent implements OnInit {
  issue?: Issue;
  loading: boolean = false;
  editMode: boolean = false;

  constructor(private route: ActivatedRoute, private router: Router, private issues: IssuesService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.fetch(id);
      }
    });
    this.route.queryParamMap.subscribe(q => {
      this.editMode = q.get('edit') === '1';
    });
  }

  fetch(id: number): void {
    this.loading = true;
    this.issues.get(id).subscribe({
      next: (it) => { this.issue = it; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  back(): void {
    this.router.navigate(['/issues']);
  }
}
