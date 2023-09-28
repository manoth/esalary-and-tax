import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services';
import { IMyDpOptions } from 'mydatepicker-thai';

import Swal from 'sweetalert2';
declare const $: any;

@Component({
  selector: 'app-position',
  templateUrl: './position.component.html',
  styleUrls: ['./position.component.scss']
})
export class PositionComponent implements OnInit {

  public myDateFromOptions: IMyDpOptions;
  public loading: boolean = true;
  public loadposition: boolean = true;
  public editProfile: boolean = false;
  public status: number = 0;

  public profile = new Profile();

  public positionAll: any;
  public type: any;
  public typeError: boolean = false;
  public position: any;
  public positionError: boolean = false;
  public level: any;
  public manager: any;
  public dateFrom: any;
  public dateFromError: boolean = false;

  public decode: any;

  ngAfterViewInit(): void {
    $('.select2').select2();
    $('#type').on('change', (event) => {
      this.profile.type = event.target.value;
      this.onType(this.profile.type);
    });
    $('#position').on('change', (event) => {
      this.profile.position = event.target.value;
      this.onPosition(this.profile.position);
    });
    $('#level').on('change', (event) => {
      this.profile.level = event.target.value;
    });
    $('#manager').on('change', (event) => {
      this.profile.manager = event.target.value;
    });
  };

  constructor(
    private main: MainService
  ) { }

  ngOnInit() {
    const d = new Date();
    d.setDate((d.getDate() + 1));
    this.myDateFromOptions = {
      dateFormat: 'dd mmm yyyy',
      satHighlight: true,
      editableDateField: false,
      openSelectorOnInputClick: true,
      showClearDateBtn: false,
      disableSince: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }
    };
    this.getPositionProfile();
    this.getType();
    this.getPosition();
    this.getPositionLevel();
    this.getPositionManager();
  }

  getPositionProfile() {
    this.main.get('profile/position').then((res: any) => {
      this.main.jwtDecode.then((decode: any) => {
        this.decode = decode;
        this.positionAll = (!res.ok) || res.data;
        this.loading = false;
      });
    });
  }

  getType() {
    this.loadposition = true;
    this.main.get('getcode/positiontype').then((res: any) => {
      this.type = (!res.ok) || res.data;
      this.loadposition = false;
    });
  }

  getPosition() {
    this.main.get('getcode/position').then((res: any) => {
      this.position = (!res.ok) || res.data;
    });
  }

  getPositionLevel() {
    this.main.get('getcode/positionlevel').then((res: any) => {
      this.level = (!res.ok) || res.data;
    });
  }

  getPositionManager() {
    this.main.get('getcode/positionmanager').then((res: any) => {
      this.manager = (!res.ok) || res.data;
    });
  }

  onType(type: string) {
    this.onSelect2();
    return this.typeError = (type) ? false : true;
  }

  onPosition(position: string) {
    return this.positionError = (position) ? false : true;
  }

  onChangDate(e: any) {
    return this.dateFromError = (e && e.date) ? false : true;
  }

  onAdd() {
    this.status = 1;
    this.editProfile = true;
    this.profile = new Profile();
    this.dateFrom = null;
    this.typeError = false;
    this.positionError = false;
    this.dateFromError = false;
    this.onSelect2();
  }

  onCancel() {
    $('#modal-add-position').modal('hide');
    this.status = 0;
    this.editProfile = false;
  }

  onEdit(position: any) {
    this.status = 2;
    this.editProfile = true;
    this.dateFrom = null;
    this.typeError = false;
    this.positionError = false;
    this.dateFromError = false;
    let d = new Date(position.date_from);
    this.profile = position;
    this.dateFrom = (position.date_from) ? { date: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() } } : null;
    this.onChangDate(this.dateFrom);
    this.onSelect2();
  }

  onDel(id) {
    Swal.fire({
      title: 'คุณต้องการลบประวัติตำแหน่งงานนี้ ใช่ หรือ ไม่?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'ใช่',
      cancelButtonText: 'ไม่ใช่',
      reverseButtons: true,
      allowOutsideClick: false
    }).then((result) => {
      if (result.value) {
        this.loading = true;
        this.main.delete(`profile/position/id/${id}`, {}).then((res: any) => {
          Swal.fire({
            position: 'top-end',
            title: (res.ok) ? 'ยินดีด้วย !' : 'เกิดข้อผิดพลาด !',
            text: res.message,
            icon: (res.ok) ? 'success' : 'error',
            showConfirmButton: false,
            timer: 1500,
            allowOutsideClick: false
          }).then(() => {
            this.getPositionProfile();
            this.onCancel();
          });
        });
      }
    });
  }

  onCheck() {
    let arr = [];
    arr.push(this.onChangDate(this.dateFrom));
    arr.push(this.onPosition(this.profile.position));
    arr.push(this.onType(this.profile.type));
    return this.main.in_array(true, arr);
  }

  onSubmit() {
    if (!this.onCheck()) {
      this.profile.date_from = this.dateFrom.date.year + '-' + ('0' + this.dateFrom.date.month).substr(-2) + '-' + this.dateFrom.date.day;
      Swal.fire({
        title: 'คำเตือน !',
        text: (this.status == 1) ? 'การบันทึกครั้งนี้ จะไม่สามารถลบข้อมูลนี้ได้อีก คุณมั่นใจที่จะบันทึกใช่หรือไม่?' : 'คุณมันใจหรือไม่ ที่จะบันทึกการแก้ไขข้อมูลในครั้งนี้?',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'ใช่',
        cancelButtonText: 'ไม่ใช่',
        reverseButtons: true,
        allowOutsideClick: false
      }).then((result) => {
        if (result.value) {
          this.loading = true;
          // console.log(this.profile);
          this.main.post('profile/position', this.profile).then((res: any) => {
            Swal.fire({
              position: 'top-end',
              title: 'ยินดีด้วย !',
              text: 'คุณบันทึกข้อมูลสำเร็จแล้ว.',
              icon: 'success',
              showConfirmButton: false,
              timer: 1500,
              allowOutsideClick: false
            }).then(() => {
              this.getPositionProfile();
              this.onCancel();
            });
          });
        }
      });
    }
  }

  onSelect2() {
    setTimeout(() => {
      this.ngAfterViewInit();
    }, 500);
  }

}

export class Profile {
  cid: string;
  type: string = '';
  position: string = '';
  level: string = '000';
  manager: string = '00';
  date_from: any;
  date_to: any;
}
