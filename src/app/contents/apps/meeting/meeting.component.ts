import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import thLocale from '@fullcalendar/core/locales/th';
import { Router } from '@angular/router';
import { MainService } from 'src/app/services';
import * as moment from 'moment';
import Swal from 'sweetalert2';
declare const $: any;

@Component({
  selector: 'app-meeting',
  templateUrl: './meeting.component.html',
  styleUrls: ['./meeting.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MeetingComponent implements OnInit {

  public loading: boolean = true;
  public meeting = new Meeting();
  public decode: any;
  public room: any;
  public typeMeeting: any;
  public disabled: boolean;
  public roomId: any;
  public mm: string;

  public errTopic: boolean = false;
  public errAmount: boolean = false;

  public locales = [thLocale];
  public options: any;
  public events: any = [];

  constructor(
    @Inject('DEFAULTPATH') private defaultPath: string,
    public router: Router,
    public main: MainService
  ) {
    this.main.jwtDecode.then((decode: any) => {
      this.decode = decode;
      this.options = {
        editable: false,
        selectable: (!this.decode) ? true : (this.decode.hospcode == '00024') ? true : false,
        eventLimit: false,
        timeZone: 'UTC',
        header: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek'
        },
        eventTimeFormat: {
          hour: 'numeric',
          minute: '2-digit',
          meridiem: false
        },
        firstDay: 0,
        defaultView: 'dayGridMonth',
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin]
      };
    });
  }

  ngOnInit() {
    this.getRoom();
    this.getType();
  }

  public get authGuard3() {
    return this.main.authGuard3;
  }

  getRoom(id?: string) {
    this.main.get('meetingget/room').then((res: any) => {
      this.room = (res.ok) ? res.data : null;
      this.meeting.room_id = id || res.data[0].id;
      this.roomId = this.roomId || res.data[0].id;
    });
  }

  getType(id?: string) {
    this.main.get('meetingget/type').then((res: any) => {
      this.typeMeeting = (res.ok) ? res.data : null;
      this.meeting.type_meeting = id || res.data[0].id;
    });
  }

  onTopic(str) {
    return this.errTopic = (!str) ? true : false;
  }

  onAmount(str) {
    return this.errAmount = (!str) ? true : false;
  }

  onError() {
    const arrError = [];
    arrError.push(this.onTopic(this.meeting.topic));
    arrError.push(this.onAmount(this.meeting.amount));
    return this.main.in_array(true, arrError);
  }

  onSubmit() {
    if (!this.onError()) {
      let start = new Date(this.meeting.start_date);
      let end = new Date(this.meeting.end_date);
      this.meeting.start_date = start.getFullYear() + '-' + (start.getMonth() + 1) + '-' + start.getDate() + ' ' + this.meeting.start_time;
      this.meeting.end_date = end.getFullYear() + '-' + (end.getMonth() + 1) + '-' + end.getDate() + ' ' + this.meeting.end_time;
      this.meeting.cid = this.decode.cid;
      this.meeting.workgroup = (this.decode.workgroup_sub) ? this.decode.workgroup_sub_name : this.decode.workgroup_name;
      if (this.meeting.start_date < this.meeting.end_date) {
        this.main.post('meeting', this.meeting).then((res: any) => {
          if (res.ok) {
            Swal.fire({
              position: 'top-end',
              title: 'ยินดีด้วย !',
              text: 'คุณบันทึกข้อมูลสำเร็จแล้ว.',
              icon: 'success',
              showConfirmButton: false,
              timer: 1500,
              allowOutsideClick: false
            }).then(() => {
              this.getMeeting(this.startDate, this.endDate);
              $('#modal-new-meeting').modal('hide');
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'เกิดข้อผิดพลาด !',
              text: res.err,
              allowOutsideClick: false
            });
          }
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด !',
          text: 'คุณเลือกช่วงเวลาไม่ถูกต้อง กรุณาตรวจสอบ.',
          allowOutsideClick: false
        });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด !',
        text: 'คุณกรอกข้อมูลไม่ถูกต้อง หรือยังไม่สมบูรณ์ กรุณาตรวจสอบ.',
        allowOutsideClick: false
      });
    }
  }

  select(evt) {
    if (this.decode) {
      this.disabled = false;
      this.meeting = new Meeting();
      this.getRoom();
      this.getType();
      this.errTopic = false;
      this.errAmount = false;
      let endDate = new Date(evt.endStr);
      this.meeting.start_date = new Date(evt.startStr);
      this.meeting.end_date = endDate.setDate((endDate.getDate() - 1));
      $('#modal-new-meeting').modal({ backdrop: 'static', keyboard: false });
    } else {
      Swal.fire({
        title: 'กรุณาเข้าสู่ระบบก่อน !',
        text: 'เพื่อทำการจองห้องประชุม',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'เข้าสู่ระบบ',
        cancelButtonText: 'ยกเลิก',
        reverseButtons: true,
        allowOutsideClick: false
      }).then((result) => {
        if (result.value) {
          sessionStorage.setItem(this.defaultPath, '/meeting');
          this.router.navigate(['/signin']);
        }
      });
    }
  }

  eventClick(id) {
    this.loading = true;
    this.main.get('meetingget/all/' + id).then((res: any) => {
      this.disabled = true;
      this.meeting = res.data[0];
      this.getRoom(this.meeting.room_id);
      this.getType(this.meeting.type_meeting);
      this.errTopic = false;
      this.errAmount = false;
      $('#modal-new-meeting').modal({ backdrop: 'static', keyboard: false });
      this.loading = false;
    });
  }

  public startDate: any;
  public endDate: any;
  datesRender(evt) {
    let d = new Date(evt.view.currentStart);
    this.mm = ('00' + (d.getMonth() + 1)).substr(-2);
    this.startDate = evt.view.activeStart;
    this.endDate = evt.view.activeEnd;
    this.getMeeting(this.startDate, this.endDate);
  }

  eventRender(info: any) {
    for (let i = 0; i < this.events.length; i++) {
      if (this.events[i].id == info.event.id) {
        $(info.el).popover({
          html: true,
          title: `<span style='color:${this.events[i].color};'>${this.events[i].room}</span>`,
          content: `<div class='row'>
                      <div class='col-xs-12'>หัวข้อ: ${this.events[i].title} </div>
                      <div class='col-xs-12'>ประเภท: ${this.events[i].type_meeting} </div>
                      <div class='col-xs-12'>โดย: ${this.events[i].workgroup}</div>
                      <div class='col-xs-12'>ผู้จอง: ${this.events[i].pname}${this.events[i].fname} ${this.events[i].lname}</div>
                      <div class='col-xs-12'>ช่วงเวลา: ${moment.utc(info.event.start).format('HH:mm')} - ${moment.utc(info.event.end).format('HH:mm')} น. </div>
                    </div>`,
          trigger: 'hover',
          placement: 'top',
          container: 'body'
        });
      }
    }

  }

  public meetingAll: any;
  getMeeting(start_date, end_date) {
    this.main.post('meetingget/all', { start_date, end_date }).then((res: any) => {
      this.loading = false;
      this.events = res.data;
      this.meetingAll = this.filter(res.datas, this.mm);
    });
  }

  filter(item: any, mm: string) {
    let data = [];
    for (let i = 0; i < item.length; i++) {
      if (item[i].mm == mm) {
        data.push(item[i]);
      }
    }
    return data;
  }

  onDel(meet: any) {
    Swal.fire({
      text: `คุณต้องการที่จะลบการประชุมหัวข้อ ${meet.topic} ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ใช่',
      cancelButtonText: 'ไม่ใช่',
      reverseButtons: true,
      allowOutsideClick: false
    }).then((result) => {
      if (result.value) {
        this.main.post('meeting/del', { id: meet.id }).then((res: any) => {
          this.getMeeting(this.startDate, this.endDate);
          $('#modal-new-meeting').modal('hide');
        });
      }
    });
  }

  print(id: string): void {
    let printContents;
    let popupWin;
    document.getElementById('header-room').style.display = '';
    let hidden: any = document.getElementsByClassName('list-room-hidden');
    for (let i = 0; i < hidden.length; i++) {
      hidden[i].style.display = 'none';
    }
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
    document.getElementById('header-room').style.display = 'none';
    for (let i = 0; i < hidden.length; i++) {
      hidden[i].style.display = '';
    }
  }

}

export class Meeting {
  room_id: string;
  topic: string;
  workgroup: string;
  start_date: any;
  end_date: any;
  start_time: any = '08:00:00';
  end_time: any = '16:30:00';
  amount: number;
  type_room: string = 'U';
  type_meeting: string;
  other: string;
  url: string;
  cid: string;
  pname: string;
  fname: string;
  lname: string;
}
