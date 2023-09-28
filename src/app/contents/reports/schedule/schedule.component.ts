import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit {

  public arrYear: Array<any> = [];
  public arrMonth: Array<any> = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  public year: any;
  public month: any;
  public sex: any = 1;
  public monthToDay: any;
  public yearToDay: any;

  public loading: boolean = true;
  public schedule: any;

  constructor(
    private main: MainService
  ) { }

  ngOnInit() {
    const d = new Date();
    this.monthToDay = d.getMonth();
    this.yearToDay = d.getFullYear();
    this.month = d.getMonth();
    this.year = d.getFullYear();
    for (let y = 2021; y <= (this.year + 1); y++) {
      this.arrYear.push(y);
    }
    this.getSchedule();
  }

  getSchedule() {
    this.loading = true;
    this.main.get(`schedule/${+this.month + 1}/${+this.year}/${+this.sex}`).then((res: any) => {
      // console.log(res);
      this.loading = false;
      this.schedule = res;
    }).catch((err: any) => {
      this.loading = false;
      console.log(err)
    });
  }

  thaiNumber(num) {
    var array = { '1': '๑', '2': '๒', '3': '๓', '4': '๔', '5': '๕', '6': '๖', '7': '๗', '8': '๘', '9': '๙', '0': '๐' };
    var str = num.toString();
    for (var val in array) {
      str = str.split(val).join(array[val]);
    }
    return str;
  }

  print(id: string): void {
    let printContents;
    let popupWin;
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
            table {
              font-size: 14px;
            }
            p.title-print {
              font-size: 18px;
            }
          </style>
        </head>
        <body onload="window.print();window.close()">${this.thaiNumber(printContents)}</body>
      </html>`
    );
    popupWin.document.close();
  }

}
