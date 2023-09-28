import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MainService } from 'src/app/services';

import Swal from 'sweetalert2';

declare const $: any;
declare const ace: any;

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss']
})
export class ContentComponent implements OnInit {

  public decode: any;
  public loading: boolean = false;
  public user: any;

  public profile: any;
  public edit = new Edit();

  ngAfterViewInit(): void {
    // $(document).ready(function () {
    //   try { ace.settings.loadState('main-container') } catch (e) { }
    // });
  }

  constructor(
    private router: Router,
    private main: MainService
  ) { }

  ngOnInit() {
    document.body.className = 'skin-2';
    this.main.jwtDecode.then((decode: any) => {
      // console.log(decode);
      this.decode = decode;
      if (decode && decode.cid === decode.username) {
        this.checkUsername();
      }
    });
    this.main.onJwtDecode.subscribe((decode: any) => {
      this.decode = decode;
    });
    this.confirmHospital();
  }

  confirmHospital() {
    this.main.get('confirm/hospital/1').then((res: any) => {
      this.loading = false;
      if (res.ok) {
        this.user = res.data;
        $('#modal-confirm').modal({ backdrop: 'static', keyboard: false });
      } else {
        $('#modal-confirm').modal('hide');
      }
    });
  }

  onConfirm(user: any, id: number) {
    Swal.fire({
      title: (id == 0) ? 'ปฏิเสธข้อมูลการย้ายสถานที่ปฏิบัติงาน' : 'ยืนยันข้อมูลการย้ายสถานที่ปฏิบัติงาน',
      text: `ของ ${user.pname}${user.fname} ${user.lname} ใช่หรือไม่?`,
      icon: (id == 0) ? 'warning' : 'info',
      showCancelButton: true,
      confirmButtonText: 'ใช่',
      cancelButtonText: 'ไม่ใช่',
      reverseButtons: true
    }).then((result) => {
      if (result.value) {
        this.loading = true;
        this.confirm({ user, id });
      }
    });
  }

  confirm(data: any) {
    this.main.post('confirm/hospital', data).then((res: any) => {
      this.confirmHospital();
    });
  }

  checkUsername() {
    Swal.fire({
      title: 'คำเตือน !',
      text: `ชื่อบัญชีผู้ใช้ของคุณตรงกับหมายเลขประจำตัวประชาชน ซึ่งไม่ปลอดภัยต่อการใช้งาน คุณต้องการเปลี่ยนชื่อบัญชีผู้งานใหม่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ต้องการ',
      cancelButtonText: 'ไม่ต้องการ',
      reverseButtons: true
    }).then((result) => {
      if (result.value) {
        this.router.navigate(['/profile']);
      }
    });
  }

  editEmail(evt: any) {
    $('#modal-edit-email').modal({ backdrop: 'static', keyboard: false });
    this.edit = new Edit();
    this.cidError = false;
    this.emailError = false;
    this.profile = false;
  }

  public cidError: boolean = false;
  onCid(cid: string) {
    if (cid && this.checkCID(cid)) {
      this.main.get('profile/editEmail/' + cid).then((res: any) => {
        this.profile = res.data;
        return this.cidError = !res.ok;
      });
    } else {
      this.profile = false;
      return this.cidError = true;
    }
  }

  public emailError: boolean = false;
  onEmail(str: any) {
    return this.emailError = (!str || !(/^([a-zA-Z0-9\_\.\-]+)@([a-zA-Z0-9]+)\.([a-zA-Z0-9\.]{2,5})$/).test(str)) ? true : false;
  }

  checkCID(cid: string) {
    if (cid.length == 13) {
      let sum = 0;
      for (let i = 0; i < 12; i++) { sum += parseFloat(cid.charAt(i)) * (13 - i); }
      return ((11 - sum % 11) % 10 != parseFloat(cid.charAt(12))) ? false : true;
    } else {
      return false;
    }
  }

  onEditEmail() {
    if (!this.onCid(this.edit.cid) && !this.onEmail(this.edit.email)) {
      this.main.post('profile/editEmail', this.edit).then((res: any) => {
        Swal.fire({
          position: 'top-end',
          title: 'ยินดีด้วย !',
          text: 'คุณบันทึกข้อมูลสำเร็จแล้ว.',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
          allowOutsideClick: false
        }).then(() => {
          $('#modal-edit-email').modal('hide');
        });
      });
    }
  }

}

export class Edit {
  cid: string;
  email: string;
}
