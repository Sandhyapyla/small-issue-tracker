import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IssuesListComponent } from './pages/issues-list/issues-list.component';
import { IssueDetailComponent } from './pages/issue-detail/issue-detail.component';
import { IssueFormComponent } from './pages/issue-form/issue-form.component';

const routes: Routes = [
  { path: '', redirectTo: 'issues', pathMatch: 'full' },
  { path: 'issues', component: IssuesListComponent },
  { path: 'issues/new', component: IssueFormComponent },
  { path: 'issues/:id/edit', component: IssueFormComponent },
  { path: 'issues/:id', component: IssueDetailComponent },
  { path: '**', redirectTo: 'issues' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
