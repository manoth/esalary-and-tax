import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-hospital-confirm',
  templateUrl: './hospital-confirm.component.html',
  styleUrls: ['./hospital-confirm.component.scss']
})
export class HospitalConfirmComponent implements OnInit {

  public loading: boolean = true;
  public user: any;
  public decode: any;
  public path: string;

  constructor(
    private main: MainService
  ) { }

  ngOnInit() {
    this.main.jwtDecode.then((decode: any) => {
      this.decode = decode;
      this.getConfirmHospital();
    });
  }

  getConfirmHospital() {
    // console.log(this.decode);
    let url = (this.decode.workgroup === '114') ? 'confirm/hospitalAll' : 'confirm/hospital/2';
    this.main.get(url).then((res: any) => {
      this.loading = false;
      this.user = (res.ok) ? res.data : null;
    });
  }

  onConfirm(user: any, id: number) {
    Swal.fire({
      title: (id == 0) ? 'คุณต้องการลบข้อมูลการย้ายสถานที่ปฏิบัติงาน' : 'คุณต้องการยืนยันข้อมูลการย้ายสถานที่ปฏิบัติงาน',
      text: `ของ ${user.pname}${user.fname} ${user.lname} ใช่หรือไม่?`,
      icon: (id == 0) ? 'warning' : 'info',
      showCancelButton: true,
      confirmButtonText: 'ใช่',
      cancelButtonText: 'ไม่ใช่',
      reverseButtons: true
    }).then((result) => {
      if (result.value) {
        this.loading = true;
        if (id == 1) {
          this.confirm({ user, status: 'Y' });
        } else {
          this.del(user.id);
        }
      }
    });
  }

  confirm(data: any) {
    this.main.post('confirm/hospital', data).then((res: any) => {
      Swal.fire({
        position: 'top-end',
        title: 'ยินดีด้วย !',
        text: 'คุณยืนยันข้อมูลการย้ายสถานที่ปฏิบัติงานให้เพื่อนสำเร็จแล้ว.',
        icon: 'success',
        showConfirmButton: false,
        timer: 1500,
        allowOutsideClick: false
      });
      // this.ngOnInit();
      this.getConfirmHospital();
    });
  }

  del(id: string) {
    this.main.delete(`confirm/hospital/id/${id}`, {}).then((res: any) => {
      // this.ngOnInit();
      this.getConfirmHospital();
    });
  }

}
