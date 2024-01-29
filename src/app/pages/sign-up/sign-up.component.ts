import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core';
import { Location } from '@angular/common';
import { IMyDpOptions } from 'mydatepicker-thai';
import { MainService, CryptoService } from 'src/app/services';

import Swal from 'sweetalert2';
declare const $: any;

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {

  @Input() public editProfile: any;
  @Input() public profile: any;
  @Input() public signUpSuccess: boolean;
  @Input() public dateNow: any;

  public signUp = new SignUp();
  public err = new ErrSignUp();
  public txt = new TxtSignUp();

  public myDatePickerOptions: IMyDpOptions;
  public hospital: any;
  public workgroup: any;
  public workgroupsub: any;
  public prename: any;
  public position: any;
  public type: any;
  public level: any;

  public birth: any;
  public dateStartWorking: any;
  public password: string;
  public repassword: string;
  public imgURL: any;
  public image: any;
  public hasImage: boolean = true;

  constructor(
    @Inject('HOSPITALNAME') public hospitalName: string,
    public location: Location,
    public main: MainService,
    public crypto: CryptoService
  ) {
  }

  ngAfterViewInit(): void {
    $('#hospcode').on('click', (event) => {
      this.signUp.hospcode = event.target.value;
      this.onHospcode(this.signUp.hospcode, null);
    });
    $('#pname').on('click', (event) => {
      this.signUp.pname = event.target.value;
      this.onPname(this.signUp.pname);
    });
    $('#position').on('click', (event) => {
      this.signUp.position = event.target.value;
      this.onPosition(this.signUp.position);
    });
    $('#type').on('click', (event) => {
      this.signUp.type = event.target.value;
      this.onPositionType(this.signUp.type);
    });
    $('#hospcode').on('change', (event) => {
      this.signUp.hospcode = event.target.value;
      this.onHospcode(this.signUp.hospcode, null);
    });
    $('#pname').on('change', (event) => {
      this.signUp.pname = event.target.value;
      this.onPname(this.signUp.pname);
    });
    $('#position').on('change', (event) => {
      this.signUp.position = event.target.value;
      this.onPosition(this.signUp.position);
    });
    $('#type').on('change', (event) => {
      this.signUp.type = event.target.value;
      this.onPositionType(this.signUp.type);
    });
    $('#username').focus();
    this.getHospital();
    this.getPrename();
    this.getPosition();
    this.getPositionType();
    this.getPositionLevel();
    setTimeout(() => {
      if (this.editProfile) {
        this.signUp = this.editProfile;
        this.getWorkgroup(this.editProfile.hospcode, this.editProfile.workgroup);
        const d = new Date(this.signUp.birth);
        this.birth = { date: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() } };
        const dw = new Date(this.signUp.date_startworking);
        this.dateStartWorking = (this.signUp.date_startworking) ? { date: { year: dw.getFullYear(), month: dw.getMonth() + 1, day: dw.getDate() } } : null;
        this.imgURL = this.useImg(this.signUp.sex);
      }
    }, 1000);
    setTimeout(() => {
      $('.select2').select2();
      (this.editProfile) ? $('#password').focus() : null;
    }, 1500);
  }

  ngOnInit() {
    // $(() => { $('.select2').select2() });
    const d = new Date();
    this.myDatePickerOptions = {
      dateFormat: 'dd mmm yyyy',
      satHighlight: true,
      editableDateField: false,
      openSelectorOnInputClick: true,
      showClearDateBtn: false,
      disableSince: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }
    };
    this.imgURL = this.useImg(this.signUp.sex);
  }

  getHospital() {
    this.main.get('getcode/hospital').then((res: any) => {
      this.hospital = (!res.ok) || res.data;
    });
  }

  getWorkgroup(hospcode: string, workgroup: string) {
    if (hospcode) {
      this.main.get('getcode/workgroup/' + hospcode).then((res: any) => {
        this.workgroup = (res.ok) ? res.data : res.ok;
        this.signUp.workgroup = (!workgroup && res.ok) ?
          (this.profile && this.profile.hospcode == hospcode) ?
            this.profile.workgroup : this.workgroup[0].workgroup_code :
          (res.ok) ? workgroup : null;
        this.getWorkgroupSub(this.signUp.workgroup, this.signUp.workgroup_sub);
      });
    }
  }

  getWorkgroupSub(workgroup: string, workgroupsub: string) {
    this.main.get('getcode/workgroupsub/' + workgroup).then((res: any) => {
      this.workgroupsub = (res.ok) ? res.data : res.ok;
      this.signUp.workgroup_sub = (!workgroupsub && res.ok) ?
        (this.profile && this.profile.workgroup == workgroup) ?
          this.profile.workgroup_sub : this.workgroupsub[0].workgroup_sub_code :
        (res.ok) ? workgroupsub : null;
    });
  }

  getPrename() {
    this.main.get('getcode/prename').then((res: any) => {
      this.prename = (!res.ok) || res.data;
    });
  }

  getPosition() {
    this.main.get('getcode/position').then((res: any) => {
      this.position = (!res.ok) || res.data;
    });
  }

  getPositionType() {
    this.main.get('getcode/positiontype').then((res: any) => {
      this.type = (!res.ok) || res.data;
    });
  }

  getPositionLevel() {
    this.main.get('getcode/positionlevel').then((res: any) => {
      this.level = (!res.ok) || res.data;
    });
  }

  onUsername(username: any) {
    if (username && !(/([^a-zA-Z0-9])/).test(username)) {
      if (username.toString().length >= 3 && !(username * 1 > 0) && username != 0) {
        this.main.get('signup/username/' + username).then((res: any) => {
          this.err.username = !res.ok;
          this.txt.username = '*บัญชีผู้ใช้นี้ มีการใช้งานในระบบแล้ว!'
        });
      } else {
        this.err.username = true;
        this.txt.username = this.txtNull(username, '*บัญชีผู้ใช้ต้องมี a-zA-Z และมีความยาวอย่างน้อย 3 ตัวอักษรขึ้นไป!');
      }
    } else {
      this.err.username = true;
      this.txt.username = this.txtNull(username, '*ป้อนได้เฉพาะ a-z,A-Z และ 0-9 เท่านั้น!');
    }
    return this.err.username;
  }

  onPassword(password: any) {
    if (password && (/([a-zA-Z0-9!%&@#$^*?_~])/).test(password)) {
      if (password != this.signUp.username) {
        this.txt.password = (password.toString().length < 8) ? 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษรขึ้นไป' : undefined;
        this.err.password = (password.toString().length < 8);
        if (this.err.password) {
          this.repassword = '';
          this.err.repassword = false;
        }
      } else {
        this.err.password = true;
        this.txt.password = this.txtNull(password, '*รหัสผ่านควรจะแตกต่างจาก ชื่อบัญชีผู้ใช้!');
      }
    } else {
      this.err.password = (!password && this.editProfile) ? false : true;
      this.txt.password = this.txtNull(password, '*รหัสผ่านป้อนได้เฉพาะ a-z,A-Z,0-9 และเครื่องหมายวรรคตอนทั่วไปเท่านั้น กรุณาตรวจสอบภาษาของแป้นพิมพ์');
    }
    return this.err.password;
  }

  onRePassword(str: any) {
    return this.err.repassword = (str != this.password) ? true : false;
  }

  onCid(cid: any) {
    if (cid && this.checkCID(cid.toString())) {
      this.main.get('signup/check/' + cid).then((res: any) => {
        if (res.ok) {
          this.signUp.fname = res.data.firstname;
          this.signUp.lname = res.data.lastname;
          this.main.get('signup/cid/' + cid).then((res: any) => {
            this.err.cid = !res.ok;
            this.txt.cid = res.txt
          });
        } else {
          this.err.cid = !res.ok;
          this.txt.cid = res.txt
        }
      });
    } else {
      this.err.cid = true;
      this.txt.cid = this.txtNull(cid, '*เลขประจำตัวประชาชนไม่ถูกต้อง!');
    }
    return this.err.cid;
  }

  onHospcode(str: any, workgroup: string) {
    this.getWorkgroup(str, workgroup);
    return this.err.hospcode = (!str) ? true : false;
  }

  onPname(str: any) {
    return this.err.pname = (!str) ? true : false;
  }

  onFname(str: any) {
    return this.err.fname = (!str) ? true : false;
  }

  onLname(str: any) {
    return this.err.lname = (!str) ? true : false;
  }

  onBirth(str: any) {
    return this.err.birth = (str && str.date) ? false : true;
  }

  onSex(str: any) {
    if (!this.image) {
      this.imgURL = this.useImg(str);
    }
  }

  onPosition(str: any) {
    return this.err.position = (!str) ? true : false;
  }

  onPositionType(str: any) {
    return this.err.type = (!str) ? true : false;
  }

  onEmail(str: any) {
    return this.err.email = (!str || !(/^([a-zA-Z0-9\_\.\-]+)@([a-zA-Z0-9]+)\.([a-zA-Z0-9\.]{2,5})$/).test(str)) ? true : false;
  }

  onTel(str: any) {
    return this.err.tel = (!str || (/([^0-9])/).test(str) || (str && str.length != 10)) ? true : false;
  }

  txtNull(str: string, txt?: string) {
    return (!str) ? '*จำเป็นต้องมีข้อมูล!' : txt;
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

  useImg(str: string) {
    return this.signUp.image || './assets/images/profile-avatar-user-' + str + '.png';
  }

  fileProgress(files: any) {
    this.image = null;
    this.imgURL = this.useImg(this.signUp.sex);
    if (files.length > 0) {
      const mimeType = files[0].type;
      if (mimeType.match(/image\/*/) == null) {
        return;
      } else {
        this.image = files[0];
        const reader = new FileReader();
        reader.readAsDataURL(files[0]);
        reader.onload = (_event) => {
          this.imgURL = reader.result;
        }
      }
    }
  }

  onError() {
    const arrError = [];
    arrError.push(this.onUsername(this.signUp.username));
    arrError.push((!this.editProfile || (this.password && this.onPassword(this.password))) ? this.onPassword(this.password) : false);
    arrError.push(this.onRePassword(this.repassword));
    arrError.push((!this.editProfile) ? this.onCid(this.signUp.cid) : false);
    arrError.push(this.onHospcode(this.signUp.hospcode, this.signUp.workgroup));
    arrError.push(this.onPname(this.signUp.pname));
    arrError.push(this.onFname(this.signUp.fname));
    arrError.push(this.onLname(this.signUp.lname));
    arrError.push(this.onBirth(this.birth));
    arrError.push(this.onPosition(this.signUp.position));
    arrError.push(this.onPositionType(this.signUp.type));
    arrError.push(this.onEmail(this.signUp.email));
    arrError.push(this.onTel(this.signUp.tel));
    return this.main.in_array(true, arrError);
  }

  onReset() {
    if (!this.editProfile) {
      $('#username').focus();
      this.signUp = new SignUp();
      this.err = new ErrSignUp();
      this.signUp.sex = '1';
      this.signUp.hospcode = '';
      this.signUp.pname = '';
      this.signUp.position = '';
      this.birth = null;
      this.password = null;
      this.repassword = null;
    } else {
      this.location.back();
    }
    this.image = null;
    this.imgURL = this.useImg(this.signUp.sex);
  }

  @Output() private onSignUp: EventEmitter<any> = new EventEmitter();
  onSubmit() {
    if (!this.onError()) {
      this.signUp.password = (this.password) ? this.crypto.md5(this.password) : undefined;
      this.signUp.birth = this.birth.date.year + '/' + this.birth.date.month + '/' + this.birth.date.day;
      this.onSignUp.emit({ signUp: this.signUp, image: this.image });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด !',
        text: 'คุณกรอกข้อมูลไม่ถูกต้อง หรือยังไม่สมบูรณ์ กรุณาตรวจสอบ.',
        allowOutsideClick: false
      }).then((result) => {
        if (result) {
          $('.has-error > .form-control').first().focus();
          $('.has-error > span > .form-control').first().focus();
        }
      });
    }
  }

}

export class SignUp {
  username: string;
  password: string;
  image: string;
  cid: string;
  hospcode: string = '10702';
  pname: string = '';
  fname: string;
  lname: string;
  birth: any;
  sex: string = '1';
  position: string = '';
  type: string = '';
  level: string = '000';
  manager: string = '00';
  email: string;
  tel: string;
  linetoken: string;
  workgroup: string;
  workgroup_sub: string;
  date_startworking: any;
}

export class ErrSignUp {
  username: boolean = false;
  password: boolean = false;
  repassword: boolean = false;
  cid: boolean = false;
  hospcode: boolean = false;
  pname: boolean = false;
  fname: boolean = false;
  lname: boolean = false;
  birth: boolean = false;
  position: boolean = false;
  type: boolean = false;
  email: boolean = false;
  tel: boolean = false;
}

export class TxtSignUp {
  username: string;
  password: string;
  repassword: string;
  cid: string;
  hospcode: string;
  pname: string;
  fname: string;
  lname: string;
  position: string;
  email: string;
  tel: string;
}
