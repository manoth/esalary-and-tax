import { Component, Inject, OnInit } from '@angular/core';
import { CryptoService, MainService } from 'src/app/services';
import { IMyDpOptions } from 'mydatepicker-thai';
import Swal from 'sweetalert2';
import { ActivatedRoute, Params, Router } from '@angular/router';
declare const $: any;

@Component({
  selector: 'app-go-to-government',
  templateUrl: './go-to-government.component.html',
  styleUrls: ['./go-to-government.component.scss']
})
export class GoToGovernmentComponent implements OnInit {

  public adminPage: boolean = false;
  public systemType: string = '03';
  public adminSystemType: Array<string>;

  public loading: boolean = true;
  public uploading: boolean = false;
  public decoded: any;
  public accessToken: string = '';
  public bYear: number;
  public gov = new Goverment();
  public page: string = 'all';

  public listGov: any[] = [];

  public toDay = new Date();
  public myDateOptions1: IMyDpOptions;
  public myDateOptions2: IMyDpOptions;
  public startDate: any;
  public endDate: any;

  public users: any[] = [];
  public govType: any[] = [];
  public govVehicle: any[] = [];
  public govExpenses: any[] = [];
  public bYearArr: any[] = [];

  public bookNo: string;
  public expensesArr: any[] = [];
  private userAlong: any[] = [];

  public hasMyfile: boolean = false;
  public myfile: any[] = [];
  public imgUrl: any;

  ngAfterViewInit(): void {
    $('#user-along').select2();
    $('#user-along').on('change', () => {
      this.userAlong = $('#user-along').val();
    });
  }

  constructor(
    @Inject('ADMINTOKEN_NAME') private adminTokenName: string,
    public router: Router,
    public route: ActivatedRoute,
    private main: MainService,
    private crypto: CryptoService
  ) {
    let admin = this.main.jwtDecodeAdmin();
    this.adminSystemType = (admin) ? admin.systemTypeAll : [];
    this.adminPage = (admin && this.main.in_array(this.systemType, this.adminSystemType)) ? true : false;

    this.route.params.subscribe((params: Params) => {
      if (this.main.in_array(params.page, ['all', 'my', 'pending', 'approve'])) {
        if (!this.adminPage && this.main.in_array(params.page, ['pending', 'approve'])) {
          this.router.navigate(['/apps/go-to-government/all']);
        }
        if (this.adminPage && this.main.in_array(params.page, ['all', 'my'])) {
          this.router.navigate(['/apps/go-to-government/pending']);
        }
        this.page = params.page;
        this.getLookup(params.page);
      } else {
        this.router.navigate(['/apps/go-to-government/all']);
      }
    });
    this.accessToken = this.main.accessToken;
  }

  ngOnInit() {
    // this.loading = true;
    let d = new Date();
    this.startDate = { date: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() } };
    this.endDate = { date: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() } };
    let myDateOptions = {
      dateFormat: 'dd mmm yyyy',
      satHighlight: true,
      openSelectorOnInputClick: true,
      showClearDateBtn: false
    }
    this.myDateOptions1 = myDateOptions;
    this.myDateOptions2 = myDateOptions;
    // this.onAdd();
    this.main.jwtDecode.then((data) => {
      this.decoded = data;
      this.gov.agency = `${data.workgroup_sub_name || ''} ${data.workgroup_name || ''} ${data.hospname}`;
      this.gov.cid = data.cid;
      this.gov.full_name = `${data.prename}${data.fname} ${data.lname}`;
      this.gov.position = `${data.position_name} ${data.level_name}`;
    });
  }

  logout() {
    sessionStorage.removeItem(this.adminTokenName);
    this.adminSystemType = [];
    this.adminPage = null;
    this.router.navigate(['/apps/go-to-government/all']);
    this.ngOnInit();
  }

  staff() {
    Swal.fire({
      title: 'กรุณาใส่ PINCODE สำหรับเจ้าหน้าที่',
      input: 'password',
      showCancelButton: true,
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',
      showLoaderOnConfirm: false,
      reverseButtons: true,
      allowOutsideClick: false
    }).then((result) => {
      if (!result.dismiss) {
        this.loading = true;
        this.main.post(`admin/pincode/${this.crypto.md5(result.value)}`, {}).then((res: any) => {
          this.loading = false;
          if (res.ok) {
            let admin = this.main.jwtDecodeAdmin(res.token);
            this.adminSystemType = (admin) ? admin.systemTypeAll : [];
            this.adminPage = (admin && this.main.in_array(this.systemType, this.adminSystemType)) ? true : false;
            if (this.main.in_array(this.systemType, this.adminSystemType)) {
              sessionStorage.setItem(this.adminTokenName, res.token);
              this.router.navigate(['/apps/go-to-government/pending']);
              this.loading = false;
              // this.ngOnInit();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'เสียใจด้วย !',
                text: res.message,
                allowOutsideClick: false
              });
            }
          } else {
            Swal.fire({
              icon: 'error',
              title: 'เสียใจด้วย !',
              text: res.message,
              allowOutsideClick: false
            });
          }
        });
      }
    });
  }

  onChangStartDate(e: any) {
    this.endDate = this.startDate = e;
  }

  onChangEndDate(e: any) {
    this.endDate = e;
    let sDate: any = new Date(this.startDate.date.year + '/' + this.startDate.date.month + '/' + this.startDate.date.day);
    let eDate: any = new Date(e.date.year + '/' + e.date.month + '/' + e.date.day);
    this.startDate = (sDate > eDate) ? e : this.startDate;
  }

  onCheckExpenses(e: any) {
    if (e.target.checked) {
      this.expensesArr.push(e.target.value);
    } else {
      this.expensesArr = this.expensesArr.filter(v => v != e.target.value);
    }
  }

  getList(bYear: number, page: string) {
    this.main.get(`government/list/${page}/bYear/${bYear}`).then((res: any) => {
      this.loading = false;
      this.listGov = (res.ok) ? res.data : [];
    });
  }

  getLookup(page: string) {
    // this.loading = true;
    this.main.get(`government/form/lookup`).then((res: any) => {
      this.gov.topic = (res.ok) ? res.topic : '';
      this.gov.book_no = (res.ok) ? res.bookNo[0].book_number : '';
      this.gov.honor = (res.ok) ? res.honor[0].name : '';
      this.users = (res.ok) ? res.users : [];
      this.govType = (res.ok) ? res.type : [];
      this.govVehicle = (res.ok) ? res.vehicle : [];
      this.govExpenses = (res.ok) ? res.expenses : [];
      this.bYearArr = (res.ok) ? res.bYear : [];
      this.bYear = (res.ok) ? this.bYearArr[0].b_year : new Date().getFullYear();
      this.getList(this.bYear, page);
    });
  }

  onAdd() {
    $('#modal-send-goverment').modal({ backdrop: 'static', keyboard: false });
  }

  onSubmit() {
    if (this.gov.gov_for && this.gov.location && (this.gov.vehicle_id != '99' || (this.gov.vehicle_id == '99' && this.gov.car_detail))) {
      let s = this.startDate;
      let e = this.endDate;
      this.gov.start_date = s.date.year + '-' + ('00' + s.date.month).substr(-2) + '-' + ('00' + s.date.day).substr(-2) + ' 00:00:00';
      this.gov.end_date = e.date.year + '-' + ('00' + e.date.month).substr(-2) + '-' + ('00' + e.date.day).substr(-2) + ' 23:59:59';
      this.gov.book_no = `${this.gov.book_no}${this.bookNo || ''}`;
      this.gov.book_date = this.toDay;
      this.gov.type_name = this.govType.filter(id => id.type_id == this.gov.type_id)[0].type_name;
      this.gov.vehicle_name = this.govVehicle.filter(id => id.vehicle_id == this.gov.vehicle_id)[0].vehicle_name;
      let data = { gov: this.gov, along: this.userAlong, expenses: this.expensesArr };
      this.main.post('government', data).then((res: any) => {
        Swal.fire({
          title: (res.ok) ? 'ยินดีด้วย!' : 'เกิดข้อผิดพลาด!',
          text: res.message,
          icon: (res.ok) ? 'success' : 'error',
          allowOutsideClick: false
        }).then((result) => {
          if (result.value) {
            this.getLookup(this.page);
            (res.ok) ? $('#modal-send-goverment').modal('hide') : null;
          }
        });
      });
    } else {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด!',
        text: 'คุณยังกรอกข้อมูลไม่ครบตามที่ระบบกำหนด กรุณาตรวจสอบ.',
        icon: 'warning',
        allowOutsideClick: false
      });
    }
  }

  onDel(g: any) {
    Swal.fire({
      title: 'คุณต้องการยกเลิกบันทึกขออนุมัติไปราชการ',
      text: `${g.gov_for} ใช่ หรือ ไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'ใช่',
      cancelButtonText: 'ไม่ใช่',
      allowOutsideClick: false
    }).then((result) => {
      if (result.value) {
        let url = `government/gov/${g.id}`;
        if (this.main.in_array(this.systemType, this.adminSystemType))
          url += `?cid=${this.crypto.md5(g.cid)}&token=${sessionStorage.getItem(this.adminTokenName)}`;
        this.main.delete(url, {}).then((res: any) => {
          Swal.fire({
            title: (res.ok) ? 'ยินดีด้วย!' : 'เกิดข้อผิดพลาด!',
            text: res.message,
            icon: (res.ok) ? 'success' : 'error',
            showConfirmButton: !res.ok,
            timer: (res.ok) ? 1500 : 0
          });
          if (res.ok) {
            this.getList(this.bYear, this.page);
          }
        });
      }
    });
  }

  staffApprovd(g) {
    let url = `government/approvd/id/${g.id}?token=${sessionStorage.getItem(this.adminTokenName)}`;
    Swal.fire({
      title: `คุณต้องการอนุมัติการไปราชการ \nของ${g.full_name}`,
      text: `จาก ${this.main.thaiDate(g.start_date, 'short')} ถึง ${this.main.thaiDate(g.end_date, 'short')} ใช่ หรือ ไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'ใช่',
      cancelButtonText: 'ไม่ใช่',
      allowOutsideClick: false
    }).then((result) => {
      if (result.value) {
        this.loading = true;
        this.main.put(url, {}).then((res: any) => {
          Swal.fire({
            title: (res.ok) ? 'ยินดีด้วย!' : 'เกิดข้อผิดพลาด!',
            text: res.message,
            icon: (res.ok) ? 'success' : 'warning',
            showConfirmButton: !res.ok,
            timer: (res.ok) ? 1500 : 0
          });
          this.getList(this.bYear, this.page);
        });
      }
    });
  }

  staffComment(id) {
    Swal.fire({
      title: 'กรุณาระบุเหตุผลที่ไม่อนุมัติด้วย',
      input: 'textarea',
      inputPlaceholder: 'กรุณาระบุเหตุผล...',
      inputAttributes: {
        'aria-label': 'กรุณาระบุเหตุผล'
      },
      showCancelButton: true,
      allowOutsideClick: false
    }).then((result) => {
      if (!result.dismiss) {
        if (result.value) {
          this.loading = true;
          let url = `government/comment/id/${id}?token=${sessionStorage.getItem(this.adminTokenName)}`;
          this.main.put(url, { comment: result.value }).then((res: any) => {
            (!res.ok) ? Swal.fire({
              title: res.message,
              icon: 'error',
              showConfirmButton: !res.ok,
              timer: (res.ok) ? 1500 : 0
            }) : null;
            this.getList(this.bYear, this.page);
          });
        } else {
          Swal.fire({
            title: 'คุณไม่ได้ระบุเหตุผล กรุณาระบุเหตุผลด้วย!',
            icon: 'error',
            allowOutsideClick: false
          });
        }
      }
    });
  }

  public govId;
  onClickUpload(g: any) {
    // this.eleave = eleave;
    this.govId = g.id;
    this.hasMyfile = false;
    this.myfile = null;
    this.imgUrl = null;
    this.typeFileUpload = 'image/*';
    $('input:file').val('');
    $('#modal-upload-doc').modal({ backdrop: 'static', keyboard: false });
  }

  public typeFileUpload: string = 'image/*';
  public fileType: any;
  public uploadMultiple: boolean = true;
  public txtMyfileError: string;
  onChangeTypeFile(fileType: string) {
    this.imgUrl = [];
    this.myfile = [];
    this.hasMyfile = false;
    let formUpload: any = document.getElementById('formUpload');
    formUpload.reset();
    this.typeFileUpload = fileType;
    this.uploadMultiple = (fileType == '.pdf') ? false : true;
  }

  fileProgress(files: any) {
    this.imgUrl = [];
    this.myfile = [];
    this.hasMyfile = true;
    if (files.length > 0) {
      const fileType = files[0].type;
      if (fileType.match(/image\/*/) != null || fileType.match(/pdf\/*/) != null) {
        this.fileType = (fileType.match(/image\/*/) != null) ? 'images' : 'pdf';
        for (let i = 0; i < files.length; i++) {
          this.hasMyfile = false;
          this.myfile.push(files[i]);
          const reader = new FileReader();
          reader.readAsDataURL(files[i]);
          reader.onload = (_event) => {
            this.imgUrl.push(reader.result);
          }
        }
      } else {
        return;
      }
    }
  }

  onUpload() {
    if (this.myfile && this.myfile.length > 0) {
      const formData: FormData = new FormData();
      for (let i = 0; i < this.myfile.length; i++) {
        formData.append('images', this.myfile[i]);
      }
      this.uploading = true;
      this.main.put(`government/update/images/gov/${this.govId}`, formData).then((res: any) => {
        Swal.fire({
          title: (res.ok) ? 'ยินดีด้วย!' : 'เกิดข้อผิดพลาด!',
          text: res.message,
          icon: (res.ok) ? 'success' : 'error',
          allowOutsideClick: false
        }).then((result) => {
          this.uploading = !result.value;
          if (res.ok) {
            $('#modal-upload-doc').modal('hide');
            this.getList(this.bYear, this.page);
          }
        });
      });
    } else {
      this.hasMyfile = true;
    }
  }

  checkFileType(url: string): boolean {
    let arr = url.split('.');
    if (arr[arr.length - 1].toUpperCase() == 'PDF') {
      return false;
    } else {
      return true;
    }
  }

  imageOnline: boolean = false;
  showImage(id: string) {
    this.imageOnline = true;
    this.main.get(`government/images/gov/${id}`).then((res: any) => {
      this.imgUrl = (res.ok) ? res.images : [];
      this.getPdfData((res.ok) ? res.images[0] : '');
      $('#image-modal').modal();
    });
  }

  pdfData: any;
  getPdfData(pdfUrl: string) {
    this.main.getArrayBuffer(pdfUrl, 'url').then((res: any) => {
      const blob = new Blob([res], { type: 'application/pdf' });
      this.pdfData = URL.createObjectURL(blob);
    });
  }

  public user: any[] = [];
  public along: any[] = [];
  showPersonal(g: any) {
    this.user = [{ full_name: g.full_name, position: g.position }];
    this.along = (g.all_person) ? g.all_person.split(',') : [];
    $('#personal-modal').modal();
  }

}

export class Goverment {
  agency: string;
  book_no: string;
  book_date: Date;
  topic: string;
  honor: string;
  cid: string;
  full_name: string;
  position: string;
  type_id: string = '1';
  type_name: string;
  gov_for: string;
  start_date: string;
  end_date: string;
  location: string;
  vehicle_id: string = '1';
  vehicle_name: string;
  car_detail: string;
  detail: string;
}