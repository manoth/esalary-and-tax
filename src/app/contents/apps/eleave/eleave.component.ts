import { Component, Inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CryptoService, MainService } from 'src/app/services';
import { IMyDpOptions } from 'mydatepicker-thai';

import Swal from 'sweetalert2';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
pdfMake.fonts = {
  THSarabunNew: {
    normal: 'THSarabunNew.ttf',
    bold: 'THSarabunNew-Bold.ttf',
    italics: 'THSarabunNew-Italic.ttf',
    bolditalics: 'THSarabunNew-BoldItalic.ttf'
  },
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
}
declare const $: any;

@Component({
  selector: 'app-eleave',
  templateUrl: './eleave.component.html',
  styleUrls: ['./eleave.component.scss']
})
export class EleaveComponent implements OnInit {

  public adminPage: boolean = false;
  public systemType: string = '02';
  public adminSystemType: Array<string>;
  public eleaveStatus: number = 1;
  public searchName: string = '';
  public accessToken: string = '';

  public loading: boolean = true;
  public uploading: boolean = false;
  public hasMyfile: boolean = false;
  public txtMyfileError: string;
  public myfile: any[] = [];
  public imgUrl: Array<any> = [];

  public getPdf: boolean = false;
  public detail: boolean = false;
  public pdfFile: any;

  public decode: any;
  public toDay = new Date();
  public rowsLeave: any
  public personalType: string
  public errEleave = new ErrEleave();

  public statisticsAllInYear: any;
  public statisticsAll: any;
  public statistics: any;
  public eleave = new Eleave();
  public eleaveType: any;
  public eleaveBYear: any;
  public startDate: any;
  public endDate: any;
  public myDateOptions1: IMyDpOptions;
  public myDateOptions2: IMyDpOptions;

  public bYear: number;

  constructor(
    @Inject('ADMINTOKEN_NAME') private adminTokenName: string,
    public router: Router,
    public route: ActivatedRoute,
    public main: MainService,
    public crypto: CryptoService,
  ) {
    this.main.jwtDecode.then((decode: any) => {
      this.decode = decode;
    });
    this.accessToken = this.main.accessToken;
  }

  ngOnInit() {
    this.route.queryParams.subscribe((queryParams) => {
      this.getPdf = (queryParams['pdf'] && this.detail) ? true : false;
    });
    const d = this.toDay;
    this.eleave.dated = d.getFullYear() + '-' + ('00' + (d.getMonth() + 1)).substr(-2) + '-' + ('00' + d.getDate()).substr(-2);
    this.startDate = { date: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() } }
    this.endDate = { date: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() } }
    this.getEleaveType();
    this.getEleaveBYear();
    let myDateOptions = {
      dateFormat: 'dd mmm yyyy',
      satHighlight: true,
      openSelectorOnInputClick: true,
      showClearDateBtn: false,
      disableWeekends: true,
      disableUntil: {
        year: (d.getMonth() > 1) ? d.getFullYear() : d.getFullYear() - 1,
        month: (d.getMonth() > 1) ? d.getMonth() - 1 : d.getMonth() + 11,
        day: d.getDate()
      },
      disableSince: {
        year: (d.getMonth() > 9) ? d.getFullYear() + 1 : d.getFullYear(),
        month: (d.getMonth() > 9) ? d.getMonth() - 9 : d.getMonth() + 3,
        day: d.getDate()
      }
    }
    this.main.jwtDecode.then((data) => {
      this.eleave.write_at = data.hospname;
      this.eleave.cid = data.cid;
      this.personalType = data.type;
    });
    this.myDateOptions1 = myDateOptions;
    this.myDateOptions2 = myDateOptions;
  }

  getStatisticsAll(bYear: number) {
    let start_date = bYear + '-09-30';
    this.main.get(`personal-time/eleave/statistics/from/${start_date}/type/0`).then((res: any) => {
      this.statisticsAllInYear = (res.ok) ? res.data : [];
    });
  }

  getStatistics(typeLeave: any, s: any) {
    let start_date = s.date.year + '-' + ('00' + s.date.month).substr(-2) + '-' + ('00' + s.date.day).substr(-2);
    this.main.get(`personal-time/eleave/statistics/from/${start_date}/type/${typeLeave}`).then((res: any) => {
      this.statisticsAll = (res.ok) ? res.data : [];
      this.eleave.past1 = (res.ok) ? res.data[0].leave_info : 0;
      this.eleave.past2 = (res.ok && res.data.length > 1) ? res.data[1].leave_info : 0;
      this.eleave.balance_last_year = (res.ok && typeLeave == 1) ? res.data[0].balance_last_year : 0;
      this.statistics = this.statisticsAll.filter(d => d.type_id == this.eleave.type_id)[0];
      this.leaveOver();
    });
  }

  getEleave(bYear: number) {
    this.loading = true;
    let admin = this.main.jwtDecodeAdmin();
    this.adminSystemType = (admin) ? admin.systemTypeAll : [];
    this.adminPage = (admin && this.main.in_array(this.systemType, this.adminSystemType)) ? true : false;
    let urlPending = (this.main.in_array(this.systemType, this.adminSystemType)) ? `/status/${this.eleaveStatus}/pending` : '';
    this.main.get(`personal-time/eleave/bYear/${bYear}${urlPending}`).then((res: any) => {
      this.rowsLeave = (res.ok) ? res.data : [];
      this.loading = false;
    });
    this.main.get(`personal-time/eleave/lastLeave`).then((res: any) => {
      this.eleave.address = (res.ok) ? res.data[0].address : null;
      this.eleave.tel = (res.ok) ? res.data[0].tel : null;
    });
    this.getStatisticsAll(bYear);
  }

  getEleaveType() {
    this.main.get('personal-time/eleave/type').then((res: any) => {
      this.eleaveType = (res.ok) ? res.data : [];
    });
  }

  getEleaveBYear() {
    this.main.get('personal-time/eleave/bYear').then((res: any) => {
      this.bYear = (res.ok) ? res.data[0].b_year : this.toDay.getFullYear();
      this.eleaveBYear = (res.ok) ? res.data : [];
      this.getEleave(this.bYear);
    });
  }

  onCreateEleave() {
    this.eleave = new Eleave();
    this.main.get('personal-time/eleave/check-date-startworking').then((res: any) => {
      if (res.ok) {
        this.ngOnInit();
        $('#modal-add-eleave').modal({ backdrop: 'static', keyboard: false });
        this.processDate(this.startDate, this.endDate);
      } else {
        Swal.fire({
          title: 'เกิดข้อผิดพลาด!',
          text: res.message,
          icon: 'warning',
          allowOutsideClick: false
        }).then(() => {
          this.router.navigate(['/settings/profile']);
        });
      }
    });
  }

  // blockEndDate(sDate: any) {
  //   if (this.main.in_array(this.eleave.type_id, ['2', '3']) && this.personalType == '01') {
  //     if (sDate.date.month > 3 && sDate.date.month < 10) {
  //       this.myDateOptions2.disableSince = { year: sDate.date.year, month: 10, day: 1 };
  //     } else {
  //       this.myDateOptions2.disableSince = {
  //         year: (sDate.date.month >= 10) ? sDate.date.year + 1 : sDate.date.year, month: 4, day: 1
  //       };
  //     }
  //   }
  //   if (this.eleave.type_id == 1 && sDate.date.month < 10) {
  //     this.myDateOptions2.disableSince = { year: sDate.date.year, month: 10, day: 1 };
  //   }
  // }

  onChangStartDate(e: any) {
    this.endDate = this.startDate = e;
    this.processDate(this.startDate, this.endDate);
  }

  onChangEndDate(e: any) {
    this.endDate = e;
    let sDate: any = new Date(this.startDate.date.year + '/' + this.startDate.date.month + '/' + this.startDate.date.day);
    let eDate: any = new Date(e.date.year + '/' + e.date.month + '/' + e.date.day);
    this.startDate = (sDate > eDate) ? e : this.startDate;
    this.processDate(this.startDate, this.endDate);
  }

  onChangTime() {
    this.processDate(this.startDate, this.endDate);
  }

  processDate(s: any, e: any) {
    this.eleave.start_date = s.date.year + '-' + ('00' + s.date.month).substr(-2) + '-' + ('00' + s.date.day).substr(-2);
    this.eleave.end_date = e.date.year + '-' + ('00' + e.date.month).substr(-2) + '-' + ('00' + e.date.day).substr(-2);
    let sDate: any = new Date(`${this.eleave.start_date} ${this.eleave.start_time}`);
    let eDate: any = new Date(`${this.eleave.end_date} ${this.eleave.end_time}`);
    let amount = Math.abs((eDate - sDate) / 86400000);
    let holiday = 0;
    this.main.get(`personal-time/eleave/holidays/from/${this.eleave.start_date.split('-').join('')}/to/${this.eleave.end_date.split('-').join('')}`).then((res: any) => {
      for (let i = 0; i < amount; i++) {
        let n = (i > 0) ? 1 : 0;
        sDate.setDate(sDate.getDate() + n);
        if (sDate.getDay() === 0 || sDate.getDay() === 6) holiday++;
      }
      this.eleave.amount_days = Number((amount - holiday - res.data.length).toFixed(1));
      this.getStatistics(this.eleave.type_id, this.startDate);
    });
  }

  onSave() {
    if (this.leaveOver() && this.dateError() && this.checkErr()) {
      this.loading = true;
      this.eleave.start_date = this.eleave.start_date + ' ' + this.eleave.start_time;
      this.eleave.end_date = this.eleave.end_date + ' ' + this.eleave.end_time;
      this.main.get(`personal-time/eleave/check-date-time/from/${this.eleave.start_date}/to/${this.eleave.end_date}`).then((err: any) => {
        if (err.ok) {
          this.eleave.reason = (this.eleave.reason) ? this.eleave.reason : '-';
          this.main.post(`personal-time/eleave`, this.eleave).then((res: any) => {
            Swal.fire({
              text: res.message,
              icon: (res.ok) ? 'success' : 'error',
              allowOutsideClick: false
            }).then(() => {
              (res.ok) ? $('#modal-add-eleave').modal('hide') : null;
              this.getEleave(this.bYear);
            });
          });
        } else {
          this.loading = false;
          Swal.fire({
            title: 'เกิดข้อผิดพลาด!',
            text: err.message,
            icon: 'warning',
            allowOutsideClick: false
          });
        }
      });
    }
  }

  onDel(sDate, eDate, typeId, typeName, amountDays, leaveId, l?) {
    let d = new Date(sDate);
    let startDate = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    let title = (this.main.in_array(this.systemType, this.adminSystemType)) ?
      `คุณต้องการยกเลิกข้อมูล ${typeName} \nของ${l.pname}${l.fname} ${l.lname}` : `คุณต้องการลบข้อมูล\n ${typeName}`;
    let url = `personal-time/eleave/sDate/${startDate}/typeId/${typeId}/amountDays/${amountDays}/leaveId/${leaveId}`;
    if (this.main.in_array(this.systemType, this.adminSystemType))
      url += `?cid=${this.crypto.md5(l.cid)}&token=${sessionStorage.getItem(this.adminTokenName)}`;
    Swal.fire({
      title: title,
      text: `จาก ${this.main.thaiDate(sDate, 'short')} ถึง ${this.main.thaiDate(eDate, 'short')} ใช่ หรือ ไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'ใช่',
      cancelButtonText: 'ไม่ใช่',
      allowOutsideClick: false
    }).then((result) => {
      if (result.value) {
        this.loading = true;
        this.main.delete(url, {}).then((res: any) => {
          Swal.fire({
            title: (res.ok) ? 'ยินดีด้วย!' : 'เกิดข้อผิดพลาด!',
            text: res.message,
            icon: (res.ok) ? 'success' : 'warning',
            showConfirmButton: !res.ok,
            timer: (res.ok) ? 1500 : 0
          });
          this.getEleave(this.bYear);
        });
      }
    });
  }

  onDetail(leave: any) {
    this.getPdf = true;
    this.detail = true;
    this.router.navigate(['/apps/eleave'], { queryParams: { pdf: 'on' } });
    this.generatePdf(leave);
    pdfMake.createPdf(this.generatePdf(leave)).getBlob((dataUrl: any) => {
      let file = new Blob([dataUrl], { type: 'application/pdf' });
      this.pdfFile = URL.createObjectURL(file);
      this.getPdf = true;
      this.router.navigate(['/apps/eleave'], { queryParams: { pdf: 'on' } });
    });
  }

  leaveOver() {
    if (this.statistics.leave_max - (this.eleave.amount_days + this.statistics.leave_info_check) >= 0) {
      return true;
    } else {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด!',
        text: 'ไม่สามารถบันทึกข้อมูลได้ เนื่องการคุณมีวันลาคงเหลือไม่เพียงพอ กรุณาตรวจสอบข้อมูลหรือติดต่อเจ้าหน้าที่.',
        icon: 'warning',
        allowOutsideClick: false
      });
      return false;
    }
  }

  onErr(key: 'reason' | 'address' | 'tel') {
    return this.errEleave[key] = (this.eleave[key]) ? false : true;
  }

  checkErr() {
    return !this.main.in_array(true, [this.onErr('address'), this.onErr('reason'), this.onErr('tel')]);
  }

  dateError() {
    if ((this.startDate.date.month < 10 && this.endDate.date.month >= 10
      && this.startDate.date.year == this.endDate.date.year) ||
      this.main.in_array(this.personalType, ['01', '02'])
      && this.main.in_array(this.eleave.type_id, ['2', '3'])
      && this.startDate.date.month < 4 && this.endDate.date.month >= 4
      && this.startDate.date.year == this.endDate.date.year) {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด!',
        text: 'เนื่องจากผิดเงื่อนไขการใช้งาน กรุณาตรวจสอบข้อมูลใหม่อีกรอบ',
        icon: 'warning',
        allowOutsideClick: false
      });
      return false;
    } else {
      return true;
    }
  }

  sumDate(statistics: any) {
    let leave_info = 0;
    for (let s of statistics) { leave_info += s.leave_info }
    return leave_info + this.eleave.amount_days;
  }

  sumDateHalf(statistics: any) {
    let leave_info = 0;
    for (let s of statistics) { leave_info += s.leave_info_check }
    return leave_info + this.eleave.amount_days;
  }

  public eleaveId;
  onClickUpload(eleave: any) {
    this.eleave = eleave;
    this.eleaveId = eleave.id;
    this.hasMyfile = false;
    this.myfile = null;
    this.imgUrl = null;
    this.typeFileUpload = 'image/*';
    $('input:file').val('');
    $('#modal-upload-doc').modal({ backdrop: 'static', keyboard: false });
  }

  onUpload() {
    if (this.myfile && this.myfile.length > 0) {
      const formData: FormData = new FormData();
      for (let i = 0; i < this.myfile.length; i++) {
        formData.append('images', this.myfile[i]);
      }
      this.uploading = true;
      this.main.put(`personal-time/eleave/update/images/id/${this.eleaveId}`, formData).then((res: any) => {
        this.uploading = false;
        Swal.fire({
          title: (res.ok) ? 'ยินดีด้วย!' : 'เกิดข้อผิดพลาด!',
          text: res.message,
          icon: (res.ok) ? 'success' : 'error',
          allowOutsideClick: false
        }).then((result) => {
          if (res.ok) {
            $('#modal-upload-doc').modal('hide');
            this.ngOnInit();
          }
        });
      });
    } else {
      this.hasMyfile = true;
    }
  }

  public typeFileUpload: string = 'image/*';
  public fileType: any;
  public uploadMultiple: boolean = true;
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
    this.main.get(`personal-time/eleave/images/id/${id}`).then((res: any) => {
      this.imgUrl = (res.ok) ? res.images : [];
      this.getPdfData((res.ok) ? res.images[0] : '');
      $('#imageModal').modal();
    });
  }

  pdfData: any;
  getPdfData(pdfUrl: string) {
    this.main.getArrayBuffer(pdfUrl, 'url').then((res: any) => {
      const blob = new Blob([res], { type: 'application/pdf' });
      this.pdfData = URL.createObjectURL(blob);
    });
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
              this.ngOnInit();
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


  staffApprovd(l) {
    let url = `personal-time/eleave/approvd/id/${l.id}?token=${sessionStorage.getItem(this.adminTokenName)}`;
    Swal.fire({
      title: `คุณต้องการอนุมัติการ${l.type_name} \nของ${l.pname}${l.fname} ${l.lname}`,
      text: `จาก ${this.main.thaiDate(l.start_date, 'short')} ถึง ${this.main.thaiDate(l.end_date, 'short')} ใช่ หรือ ไม่?`,
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
          this.getEleave(this.bYear);
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
          let url = `personal-time/eleave/update/comment/id/${id}?token=${sessionStorage.getItem(this.adminTokenName)}`;
          this.main.put(url, { comment: result.value }).then((res: any) => {
            (!res.ok) ? Swal.fire({
              title: res.message,
              icon: 'error',
              showConfirmButton: !res.ok,
              timer: (res.ok) ? 1500 : 0
            }) : null;
            this.ngOnInit();
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

  logout() {
    sessionStorage.removeItem(this.adminTokenName);
    this.adminSystemType = [];
    this.eleaveStatus = 1;
    this.ngOnInit();
  }

  // Create PDF Files
  onPrint() {
    pdfMake.createPdf(this.generatePdf(this.data)).print();
  }

  onDownload() {
    pdfMake.createPdf(this.generatePdf(this.data)).download(this.pdfName);
  }

  onBack() {
    this.getPdf = false;
    this.router.navigate(['/apps/eleave']);
  }

  public data: any;
  public pdfName: string;
  generatePdf(data) {
    this.data = data;
    this.pdfName = `ใบ${data.type_name}-${this.main.thaiDate(data.dated, 'short')}.pdf`;
    let borderTable = {
      hLineWidth: (i, node) => {
        return 0.3;
      },
      vLineWidth: (i, node) => {
        return 0.3;
      }
    }
    return {
      pageSize: 'A4',
      pageMargins: [70, 60, 60, 10],
      pageOrientation: 'portrait',
      content: [{
        text: (this.main.in_array(data.type_id, [2, 3])) ? `ใบลาป่วย / ลากิจส่วนตัว` : `ใบ${data.type_name}`,
        fontSize: 18,
        alignment: 'center',
        decoration: 'underline',
        margin: [0, 0, 0, 10]
      }, {
        text: `เขียนที่ ${data.write_at}`,
        alignment: 'right', margin: [0, 0, 10, 5]
      }, {
        text: `วันที่ ${this.main.thaiDate(data.dated, 'medium')}`,
        margin: [230, 0, 10, 5]
      },
      { text: `เรื่อง ขอ${data.type_name}`, margin: [0, 0, 0, 5] },
      { text: 'เรียน นายแพทย์สาธารณสุขจังหวัดชัยภูมิ', margin: [0, 0, 0, 5] },
      // content 1
      (data.type_id == 1) ? {
        text: [
          { text: '.', color: 'white' },
          `\t\t\t\t ข้าพเจ้า ${data.pname}${data.fname} ${data.lname} ตำแหน่ง ${data.position} `,
          `ระดับ ${data.level || '-'} สังกัด ${data.workgroup_sub || ''} ${data.workgroup || ''} ${data.hospname} `,
          `มีวันลาพักผ่อนสะสม ${data.balance_last_year} วันทำการ มีสิทธิลาพักผ่อนประจำปีนี้อีก 10 วันทำการ รวมเป็น `,
          `${data.balance_last_year + 10} วันทำการ ขอลาพักผ่อนตั้งแต่วันที่ ${this.main.thaiDate(data.start_date, 'medium')} `,
          `ถึงวันที่ ${this.main.thaiDate(data.end_date, 'medium')} มีกำหนดวัน ${data.amount_days} `,
          `วันทำการ ในระหว่างลาจะติดต่อข้าพเจ้าได้ที่ ${data.address.replace(/\n/g, ' ')} หมายเลขโทรศัพท์ ${data.tel}`,
        ],
        alignment: 'justify',
        margin: [0, 0, 0, 20]
      } : [
        { canvas: [{ type: 'rect', x: 0, y: 0, w: 10, h: 10, lineWidth: 0.3 }], absolutePosition: { x: 120, y: 242 } },
        { canvas: [{ type: 'rect', x: 0, y: 0, w: 10, h: 10, lineWidth: 0.3 }], absolutePosition: { x: 120, y: 263 } },
        { text: '√', fontSize: 22, absolutePosition: (data.type_id == 3) ? { x: 121, y: 232 } : { x: 121, y: 253 } },
        { columns: [{ width: 300, text: `${data.reason}` }], absolutePosition: { x: 245, y: 239 } },
        {
          // content 2,3
          text: [
            { text: '.', color: 'white' },
            `\t\t\t\t ข้าพเจ้า ${data.pname}${data.fname} ${data.lname} ตำแหน่ง ${data.position} `,
            `ระดับ ${data.level || '-'} สังกัด ${data.workgroup_sub || ''} ${data.workgroup || ''} ${data.hospname} \n`,
            `ขอลา\t\t\tป่วย \t\t\t เนื่องจาก \n`,
            { text: '.', color: 'white' },
            `\t\t\t\t  กิจส่วนตัว \n`,
            `ตั้งแต่วันที่ ${this.main.thaiDate(data.start_date, 'medium')} `,
            `ถึงวันที่ ${this.main.thaiDate(data.end_date, 'medium')} มีกำหนดวัน ${data.amount_days} วันทำการ `,
            `ข้าพเจ้าได้${data.type_name} ครั้งสุดท้ายตั้งแต่วันที่ ${(data.last_start_date) ? this.main.thaiDate(data.last_start_date, 'medium') : '-'}`,
            `ถึงวันที่ ${(data.last_end_date) ? this.main.thaiDate(data.last_end_date, 'medium') : '-'} มีกำหนดวัน ${(data.last_amount_days) ? data.last_amount_days : 0} วันทำการ `,
            `ในระหว่างลาจะติดต่อข้าพเจ้าได้ที่ ${data.address.replace(/\n/g, ' ')} หมายเลขโทรศัพท์ ${data.tel}`,
          ],
          alignment: 'justify',
          margin: [0, 0, 0, 20]
        }],
      {
        text: 'ลงชื่อ ........................................................',
        margin: [230, 0, 0, 0]
      }, {
        text: `( ${data.pname}${data.fname} ${data.lname} )`,
        margin: [265, 0, 0, 0]
      }, {
        absolutePosition: { x: 70, y: 454 },
        margin: [0, 30, 0, 0],
        columns: [
          [{
            text: 'สถิติการลาในปีงบประมาณนี้', decoration: 'underline', margin: [0, 0, 0, 5]
          }, (data.type_id == 1) ? {
            table: {
              headerRows: 1,
              widths: [50, 50, 50],
              body: [[
                { text: 'ลามาแล้ว \n (วันทำการ)', alignment: 'center' },
                { text: 'ลาครั้งนี้ \n (วันทำการ)', alignment: 'center' },
                { text: 'รวมเป็น \n (วันทำการ)', alignment: 'center' },
              ], [
                { text: data.past1, alignment: 'center' },
                { text: data.amount_days, alignment: 'center' },
                { text: data.past1 + data.amount_days, alignment: 'center' },
              ]]
            }, layout: borderTable,
          } : {
            table: {
              headerRows: 1,
              widths: [50, 50, 50, 50],
              body: [[
                { text: 'ประเภทลา', alignment: 'center' },
                { text: 'ลามาแล้ว \n (วันทำการ)', alignment: 'center' },
                { text: 'ลาครั้งนี้ \n (วันทำการ)', alignment: 'center' },
                { text: 'รวมเป็น \n (วันทำการ)', alignment: 'center' },
              ], [
                { text: 'ป่วย', alignment: 'center' },
                { text: data.past2, alignment: 'center' },
                { text: (data.type_id == 3) ? data.amount_days : 0, alignment: 'center' },
                { text: data.past2 + ((data.type_id == 3) ? data.amount_days : 0), alignment: 'center' },
              ], [
                { text: 'กิจส่วนตัว', alignment: 'center' },
                { text: data.past1, alignment: 'center' },
                { text: (data.type_id == 2) ? data.amount_days : 0, alignment: 'center' },
                { text: data.past1 + ((data.type_id == 2) ? data.amount_days : 0), alignment: 'center' },
              ]]
            }, layout: borderTable,
          }, {
            margin: [0, 20, 0, 0],
            text: [
              { text: 'ลงชื่อ ................................................. ผู้ตรวจสอบ\n', },
              { text: '.', color: 'white' },
              { text: `\t( ${data.admin_fullname} )\n`, },
              { text: `ตำแหน่ง ${data.admin_position}  \n`, },
              { text: '.', color: 'white' },
              { text: `\tวันที่ ${this.main.thaiDate(data.dated, 'medium')} \n`, },
            ]
          }],
          [{
            text: [
              { text: '.\t\t\t', color: 'white' },
              { text: 'ความเห็นผู้บังคับบัญชา\n', decoration: 'underline', },
              { text: '.\t\t\t', color: 'white' },
              { text: '................................................................\n', },
              { text: '.\t\t\t', color: 'white' },
              { text: '................................................................\n', },
              { text: '.\t\t\t', color: 'white' },
              { text: 'ลงชื่อ ..................................................... \n', },
              { text: '.\t\t\t', color: 'white' },
              { text: '\t( .................................................... )\n', },
              { text: '.\t\t\t', color: 'white' },
              { text: 'ตำแหน่ง ................................................. \n', },
              { text: '.\t\t\t', color: 'white' },
              { text: '\tวันที่ ................................................. \n', },
              { text: '.\t\t\t', color: 'white' },
              { text: 'คำสั่ง\n', decoration: 'underline', },
              { text: '.\t\t\t', color: 'white' },
              { text: '\t\t อนุญาต \t\t\t ไม่อนุญาต \n', },
              { text: '.\t\t\t', color: 'white' },
              { text: '................................................................\n', },
              { text: '.\t\t\t', color: 'white' },
              { text: 'ลงชื่อ ..................................................... \n', },
              { text: '.\t\t\t', color: 'white' },
              { text: '\t( .................................................... )\n', },
              { text: '.\t\t\t', color: 'white' },
              { text: 'ตำแหน่ง ................................................. \n', },
              { text: '.\t\t\t', color: 'white' },
              { text: '\tวันที่ ................................................. \n\n', },
            ],
          }]
        ]
      },
      {
        image: data.admin_signature,
        width: 80,
        absolutePosition: (data.type_id == 1) ? { x: 116, y: 546 } : { x: 116, y: 572 },
      },
      { canvas: [{ type: 'rect', x: 0, y: 0, w: 10, h: 10, lineWidth: 0.3 }], absolutePosition: { x: 362, y: 625 } },
      { canvas: [{ type: 'rect', x: 0, y: 0, w: 10, h: 10, lineWidth: 0.3 }], absolutePosition: { x: 440, y: 625 } },
      ],
      defaultStyle: {
        font: 'THSarabunNew',
        fontSize: 16,
        columnGap: 0,
      }
    };
  }

}

export class Eleave {
  id: number;
  cid: string;
  write_at: string;
  dated: string;
  type_id: number = 1;
  start_date: string;
  end_date: string;
  start_time: string = '00:00:00';
  end_time: string = '23:59:59';
  reason: string;
  address: string;
  tel: string;
  balance_last_year: number = 0;
  amount_days: number = 0;
  past1: number = 0;
  past2: number = 0;
}

export class ErrEleave {
  reason: boolean = false;
  address: boolean = false;
  tel: boolean = false;
}
