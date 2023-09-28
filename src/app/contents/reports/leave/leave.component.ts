import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services';

declare const $: any;

@Component({
  selector: 'app-leave',
  templateUrl: './leave.component.html',
  styleUrls: ['./leave.component.scss']
})
export class LeaveComponent implements OnInit {

  public loading: boolean = true;
  public bYear: number;
  public toDay = new Date();
  public leaveBYear: any;
  public report: any[] = [];

  public rowsLeave: any[] = [];
  public department: string = '32';
  public departments: any[] = [];
  public leaveHistory: any[] = [];
  public pipeLeave: number;

  constructor(
    public main: MainService
  ) { }

  ngOnInit() {
    this.getEleaveBYear();
  }

  getDepartments() {
    this.main.get('personal-time/eleave/departments/list').then((res: any) => {
      this.departments = (res.ok) ? res.data : [];
    });
  }

  getLeaveHistory(deptId, bYear) {
    this.main.get(`personal-time/eleave/history/${deptId}/${bYear}`).then((res: any) => {
      this.leaveHistory = (res.ok) ? res.data : [];
    });
  }

  getEleaveBYear() {
    this.main.get('personal-time/eleave/bYear').then((res: any) => {
      this.bYear = (res.ok) ? res.data[0].b_year : this.toDay.getFullYear();
      this.leaveBYear = (res.ok) ? res.data : [];
      this.getReport(this.bYear);
      this.getDepartments();
    });
  }

  getReport(bYear: number) {
    this.loading = true;
    this.main.get(`personal-time/eleave/report/01/${bYear}`).then((res: any) => {
      this.loading = false;
      this.report = (res.ok) ? res.data : [];
      this.getLeaveHistory(this.department, bYear);
    });
  }

  numberFormat(num: string) {
    return this.main.number_format(+num, 1);
  }

  onDetail(cid: string, typeId?: number) {
    this.loading = true;
    this.pipeLeave = typeId;
    this.main.get(`personal-time/eleave/bYear/${this.bYear}/cid/${cid}`).then((res: any) => {
      this.rowsLeave = (res.ok) ? res.data : [];
      $('#modal-detail').modal();
      this.loading = false;
    });
  }

}
