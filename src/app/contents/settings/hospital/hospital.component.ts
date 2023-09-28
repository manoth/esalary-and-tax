import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services';
import { IMyDpOptions } from 'mydatepicker-thai';

import Swal from 'sweetalert2';
declare const $: any;

@Component({
  selector: 'app-hospital',
  templateUrl: './hospital.component.html',
  styleUrls: ['./hospital.component.scss']
})
export class HospitalComponent implements OnInit {

  public myDateFromOptions: IMyDpOptions;
  public myDateOutOptions: IMyDpOptions;

  public loading: boolean = true;
  public loadhospital: boolean = true;

  public editHospital: boolean = false;
  public status: number = 0;

  public profile = new Profile();
  public editProfile: any;
  public hospitalAll: any;
  public hospital: any;
  public hospitalError: boolean = false;
  public workgroup: any;
  public workgroupsub: any;
  public dateOut: any;
  public dateFrom: any;
  public dateFromError: boolean = false;

  public decode: any;

  constructor(
    private main: MainService
  ) { }

  ngAfterViewInit(): void {
    $('.select2').select2();
    $('#hospcode').on('change', (event) => {
      this.profile.hospcode = event.target.value;
      this.getWorkgroup(this.profile.hospcode, null);
    });
    $('#workgroup').on('change', (event) => {
      this.profile.workgroup = event.target.value;
      this.getWorkgroupSub(this.profile.workgroup, '');
    });
    $('#workgroupsub').on('change', (event) => {
      this.profile.workgroup_sub = event.target.value;
    });
  }

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
    this.myDateOutOptions = {
      dateFormat: 'dd mmm yyyy',
      satHighlight: true,
      editableDateField: false,
      openSelectorOnInputClick: true,
      showClearDateBtn: true
    }
    this.getHospital();
    this.getHospitalProfile();
  }

  getHospitalProfile() {
    this.main.get('profile/hospital').then((res: any) => {
      // console.log(res);
      this.main.jwtDecode.then((decode: any) => {
        this.decode = decode;
        this.hospitalAll = (!res.ok) || res.data;
        this.loading = false;
      });
    });
  }

  getHospital() {
    this.main.get('getcode/hospital').then((res: any) => {
      this.hospital = (!res.ok) || res.data;
    });
  }

  getWorkgroup(hospcode: string, workgroup: string) {
    this.loadhospital = true;
    if (hospcode) {
      this.hospitalError = false;
      this.main.get('getcode/workgroup/' + hospcode).then((res: any) => {
        this.workgroup = (res.ok) ? res.data : res.ok;
        this.profile.workgroup = (!workgroup && res.ok) ?
          (this.editProfile && this.editProfile.hospcode == hospcode) ?
            this.editProfile.workgroup : this.workgroup[0].workgroup_code :
          (res.ok) ? workgroup : null;
        this.getWorkgroupSub(this.profile.workgroup, this.profile.workgroup_sub);
      });
    }
  }

  getWorkgroupSub(workgroup: string, workgroupsub: string) {
    this.loadhospital = true;
    this.main.get('getcode/workgroupsub/' + workgroup).then((res: any) => {
      this.workgroupsub = (res.ok) ? res.data : res.ok;
      this.profile.workgroup_sub = (!workgroupsub && res.ok) ?
        (this.editProfile && this.editProfile.workgroup == workgroup) ?
          this.editProfile.workgroup_sub : this.workgroupsub[0].workgroup_sub_code :
        (res.ok) ? workgroupsub : null;
      // $('.select2').select2();
      // this.ngAfterViewInit();
      this.loadhospital = false;
    });
  }

  onHospital(hospital: string) {
    return this.hospitalError = (hospital) ? false : true;
  }

  onChangDate(e: any) {
    if (e) {
      this.myDateOutOptions = {
        dateFormat: 'dd mmm yyyy',
        satHighlight: true,
        editableDateField: false,
        openSelectorOnInputClick: true,
        showClearDateBtn: true,
        disableUntil: e.date
      };
    }
    return this.dateFromError = (e && e.date) ? false : true;
  }

  onAdd() {
    this.status = 1;
    this.editHospital = true;
    this.profile = new Profile();
    this.getWorkgroup('0', null);
    this.dateFrom = null;
    this.dateOut = null;
    this.hospitalError = false;
    this.dateFromError = false;
    this.onSelect2();
  }

  onCancel() {
    $('#modal-add-hospital').modal('hide');
    this.status = 0;
    this.editHospital = false;
    this.profile = new Profile();
    this.hospitalError = false;
    this.dateFromError = false;
  }

  onEdit(hospital: any) {
    this.status = 2;
    this.hospitalError = false;
    this.dateFromError = false;
    this.editHospital = true;
    let d = new Date(hospital.date_from);
    this.profile = hospital;
    this.dateFrom = (hospital.date_from && hospital.date_from != '0000-00-00') ? { date: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() } } : null;
    this.dateOut = (hospital.date_to && hospital.date_from != '0000-00-00') ? { date: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() } } : null;
    this.editProfile = { cid: hospital.cid, hospcode: hospital.hospcode, workgroup: hospital.workgroup, workgroupsub: hospital.workgroup_sub }
    this.getWorkgroup(hospital.hospcode, hospital.workgroup);
    this.onChangDate(this.dateFrom);
    this.onSelect2();
  }

  onCheck() {
    let arr = [];
    arr.push(this.onChangDate(this.dateFrom));
    arr.push(this.onHospital(this.profile.hospcode));
    return this.main.in_array(true, arr);
  }

  onSubmit() {
    if (!this.onCheck()) {
      this.profile.date_from = this.dateFrom.date.year + '/' + this.dateFrom.date.month + '/' + this.dateFrom.date.day;
      this.profile.date_to = (this.dateOut) ? this.dateOut.date.year + '/' + this.dateOut.date.month + '/' + this.dateOut.date.day : null;
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
          this.main.post('profile/hospital', this.profile).then((res: any) => {
            Swal.fire({
              position: 'top-end',
              title: 'ยินดีด้วย !',
              text: 'คุณบันทึกข้อมูลสำเร็จแล้ว.',
              icon: 'success',
              showConfirmButton: false,
              timer: 1500,
              allowOutsideClick: false
            }).then(() => {
              this.getHospitalProfile();
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

  onDel(id: string) {
    Swal.fire({
      title: 'คุณต้องการที่จะลบข้อมูลสถานที่ปฏิบัติงานนี้ ใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่',
      cancelButtonText: 'ไม่ใช่',
      reverseButtons: true,
      allowOutsideClick: false
    }).then((result) => {
      if (result.value) {
        this.main.delete(`profile/hospital/id/${id}`, {}).then((res: any) => {
          if (res.ok) {
            Swal.fire({
              position: 'top-end',
              title: 'ยินดีด้วย !',
              text: 'คุณลบข้อมูลสถานที่ปฏิบัติงานสำเร็จแล้ว.',
              icon: 'success',
              showConfirmButton: false,
              timer: 1500,
              allowOutsideClick: false
            }).then(() => {
              this.getHospitalProfile();
            });
          }
        });
      }
    });
  }

}

export class Profile {
  cid: string;
  hospcode: string = '';
  workgroup: string;
  workgroup_sub: string;
  date_from: any;
  date_to: any;
}
