import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Page not login
import { ContentComponent } from './layouts/content/content.component';
import { SignComponent } from './pages/sign/sign.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { ActiveComponent } from './pages/active/active.component';
import { SignOutComponent } from './pages/sign-out/sign-out.component';

// AuthGuard
import { AuthGuard1 } from './helpers/auth.guard1';

// Page login Dashboard & Apps
import { DashboardComponent } from './contents/dashboard/dashboard.component';
import { EsalaryComponent } from './contents/apps/esalary/esalary.component';
import { TaxComponent } from './contents/apps/tax/tax.component';

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
  { path: 'signup/active/:token', component: ActiveComponent },
  { path: 'signout', component: SignOutComponent },
  { path: 'forgot', component: SignComponent },
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
    canActivate: [AuthGuard1],
    children: [
      { path: 'esalary', component: EsalaryComponent },
      { path: 'tax', component: TaxComponent },
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
