import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services';
import { IMyDpOptions } from 'mydatepicker-thai';
import { IMyDrpOptions } from 'mydaterangepicker';

declare const $: any;

@Component({
  selector: 'app-timestamp',
  templateUrl: './timestamp.component.html',
  styleUrls: ['./timestamp.component.scss']
})
export class TimestampComponent implements OnInit {

  public loading: boolean = true;
  public myDateOptions: IMyDpOptions;
  public toDate: any;
  public myDate: any;
  public timestamp: any;
  public list: any;
  public listAll: any;
  public checktimename: string = 'ไม่มาปฏิบัติงาน';
  public checktime: boolean;
  public notcheckout: any;

  public decode: any;

  public report: any;
  public workgroup: string = 'กลุ่มงานบริหารทั่วไป';
  public beginDate: any;
  public endDate: any;
  public myDateRangeOptions: IMyDrpOptions = {
    dateFormat: 'dd mmm yyyy',
    dayLabels: { su: 'อา', mo: 'จ', tu: 'อ', we: 'พ', th: 'พฤ', fr: 'ศ', sa: 'ส' },
    monthLabels: { 1: 'ม.ค', 2: 'ก.พ.', 3: 'มี.ค.', 4: 'เม.ย.', 5: 'พ.ค.', 6: 'มิ.ย.', 7: 'ก.ค.', 8: 'ส.ค.', 9: 'ก.ย.', 10: 'ต.ค.', 11: 'พ.ย.', 12: 'ธ.ค.' },
    firstDayOfWeek: 'su',
    sunHighlight: true,
    editableDateRangeField: false,
    inline: false,
    alignSelectorRight: false,
    indicateInvalidDateRange: true,
    openSelectorOnInputClick: true,
    showClearDateRangeBtn: false,
    showClearBtn: false
  };

  // For example initialize to specific date (09.10.2018 - 19.10.2018). It is also possible
  // to set initial date range value using the selDateRange attribute.
  public myDateRangeModel: any;

  constructor(
    public main: MainService
  ) {
    this.main.jwtDecode.then((decode: any) => {
      this.decode = decode;
    });
  }

  ngOnInit() {
    const d = new Date();
    // let time = ('00' + d.getHours()).substr(-2) + '.' + ('00' + d.getMinutes()).substr(-2);
    // this.checktime = (time < '08.45' || time > '16.30') ? true : false;
    (d.getDay() == 0) ? d.setDate((d.getDate() - 2)) : null;
    (d.getDay() == 6) ? d.setDate((d.getDate() - 1)) : null;
    this.toDate = { date: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() } }
    this.myDate = d.getFullYear() + '/' + (+d.getMonth() + 1) + '/' + d.getDate();
    // d.setDate((d.getDate() + 1));
    this.myDateOptions = {
      dateFormat: 'dd mmm yyyy',
      satHighlight: true,
      editableDateField: false,
      openSelectorOnInputClick: true,
      showClearDateBtn: false
    };
    this.getTimeStamp(this.myDate);
    let beginDate = { year: d.getFullYear(), month: d.getMonth() + 1, day: 1 };
    let endDate = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
    this.myDateRangeModel = {
      beginDate: beginDate,
      endDate: endDate
    };
    this.beginDate = beginDate.year + '/' + beginDate.month + '/' + beginDate.day;
    this.endDate = endDate.year + '/' + endDate.month + '/' + endDate.day;
    this.getRepor(this.beginDate, this.endDate);
    // this.myDateRangeOptions.disableSince = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }

  getTimeStamp(mydate: any) {
    this.loading = true;
    mydate = mydate.split('/');
    mydate = mydate[0] + ('00' + mydate[1]).substr(-2) + ('00' + mydate[2]).substr(-2);
    this.main.post('timestamp', { mydate }).then((res: any) => {
      this.timestamp = res.data;
      this.getList('');
    });
  }

  getList(dept: string) {
    (dept) ? $('#modal-timestamp').modal({ backdrop: 'static', keyboard: false }) : null;
    let mydate = this.myDate.split('/');
    mydate = mydate[0] + ('00' + mydate[1]).substr(-2) + ('00' + mydate[2]).substr(-2);
    this.main.post('timestamp/list', { mydate, dept }).then((res: any) => {
      this.loading = false;
      this.listAll = (!dept) ? res.data : this.listAll;
      this.list = res.data;
    });
  }

  getRepor(beginDate, endDate) {
    this.loading = true;
    let _beginDate = beginDate.split('/');
    _beginDate = _beginDate[0] + ('00' + _beginDate[1]).substr(-2) + ('00' + _beginDate[2]).substr(-2);
    let _endDate = endDate.split('/');
    _endDate = _endDate[0] + ('00' + _endDate[1]).substr(-2) + ('00' + _endDate[2]).substr(-2);
    this.main.get(`timestamp/report/${_beginDate}/${_endDate}`).then((res: any) => {
      // console.log(res);
      this.loading = false;
      this.report = res.data;
    });
  }

  getNotCheckInOut(cid, beginDate, endDate, check) {
    this.loading = true;
    let _beginDate = beginDate.split('/');
    _beginDate = _beginDate[0] + ('00' + _beginDate[1]).substr(-2) + ('00' + _beginDate[2]).substr(-2);
    let _endDate = endDate.split('/');
    _endDate = _endDate[0] + ('00' + _endDate[1]).substr(-2) + ('00' + _endDate[2]).substr(-2);
    this.main.get(`timestamp/report/notcheck/${check}/${cid}/${_beginDate}/${_endDate}`).then((res: any) => {
      // console.log(res);
      this.loading = false;
      this.notcheckout = (res.ok) ? res.data : [];
      $('#modal-notcheckout').modal({ backdrop: 'static', keyboard: false });
    });
  }

  onChangDate(e: any) {
    this.myDate = e.date.year + '/' + e.date.month + '/' + e.date.day;
    this.getTimeStamp(this.myDate);
  }

  onChangDateRange(e: any) {
    this.beginDate = e.beginDate.year + '/' + e.beginDate.month + '/' + e.beginDate.day;
    this.endDate = e.endDate.year + '/' + e.endDate.month + '/' + e.endDate.day;
    this.getRepor(this.beginDate, this.endDate);
  }

  print(id: string): void {
    let printContents;
    let popupWin;
    // document.getElementsByClassName('print-hidden')[0].style.display = 'none';
    [].forEach.call(document.querySelectorAll('.print-hidden'), function (el) {
      el.style.display = 'none';
    });
    printContents = document.getElementById(id).innerHTML;
    popupWin = window.open('', '_blank', 'top=0,left=0,height=100%,width=auto');
    popupWin.document.open();
    popupWin.document.write(`
      <html>
        <head>
          <title>Print tab</title>
          <link rel="stylesheet" href="assets/css/bootstrap.min.css" />
          <link rel="stylesheet" href="assets/select2/dist/css/select2.min.css" />
          <!-- text fonts -->
          <!-- <link rel="stylesheet" href="assets/css/fonts.googleapis.com.css" /> -->
          <!-- ace styles -->
          <link rel="stylesheet" href="assets/css/ace.min.css" class="ace-main-stylesheet" id="main-ace-style" />
          <link rel="stylesheet" href="assets/css/ace-skins.min.css" />
          <link rel="stylesheet" href="assets/css/ace-rtl.min.css" />
          <style>
            .headercenter th {
                text-align: center;
                vertical-align: middle;
            }
          </style>
        </head>
        <body onload="window.print();window.close()">${printContents}</body>
      </html>`
    );
    popupWin.document.close();
    // document.getElementById('print-hidden').style.display = 'table-row';
    [].forEach.call(document.querySelectorAll('.print-hidden'), function (el) {
      el.style.display = 'table-row';
    });
  }

}
