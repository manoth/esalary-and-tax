import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MyDatePickerModule } from 'mydatepicker-thai';
import { MyDateRangePickerModule } from 'mydaterangepicker';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { FullCalendarModule } from '@fullcalendar/angular';
import { AppRoutingModule } from './app-routing.module';

import { JwtInterceptor, ErrorInterceptor } from './helpers';
import { environment } from 'src/environments/environment';

import {
  AgePipe, FilterPipe, FilterAllPipe, Nl2BrPipe, SortByPipe, ThaiDatePipe, TimeAgoPipe, UniquePipe, SumColumnPipe
} from './pipes';

import { AppComponent } from './app.component';
import { HeaderComponent } from './layouts/header/header.component';
import { FooterComponent } from './layouts/footer/footer.component';
import { MenuComponent } from './layouts/menu/menu.component';
import { ContentComponent } from './layouts/content/content.component';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { DashboardComponent } from './contents/dashboard/dashboard.component';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { ForgotComponent } from './pages/forgot/forgot.component';
import { SignComponent } from './pages/sign/sign.component';
import { ActiveComponent } from './pages/active/active.component';
import { ProfileComponent } from './contents/settings/profile/profile.component';
import { HospitalComponent } from './contents/settings/hospital/hospital.component';
import { BreadcrumbsComponent } from './layouts/breadcrumbs/breadcrumbs.component';
import { EsalaryComponent } from './contents/apps/esalary/esalary.component';
import { TaxComponent } from './contents/apps/tax/tax.component';
import { PositionComponent } from './contents/settings/position/position.component';
import { SignOutComponent } from './pages/sign-out/sign-out.component';
import { TimestampComponent } from './contents/reports/timestamp/timestamp.component';
import { MeetingComponent } from './contents/apps/meeting/meeting.component';
import { HospitalConfirmComponent } from './contents/settings/hospital-confirm/hospital-confirm.component';
import { MeetingTodayComponent } from './contents/apps/meeting-today/meeting-today.component';
import { ScheduleComponent } from './contents/reports/schedule/schedule.component';
import { EleaveComponent } from './contents/apps/eleave/eleave.component';
import { GoToGovernmentComponent } from './contents/apps/go-to-government/go-to-government.component';
import { LetterComponent } from './contents/apps/letter/letter.component';
import { LeaveComponent } from './contents/reports/leave/leave.component';

@NgModule({
  declarations: [
    AgePipe, FilterPipe, FilterAllPipe, Nl2BrPipe, SortByPipe, ThaiDatePipe, TimeAgoPipe, UniquePipe, SumColumnPipe,
    AppComponent,
    HeaderComponent,
    FooterComponent,
    MenuComponent,
    ContentComponent,
    SignInComponent,
    PageNotFoundComponent,
    DashboardComponent,
    SignUpComponent,
    ForgotComponent,
    SignComponent,
    ActiveComponent,
    ProfileComponent,
    HospitalComponent,
    BreadcrumbsComponent,
    EsalaryComponent,
    TaxComponent,
    PositionComponent,
    SignOutComponent,
    TimestampComponent,
    MeetingComponent,
    HospitalConfirmComponent,
    MeetingTodayComponent,
    ScheduleComponent,
    EleaveComponent,
    GoToGovernmentComponent,
    LetterComponent,
    LeaveComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    MyDatePickerModule,
    MyDateRangePickerModule,
    PdfViewerModule,
    FullCalendarModule,
    AppRoutingModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: 'APIURL', useValue: environment.apiUrl },
    { provide: 'TOKENNAME', useValue: environment.tokenName },
    { provide: 'PASSCODENAME', useValue: environment.passcodeName },
    { provide: 'ADMINTOKEN_NAME', useValue: environment.adminTokenName },
    { provide: 'DEFAULTPATH', useValue: environment.defaultPath }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
