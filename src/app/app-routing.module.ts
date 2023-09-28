import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Page not login
import { ContentComponent } from './layouts/content/content.component';
import { SignComponent } from './pages/sign/sign.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { ActiveComponent } from './pages/active/active.component';
import { SignOutComponent } from './pages/sign-out/sign-out.component';
import { MeetingTodayComponent } from './contents/apps/meeting-today/meeting-today.component';

// AuthGuard
import { AuthGuard1 } from './helpers/auth.guard1'
import { AuthGuard2 } from './helpers/auth.guard2'
import { AuthGuard3 } from './helpers/auth.guard3'

// Page login Dashboard & Apps
import { DashboardComponent } from './contents/dashboard/dashboard.component';
import { MeetingComponent } from './contents/apps/meeting/meeting.component';
import { EsalaryComponent } from './contents/apps/esalary/esalary.component';
import { TaxComponent } from './contents/apps/tax/tax.component';
import { LetterComponent } from './contents/apps/letter/letter.component';
import { EleaveComponent } from './contents/apps/eleave/eleave.component';
import { GoToGovernmentComponent } from './contents/apps/go-to-government/go-to-government.component';

// Page login Reports
import { TimestampComponent } from './contents/reports/timestamp/timestamp.component';
import { ScheduleComponent } from './contents/reports/schedule/schedule.component';
import { LeaveComponent } from './contents/reports/leave/leave.component';

// Page login Settings
import { HospitalComponent } from './contents/settings/hospital/hospital.component';
import { HospitalConfirmComponent } from './contents/settings/hospital-confirm/hospital-confirm.component';
import { PositionComponent } from './contents/settings/position/position.component';
import { ProfileComponent } from './contents/settings/profile/profile.component';

const routes: Routes = [
  // { path: '', redirectTo: 'signin', pathMatch: 'full' },
  { path: 'signin', component: SignComponent },
  { path: 'signin/:signin', component: SignComponent },
  { path: 'signup', component: SignComponent },
  { path: 'signup/:signin', component: SignComponent },
  { path: 'forgot', component: SignComponent },
  { path: 'signup/active/:token', component: ActiveComponent },
  { path: 'apps/meeting/today', component: MeetingTodayComponent },
  { path: 'signout', component: SignOutComponent },
  {
    path: '', component: ContentComponent,
    canActivate: [AuthGuard1],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: DashboardComponent }
    ]
  },
  {
    path: 'apps', component: ContentComponent,
    children: [
      { path: 'meeting', component: MeetingComponent },
    ]
  },
  {
    path: 'apps', component: ContentComponent,
    canActivate: [AuthGuard1],
    children: [
      { path: 'esalary', component: EsalaryComponent },
      { path: 'tax', component: TaxComponent },
    ]
  },
  {
    path: 'apps', component: ContentComponent,
    canActivate: [AuthGuard2],
    children: [
      { path: 'letter', component: LetterComponent },
      { path: 'letter/:page', component: LetterComponent },
    ]
  },
  {
    path: 'apps', component: ContentComponent,
    canActivate: [AuthGuard3],
    children: [
      { path: 'eleave', component: EleaveComponent },
      { path: 'go-to-government', component: GoToGovernmentComponent },
      { path: 'go-to-government/:page', component: GoToGovernmentComponent },
    ]
  },
  {
    path: 'reports', component: ContentComponent,
    canActivate: [AuthGuard3],
    children: [
      { path: 'timestamp', component: TimestampComponent },
      { path: 'schedule', component: ScheduleComponent },
      { path: 'eleave', component: LeaveComponent },
    ]
  },
  {
    path: 'settings', component: ContentComponent,
    canActivate: [AuthGuard1],
    children: [
      { path: 'hospital', component: HospitalComponent },
      { path: 'hospital-confirm', component: HospitalConfirmComponent },
      { path: 'position', component: PositionComponent },
      { path: 'profile', component: ProfileComponent },
    ]
  },
  { path: '**', component: PageNotFoundComponent, pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
